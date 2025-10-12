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

if (!isset($_GET['id_devolucao'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O parâmetro 'id_devolucao' é obrigatório."]);
    exit;
}

$id_devolucao = $_GET['id_devolucao'];

try {
    $pdo = Conexao::pdo();
    $stmt = $pdo->prepare(
        "SELECT * FROM devolucoes WHERE id_devolucao = :id_devolucao AND deleted_at IS NULL"
    );
    $stmt->bindParam(':id_devolucao', $id_devolucao);
    $stmt->execute();

    $devolucao = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($devolucao) {
        http_response_code(200);
        echo json_encode(["status" => "success", "data" => $devolucao]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Devolução não encontrada."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao buscar a devolução.",
        "detalhe" => $e->getMessage()
    ]);
}
