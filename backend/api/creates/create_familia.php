<?php
// create_familia.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache');

require_once __DIR__ . '/../Conexao.php';

// Pré-flight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Garante que só aceite método POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "status"  => "error",
        "message" => "Método não permitido. Use POST."
    ]);
    exit;
}

try {
    $pdo = Conexao::pdo();

    // Lê dados do corpo: JSON (application/json) ou form (multipart/x-www-form-urlencoded)
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') !== false) {
        $input = json_decode(file_get_contents("php://input"), true) ?: [];
    } else {
        // fallback para $_POST
        $input = $_POST;
    }

    // Validação
    if (!isset($input['nome'])) {
        http_response_code(400);
        echo json_encode([
            "status"  => "error",
            "message" => "Campo obrigatório: nome."
        ]);
        exit;
    }

    $nome = trim((string)$input['nome']);
    if ($nome === '') {
        http_response_code(400);
        echo json_encode([
            "status"  => "error",
            "message" => "Nome não pode ser vazio."
        ]);
        exit;
    }

    // (Opcional) Evita duplicidade por nome entre registros não deletados
    $dup = $pdo->prepare("SELECT id_familia FROM familias WHERE nome = ? AND deleted_at IS NULL LIMIT 1");
    $dup->execute([$nome]);
    if ($dup->fetch()) {
        http_response_code(409);
        echo json_encode([
            "status"  => "error",
            "message" => "Já existe uma família com esse nome."
        ]);
        exit;
    }

    // Insere
    $stmt = $pdo->prepare("
        INSERT INTO familias (nome, created_at, updated_at)
        VALUES (?, NOW(), NOW())
    ");
    $stmt->execute([$nome]);

    $id = (int)$pdo->lastInsertId();

    // Retorna o registro criado
    $sel = $pdo->prepare("SELECT id_familia, nome, created_at, updated_at, deleted_at FROM familias WHERE id_familia = ?");
    $sel->execute([$id]);
    $familia = $sel->fetch(PDO::FETCH_ASSOC);

    http_response_code(201);
    // Se tiver rota RESTful, ajuste a URL abaixo:
    header("Location: /api/familias/$id");

    echo json_encode([
        "status"  => "success",
        "message" => "Família criada com sucesso.",
        "data"    => $familia
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao criar família.",
        "detalhe" => $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
