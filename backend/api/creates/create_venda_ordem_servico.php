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

if (!$data || !isset($data->id_venda) || !isset($data->id_ordem_servico)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Os campos 'id_venda' e 'id_ordem_servico' são obrigatórios."]);
    exit;
}

$id_venda = $data->id_venda;
$id_ordem_servico = $data->id_ordem_servico;

try {
    $pdo = Conexao::pdo();
    $stmt = $pdo->prepare(
        "INSERT INTO vendas_ordens_servico (id_venda, id_ordem_servico) 
         VALUES (:id_venda, :id_ordem_servico)"
    );

    $stmt->bindParam(':id_venda', $id_venda);
    $stmt->bindParam(':id_ordem_servico', $id_ordem_servico);
    $stmt->execute();

    $novo_id = $pdo->lastInsertId();

    http_response_code(201);
    echo json_encode([
        "status"                => "success",
        "message"               => "Ordem de serviço vinculada à venda com sucesso.",
        "id_venda_ordem_servico" => $novo_id
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao vincular ordem de serviço à venda.",
        "detalhe" => $e->getMessage()
    ]);
}
