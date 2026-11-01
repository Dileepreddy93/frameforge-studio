// P5/P6 integration: two edited FrameForge v2 films, real Ember actors/worlds,
// actual Ember screen drawing, moving camera and imported consented local Kokoro
// speech segments, with acoustic-viseme driven faces and independent MP4 decode.
// NOT a new-language TTS claim nor a consumer 1080p export.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),
 path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const OUT=path.resolve(process.env.FRAMEFORGE_P56_OUT||path.join(ROOT,'artifacts/p56-director-voice'));
const digest=x=>crypto.createHash('sha256').update(Buffer.from(x.split(',')[1],'base64')).digest('hex');
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const server=cp.spawn(process.execPath,['tests/static-server.cjs','8997'],{cwd:ROOT,stdio:'pipe'});
 let browser;
 try{
  await new Promise((ok,fail)=>{
   let started=false;
   server.once('error',fail);
   const timer=setTimeout(()=>fail(Error('Test server start timed out')),15000);
   server.stdout.on('data',d=>{if(!started&&String(d).includes('static server on')){started=true;clearTimeout(timer);ok()}});
  });
  browser=await chromium.launch({headless:true,args:['--no-sandbox',
   '--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
   '--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:390,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(e.stack||e.message));
  const r=await page.goto('http://127.0.0.1:8997/tests/hybrid-p56-proof.html',
   {waitUntil:'domcontentloaded',timeout:80000});
  assert.equal(r.status(),200);
  try{
   await page.waitForFunction(()=>window.HybridP56Ready||window.HybridP56Error,
     null,{timeout:90000});
   const error=await page.evaluate(()=>window.HybridP56Error);
   if(error)throw Error('P56 page boot: '+error);
  }catch(e){throw Error(e.message+'; page exceptions: '+errors.join(' | '))}
  const evidence=[];
  for(const variant of [1,2]){
   const report=await page.evaluate(v=>HybridP56QA.create(v),variant);
   assert.equal(report.variant,variant);
   assert.equal(report.shots.length,2);
   assert.equal(report.voices.length,2);
   assert.ok(report.voices.every(x=>x.start<x.end));
   assert.ok(Number.isFinite(report.lufs)&&Number.isFinite(report.peakDb));
   assert.ok(report.peakDb<0);
   assert.match(report.authoredScript,/@shot/);
   assert.match(report.authoredScript,/@screen/);
   const before=await page.evaluate(()=>HybridP56QA.frameAt(0));
   assert.equal(before.mouthOpen,0,'speaker is silent before the spoken lead');
   const firstT=.7,nextT=report.shots[0].duration+.65;
   const first=await page.evaluate(t=>HybridP56QA.frameAt(t),firstT);
   const second=await page.evaluate(t=>HybridP56QA.frameAt(t),nextT);
   const rewind=await page.evaluate(t=>HybridP56QA.frameAt(t),firstT);
   assert.equal(digest(first.image),digest(rewind.image),'replaying absolute-time hybrid film must match pixel-for-pixel');
   assert.notEqual(digest(first.image),digest(second.image),'camera and new actor performances must differ');
   assert.equal(second.screen,true,'authored Ember interactive screen visible');
   assert.deepEqual(second.reactions,['luna'],'other character performs authored reaction beat');
   if(variant===2)assert.equal(second.camera.transition,'blend','one-take maintains cross-shot camera continuity');
   assert.ok(first.camera.position.every(Number.isFinite));
   assert.ok(first.camera.captionBounds);
   assert.ok(second.camera.screenBounds.y+second.camera.screenBounds.height <
     second.camera.captionBounds.y,'caption never covers on-set screen');
   const mouth=[];
   for(let t=.2;t<report.shots[0].duration-.3;t+=.12){
    const c=await page.evaluate(t=>HybridP56QA.frameAt(t),t);mouth.push(c.mouthOpen);
   }
   assert.ok(Math.max(...mouth)>.08,'actual audio should drive visible mouth opening');
   const saveFrame=(name,item)=>fs.writeFileSync(path.join(OUT,name),
     Buffer.from(item.image.split(',')[1],'base64'));
   saveFrame('film-'+variant+'-actor.png',first);
   saveFrame('film-'+variant+'-screen.png',second);
   const wav=Buffer.from(await page.evaluate(()=>HybridP56QA.masterWav()),'base64');
   assert.equal(wav.subarray(0,4).toString(),'RIFF');
   assert.ok(wav.length>100000,'mastered voice/music/sfx is not empty');
   const track=path.join(OUT,'film-'+variant+'-master.wav');fs.writeFileSync(track,wav);
   const temp=fs.mkdtempSync(path.join(os.tmpdir(),'hybrid-p56-'));
   const FPS=8,N=Math.floor(report.audioSeconds*FPS);
   try{
    for(let i=0;i<N;i++){
     const png=await page.evaluate(t=>HybridP56QA.frameAt(t).image,i/FPS);
     fs.writeFileSync(path.join(temp,'frame-'+String(i).padStart(3,'0')+'.png'),
       Buffer.from(png.split(',')[1],'base64'));
    }
    const mp4=path.join(OUT,'film-'+variant+'-directed-with-voice.mp4');
    cp.execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',
      '-framerate',String(FPS),'-i',path.join(temp,'frame-%03d.png'),
      '-i',track,'-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac',
      '-movflags','+faststart','-shortest',mp4],{stdio:['ignore','pipe','pipe'],timeout:240000});
    const probe=JSON.parse(cp.execFileSync('ffprobe',['-v','error','-count_frames',
      '-show_entries','stream=codec_name,codec_type,width,height,nb_read_frames:format=duration',
      '-of','json',mp4],{encoding:'utf8',timeout:60000}));
    const v=probe.streams.find(x=>x.codec_type==='video'),a=probe.streams.find(x=>x.codec_type==='audio');
    assert.equal(v.codec_name,'h264');assert.equal(a.codec_name,'aac');
    assert.equal(v.width,360);assert.equal(v.height,640);
    assert.equal(Number(v.nb_read_frames),N);
    cp.execFileSync('ffmpeg',['-v','error','-xerror','-i',mp4,'-f','null','-'],
      {stdio:['ignore','pipe','pipe'],timeout:180000});
    evidence.push({film:variant,frames:N,seconds:report.audioSeconds,
      audioPeakDb:report.peakDb,audioLufs:report.lufs,screen:true,
      actionPixelRewind:true,voiceDrivenMouth:true,source:'existing Kokoro V6 speech re-used, NOT novel TTS'});
   }finally{fs.rmSync(temp,{recursive:true,force:true})}
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify({
   kind:'FrameForge P5/P6 engineering QA',
   v6ProductionUnchanged:true,timing:'frameforge.project/2 only',
   voiceSource:'preexisting V6 Kokoro-generated track; no fresh model call',
   multilingualStatus:'English supported by existing worker; Hindi/Telugu not yet verified',
   copyright:'Re-use of existing first-party episode soundtrack for internal proof',
   films:evidence,releaseReady:false
  },null,2));
  console.log('HYBRID_P5_DIRECTOR_VIDEO_PASS '+JSON.stringify({films:evidence.map(e=>e.film),screenAndCamera:true,rewind:true}));
  console.log('HYBRID_P6_AUDIO_VIDEO_PASS '+JSON.stringify(evidence));
  await page.evaluate(()=>HybridP56QA.dispose());
 }finally{if(browser)await browser.close();server.kill()}
})().catch(e=>{console.error('HYBRID_P56_FAILURE '+e.stack);process.exitCode=1});
