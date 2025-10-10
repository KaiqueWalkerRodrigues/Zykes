<?php
// delete_lente_indice.php

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

$json_data = file_get_contents("php://input");
$data = json_decode($json_data);

// Validação dos dados
if (!$data || !isset($data->id_indice_lente) || !is_numeric($data->id_indice_lente)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O campo 'id_indice_lente' é obrigatório."]);
    exit;
}

$id = $data->id_indice_lente;
$agora = date('Y-m-d H:i:s');

try {
    $pdo = Conexao::pdo();

    // Atualiza o campo deleted_at com a data atual
    $stmt = $pdo->prepare(
        "UPDATE lente_indices 
         SET deleted_at = :deleted_at 
         WHERE id_indice_lente = :id_indice_lente AND deleted_at IS NULL"
    );

    $stmt->bindParam(':deleted_at', $agora, PDO::PARAM_STR);
    $stmt->bindParam(':id_indice_lente', $id, PDO::PARAM_INT);

    $stmt->execute();

    // Verifica se alguma linha foi afetada. Se for 0, o ID não existe ou já foi excluído.
    if ($stmt->rowCount() > 0) {
        http_response_code(200); // OK
        echo json_encode([
            "status"  => "success",
            "message" => "Índice de refração excluído com sucesso."
        ]);
    } else {
        http_response_code(404); // Not Found
        echo json_encode([
            "status"  => "error",
            "message" => "Índice de refração não encontrado ou já foi excluído."
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao excluir o índice de refração.",
        "detalhe" => $e->getMessage()
    ]);
}
