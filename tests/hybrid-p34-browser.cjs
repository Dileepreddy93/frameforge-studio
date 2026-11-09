// P3/P4 integration certification — actual skinned CesiumMan, actual Ember nature
// and desk builders, imported scene, deterministic scene seek and decoded MP4.
// Source and asset provenance in docs/HYBRID_P34_IMPORT_WORLDS.md.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),
 cp=require('node:child_process'),os=require('node:os'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const OUT=path.resolve(process.env.FRAMEFORGE_P34_OUT||path.join(ROOT,'artifacts/p34-hybrid'));
const sha=d=>crypto.createHash('sha256').update(Buffer.from(d.split(',')[1],'base64')).digest('hex');
const save=(file,d)=>fs.writeFileSync(path.join(OUT,file),Buffer.from(d.split(',')[1],'base64'));
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const server=cp.spawn(process.execPath,['tests/static-server.cjs','8994'],{cwd:ROOT,stdio:'pipe'});
 let browser;
 try{
  await new Promise((resolve,reject)=>{
   let done=false;
   server.once('error',reject);
   const timer=setTimeout(()=>reject(Error('Static server failed to start')),15000);
   server.stdout.on('data',d=>{if(!done&&String(d).includes('static server on')){done=true;clearTimeout(timer);resolve()}});
  });
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl',
   '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:390,height:620}});
  const errors=[];page.on('pageerror',e=>errors.push(e.stack||e.message));
  const resp=await page.goto('http://127.0.0.1:8994/tests/hybrid-p34-proof.html',
    {waitUntil:'domcontentloaded',timeout:120000});
  assert.equal(resp.status(),200);
  try{
   await page.waitForFunction(()=>window.HybridP34Ready===true || Boolean(window.HybridP34Error),
     null,{timeout:30000});
   const reason=await page.evaluate(()=>window.HybridP34Error||null);
   if(reason)throw Error('P34 browser setup failed: '+reason);
  }catch(err){
   throw Error(err.message+'; page errors: '+errors.join(' | '));
  }
  const info=await page.evaluate(()=>HybridP34QA.summary());
  assert.ok(info.rigged,'preloaded GLB must have a real mapped skin');
  assert.ok(info.bytes>100000);
  assert.ok(info.triangles>300);
  const checks=[];
  const worlds=[['forest','morning'],['meadow','golden'],['snow','night'],['desk','golden']];
  for(const [preset,time] of worlds){
   await page.evaluate(async([w,t])=>HybridP34QA.make(w,t),[preset,time]);
   const images=[];
   for(const t of [0.6,3.5,0.6]){
    const frame=await page.evaluate(t=>HybridP34QA.image(t),t);
    assert.equal(frame.frame.world.template,preset,'v2 world descriptor must preserve the selected Ember template');
    assert.ok(frame.actor.geometry.skinnedMeshes>0);
    assert.ok(frame.frame.anchors.hero.head.every(Number.isFinite));
    assert.ok(frame.meshes>0);
    images.push(sha(frame.image));
   }
   assert.equal(images[0],images[2],preset+' ambient particles and bone poses must rewind deterministically');
   assert.notEqual(images[0],images[1],preset+' actually animates over time');
   const front=await page.evaluate(()=>HybridP34QA.image(.6,0));
   const side=await page.evaluate(()=>HybridP34QA.image(.6,1));
   assert.notEqual(sha(front.image),sha(side.image),preset+' 3D actor view must differ');
   save(preset+'-'+time+'-front.png',front.image);
   save(preset+'-'+time+'-side.png',side.image);
   checks.push({preset,time,head:front.frame.anchors.hero.head,rewind:true});
  }
  // Imported GLB world (existing Khronos CesiumMan as audited geometry proxy):
  // proof of loading/animation/disposal, NOT an artistic world evaluation.
  const imp=await page.evaluate(async()=>HybridP34QA.make('forest','golden',true));
  assert.equal(imp.world.provider,'imported');
  const image=await page.evaluate(()=>HybridP34QA.image(.6));
  assert.ok(image.meshes>0);save('imported-glb-world-proxy.png',image.image);
  // Verify imported rig morph/gesture poses across eight authored emotions.
  await page.evaluate(async()=>HybridP34QA.make('forest','golden'));
  const emotions=[];
  for(let i=0;i<8;i++){
   const f=await page.evaluate(t=>HybridP34QA.image(t),i*2.2+.5);
   const expected=['neutral','happy','sad','angry','surprised','worried','curious','idea'][i];
   assert.equal(f.frame.shot.cast.hero.emotion,expected);
   emotions.push(sha(f.image));
   save('imported-actor-'+expected+'.png',f.image);
  }
  assert.ok(new Set(emotions).size>=4,'real imported skeleton/face must animate');
  // Render a short film using the SAME asset/session evaluated above.
  await page.evaluate(async()=>HybridP34QA.make('forest','golden'));
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'hybrid-p34-'));
  try{
   const N=24,FPS=12;
   for(let i=0;i<N;i++){
    const d=await page.evaluate(t=>HybridP34QA.image(t).image,.5+i/FPS);
    fs.writeFileSync(path.join(tmp,'frame-'+String(i).padStart(3,'0')+'.png'),Buffer.from(d.split(',')[1],'base64'));
   }
   const file=path.join(OUT,'hybrid-p34-rigged-forest-2s.mp4');
   cp.execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',
    '-framerate',String(FPS),'-i',path.join(tmp,'frame-%03d.png'),
    '-i',path.join(ROOT,'audio/zero-latency/mix.mp3'),'-t',String(N/FPS),
    '-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','-movflags','+faststart',file],
    {stdio:['ignore','pipe','pipe'],timeout:180000});
   const probe=JSON.parse(cp.execFileSync('ffprobe',['-v','error','-count_frames',
    '-show_entries','stream=codec_name,codec_type,width,height,nb_read_frames:format=duration',
    '-of','json',file],{encoding:'utf8',timeout:60000}));
   const video=probe.streams.find(s=>s.codec_type==='video'),audio=probe.streams.find(s=>s.codec_type==='audio');
   assert.equal(video.codec_name,'h264');assert.equal(audio.codec_name,'aac');
   assert.equal(video.width,300);assert.equal(video.height,500);
   assert.equal(Number(video.nb_read_frames),N);
   cp.execFileSync('ffmpeg',['-v','error','-xerror','-i',file,'-f','null','-'],
     {stdio:['ignore','pipe','pipe'],timeout:120000});
  }finally{fs.rmSync(tmp,{recursive:true,force:true})}
  assert.deepEqual(errors,[]);
  const report={result:'HYBRID_P34_PASS',model:'Ara Athletic Man (internal-only technical rig; CMU clips not used)',
   sourceGitBlob:'1747281c0e7e10c4fe364d99a43c18bcb140bdb1',
   p3:{realSkinned:info.rigged,bytes:info.bytes,triangles:info.triangles,expressions:8,source:'Ara GLB technical QA only'},
   p4:{worlds:checks,importedWorld:'Khronos geometry used as import-path proxy only'},
   video:{seconds:2,width:300,height:500,fps:12,videoCodec:'H264',audioCodec:'AAC',
    originalV6Audio:true,fullDecode:true},
   limitations:['VRM geometry accepted when humanoid; VRM spring-bone and MToon not implemented',
    'Not a final user film, not complete speech lip synchronization, not a 1080p production export']};
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
  console.log('HYBRID_P3_IMPORT_PASS '+JSON.stringify(report.p3));
  console.log('HYBRID_P4_WORLDS_PASS '+JSON.stringify(report.p4));
  console.log('HYBRID_P34_VIDEO_PASS: 24 frames H264/AAC full ffmpeg decode');
  await page.evaluate(()=>HybridP34QA.dispose());
 }finally{if(browser)await browser.close();server.kill()}
})().catch(e=>{console.error('HYBRID_P34_FAILURE '+e.stack);process.exitCode=1});
