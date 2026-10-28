<?php
require_once __DIR__ . '/config.php';
bootstrap_session();
require_method('POST');
read_json_body();
if (email_auth_enabled()) revoke_device();

$_SESSION = [];
session_destroy();

json_response(['ok' => true]);
