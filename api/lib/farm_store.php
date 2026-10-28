<?php
// One transaction for the complete farm; revisions reject stale devices.
function empty_farm(): array {
    return ['schemaVersion' => 3, 'batches' => [], 'records' => [], 'departures' => [], 'tasks' => [], 'movements' => []];
}

function farm_database(): PDO {
    ensure_data_dir();
    $db = new PDO('sqlite:' . DATA_DIR . '/farm.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $db->exec('PRAGMA busy_timeout=10000');
    $db->exec('PRAGMA synchronous=FULL');
    $db->exec('CREATE TABLE IF NOT EXISTS farm (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL, payload TEXT NOT NULL, request_id TEXT NOT NULL)');
    $db->exec('CREATE TABLE IF NOT EXISTS backups (revision INTEGER PRIMARY KEY, saved_at TEXT NOT NULL, payload TEXT NOT NULL)');
    if (!$db->query('SELECT COUNT(*) FROM farm')->fetchColumn()) {
        $data = empty_farm();
        $data['batches'] = read_json(DATA_DIR . '/batches.json', []);
        $data['records'] = read_json(DATA_DIR . '/records.json', []);
        validate_farm($data);
        $query = $db->prepare('INSERT OR IGNORE INTO farm VALUES (1, 0, ?, ?)');
        $query->execute([json_encode($data, JSON_THROW_ON_ERROR), '']);
    }
    return $db;
}

function farm_read(PDO $db): array {
    $row = $db->query('SELECT revision,payload,request_id FROM farm WHERE id=1')->fetch(PDO::FETCH_ASSOC);
    return ['revision' => (int) $row['revision'], 'requestId' => $row['request_id'], 'data' => json_decode($row['payload'], true, 512, JSON_THROW_ON_ERROR)];
}

function farm_save(PDO $db, int $revision, array $data, string $requestId): array {
    $payload = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    $db->exec('BEGIN IMMEDIATE');
    try {
        $row = $db->query('SELECT * FROM farm WHERE id=1')->fetch(PDO::FETCH_ASSOC);
        if ($row['request_id'] === $requestId && $row['payload'] === $payload) {
            $db->exec('COMMIT');
            return ['ok' => true, 'revision' => (int) $row['revision']];
        }
        if ((int) $row['revision'] !== $revision) {
            $db->exec('ROLLBACK');
            return ['ok' => false, 'error' => 'conflict'];
        }
        $backup = $db->prepare('INSERT OR IGNORE INTO backups VALUES (?, ?, ?)');
        $backup->execute([$revision, gmdate('c'), $row['payload']]);
        $update = $db->prepare('UPDATE farm SET revision=?,payload=?,request_id=? WHERE id=1');
        $update->execute([$revision + 1, $payload, $requestId]);
        $db->exec('DELETE FROM backups WHERE revision NOT IN (SELECT revision FROM backups ORDER BY revision DESC LIMIT 100)');
        $db->exec('COMMIT');
        return ['ok' => true, 'revision' => $revision + 1];
    } catch (Throwable $error) {
        $db->exec('ROLLBACK');
        throw $error;
    }
}

function validate_farm($data): void {
    $fail = static function () { throw new InvalidArgumentException('invalid_farm_data'); };
    $number = static fn($value) => (is_int($value) || is_float($value)) && is_finite((float) $value) && $value >= 0 && $value < 1000000000000;
    $date = static function ($value): bool {
        if (!is_string($value) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) return false;
        $parts = explode('-', $value);
        return checkdate((int) $parts[1], (int) $parts[2], (int) $parts[0]);
    };
    if (!is_array($data) || ($data['schemaVersion'] ?? 0) !== 3) $fail();
    $batchIds = [];
    foreach (['batches', 'records', 'departures', 'tasks', 'movements'] as $collection) {
        if (!isset($data[$collection]) || !is_array($data[$collection]) || !array_is_list($data[$collection]) || count($data[$collection]) > 50000) $fail();
        $ids = [];
        foreach ($data[$collection] as $item) {
            if (!is_array($item) || !is_string($item['id'] ?? null) || !$item['id'] || isset($ids[$item['id']])) $fail();
            $ids[$item['id']] = true;
            foreach (['name','title','product','notes','contact','breed','barn','createdAt','batchId','unit','purchaseId','quantityUnit'] as $field) {
                if (isset($item[$field]) && !is_string($item[$field])) $fail();
            }
            foreach ($item as $value) if (is_string($value) && strlen($value) > 10000) $fail();
            if ($collection === 'batches') {
                if (!is_string($item['name'] ?? null) || !trim($item['name']) || !$date($item['startDate'] ?? null) || !$number($item['initialCount'] ?? null) || $item['initialCount'] < 1 || floor($item['initialCount']) !== (float) $item['initialCount'] || !$number($item['initialCostPerPullet'] ?? null) || !in_array($item['status'] ?? '', ['planned', 'active', 'completed', 'archived'], true)) $fail();
                foreach (['endDate','expectedExitDate'] as $key) if (!empty($item[$key]) && (!$date($item[$key]) || $item[$key] < $item['startDate'])) $fail();
                if (isset($item['ageOnArrivalDays']) && (!$number($item['ageOnArrivalDays']) || floor($item['ageOnArrivalDays']) !== (float) $item['ageOnArrivalDays'])) $fail();
                $batchIds[$item['id']] = $item;
                continue;
            }
            if (!$date($item['date'] ?? null)) $fail();
            if (!empty($item['batchId']) && !isset($batchIds[$item['batchId']])) $fail();
            if ($collection === 'records') {
                if (empty($item['batchId']) || !is_string($item['title'] ?? null) || !in_array($item['category'] ?? '', ['alimento','mortalidad','vacunas','calefaccion','otros'], true) || !$number($item['cost'] ?? null)) $fail();
                if (isset($item['quantity']) && !$number($item['quantity'])) $fail();
                if ($item['category'] === 'mortalidad' && (!isset($item['quantity']) || floor($item['quantity']) !== (float) $item['quantity'])) $fail();
            }
            if ($collection === 'departures' && (empty($item['batchId']) || !$number($item['count'] ?? null) || $item['count'] < 1 || floor($item['count']) !== (float) $item['count'] || !$number($item['amount'] ?? null))) $fail();
            if ($collection === 'tasks' && (!is_string($item['title'] ?? null) || !trim($item['title']) || !in_array($item['status'] ?? '', ['pending','done'], true) || !$number($item['cost'] ?? null) || ($item['status'] === 'done' && !$date($item['completedDate'] ?? null)))) $fail();
            if ($collection === 'movements') {
                if (!in_array($item['type'] ?? '', ['purchase','sale','feed','production','expense'], true) || !is_string($item['product'] ?? null) || !trim($item['product']) || !$number($item['quantityKg'] ?? null) || !$number($item['amount'] ?? null)) $fail();
                if ($item['type'] !== 'expense' && $item['quantityKg'] <= 0) $fail();
                if ($item['type'] === 'feed' && empty($item['batchId'])) $fail();
                if (isset($item['quantityUnit']) && !in_array($item['quantityUnit'], ['kg','bolsas'], true)) $fail();
                if (($item['quantityUnit'] ?? '') === 'bolsas' && (!$number($item['bagWeightKg'] ?? null) || $item['bagWeightKg'] <= 0)) $fail();
                if ($item['type'] === 'production') {
                    if (empty($item['ingredients']) || !is_array($item['ingredients'])) $fail();
                    foreach ($item['ingredients'] as $ingredient) if (!is_array($ingredient) || !is_string($ingredient['product'] ?? null) || !trim($ingredient['product']) || !$number($ingredient['quantityKg'] ?? null) || $ingredient['quantityKg'] <= 0 || $ingredient['product'] === $item['product']) $fail();
                }
            }
        }
    }
    $purchases = []; $consumed = [];
    foreach ($data['movements'] as $movement) if ($movement['type'] === 'purchase') $purchases[$movement['id']] = $movement;
    foreach ($data['movements'] as $movement) {
        if (empty($movement['purchaseId'])) continue;
        $source = $purchases[$movement['purchaseId']] ?? null;
        if ($movement['type'] !== 'feed' || !$source || $source['product'] !== $movement['product'] || $source['date'] > $movement['date']) $fail();
        $cost = round($source['amount'] / $source['quantityKg'] * $movement['quantityKg'], 2);
        if (abs($movement['amount'] - $cost) > 0.011) $fail();
        $consumed[$source['id']] = ($consumed[$source['id']] ?? 0) + $movement['quantityKg'];
    }
    foreach ($consumed as $id => $kg) if ($kg > $purchases[$id]['quantityKg'] + 0.001) $fail();
    foreach ($batchIds as $id => $batch) {
        $removed = 0;
        foreach ($data['records'] as $record) if ($record['batchId'] === $id && $record['category'] === 'mortalidad') $removed += $record['quantity'];
        foreach ($data['departures'] as $departure) if ($departure['batchId'] === $id) {
            if ($departure['date'] < $batch['startDate']) $fail();
            $removed += $departure['count'];
        }
        if ($removed > $batch['initialCount']) $fail();
    }
}
