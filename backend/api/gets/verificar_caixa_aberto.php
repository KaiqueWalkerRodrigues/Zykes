<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../Conexao.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método não permitido."]);
    exit;
}

if (!isset($_GET['id_empresa'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O parâmetro 'id_empresa' é obrigatório."]);
    exit;
}

$id_empresa = $_GET['id_empresa'];

try {
    $pdo = Conexao::pdo();

    // Query com a ordem das cláusulas corrigida
    $stmt = $pdo->prepare(
        "SELECT c.*, u.nome as nome_usuario, e.nome as nome_empresa
         FROM caixas c
         JOIN usuarios u ON c.id_usuario = u.id_usuario
         JOIN empresas e ON c.id_empresa = e.id_empresa
         WHERE c.id_empresa = :id_empresa
         ORDER BY c.id_caixa DESC
         LIMIT 1"
    );
    $stmt->bindParam(':id_empresa', $id_empresa, PDO::PARAM_INT);
    $stmt->execute();

    $caixa = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($caixa) {
        // Verifica se o status é 'aberto' (1)
        if ($caixa['status'] == 1) {
            http_response_code(200);
            echo json_encode([
                "status" => "success",
                "aberto" => true,
                "data" => $caixa
            ]);
        } else {
            // O último caixa está fechado
            http_response_code(200);
            echo json_encode([
                "status" => "success",
                "aberto" => false,
                "message" => "O último caixa desta empresa está fechado."
            ]);
        }
    } else {
        // Nenhum caixa foi encontrado para a empresa
        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "aberto" => false,
            "message" => "Nenhum caixa encontrado para esta empresa."
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao verificar o status do caixa.",
        "detalhe" => $e->getMessage()
    ]);
}
