<?php
require_once __DIR__ . '/config.php';
if (email_auth_enabled()) json_response(['ok'=>false,'error'=>'use_email_code'],410);
bootstrap_session();
require_method('POST');
lock_auth_store();

$remaining = lockout_remaining_seconds();
if ($remaining > 0) {
    json_response(['ok' => false, 'lockedSeconds' => $remaining], 423);
}

$body = read_json_body();
$pin = isset($body['pin']) ? (string) $body['pin'] : '';

if ($pin === '' || !verify_pin($pin)) {
    $lockedSeconds = register_failed_attempt();
    json_response(['ok' => false, 'lockedSeconds' => $lockedSeconds], 401);
}

reset_attempts();
session_regenerate_id(true);
$_SESSION['sembrador_authenticated'] = true;
$_SESSION['authenticated_at'] = time();
json_response(['ok' => true]);
