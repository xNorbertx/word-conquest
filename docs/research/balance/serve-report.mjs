// Local-only viewer for the standalone study report; no game backend or credentials.
import http from 'node:http';import fs from 'node:fs';
http.createServer((req,res)=>{if(!['/','/balance.html'].includes(req.url)){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});fs.createReadStream('docs/research/balance-2026-10-04.html').pipe(res);}).listen(4176,'127.0.0.1',()=>console.log('Balance report: http://127.0.0.1:4176/'));
