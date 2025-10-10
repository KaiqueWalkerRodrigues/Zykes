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

try {
    $pdo = Conexao::pdo();

    $query = "SELECT id_usuario, nome, usuario, ativo FROM usuarios WHERE deleted_at IS NULL ORDER BY nome ASC";
    $stmt_usuarios = $pdo->prepare($query);
    $stmt_usuarios->execute();
    $usuarios = $stmt_usuarios->fetchAll(PDO::FETCH_ASSOC);

    $stmt_cargos = $pdo->prepare("SELECT c.id_cargo, c.nome FROM cargos c JOIN usuarios_cargos uc ON c.id_cargo = uc.id_cargo WHERE uc.id_usuario = :id_usuario");
    $stmt_setores = $pdo->prepare("SELECT s.id_setor, s.nome FROM setores s JOIN usuarios_setores us ON s.id_setor = us.id_setor WHERE us.id_usuario = :id_usuario");
    $stmt_empresas = $pdo->prepare("SELECT e.id_empresa, e.nome FROM empresas e JOIN usuarios_empresas ue ON e.id_empresa = ue.id_empresa WHERE ue.id_usuario = :id_usuario");

    foreach ($usuarios as &$usuario) { // Usando referência (&) para modificar o array diretamente
        $id = $usuario['id_usuario'];

        $stmt_cargos->execute(['id_usuario' => $id]);
        $usuario['cargos'] = $stmt_cargos->fetchAll(PDO::FETCH_ASSOC);

        $stmt_setores->execute(['id_usuario' => $id]);
        $usuario['setores'] = $stmt_setores->fetchAll(PDO::FETCH_ASSOC);

        $stmt_empresas->execute(['id_usuario' => $id]);
        $usuario['empresas'] = $stmt_empresas->fetchAll(PDO::FETCH_ASSOC);
    }

    $json_data = json_encode($usuarios);
    $etag = md5($json_data);

    if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH'], '"') === $etag) {
        header("HTTP/1.1 304 Not Modified");
        exit();
    }

    header('Etag: "' . $etag . '"');
    http_response_code(200);
    echo $json_data;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao buscar usuários.",
        "detalhe" => $e->getMessage()
    ]);
}
