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

if (!isset($_GET['id_forma_pagamento'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O parâmetro 'id_forma_pagamento' é obrigatório."]);
    exit;
}

$id_forma_pagamento = $_GET['id_forma_pagamento'];

try {
    $pdo = Conexao::pdo();
    $stmt = $pdo->prepare(
        "SELECT * FROM formas_pagamento WHERE id_forma_pagamento = :id_forma_pagamento AND deleted_at IS NULL"
    );
    $stmt->bindParam(':id_forma_pagamento', $id_forma_pagamento);
    $stmt->execute();

    $forma_pagamento = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($forma_pagamento) {
        http_response_code(200);
        echo json_encode(["status" => "success", "data" => $forma_pagamento]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Forma de pagamento não encontrada."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao buscar a forma de pagamento.",
        "detalhe" => $e->getMessage()
    ]);
}
