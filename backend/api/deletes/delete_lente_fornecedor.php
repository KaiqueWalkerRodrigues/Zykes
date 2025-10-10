<?php
// delete_fornecedor.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache');

require_once __DIR__ . '/../Conexao.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Apenas DELETE
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método não permitido. Use DELETE."]);
    exit;
}

try {
    $pdo = Conexao::pdo();

    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['id_fornecedor'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Campo obrigatório: id_fornecedor."]);
        exit;
    }

    $id_fornecedor = (int)$input['id_fornecedor'];
    if ($id_fornecedor <= 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ID inválido."]);
        exit;
    }

    // Existe e está ativo?
    $check = $pdo->prepare("SELECT id_fornecedor FROM lente_fornecedores WHERE id_fornecedor = ? AND deleted_at IS NULL");
    $check->execute([$id_fornecedor]);
    if (!$check->fetch()) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Fornecedor não encontrado ou já deletado."]);
        exit;
    }

    // Soft delete
    $del = $pdo->prepare("UPDATE lente_fornecedores SET deleted_at = NOW(), updated_at = NOW() WHERE id_fornecedor = ?");
    $del->execute([$id_fornecedor]);

    echo json_encode([
        "status" => "success",
        "message" => "Fornecedor deletado (soft delete) com sucesso.",
        "data" => ["id_fornecedor" => $id_fornecedor, "deleted_at" => date('Y-m-d H:i:s')]
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erro ao deletar fornecedor.", "detalhe" => $e->getMessage()], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
