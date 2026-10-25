// Emotion in the voice (M2.2), in the studio with the real Kokoro model:
// 1. One line in DEV's voice, in every emotion: happy and surprised are higher, sad is lower, slower and quieter,
//    angry is louder; the words (phonemes) never change; neutral is exactly the M2.1 line.
// 2. In the shot inspector, changing the speaker's emotion re-voices that line only and re-times its shot; changing
//    a listener's emotion re-voices nothing. The emotional line is what the exported MP4 carries.
// 3. If the offline Python voices are installed (.venv), the same line and emotion from tools/voice_lines.py
//    moves the same way, so both paths agree.
// Writes every take to FRAMEFORGE_EMOTION_OUT (if set) for listening. Uses models/kokoro-82m-v1.0/ when present.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {chromium}=require('playwright');
const {useCdnMirror}=require('./cdn-mirror.cjs');
const emotion=require('../src/voice-emotion.js');

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
const LINE='Twelve seconds is far too slow for our users.';
const OUT=process.env.FRAMEFORGE_EMOTION_OUT;

function wav(file,samples,rate){
 const data=Buffer.alloc(samples.length*2);
 for(let i=0;i<samples.length;i++)data.writeInt16LE(Math.round(Math.max(-1,Math.min(1,samples[i]))*32767),i*2);
 const h=Buffer.alloc(44);
 h.write('RIFF',0);h.writeUInt32LE(36+data.length,4);h.write('WAVE',8);h.write('fmt ',12);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);
 h.writeUInt16LE(1,22);h.writeUInt32LE(rate,24);h.writeUInt32LE(rate*2,28);h.writeUInt16LE(2,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(data.length,40);
 fs.writeFileSync(file,Buffer.concat([h,data]));
}
const lufs=file=>Number(spawnSync('ffmpeg',['-hide_banner','-i',file,'-af','ebur128','-f','null','-'],{encoding:'utf8'}).stderr.match(/I:\s+(-?[\d.]+) LUFS\s*\n\s*Threshold/)?.[1]);
// Median pitch (Hz) and length (s) of a line, from the module's own YIN track.
function measure(samples,rate){
 const {f0}=emotion.pitchTrack(Float32Array.from(samples),rate);
 return {hz:emotion.median([...f0].filter(Boolean)),seconds:samples.length/rate};
}
const st=(a,b)=>12*Math.log2(b/a);

