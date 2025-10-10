<?

function normalize_decimal_br(?string $raw): ?string
{
    if ($raw === null) return null;
    $v = trim($raw);
    if ($v === '') return null;
    // remove tudo menos dígitos, ponto e vírgula
    $v = preg_replace('/[^0-9\.,-]/', '', $v);
    // se houver vírgula como decimal (pt-BR), converte para ponto
    if (strpos($v, ',') !== false && strpos($v, '.') !== false) {
        // remove separadores de milhar (pontos) e troca vírgula por ponto
        $v = str_replace('.', '', $v);
        $v = str_replace(',', '.', $v);
    } elseif (strpos($v, ',') !== false && strpos($v, '.') === false) {
        // só vírgula => decimal
        $v = str_replace(',', '.', $v);
    }
    if ($v === '' || $v === '-' || $v === '.') return null;
    return $v;
}
