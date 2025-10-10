<?php
// get_familias.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS, HEAD");
header("Access-Control-Allow-Headers: Content-Type, If-None-Match");
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache');

require_once __DIR__ . '/../Conexao.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $pdo = Conexao::pdo();

    $stmt = $pdo->query("
        SELECT id_familia, id_fornecedor, nome
        FROM lente_familias
        WHERE deleted_at IS NULL
        ORDER BY nome ASC
    ");
    $familias = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $payloadForHash = json_encode($familias, JSON_UNESCAPED_UNICODE);
    $etag = '"' . md5($payloadForHash) . '"';

    header("ETag: $etag");

    $ifNoneMatch = $_SERVER['HTTP_IF_NONE_MATCH'] ?? null;
    if ($ifNoneMatch && trim($ifNoneMatch) === $etag) {
        http_response_code(304);
        exit;
    }

    echo $payloadForHash;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Erro ao buscar famílias",
        "detalhe" => $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
