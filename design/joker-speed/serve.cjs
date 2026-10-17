const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=__dirname,port=Number(process.argv[2]||4179);
const allowed=new Set(['index.html','01-open-lens.html','02-word-keys.html','03-big-letters.html','prototypes.css','prototypes.js','fixture.js']);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
http.createServer((req,res)=>{
  const file=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';
  if(!allowed.has(file)){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  fs.createReadStream(path.join(root,file)).pipe(res);
}).listen(port,'127.0.0.1',()=>console.log(`Joker speed studies: http://127.0.0.1:${port}/`));
