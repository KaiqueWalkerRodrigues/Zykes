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

    // Query base que une todas as tabelas necessárias
    $sql = "
        SELECT
            v.id_venda,
            v.created_at AS data_hora,
            u.nome AS nome_vendedor,
            SUM(os.valor_sub_total) AS valor,
            GROUP_CONCAT(DISTINCT cl.nome SEPARATOR ', ') AS nome_cliente
        FROM
            vendas AS v
        JOIN
            caixas AS c ON v.id_caixa = c.id_caixa
        JOIN
            usuarios AS u ON c.id_usuario = u.id_usuario
        JOIN
            vendas_ordens_servico AS vos ON v.id_venda = vos.id_venda
        JOIN
            ordens_servico AS os ON vos.id_ordem_servico = os.id_ordem_servico
        JOIN
            clientes AS cl ON os.id_cliente = cl.id_cliente
        WHERE
            v.deleted_at IS NULL
    ";

    $params = [];

    // Se um id_caixa for passado via GET, adiciona o filtro à query
    if (isset($_GET['id_caixa']) && !empty($_GET['id_caixa'])) {
        $sql .= " AND v.id_caixa = :id_caixa ";
        $params[':id_caixa'] = $_GET['id_caixa'];
    }

    $sql .= "
        GROUP BY
            v.id_venda
        ORDER BY
            v.created_at DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $vendas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode(["status" => "success", "data" => $vendas]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Erro ao buscar as vendas.",
        "detalhe" => $e->getMessage()
    ]);
}
