<?php
// get_familias.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS, HEAD");
header("Access-Control-Allow-Headers: Content-Type, If-None-Match");
header('Content-Type: application/json; charset=utf-8');
// Importante: deixa o cache condicional funcionar
header('Cache-Control: no-cache');

require_once __DIR__ . '/../Conexao.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $pdo = Conexao::pdo();

    // Carrega os dados (simples e robusto). Se quiser otimizar, dá pra usar uma coluna updated_at.
    $stmt = $pdo->query("SELECT id_familia, nome FROM familias WHERE deleted_at IS NULL");
    $familias = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    // Gera um ETag estável com base no conteúdo
    // Dica: se tiver coluna updated_at, prefira hash de (MAX(updated_at) . ':' . COUNT(*))
    $payloadForHash = json_encode($familias, JSON_UNESCAPED_UNICODE);
    $etag = '"' . md5($payloadForHash) . '"'; // aspas fazem parte do formato do ETag

    header("ETag: $etag");

    // Se o cliente mandou If-None-Match com o mesmo ETag, responde 304 (sem corpo)
    $ifNoneMatch = $_SERVER['HTTP_IF_NONE_MATCH'] ?? null;
    if ($ifNoneMatch && trim($ifNoneMatch) === $etag) {
        http_response_code(304);
        exit;
    }

    // Caso contrário, devolve os dados normalmente
    echo $payloadForHash;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Erro ao buscar famílias",
        "detalhe" => $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
