<?php
// api/creates/create_lente.php

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

// Validação dos dados
if (!$data || !isset($data->id_familia) || !isset($data->id_indice) || !isset($data->id_tratamento)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Campos obrigatórios (id_familia, id_indice, id_tratamento) não foram enviados."]);
    exit;
}

// Define valores, permitindo nulos para os campos não obrigatórios
$id_familia = $data->id_familia;
$id_indice = $data->id_indice;
$id_tratamento = $data->id_tratamento;
$valor_venda = $data->valor_venda ?? null;
$valor_compra = $data->valor_compra ?? null;
$agora = date('Y-m-d H:i:s');

try {
    $pdo = Conexao::pdo();

    $stmt = $pdo->prepare(
        "INSERT INTO lentes (id_familia, id_indice, id_tratamento, valor_venda, valor_compra, created_at, updated_at)
         VALUES (:id_familia, :id_indice, :id_tratamento, :valor_venda, :valor_compra, :created_at, :updated_at)"
    );

    $stmt->bindParam(':id_familia', $id_familia, PDO::PARAM_INT);
    $stmt->bindParam(':id_indice', $id_indice, PDO::PARAM_INT);
    $stmt->bindParam(':id_tratamento', $id_tratamento, PDO::PARAM_INT);
    $stmt->bindParam(':valor_venda', $valor_venda);
    $stmt->bindParam(':valor_compra', $valor_compra);
    $stmt->bindParam(':created_at', $agora);
    $stmt->bindParam(':updated_at', $agora);

    $stmt->execute();
    $novo_id = $pdo->lastInsertId();

    http_response_code(201);
    echo json_encode([
        "status"   => "success",
        "message"  => "Lente cadastrada com sucesso.",
        "id_lente" => $novo_id
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao cadastrar a lente.",
        "detalhe" => $e->getMessage()
    ]);
}
