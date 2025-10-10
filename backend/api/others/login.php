<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../Conexao.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método não permitido."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

// 1. Validação dos dados de entrada
if (!$data || !isset($data->usuario) || !isset($data->senha)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Campos 'usuario' e 'senha' são obrigatórios."]);
    exit;
}

$usuario_login = $data->usuario;
$senha_login = $data->senha;

try {
    $pdo = Conexao::pdo();

    // 2. Busca o usuário no banco de dados pelo nome de usuário
    $stmt = $pdo->prepare(
        "SELECT id_usuario, nome, usuario, senha, ativo 
         FROM usuarios 
         WHERE usuario = :usuario AND deleted_at IS NULL"
    );
    $stmt->bindParam(':usuario', $usuario_login);
    $stmt->execute();

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // 3. Verifica se o usuário existe e se a senha está correta
    if (!$user || !password_verify($senha_login, $user['senha'])) {
        http_response_code(401); // Unauthorized
        echo json_encode(["status" => "error", "message" => "Usuário ou senha inválidos."]);
        exit;
    }

    // 4. Verifica se o usuário está ativo
    if ($user['ativo'] != 1) {
        http_response_code(403); // Forbidden
        echo json_encode(["status" => "error", "message" => "Este usuário está inativo. Contate o administrador."]);
        exit;
    }

    // 5. Login bem-sucedido
    // Remove a senha do array antes de enviar a resposta
    unset($user['senha']);

    // NOTA: Em uma aplicação real, aqui você geraria um Token (JWT) para gerenciar a sessão do usuário.
    // O token seria retornado na resposta e usado nas futuras requisições para autenticar o usuário.

    http_response_code(200);
    echo json_encode([
        "status"  => "success",
        "message" => "Login realizado com sucesso.",
        "user"    => $user
        // "token" => $seu_token_jwt // Exemplo de como seria com JWT
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro interno do servidor ao tentar fazer login.",
        "detalhe" => $e->getMessage()
    ]);
}
