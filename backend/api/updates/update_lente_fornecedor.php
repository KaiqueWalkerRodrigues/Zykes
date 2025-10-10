<?php
// update_fornecedor.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache');

require_once __DIR__ . '/../Conexao.php';

function sanitize_alnum(string $v): string
{
    return preg_replace('/[^a-zA-Z0-9]/', '', $v);
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Apenas PUT
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método não permitido. Use PUT."]);
    exit;
}

try {
    $pdo = Conexao::pdo();

    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['id_fornecedor'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Campo obrigatório: id_fornecedor."]);
        exit;
    }

    $id_fornecedor = (int)$input['id_fornecedor'];
    if ($id_fornecedor <= 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ID inválido."]);
        exit;
    }

    // Campos editáveis
    $nome = isset($input['nome']) ? trim((string)$input['nome']) : null;
    $cnpj = isset($input['cnpj']) ? sanitize_alnum((string)$input['cnpj']) : null;

    if (($nome === null || $nome === '') && ($cnpj === null || $cnpj === '')) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Informe ao menos um campo para atualizar: nome ou cnpj."]);
        exit;
    }

    // Verifica existência e não deletado
    $check = $pdo->prepare("SELECT id_fornecedor FROM lente_fornecedores WHERE id_fornecedor = ? AND deleted_at IS NULL");
    $check->execute([$id_fornecedor]);
    if (!$check->fetch()) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Fornecedor não encontrado."]);
        exit;
    }

    // Se for atualizar CNPJ, garantir unicidade
    if ($cnpj !== null && $cnpj !== '') {
        $dup = $pdo->prepare("SELECT id_fornecedor FROM lente_fornecedores WHERE cnpj = ? AND deleted_at IS NULL AND id_fornecedor <> ? LIMIT 1");
        $dup->execute([$cnpj, $id_fornecedor]);
        if ($dup->fetch()) {
            http_response_code(409);
            echo json_encode(["status" => "error", "message" => "Já existe fornecedor com esse CNPJ."]);
            exit;
        }
    }

    // Monta SQL dinâmico
    $sets = [];
    $params = [];

    if ($nome !== null && $nome !== '') {
        $sets[] = "nome = ?";
        $params[] = $nome;
    }
    if ($cnpj !== null && $cnpj !== '') {
        $sets[] = "cnpj = ?";
        $params[] = $cnpj;
    }

    $sets[] = "updated_at = NOW()";

    $sql = "UPDATE lente_fornecedores SET " . implode(", ", $sets) . " WHERE id_fornecedor = ?";
    $params[] = $id_fornecedor;

    $upd = $pdo->prepare($sql);
    $upd->execute($params);

    // Retorna atualizado
    $sel = $pdo->prepare("SELECT id_fornecedor, nome, cnpj, created_at, updated_at, deleted_at FROM lente_fornecedores WHERE id_fornecedor = ?");
    $sel->execute([$id_fornecedor]);
    $forn = $sel->fetch(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "message" => "Fornecedor atualizado com sucesso.", "data" => $forn], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erro ao atualizar fornecedor.", "detalhe" => $e->getMessage()], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
