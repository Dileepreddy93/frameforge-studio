// Music and sound effects in the browser (M2.5), in the studio with the real Kokoro model. A line edited in a finished
// episode (Zero Latency, first four shots) is re-voiced in the browser and the episode keeps its score and sound
// effects: music under the lines and in the pauses, the typing and pop cues where the episode puts them, mastered to
// -14 LUFS, in stereo, and in the exported MP4. Writes the MP4 to FRAMEFORGE_MIX_OUT (if set) for listening.
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
const LINE='Our app takes twelve whole seconds to load.';
const OUT=process.env.FRAMEFORGE_MIX_OUT;

(async()=>{
 const server=await serve();
 const base=`http://127.0.0.1:${server.address().port}/`,profile=fs.mkdtempSync(path.join(os.tmpdir(),'frameforge-mix-'));
 const context=await chromium.launchPersistentContext(profile,{headless:true,channel:process.env.FRAMEFORGE_CHANNEL||'chrome',viewport:{width:1100,height:850},
  args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 await useCdnMirror(context);
 const errors=[];
 try{
  const page=context.pages()[0]||await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'studio.html',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.FrameForgeProjectsLoaded&&window.FrameForgeQA?.shots().length>0&&window.FrameForgeVoiceQA&&
   FrameForgeVoiceQA.status().state!=='unknown',null,{timeout:90000});
  await page.evaluate(()=>FrameForgeQA.setOffline(true));
  if(await page.evaluate(()=>FrameForgeVoiceQA.status().state)==='missing')await page.click('#voiceDownload');
  assert.equal((await page.evaluate(()=>FrameForgeVoiceQA.ensure())).state,'ready');

  // A finished episode, cut to four shots: it plays its mastered mix until a line changes.
  await page.evaluate(()=>{const p=FrameForgeQA.project('comedy');p.id='mix-test';p.shots=p.shots.slice(0,4);const kept=new Set(p.shots.map(s=>s.id));p.audio.music.cues=p.audio.music.cues.filter(c=>kept.has(c.shot));FrameForgeQA.openProject(p);FrameForgeQA.setOffline(true);});
  assert.equal(await page.evaluate(()=>FrameForgeVoiceQA.status().mode),'master');
  await page.click('#shots .shot');await page.fill('#dialogue',LINE);await page.click('#apply');
  await page.waitForFunction(t=>{const s=FrameForgeVoiceQA.status();return s.mode==='browser'&&!s.stale&&s.lines?.length===4&&s.mix&&FrameForgeQA.shots()[0].text===t},LINE,{timeout:600000});
  const r=await page.evaluate(()=>{
   const s=FrameForgeVoiceQA.status(),l=s.lines,shots=FrameForgeQA.shots();
   const end=i=>l[i].start+l[i].seconds;
   // shot-01's typing starts with the shot; shot-04's pop is 0.15 s into it.
   const shotStart=i=>l[i].start-shots[i].timing.lead;
   return {mix:s.mix,status:document.querySelector('#voiceStatus').textContent,audioState:document.querySelector('#audioState').textContent,
    pauseMix:FrameForgeVoiceQA.mixRms(end(0)+.05,l[1].start-.05),pauseVoice:FrameForgeVoiceQA.rms(end(0)+.05,l[1].start-.05),
    typingMix:FrameForgeVoiceQA.mixRms(shotStart(0),l[0].start),typingVoice:FrameForgeVoiceQA.rms(shotStart(0),l[0].start),
    total:shots.reduce((a,s)=>a+s.duration,0)};
  });
  console.log('mix',JSON.stringify(r));
  assert.equal(r.mix.music,true,'the episode keeps its score after an edit');
  assert.equal(r.mix.effects,2,'and its two sound cues');
  assert.ok(Math.abs(r.mix.lufs+14)<.3,'mastered to -14 LUFS ('+r.mix.lufs.toFixed(2)+')');
  assert.ok(r.mix.peakDb<=-1.99,'peaks under the ceiling ('+r.mix.peakDb.toFixed(2)+' dBFS)');
  assert.ok(r.pauseVoice<.002&&r.pauseMix>.002,'music plays in the pause between lines');
  assert.ok(r.typingMix>3*r.typingVoice+.002,'the typing cue plays before DEV speaks');
  assert.match(r.status,/with music and 2 sound effects/);
  assert.match(r.audioState,/music and sound effects/);

  // The exported MP4 carries the stereo master.
  const frames=Math.round(r.total*30);
  const mp4=await page.evaluate(async n=>{const x=await FrameForgeMP4Test({frameLimit:n,width:360,height:640,download:false});
   const bytes=new Uint8Array(await x.blob.arrayBuffer());let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));
   return {base64:btoa(s),frames:x.frames};},frames);
  assert.equal(mp4.frames,frames);
  const file=path.join(OUT||profile,'edited-episode-with-music.mp4');
  if(OUT)fs.mkdirSync(OUT,{recursive:true});
  fs.writeFileSync(file,Buffer.from(mp4.base64,'base64'));
  const info=JSON.parse(spawnSync('ffprobe',['-v','error','-show_entries','stream=codec_type,codec_name,channels:format=duration','-of','json',file],{encoding:'utf8'}).stdout);
  const audio=info.streams.find(s=>s.codec_type==='audio');
  assert.equal(audio?.channels,2,'stereo');
  const loud=spawnSync('ffmpeg',['-hide_banner','-i',file,'-map','0:a','-af','ebur128=peak=true','-f','null','-'],{encoding:'utf8'}).stderr;
  const lufs=Number(loud.match(/I:\s+(-?[\d.]+) LUFS\s*\n\s*Threshold/)?.[1]),peak=Number(loud.match(/Peak:\s+(-?[\d.]+) dBFS/)?.[1]);
  assert.ok(Math.abs(lufs+14)<1,'the MP4 is at -14 LUFS ('+lufs+')');
  assert.ok(peak<=-1,'true peak under -1 dBTP ('+peak+')');
  // Left and right differ: the music is stereo.
  const pcm=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-i',file,'-map','0:a','-f','f32le','-'],{maxBuffer:1<<28}).stdout;
  const x=new Float32Array(pcm.buffer.slice(pcm.byteOffset,pcm.byteOffset+pcm.length));let diff=0,sum=0;
  for(let i=0;i<x.length;i+=2){diff+=(x[i]-x[i+1])**2;sum+=x[i]**2;}
  // Chrome's WebCodecs Opus (the fallback where there's no AAC encoder, e.g. Chrome on Linux) keeps the channels
  // but narrows the music's quiet stereo about 70x (M4.4), so it is held to "not identical" only.
  assert.ok(diff/sum>(audio.codec_name==='aac'?1e-3:1e-6),'left and right differ ('+audio.codec_name+', '+(diff/sum).toExponential(2)+')');
  assert.deepEqual(errors,[],'no page errors');
  console.log('EPISODE_MIX_BROWSER_PASS',JSON.stringify({mix:r.mix,mp4:{lufs,truePeak:peak,channels:audio.channels,duration:info.format.duration}}));
 }finally{
  await context.close();server.close();
  fs.rmSync(profile,{recursive:true,force:true});
 }
})().catch(e=>{console.error(e);process.exit(1)});
