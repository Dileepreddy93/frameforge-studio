// Same time must give the same film frame: fresh load, repeated, and after jumping from another time.
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const ROOT=path.resolve(__dirname,'..');
// Covers DEV/robot close-ups, duo wides and both screen inserts (before and after their bar reveal).
const TIMES=[0.5,1.5,4.2,7.9,11.3,15.0,18.4,21.0,24.6,25.9,32.5,38.7];
const JUMP_FROM=t=>t<20?t+17.3:t-17.3;
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.ogg':'audio/ogg','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.css':'text/css'};

function serve(){
 const server=http.createServer((req,res)=>{
  const file=path.join(ROOT,decodeURIComponent(new URL(req.url,'http://x').pathname).replace(/\/$/,'/index.html'));
  if(!file.startsWith(ROOT)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end();}
  res.writeHead(200,{'content-type':TYPES[path.extname(file)]||'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
 });
 return new Promise(ok=>server.listen(0,'127.0.0.1',()=>ok(server)));
}

const sha=dataUrl=>crypto.createHash('sha256').update(dataUrl.split(',')[1]).digest('hex').slice(0,16);

(async()=>{
 const server=await serve();
 const url=(process.env.FRAMEFORGE_URL||`http://127.0.0.1:${server.address().port}/`)+'studio.html';
 const outDir=process.env.FRAMEFORGE_ARTIFACT_DIR;
 if(outDir)fs.mkdirSync(outDir,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,
  args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const results=[],errors=[];
 for(const t of TIMES){
  const page=await browser.newPage({viewport:{width:1140,height:860}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForFunction(()=>window.FrameForgeProjectsLoaded&&window.FrameForgeQA?.shots().length>0&&window.FrameForgeQA.envelopeReady(),null,{timeout:60000});
  const frames=await page.evaluate(([t,other])=>{
   const r=x=>FrameForgeQA.renderFilmFrame(x,360,640);
   const fresh=r(t),repeated=r(t);r(other);const afterJump=r(t);
   return {fresh,repeated,afterJump};
  },[t,JUMP_FROM(t)]);
  const hashes=Object.fromEntries(Object.entries(frames).map(([k,v])=>[k,sha(v)]));
  const same=new Set(Object.values(hashes)).size===1;
  results.push({t,same,...hashes});
  if(outDir)for(const [k,v] of Object.entries(frames))fs.writeFileSync(path.join(outDir,`t${t.toFixed(1)}-${k}.jpg`),Buffer.from(v.split(',')[1],'base64'));
  await page.close();
 }
 await browser.close();server.close();
 console.table(results);
 const broken=results.filter(r=>!r.same);
 assert.equal(errors.length,0,'page errors: '+errors.join('; '));
 assert.equal(broken.length,0,'non-deterministic frames at t='+broken.map(r=>r.t).join(', '));
 console.log('DETERMINISM_BROWSER_PASS '+TIMES.length+' timestamps x 3 conditions');
})().catch(e=>{console.error('DETERMINISM_BROWSER_FAILURE '+e.message);process.exit(1)});
