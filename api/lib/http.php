<?php
// Helpers HTTP compartidos por los endpoints de la API de El Sembrador.

function json_response($data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function read_json_body(): array {
    if (($_SERVER['CONTENT_LENGTH'] ?? 0) > 8000000) json_response(['ok' => false, 'error' => 'payload_too_large'], 413);
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) json_response(['ok' => false, 'error' => 'json_required'], 415);
    if (($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') json_response(['ok' => false, 'error' => 'cross_site'], 403);
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function require_method(string $method): void {
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        json_response(['ok' => false, 'error' => 'method_not_allowed'], 405);
    }
}

function require_auth(): void {
    if (email_auth_enabled()) {
        if (!authenticate_device()) json_response(['ok'=>false,'error'=>'unauthorized'],401);
        return;
    }
    if (empty($_SESSION['sembrador_authenticated']) || ($_SESSION['authenticated_at'] ?? 0) < time() - 43200) {
        json_response(['ok' => false, 'error' => 'unauthorized'], 401);
    }
}

function lock_auth_store(): void {
    ensure_data_dir();
    $lock = fopen(DATA_DIR . '/auth.lock', 'c');
    if (!$lock || !flock($lock, LOCK_EX)) throw new RuntimeException('Cannot lock auth');
    register_shutdown_function(static function () use ($lock) { flock($lock, LOCK_UN); fclose($lock); });
}
