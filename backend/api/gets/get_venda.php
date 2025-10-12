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

if (!isset($_GET['id_venda'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O parâmetro 'id_venda' é obrigatório."]);
    exit;
}

$id_venda = $_GET['id_venda'];

try {
    $pdo = Conexao::pdo();
    $stmt = $pdo->prepare(
        "SELECT * FROM vendas WHERE id_venda = :id_venda AND deleted_at IS NULL"
    );
    $stmt->bindParam(':id_venda', $id_venda);
    $stmt->execute();

    $venda = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($venda) {
        http_response_code(200);
        echo json_encode(["status" => "success", "data" => $venda]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Venda não encontrada."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao buscar a venda.",
        "detalhe" => $e->getMessage()
    ]);
}
