<?php
// update_lente_tratamento.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
header("Access-control-allow-headers: Content-Type");
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

$json_data = file_get_contents("php://input");
$data = json_decode($json_data);

// Validação dos dados
if (!$data || !isset($data->id_tratamento_lente) || !is_numeric($data->id_tratamento_lente)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O campo 'id_tratamento_lente' é obrigatório."]);
    exit;
}
if (!isset($data->nome) || trim($data->nome) === '') {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O campo 'nome' é obrigatório."]);
    exit;
}

$id = $data->id_tratamento_lente;
$nome = trim($data->nome);
$agora = date('Y-m-d H:i:s');

try {
    $pdo = Conexao::pdo();

    $stmt = $pdo->prepare(
        "UPDATE lente_tratamentos 
         SET nome = :nome, updated_at = :updated_at 
         WHERE id_tratamento_lente = :id_tratamento_lente"
    );

    $stmt->bindParam(':nome', $nome, PDO::PARAM_STR);
    $stmt->bindParam(':updated_at', $agora, PDO::PARAM_STR);
    $stmt->bindParam(':id_tratamento_lente', $id, PDO::PARAM_INT);

    $stmt->execute();

    // Verifica se alguma linha foi de fato atualizada
    if ($stmt->rowCount() > 0) {
        http_response_code(200); // OK
        echo json_encode([
            "status"  => "success",
            "message" => "Tratamento de lente atualizado com sucesso."
        ]);
    } else {
        http_response_code(404); // Not Found
        echo json_encode([
            "status"  => "error",
            "message" => "Tratamento de lente não encontrado."
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao atualizar o tratamento de lente.",
        "detalhe" => $e->getMessage()
    ]);
}
