"""Add the public landing route, preserving every existing tunnel rule."""
from pathlib import Path
import datetime
import os
import re
import shutil
import subprocess
import tempfile

config = Path('/etc/cloudflared/config.yml')
hostname = 'elsembrador.okto.ie'
original = config.read_text()
if re.search(r'^\s*-\s*hostname:\s*elsembrador\.okto\.ie\s*$', original, re.M):
    raise SystemExit('Public hostname already configured; no change made.')
rule = '  - hostname: elsembrador.okto.ie\n    service: http://localhost:8086\n'
updated, count = re.subn(r'(?m)^(  - service: http_status:404\s*)$', lambda match: rule + match.group(1), original)
if count != 1 or updated.replace(rule, '', 1) != original:
    raise SystemExit('Expected one final catch-all rule; configuration preserved.')
stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
backup = config.with_name('config.yml.before-elsembrador-web-' + stamp)
shutil.copy2(config, backup)
os.chmod(backup, 0o600)
descriptor, staged_name = tempfile.mkstemp(prefix='config-elsembrador-web-', suffix='.yml', dir=config.parent)
try:
    with os.fdopen(descriptor, 'w') as staged:
        staged.write(updated)
        staged.flush()
        os.fsync(staged.fileno())
    subprocess.run(['cloudflared', 'tunnel', '--config', staged_name, 'ingress', 'validate'], check=True)
    os.replace(staged_name, config)
except BaseException:
    Path(staged_name).unlink(missing_ok=True)
    raise
print('Added only elsembrador.okto.ie -> localhost:8086.')
print('Previous tunnel configuration: ' + str(backup))
