import { spawn } from 'node:child_process';
import { mkdir, mkdtemp } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const directory = process.env.SEMBRADOR_PREVIEW_DIR || await mkdtemp(path.join(os.tmpdir(), 'sembrador-preview-'));
await mkdir(path.join(directory, 'sessions'), { recursive: true });
const php = process.env.PHP_BINARY || (process.platform === 'win32' ? 'C:\\xampp\\php\\php.exe' : 'php');
const child = spawn(php, ['-d', `session.save_path=${path.join(directory, 'sessions')}`, '-S', '127.0.0.1:8307', '-t', 'dist'], {
  cwd: path.resolve(import.meta.dirname, '..'), windowsHide: true,
  env: { ...process.env, SEMBRADOR_DATA_DIR: path.join(directory, 'data'), SEMBRADOR_INITIAL_PIN: '742913' }, stdio: 'inherit',
});
console.log('Local disposable preview: http://127.0.0.1:8307 — test PIN 742913. Not production.');
process.on('SIGINT', () => child.kill());
process.on('SIGTERM', () => child.kill());
