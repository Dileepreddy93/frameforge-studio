// P2 real Ember cast regression: builds six character templates through the hybrid
// actor provider, checks all eight emotions, four views, look customization,
// deterministic rewind and a playable MP4 with the shipped V6 voice/audio track.
// The existing V6 production renderer remains untouched.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const cp=require('node:child_process');
const crypto=require('node:crypto');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const OUT=path.resolve(process.env.FRAMEFORGE_P2_OUT||path.join(ROOT,'artifacts/p2-ember-cast'));
const hash=data=>crypto.createHash('sha256').update(Buffer.from(data.split(',')[1],'base64')).digest('hex');
const save=(name,data)=>fs.writeFileSync(path.join(OUT,name),Buffer.from(data.split(',')[1],'base64'));
const TEMPLATES=['creator','human','robot','creature','bot','mascot'];
const EMOTIONS=['neutral','happy','sad','angry','surprised','worried','curious','idea'];
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const server=cp.spawn(process.execPath,['tests/static-server.cjs','8993'],{cwd:ROOT,stdio:'pipe'});
 let browser=null;
 try{
  await new Promise((ok,fail)=>{
   server.once('error',fail);
   const t=setTimeout(()=>fail(Error('test static server timeout')),15000);
   server.stdout.on('data',d=>{if(String(d).includes('static server on')){clearTimeout(t);ok()}});
  });
  browser=await chromium.launch({headless:true,args:['--no-sandbox',
    '--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
    '--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:390,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(e.stack||e.message));
  const resp=await page.goto('http://127.0.0.1:8993/tests/hybrid-p2-character-proof.html',
    {waitUntil:'domcontentloaded',timeout:90000});
  assert.equal(resp.status(),200);
  await page.waitForFunction(()=>window.HybridP2Ready&&window.HybridP2QA,null,{timeout:120000});
  const s=await page.evaluate(()=>HybridP2QA.summary());
  assert.deepEqual(s.templates,TEMPLATES);assert.deepEqual(s.emotions,EMOTIONS);
  assert.deepEqual(await page.evaluate(()=>HybridP2QA.renderSize()),[360,640]);
  const proof=[];
  for(const template of TEMPLATES){
   const config=await page.evaluate(template=>HybridP2QA.create({template}),template);
   assert.equal(config.template,template);
   assert.equal(config.project.schema,'frameforge.project/2');
   assert.equal(config.project.hybrid.cast.hero.template,template);
   const views=[];
   for(let v=0;v<4;v++){
    const image=await page.evaluate(view=>HybridP2QA.frame({time:.6,view}),v);
    save(template+'-view-'+v+'.png',image.image);
    views.push(hash(image.image));
    assert.equal(image.pose.time,.6);
    assert.ok(image.head.every(Number.isFinite));
   }
   assert.ok(new Set(views).size>=3,template+' exposes distinct 3D camera views');
   const feelings=[];
   for(let emotionIndex=0;emotionIndex<8;emotionIndex++){
    const image=await page.evaluate(i=>HybridP2QA.frame({emotionIndex:i,view:0}),emotionIndex);
    assert.equal(image.emotion,EMOTIONS[emotionIndex]);
    assert.equal(image.pose.emotion,EMOTIONS[emotionIndex]);
    save(template+'-'+EMOTIONS[emotionIndex]+'.png',image.image);
    feelings.push(hash(image.image));
   }
   assert.ok(new Set(feelings).size>=4,template+' expression/acting actually changes rendered pixels');
   const rewind=await page.evaluate(()=>{const a=HybridP2QA.frame({time:2.3,view:0}).image;
     HybridP2QA.frame({time:10.5,view:2});
     return{a,b:HybridP2QA.frame({time:2.3,view:0}).image}});
   assert.equal(hash(rewind.a),hash(rewind.b),template+' must be deterministic on rewind');
   proof.push({template,views:new Set(views).size,emotions:new Set(feelings).size,rewind:true});
  }
  const custom=await page.evaluate(()=>HybridP2QA.create({template:'human',style:'lowpoly',
    look:{height:1.18,head:1.16,build:1.2,glasses:'round',topStyle:'hoodie',
          prop:'book',hat:'beanie',skin:'#ddaa88',top:'#334f78'}}));
  assert.equal(custom.look.height,1.18);assert.equal(custom.look.top,'#334f78');
  const changed=await page.evaluate(()=>HybridP2QA.frame({time:1,view:0}));
  save('customized-human.png',changed.image);
  assert.equal(changed.config.look.prop,'book');assert.equal(changed.config.style,'lowpoly');
  // Bad appearance should be rejected by the adapter, not forwarded to WebGL.
  const bad=await page.evaluate(()=>{
    const errors=[];
    for(const look of [{height:99},{top:'javascript:'},{species:'fake'},{alien:true}]){
      try{HybridP2QA.normalizeLook(look)}catch(e){errors.push(e.message)}
    }
    return errors;
  });
  assert.equal(bad.length,4);
  await page.evaluate(()=>HybridP2QA.create({template:'creator'}));
  // Use original FrameForge mastered audio as evidence of media compatibility;
  // P2 performance is NOT claimed to have word-level lip synchronization.
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'frameforge-p2-'));
  try{
   const FRAMES=30,FPS=15;
   for(let i=0;i<FRAMES;i++){
    const data=await page.evaluate(t=>HybridP2QA.frame({time:t,view:0}).image,i/FPS+.2);
    fs.writeFileSync(path.join(tmp,'frame-'+String(i).padStart(3,'0')+'.png'),
      Buffer.from(data.split(',')[1],'base64'));
   }
   const mp4=path.join(OUT,'ember-p2-creator-2s.mp4');
   cp.execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',
     '-framerate',String(FPS),'-i',path.join(tmp,'frame-%03d.png'),
     '-i',path.join(ROOT,'audio/zero-latency/mix.mp3'),
     '-t',String(FRAMES/FPS),'-c:v','libx264','-pix_fmt','yuv420p',
     '-c:a','aac','-ar','48000','-ac','2','-movflags','+faststart',mp4],
     {stdio:['ignore','pipe','pipe'],timeout:180000});
   const probe=JSON.parse(cp.execFileSync('ffprobe',['-v','error','-count_frames',
     '-show_entries','stream=codec_name,codec_type,width,height,nb_read_frames:format=duration',
     '-of','json',mp4],{encoding:'utf8',timeout:60000}));
   const v=probe.streams.find(x=>x.codec_type==='video'),a=probe.streams.find(x=>x.codec_type==='audio');
   assert.equal(v.codec_name,'h264');assert.equal(v.width,360);assert.equal(v.height,640);
   assert.equal(Number(v.nb_read_frames),FRAMES);assert.equal(a.codec_name,'aac');
   cp.execFileSync('ffmpeg',['-v','error','-xerror','-i',mp4,'-f','null','-'],
     {stdio:['ignore','pipe','pipe'],timeout:120000});
  }finally{fs.rmSync(tmp,{recursive:true,force:true})}
  assert.deepEqual(errors,[],'no JavaScript exceptions in character renderer');
  const report={result:'P2_RENDER_PROOF_PASS',timestamp:new Date().toISOString(),
    evidence:'Real Ember procedural rigs loaded through FrameForge hybrid provider; legacy V6 untouched',
    limits:'2-second preview uses V6 pre-existing mastered audio; speech/visemes unaligned until P6',
    templates:proof,emotions:EMOTIONS,views:4,lookCustomization:true,
    fullDecode:true,video:'ember-p2-creator-2s.mp4'};
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
  console.log('HYBRID_P2_CAST_PASS '+JSON.stringify(proof));
  console.log('HYBRID_P2_VIDEO_PASS 2 seconds H264/AAC verified full decode');
  await page.evaluate(()=>HybridP2QA.dispose());
 }finally{
  if(browser)await browser.close();
  server.kill();
 }
})().catch(e=>{console.error('HYBRID_P2_FAILURE '+e.stack);process.exitCode=1});
