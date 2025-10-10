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

if (!$data || !isset($data->nome) || !isset($data->usuario) || !isset($data->senha)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Campos obrigatórios (nome, usuario, senha) não foram enviados."]);
    exit;
}

$nome = $data->nome;
$usuario = $data->usuario;
$senha = $data->senha;
$ativo = $data->ativo ?? 1;
$cargos = $data->cargos ?? [];
$setores = $data->setores ?? [];
$empresas = $data->empresas ?? [];
$agora = date('Y-m-d H:i:s');
$hashed_password = password_hash($senha, PASSWORD_DEFAULT);

$pdo = Conexao::pdo();
$pdo->beginTransaction();

try {
    $stmt = $pdo->prepare(
        "INSERT INTO usuarios (nome, usuario, senha, ativo, created_at, updated_at)
         VALUES (:nome, :usuario, :senha, :ativo, :created_at, :updated_at)"
    );

    $stmt->bindParam(':nome', $nome);
    $stmt->bindParam(':usuario', $usuario);
    $stmt->bindParam(':senha', $hashed_password);
    $stmt->bindParam(':ativo', $ativo, PDO::PARAM_INT);
    $stmt->bindParam(':created_at', $agora);
    $stmt->bindParam(':updated_at', $agora);
    $stmt->execute();
    $id_usuario = $pdo->lastInsertId();

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
    http_response_code(201);
    echo json_encode([
        "status" => "success",
        "message" => "Usuário criado com sucesso.",
        "id_usuario" => $id_usuario
    ]);
} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao criar usuário.",
        "detalhe" => $e->getMessage()
    ]);
}
