// Serve only the generated build, on loopback. No external hosting or dependencies.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../build/web-mobile');
const port = Number(process.env.FACTORY_PREVIEW_PORT || 8088);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.wasm': 'application/wasm', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
if (!fs.existsSync(path.join(root, 'index.html'))) throw new Error('Build missing. Run tools/build-web-mobile.ps1 first.');
const server = http.createServer((req, res) => {
    let file;
    try {
        const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
        file = path.resolve(root, '.' + pathname);
        if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
        if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    } catch { res.writeHead(400); res.end(); return; }
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    const stream = fs.createReadStream(file);
    stream.on('error', () => res.destroy());
    stream.pipe(res);
});
server.listen(port, '127.0.0.1', () => console.log(`Factory build: http://127.0.0.1:${port}`));
