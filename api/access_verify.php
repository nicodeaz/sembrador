<?php
require_once __DIR__ . '/config.php';
require_method('POST');
if (!email_auth_enabled()) json_response(['ok'=>false,'error'=>'email_access_unavailable'],503);
$body=read_json_body();$id=(string)($body['challenge']??'');$code=(string)($body['code']??'');
if (!preg_match('/^[a-f0-9]{32}$/',$id) || !preg_match('/^\d{6}$/',$code)) json_response(['ok'=>false,'error'=>'invalid_code'],422);
lock_auth_store();$db=access_db();
$query=$db->prepare('SELECT * FROM access_codes WHERE id=?');$query->execute([$id]);$row=$query->fetch(PDO::FETCH_ASSOC);
if (!$row) json_response(['ok'=>false,'error'=>'invalid_code'],401);
if ($row['expires']<=time()) json_response(['ok'=>false,'error'=>'expired_code'],401);
if ($row['attempts']>=5) json_response(['ok'=>false,'error'=>'too_many_attempts'],401);
$db->prepare('UPDATE access_codes SET attempts=attempts+1 WHERE id=?')->execute([$id]);
if (!password_verify($code,$row['hash'])) json_response(['ok'=>false,'error'=>'invalid_code'],401);
$selector=bin2hex(random_bytes(16));$secret=bin2hex(random_bytes(32));$expires=time()+34560000;
$db->exec('BEGIN IMMEDIATE');
try {
    // Consuming the code and issuing the remembered device are one transaction.
    $db->prepare('UPDATE access_codes SET expires=0,hash=? WHERE id=?')->execute(['used',$id]);
    // End the temporary help and invalidate its other pending codes atomically.
    $help=$db->exec('UPDATE access_help SET consumed=1 WHERE id=1 AND consumed=0');
    if ($help) $db->exec("UPDATE access_codes SET expires=0,hash='used' WHERE expires>0");
    $db->prepare('INSERT INTO access_devices VALUES (?,?,?,?)')->execute([$selector,hash('sha256',$secret),$expires,time()]);
    $db->exec('COMMIT');
} catch (Throwable $e) { $db->exec('ROLLBACK');throw $e; }
device_cookie($selector.'.'.$secret,$expires);
json_response(['ok'=>true]);
