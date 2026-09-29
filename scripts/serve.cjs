const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../dist'),port=Number(process.env.PORT || 4173);
http.createServer((req,res)=>{
  let requested;try{requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
  let file=path.resolve(root,'.'+requested);if(!file.startsWith(root+path.sep) && file!==root){res.writeHead(403).end();return;}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.txt':'text/plain','.json':'application/json'};
  if(!fs.existsSync(file)){res.writeHead(404).end('Not found');return;}
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'});fs.createReadStream(file).pipe(res);
}).listen(port,'127.0.0.1',()=>console.log(`Preview: http://127.0.0.1:${port}/online/`));
