<?php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/farm_store.php';
$destination = $argv[1] ?? '';
if (!$destination || !is_dir($destination)) throw new RuntimeException('Usage: php api/backup.php /absolute/private/backup-directory');
$db = farm_database();
$prefix = rtrim($destination, '/\\') . '/sembrador-' . gmdate('Ymd-His') . '-' . bin2hex(random_bytes(3));
$db->exec('VACUUM INTO ' . $db->quote($prefix . '.sqlite'));
chmod($prefix . '.sqlite', 0600);
$snapshot = new PDO('sqlite:' . $prefix . '.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
if (file_put_contents($prefix . '.json', json_encode(farm_read($snapshot)['data'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)) === false) throw new RuntimeException('Backup failed');
chmod($prefix . '.json', 0600);
echo "Backup complete\n";
