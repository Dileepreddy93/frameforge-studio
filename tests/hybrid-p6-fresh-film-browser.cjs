// P6 authentic new V2 dialogue: browser Kokoro waveform from the existing
// first-party worker -> a separate hybrid original Ember film -> decoded MP4.
// Executed after voice-model-browser.cjs has generated fresh-v2-kokoro files.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const cp=require('node:child_process'),crypto=require('node:crypto'),os=require('node:os');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const BASE=process.env.FRAMEFORGE_URL||'http://127.0.0.1:8959/';
const OUT=path.resolve(process.env.FRAMEFORGE_SAMPLES_OUT||'artifacts/voice-model-samples');
const prefix=path.join(OUT,'fresh-v2-kokoro');
const hash=image=>crypto.createHash('sha256').update(Buffer.from(image.split(',')[1],'base64')).digest('hex');
(async()=>{
 for(const file of [prefix+'.json',prefix+'-master.wav',prefix+'-voice.wav'])
   assert.ok(fs.statSync(file).size>300,'fresh original Kokoro proof missing '+file);
 const evidence=JSON.parse(fs.readFileSync(prefix+'.json','utf8'));
 assert.equal(evidence.report.rawModelInference,true);
 assert.deepEqual(evidence.report.speakerIds,['luna','atlas']);
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl',
   '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:700}});
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  const res=await page.goto(BASE+'tests/hybrid-p56-proof.html',
    {waitUntil:'domcontentloaded',timeout:120000});
  assert.equal(res.status(),200);
  await page.waitForFunction(()=>window.HybridP56Ready===true||window.HybridP56Error,
    null,{timeout:120000});
  const startup=await page.evaluate(()=>window.HybridP56Error||null);
  assert.equal(startup,null,'Hybrid director page initialization failed');
  const info=await page.evaluate(()=>HybridP56QA.loadFresh());
  assert.equal(info.projectSchema,'frameforge.project/2');
  assert.equal(info.newText.length,2);
  assert.equal(info.markers.length,2);
  assert.ok(info.duration>2&&info.duration<20);
  const start=await page.evaluate(()=>HybridP56QA.frameAt(0));
  assert.equal(start.mouthOpen,0);
  const first=await page.evaluate(t=>HybridP56QA.frameAt(t),.65);
  const middle=await page.evaluate(t=>HybridP56QA.frameAt(t),t,
     Math.min(info.duration-0.2,info.markers[1].start+.5));
  const rewind=await page.evaluate(t=>HybridP56QA.frameAt(t),.65);
  assert.equal(hash(first.image),hash(rewind.image),
    'Freshly synthesized voice and original actor direction must be deterministic');
  const firstImage=Buffer.from(first.image.split(',')[1],'base64');
  fs.writeFileSync(path.join(OUT,'fresh-v2-actor.png'),firstImage);
  const secondTime=Math.min(info.duration-0.2,info.markers[1].start+.45);
  const second=await page.evaluate(t=>HybridP56QA.frameAt(t),secondTime);
  fs.writeFileSync(path.join(OUT,'fresh-v2-monitor.png'),
    Buffer.from(second.image.split(',')[1],'base64'));
  assert.notEqual(hash(first.image),hash(second.image));
  assert.equal(second.screen,true,'New dialogue film retains authored terminal screen');
  let maxMouth=0;
  for(const marker of info.markers){
   for(let t=marker.start+.08;t<marker.end-.06;t+=.15){
    const f=await page.evaluate(t=>HybridP56QA.frameAt(t),t);
    maxMouth=Math.max(maxMouth,f.mouthOpen);
   }
  }
  assert.ok(maxMouth>.08,'Actual fresh Kokoro voices must drive mouth animation');
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'frameforge-kokoro-fresh-film-'));
  try{
   const FPS=8,N=Math.floor(info.duration*FPS);
   assert.ok(N>=16&&N<=160);
   for(let i=0;i<N;i++){
    const frame=await page.evaluate(t=>HybridP56QA.frameAt(t).image,i/FPS);
    fs.writeFileSync(path.join(tmp,'frame-'+String(i).padStart(3,'0')+'.png'),
      Buffer.from(frame.split(',')[1],'base64'));
   }
   const output=path.join(OUT,'fresh-v2-kokoro-film.mp4');
   cp.execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',
     '-framerate',String(FPS),'-i',path.join(tmp,'frame-%03d.png'),
     '-i',prefix+'-master.wav','-c:v','libx264','-pix_fmt','yuv420p',
     '-c:a','aac','-movflags','+faststart','-shortest',output],
     {stdio:['ignore','pipe','pipe'],timeout:240000});
   const probe=JSON.parse(cp.execFileSync('ffprobe',['-v','error','-count_frames',
     '-show_entries','stream=codec_name,codec_type,width,height,nb_read_frames:format=duration',
     '-of','json',output],{encoding:'utf8',timeout:60000}));
   const video=probe.streams.find(x=>x.codec_type==='video');
   const audio=probe.streams.find(x=>x.codec_type==='audio');
   assert.equal(video.codec_name,'h264');assert.equal(audio.codec_name,'aac');
   assert.equal(video.width,360);assert.equal(video.height,640);
   assert.equal(Number(video.nb_read_frames),N);
   cp.execFileSync('ffmpeg',['-v','error','-xerror','-i',output,'-f','null','-'],
    {stdio:['ignore','pipe','pipe'],timeout:120000});
   const summary={status:'HYBRID_P6_FRESH_FILM_PASS',originalEnglishLines:info.newText,
     actors:info.markers.map(m=>m.speaker),duration:info.duration,
     verifiedFrameCount:N,framesPerSecond:FPS,width:360,height:640,
     h264:true,aac:true,fullDecode:true,peakMouth:maxMouth,
     provenance:'Existing first-party Kokoro-82M worker generated original text in browser',
     newSynthesis:true,phonemeForcedAlignment:false,
     notYetProduction:true,unsupportedLanguages:['te','hi']};
   fs.writeFileSync(path.join(OUT,'fresh-v2-film-report.json'),JSON.stringify(summary,null,2));
   console.log('HYBRID_P6_FRESH_FILM_PASS '+JSON.stringify(summary));
  }finally{fs.rmSync(tmp,{recursive:true,force:true})}
  assert.deepEqual(errors,[]);
  await page.evaluate(()=>HybridP56QA.dispose());
 }finally{await browser.close()}
})().catch(e=>{console.error('HYBRID_P6_FRESH_FILM_FAILURE '+e.stack);process.exitCode=1});
