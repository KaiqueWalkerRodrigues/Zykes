<?php
// delete_familia.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache');

require_once __DIR__ . '/../Conexao.php';

// Pré-flight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Garante que só aceite método DELETE (corrigido)
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode([
        "status"  => "error",
        "message" => "Método não permitido. Use DELETE."
    ]);
    exit;
}

try {
    $pdo = Conexao::pdo();

    $input = json_decode(file_get_contents("php://input"), true);

    if (!isset($input['id_familia'])) {
        http_response_code(400);
        echo json_encode([
            "status"  => "error",
            "message" => "Campo obrigatório: id_familia."
        ]);
        exit;
    }

    $id_familia = (int)$input['id_familia'];
    if ($id_familia <= 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ID inválido."]);
        exit;
    }

    // Existe e não deletada?
    $check = $pdo->prepare("SELECT id_familia FROM lente_familias WHERE id_familia = ? AND deleted_at IS NULL");
    $check->execute([$id_familia]);
    if ($check->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Família não encontrada ou já deletada."]);
        exit;
    }

    // Soft Delete
    $stmt = $pdo->prepare("UPDATE lente_familias SET deleted_at = NOW(), updated_at = NOW() WHERE id_familia = ?");
    $stmt->execute([$id_familia]);

    echo json_encode([
        "status"  => "success",
        "message" => "Família deletada (soft delete) com sucesso.",
        "data"    => ["id_familia" => $id_familia, "deleted_at" => date('Y-m-d H:i:s')]
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao deletar família.",
        "detalhe" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
