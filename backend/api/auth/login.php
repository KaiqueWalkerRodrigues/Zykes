<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../Conexao.php';
require_once __DIR__ . '/../../vendor/autoload.php'; // ajuste se necessário
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
if (!$input || empty($input['usuario']) || empty($input['senha'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Campos 'usuario' e 'senha' são obrigatórios."]);
    exit;
}

$usuario_login = $input['usuario'];
$senha_login   = $input['senha'];

try {
    $pdo = Conexao::pdo();
    $stmt = $pdo->prepare("
    SELECT id_usuario, nome, usuario, senha, ativo
    FROM usuarios
    WHERE usuario = :usuario AND deleted_at IS NULL
    LIMIT 1
  ");
    $stmt->bindParam(':usuario', $usuario_login);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($senha_login, $user['senha'])) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Usuário ou senha inválidos."]);
        exit;
    }
    if ((int)$user['ativo'] !== 1) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Este usuário está inativo."]);
        exit;
    }

    $now  = time();
    $exp  = $now + $config['access_ttl'];
    $rexp = $now + $config['refresh_ttl'];

    $accessPayload = [
        'iss' => $config['issuer'],
        'aud' => $config['audience'],
        'iat' => $now,
        'nbf' => $now,
        'exp' => $exp,
        'sub' => (string)$user['id_usuario'],
        'usr' => [
            'id_usuario' => (int)$user['id_usuario'],
            'nome'       => $user['nome'],
            'usuario'    => $user['usuario'],
            'ativo'      => (int)$user['ativo'],
        ]
    ];
    $accessToken = JWT::encode($accessPayload, $config['secret'], 'HS256');

    // Refresh token
    $refreshTokenPlain = bin2hex(random_bytes(64));
    $refreshHash = hash('sha256', $refreshTokenPlain);

    $ins = $pdo->prepare("
    INSERT INTO usuarios_tokens (id_usuario, token_hash, expires_at, ip, user_agent)
    VALUES (:id_usuario, :token_hash, FROM_UNIXTIME(:exp), :ip, :ua)
  ");
    $ip = $_SERVER['REMOTE_ADDR'] ?? null;
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? null;
    $ins->execute([
        ':id_usuario' => $user['id_usuario'],
        ':token_hash' => $refreshHash,
        ':exp'        => $rexp,
        ':ip'         => $ip,
        ':ua'         => $ua,
    ]);

    unset($user['senha']);

    http_response_code(200);
    echo json_encode([
        "status"              => "success",
        "message"             => "Login realizado com sucesso.",
        "user"                => $user,
        "access_token"        => $accessToken,
        "access_expires_at"   => date('c', $exp),
        "refresh_token"       => $refreshTokenPlain,
        "refresh_expires_at"  => date('c', $rexp)
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erro interno.", "detalhe" => $e->getMessage()]);
}
