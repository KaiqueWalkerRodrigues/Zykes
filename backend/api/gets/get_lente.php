<?php
// api/gets/get_lente.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS, HEAD");
header("Access-Control-Allow-Headers: Content-Type, If-None-Match");
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache'); // Permite que o ETag funcione corretamente

require_once __DIR__ . '/../Conexao.php';

// Resposta para a requisição pré-vôo (pre-flight) do CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Valida se o id_lente foi passado como parâmetro na URL
if (!isset($_GET['id_lente']) || !is_numeric($_GET['id_lente'])) {
    http_response_code(400); // Bad Request
    echo json_encode(["status" => "error", "message" => "O parâmetro 'id_lente' é obrigatório e deve ser numérico."]);
    exit;
}

$id_lente = (int)$_GET['id_lente'];

try {
    $pdo = Conexao::pdo();

    // Prepara a consulta para buscar uma lente específica que não esteja deletada
    $stmt = $pdo->prepare("
        SELECT * FROM lentes
        WHERE id_lente = :id_lente AND deleted_at IS NULL
    ");
    $stmt->bindParam(':id_lente', $id_lente, PDO::PARAM_INT);
    $stmt->execute();

    // Usa fetch() em vez de fetchAll() pois esperamos apenas um resultado
    $lente = $stmt->fetch(PDO::FETCH_ASSOC);

    // Se a lente for encontrada, prossegue
    if ($lente) {
        // Lógica de ETag para cache do recurso individual
        $payloadParaHash = json_encode($lente);
        $etag = '"' . md5($payloadParaHash) . '"';
        header("ETag: $etag");

        // Se o cliente já tem a versão mais recente, retorna 304 Not Modified
        if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH']) === $etag) {
            http_response_code(304);
            exit;
        }

        // Caso contrário, retorna os dados da lente
        http_response_code(200); // OK
        echo $payloadParaHash;
    } else {
        // Se a consulta não retornar nada, a lente não existe ou foi deletada
        http_response_code(404); // Not Found
        echo json_encode(["status" => "error", "message" => "Lente não encontrada."]);
    }
} catch (PDOException $e) {
    http_response_code(500); // Internal Server Error
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao buscar a lente.",
        "detalhe" => $e->getMessage()
    ]);
}
