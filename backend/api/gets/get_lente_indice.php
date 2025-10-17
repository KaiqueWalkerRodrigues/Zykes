<?php
// get_lente_indice.php

// Cabeçalhos para permitir requisições de outras origens (CORS) e definir o tipo de conteúdo.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, If-None-Match");
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache'); // Importante para o ETag funcionar corretamente.

// Inclui o arquivo de conexão com o banco de dados.
require_once __DIR__ . '/../Conexao.php';

// Resposta para a requisição pré-vôo (pre-flight) do CORS.
// O navegador envia uma requisição OPTIONS antes do POST para verificar as permissões.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204); // 204 No Content
    exit;
}

// Garante que o método da requisição seja POST.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // 405 Method Not Allowed
    echo json_encode([
        "status"  => "error",
        "message" => "Método não permitido. Use POST."
    ]);
    exit;
}

try {
    // Obtém a instância da conexão PDO.
    $pdo = Conexao::pdo();

    // Lê os dados do corpo da requisição, seja JSON ou formulário.
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') !== false) {
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
    } else {
        $input = $_POST;
    }

    // Valida se o ID foi fornecido.
    if (!isset($input['id_indice_lente'])) {
        http_response_code(400); // 400 Bad Request
        echo json_encode([
            "status"  => "error",
            "message" => "Campo obrigatório: id_indice_lente."
        ]);
        exit;
    }

    // Valida se o ID é um número inteiro válido e positivo.
    $id_indice_lente = (int)$input['id_indice_lente'];
    if ($id_indice_lente <= 0) {
        http_response_code(400); // 400 Bad Request
        echo json_encode([
            "status"  => "error",
            "message" => "ID inválido."
        ]);
        exit;
    }

    // Prepara e executa a consulta para buscar um único índice que não foi deletado.
    $stmt = $pdo->prepare("
        SELECT id_indice_lente, nome, created_at, updated_at, deleted_at
        FROM lente_indices
        WHERE id_indice_lente = ? AND deleted_at IS NULL
        LIMIT 1
    ");
    $stmt->execute([$id_indice_lente]);
    $indice = $stmt->fetch(PDO::FETCH_ASSOC);

    // Se nenhum registro for encontrado, retorna um erro 404.
    if (!$indice) {
        http_response_code(404); // 404 Not Found
        echo json_encode([
            "status"  => "error",
            "message" => "Índice de refração não encontrado."
        ]);
        exit;
    }

    // Gera um ETag único para este registro, baseado em seu ID e data da última atualização.
    // Isso é útil para o cache do lado do cliente.
    $etagBase = ($indice['updated_at'] ?? $indice['created_at']) . ':' . $indice['id_indice_lente'];
    $etag = '"' . md5($etagBase) . '"'; // As aspas são parte do padrão HTTP para ETags.
    header("ETag: $etag");

    // Verifica se o cliente enviou o cabeçalho 'If-None-Match'.
    $ifNoneMatch = $_SERVER['HTTP_IF_NONE_MATCH'] ?? null;
    if ($ifNoneMatch && trim($ifNoneMatch) === $etag) {
        // Se o ETag do cliente for igual ao do servidor, os dados não mudaram.
        http_response_code(304); // 304 Not Modified
        exit;
    }

    // Se os dados são novos para o cliente, envia a resposta com sucesso.
    echo json_encode([
        "status" => "success",
        "data"   => $indice
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    // Em caso de erro com o banco de dados, retorna um erro 500.
    http_response_code(500); // 500 Internal Server Error
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao buscar o índice de refração.",
        "detalhe" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
