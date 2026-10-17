const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const allowed = new Set(['index.html', '01-crest.html', '02-connected.html', '03-monogram.html', 'concepts.css', 'concepts.js']);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
const port = Number(process.argv[2] || 4181);
http.createServer((req, res) => {
  const name = new URL(req.url, 'http://localhost').pathname.slice(1) || 'index.html';
  if (!allowed.has(name)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': mime[path.extname(name)], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  fs.createReadStream(path.join(__dirname, name)).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`Login refinements: http://127.0.0.1:${port}/`));
