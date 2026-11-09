// A small static file server for the browser tests, with the content types Vercel sends. Python's http.server takes
// them from the Windows registry, where .mjs can be text/plain, and the browser then refuses to load a module worker
// (the studio's mixer). Only for tests; serves the folder it is given (default: the repository).
//   node tests/static-server.cjs [port=8959] [root=.]
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const PORT=Number(process.argv[2]||process.env.PORT||8959);
const ROOT=path.resolve(process.argv[3]||path.join(__dirname,'..'));
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8',
 '.cjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8',
 '.wasm':'application/wasm','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg',
 '.webp':'image/webp','.ico':'image/x-icon','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.mp4':'video/mp4',
 '.webm':'video/webm','.glb':'model/gltf-binary','.txt':'text/plain; charset=utf-8','.md':'text/markdown; charset=utf-8',
 '.webmanifest':'application/manifest+json','.woff2':'font/woff2'};

const server=http.createServer((req,res)=>{
 let rel;
 try{rel=decodeURIComponent(new URL(req.url,'http://x').pathname);}catch{res.writeHead(400).end();return;}
 let file=path.join(ROOT,rel);
 if(file!==ROOT&&!file.startsWith(ROOT+path.sep)){res.writeHead(403).end();return;}
 fs.stat(file,(err,st)=>{
  if(!err&&st.isDirectory()){file=path.join(file,'index.html');try{st=fs.statSync(file)}catch(e){err=e}}
  if(err||!st.isFile()){res.writeHead(404,{'content-type':'text/plain'}).end('not found');return;}
  const headers={'content-type':TYPES[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-cache',
   'accept-ranges':'bytes'};
  // Range requests: the <video> and <audio> elements seek with them.
  const range=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range||'');
  if(range&&(range[1]||range[2])){
   let start=range[1]?Number(range[1]):Math.max(0,st.size-Number(range[2])),end=range[1]&&range[2]?Number(range[2]):st.size-1;
   end=Math.min(end,st.size-1);
   if(start>end||start>=st.size){res.writeHead(416,{'content-range':`bytes */${st.size}`}).end();return;}
   res.writeHead(206,{...headers,'content-range':`bytes ${start}-${end}/${st.size}`,'content-length':end-start+1});
   if(req.method==='HEAD')return res.end();
   fs.createReadStream(file,{start,end}).pipe(res);return;
  }
  res.writeHead(200,{...headers,'content-length':st.size});
  if(req.method==='HEAD')return res.end();
  fs.createReadStream(file).pipe(res);
 });
});
server.listen(PORT,'127.0.0.1',()=>console.log(`static server on http://127.0.0.1:${PORT}/ serving ${ROOT}`));
