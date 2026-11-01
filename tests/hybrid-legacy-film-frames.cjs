// P0 visual regression: compare frozen M6.5 against the current integration tree in
// the SAME browser/renderer environment. Protects old-film frames when extending
// character and world systems; no unreviewed snapshot re-recording is permitted.
// Requires Node 22+, Playwright/Chromium and full git history (checkout fetch-depth: 0).
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const http=require('node:http');
const cp=require('node:child_process');
const crypto=require('node:crypto');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const BASE=JSON.parse(fs.readFileSync(path.join(ROOT,'spec/hybrid-v6-baseline.json'),'utf8')).baseline_commit;
const MIME={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.json':'application/json','.css':'text/css','.wasm':'application/wasm',
 '.mp3':'audio/mpeg','.ogg':'audio/ogg','.mp4':'video/mp4','.webm':'video/webm',
 '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml',
 '.woff':'font/woff','.woff2':'font/woff2','.glb':'model/gltf-binary'};
const EPISODES=[
 {key:'comedy',id:'zero-latency',times:[.5,4.2,7.9,15,21,25.9,32.5]},
 {key:'darkmode',id:'dark-mode',times:[.5,3.5,8,13.5,19,24.6,30.5]}
];
const hash=dataUrl=>crypto.createHash('sha256')
 .update(Buffer.from(dataUrl.split(',')[1],'base64')).digest('hex');
function serve(root){
 return new Promise(resolve=>{
  const server=http.createServer((req,res)=>{
   let rel;
   try {rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}
   catch {res.writeHead(400);return res.end('Invalid URL');}
   const relative=rel==='/'?'index.html':rel.replace(/^\//,'');
   const file=path.resolve(root,relative);
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.writeHead(404);return res.end('Not found');
   }
   const size=fs.statSync(file).size;
   const headers={'content-type':MIME[path.extname(file)]||'application/octet-stream',
     'accept-ranges':'bytes','cache-control':'no-store'};
   // Video/audio on the page require byte-range responses; support single valid ranges.
   const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range||'');
   if(m){
    const start=m[1]?Number(m[1]):size-Number(m[2]);
    const end=m[1]&&m[2]?Math.min(Number(m[2]),size-1):size-1;
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||end<start||end>=size){
     res.writeHead(416,{'content-range':'bytes */'+size});return res.end();
    }
    res.writeHead(206,{...headers,'content-range':'bytes '+start+'-'+end+'/'+size,'content-length':end-start+1});
    return fs.createReadStream(file,{start,end}).pipe(res);
   }
   res.writeHead(200,{...headers,'content-length':size});
   fs.createReadStream(file).pipe(res);
  });
  server.listen(0,'127.0.0.1',()=>resolve(server));
 });
}
async function snapshot(browser,server,episode){
 const page=await browser.newPage({viewport:{width:1140,height:860}});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try {
  const url='http://127.0.0.1:'+server.address().port+'/studio.html';
  const r=await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  assert.equal(r.status(),200);
  await page.waitForFunction(()=>window.FrameForgeProjectsLoaded&&
   window.FrameForgeQA?.shots().length>0&&window.FrameForgeQA.envelopeReady(),
   null,{timeout:120000});
  if(episode.key!=='comedy'){
   await page.locator('#preset').selectOption(episode.key);
   await page.waitForFunction(id=>window.FrameForgeCurrentProject?.id===id,
     episode.id,{timeout:30000});
  }
  const result=await page.evaluate(times=>times.map(t=>FrameForgeQA.renderFilmFrame(t,360,640)),episode.times);
  assert.deepEqual(errors,[],'page runtime errors');
  return result.map(hash);
 } finally {await page.close();}
}
(async()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'frameforge-v6-parity-'));
 const baseline=path.join(tmp,'frozen');
 const git=(args)=>cp.execFileSync('git',args,{cwd:ROOT,encoding:'utf8',timeout:60000});
 let checkedOut=false,browser,oldServer,newServer;
 try {
  git(['worktree','add','--detach',baseline,BASE]);checkedOut=true;
  [oldServer,newServer]=await Promise.all([serve(baseline),serve(ROOT)]);
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl',
   '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader',
   '--disable-dev-shm-usage']});
  let checks=0;
  for(const episode of EPISODES){
   const [oldFrames,newFrames]=await Promise.all([
    snapshot(browser,oldServer,episode),snapshot(browser,newServer,episode)
   ]);
   for(let i=0;i<episode.times.length;i++){
    assert.equal(newFrames[i],oldFrames[i],
     episode.id+' at '+episode.times[i]+'s differs from frozen M6.5; review the pixel change before proceeding');
    checks++;
   }
  }
  console.log('HYBRID_LEGACY_VISUAL_PARITY_PASS '+checks+' frames, 2 films, frozen commit '+BASE);
 } finally {
  if(browser)await browser.close();
  for(const srv of [oldServer,newServer])if(srv)await new Promise(resolve=>srv.close(resolve));
  if(checkedOut)git(['worktree','remove','--force',baseline]);
  fs.rmSync(tmp,{recursive:true,force:true});
 }
})().catch(e=>{console.error('HYBRID_LEGACY_VISUAL_PARITY_FAIL '+e.stack);process.exitCode=1;});
