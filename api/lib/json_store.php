<?php
// Lectura/escritura de JSON en disco para la API de El Sembrador.
// La escritura es atómica (escribe a un archivo temporal y hace rename)
// para no dejar un JSON a medio escribir si el proceso se corta a mitad
// de camino (corte de luz, request interrumpido, etc.).

function ensure_data_dir(): void {
    if (!preg_match('~^(?:[A-Za-z]:[\\\\/]|/)~', DATA_DIR)) throw new RuntimeException('Data path must be absolute');
    if (!is_dir(DATA_DIR)) {
        if (!mkdir(DATA_DIR, 0700, true) && !is_dir(DATA_DIR)) throw new RuntimeException('Cannot create data directory');
    }
    $directory = strtolower(str_replace('\\', '/', realpath(DATA_DIR))) . '/';
    foreach ([dirname(__DIR__, 2), $_SERVER['DOCUMENT_ROOT'] ?? ''] as $publicPath) {
        if ($publicPath && realpath($publicPath)) {
            $publicDirectory = strtolower(str_replace('\\', '/', realpath($publicPath))) . '/';
            if (str_starts_with($directory, $publicDirectory)) throw new RuntimeException('Data directory must be outside the application and document root');
        }
    }
}

function read_json(string $path, $fallback) {
    if (!file_exists($path)) return $fallback;
    $raw = file_get_contents($path);
    if ($raw === false || $raw === '') throw new RuntimeException('Cannot read stored data');
    $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    return $decoded;
}

function atomic_write_json(string $path, $data): void {
    ensure_data_dir();
    $tmp = $path . '.tmp-' . bin2hex(random_bytes(6));
    $written = file_put_contents($tmp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
    if ($written === false) {
        @unlink($tmp);
        json_response(['ok' => false, 'error' => 'write_failed'], 500);
    }
    if (!rename($tmp, $path)) {
        @unlink($tmp);
        json_response(['ok' => false, 'error' => 'write_failed'], 500);
    }
}
