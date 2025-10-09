<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../Conexao.php';

try {
    $pdo = Conexao::pdo();
    $stmt = $pdo->query("SELECT * FROM familias");
    $familias = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($familias, JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Erro ao buscar famílias",
        "detalhe" => $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
