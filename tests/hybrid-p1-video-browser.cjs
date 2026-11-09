// Hybrid P1 proof: use the real vendored Three.js WebGL renderer for procedural
// actor/world adapters, scrub deterministically, and encode a playable test MP4.
// This is synthetic geometry ONLY for adapter QA, not user-facing cinematic quality.
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
const OUT=path.resolve(process.env.FRAMEFORGE_HYBRID_P1_OUT||path.join(ROOT,'artifacts','p1-hybrid-proof'));
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.wasm':'application/wasm'};
function serve(){
 return new Promise(ok=>{
  const server=http.createServer((req,res)=>{
   const rel=decodeURIComponent(new URL(req.url,'http://x').pathname);
   const file=path.resolve(ROOT,rel.replace(/^\/+/,''));
   if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.writeHead(404);return res.end();
   }
   res.writeHead(200,{'content-type':TYPES[path.extname(file)]||'application/octet-stream'});
   fs.createReadStream(file).pipe(res);
  });
  server.listen(0,'127.0.0.1',()=>ok(server));
 });
}
const hash=img=>crypto.createHash('sha256').update(Buffer.from(img.split(',')[1],'base64')).digest('hex');
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const server=await serve();
 const browser=await chromium.launch({headless:true,args:['--no-sandbox',
  '--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
  '--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 try{
  const page=await browser.newPage({viewport:{width:380,height:700}});
  const errors=[];page.on('pageerror',e=>errors.push(e.stack||e.message));
  const r=await page.goto('http://127.0.0.1:'+server.address().port+'/tests/hybrid-p1-proof.html',
    {waitUntil:'domcontentloaded',timeout:60000});
  assert.equal(r.status(),200);
  await page.waitForFunction(()=>window.FrameForgeP1Proof?.ready,null,{timeout:90000});
  const summary=await page.evaluate(()=>FrameForgeP1Proof.summary());
  assert.deepEqual(summary,{schema:'frameforge.project/2',shots:14,actors:3,world:'procedural',time:0});
  const a=await page.evaluate(()=>FrameForgeP1Proof.frameAt(.5));
  await page.evaluate(()=>FrameForgeP1Proof.frameAt(4.2));
  const b=await page.evaluate(()=>FrameForgeP1Proof.frameAt(.5));
  assert.equal(hash(a.png),hash(b.png),'seeking back returns identical WebGL pixels');
  const c=await page.evaluate(()=>FrameForgeP1Proof.frameAt(1.5));
  assert.notEqual(hash(a.png),hash(c.png),'actor movement reaches rendered video frames');
  assert.equal(a.sample.camera.kind,'actor');
  assert.equal(a.sample.speaker,'dev');
  assert.deepEqual(errors,[],'no page errors while creating hybrid film');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'frameforge-hybrid-p1-'));
  try{
   const FRAMES=24,FPS=12;
   for(let i=0;i<FRAMES;i++){
    const img=await page.evaluate(t=>FrameForgeP1Proof.frameAt(t).png,i/FPS);
    fs.writeFileSync(path.join(dir,'frame-'+String(i).padStart(3,'0')+'.png'),
      Buffer.from(img.split(',')[1],'base64'));
   }
   const mp4=path.join(OUT,'hybrid-p1-test-only.mp4');
   cp.execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate',String(FPS),
    '-i',path.join(dir,'frame-%03d.png'),'-f','lavfi','-i','anullsrc=channel_layout=stereo:sample_rate=48000',
    '-t',String(FRAMES/FPS),'-c:v','libx264','-pix_fmt','yuv420p',
    '-c:a','aac','-shortest','-movflags','+faststart',mp4],
    {stdio:['ignore','pipe','pipe'],timeout:180000});
   const probe=JSON.parse(cp.execFileSync('ffprobe',['-v','error','-count_frames',
    '-show_entries','stream=codec_name,codec_type,width,height,nb_read_frames:format=duration',
    '-of','json',mp4],{encoding:'utf8',timeout:60000}));
   const video=probe.streams.find(s=>s.codec_type==='video'),audio=probe.streams.find(s=>s.codec_type==='audio');
   assert.equal(video.codec_name,'h264');assert.equal(video.width,360);assert.equal(video.height,640);
   assert.equal(Number(video.nb_read_frames),FRAMES);
   assert.equal(audio.codec_name,'aac');
   cp.execFileSync('ffmpeg',['-v','error','-xerror','-i',mp4,'-f','null','-'],
     {stdio:['ignore','pipe','pipe'],timeout:120000});
   fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify({
    label:'Adapter-only WebGL render with test-only silent audio; NOT a product cinematic quality demonstration',
    schema:summary.schema,frames:FRAMES,fps:FPS,width:360,height:640,
    actors:summary.actors,world:summary.world,videoCodec:video.codec_name,audioCodec:audio.codec_name,
    seekHash:hash(a.png),differentTimeHash:hash(c.png),completeDecode:true
   },null,2));
   console.log('HYBRID_P1_WEBGL_VIDEO_PASS: 24 WebGL frames, deterministic rewind, H264/AAC MP4 full decode');
  }finally{fs.rmSync(dir,{recursive:true,force:true})}
  await page.evaluate(()=>FrameForgeP1Proof.dispose());
 }finally{await browser.close();await new Promise(ok=>server.close(ok))}
})().catch(e=>{console.error('HYBRID_P1_WEBGL_VIDEO_FAILURE '+e.stack);process.exitCode=1});
