<?php
// CLI-only initialization; never copied to the public application directory.
if (PHP_SAPI !== 'cli') exit(1);
require '/var/www/html/api/config.php';
require '/var/www/html/api/lib/farm_store.php';
ensure_data_dir();
if (file_exists(pin_file_path())) { fwrite(STDERR, "Existing PIN preserved\n"); exit(0); }
$pin = str_pad((string) random_int(0,999999),6,'0',STR_PAD_LEFT);
set_pin($pin);
farm_database();
$access = "El Sembrador\nhttps://sembrador.okto.ie\nPIN inicial: " . $pin . "\nCambiarlo desde Respaldos y acceso.\n";
file_put_contents(DATA_DIR . '/initial-access.txt',$access);
chmod(DATA_DIR . '/initial-access.txt',0600);
echo "Storage initialized; access details saved privately.\n";
