<?php
// get_familia.php

// Cabeçalhos para permitir requisições de outras origens (CORS) e definir o tipo de conteúdo.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS"); // <<< ALTERADO: Permite POST
header("Access-Control-Allow-Headers: Content-Type, If-None-Match");
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache'); // Importante para o ETag funcionar corretamente.

// Inclui o arquivo de conexão com o banco de dados.
require_once __DIR__ . '/../Conexao.php';

// Resposta para a requisição pré-vôo (pre-flight) do CORS.
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

    // Valida se o ID da família foi fornecido.
    if (!isset($input['id_familia'])) {
        http_response_code(400); // 400 Bad Request
        echo json_encode([
            "status"  => "error",
            "message" => "Campo obrigatório: id_familia."
        ]);
        exit;
    }

    // Valida se o ID é um número inteiro válido e positivo.
    $id_familia = (int)$input['id_familia'];
    if ($id_familia <= 0) {
        http_response_code(400); // 400 Bad Request
        echo json_encode([
            "status"  => "error",
            "message" => "ID inválido."
        ]);
        exit;
    }

    // Prepara e executa a consulta para buscar uma única família que não foi deletada.
    // Adicionamos os campos de timestamp para consistência e para o ETag.
    $stmt = $pdo->prepare("
        SELECT id_familia, id_fornecedor, nome, created_at, updated_at, deleted_at
        FROM lente_familias
        WHERE id_familia = ? AND deleted_at IS NULL
        LIMIT 1
    ");
    $stmt->execute([$id_familia]);
    $familia = $stmt->fetch(PDO::FETCH_ASSOC);

    // Se nenhum registro for encontrado, retorna um erro 404.
    if (!$familia) {
        http_response_code(404); // 404 Not Found
        echo json_encode([
            "status"  => "error",
            "message" => "Família de lente não encontrada."
        ]);
        exit;
    }

    // Gera um ETag único para este registro.
    $etagBase = ($familia['updated_at'] ?? $familia['created_at']) . ':' . $familia['id_familia'];
    $etag = '"' . md5($etagBase) . '"';
    header("ETag: $etag");

    // Verifica o ETag do cliente para responder com 304 se os dados não mudaram.
    $ifNoneMatch = $_SERVER['HTTP_IF_NONE_MATCH'] ?? null;
    if ($ifNoneMatch && trim($ifNoneMatch) === $etag) {
        http_response_code(304); // 304 Not Modified
        exit;
    }

    // Envia a resposta com sucesso.
    echo json_encode([
        "status" => "success",
        "data"   => $familia
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    // Em caso de erro com o banco de dados, retorna um erro 500.
    http_response_code(500); // 500 Internal Server Error
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao buscar a família de lente.",
        "detalhe" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
