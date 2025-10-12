<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../Conexao.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método não permitido."]);
    exit;
}

if (!isset($_GET['id_venda_pagamento'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O parâmetro 'id_venda_pagamento' é obrigatório."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->id_venda) || !isset($data->id_forma_pagamento) || !isset($data->valor)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Os campos 'id_venda', 'id_forma_pagamento' e 'valor' são obrigatórios."]);
    exit;
}

$id_venda_pagamento = $_GET['id_venda_pagamento'];
$id_venda = $data->id_venda;
$id_forma_pagamento = $data->id_forma_pagamento;
$valor = $data->valor;
$agora = date('Y-m-d H:i:s');

try {
    $pdo = Conexao::pdo();
    $stmt = $pdo->prepare(
        "UPDATE vendas_pagamentos 
         SET id_venda = :id_venda, id_forma_pagamento = :id_forma_pagamento, valor = :valor, updated_at = :agora 
         WHERE id_venda_pagamento = :id_venda_pagamento AND deleted_at IS NULL"
    );

    $stmt->bindParam(':id_venda', $id_venda);
    $stmt->bindParam(':id_forma_pagamento', $id_forma_pagamento);
    $stmt->bindParam(':valor', $valor);
    $stmt->bindParam(':agora', $agora);
    $stmt->bindParam(':id_venda_pagamento', $id_venda_pagamento);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode([
            "status"  => "success",
            "message" => "Pagamento da venda atualizado com sucesso."
        ]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Pagamento da venda não encontrado ou nenhum dado foi modificado."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao atualizar o pagamento da venda.",
        "detalhe" => $e->getMessage()
    ]);
}
