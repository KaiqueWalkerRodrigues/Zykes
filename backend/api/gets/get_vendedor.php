<?php
// Define os cabeçalhos para permitir o acesso de qualquer origem (CORS) e definir o tipo de conteúdo como JSON.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

// Inclui o arquivo de conexão com o banco de dados.
require_once __DIR__ . '/../Conexao.php';

// Responde com sucesso a requisições do tipo OPTIONS (pre-flight requests do CORS).
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Garante que o método da requisição seja GET.
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405); // Método não permitido
    echo json_encode(["status" => "error", "message" => "Método não permitido."]);
    exit;
}

try {
    // Obtém a conexão PDO.
    $pdo = Conexao::pdo();

    // Verifica se um ID de vendedor específico foi solicitado.
    if (isset($_GET['id_vendedor']) && !empty($_GET['id_vendedor'])) {
        // --- LÓGICA PARA BUSCAR UM ÚNICO VENDEDOR ---

        $id_vendedor = (int)$_GET['id_vendedor'];

        $query = "
            SELECT 
                id_usuario,
                nome,
                usuario
            FROM 
                usuarios 
            WHERE 
                id_usuario = :id_vendedor AND deleted_at IS NULL
        ";

        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':id_vendedor', $id_vendedor, PDO::PARAM_INT);
        $stmt->execute();

        $vendedor = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($vendedor) {
            http_response_code(200);
            // O componente NomeCell espera um objeto { data: { ... } }
            echo json_encode(["data" => $vendedor]);
        } else {
            http_response_code(404); // Não encontrado
            echo json_encode(["status" => "error", "message" => "Vendedor não encontrado."]);
        }
    } else {
        // --- LÓGICA PARA BUSCAR TODOS OS VENDEDORES ---

        // A consulta busca todos os usuários (u) que estão na tabela de ligação (us) com o setor de id 2 (Loja).
        $query = "
            SELECT DISTINCT
                u.id_usuario,
                u.nome,
                u.usuario,
                u.ativo
            FROM
                usuarios u
            INNER JOIN
                usuarios_setores us ON u.id_usuario = us.id_usuario
            WHERE
                u.deleted_at IS NULL AND us.id_setor = 2
            ORDER BY
                u.nome ASC
        ";

        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $vendedores = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        // O dropdown no React espera um array direto: [ { ... }, { ... } ]
        echo json_encode($vendedores);
    }
} catch (PDOException $e) {
    // Em caso de erro de banco de dados, retorna um erro 500.
    http_response_code(500); // Erro interno do servidor
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao consultar o banco de dados.",
        "detalhe" => $e->getMessage()
    ]);
}
