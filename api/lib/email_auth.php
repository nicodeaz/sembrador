<?php
require_once __DIR__ . '/farm_store.php';

function email_auth_enabled(): bool { return getenv('SEMBRADOR_AUTH_MODE') === 'email'; }
function access_email(): string { return strtolower(trim(getenv('SEMBRADOR_OWNER_EMAIL') ?: 'agroserv.uruguay@gmail.com')); }
function access_db(): PDO {
    $db = farm_database();
    $db->exec('CREATE TABLE IF NOT EXISTS access_codes (id TEXT PRIMARY KEY, hash TEXT NOT NULL, expires INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL)');
    $db->exec('CREATE TABLE IF NOT EXISTS access_devices (id TEXT PRIMARY KEY, hash TEXT NOT NULL, expires INTEGER NOT NULL, renewed INTEGER NOT NULL)');
    $db->exec('CREATE TABLE IF NOT EXISTS access_help (id INTEGER PRIMARY KEY CHECK(id=1), expires INTEGER NOT NULL, consumed INTEGER NOT NULL DEFAULT 0)');
    return $db;
}
function access_code_lifetime(PDO $db): int {
    $help=$db->query('SELECT expires,consumed FROM access_help WHERE id=1')->fetch(PDO::FETCH_ASSOC);
    if (!$help || $help['consumed'] || $help['expires']<=time()) return 600;
    return max(600,min(3600,(int)$help['expires']-time()));
}
function device_cookie(string $value, int $expires): void {
    setcookie('sembrador_device', $value, ['expires'=>$expires,'path'=>'/','secure'=>!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off','httponly'=>true,'samesite'=>'Lax']);
}
function device_identity(): ?array {
    $value=$_COOKIE['sembrador_device'] ?? '';
    if (!preg_match('/^([a-f0-9]{32})\.([a-f0-9]{64})$/', $value, $parts)) return null;
    return [$parts[1],$parts[2],$value];
}
function authenticate_device(): bool {
    $identity=device_identity(); if (!$identity) return false;
    $db=access_db(); $query=$db->prepare('SELECT * FROM access_devices WHERE id=?');$query->execute([$identity[0]]);$row=$query->fetch(PDO::FETCH_ASSOC);
    if (!$row || $row['expires'] < time() || !hash_equals($row['hash'],hash('sha256',$identity[1]))) return false;
    // Browsers limit persistent cookies. Renew on use, at most once per day.
    if ($row['renewed'] < time()-86400) {
        $expires=time()+34560000;
        $db->prepare('UPDATE access_devices SET expires=?,renewed=? WHERE id=?')->execute([$expires,time(),$identity[0]]);
        device_cookie($identity[2],$expires);
    }
    return true;
}
function revoke_device(): void {
    $identity=device_identity();
    if ($identity) access_db()->prepare('DELETE FROM access_devices WHERE id=? AND hash=?')->execute([$identity[0],hash('sha256',$identity[1])]);
    device_cookie('',time()-3600);
}
function access_code_message(string $code, int $lifetime): string {
    $minutes=(int)ceil($lifetime/60);
    return "Tu código de acceso es: $code\n\nTenés $minutes minutos para ingresarlo. Volvé a la pantalla de El Sembrador e ingresá estos 6 números. Si pediste varios códigos, usá el del último correo.\n\nDespués de entrar, este teléfono recordará tu sesión.\n\nSi no pediste el código, ignorá este correo.";
}
function send_access_code(string $code, int $lifetime): bool {
    // A capture transport exists only for the PHP development server, never Apache.
    $capture=getenv('SEMBRADOR_TEST_MAIL_DIR');
    if ($capture && PHP_SAPI === 'cli-server') return file_put_contents($capture.'/latest-code.txt',$code,LOCK_EX)!==false;
    $path=getenv('SEMBRADOR_MAIL_CONFIG') ?: '';
    if (!$path || !is_file($path)) return false;
    $config=json_decode(file_get_contents($path),true);
    if (empty($config['api_key']) || empty($config['from'])) return false;
    $payload=json_encode(['from'=>$config['from'],'to'=>[access_email()],'subject'=>'Tu código de acceso a El Sembrador','text'=>access_code_message($code,$lifetime)],JSON_UNESCAPED_UNICODE);
    $context=stream_context_create(['http'=>['method'=>'POST','header'=>"Authorization: Bearer ".$config['api_key']."\r\nContent-Type: application/json\r\nUser-Agent: El-Sembrador\r\n",'content'=>$payload,'timeout'=>20,'ignore_errors'=>true]]);
    // Never log the request, code, API key, or response content.
    $result=@file_get_contents('https://api.resend.com/emails',false,$context);
    return $result!==false && isset($http_response_header[0]) && preg_match('/ 2\d\d /',$http_response_header[0]);
}
