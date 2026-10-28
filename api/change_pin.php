<?php
require_once __DIR__ . '/config.php';
if (email_auth_enabled()) json_response(['ok'=>false,'error'=>'pin_disabled'],410);
bootstrap_session();
require_auth();
require_method('POST');
lock_auth_store();
if (lockout_remaining_seconds() > 0) json_response(['ok' => false, 'error' => 'locked'], 423);

$body = read_json_body();
$currentPin = isset($body['currentPin']) ? (string) $body['currentPin'] : '';
$newPin = isset($body['newPin']) ? (string) $body['newPin'] : '';

if (!verify_pin($currentPin)) {
    register_failed_attempt();
    json_response(['ok' => false, 'error' => 'current_pin_invalid'], 401);
}

if (!preg_match('/^\d{6}$/', $newPin)) {
    json_response(['ok' => false, 'error' => 'invalid_new_pin'], 400);
}

set_pin($newPin);
json_response(['ok' => true]);
