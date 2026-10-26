// Finished episodes offline (M2.6): after one visit, the studio opens with no server and no network, and the
// finished episode plays its mastered soundtrack (the audio element's range requests come from the cache), lip
// sync reads its voice track, and a few seconds of it export to MP4 with sound.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {chromium}=require('playwright');
const {useCdnMirror}=require('./cdn-mirror.cjs');

const ROOT=path.resolve(__dirname,'..');
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.mp3':'audio/mpeg','.png':'image/png','.wasm':'application/wasm'};
// A real server answers ranges, as Vercel does.
function serve(){
 const server=http.createServer((req,res)=>{
  const file=path.join(ROOT,decodeURIComponent(new URL(req.url,'http://x').pathname).replace(/\/$/,'/index.html'));
  if(!file.startsWith(ROOT)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end();}
  const size=fs.statSync(file).size,type=TYPES[path.extname(file)]||'application/octet-stream',m=/bytes=(\d*)-(\d*)/.exec(req.headers.range||'');
  if(m){const start=m[1]?Number(m[1]):0,end=m[2]?Math.min(Number(m[2]),size-1):size-1;
   res.writeHead(206,{'content-type':type,'content-range':`bytes ${start}-${end}/${size}`,'content-length':end-start+1,'accept-ranges':'bytes'});
   return fs.createReadStream(file,{start,end}).pipe(res);}
  res.writeHead(200,{'content-type':type,'content-length':size,'accept-ranges':'bytes'});
  if(req.method==='HEAD')return res.end();
  fs.createReadStream(file).pipe(res);
 });
 return new Promise(ok=>server.listen(0,'127.0.0.1',()=>ok(server)));
}
async function open(page,url){
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.FrameForgeProjectsLoaded&&window.FrameForgeQA?.shots().length>0&&window.FrameForgeVoiceQA,null,{timeout:90000});
}

(async()=>{
 let server=await serve();
 const base=`http://127.0.0.1:${server.address().port}/`,profile=fs.mkdtempSync(path.join(os.tmpdir(),'frameforge-offline-'));
 const context=await chromium.launchPersistentContext(profile,{headless:true,channel:process.env.FRAMEFORGE_CHANNEL||'chrome',viewport:{width:1100,height:850},
  args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
 await useCdnMirror(context);
 const errors=[];
 try{
  const page=context.pages()[0]||await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  // One visit online: the service worker installs and keeps the shell and every finished episode's audio.
  await open(page,base+'studio.html');
  await page.evaluate(()=>navigator.serviceWorker.ready);
  const kept=await page.waitForFunction(async()=>{const c=await caches.open('frameforge-shell-v2'),keys=(await c.keys()).map(r=>new URL(r.url).pathname);
   const need=['/audio/zero-latency/mix.mp3','/audio/zero-latency/voice.mp3','/audio/dark-mode/mix.mp3','/audio/dark-mode/voice.mp3'];
   return need.every(n=>keys.includes(n))&&keys.length;},null,{timeout:120000,polling:500}).then(h=>h.jsonValue());
  console.log('offline cache entries',kept);

  // Offline: no server, no network.
  await new Promise(ok=>server.close(ok));server=null;
  await context.setOffline(true);
  await open(page,base+'studio.html');
  assert.equal(await page.evaluate(()=>FrameForgeVoiceQA.status().mode),'master','Zero Latency opens as a finished episode');
  await page.waitForFunction(()=>FrameForgeQA.envelopeReady(),null,{timeout:60000});
  assert.ok((await page.evaluate(()=>FrameForgeQA.envelope()?.length))>100,'lip sync read the voice track offline');
  // Play: the mastered mix streams from the cache.
  await page.click('#play');
  await page.waitForFunction(()=>{const a=FrameForgeVoiceQA.soundtrack();return a.error||a.currentTime>1;},null,{timeout:60000});
  const playing=await page.evaluate(()=>FrameForgeVoiceQA.soundtrack());
  assert.equal(playing.error,null,'no media error');
  assert.ok(playing.currentTime>1&&playing.duration>30,'the 38 s soundtrack plays offline: '+JSON.stringify(playing));
  await page.click('#play');
  // Seek near the end: another range request, answered from the cache.
  await page.$eval('#scrub',el=>{el.value='30';el.dispatchEvent(new Event('input'));});
  await page.click('#play');
  await page.waitForFunction(()=>{const a=FrameForgeVoiceQA.soundtrack();return a.error||a.currentTime>30.5;},null,{timeout:60000});
  assert.equal(await page.evaluate(()=>FrameForgeVoiceQA.soundtrack().error),null,'seeking offline works');
  await page.click('#play');
  // Export two seconds to MP4 with the mastered sound, offline.
  const mp4=await page.evaluate(async()=>{const r=await FrameForgeMP4Test({frameLimit:60,width:360,height:640,download:false});
   const bytes=new Uint8Array(await r.blob.arrayBuffer());let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));
   return {base64:btoa(s),frames:r.frames};});
  assert.equal(mp4.frames,60);
  const file=path.join(profile,'offline.mp4');fs.writeFileSync(file,Buffer.from(mp4.base64,'base64'));
  const info=JSON.parse(spawnSync('ffprobe',['-v','error','-show_entries','stream=codec_type,channels','-of','json',file],{encoding:'utf8'}).stdout);
  assert.equal(info.streams.find(s=>s.codec_type==='audio')?.channels,2,'the offline MP4 carries the stereo master');
  const rms=Number(spawnSync('ffmpeg',['-hide_banner','-i',file,'-map','0:a','-af','astats=measure_overall=RMS_level:measure_perchannel=none','-f','null','-'],{encoding:'utf8'}).stderr.match(/RMS level dB:\s*(-?[\d.]+)/)?.[1]);
  assert.ok(rms>-40,'and it is not silent ('+rms+' dB)');
  assert.deepEqual(errors,[],'no page errors');
  console.log('OFFLINE_EPISODE_BROWSER_PASS',JSON.stringify({played:+playing.currentTime.toFixed(2),duration:+playing.duration.toFixed(2),mp4Rms:rms}));
 }finally{
  await context.close();server?.close();
  fs.rmSync(profile,{recursive:true,force:true});
 }
})().catch(e=>{console.error(e);process.exit(1)});
