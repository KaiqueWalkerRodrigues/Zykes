<?php
// create_fornecedor.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache');

require_once __DIR__ . '/../Conexao.php';

function sanitize_alnum(string $v): string
{
    // Mantém apenas letras (a-z, A-Z) e números (0-9)
    return preg_replace('/[^a-zA-Z0-9]/', '', $v);
}

// Pré-flight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Apenas POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método não permitido. Use POST."]);
    exit;
}

try {
    $pdo = Conexao::pdo();

    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') !== false) {
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
    } else {
        $input = $_POST;
    }

    $nome = isset($input['nome']) ? trim((string)$input['nome']) : '';
    $cnpj = isset($input['cnpj']) ? sanitize_alnum((string)$input['cnpj']) : '';

    if ($nome === '' || $cnpj === '') {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Campos obrigatórios: nome e cnpj."]);
        exit;
    }

    // Evita duplicidade por CNPJ entre ativos (não deletados)
    $dup = $pdo->prepare("SELECT id_fornecedor FROM lente_fornecedores WHERE cnpj = ? AND deleted_at IS NULL LIMIT 1");
    $dup->execute([$cnpj]);
    if ($dup->fetch()) {
        http_response_code(409);
        echo json_encode(["status" => "error", "message" => "Já existe fornecedor com esse CNPJ."]);
        exit;
    }

    // Insert
    $ins = $pdo->prepare("
        INSERT INTO lente_fornecedores (nome, cnpj, created_at, updated_at)
        VALUES (?, ?, NOW(), NOW())
    ");
    $ins->execute([$nome, $cnpj]);
    $id = (int)$pdo->lastInsertId();

    // Retorna criado
    $sel = $pdo->prepare("SELECT id_fornecedor, nome, cnpj, created_at, updated_at, deleted_at FROM lente_fornecedores WHERE id_fornecedor = ?");
    $sel->execute([$id]);
    $forn = $sel->fetch(PDO::FETCH_ASSOC);

    http_response_code(201);
    header("Location: /api/fornecedores/$id");
    echo json_encode(["status" => "success", "message" => "Fornecedor criado com sucesso.", "data" => $forn], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erro ao criar fornecedor.", "detalhe" => $e->getMessage()], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
