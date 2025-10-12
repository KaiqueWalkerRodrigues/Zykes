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

if (!isset($_GET['id_cliente'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O parâmetro 'id_cliente' é obrigatório."]);
    exit;
}

$id_cliente = $_GET['id_cliente'];

try {
    $pdo = Conexao::pdo();
    $stmt = $pdo->prepare(
        "SELECT * FROM clientes WHERE id_cliente = :id_cliente AND deleted_at IS NULL"
    );
    $stmt->bindParam(':id_cliente', $id_cliente);
    $stmt->execute();

    $cliente = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($cliente) {
        http_response_code(200);
        echo json_encode(["status" => "success", "data" => $cliente]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Cliente não encontrado."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao buscar o cliente.",
        "detalhe" => $e->getMessage()
    ]);
}
