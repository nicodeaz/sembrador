<?php
require_once __DIR__ . '/config.php';
require_method('POST');
if (!email_auth_enabled()) json_response(['ok'=>false,'error'=>'email_access_unavailable'],503);
$body=read_json_body();
$email=strtolower(trim((string)($body['email'] ?? '')));
if (!filter_var($email,FILTER_VALIDATE_EMAIL)) json_response(['ok'=>false,'error'=>'invalid_email'],422);
lock_auth_store();
$db=access_db();
$lifetime=access_code_lifetime($db);
// Same response shape for unknown addresses; they never receive a code.
if (!hash_equals(access_email(),$email)) json_response(['ok'=>true,'challenge'=>bin2hex(random_bytes(16)),'retryAfter'=>60,'expiresIn'=>$lifetime]);
$recent=$db->query('SELECT COUNT(*) AS total, MAX(created) AS latest FROM access_codes WHERE created > '.(time()-3600))->fetch(PDO::FETCH_ASSOC);
if ((int)$recent['total']>=5 || (int)$recent['latest']>time()-60) json_response(['ok'=>false,'error'=>'wait','retryAfter'=>(int)$recent['total']>=5?3600:max(1,60-(time()-(int)$recent['latest']))],429);
$id=bin2hex(random_bytes(16));$code=(string)random_int(100000,999999);
$deadline=time()+$lifetime;
// Persist the request before sending, including failed deliveries, to bound abuse.
$db->prepare('INSERT INTO access_codes (id,hash,expires,created) VALUES (?,?,?,?)')->execute([$id,password_hash($code,PASSWORD_DEFAULT),$deadline,time()]);
if (!send_access_code($code,$lifetime)) {
    $db->prepare('UPDATE access_codes SET expires=0 WHERE id=?')->execute([$id]);
    json_response(['ok'=>false,'error'=>'email_unavailable'],503);
}
json_response(['ok'=>true,'challenge'=>$id,'retryAfter'=>60,'expiresIn'=>max(0,$deadline-time())]);
