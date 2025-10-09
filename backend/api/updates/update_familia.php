<?php
// update_familia.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache');

require_once __DIR__ . '/../Conexao.php';

// Responde ao pré-flight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Garante que só aceite método PUT
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "status" => "error",
        "message" => "Método não permitido. Use PUT."
    ]);
    exit;
}

try {
    $pdo = Conexao::pdo();

    // Lê o corpo JSON da requisição
    $input = json_decode(file_get_contents("php://input"), true);

    if (!isset($input['id_familia']) || !isset($input['nome'])) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Campos obrigatórios: id_familia e nome."
        ]);
        exit;
    }

    $id_familia = (int) $input['id_familia'];
    $nome = trim($input['nome']);

    if ($id_familia <= 0 || $nome === '') {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "ID inválido ou nome vazio."
        ]);
        exit;
    }

    // Verifica se a família existe e não foi deletada
    $check = $pdo->prepare("SELECT id_familia FROM familias WHERE id_familia = ? AND deleted_at IS NULL");
    $check->execute([$id_familia]);

    if ($check->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            "status" => "error",
            "message" => "Família não encontrada."
        ]);
        exit;
    }

    // Atualiza a família
    $stmt = $pdo->prepare("
        UPDATE familias
        SET nome = ?, updated_at = NOW()
        WHERE id_familia = ?
    ");
    $stmt->execute([$nome, $id_familia]);

    // Retorna a linha atualizada (boa prática)
    $stmt = $pdo->prepare("SELECT id_familia, nome, created_at, updated_at, deleted_at FROM familias WHERE id_familia = ?");
    $stmt->execute([$id_familia]);
    $familiaAtualizada = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "message" => "Família atualizada com sucesso.",
        "data" => $familiaAtualizada
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Erro ao atualizar família.",
        "detalhe" => $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
