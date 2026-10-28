import http from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const port = Number(process.env.PORT || 8310);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Puerto inválido.');
await stat(path.join(root, 'index.html'));
const rootReal = await realpath(root);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const server = http.createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return; }
  try {
    const requestedPath = decodeURIComponent(new URL(request.url, `http://127.0.0.1:${port}`).pathname);
    if (requestedPath.includes('\\') || requestedPath.includes('\0') || requestedPath.includes(':') || requestedPath.split('/').some(part => part.startsWith('.') && part !== '')) throw new Error('Invalid path');
    const filename = path.resolve(root, `.${requestedPath === '/' ? '/index.html' : requestedPath}`);
    if (filename !== root && !filename.startsWith(root + path.sep)) throw new Error('Invalid path');
    const actual = await realpath(filename);
    if (!actual.startsWith(rootReal + path.sep)) throw new Error('Invalid path');
    const info = await stat(actual);
    if (!info.isFile()) throw new Error('Not a file');
    const body = request.method === 'HEAD' ? undefined : await readFile(actual);
    response.writeHead(200, { 'Content-Type': types[path.extname(actual)] || 'application/octet-stream', 'Content-Length': body ? body.length : info.size });
    response.end(body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(request.method === 'HEAD' ? undefined : 'Página no encontrada.');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`El Sembrador: http://127.0.0.1:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
