<?php
// ===== Dependências e cabeçalhos =====
use Firebase\JWT\JWT;

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

// Validação mínima: exige 'usuario' e 'senha'.
if (!$input || empty($input['usuario']) || empty($input['senha'])) {
    http_response_code(400); // Bad Request
    echo json_encode(["status" => "error", "message" => "Campos 'usuario' e/ou 'senha' são obrigatórios."]);
    exit;
}

// "Desencapsula" os dados do payload para variáveis locais
$usuario_login = $input['usuario'];
$senha_login   = $input['senha'];

try {
    // ===== Acesso ao banco =====
    // Obtém PDO a partir da sua classe de conexão
    $pdo = Conexao::pdo();

    // Prepara consulta buscando usuário ativo (não deletado logicamente) pelo 'usuario'
    $stmt = $pdo->prepare("
        SELECT id_usuario, nome, usuario, senha, ativo
        FROM usuarios
        WHERE usuario = :usuario AND deleted_at IS NULL
        LIMIT 1
    ");
    // Bind seguro evita SQL injection
    $stmt->bindParam(':usuario', $usuario_login);
    $stmt->execute();

    // Busca um único registro como array associativo
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    // ===== Autenticação =====
    // 1) Verifica se encontrou usuário
    // 2) Compara senha enviada com o hash armazenado (password_hash/password_verify)
    if (!$usuario || !password_verify($senha_login, $usuario['senha'])) {
        http_response_code(401); // Unauthorized
        echo json_encode(["status" => "error", "message" => "Usuário ou senha inválidos."]);
        exit;
    }

    // Verifica se o usuário está ativo (ex.: 1 = ativo, 0 = inativo)
    if ((int)$usuario['ativo'] !== 1) {
        http_response_code(403); // Forbidden
        echo json_encode(["status" => "error", "message" => "Este usuário está inativo."]);
        exit;
    }

    // ===== Emissão de tokens =====
    // Define timestamps baseados no horário atual
    $now  = time();
    $exp  = $now + $config['access_ttl'];   // tempo de vida do access token
    $rexp = $now + $config['refresh_ttl'];  // tempo de vida do refresh token

    // Payload do Access Token (JWT)
    // - iss/aud: emissor e audiência (ajude a validar o token no front/back)
    // - iat/nbf/exp: emitido em, não válido antes de, expiração
    // - sub: "subject" do token (id do usuário em string)
    // - usr: payload público com dados não sensíveis do usuário
    $accessPayload = [
        'iss' => $config['issuer'],
        'aud' => $config['audience'],
        'iat' => $now,
        'nbf' => $now,
        'exp' => $exp,
        'sub' => (string)$usuario['id_usuario'],
        'usr' => [
            'id_usuario' => (int)$usuario['id_usuario'],
            'nome'       => $usuario['nome'],
            'usuario'    => $usuario['usuario'],
            'ativo'      => (int)$usuario['ativo'],
        ]
    ];

    // Assina o JWT com segredo e algoritmo HS256
    $accessToken = JWT::encode($accessPayload, $config['secret'], 'HS256');

    // ===== Refresh Token =====
    // Gera um token opaco (não-JWT) aleatório para refresh (somente servidor sabe validar)
    $refreshTokenPlain = bin2hex(random_bytes(64)); // 128 chars hex
    // Armazena apenas o hash (boa prática caso o banco vaze)
    $refreshHash = hash('sha256', $refreshTokenPlain);

    // Persiste o hash do refresh token e metadados (expiração, IP, user-agent) para auditoria/segurança
    $ins = $pdo->prepare("
        INSERT INTO usuarios_tokens (id_usuario, token_hash, expires_at, ip, user_agent)
        VALUES (:id_usuario, :token_hash, FROM_UNIXTIME(:exp), :ip, :ua)
    ");
    $ip = $_SERVER['REMOTE_ADDR'] ?? null;
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? null;
    $ins->execute([
        ':id_usuario' => $usuario['id_usuario'],
        ':token_hash' => $refreshHash,
        ':exp'        => $rexp,
        ':ip'         => $ip,
        ':ua'         => $ua,
    ]);

    // Remove a senha do array antes de retornar ao cliente
    unset($usuario['senha']);

    // ===== Resposta de sucesso =====
    http_response_code(200);
    echo json_encode([
        "status"              => "success",
        "message"             => "Login realizado com sucesso.",
        "user"                => $usuario,             // dados não sensíveis do usuário
        "access_token"        => $accessToken,         // JWT para autorização (Authorization: Bearer)
        "access_expires_at"   => date('c', $exp),      // ISO 8601
        "refresh_token"       => $refreshTokenPlain,   // token opaco a ser trocado por novo access
        "refresh_expires_at"  => date('c', $rexp)      // ISO 8601
    ]);
} catch (Throwable $e) {
    // ===== Tratamento de erro genérico =====
    // 500 (Internal Server Error) com mensagem genérica ao cliente;
    // opcional: log detalhado no servidor (NUNCA exponha stacktrace em produção).
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro interno.",
        "detalhe" => $e->getMessage()
    ]);
}
