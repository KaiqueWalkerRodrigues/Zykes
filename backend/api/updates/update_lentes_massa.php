<?php
// api/updates/update_lentes_massa.php

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

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O corpo da requisição deve ser um array de lentes."]);
    exit;
}

$pdo = Conexao::pdo();

// Inicia a transação para garantir que todas as atualizações ocorram ou nenhuma.
$pdo->beginTransaction();

try {
    $agora = date('Y-m-d H:i:s');

    // Prepara a query uma única vez antes do loop para melhor performance
    $stmt = $pdo->prepare(
        "UPDATE lentes SET
            id_indice = :id_indice,
            id_tratamento = :id_tratamento,
            valor_venda = :valor_venda,
            valor_compra = :valor_compra,
            updated_at = :updated_at
         WHERE id_lente = :id_lente"
    );

    foreach ($data as $lente) {
        // Validação para cada objeto dentro do array
        if (
            !isset($lente->id_lente) || !is_numeric($lente->id_lente) ||
            !isset($lente->id_indice) || !is_numeric($lente->id_indice)
        ) {
            // Se um item for inválido, lança uma exceção para cancelar a transação
            throw new InvalidArgumentException("Dados inválidos para a lente ID: " . ($lente->id_lente ?? 'N/A'));
        }

        $stmt->bindValue(':id_indice', $lente->id_indice, PDO::PARAM_INT);
        $stmt->bindValue(':id_tratamento', $lente->id_tratamento ?? null, PDO::PARAM_INT);
        $stmt->bindValue(':valor_venda', $lente->valor_venda ?? null);
        $stmt->bindValue(':valor_compra', $lente->valor_compra ?? null);
        $stmt->bindValue(':updated_at', $agora);
        $stmt->bindValue(':id_lente', $lente->id_lente, PDO::PARAM_INT);

        $stmt->execute();
    }

    // Se o loop terminar sem erros, efetiva a transação
    $pdo->commit();

    http_response_code(200);
    echo json_encode(["status" => "success", "message" => "Lentes atualizadas com sucesso."]);
} catch (InvalidArgumentException $e) {
    $pdo->rollBack(); // Desfaz a transação em caso de erro de validação
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
} catch (PDOException $e) {
    $pdo->rollBack(); // Desfaz a transação em caso de erro no banco de dados
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro de banco de dados ao atualizar as lentes.",
        "detalhe" => $e->getMessage()
    ]);
}