(async()=>{
 let server=await serve();
 const base=`http://127.0.0.1:${server.address().port}/`,profile=fs.mkdtempSync(path.join(os.tmpdir(),'frameforge-emotion-'));
 const work=OUT||fs.mkdtempSync(path.join(os.tmpdir(),'frameforge-emotion-takes-'));fs.mkdirSync(work,{recursive:true});
 // Google Chrome for its H.264 encoder (FRAMEFORGE_CHANNEL=chromium where Chrome is missing), on a real profile on disk.
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
  const engine=await page.evaluate(()=>FrameForgeVoiceQA.ensure());
  assert.equal(engine.state,'ready');
  console.log('voice engine',JSON.stringify(engine));

  // 1. The same line in DEV's voice, in every emotion.
  const takes={};
  const plain=await page.evaluate(t=>FrameForgeVoiceQA.samples(t,'am_michael',1).then(r=>({phonemes:r.phonemes,samples:r.samples})),LINE);
  for(const name of emotion.emotions){
   const r=await page.evaluate(([t,e])=>FrameForgeVoiceQA.samples(t,'am_michael',1,e),[LINE,name]);
   const file=path.join(work,'dev-'+name+'.wav');wav(file,r.samples,r.rate);
   // Loudness of the speech itself: the finished line's lead-in and tail are silent.
   takes[name]={...measure(r.samples,r.rate),lufs:lufs(file),phonemes:r.phonemes,emotion:r.emotion,ms:r.ms,cached:r.cached};
   if(name==='neutral')assert.deepEqual(r.samples,plain.samples,'neutral is exactly the line voiced without an emotion (M2.1)');
  }
  const n=takes.neutral,rel=name=>({pitch:+st(n.hz,takes[name].hz).toFixed(2),pace:+(takes[name].seconds/n.seconds).toFixed(3),loud:+(takes[name].lufs-n.lufs).toFixed(1)});
  const table=Object.fromEntries(emotion.emotions.map(e=>[e,rel(e)]));
  console.log('takes vs neutral',JSON.stringify(table));
  for(const name of emotion.emotions){
   assert.equal(takes[name].phonemes,n.phonemes,name+': the same words');
   assert.equal(takes[name].emotion,name);
   const d=emotion.delivery(name),r=table[name];
   if(name==='neutral')continue;
   assert.ok(Math.abs(r.pitch-d.pitch)<1,name+': pitch '+r.pitch+' st, wants about '+d.pitch);
   assert.ok(Math.abs(r.loud-d.gain)<1,name+': loudness '+r.loud+' LU, wants '+d.gain);
   // Kokoro's speed is not exactly proportional, and the finished line has a fixed lead-in and tail.
   if(d.speed!==1)assert.ok(Math.sign(1-r.pace)===Math.sign(d.speed-1),name+': pace x'+r.pace+' for speed x'+d.speed);
  }
  assert.ok(table.happy.pitch>.8&&table.surprised.pitch>table.happy.pitch,'happy is higher, surprised higher still');
  assert.ok(table.sad.pitch<-.8&&table.sad.pace>1.08&&table.sad.loud<-2,'sad is lower, slower and quieter');
  assert.ok(table.angry.loud>2,'angry is louder');
  // A second request for a take comes from the line cache.
  const again=await page.evaluate(t=>FrameForgeVoiceQA.speak(t,'am_michael',1,'sad'),LINE);
  assert.equal(again.cached,true,'emotional takes are cached too');

  // 2. The shot inspector: a three-line storyboard; DEV speaks shot 1.
  await page.evaluate(()=>{const p=FrameForgeQA.project('mystery');p.id='emotion-test';p.shots=p.shots.slice(0,3);FrameForgeQA.openProject(p);FrameForgeQA.setOffline(true);});
  await page.waitForFunction(()=>FrameForgeVoiceQA.status().mode==='browser',null,{timeout:300000});
  await page.click('#shots .shot');
  await page.fill('#dialogue',LINE);await page.click('#apply');
  const voiced=(emo)=>page.waitForFunction(([t,e])=>{const s=FrameForgeVoiceQA.status();return s.mode==='browser'&&!s.stale&&s.lines?.length===3&&FrameForgeQA.shots()[0].text===t&&s.lines[0].emotion===e},[LINE,emo],{timeout:300000});
  await voiced('neutral');
  const before=await page.evaluate(()=>({line:FrameForgeVoiceQA.status().lines[0],duration:FrameForgeQA.shots()[0].duration}));
  assert.equal(await page.inputValue('#speaker'),'dev');
  await page.selectOption('#emo-dev','sad');
  await voiced('sad');
  if(OUT){await page.evaluate(()=>FrameForgeQA.setOffline(false));await page.waitForTimeout(500);await page.screenshot({path:path.join(OUT,'studio-sad-line.png'),fullPage:true});await page.evaluate(()=>FrameForgeQA.setOffline(true));}
  const after=await page.evaluate(()=>({lines:FrameForgeVoiceQA.status().lines,shot:FrameForgeQA.shots()[0]}));
  assert.equal(after.shot.cast.dev.emotion,'sad','the face and the voice share the emotion');
  assert.equal(after.lines[0].cached,true,'the sad take of this line was voiced (and cached) in step 1');
  assert.ok(after.lines.slice(1).every(l=>l.cached),'the other lines are untouched');
  assert.ok(after.lines[0].seconds>before.line.seconds*1.05,'the sad line is longer ('+after.lines[0].seconds.toFixed(2)+' s vs '+before.line.seconds.toFixed(2)+' s)');
  assert.equal(after.shot.duration,Math.round((after.shot.timing.lead+after.lines[0].seconds+after.shot.timing.pauseAfter)*30)/30,'the shot is re-timed to the sad line');
  // A listener's emotion is only on their face.
  await page.selectOption('#emo-blue','angry');
  assert.equal(await page.evaluate(()=>FrameForgeVoiceQA.status().stale),false,'a listener\'s emotion does not re-voice');
  // Lip sync and the MP4 follow the new take.
  const sync=await page.evaluate(()=>{const l=FrameForgeVoiceQA.status().lines[0];return {speech:FrameForgeVoiceQA.rms(l.start+.06,l.start+l.seconds-.1)};});
  assert.ok(sync.speech>.02,'the sad line is on the voice track');
  const frames=Math.round(after.shot.duration*30);
  const mp4=await page.evaluate(async n=>{const r=await FrameForgeMP4Test({frameLimit:n,width:360,height:640,download:false});
   const bytes=new Uint8Array(await r.blob.arrayBuffer());let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));
   return {base64:btoa(s),frames:r.frames};},frames);
  assert.equal(mp4.frames,frames);
  const file=path.join(work,'sad-line.mp4');fs.writeFileSync(file,Buffer.from(mp4.base64,'base64'));
  const probe=spawnSync('ffprobe',['-v','error','-show_entries','stream=codec_type,codec_name:format=duration','-of','json',file],{encoding:'utf8'});
  const info=JSON.parse(probe.stdout);
  assert.ok(info.streams.some(s=>s.codec_type==='audio')&&info.streams.some(s=>s.codec_type==='video'),'the MP4 has picture and sound');
  // The MP4's sound is the sad take: its pitch matches the sad line, not the neutral one.
  const pcm=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-i',file,'-map','0:a','-ac','1','-ar','24000','-f','f32le','-'],{maxBuffer:1<<28});
  const audio=new Float32Array(pcm.stdout.buffer.slice(pcm.stdout.byteOffset,pcm.stdout.byteOffset+pcm.stdout.length));
  const mp4Hz=measure(audio,24000).hz;
  assert.ok(Math.abs(st(takes.sad.hz,mp4Hz))<Math.abs(st(n.hz,mp4Hz)),'the exported line is the sad take ('+mp4Hz.toFixed(1)+' Hz; sad '+takes.sad.hz.toFixed(1)+', neutral '+n.hz.toFixed(1)+')');
  console.log('mp4',JSON.stringify({streams:info.streams,duration:info.format.duration,hz:+mp4Hz.toFixed(1)}));
  assert.deepEqual(errors,[],'no page errors');

  // 3. The offline Python voices move the same way (optional: needs .venv with kokoro-onnx and the model).
  let offline=null;
  if(fs.existsSync(path.join(ROOT,'.venv/bin/python'))){
   const dir=path.join(work,'offline');offline={};
   for(const name of ['neutral','happy','sad','angry']){
    const r=spawnSync(path.join(ROOT,'.venv/bin/python'),['-I','tools/voice_lines.py','audition','dev','am_michael',LINE,'--out',path.join(dir,name),'--emotion',name],{cwd:ROOT,encoding:'utf8'});
    if(r.status!==0){console.log('offline voices unavailable:',r.stderr.trim().split('\n').pop());offline=null;break;}
    const f=path.join(dir,name,'dev-am_michael.wav'),raw=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-i',f,'-ac','1','-ar','24000','-f','f32le','-'],{maxBuffer:1<<28}).stdout;
    const x=new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.length));
    offline[name]={...measure(x,24000),lufs:lufs(f)};
    if(OUT)fs.copyFileSync(f,path.join(OUT,'dev-'+name+'-offline-python.wav'));
   }
   if(offline){
    const on=offline.neutral,orel=Object.fromEntries(Object.keys(offline).map(k=>[k,{pitch:+st(on.hz,offline[k].hz).toFixed(2),loud:+(offline[k].lufs-on.lufs).toFixed(1)}]));
    console.log('offline python vs neutral',JSON.stringify(orel));
    for(const k of ['happy','sad','angry']){
     assert.ok(Math.abs(orel[k].pitch-table[k].pitch)<1,k+': offline pitch '+orel[k].pitch+' vs browser '+table[k].pitch);
     assert.ok(Math.abs(orel[k].loud-table[k].loud)<1.5,k+': offline loudness '+orel[k].loud+' vs browser '+table[k].loud);
    }
    offline=orel;
   }
  }else console.log('offline voices not installed (.venv): Python path not compared');
  console.log('VOICE_EMOTION_BROWSER_PASS',JSON.stringify({takes:table,offline,shot:{before:before.duration,after:after.shot.duration}}));
 }finally{
  await context.close();server?.close();
  fs.rmSync(profile,{recursive:true,force:true});
  if(!OUT)fs.rmSync(work,{recursive:true,force:true});
 }
})().catch(e=>{console.error(e);process.exit(1)});
