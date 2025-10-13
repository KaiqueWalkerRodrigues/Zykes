<?php
// --- CABEÇALHOS ATUALIZADOS ---
// Permite requisições de qualquer origem
header("Access-Control-Allow-Origin: *");
// Permite os métodos GET e OPTIONS (para pre-flight requests)
header("Access-Control-Allow-Methods: GET, OPTIONS");
// Informa quais cabeçalhos o cliente pode enviar (essencial para o If-None-Match)
header("Access-Control-Allow-Headers: Content-Type, If-None-Match");
// Informa ao navegador que o JavaScript pode ler o cabeçalho Etag da resposta
header("Access-Control-Expose-Headers: Etag");
// Define o tipo de conteúdo da resposta
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../Conexao.php';

// Responde a requisições de pre-flight (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204); // No Content
    exit;
}

// Garante que apenas o método GET seja usado
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método não permitido."]);
    exit;
}

// --- LÓGICA ALTERADA: BUSCA POR EMPRESA ---
// Verifica se o ID da empresa foi fornecido, em vez do ID do caixa
if (!isset($_GET['id_empresa'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "O parâmetro 'id_empresa' é obrigatório."]);
    exit;
}

$id_empresa = $_GET['id_empresa'];

try {
    $pdo = Conexao::pdo();

    // Query para buscar o último caixa ABERTO (status = 1) para a empresa especificada
    $stmt = $pdo->prepare(
        "SELECT c.*, u.nome as nome_usuario
         FROM caixas c
         LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
         WHERE c.id_empresa = :id_empresa 
           AND c.status = 1 
           AND c.deleted_at IS NULL
         ORDER BY c.data_abertura DESC 
         LIMIT 1"
    );
    $stmt->bindParam(':id_empresa', $id_empresa, PDO::PARAM_INT);
    $stmt->execute();

    $caixa = $stmt->fetch(PDO::FETCH_ASSOC);

    $response_data = [];
    if ($caixa) {
        // Se um caixa aberto foi encontrado
        $response_data = [
            "status" => "success",
            "aberto" => true,
            "data" => $caixa,
        ];
    } else {
        // Se nenhum caixa aberto foi encontrado para esta empresa
        $response_data = [
            "status" => "success",
            "aberto" => false,
            "data" => null,
        ];
    }

    $json_response = json_encode($response_data);

    // --- NOVA LÓGICA DE ETAG ---
    // 1. Gera um hash MD5 do conteúdo da resposta JSON
    $etag = md5($json_response);

    // 2. Envia o ETag no cabeçalho da resposta
    header("Etag: " . $etag);

    // 3. Verifica se o navegador enviou um ETag na requisição (cabeçalho If-None-Match)
    if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH']) == $etag) {
        // Se os ETags são iguais, o conteúdo não mudou.
        // Envia o status 304 e encerra o script para não enviar o corpo da resposta.
        http_response_code(304); // Not Modified
        exit;
    }

    // Se o ETag for diferente ou não existir, envia a resposta completa com status 200
    http_response_code(200);
    echo $json_response;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao verificar o status do caixa.",
        "detalhe" => $e->getMessage()
    ]);
}
