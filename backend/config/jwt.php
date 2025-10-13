<?php
return [
    'secret'        => $_ENV['JWT_SECRET']        ?? 'strong_password',
    'issuer'        => $_ENV['JWT_ISSUER']        ?? 'zykes-api',
    'audience'      => $_ENV['JWT_AUDIENCE']      ?? 'zykes-frontend',
    'access_ttl'    => (int)($_ENV['JWT_ACCESS_TTL'] ?? 900),     // 15 min
    'refresh_ttl'   => (int)($_ENV['JWT_REFRESH_TTL'] ?? 1209600) // 14 dias
];
