const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=__dirname,port=Number(process.argv[2]||4178);
const allowed=new Set(['index.html','01-tile-bloom.html','02-word-dock.html','03-letter-lens.html','prototypes.css','prototypes.js','fixture.js']);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
const server=http.createServer((req,res)=>{
  const file=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';
  if(!allowed.has(file)){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  fs.createReadStream(path.join(root,file)).pipe(res);
});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`Port ${port} is occupied. Pass another port as the first argument.`:e.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`Joker prototypes: http://127.0.0.1:${port}/`));
