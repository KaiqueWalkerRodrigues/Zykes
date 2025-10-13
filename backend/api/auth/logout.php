<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../Conexao.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
$input = json_decode(file_get_contents("php://input"), true);
if (!$input || empty($input['refresh_token'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Campo 'refresh_token' é obrigatório."]);
    exit;
}
$hash = hash('sha256', $input['refresh_token']);

try {
    $pdo = Conexao::pdo();
    $pdo->prepare("UPDATE usuarios_tokens SET revoked_at = NOW() WHERE token_hash = :h AND revoked_at IS NULL")
        ->execute([':h' => $hash]);
    echo json_encode(["status" => "success", "message" => "Sessão encerrada."]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erro interno.", "detalhe" => $e->getMessage()]);
}
