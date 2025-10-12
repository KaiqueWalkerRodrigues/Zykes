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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método não permitido."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->id_venda) || !isset($data->id_usuario)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Os campos 'id_venda' e 'id_usuario' são obrigatórios."]);
    exit;
}

$id_venda = $data->id_venda;
$id_usuario = $data->id_usuario;
$tipo = isset($data->tipo) ? trim($data->tipo) : null;
$status = isset($data->status) ? trim($data->status) : 'pendente';
$observacao = isset($data->observacao) ? trim($data->observacao) : null;
$agora = date('Y-m-d H:i:s');

try {
    $pdo = Conexao::pdo();
    $stmt = $pdo->prepare(
        "INSERT INTO devolucoes (id_venda, id_usuario, tipo, status, observacao, created_at, updated_at) 
         VALUES (:id_venda, :id_usuario, :tipo, :status, :observacao, :agora, :agora)"
    );

    $stmt->bindParam(':id_venda', $id_venda);
    $stmt->bindParam(':id_usuario', $id_usuario);
    $stmt->bindParam(':tipo', $tipo);
    $stmt->bindParam(':status', $status);
    $stmt->bindParam(':observacao', $observacao);
    $stmt->bindParam(':agora', $agora);
    $stmt->execute();

    $novo_id = $pdo->lastInsertId();

    http_response_code(201);
    echo json_encode([
        "status"       => "success",
        "message"      => "Devolução registrada com sucesso.",
        "id_devolucao" => $novo_id
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao registrar a devolução.",
        "detalhe" => $e->getMessage()
    ]);
}
