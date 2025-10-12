<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../Conexao.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método não permitido."]);
    exit;
}

if (!isset($_GET['id_venda_pagamento'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O parâmetro 'id_venda_pagamento' é obrigatório."]);
    exit;
}

$id_venda_pagamento = $_GET['id_venda_pagamento'];

try {
    $pdo = Conexao::pdo();
    $stmt = $pdo->prepare(
        "SELECT * FROM vendas_pagamentos WHERE id_venda_pagamento = :id_venda_pagamento AND deleted_at IS NULL"
    );
    $stmt->bindParam(':id_venda_pagamento', $id_venda_pagamento);
    $stmt->execute();

    $venda_pagamento = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($venda_pagamento) {
        http_response_code(200);
        echo json_encode(["status" => "success", "data" => $venda_pagamento]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Pagamento de venda não encontrado."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao buscar o pagamento da venda.",
        "detalhe" => $e->getMessage()
    ]);
}
