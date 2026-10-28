<?php
// PIN de acceso y bloqueo por intentos fallidos, del lado del servidor.
//
// El PIN nunca se guarda en texto plano: se guarda con password_hash()
// (bcrypt), igual que se guardaría una contraseña real. El bloqueo por
// intentos fallidos también vive acá (no en el navegador), así que no se
// puede evitar borrando el localStorage del celular.

const PIN_LOCKOUT_THRESHOLD = 3; // intentos fallidos permitidos antes del primer bloqueo
const PIN_LOCKOUT_SCHEDULE = [30, 60, 120, 300, 900]; // segundos, crece y tope en 15 min

function pin_file_path(): string {
    return DATA_DIR . '/pin.json';
}

function security_file_path(): string {
    return DATA_DIR . '/security.json';
}

function ensure_pin_initialized(): void {
    if (!file_exists(pin_file_path())) {
        if (!preg_match('/^\d{6}$/', INITIAL_PIN)) json_response(['ok' => false, 'error' => 'pin_not_configured'], 503);
        set_pin(INITIAL_PIN);
    }
}

function set_pin(string $pin): void {
    $hash = password_hash($pin, PASSWORD_DEFAULT);
    atomic_write_json(pin_file_path(), [
        'hash' => $hash,
        'updatedAt' => date('c'),
    ]);
    reset_attempts();
}

function verify_pin(string $candidate): bool {
    ensure_pin_initialized();
    $record = read_json(pin_file_path(), null);
    if (!is_array($record) || empty($record['hash'])) return false;
    return password_verify($candidate, $record['hash']);
}

function read_security_state(): array {
    return read_json(security_file_path(), ['failedCount' => 0, 'lockoutUntil' => 0]);
}

function lockout_remaining_seconds(): int {
    $state = read_security_state();
    $remaining = ($state['lockoutUntil'] ?? 0) - time();
    return $remaining > 0 ? (int) $remaining : 0;
}

function reset_attempts(): void {
    atomic_write_json(security_file_path(), ['failedCount' => 0, 'lockoutUntil' => 0]);
}

/** Registra un intento fallido y devuelve los segundos de bloqueo restantes (0 si no hay bloqueo). */
function register_failed_attempt(): int {
    $state = read_security_state();
    $count = (int) ($state['failedCount'] ?? 0) + 1;
    $lockoutUntil = 0;

    if ($count >= PIN_LOCKOUT_THRESHOLD) {
        $stepIndex = min($count - PIN_LOCKOUT_THRESHOLD, count(PIN_LOCKOUT_SCHEDULE) - 1);
        $seconds = PIN_LOCKOUT_SCHEDULE[$stepIndex];
        $lockoutUntil = time() + $seconds;
    }

    atomic_write_json(security_file_path(), [
        'failedCount' => $count,
        'lockoutUntil' => $lockoutUntil,
    ]);

    return lockout_remaining_seconds();
}
