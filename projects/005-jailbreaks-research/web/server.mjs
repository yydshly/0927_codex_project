import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const port = 5185;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };
const guideAssets = new Map(['jailbreaks-overview.png', 'jailbreaks-overview.svg'].map(name => [`/assets/${name}`, resolve(root, '../assets', name)]));
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const path = guideAssets.get(pathname) ?? resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!guideAssets.has(pathname) && !path.startsWith(root + sep)) { res.writeHead(403); res.end('Forbidden'); return; }
    if (!types[extname(path)]) { res.writeHead(404); res.end('Not found'); return; }
    const data = await readFile(path);
    res.writeHead(200, { 'Content-Type': types[extname(path)], 'Cache-Control': 'no-store' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}/`));
