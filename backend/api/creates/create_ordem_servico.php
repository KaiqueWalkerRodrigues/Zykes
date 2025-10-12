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

if (!$data || !isset($data->id_cliente) || !isset($data->id_vendedor) || !isset($data->valor_sub_total)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Os campos 'id_cliente', 'id_vendedor' e 'valor_sub_total' são obrigatórios."]);
    exit;
}

$id_cliente = $data->id_cliente;
$id_vendedor = $data->id_vendedor;
$valor_sub_total = $data->valor_sub_total;
$id_entregador = isset($data->id_entregador) ? $data->id_entregador : null;
$agora = date('Y-m-d H:i:s');

try {
    $pdo = Conexao::pdo();
    $stmt = $pdo->prepare(
        "INSERT INTO ordens_servico (id_cliente, id_vendedor, id_entregador, valor_sub_total, created_at, updated_at) 
         VALUES (:id_cliente, :id_vendedor, :id_entregador, :valor_sub_total, :agora, :agora)"
    );

    $stmt->bindParam(':id_cliente', $id_cliente);
    $stmt->bindParam(':id_vendedor', $id_vendedor);
    $stmt->bindParam(':id_entregador', $id_entregador);
    $stmt->bindParam(':valor_sub_total', $valor_sub_total);
    $stmt->bindParam(':agora', $agora);
    $stmt->execute();

    $novo_id = $pdo->lastInsertId();

    http_response_code(201);
    echo json_encode([
        "status"           => "success",
        "message"          => "Ordem de serviço criada com sucesso.",
        "id_ordem_servico" => $novo_id
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao criar a ordem de serviço.",
        "detalhe" => $e->getMessage()
    ]);
}
