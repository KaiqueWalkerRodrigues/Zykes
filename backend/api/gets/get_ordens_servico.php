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

if (!isset($_GET['id_empresa']) || !is_numeric($_GET['id_empresa'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O parâmetro 'id_empresa' é obrigatório e deve ser numérico."]);
    exit;
}

$id_empresa = (int) $_GET['id_empresa'];

try {
    $pdo = Conexao::pdo();

    // Se quiser alterar a ordenação, troque a coluna abaixo (ex.: updated_at)
    $sql = "SELECT *
            FROM ordens_servico
            WHERE id_empresa = :id_empresa
              AND deleted_at IS NULL
            ORDER BY created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':id_empresa', $id_empresa, PDO::PARAM_INT);
    $stmt->execute();

    $ordens = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Para listagem, retornamos 200 com array (mesmo se vazio)
    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "data"   => $ordens
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao listar as ordens de serviço.",
        "detalhe" => $e->getMessage()
    ]);
}
