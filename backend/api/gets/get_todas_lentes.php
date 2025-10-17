<?php
// api/gets/get_lentes.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS, HEAD");
header("Access-Control-Allow-Headers: Content-Type, If-None-Match");
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache');

require_once __DIR__ . '/../Conexao.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $pdo = Conexao::pdo();

    // <<< ALTERADO: Query com LEFT JOIN para buscar nomes das tabelas relacionadas
    $stmt = $pdo->prepare("
        SELECT
            l.id_lente,
            l.id_familia,
            l.id_indice,
            l.id_tratamento,
            l.valor_venda,
            l.valor_compra,
            l.created_at,
            l.updated_at,
            lf.nome AS nome_familia,
            li.nome AS nome_indice,
            lt.nome AS nome_tratamento
        FROM
            lentes AS l
        LEFT JOIN
            lente_familias AS lf ON l.id_familia = lf.id_familia
        LEFT JOIN
            lente_indices AS li ON l.id_indice = li.id_indice_lente
        LEFT JOIN
            lente_tratamentos AS lt ON l.id_tratamento = lt.id_tratamento_lente
        WHERE
            l.deleted_at IS NULL
    ");
    $stmt->execute();
    $lentes = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    // Lógica de ETag para cache (permanece a mesma)
    $payloadParaHash = json_encode($lentes);
    $etag = '"' . md5($payloadParaHash) . '"';
    header("ETag: $etag");

    if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH']) === $etag) {
        http_response_code(304);
        exit;
    }

    echo $payloadParaHash;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao buscar as lentes.",
        "detalhe" => $e->getMessage()
    ]);
}
