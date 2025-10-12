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

if (!$data || !isset($data->id_venda) || !isset($data->id_forma_pagamento) || !isset($data->valor)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Os campos 'id_venda', 'id_forma_pagamento' e 'valor' são obrigatórios."]);
    exit;
}

$id_venda = $data->id_venda;
$id_forma_pagamento = $data->id_forma_pagamento;
$valor = $data->valor;
$agora = date('Y-m-d H:i:s');

try {
    $pdo = Conexao::pdo();
    $stmt = $pdo->prepare(
        "INSERT INTO vendas_pagamentos (id_venda, id_forma_pagamento, valor, created_at, updated_at) 
         VALUES (:id_venda, :id_forma_pagamento, :valor, :agora, :agora)"
    );

    $stmt->bindParam(':id_venda', $id_venda);
    $stmt->bindParam(':id_forma_pagamento', $id_forma_pagamento);
    $stmt->bindParam(':valor', $valor);
    $stmt->bindParam(':agora', $agora);
    $stmt->execute();

    $novo_id = $pdo->lastInsertId();

    http_response_code(201);
    echo json_encode([
        "status"             => "success",
        "message"            => "Pagamento da venda registrado com sucesso.",
        "id_venda_pagamento" => $novo_id
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao registrar o pagamento da venda.",
        "detalhe" => $e->getMessage()
    ]);
}
