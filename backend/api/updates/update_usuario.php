<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../Conexao.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método não permitido."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->id_usuario) || !isset($data->nome) || !isset($data->usuario)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Campos obrigatórios (id_usuario, nome, usuario) não foram enviados."]);
    exit;
}

$id_usuario = $data->id_usuario;
$nome = $data->nome;
$usuario = $data->usuario;
$ativo = $data->ativo ?? 1;
$cargos = $data->cargos ?? [];
$setores = $data->setores ?? [];
$empresas = $data->empresas ?? [];
$agora = date('Y-m-d H:i:s');

$pdo = Conexao::pdo();
$pdo->beginTransaction();

try {
    // Monta a query dinamicamente para a senha
    $sql_senha_part = "";
    if (!empty($data->senha)) {
        $sql_senha_part = ", senha = :senha";
    }

    $stmt = $pdo->prepare(
        "UPDATE usuarios 
         SET nome = :nome, usuario = :usuario, ativo = :ativo, updated_at = :updated_at $sql_senha_part
         WHERE id_usuario = :id_usuario"
    );

    $stmt->bindParam(':nome', $nome);
    $stmt->bindParam(':usuario', $usuario);
    $stmt->bindParam(':ativo', $ativo, PDO::PARAM_INT);
    $stmt->bindParam(':updated_at', $agora);
    $stmt->bindParam(':id_usuario', $id_usuario, PDO::PARAM_INT);
    if (!empty($data->senha)) {
        $hashed_password = password_hash($data->senha, PASSWORD_DEFAULT);
        $stmt->bindParam(':senha', $hashed_password);
    }
    $stmt->execute();

    // Limpa e recria associações
    $pdo->prepare("DELETE FROM usuarios_cargos WHERE id_usuario = ?")->execute([$id_usuario]);
    $pdo->prepare("DELETE FROM usuarios_setores WHERE id_usuario = ?")->execute([$id_usuario]);
    $pdo->prepare("DELETE FROM usuarios_empresas WHERE id_usuario = ?")->execute([$id_usuario]);

    // Inserir associações
    if (!empty($cargos)) {
        $stmt_cargos = $pdo->prepare("INSERT INTO usuarios_cargos (id_usuario, id_cargo) VALUES (:id_usuario, :id_cargo)");
        foreach ($cargos as $id_cargo) {
            $stmt_cargos->execute(['id_usuario' => $id_usuario, 'id_cargo' => $id_cargo]);
        }
    }
    if (!empty($setores)) {
        $stmt_setores = $pdo->prepare("INSERT INTO usuarios_setores (id_usuario, id_setor) VALUES (:id_usuario, :id_setor)");
        foreach ($setores as $id_setor) {
            $stmt_setores->execute(['id_usuario' => $id_usuario, 'id_setor' => $id_setor]);
        }
    }
    if (!empty($empresas)) {
        $stmt_empresas = $pdo->prepare("INSERT INTO usuarios_empresas (id_usuario, id_empresa) VALUES (:id_usuario, :id_empresa)");
        foreach ($empresas as $id_empresa) {
            $stmt_empresas->execute(['id_usuario' => $id_usuario, 'id_empresa' => $id_empresa]);
        }
    }

    $pdo->commit();
    http_response_code(200);
    echo json_encode(["status" => "success", "message" => "Usuário atualizado com sucesso."]);
} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao atualizar usuário.",
        "detalhe" => $e->getMessage()
    ]);
}
