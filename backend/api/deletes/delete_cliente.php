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

if (!$data || !isset($data->id_cliente)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O campo 'id_cliente' é obrigatório."]);
    exit;
}

$id_cliente = $data->id_cliente;
$agora = date('Y-m-d H:i:s');

try {
    $pdo = Conexao::pdo();
    // Soft delete: atualiza a coluna deleted_at
    $stmt = $pdo->prepare(
        "UPDATE clientes SET deleted_at = :agora WHERE id_cliente = :id_cliente AND deleted_at IS NULL"
    );

    $stmt->bindParam(':agora', $agora);
    $stmt->bindParam(':id_cliente', $id_cliente);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode([
            "status"  => "success",
            "message" => "Cliente excluído com sucesso."
        ]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Cliente não encontrado ou já excluído."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao excluir o cliente.",
        "detalhe" => $e->getMessage()
    ]);
}
