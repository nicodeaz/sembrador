import { readdir, copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
async function copyApi(relative = '') {
  for (const entry of await readdir(path.join(root, 'api', relative), { withFileTypes: true })) {
    if (entry.name === 'data' || entry.name === 'config.local.php') continue;
    const target = path.join('api', relative, entry.name);
    if (entry.isDirectory()) await copyApi(path.join(relative, entry.name));
    else if (entry.name.endsWith('.php') || entry.name === '.htaccess') {
      await mkdir(path.dirname(path.join(root, 'dist', target)), { recursive: true });
      await copyFile(path.join(root, target), path.join(root, 'dist', target));
    }
  }
}
await copyApi();
console.log('Release ready in dist/: frontend + PHP, without data, backups or private configuration.');
