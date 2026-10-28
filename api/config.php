<?php
// Persistent storage is mandatory and must live outside public and release directories.
$local = is_file(__DIR__ . '/config.local.php') ? require __DIR__ . '/config.local.php' : [];
$dataDir = getenv('SEMBRADOR_DATA_DIR') ?: ($local['data_dir'] ?? '');
if (!$dataDir) {
    http_response_code(503);
    header('Content-Type: application/json');
    exit('{"ok":false,"error":"storage_not_configured"}');
}
define('DATA_DIR', $dataDir);
define('INITIAL_PIN', getenv('SEMBRADOR_INITIAL_PIN') ?: ($local['initial_pin'] ?? ''));
set_exception_handler(function (Throwable $error): void {
    error_log('Sembrador: ' . $error->getMessage());
    if (PHP_SAPI === 'cli') { fwrite(STDERR, "Sembrador storage operation failed.\n"); exit(1); }
    json_response(['ok' => false, 'error' => 'storage_error'], 500);
});

require_once __DIR__ . '/lib/json_store.php';
require_once __DIR__ . '/lib/http.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/email_auth.php';

function bootstrap_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;

    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');

    session_set_cookie_params([
        'lifetime' => 60 * 60 * 12, // 12 horas
        'path' => '/',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_name('sembrador_session');
    ini_set('session.use_strict_mode', '1');
    session_start();
}

header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store, private');
