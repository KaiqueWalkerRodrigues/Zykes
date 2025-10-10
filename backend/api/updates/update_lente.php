<?php
// api/updates/update_lente.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../Conexao.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método não permitido."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

// Validação dos dados
if (!$data || !isset($data->id_lente) || !isset($data->id_indice)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Campos obrigatórios (id_lente, id_indice, id_tratamento) não foram enviados."]);
    exit;
}

$id_lente = $data->id_lente;
$id_indice = $data->id_indice;
$id_tratamento = $data->id_tratamento ?? null;
$valor_venda = $data->valor_venda ?? null;
$valor_compra = $data->valor_compra ?? null;
$agora = date('Y-m-d H:i:s');

try {
    $pdo = Conexao::pdo();

    $stmt = $pdo->prepare(
        "UPDATE lentes SET
            id_indice = :id_indice,
            id_tratamento = :id_tratamento,
            valor_venda = :valor_venda,
            valor_compra = :valor_compra,
            updated_at = :updated_at
         WHERE id_lente = :id_lente"
    );

    $stmt->bindParam(':id_indice', $id_indice, PDO::PARAM_INT);
    $stmt->bindParam(':id_tratamento', $id_tratamento, PDO::PARAM_INT);
    $stmt->bindParam(':valor_venda', $valor_venda);
    $stmt->bindParam(':valor_compra', $valor_compra);
    $stmt->bindParam(':updated_at', $agora);
    $stmt->bindParam(':id_lente', $id_lente, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Lente atualizada com sucesso."]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Lente não encontrada."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao atualizar a lente.",
        "detalhe" => $e->getMessage()
    ]);
}
