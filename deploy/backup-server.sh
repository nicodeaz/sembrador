#!/bin/sh
set -eu
umask 077
docker exec --user www-data sembrador-app php /var/www/html/api/backup.php /backups
# Keep the access hash separately; no clear-text PIN is included in backups.
docker exec --user www-data sembrador-app php -r 'copy("/var/lib/sembrador/pin.json", "/backups/pin.json"); chmod("/backups/pin.json", 0600);'
