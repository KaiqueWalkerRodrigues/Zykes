<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../Conexao.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método não permitido."]);
    exit;
}

// 1. Validação do Parâmetro de Entrada
if (!isset($_GET['id_usuario']) || !filter_var($_GET['id_usuario'], FILTER_VALIDATE_INT)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O parâmetro 'id_usuario' é obrigatório e deve ser um número inteiro."]);
    exit;
}

$id_usuario = (int)$_GET['id_usuario'];

try {
    $pdo = Conexao::pdo();

    // 2. Busca o usuário principal
    $query_usuario = "SELECT id_usuario, nome, usuario, ativo FROM usuarios WHERE id_usuario = :id_usuario AND deleted_at IS NULL";
    $stmt_usuario = $pdo->prepare($query_usuario);
    $stmt_usuario->bindParam(':id_usuario', $id_usuario, PDO::PARAM_INT);
    $stmt_usuario->execute();

    $usuario = $stmt_usuario->fetch(PDO::FETCH_ASSOC);

    // 3. Verifica se o usuário foi encontrado
    if (!$usuario) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Usuário não encontrado."]);
        exit;
    }

    // 4. Busca as associações (cargos, setores, empresas)
    $stmt_cargos = $pdo->prepare("SELECT c.id_cargo, c.nome FROM cargos c JOIN usuarios_cargos uc ON c.id_cargo = uc.id_cargo WHERE uc.id_usuario = :id_usuario");
    $stmt_cargos->execute(['id_usuario' => $id_usuario]);
    $usuario['cargos'] = $stmt_cargos->fetchAll(PDO::FETCH_ASSOC);

    $stmt_setores = $pdo->prepare("SELECT s.id_setor, s.nome FROM setores s JOIN usuarios_setores us ON s.id_setor = us.id_setor WHERE us.id_usuario = :id_usuario");
    $stmt_setores->execute(['id_usuario' => $id_usuario]);
    $usuario['setores'] = $stmt_setores->fetchAll(PDO::FETCH_ASSOC);

    $stmt_empresas = $pdo->prepare("SELECT e.id_empresa, e.nome FROM empresas e JOIN usuarios_empresas ue ON e.id_empresa = ue.id_empresa WHERE ue.id_usuario = :id_usuario");
    $stmt_empresas->execute(['id_usuario' => $id_usuario]);
    $usuario['empresas'] = $stmt_empresas->fetchAll(PDO::FETCH_ASSOC);

    // 5. Retorna a resposta com sucesso
    http_response_code(200);
    echo json_encode($usuario);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao buscar o usuário.",
        "detalhe" => $e->getMessage()
    ]);
}
