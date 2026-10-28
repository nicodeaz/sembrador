<?php
// Run once via stdin inside the container; never expose this operation over HTTP.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once ($argv[1] ?? '/var/www/html/api/config.php');
lock_auth_store();
$db=access_db();
// INSERT OR IGNORE prevents a deployment/retry from re-enabling consumed help.
$db->prepare('INSERT OR IGNORE INTO access_help (id,expires) VALUES (1,?)')->execute([time()+172800]);
echo json_encode(['codeMinutes'=>(int)ceil(access_code_lifetime($db)/60),'help'=>$db->query('SELECT expires,consumed FROM access_help WHERE id=1')->fetch(PDO::FETCH_ASSOC)]) . "\n";
