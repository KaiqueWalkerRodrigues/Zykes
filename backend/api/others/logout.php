<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization"); // Permite o header de autorização, caso o front-end o envie
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método não permitido."]);
    exit;
}

// Em um sistema stateless (baseado em token), o logout é tratado principalmente no lado do cliente,
// que descarta o token de autenticação.
//
// Este script serve como um ponto de extremidade formal para a ação de logout.
// Em implementações mais avançadas, este script poderia:
// 1. Adicionar o token a uma "lista negra" (blacklist) para invalidá-lo antes do tempo de expiração.
// 2. Invalidar um "refresh token" armazenado no banco de dados.
// 3. Limpar um cookie HttpOnly, se o token for armazenado dessa forma.

// Para nossa implementação atual, simplesmente retornamos uma confirmação de sucesso.
http_response_code(200);
echo json_encode([
    "status" => "success",
    "message" => "Logout realizado com sucesso."
]);
