<?php
header("Access-Control-Allow-Origin: *");
// Métodos permitidos. PUT é semanticamente ideal para atualizações, mas POST também é comum.
header("Access-Control-Allow-Methods: POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../Conexao.php';

// Resposta para a requisição pre-flight OPTIONS do navegador
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Aceita tanto POST quanto PUT para flexibilidade
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método não permitido."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

// Validação dos campos obrigatórios para fechar o caixa
if (!$data || !isset($data->id_caixa) || !isset($data->saldo_final)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Os campos 'id_caixa' e 'saldo_final' são obrigatórios."]);
    exit;
}

$id_caixa = filter_var($data->id_caixa, FILTER_VALIDATE_INT);
$saldo_final = filter_var($data->saldo_final, FILTER_VALIDATE_FLOAT);

if ($id_caixa === false || $saldo_final === false || $saldo_final < 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Dados inválidos. Verifique os valores de ID e saldo final."]);
    exit;
}

try {
    $pdo = Conexao::pdo();

    // Inicia a construção da query SQL dinamicamente
    $sql_parts = [
        "status = 0", // 0 para fechado
        "saldo_final = :saldo_final",
        "data_fechamento = NOW()",
        "updated_at = NOW()"
    ];

    $params = [
        ':id_caixa'     => $id_caixa,
        ':saldo_final'  => $saldo_final
    ];

    // Adiciona o campo 'observacao' à query somente se ele for enviado na requisição
    if (isset($data->observacao)) {
        $sql_parts[] = "observacao = :observacao";
        $params[':observacao'] = trim($data->observacao);
    }

    $sql = "UPDATE caixas SET " . implode(", ", $sql_parts) . " WHERE id_caixa = :id_caixa";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // rowCount() retorna o número de linhas afetadas.
    // Se for 0, significa que o ID do caixa não foi encontrado.
    if ($stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode([
            "status"   => "success",
            "message"  => "Caixa fechado com sucesso.",
            "id_caixa" => $id_caixa
        ]);
    } else {
        http_response_code(404); // Not Found
        echo json_encode([
            "status"  => "error",
            "message" => "Nenhum caixa encontrado com o ID fornecido ou o caixa já está fechado."
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao fechar o caixa.",
        "detalhe" => $e->getMessage()
    ]);
}
