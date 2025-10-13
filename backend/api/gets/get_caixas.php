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

// Validação do novo parâmetro obrigatório (ATUALIZADO)
if (!isset($_GET['id_empresa'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O parâmetro 'id_empresa' é obrigatório."]);
    exit;
}

$id_empresa = $_GET['id_empresa'];

try {
    $pdo = Conexao::pdo();

    // Query ATUALIZADA para filtrar por empresa e buscar o nome do usuário
    $stmt = $pdo->prepare(
        "SELECT c.*, u.nome as nome_usuario 
         FROM caixas c
         JOIN usuarios u ON c.id_vendedor = u.id_usuario
         WHERE c.deleted_at IS NULL AND c.id_empresa = :id_empresa 
         ORDER BY c.data_abertura DESC"
    );
    $stmt->bindParam(':id_empresa', $id_empresa);
    $stmt->execute();

    $caixas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode(["status" => "success", "data" => $caixas]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao buscar os caixas.",
        "detalhe" => $e->getMessage()
    ]);
}
