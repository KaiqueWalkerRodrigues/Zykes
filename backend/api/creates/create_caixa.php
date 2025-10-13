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

// Validação dos campos obrigatórios (ATUALIZADO)
if (!$data || !isset($data->id_usuario) || !isset($data->saldo_inicio) || !isset($data->id_empresa)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Os campos 'id_usuario', 'id_empresa' e 'saldo_inicio' são obrigatórios."]);
    exit;
}

$id_usuario = $data->id_usuario;
$id_empresa = $data->id_empresa;
$saldo_inicio = $data->saldo_inicio;
$observacao = isset($data->observacao) ? trim($data->observacao) : null;
$data_abertura = date('Y-m-d H:i:s');
$agora = date('Y-m-d H:i:s');

try {
    $pdo = Conexao::pdo();

    $stmt = $pdo->prepare(
        "INSERT INTO caixas (id_usuario, id_empresa, status, data_abertura, saldo_inicio, observacao, created_at, updated_at) 
         VALUES (:id_usuario, :id_empresa, 1, :data_abertura, :saldo_inicio, :observacao, :agora, :agora)"
    );

    $stmt->bindParam(':id_usuario', $id_usuario);
    $stmt->bindParam(':id_empresa', $id_empresa);
    $stmt->bindParam(':data_abertura', $data_abertura);
    $stmt->bindParam(':saldo_inicio', $saldo_inicio);
    $stmt->bindParam(':observacao', $observacao);
    $stmt->bindParam(':agora', $agora);
    $stmt->execute();

    $novo_id = $pdo->lastInsertId();

    http_response_code(201);
    echo json_encode([
        "status"   => "success",
        "message"  => "Caixa aberto com sucesso.",
        "id_caixa" => $novo_id
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao abrir o caixa.",
        "detalhe" => $e->getMessage()
    ]);
}
