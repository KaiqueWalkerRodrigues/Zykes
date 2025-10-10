<?php
// get_lente_tratamentos.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS, HEAD");
header("Access-Control-Allow-Headers: Content-Type, If-None-Match");
header('Content-Type: application/json; charset=utf-8');
// Importante: permite que o cache condicional funcione
header('Cache-Control: no-cache');

require_once __DIR__ . '/../Conexao.php';

// Resposta para a requisição pré-vôo (pre-flight) do CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $pdo = Conexao::pdo();

    // Busca apenas os tratamentos não deletados
    $stmt = $pdo->query("
        SELECT id_tratamento_lente, nome, created_at, updated_at
        FROM lente_tratamentos
        WHERE deleted_at IS NULL
        ORDER BY nome ASC
    ");
    $tratamentos = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    // Gera um ETag estável baseado no conteúdo dos dados.
    $payloadParaHash = json_encode($tratamentos, JSON_UNESCAPED_UNICODE);
    $etag = '"' . md5($payloadParaHash) . '"'; // As aspas duplas são parte do padrão do ETag

    header("ETag: $etag");

    // Verifica se o cliente enviou um ETag e se ele corresponde ao ETag gerado.
    $ifNoneMatch = $_SERVER['HTTP_IF_NONE_MATCH'] ?? null;
    if ($ifNoneMatch && trim($ifNoneMatch) === $etag) {
        // Retorna 304 Not Modified, informando que não há alterações.
        http_response_code(304);
        exit;
    }

    // Se não houver cache ou se os dados mudaram, retorna a lista completa.
    echo $payloadParaHash;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao buscar os tratamentos de lente.",
        "detalhe" => $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
