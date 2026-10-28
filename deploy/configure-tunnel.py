"""Add the requested hostname without displaying any tunnel credentials."""
from pathlib import Path
import datetime
import os
import re
import shutil
import subprocess

path = Path('/etc/cloudflared/config.yml')
original = path.read_text()
hostname = 'sembrador.okto.ie'
if re.search(r'^\s*-\s*hostname:\s*sembrador\.okto\.ie\s*$', original, re.M):
    raise SystemExit('Hostname already configured; inspect its route before updating.')
rule = '  - hostname: sembrador.okto.ie\n    service: http://localhost:8085\n'
updated, count = re.subn(r'(?m)^(  - service: http_status:404\s*)$', lambda match: rule + match.group(1), original)
if count != 1:
    raise SystemExit('Expected one final catch-all rule; configuration preserved.')
stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
backup = path.with_name('config.yml.before-sembrador-' + stamp)
shutil.copy2(path, backup)
os.chmod(backup, 0o600)
staged = path.with_name('config-sembrador-staged.yml')
staged.write_text(updated)
os.chmod(staged, 0o600)
subprocess.run(['cloudflared','tunnel','--config',str(staged),'ingress','validate'], check=True)
os.replace(staged, path)
print('Added only sembrador.okto.ie -> localhost:8085. Original saved on the server.')
