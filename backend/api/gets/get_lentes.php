<?php
// api/gets/get_lentes.php

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

// Valida se o id_familia foi passado na URL
if (!isset($_GET['id_familia']) || !is_numeric($_GET['id_familia'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O parâmetro 'id_familia' é obrigatório."]);
    exit;
}

$id_familia = (int)$_GET['id_familia'];

try {
    $pdo = Conexao::pdo();

    $stmt = $pdo->prepare("
        SELECT * FROM lentes
        WHERE id_familia = :id_familia AND deleted_at IS NULL
    ");
    $stmt->bindParam(':id_familia', $id_familia, PDO::PARAM_INT);
    $stmt->execute();
    $lentes = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    // Lógica de ETag para cache
    $payloadParaHash = json_encode($lentes);
    $etag = '"' . md5($payloadParaHash) . '"';
    header("ETag: $etag");

    if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH']) === $etag) {
        http_response_code(304);
        exit;
    }

    echo $payloadParaHash;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao buscar as lentes.",
        "detalhe" => $e->getMessage()
    ]);
}
