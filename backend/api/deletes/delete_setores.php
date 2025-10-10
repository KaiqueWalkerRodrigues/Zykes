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

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->id_setor)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O campo 'id_setor' é obrigatório."]);
    exit;
}

$id_setor = $data->id_setor;

try {
    $pdo = Conexao::pdo();
    $stmt = $pdo->prepare("UPDATE setores SET deleted_at = NOW() WHERE id_setor = :id_setor");
    $stmt->bindParam(':id_setor', $id_setor, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Setor excluído com sucesso."]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Setor não encontrado."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao excluir o setor.",
        "detalhe" => $e->getMessage()
    ]);
}
