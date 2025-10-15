<?php
// ===== Dependências e cabeçalhos =====
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// CORS e conteúdo: permite requisições de qualquer origem e define métodos/headers aceitos
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=utf-8");

// Carrega conexão com DB, autoloader do Composer e configurações JWT
require_once __DIR__ . '/../Conexao.php';
require_once __DIR__ . '/../../vendor/autoload.php';
$config = require __DIR__ . '/../../config/jwt.php';

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
// Validação mínima: exige 'refresh_token'.
if (!$input || empty($input['refresh_token'])) {
    http_response_code(400); // Bad Request
    echo json_encode(["status" => "error", "message" => "Campo 'refresh_token' é obrigatório."]);
    exit;
}

#Armaze o hash
$refreshPlain = $input['refresh_token'];
$refreshHash  = hash('sha256', $refreshPlain);

try {
    // ===== Acesso ao banco =====
    //Obtém PDO a partir da sua classe de conexão
    $pdo = Conexao::pdo();

    #Prepara consulta buscando token atrávez do hash
    $stmt = $pdo->prepare("
        SELECT t.id_usuario_token, t.id_usuario, t.expires_at, t.revoked_at, 
               u.nome, u.usuario, u.ativo
        FROM usuarios_tokens t
        JOIN usuarios u ON u.id_usuario = t.id_usuario
        WHERE t.token_hash = :hash
        LIMIT 1
    ");
    #Bind seguro evita SQL injection
    $stmt->execute([':hash' => $refreshHash]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    #Erro se não encontrar o token -> erro
    if (!$row) {
        http_response_code(401); // Unauthorized
        echo json_encode(["status" => "error", "message" => "Refresh token inválido."]);
        exit;
    }

    #Se expirado ou revogado -> erro
    if ($row['revoked_at'] !== null || strtotime($row['expires_at']) <= time()) {
        http_response_code(401); // Unauthorized
        echo json_encode(["status" => "error", "message" => "Refresh token expirado ou revogado."]);
        exit;
    }

    #Se usuário inativo -> erro
    if ((int)$row['ativo'] !== 1) {
        http_response_code(403); // Forbidden
        echo json_encode(["status" => "error", "message" => "Usuário inativo."]);
        exit;
    }

    #Começar transação pra não ter inconsistência
    $pdo->beginTransaction();

    #Revogar o refresh token antigo
    $pdo->prepare("UPDATE usuarios_tokens SET revoked_at = NOW() WHERE id_usuario_token = :id")
        ->execute([':id' => $row['id_usuario_token']]);

    #Tempos base dos tokens (em segundos)
    $now  = time();
    $exp  = $now + $config['access_ttl'];   # tempo de vida do access token
    $rexp = $now + $config['refresh_ttl'];  # tempo de vida do refresh token

    #Montar payload do access token
    $accessPayload = [
        'iss' => $config['issuer'],
        'aud' => $config['audience'],
        'iat' => $now,
        'nbf' => $now,
        'exp' => $exp,
        'sub' => (string)$row['id_usuario'],
        'usr' => [
            'id_usuario' => (int)$row['id_usuario'],
            'nome'       => $row['nome'],
            'usuario'    => $row['usuario'],
            'ativo'      => (int)$row['ativo'],
        ]
    ];

    #Gerar o JWT
    $accessToken = JWT::encode($accessPayload, $config['secret'], 'HS256');

    #Gerar novo refresh token (rotação)
    $newRefreshPlain = bin2hex(random_bytes(64));
    $newRefreshHash  = hash('sha256', $newRefreshPlain);

    #Salvar novo refresh token no banco
    $ins = $pdo->prepare("
        INSERT INTO usuarios_tokens (id_usuario, token_hash, expires_at, ip, user_agent)
        VALUES (:id_usuario, :token_hash, FROM_UNIXTIME(:exp), :ip, :ua)
    ");
    $ip = $_SERVER['REMOTE_ADDR'] ?? null;      # ip do cliente
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? null;  # navegador/dispositivo
    $ins->execute([
        ':id_usuario' => $row['id_usuario'],
        ':token_hash' => $newRefreshHash,
        ':exp'        => $rexp,
        ':ip'         => $ip,
        ':ua'         => $ua,
    ]);

    #Confirmar transação
    $pdo->commit();

    #Retorno dos novos tokens
    echo json_encode([
        "status"              => "success",
        "access_token"        => $accessToken,
        "access_expires_at"   => date('c', $exp),
        "refresh_token"       => $newRefreshPlain,
        "refresh_expires_at"  => date('c', $rexp)
    ]);
} catch (Throwable $e) {
    #Rollback se der erro no meio da transação
    if ($pdo?->inTransaction()) $pdo->rollBack();

    #Erro interno — não exibir detalhes em produção
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro interno.",
        "detalhe" => $e->getMessage()  #Debug para erros (só usar em Desenvolvimento)
    ]);
}
