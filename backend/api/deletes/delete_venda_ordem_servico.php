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

if (!$data || !isset($data->id_venda_ordem_servico)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O campo 'id_venda_ordem_servico' é obrigatório."]);
    exit;
}

$id_venda_ordem_servico = $data->id_venda_ordem_servico;

try {
    $pdo = Conexao::pdo();
    // Hard delete: remove o registro permanentemente, pois não há 'deleted_at' nesta tabela
    $stmt = $pdo->prepare(
        "DELETE FROM vendas_ordens_servico WHERE id_venda_ordem_servico = :id_venda_ordem_servico"
    );

    $stmt->bindParam(':id_venda_ordem_servico', $id_venda_ordem_servico);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode([
            "status"  => "success",
            "message" => "Vínculo entre venda e ordem de serviço excluído com sucesso."
        ]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Vínculo não encontrado."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao excluir o vínculo.",
        "detalhe" => $e->getMessage()
    ]);
}
