#!/bin/sh
set -eu
# A temporary replica keeps existing routes available during the service restart.
sudo -n systemd-run --unit=sembrador-tunnel-rollover --collect /usr/local/bin/cloudflared --no-autoupdate tunnel --config /etc/cloudflared/config.yml --metrics 127.0.0.1:20242 run d239fecd-0a9f-4b2e-a5ea-a3cfce63f674
ready=0
for attempt in 1 2 3 4 5 6 7 8 9 10; do
    if curl -fsS http://127.0.0.1:20242/ready >/dev/null; then ready=1; break; fi
    sleep 2
done
test "$ready" = 1
sudo -n systemctl restart cloudflared
ready=0
for attempt in 1 2 3 4 5 6 7 8 9 10; do
    if curl -fsS http://127.0.0.1:20241/ready >/dev/null; then ready=1; break; fi
    sleep 2
done
test "$ready" = 1
sudo -n systemctl stop sembrador-tunnel-rollover
printf 'Primary tunnel healthy; temporary replica stopped.\n'
