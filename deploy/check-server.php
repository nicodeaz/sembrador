<?php
// Run inside the container. Output only check results, never PINs or cookies.
if (PHP_SAPI !== 'cli') exit(1);
$access = file_get_contents('/var/lib/sembrador/initial-access.txt');
if (!preg_match('/PIN inicial: (\d{6})/', $access, $match)) throw new RuntimeException('Initial access not found');
$cookie = '';
function request(string $endpoint, ?array $body = null): array {
    global $cookie;
    $handle = curl_init('http://127.0.0.1/api/' . $endpoint);
    $headers = ['Content-Type: application/json', 'X-Forwarded-Proto: https'];
    if ($cookie) $headers[] = 'Cookie: ' . $cookie;
    curl_setopt_array($handle,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_HTTPHEADER=>$headers,CURLOPT_HEADERFUNCTION=>static function($curl,$header) use (&$cookie) {
        if (stripos($header,'Set-Cookie: sembrador_session=') === 0) {
            if (!str_contains(strtolower($header),'secure') || !str_contains(strtolower($header),'httponly')) throw new RuntimeException('Cookie protections missing');
            $cookie = explode(';',trim(substr($header,12)))[0];
        }
        return strlen($header);
    }]);
    if ($body !== null) { curl_setopt($handle,CURLOPT_POST,true);curl_setopt($handle,CURLOPT_POSTFIELDS,json_encode($body)); }
    $raw = curl_exec($handle); $status = curl_getinfo($handle,CURLINFO_RESPONSE_CODE);curl_close($handle);
    return [$status,json_decode($raw,true)];
}
[$status] = request('data.php');if ($status !== 401) throw new RuntimeException('Authentication required check failed');
[$status] = request('login.php',['pin'=>$match[1]]);if ($status !== 200) throw new RuntimeException('Login failed');
[$status,$body] = request('data.php');if ($status !== 200 || !isset($body['revision'])) throw new RuntimeException('Data read failed');
if (getenv('SEMBRADOR_WRITE_CHECK') === '1') {
    // Save the exact existing snapshot, with optimistic locking; no fixture records.
    [$status,$saved] = request('data.php',['revision'=>$body['revision'],'data'=>$body['data'],'requestId'=>'deployment-check-' . bin2hex(random_bytes(8))]);
    if ($status !== 200) throw new RuntimeException('Save check failed; concurrent changes were preserved');
    [$status,$readback] = request('data.php');
    if ($status !== 200 || $readback['data'] !== $body['data'] || $readback['revision'] !== $saved['revision']) throw new RuntimeException('Readback failed');
    $body = $readback;
}
[$status,$library] = request('media.php');if ($status !== 200 || !isset($library['assets'])) throw new RuntimeException('Library read failed');
request('logout.php',[]);
echo json_encode(['login'=>true,'secureCookie'=>true,'revision'=>$body['revision'],'batches'=>count($body['data']['batches']),'media'=>count($library['assets'])]) . "\n";
