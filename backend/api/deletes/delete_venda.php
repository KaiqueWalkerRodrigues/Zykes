<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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

if (!$data || !isset($data->id_venda)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O campo 'id_venda' é obrigatório."]);
    exit;
}

$id_venda = $data->id_venda;
$agora = date('Y-m-d H:i:s');

try {
    $pdo = Conexao::pdo();
    // Soft delete: atualiza a coluna deleted_at
    $stmt = $pdo->prepare(
        "UPDATE vendas SET deleted_at = :agora WHERE id_venda = :id_venda AND deleted_at IS NULL"
    );

    $stmt->bindParam(':agora', $agora);
    $stmt->bindParam(':id_venda', $id_venda);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode([
            "status"  => "success",
            "message" => "Venda excluída com sucesso."
        ]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Venda não encontrada ou já excluída."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao excluir a venda.",
        "detalhe" => $e->getMessage()
    ]);
}
