<?php
// get_fornecedor.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, If-None-Match");
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache');

require_once __DIR__ . '/../Conexao.php';

// Pré-flight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "status"  => "error",
        "message" => "Método não permitido. Use POST."
    ]);
    exit;
}

try {
    $pdo = Conexao::pdo();

    // Lê dados do corpo: JSON (application/json) ou form (multipart/x-www-form-urlencoded)
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') !== false) {
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
    } else {
        $input = $_POST;
    }

    if (!isset($input['id_fornecedor'])) {
        http_response_code(400);
        echo json_encode([
            "status"  => "error",
            "message" => "Campo obrigatório: id_fornecedor."
        ]);
        exit;
    }

    $id_fornecedor = (int)$input['id_fornecedor'];
    if ($id_fornecedor <= 0) {
        http_response_code(400);
        echo json_encode([
            "status"  => "error",
            "message" => "ID inválido."
        ]);
        exit;
    }

    // Busca o fornecedor ativo (não deletado)
    $stmt = $pdo->prepare("
        SELECT id_fornecedor, nome, cnpj, created_at, updated_at, deleted_at
        FROM lente_fornecedores
        WHERE id_fornecedor = ? AND deleted_at IS NULL
        LIMIT 1
    ");
    $stmt->execute([$id_fornecedor]);
    $fornecedor = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$fornecedor) {
        http_response_code(404);
        echo json_encode([
            "status"  => "error",
            "message" => "Fornecedor não encontrado."
        ]);
        exit;
    }

    // (Opcional) ETag baseado em updated_at + id, útil se algum cliente reutilizar
    $etagBase = ($fornecedor['updated_at'] ?? '') . ':' . $fornecedor['id_fornecedor'];
    $etag = '"' . md5($etagBase) . '"';
    header("ETag: $etag");

    $ifNoneMatch = $_SERVER['HTTP_IF_NONE_MATCH'] ?? null;
    if ($ifNoneMatch && trim($ifNoneMatch) === $etag) {
        http_response_code(304);
        exit;
    }

    echo json_encode([
        "status" => "success",
        "data"   => $fornecedor
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao buscar fornecedor.",
        "detalhe" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
