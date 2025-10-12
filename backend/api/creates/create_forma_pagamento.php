<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../Conexao.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método não permitido."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->nome) || empty(trim($data->nome))) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O campo 'nome' é obrigatório."]);
    exit;
}

$nome = trim($data->nome);
$agora = date('Y-m-d H:i:s');

try {
    $pdo = Conexao::pdo();
    $stmt = $pdo->prepare(
        "INSERT INTO formas_pagamento (nome, created_at, updated_at) VALUES (:nome, :agora, :agora)"
    );

    $stmt->bindParam(':nome', $nome);
    $stmt->bindParam(':agora', $agora);
    $stmt->execute();

    $novo_id = $pdo->lastInsertId();

    http_response_code(201);
    echo json_encode([
        "status"             => "success",
        "message"            => "Forma de pagamento cadastrada com sucesso.",
        "id_forma_pagamento" => $novo_id
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao cadastrar a forma de pagamento.",
        "detalhe" => $e->getMessage()
    ]);
}
