<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../Conexao.php';

# Pré-flight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

# Permitir apenas PUT
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método não permitido."]);
    exit;
}

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

/**
 * Helpers de sanitização/validação
 */
$onlyDigits = function ($v) {
    return preg_replace('/\D+/', '', (string)$v);
};

$validarData = function ($date) {
    if (!$date) return false;
    // Espera 'YYYY-MM-DD'
    $parts = explode('-', $date);
    if (count($parts) !== 3) return false;
    [$y, $m, $d] = $parts;
    return ctype_digit($y . $m . $d) && checkdate((int)$m, (int)$d, (int)$y);
};

$validarSexo = function ($v) {
    if ($v === null) return false;
    $v = strtoupper(trim($v));
    return in_array($v, ['M', 'F', 'O'], true);
};

$validarUF = function ($v) {
    if ($v === null) return false;
    $v = strtoupper(trim($v));
    return (bool)preg_match('/^[A-Z]{2}$/', $v);
};

/**
 * Lista de campos permitidos e tratamentos por campo
 */
$permitidos = [
    'nome'            => function ($v) {
        return trim((string)$v);
    },
    'cpf'             => function ($v) use ($onlyDigits) {
        return $onlyDigits($v);
    },
    'data_nascimento' => function ($v) {
        return $v;
    }, // valida abaixo
    'contato'         => function ($v) {
        return trim((string)$v);
    },
    'saldo'           => function ($v) {
        return $v;
    }, // valida abaixo
    'sexo'            => function ($v) {
        return strtoupper(trim((string)$v));
    },
    'cep'             => function ($v) use ($onlyDigits) {
        return $onlyDigits($v);
    },
    'endereco'        => function ($v) {
        return trim((string)$v);
    },
    'bairro'          => function ($v) {
        return trim((string)$v);
    },
    'numero'          => function ($v) {
        return trim((string)$v);
    },
    'uf'              => function ($v) {
        return strtoupper(trim((string)$v));
    },
];

$toUpdate = [];
$params   = [];

/**
 * Monta UPDATE parcial apenas com campos enviados
 */
foreach ($permitidos as $campo => $sanitize) {
    if (array_key_exists($campo, $input)) {
        $val = $sanitize($input[$campo]);

        // Validações específicas
        if ($campo === 'data_nascimento' && $val !== '' && $val !== null) {
            if (!$validarData($val)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "data_nascimento inválida. Use YYYY-MM-DD."]);
                exit;
            }
        }

        if ($campo === 'saldo' && $val !== '' && $val !== null) {
            if (!is_numeric($val)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "saldo deve ser numérico."]);
                exit;
            }
            $val = number_format((float)$val, 2, '.', '');
        }

        if ($campo === 'sexo' && $val !== '' && $val !== null) {
            if (!$validarSexo($val)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "sexo deve ser 'M', 'F' ou 'O'."]);
                exit;
            }
        }

        if ($campo === 'uf' && $val !== '' && $val !== null) {
            if (!$validarUF($val)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "UF inválida. Use a sigla com 2 letras."]);
                exit;
            }
        }

        // Campos vazios viram NULL (exceto saldo, que já vem formatado)
        if ($val === '') {
            $val = null;
        }

        $toUpdate[] = "{$campo} = :{$campo}";
        $params[":{$campo}"] = $val;
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
    $sql = "UPDATE cliente SET " . implode(', ', $toUpdate) . " WHERE id_cliente = :id_cliente AND (deleted_at IS NULL)";
    $stmt = $pdo->prepare($sql);
    foreach ($params as $k => $v) {
        $stmt->bindValue($k, $v);
    }
    $stmt->bindValue(':id_cliente', $id_cliente, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Cliente atualizado com sucesso."]);
    } else {
        // Pode ser: não encontrou ou valores idênticos (sem alteração)
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Cliente não encontrado ou nenhum dado foi alterado."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao atualizar o cliente.",
        "detalhe" => $e->getMessage()
    ]);
}
