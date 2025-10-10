<?php
// api/deletes/delete_lente.php

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

if (!$data || !isset($data->id_lente) || !is_numeric($data->id_lente)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O campo 'id_lente' é obrigatório."]);
    exit;
}

$id_lente = $data->id_lente;
$agora = date('Y-m-d H:i:s');

try {
    $pdo = Conexao::pdo();

    $stmt = $pdo->prepare(
        "UPDATE lentes SET deleted_at = :deleted_at
         WHERE id_lente = :id_lente AND deleted_at IS NULL"
    );

    $stmt->bindParam(':deleted_at', $agora);
    $stmt->bindParam(':id_lente', $id_lente, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Lente excluída com sucesso."]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Lente não encontrada ou já foi excluída."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao excluir a lente.",
        "detalhe" => $e->getMessage()
    ]);
}
