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

$data = json_decode(file_get_contents("php://input"));

if (!isset($_GET['id_forma_pagamento'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O parâmetro 'id_forma_pagamento' é obrigatório."]);
    exit;
}

if (!$data || !isset($data->nome) || empty(trim($data->nome))) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O campo 'nome' é obrigatório no corpo da requisição."]);
    exit;
}

$id_forma_pagamento = $_GET['id_forma_pagamento'];
$nome = trim($data->nome);
$agora = date('Y-m-d H:i:s');

try {
    $pdo = Conexao::pdo();
    $stmt = $pdo->prepare(
        "UPDATE formas_pagamento SET nome = :nome, updated_at = :agora 
         WHERE id_forma_pagamento = :id_forma_pagamento AND deleted_at IS NULL"
    );

    $stmt->bindParam(':nome', $nome);
    $stmt->bindParam(':agora', $agora);
    $stmt->bindParam(':id_forma_pagamento', $id_forma_pagamento);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode([
            "status"  => "success",
            "message" => "Forma de pagamento atualizada com sucesso."
        ]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Forma de pagamento não encontrada ou nenhum dado foi modificado."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao atualizar a forma de pagamento.",
        "detalhe" => $e->getMessage()
    ]);
}
