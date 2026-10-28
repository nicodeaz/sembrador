<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/farm_store.php';
bootstrap_session();
require_auth();
session_write_close();
$db = farm_database();
// Kept in the private database: replacing the application never replaces media.
$db->exec('CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, created_at TEXT NOT NULL, content BLOB NOT NULL)');

function ini_bytes(string $value): int {
    $number = (int) $value;
    return $number * (['g'=>1073741824,'m'=>1048576,'k'=>1024][strtolower(substr(trim($value),-1))] ?? 1);
}
$limit = min(10 * 1024 * 1024, ini_bytes(ini_get('upload_max_filesize')), max(0,ini_bytes(ini_get('post_max_size')) - 16384));
$fields = 'id,title,category,mime,size,created_at AS createdAt';
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!isset($_GET['id'])) json_response(['ok'=>true,'assets'=>$db->query("SELECT $fields FROM media ORDER BY created_at DESC,id")->fetchAll(PDO::FETCH_ASSOC),'maxUploadBytes'=>$limit]);
    $id = $_GET['id'];
    if (!is_string($id) || !preg_match('/^[a-f0-9]{32}$/',$id)) json_response(['ok'=>false,'error'=>'not_found'],404);
    $query = $db->prepare('SELECT * FROM media WHERE id=?'); $query->execute([$id]); $row = $query->fetch(PDO::FETCH_ASSOC);
    if (!$row) json_response(['ok'=>false,'error'=>'not_found'],404);
    $extension = ['image/png'=>'png','image/jpeg'=>'jpg','image/webp'=>'webp','application/pdf'=>'pdf'][$row['mime']];
    header('Content-Type: ' . $row['mime']);
    header('Content-Length: ' . $row['size']);
    header('X-Content-Type-Options: nosniff');
    header("Content-Security-Policy: default-src 'none'; sandbox");
    $disposition = isset($_GET['download']) || $row['mime'] === 'application/pdf' ? 'attachment' : 'inline';
    header('Content-Disposition: ' . $disposition . '; filename="El-Sembrador-' . $id . '.' . $extension . '"');
    echo $row['content']; exit;
}
require_method('POST');
if (($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site' || ($_SERVER['HTTP_X_SEMBRADOR_UPLOAD'] ?? '') !== '1') json_response(['ok'=>false,'error'=>'cross_site'],403);
if (($_SERVER['CONTENT_LENGTH'] ?? 0) > $limit + 16384) json_response(['ok'=>false,'error'=>'file_too_large'],413);
$file = $_FILES['file'] ?? null;
if (!$file || $file['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name']) || $file['size'] < 1 || $file['size'] > $limit) json_response(['ok'=>false,'error'=>'invalid_upload'],422);
$title = $_POST['title'] ?? ''; $category = $_POST['category'] ?? ''; $id = $_POST['id'] ?? '';
if (!is_string($title) || !trim($title) || strlen($title) > 200 || !is_string($id) || !preg_match('/^[a-f0-9]{32}$/',$id) || !in_array($category,['logo','etiqueta','flyer','servicios'],true)) json_response(['ok'=>false,'error'=>'invalid_fields'],422);
$mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
if (!in_array($mime,['image/png','image/jpeg','image/webp','application/pdf'],true)) json_response(['ok'=>false,'error'=>'unsupported_file'],415);
if (str_starts_with($mime,'image/')) {
    $dimensions = getimagesize($file['tmp_name']);
    if (!$dimensions || $dimensions[0] * $dimensions[1] > 50000000) json_response(['ok'=>false,'error'=>'unsupported_file'],415);
}
$content = file_get_contents($file['tmp_name']);
$db->exec('BEGIN IMMEDIATE');
try {
    $existing = $db->prepare('SELECT title,category,content FROM media WHERE id=?'); $existing->execute([$id]); $saved = $existing->fetch(PDO::FETCH_ASSOC);
    if ($saved) {
        if ($saved['title'] !== trim($title) || $saved['category'] !== $category || !hash_equals(hash('sha256',$saved['content']),hash('sha256',$content))) {
            $db->exec('ROLLBACK'); json_response(['ok'=>false,'error'=>'upload_conflict'],409);
        }
    } else {
        $usage = $db->query('SELECT COUNT(*) AS count, COALESCE(SUM(size),0) AS bytes FROM media')->fetch(PDO::FETCH_ASSOC);
        if ($usage['count'] >= 200 || $usage['bytes'] + $file['size'] > 200 * 1024 * 1024) { $db->exec('ROLLBACK'); json_response(['ok'=>false,'error'=>'library_full'],413); }
        $insert = $db->prepare('INSERT INTO media VALUES (?,?,?,?,?,?,?)');
        $insert->bindValue(1,$id); $insert->bindValue(2,trim($title)); $insert->bindValue(3,$category); $insert->bindValue(4,$mime); $insert->bindValue(5,$file['size'],PDO::PARAM_INT); $insert->bindValue(6,gmdate('c')); $insert->bindValue(7,$content,PDO::PARAM_LOB); $insert->execute();
    }
    $db->exec('COMMIT');
} catch (Throwable $error) { $db->exec('ROLLBACK'); throw $error; }
$query = $db->prepare("SELECT $fields FROM media WHERE id=?"); $query->execute([$id]);
json_response(['ok'=>true,'asset'=>$query->fetch(PDO::FETCH_ASSOC)]);
