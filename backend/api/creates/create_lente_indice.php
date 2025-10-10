<?php
// create_lente_indice.php

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

$json_data = file_get_contents("php://input");
$data = json_decode($json_data);

if (!$data || !isset($data->nome) || trim($data->nome) === '') {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O campo 'nome' é obrigatório."]);
    exit;
}

$nome = trim($data->nome);
// + Adicionado: Pega a data e hora atual no formato do MySQL
$agora = date('Y-m-d H:i:s');

try {
    $pdo = Conexao::pdo();

    // + Alterado: Adiciona created_at e updated_at no INSERT
    $stmt = $pdo->prepare(
        "INSERT INTO lente_indices (nome, created_at, updated_at) 
         VALUES (:nome, :created_at, :updated_at)"
    );

    $stmt->bindParam(':nome', $nome, PDO::PARAM_STR);
    // + Adicionado: Passa os valores de data para a query
    $stmt->bindParam(':created_at', $agora, PDO::PARAM_STR);
    $stmt->bindParam(':updated_at', $agora, PDO::PARAM_STR);

    $stmt->execute();

    $novo_id = $pdo->lastInsertId();

    http_response_code(201);
    echo json_encode([
        "status"            => "success",
        "message"           => "Índice de refração cadastrado com sucesso.",
        "id_indice_lente"   => $novo_id
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao cadastrar o índice de refração.",
        "detalhe" => $e->getMessage()
    ]);
}
