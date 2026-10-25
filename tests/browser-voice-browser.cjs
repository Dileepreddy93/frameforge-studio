// In-browser voices (M2.1): a line typed in the studio is voiced by Kokoro inside the page, re-times
// its shot, drives the mouth and lands in the exported MP4. Then the server goes away and the network
// is cut: the studio reloads from its offline cache and voices a new line with no connection at all.
// Uses models/kokoro-82m-v1.0/ when present (fast); otherwise the page downloads the model (326 MB).
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {chromium}=require('playwright');

const ROOT=path.resolve(__dirname,'..');
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.mp3':'audio/mpeg','.png':'image/png','.wasm':'application/wasm'};
function serve(){
 const server=http.createServer((req,res)=>{
  const file=path.join(ROOT,decodeURIComponent(new URL(req.url,'http://x').pathname).replace(/\/$/,'/index.html'));
  if(!file.startsWith(ROOT)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end();}
  res.writeHead(200,{'content-type':TYPES[path.extname(file)]||'application/octet-stream','content-length':fs.statSync(file).size});
  if(req.method==='HEAD')return res.end();
  fs.createReadStream(file).pipe(res);
 });
 return new Promise(ok=>server.listen(0,'127.0.0.1',()=>ok(server)));
}
const NEW_LINE='Twelve seconds is far too slow for our users.';
const OFFLINE_LINE='Offline, the studio still has a voice.';

async function openStudio(page,url){
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.FrameForgeProjectsLoaded&&window.FrameForgeQA?.shots().length>0&&window.FrameForgeVoiceQA&&
  FrameForgeVoiceQA.status().state!=='unknown',null,{timeout:90000});
 // Stop the live preview loop: it competes with the voice model for the CPU.
 await page.evaluate(()=>FrameForgeQA.setOffline(true));
}
// A three-line storyboard from the mystery episode, voiced from scratch.
const openShortProject=page=>page.evaluate(()=>{
 const p=FrameForgeQA.project('mystery');p.id='voice-test';p.shots=p.shots.slice(0,3);
 FrameForgeQA.openProject(p);FrameForgeQA.setOffline(true);
});
async function typeLine(page,text){
 await page.click('#shots .shot');
 await page.fill('#dialogue',text);
 await page.click('#apply');
 await page.waitForFunction(t=>{const s=FrameForgeVoiceQA.status();return s.mode==='browser'&&!s.stale&&FrameForgeQA.shots()[0].text===t&&s.lines?.length===3},text,{timeout:300000});
}
const lineCheck=page=>page.evaluate(()=>{
 const s=FrameForgeVoiceQA.status(),shot=FrameForgeQA.shots()[0],line=s.lines[0],next=s.lines[1];
 const end=line.start+line.seconds;
 // The loudest 50 ms of the line, and a quiet moment in the pause after it.
 const env=FrameForgeQA.envelope();let peak=line.start;for(let t=line.start;t<end;t+=.05)if(env[Math.floor(t*20)]>env[Math.floor(peak*20)])peak=t;
 const quiet=(end+next.start)/2;
 // The loudest moment can be a closed-lip sound (the "v" of "voice"), so the mouth is the widest frame of the line.
 let mouth=0;for(let t=line.start;t<end;t+=1/30){FrameForgeQA.setTime(t);mouth=Math.max(mouth,FrameForgePerformanceQA.peek().mouthScale);}
 const voiced={cue:FrameForgeSpeechQA.at(peak),mouth};
 FrameForgeQA.setTime(quiet);const silent={cue:FrameForgeSpeechQA.at(quiet),mouth:FrameForgePerformanceQA.peek().mouthScale};
 return {line,shot:{duration:shot.duration,timing:shot.timing},speech:FrameForgeVoiceQA.rms(line.start+.06,end-.1),
  pause:FrameForgeVoiceQA.rms(end+.02,next.start-.02),voiced,silent,lines:s.lines};
});
function assertLine(r,text,label){
 assert.ok(r.line.seconds>1&&r.line.seconds<6,label+': plausible line length '+r.line.seconds);
 assert.equal(r.shot.duration,Math.round((r.shot.timing.lead+r.line.seconds+r.shot.timing.pauseAfter)*30)/30,label+': shot is re-timed from its voice');
 assert.ok(r.speech>.03,label+': the line is audible (rms '+r.speech+')');
 assert.ok(r.pause<.002,label+': the pause after it is silent (rms '+r.pause+')');
 assert.equal(r.voiced.cue.voiced,true,label+': lip sync sees the voice');
 assert.equal(r.silent.cue.voiced,false,label+': and the silence');
 assert.ok(r.voiced.mouth>r.silent.mouth+.2,label+': the mouth opens on the line');
}

