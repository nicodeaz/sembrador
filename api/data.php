<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/farm_store.php';
bootstrap_session();
require_auth();
session_write_close();

$db = farm_database();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    json_response(['ok' => true] + farm_read($db));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = read_json_body();

    if (!isset($body['revision'], $body['data'], $body['requestId']) || !is_int($body['revision']) || !is_string($body['requestId']) || strlen($body['requestId']) > 100) {
        json_response(['ok' => false, 'error' => 'invalid_payload'], 400);
    }

    try { validate_farm($body['data']); }
    catch (InvalidArgumentException $error) { json_response(['ok' => false, 'error' => $error->getMessage()], 422); }
    $result = farm_save($db, $body['revision'], $body['data'], $body['requestId']);
    json_response($result, $result['ok'] ? 200 : 409);
}

json_response(['ok' => false, 'error' => 'method_not_allowed'], 405);
