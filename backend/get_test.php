<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json; charset=utf-8');

// Exemplo: pegue do banco de dados em produção.
// Aqui, simulamos os dados:
$produtos = [];
for ($i = 1; $i <= 100; $i++) {
    $produtos[] = [
        'id_familia' => $i,
        'familia'    => "Familia $i",
    ];
}

// Gere uma ETag com base no conteúdo atual (hash)
$etag = '"' . md5(json_encode($produtos)) . '"';
header("ETag: $etag");

// Se o cliente enviar If-None-Match igual, devolve 304 (nada mudou)
if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH']) === $etag) {
    http_response_code(304);
    exit;
}

// Caso contrário, devolve o JSON
echo json_encode($produtos, JSON_UNESCAPED_UNICODE);
