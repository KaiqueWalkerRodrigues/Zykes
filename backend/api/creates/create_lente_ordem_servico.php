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

if (!$data || !isset($data->id_ordem_servico) || !isset($data->id_lente)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Os campos 'id_ordem_servico' e 'id_lente' são obrigatórios."]);
    exit;
}

// Atribuição de variáveis
$id_ordem_servico = $data->id_ordem_servico;
$id_lente = $data->id_lente;
$quantidade = isset($data->quantidade) ? $data->quantidade : 1;
$valor_unitario = isset($data->valor_unitario) ? $data->valor_unitario : 0.00;
$agora = date('Y-m-d H:i:s');

try {
    $pdo = Conexao::pdo();
    $stmt = $pdo->prepare(
        "INSERT INTO lentes_ordens_servico (id_ordem_servico, id_lente, quantidade, valor_unitario, created_at, updated_at) 
         VALUES (:id_ordem_servico, :id_lente, :quantidade, :valor_unitario, :agora, :agora)"
    );

    $stmt->bindParam(':id_ordem_servico', $id_ordem_servico);
    $stmt->bindParam(':id_lente', $id_lente);
    $stmt->bindParam(':quantidade', $quantidade);
    $stmt->bindParam(':valor_unitario', $valor_unitario);
    $stmt->bindParam(':agora', $agora);
    $stmt->execute();

    $novo_id = $pdo->lastInsertId();

    http_response_code(201);
    echo json_encode([
        "status"                  => "success",
        "message"                 => "Lente vinculada à ordem de serviço com sucesso.",
        "id_lente_ordem_servico"  => $novo_id
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao vincular lente à ordem de serviço.",
        "detalhe" => $e->getMessage()
    ]);
}
