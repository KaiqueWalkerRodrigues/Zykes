<?php

class Conexao
{
    private static $host = 'db';
    private static $db   = 'zykes_db';
    private static $user = 'zykes_user';
    private static $pass = 'strong_password';
    private static $pdo  = null;

    public static function pdo()
    {
        if (self::$pdo === null) {
            $dsn = "mysql:host=" . self::$host . ";dbname=" . self::$db . ";charset=utf8mb4";
            self::$pdo = new PDO($dsn, self::$user, self::$pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ]);
        }
        return self::$pdo;
    }
}
