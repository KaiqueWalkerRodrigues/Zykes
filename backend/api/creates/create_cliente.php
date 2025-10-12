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

if (!$data || !isset($data->nome) || empty(trim($data->nome))) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O campo 'nome' é obrigatório."]);
    exit;
}

$nome = trim($data->nome);
$cpf = isset($data->cpf) ? trim($data->cpf) : null;
$data_nascimento = isset($data->data_nascimento) ? $data->data_nascimento : null;
$sexo = isset($data->sexo) ? trim($data->sexo) : null;
$contato = isset($data->contato) ? trim($data->contato) : null;
$saldo = isset($data->saldo) ? $data->saldo : 0.00;
$cep = isset($data->cep) ? trim($data->cep) : null;
$endereco = isset($data->endereco) ? trim($data->endereco) : null;
$bairro = isset($data->bairro) ? trim($data->bairro) : null;
$numero = isset($data->numero) ? trim($data->numero) : null;
$uf = isset($data->uf) ? trim($data->uf) : null;
$agora = date('Y-m-d H:i:s');

try {
    $pdo = Conexao::pdo();
    $stmt = $pdo->prepare(
        "INSERT INTO clientes (nome, cpf, data_nascimento, sexo, contato, saldo, cep, endereco, bairro, numero, uf, created_at, updated_at) 
         VALUES (:nome, :cpf, :data_nascimento, :sexo, :contato, :saldo, :cep, :endereco, :bairro, :numero, :uf, :agora, :agora)"
    );

    $stmt->bindParam(':nome', $nome);
    $stmt->bindParam(':cpf', $cpf);
    $stmt->bindParam(':data_nascimento', $data_nascimento);
    $stmt->bindParam(':sexo', $sexo);
    $stmt->bindParam(':contato', $contato);
    $stmt->bindParam(':saldo', $saldo);
    $stmt->bindParam(':cep', $cep);
    $stmt->bindParam(':endereco', $endereco);
    $stmt->bindParam(':bairro', $bairro);
    $stmt->bindParam(':numero', $numero);
    $stmt->bindParam(':uf', $uf);
    $stmt->bindParam(':agora', $agora);
    $stmt->execute();

    $novo_id = $pdo->lastInsertId();

    http_response_code(201);
    echo json_encode([
        "status"     => "success",
        "message"    => "Cliente cadastrado com sucesso.",
        "id_cliente" => $novo_id
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao cadastrar o cliente.",
        "detalhe" => $e->getMessage()
    ]);
}
