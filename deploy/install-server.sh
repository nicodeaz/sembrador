#!/bin/sh
# Install only the named Sembrador service. Data and backups are outside releases.
set -eu
release=20261027-recria-1
base=/home/ubuntu/sites/sembrador
private=/home/ubuntu/sembrador-private
cd "$base/releases/$release"
sudo -n install -d -m 0711 "$private"
sudo -n install -d -o 33 -g 33 -m 0700 "$private/data" "$private/backups"
export SEMBRADOR_RELEASE="$release"
docker compose -f deploy/compose.yaml up -d --wait
docker exec --user www-data -i sembrador-app php < deploy/initialize.php
ln -sfn "$base/releases/$release" "$base/current"
sh deploy/backup-server.sh
printf 'Sembrador installed on loopback port 8085.\n'
