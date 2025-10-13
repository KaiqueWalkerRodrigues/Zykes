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

if (!isset($_GET['id_caixa'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O parâmetro 'id_caixa' é obrigatório."]);
    exit;
}

$id_caixa = $_GET['id_caixa'];

try {
    $pdo = Conexao::pdo();

    // Query ATUALIZADA para buscar também o nome do usuário
    $stmt = $pdo->prepare(
        "SELECT c.*, u.nome as nome_usuario
         FROM caixas c
         JOIN usuarios u ON c.id_usuario = u.id_usuario
         WHERE c.id_caixa = :id_caixa AND c.deleted_at IS NULL"
    );
    $stmt->bindParam(':id_caixa', $id_caixa);
    $stmt->execute();

    $caixa = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($caixa) {
        http_response_code(200);
        echo json_encode(["status" => "success", "data" => $caixa]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Caixa não encontrado."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao buscar o caixa.",
        "detalhe" => $e->getMessage()
    ]);
}
