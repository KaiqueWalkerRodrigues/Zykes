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
    // Nota: Esta tabela não possui a coluna deleted_at
    $stmt = $pdo->prepare(
        "SELECT * FROM vendas_ordens_servico ORDER BY id_venda_ordem_servico DESC"
    );
    $stmt->execute();

    $vinculos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode(["status" => "success", "data" => $vinculos]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao buscar os vínculos.",
        "detalhe" => $e->getMessage()
    ]);
}
