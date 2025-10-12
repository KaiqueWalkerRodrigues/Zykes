<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../Conexao.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
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
$agora = date('Y-m-d H:i:s');

try {
    $pdo = Conexao::pdo();
    // Soft delete
    $stmt = $pdo->prepare(
        "UPDATE vendas_pagamentos SET deleted_at = :agora 
         WHERE id_venda_pagamento = :id_venda_pagamento AND deleted_at IS NULL"
    );

    $stmt->bindParam(':agora', $agora);
    $stmt->bindParam(':id_venda_pagamento', $id_venda_pagamento);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode([
            "status"  => "success",
            "message" => "Pagamento da venda excluído com sucesso."
        ]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Pagamento da venda não encontrado ou já excluído."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao excluir o pagamento da venda.",
        "detalhe" => $e->getMessage()
    ]);
}
