<?php
// Configurações do banco (pegando do docker-compose.yml / .env)
$host = 'db';          // nome do serviço do MySQL no docker-compose
$db   = 'zykes_db';   // troque pelo nome real do banco
$user = 'zykes_user';        // ou o usuário definido no .env
$pass = 'strong_password'; // pega a senha do .env

header('Content-Type: application/json; charset=utf-8');

try {
    // DSN para MySQL
    $dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass);

    // Configura PDO para lançar exceções em caso de erro
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Testa uma query simples
    $stmt = $pdo->query("SELECT NOW() as data_atual");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "message" => "Conexão com banco de dados bem-sucedida!",
        "data_atual" => $row['data_atual']
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Erro ao conectar no banco de dados",
        "detalhe" => $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
