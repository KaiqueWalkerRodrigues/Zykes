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

if (!$data || !isset($data->id_cargo)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O campo 'id_cargo' é obrigatório."]);
    exit;
}

$id_cargo = $data->id_cargo;

try {
    $pdo = Conexao::pdo();
    $stmt = $pdo->prepare("UPDATE cargos SET deleted_at = NOW() WHERE id_cargo = :id_cargo");
    $stmt->bindParam(':id_cargo', $id_cargo, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Cargo excluído com sucesso."]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Cargo não encontrado."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao excluir o cargo.",
        "detalhe" => $e->getMessage()
    ]);
}
