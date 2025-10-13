<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../Conexao.php';
require_once __DIR__ . '/../../vendor/autoload.php';
$config = require __DIR__ . '/../../config/jwt.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método não permitido."]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
if (!$input || empty($input['refresh_token'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Campo 'refresh_token' é obrigatório."]);
    exit;
}

$refreshPlain = $input['refresh_token'];
$refreshHash  = hash('sha256', $refreshPlain);

try {
    $pdo = Conexao::pdo();

    $stmt = $pdo->prepare("
    SELECT t.id_usuario_token, t.id_usuario, t.expires_at, t.revoked_at, u.nome, u.usuario, u.ativo
    FROM usuarios_tokens t
    JOIN usuarios u ON u.id_usuario = t.id_usuario
    WHERE t.token_hash = :hash
    LIMIT 1
  ");
    $stmt->execute([':hash' => $refreshHash]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Refresh token inválido."]);
        exit;
    }
    if ($row['revoked_at'] !== null || strtotime($row['expires_at']) <= time()) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Refresh token expirado ou revogado."]);
        exit;
    }
    if ((int)$row['ativo'] !== 1) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Usuário inativo."]);
        exit;
    }

    // (Opcional) Rotação: revoga o anterior e cria um novo refresh
    $pdo->beginTransaction();
    $pdo->prepare("UPDATE usuarios_tokens SET revoked_at = NOW() WHERE id_usuario_token = :id")
        ->execute([':id' => $row['id_usuario_token']]);

    $now  = time();
    $exp  = $now + $config['access_ttl'];
    $rexp = $now + $config['refresh_ttl'];

    $accessPayload = [
        'iss' => $config['issuer'],
        'aud' => $config['audience'],
        'iat' => $now,
        'nbf' => $now,
        'exp' => $exp,
        'sub' => (string)$row['id_usuario'],
        'usr' => [
            'id_usuario' => (int)$row['id_usuario'],
            'nome'       => $row['nome'],
            'usuario'    => $row['usuario'],
            'ativo'      => (int)$row['ativo'],
        ]
    ];
    $accessToken = JWT::encode($accessPayload, $config['secret'], 'HS256');

    $newRefreshPlain = bin2hex(random_bytes(64));
    $newRefreshHash  = hash('sha256', $newRefreshPlain);
    $ins = $pdo->prepare("
    INSERT INTO usuarios_tokens (id_usuario, token_hash, expires_at, ip, user_agent)
    VALUES (:id_usuario, :token_hash, FROM_UNIXTIME(:exp), :ip, :ua)
  ");
    $ip = $_SERVER['REMOTE_ADDR'] ?? null;
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? null;
    $ins->execute([
        ':id_usuario' => $row['id_usuario'],
        ':token_hash' => $newRefreshHash,
        ':exp'        => $rexp,
        ':ip'         => $ip,
        ':ua'         => $ua,
    ]);

    $pdo->commit();

    echo json_encode([
        "status"              => "success",
        "access_token"        => $accessToken,
        "access_expires_at"   => date('c', $exp),
        "refresh_token"       => $newRefreshPlain,
        "refresh_expires_at"  => date('c', $rexp)
    ]);
} catch (Throwable $e) {
    if ($pdo?->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erro interno.", "detalhe" => $e->getMessage()]);
}
