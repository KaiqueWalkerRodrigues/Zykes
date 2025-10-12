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

if (!isset($_GET['id_lente_ordem_servico'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O parâmetro 'id_lente_ordem_servico' é obrigatório."]);
    exit;
}

$id_lente_ordem_servico = $_GET['id_lente_ordem_servico'];

try {
    $pdo = Conexao::pdo();
    $stmt = $pdo->prepare(
        "SELECT * FROM lentes_ordens_servico WHERE id_lente_ordem_servico = :id_lente_ordem_servico AND deleted_at IS NULL"
    );
    $stmt->bindParam(':id_lente_ordem_servico', $id_lente_ordem_servico);
    $stmt->execute();

    $registro = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($registro) {
        http_response_code(200);
        echo json_encode(["status" => "success", "data" => $registro]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Registro não encontrado."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao buscar o registro.",
        "detalhe" => $e->getMessage()
    ]);
}
