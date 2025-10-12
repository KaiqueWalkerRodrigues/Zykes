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

try {
    $pdo = Conexao::pdo();
    // Você pode adicionar um JOIN aqui para buscar os nomes das lentes e detalhes da OS
    $stmt = $pdo->prepare(
        "SELECT * FROM lentes_ordens_servico WHERE deleted_at IS NULL ORDER BY created_at DESC"
    );
    $stmt->execute();

    $registros = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode(["status" => "success", "data" => $registros]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao buscar os vínculos.",
        "detalhe" => $e->getMessage()
    ]);
}
