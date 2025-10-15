<?php
// CORS e conteúdo: permite requisições de qualquer origem e define métodos/headers aceitos
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=utf-8");

// Carrega sua conexão (PDO) com o banco
require_once __DIR__ . '/../Conexao.php';

// ===== Pré-flight CORS (OPTIONS) =====
// Navegadores enviam OPTIONS antes do POST para checar CORS.
// Retorne 204 (No Content) e encerre sem processar regra de negócio.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ===== Restrição de método =====
// Apenas POST deve chegar até aqui; outros métodos recebem 405 (Method Not Allowed).
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método não permitido."]);
    exit;
}

// ===== Entrada =====
// Lê o corpo JSON da requisição e transforma em array associativo.
$input = json_decode(file_get_contents("php://input"), true);

// Validação mínima: exige 'refresh_token' no payload.
if (!$input || empty($input['refresh_token'])) {
    http_response_code(400); // Bad Request
    echo json_encode([
        "status"  => "error",
        "message" => "Campo 'refresh_token' é obrigatório."
    ]);
    exit;
}

// Por segurança, nunca armazenar o refresh token em texto puro no banco.
// Gera o hash do token recebido para comparar com a coluna token_hash.
$hash = hash('sha256', $input['refresh_token']);

try {
    // ===== Acesso ao banco =====
    $pdo = Conexao::pdo();

    // Revoga o token se ainda não estiver revogado.
    // IMPORTANTE: a consulta é idempotente; chamar novamente não reverte o estado.
    $stmt = $pdo->prepare("
        UPDATE usuarios_tokens
           SET revoked_at = NOW()
         WHERE token_hash = :h
           AND revoked_at IS NULL
    ");
    $stmt->execute([':h' => $hash]);

    // Opcional: Você pode verificar $stmt->rowCount() para saber se algo foi atualizado.
    // Porém, para evitar enumeração de tokens (descobrir se um token existe ou não),
    // retornamos uma resposta genérica de sucesso mesmo quando rowCount() == 0.
    // Ex.: $revogado = $stmt->rowCount() > 0;

    http_response_code(200);
    echo json_encode([
        "status"  => "success",
        "message" => "Sessão encerrada."
        // Debug interno (não usar em produção), retorna $revogado.
        // "revogado" => $revogado
    ]);
} catch (Throwable $e) {
    // ===== Tratamento de erro genérico =====
    // 500 (Internal Server Error) com mensagem genérica ao cliente.
    // Em produção, não usar. Faça log no servidor.
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro interno.",
        // "detalhe" => $e->getMessage() // Remover em produção
    ]);
}
