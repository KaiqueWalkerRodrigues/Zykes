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

    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') !== false) {
        $input = json_decode(file_get_contents("php://input"), true) ?: [];
    } else {
        $input = $_POST;
    }

    // Validação
    $nome = isset($input['nome']) ? trim((string)$input['nome']) : '';
    $id_fornecedor = isset($input['id_fornecedor']) ? (int)$input['id_fornecedor'] : 0;

    if ($nome === '' || $id_fornecedor <= 0) {
        http_response_code(400);
        echo json_encode([
            "status"  => "error",
            "message" => "Campos obrigatórios: nome e id_fornecedor."
        ]);
        exit;
    }

    // Fornecedor deve existir e não estar deletado
    $chkForn = $pdo->prepare("SELECT id_fornecedor FROM lente_fornecedores WHERE id_fornecedor = ? AND deleted_at IS NULL");
    $chkForn->execute([$id_fornecedor]);
    if (!$chkForn->fetch()) {
        http_response_code(422);
        echo json_encode([
            "status"  => "error",
            "message" => "Fornecedor inválido ou deletado."
        ]);
        exit;
    }

    // (Opcional) Evita duplicidade por nome dentro do mesmo fornecedor
    $dup = $pdo->prepare("
        SELECT id_familia FROM lente_familias
        WHERE nome = ? AND id_fornecedor = ? AND deleted_at IS NULL
        LIMIT 1
    ");
    $dup->execute([$nome, $id_fornecedor]);
    if ($dup->fetch()) {
        http_response_code(409);
        echo json_encode([
            "status"  => "error",
            "message" => "Já existe uma família com esse nome para este fornecedor."
        ]);
        exit;
    }

    // Insere
    $stmt = $pdo->prepare("
        INSERT INTO lente_familias (id_fornecedor, nome, created_at, updated_at)
        VALUES (?, ?, NOW(), NOW())
    ");
    $stmt->execute([$id_fornecedor, $nome]);

    $id = (int)$pdo->lastInsertId();

    // Retorna o registro criado
    $sel = $pdo->prepare("
        SELECT id_familia, id_fornecedor, nome, created_at, updated_at, deleted_at
        FROM lente_familias
        WHERE id_familia = ?
    ");
    $sel->execute([$id]);
    $familia = $sel->fetch(PDO::FETCH_ASSOC);

    http_response_code(201);
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
