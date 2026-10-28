#!/bin/sh
set -eu
# Keep a second connector online while the main process loads the added route.
unit=el-sembrador-web-tunnel-rollover-20261028
tunnel=d239fecd-0a9f-4b2e-a5ea-a3cfce63f674
sudo -n systemd-run --unit="$unit" --collect /usr/local/bin/cloudflared --no-autoupdate tunnel --config /etc/cloudflared/config.yml --metrics 127.0.0.1:20242 run "$tunnel"
ready=0
for attempt in 1 2 3 4 5 6 7 8 9 10; do
    if curl -fsS http://127.0.0.1:20242/ready >/dev/null; then ready=1; break; fi
    sleep 2
done
if test "$ready" != 1; then
    printf 'Temporary connector did not become healthy. Main tunnel was not restarted.\n' >&2
    exit 1
fi
sudo -n systemctl restart cloudflared
ready=0
for attempt in 1 2 3 4 5 6 7 8 9 10; do
    if curl -fsS http://127.0.0.1:20241/ready >/dev/null; then ready=1; break; fi
    sleep 2
done
if test "$ready" != 1; then
    printf 'Main connector did not become healthy. Temporary connector left running to preserve service.\n' >&2
    exit 1
fi
sudo -n systemctl stop "$unit"
printf 'Primary tunnel healthy; temporary replica stopped.\n'