(async()=>{
 let server=await serve();
 const base=`http://127.0.0.1:${server.address().port}/`,profile=fs.mkdtempSync(path.join(os.tmpdir(),'frameforge-voice-'));
 // Google Chrome, not Playwright's Chromium: the in-browser MP4 export needs Chrome's H.264 encoder, as buyers have.
 // A real profile on disk, because an in-memory one is too small to keep the 326 MB model.
 const context=await chromium.launchPersistentContext(profile,{headless:true,channel:'chrome',viewport:{width:1100,height:850},
  args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const errors=[];
 try{
  const page=context.pages()[0]||await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await openStudio(page,base+'studio.html');

  // 1. Text to phonemes with no model: the misaki dictionary port (no eSpeak, no GPL).
  const ps=await page.evaluate(t=>FrameForgeVoiceQA.phonemize(t),NEW_LINE);
  assert.equal(ps.phonemes,'twˈɛlv sˈɛkəndz ɪz fˈɑɹ tˈu slˈO fɔɹ ˌWəɹ jˈuzəɹz.');

  // 2. The model: the local copy (or Hugging Face) once, then the browser's cache.
  if(await page.evaluate(()=>FrameForgeVoiceQA.status().state)==='missing')await page.click('#voiceDownload');
  const engine=await page.evaluate(()=>FrameForgeVoiceQA.ensure());
  assert.equal(engine.state,'ready');assert.match(engine.model,/^kokoro-82m-v1\.0-fp32@/);
  console.log('voice engine',JSON.stringify(engine));

  // 3. A storyboard voices itself; a new line typed in the shot editor is voiced and re-times its shot.
  await openShortProject(page);
  await page.waitForFunction(()=>FrameForgeVoiceQA.status().mode==='browser',null,{timeout:300000});
  await typeLine(page,NEW_LINE);
  const online=await lineCheck(page);
  assertLine(online,NEW_LINE,'online');
  assert.equal(online.line.phonemes,ps.phonemes);
  assert.equal(online.line.cached,false,'the new line was synthesised');
  assert.ok(online.lines.slice(1).every(l=>l.cached),'unchanged lines come from the line cache');
  assert.match(await page.textContent('#voiceEngine'),/^Voices ready/);

  // 4. The voiced line lands in the exported MP4 (H.264 + AAC), on the same clock as the picture.
  const frames=Math.round(online.shot.duration*30);
  const mp4=await page.evaluate(async n=>{const r=await FrameForgeMP4Test({frameLimit:n,width:360,height:640,download:false});
   const bytes=new Uint8Array(await r.blob.arrayBuffer());let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));
   return {base64:btoa(s),duration:r.duration,frames:r.frames};},frames);
  assert.equal(mp4.frames,frames);
  const file=path.join(profile,'new-line.mp4');fs.writeFileSync(file,Buffer.from(mp4.base64,'base64'));
  if(process.env.FRAMEFORGE_VOICE_MP4)fs.copyFileSync(file,process.env.FRAMEFORGE_VOICE_MP4);
  const probe=spawnSync('ffprobe',['-v','error','-show_entries','stream=codec_type,codec_name:format=duration','-of','json',file],{encoding:'utf8'});
  if(probe.status===0){
   const info=JSON.parse(probe.stdout),audio=info.streams.find(s=>s.codec_type==='audio');
   assert.ok(audio&&info.streams.some(s=>s.codec_type==='video'),'the MP4 has picture and sound');
   const stats=spawnSync('ffmpeg',['-hide_banner','-i',file,'-map','0:a','-af','astats=measure_overall=RMS_level:measure_perchannel=none','-f','null','-'],{encoding:'utf8'});
   const rms=Number(stats.stderr.match(/RMS level dB:\s*(-?[\d.]+)/)?.[1]);
   assert.ok(rms>-35,'the MP4 carries the spoken line (RMS '+rms+' dB)');
   console.log('mp4',JSON.stringify({streams:info.streams,duration:info.format.duration,rms}));
  }else console.log('ffprobe not found: MP4 audio not inspected');

  // 5. Offline: no server, no network. The shell, the model and the lines come from the browser's caches.
  await new Promise(ok=>server.close(ok));server=null;
  await context.setOffline(true);
  await openStudio(page,base+'studio.html');
  await page.waitForFunction(()=>['ready','error'].includes(FrameForgeVoiceQA.status().state),null,{timeout:180000});
  assert.equal(await page.evaluate(()=>FrameForgeVoiceQA.status().state),'ready','the voices load offline from the cache');
  await openShortProject(page);
  await page.waitForFunction(()=>FrameForgeVoiceQA.status().mode==='browser',null,{timeout:300000});
  await typeLine(page,OFFLINE_LINE);
  const offline=await lineCheck(page);
  assertLine(offline,OFFLINE_LINE,'offline');
  assert.equal(offline.line.cached,false,'the offline line was synthesised offline');
  assert.deepEqual(errors,[],'no page errors');
  console.log('BROWSER_VOICE_PASS',JSON.stringify({online:{seconds:online.line.seconds,duration:online.shot.duration},offline:{seconds:offline.line.seconds,phonemes:offline.line.phonemes}}));
 }finally{
  await context.close();server?.close();
  fs.rmSync(profile,{recursive:true,force:true});
 }
})().catch(e=>{console.error(e);process.exit(1)});
