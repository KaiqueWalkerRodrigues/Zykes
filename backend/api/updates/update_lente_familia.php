<?php
// update_familia.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache');

require_once __DIR__ . '/../Conexao.php';

// Pré-flight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}


if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode([
        "status" => "error",
        "message" => "Método não permitido. Use PUT."
    ]);
    exit;
}

try {
    $pdo = Conexao::pdo();

    $input = json_decode(file_get_contents("php://input"), true);

    if (!isset($input['id_familia'])) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Campo obrigatório: id_familia."
        ]);
        exit;
    }

    $id_familia = (int)$input['id_familia'];
    $nome = isset($input['nome']) ? trim((string)$input['nome']) : null;
    $id_fornecedor = isset($input['id_fornecedor']) ? (int)$input['id_fornecedor'] : null;

    if ($id_familia <= 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ID inválido."]);
        exit;
    }

    // Verifica existência da família ativa
    $check = $pdo->prepare("SELECT id_familia, id_fornecedor FROM lente_familias WHERE id_familia = ? AND deleted_at IS NULL");
    $check->execute([$id_familia]);
    $existente = $check->fetch(PDO::FETCH_ASSOC);
    if (!$existente) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Família não encontrada."]);
        exit;
    }

    // Se for trocar fornecedor, validar fornecedor
    if ($id_fornecedor !== null) {
        if ($id_fornecedor <= 0) {
            http_response_code(422);
            echo json_encode(["status" => "error", "message" => "id_fornecedor inválido."]);
            exit;
        }
        $chkForn = $pdo->prepare("SELECT id_fornecedor FROM lente_fornecedores WHERE id_fornecedor = ? AND deleted_at IS NULL");
        $chkForn->execute([$id_fornecedor]);
        if (!$chkForn->fetch()) {
            http_response_code(422);
            echo json_encode(["status" => "error", "message" => "Fornecedor inválido ou deletado."]);
            exit;
        }
    } else {
        $id_fornecedor = (int)$existente['id_fornecedor']; // mantém o atual para checagem de duplicidade
    }

    // Não deixa nome vazio se enviado
    if ($nome !== null && $nome === '') {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Nome não pode ser vazio."]);
        exit;
    }

    // Checa duplicidade (nome + fornecedor)
    if ($nome !== null) {
        $dup = $pdo->prepare("
            SELECT id_familia FROM lente_familias
            WHERE nome = ? AND id_fornecedor = ? AND deleted_at IS NULL AND id_familia <> ?
            LIMIT 1
        ");
        $dup->execute([$nome, $id_fornecedor, $id_familia]);
        if ($dup->fetch()) {
            http_response_code(409);
            echo json_encode(["status" => "error", "message" => "Já existe uma família com esse nome para este fornecedor."]);
            exit;
        }
    }

    // Monta update dinâmico
    $sets = [];
    $params = [];

    if ($nome !== null) {
        $sets[] = "nome = ?";
        $params[] = $nome;
    }
    if (isset($input['id_fornecedor'])) {
        $sets[] = "id_fornecedor = ?";
        $params[] = $id_fornecedor;
    }

    if (empty($sets)) {
        echo json_encode(["status" => "success", "message" => "Nada para atualizar.", "data" => $existente], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    $sets[] = "updated_at = NOW()";
    $sql = "UPDATE lente_familias SET " . implode(", ", $sets) . " WHERE id_familia = ?";
    $params[] = $id_familia;

    $upd = $pdo->prepare($sql);
    $upd->execute($params);

    // Retorna atualizado
    $stmt = $pdo->prepare("SELECT id_familia, id_fornecedor, nome, created_at, updated_at, deleted_at FROM lente_familias WHERE id_familia = ?");
    $stmt->execute([$id_familia]);
    $familiaAtualizada = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "message" => "Família atualizada com sucesso.",
        "data" => $familiaAtualizada
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Erro ao atualizar família.",
        "detalhe" => $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
