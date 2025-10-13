<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

require_once __DIR__ . '/../../../vendor/autoload.php';
$config = require __DIR__ . '/../../../config/jwt.php';

function getAuthorizationHeader(): ?string
{
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) return trim($_SERVER['HTTP_AUTHORIZATION']);
    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        if (isset($headers['Authorization'])) return trim($headers['Authorization']);
    }
    return null;
}

function require_auth(): array
{
    global $config;
    $hdr = getAuthorizationHeader();
    if (!$hdr || stripos($hdr, 'Bearer ') !== 0) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Token ausente."]);
        exit;
    }
    $jwt = trim(substr($hdr, 7));
    try {
        $decoded = JWT::decode($jwt, new Key($config['secret'], 'HS256'));
        return [
            'id_usuario' => (int)($decoded->usr->id_usuario ?? $decoded->sub ?? 0),
            'payload'    => (array)$decoded
        ];
    } catch (Throwable $e) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Token inválido/expirado.", "detalhe" => $e->getMessage()]);
        exit;
    }
}
