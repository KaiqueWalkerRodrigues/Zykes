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

/** Validações para atender ao NOT NULL do schema */
$nome  = trim($data->nome);

/** CPF: obrigatório e com 11 dígitos */
$cpf = isset($data->cpf) ? preg_replace('/\D+/', '', $data->cpf) : '';
if (strlen($cpf) !== 11) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "CPF inválido (11 dígitos)."]);
    exit;
}

/** Data de nascimento: obrigatória, formato AAAA-MM-DD */
$data_nascimento = isset($data->data_nascimento) ? trim($data->data_nascimento) : '';
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data_nascimento)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Data de nascimento inválida. Use AAAA-MM-DD."]);
    exit;
}

/** Sexo: obrigatório → tinyint (M=1,F=2,O=3) */
$sexo_map = ['M' => 1, 'F' => 2, 'O' => 3];
$sexo_in  = isset($data->sexo) ? strtoupper(trim($data->sexo)) : '';
$sexo = $sexo_map[$sexo_in] ? $sexo_map[$sexo_in] : null;

/** Contato: obrigatório (char(15) no schema) */
$contato = isset($data->contato) ? trim($data->contato) : '';
if ($contato === '') {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O campo 'contato' é obrigatório."]);
    exit;
}
/** opcional: normalizar para caber em char(15) */
$contato = substr(preg_replace('/\s+/', '', $contato), 0, 15);

/** Saldo: obrigatório (double NOT NULL) */
$saldo = (float)0.00;

/** Campos opcionais (podem ser NULL) — o schema aceita NULL neles */
$cep      = isset($data->cep) ? preg_replace('/\D+/', '', $data->cep) : null; // cuidado: schema usa char(6)
$endereco = isset($data->endereco) ? trim($data->endereco) : null;
$bairro   = isset($data->bairro) ? trim($data->bairro) : null;
$numero   = isset($data->numero) ? trim($data->numero) : null;
$uf       = isset($data->uf) ? strtoupper(trim($data->uf)) : null;
$agora    = date('Y-m-d H:i:s');

try {
    $pdo = Conexao::pdo();
    // se sua Conexao não fizer isso, ajuda a obter mensagens claras:
    // $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->prepare(
        "INSERT INTO clientes
      (nome, cpf, data_nascimento, sexo, contato, saldo, cep, endereco, bairro, numero, uf, created_at, updated_at)
     VALUES
      (:nome,:cpf,:data_nascimento,:sexo,:contato,:saldo,:cep,:endereco,:bairro,:numero,:uf,:agora,:agora)"
    );

    $stmt->bindParam(':nome', $nome);
    $stmt->bindParam(':cpf', $cpf);
    $stmt->bindParam(':data_nascimento', $data_nascimento);
    $stmt->bindParam(':sexo', $sexo, PDO::PARAM_INT);
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
        "status" => "success",
        "message" => "Cliente cadastrado com sucesso.",
        "id_cliente" => $novo_id
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao cadastrar o cliente.",
        "detalhe" => $e->getMessage()  // deixe temporariamente para depurar
    ]);
}
