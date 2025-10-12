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

if (!$data || !isset($data->id_empresa) || !isset($data->id_caixa)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Os campos 'id_empresa' e 'id_caixa' são obrigatórios."]);
    exit;
}

$id_empresa = $data->id_empresa;
$id_caixa = $data->id_caixa;
$status = isset($data->status) ? trim($data->status) : 'em_andamento';
$observacao = isset($data->observacao) ? trim($data->observacao) : null;
$agora = date('Y-m-d H:i:s');

try {
    $pdo = Conexao::pdo();
    $stmt = $pdo->prepare(
        "INSERT INTO vendas (id_empresa, id_caixa, status, observacao, created_at, updated_at) 
         VALUES (:id_empresa, :id_caixa, :status, :observacao, :agora, :agora)"
    );

    $stmt->bindParam(':id_empresa', $id_empresa);
    $stmt->bindParam(':id_caixa', $id_caixa);
    $stmt->bindParam(':status', $status);
    $stmt->bindParam(':observacao', $observacao);
    $stmt->bindParam(':agora', $agora);
    $stmt->execute();

    $novo_id = $pdo->lastInsertId();

    http_response_code(201);
    echo json_encode([
        "status"   => "success",
        "message"  => "Venda iniciada com sucesso.",
        "id_venda" => $novo_id
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao iniciar a venda.",
        "detalhe" => $e->getMessage()
    ]);
}
