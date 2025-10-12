<?php
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

if (!isset($_GET['id_lente_ordem_servico'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O parâmetro 'id_lente_ordem_servico' é obrigatório."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->id_ordem_servico) || !isset($data->id_lente)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Os campos 'id_ordem_servico' e 'id_lente' são obrigatórios."]);
    exit;
}

// Atribuição de variáveis
$id_lente_ordem_servico = $_GET['id_lente_ordem_servico'];
$id_ordem_servico = $data->id_ordem_servico;
$id_lente = $data->id_lente;
$quantidade = isset($data->quantidade) ? $data->quantidade : 1;
$valor_unitario = isset($data->valor_unitario) ? $data->valor_unitario : 0.00;
$agora = date('Y-m-d H:i:s');

try {
    $pdo = Conexao::pdo();
    $stmt = $pdo->prepare(
        "UPDATE lentes_ordens_servico 
         SET id_ordem_servico = :id_ordem_servico, id_lente = :id_lente, quantidade = :quantidade, 
             valor_unitario = :valor_unitario, updated_at = :agora 
         WHERE id_lente_ordem_servico = :id_lente_ordem_servico AND deleted_at IS NULL"
    );

    $stmt->bindParam(':id_ordem_servico', $id_ordem_servico);
    $stmt->bindParam(':id_lente', $id_lente);
    $stmt->bindParam(':quantidade', $quantidade);
    $stmt->bindParam(':valor_unitario', $valor_unitario);
    $stmt->bindParam(':agora', $agora);
    $stmt->bindParam(':id_lente_ordem_servico', $id_lente_ordem_servico);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Registro atualizado com sucesso."]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Registro não encontrado ou nenhum dado foi modificado."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao atualizar o registro.",
        "detalhe" => $e->getMessage()
    ]);
}
