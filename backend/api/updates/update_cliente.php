<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../Conexao.php';

/** Pré-flight CORS */
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/** Método permitido */
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método não permitido."]);
    exit;
}

/** Entrada JSON */
$input = json_decode(file_get_contents("php://input"), true);
if (!$input || !isset($input['id_cliente'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Campo obrigatório 'id_cliente' não enviado."]);
    exit;
}

$id_cliente = (int)$input['id_cliente'];
if ($id_cliente <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "id_cliente inválido."]);
    exit;
}

/** Helpers */
$onlyDigits = fn($v) => preg_replace('/\D+/', '', (string)$v);

$validarData = function ($date) {
    if ($date === null || $date === '') return false;
    $p = explode('-', $date);
    if (count($p) !== 3) return false;
    [$y, $m, $d] = $p;
    return ctype_digit($y . $m . $d) && checkdate((int)$m, (int)$d, (int)$y);
};

/** Campos permitidos + sanitização */
$permitidos = [
    'nome'            => fn($v) => trim((string)$v),
    'cpf'             => fn($v) => $onlyDigits($v),          // char(11) no banco
    'data_nascimento' => fn($v) => $v,                       // valida abaixo
    'sexo'            => fn($v) => (int)$v,                  // 1=H, 2=M
    'contato'         => fn($v) => $onlyDigits($v),          // char(15)
    'saldo'           => fn($v) => $v,                       // double(12,2)
    'cep'             => fn($v) => $onlyDigits($v),          // char(10) (armazenando só dígitos)
    'endereco'        => fn($v) => trim((string)$v),
    'cidade'        => fn($v) => trim((string)$v),
    'bairro'          => fn($v) => trim((string)$v),
    'numero'          => fn($v) => trim((string)$v),
    'uf'              => fn($v) => strtoupper(trim((string)$v)), // normalizamos p/ 2 letras
];

$toUpdate = [];
$params   = [];

/** Monta UPDATE parcial e validações */
foreach ($permitidos as $campo => $sanitize) {
    if (array_key_exists($campo, $input)) {
        $val = $sanitize($input[$campo]);

        if ($campo === 'cpf' && $val !== null) {
            if ($val !== '' && strlen($val) !== 11) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "CPF deve ter 11 dígitos."]);
                exit;
            }
        }

        if ($campo === 'contato' && $val !== null) {
            // Aceita de 10 a 15 dígitos (fixo/cel).
            if ($val !== '' && (strlen($val) < 10 || strlen($val) > 15)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Contato deve ter entre 10 e 15 dígitos."]);
                exit;
            }
        }

        if ($campo === 'data_nascimento' && $val !== null && $val !== '') {
            if (!$validarData($val)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "data_nascimento inválida. Use YYYY-MM-DD."]);
                exit;
            }
        }

        if ($campo === 'sexo' && $val !== null) {
            if (!in_array($val, [1, 2], true)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "sexo deve ser 1 (homem) ou 2 (mulher)."]);
                exit;
            }
        }

        if ($campo === 'saldo' && $val !== null && $val !== '') {
            if (!is_numeric($val)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "saldo deve ser numérico."]);
                exit;
            }
            $val = number_format((float)$val, 2, '.', '');
        }

        if ($campo === 'uf' && $val !== null && $val !== '') {
            // Apesar do banco aceitar até 100 chars, padronizamos para 2 letras.
            if (!preg_match('/^[A-Z]{2}$/', $val)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "UF inválida. Use a sigla com 2 letras."]);
                exit;
            }
        }

        // Atenção: não transformamos campos em NULL para não violar NOT NULL do schema.
        // Só enviaremos o que vier no payload.

        $toUpdate[] = "{$campo} = :{$campo}";
        $params[":{$campo}"] = ($val === '' ? null : $val);
    }
}

if (empty($toUpdate)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Nenhum campo para atualizar foi enviado."]);
    exit;
}

$toUpdate[] = "updated_at = NOW()";

try {
    $pdo = Conexao::pdo();

    // Garante que o registro existe e não está deletado
    $check = $pdo->prepare("SELECT id_cliente FROM clientes WHERE id_cliente = :id AND deleted_at IS NULL");
    $check->bindValue(':id', $id_cliente, PDO::PARAM_INT);
    $check->execute();
    if (!$check->fetch(PDO::FETCH_ASSOC)) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Cliente não encontrado."]);
        exit;
    }

    $sql = "UPDATE clientes SET " . implode(', ', $toUpdate) . " WHERE id_cliente = :id_cliente AND deleted_at IS NULL";
    $stmt = $pdo->prepare($sql);
    foreach ($params as $k => $v) {
        $stmt->bindValue($k, $v);
    }
    $stmt->bindValue(':id_cliente', $id_cliente, PDO::PARAM_INT);
    $stmt->execute();

    http_response_code(200);
    echo json_encode(["status" => "success", "message" => "Cliente atualizado com sucesso."]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao atualizar o cliente.",
        "detalhe" => $e->getMessage()
    ]);
}
