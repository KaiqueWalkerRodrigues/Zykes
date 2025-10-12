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

if (!isset($_GET['id_ordem_servico'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O parâmetro 'id_ordem_servico' é obrigatório."]);
    exit;
}

$id_ordem_servico = $_GET['id_ordem_servico'];

try {
    $pdo = Conexao::pdo();
    $stmt = $pdo->prepare(
        "SELECT * FROM ordens_servico WHERE id_ordem_servico = :id_ordem_servico AND deleted_at IS NULL"
    );
    $stmt->bindParam(':id_ordem_servico', $id_ordem_servico);
    $stmt->execute();

    $ordem = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($ordem) {
        http_response_code(200);
        echo json_encode(["status" => "success", "data" => $ordem]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Ordem de serviço não encontrada."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao buscar a ordem de serviço.",
        "detalhe" => $e->getMessage()
    ]);
}
