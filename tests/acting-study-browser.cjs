/**
 * Truly render exactly 150 time-indexed browser 3D frames, encode 5.0s H264,
 * inspect stream and complete decode. No fake cards / frame interpolation.
 * It is a SILENT proof: the emotive performance must be judged without audio.
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const {execFileSync}=require('node:child_process');
const output=process.env.FRAMEFORGE_ACTING_OUT||'artifacts/p2-acting-study';
(async()=>{
 const folder=path.join(output,'frames'),chosen=new Set([0,12,25,36,46,55,62,71,85,96,111,124,137,149]);
 fs.mkdirSync(folder,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 try{
  const page=await browser.newPage({viewport:{width:1050,height:820}});page.setDefaultTimeout(110000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto((process.env.FRAMEFORGE_URL||'http://127.0.0.1:8959/')+'asset-lab.html',{waitUntil:'domcontentloaded',timeout:35000});
  assert.equal(response.status(),200);
  await page.waitForFunction(()=>Boolean(window.FrameForgeRigLabQA),null,{timeout:70000});
  await page.locator('#human').click();
  await page.waitForFunction(()=>window.FrameForgeRigLabQA.getStatus().startsWith('READY'),null,{timeout:110000});
  const status=await page.evaluate(()=>window.FrameForgeRigLabQA.getSummary());
  assert.equal(status.scene.bones,69);assert.ok(status.header.morphNames.length>=20);
  assert.equal(await page.locator('#studyStart').isDisabled(),false);
  const captureAt=async t=>{
   const data=await page.evaluate(time=>{
     window.FrameForgeRigLabQA.setStudyTime(time);
     return {uri:window.FrameForgeRigLabQA.capture(),state:window.FrameForgeRigLabQA.getStudyState()};
   },t);
   assert.ok(data.state.active);assert.ok(data.state.bones.includes('Head'));
   assert.ok(data.uri.startsWith('data:image/png;base64,'));
   const b=Buffer.from(data.uri.split(',')[1],'base64');
   assert.ok(b.length>20000,'WebGL returned blank/invalid PNG');
   assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
   return {bytes:b,hash:crypto.createHash('sha256').update(b).digest('hex'),phase:data.state.phase};
  };
  const a=await captureAt(1.54);const b=await captureAt(4.15);const a2=await captureAt(1.54);
  assert.equal(a.hash,a2.hash,'Random seek must produce byte-stable same-frame render');
  assert.notEqual(a.hash,b.hash,'Surprise and relief frames must differ in pixels');
  const evidence=[],allHashes=[];
  for(let frame=0;frame<150;frame++){
   const sample=await captureAt(frame/30);
   const filename='frame-'+String(frame).padStart(3,'0')+'.png';
   fs.writeFileSync(path.join(folder,filename),sample.bytes);
   allHashes.push(sample.hash);
   if(chosen.has(frame)){
    const file='acting-'+String(frame).padStart(3,'0')+'.png';
    fs.copyFileSync(path.join(folder,filename),path.join(output,file));
    evidence.push({frame,time:frame/30,phase:sample.phase,file,sha256:sample.hash,bytes:sample.bytes.length});
   }
  }
  assert.ok(new Set(allHashes).size>100,'Natural facial/head performance must evolve through scene');
  const film=path.join(output,'p2-original-muted-five-sec-30fps.mp4');
  const run=(cmd,args)=>execFileSync(cmd,args,{encoding:'utf8',timeout:200000,maxBuffer:3e6});
  run('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','30','-i',path.join(folder,'frame-%03d.png'),
    '-an','-vf','crop=trunc(ih*9/16/2)*2:trunc(ih/2)*2:(iw-ow)/2:(ih-oh)/2','-c:v','libx264','-pix_fmt','yuv420p','-preset','veryfast','-crf','20','-movflags','+faststart',film]);
  const probe=JSON.parse(run('ffprobe',['-v','error','-count_frames','-show_entries',
    'format=duration:stream=codec_name,codec_type,width,height,r_frame_rate,nb_read_frames','-of','json',film]));
  const v=probe.streams.find(s=>s.codec_type==='video');
  assert.equal(v.codec_name,'h264');assert.equal(v.nb_read_frames,'150');assert.equal(v.r_frame_rate,'30/1');
  assert.ok(v.width%2===0&&v.height%2===0,'YUV420 encoder needs even dimensions');
  assert.ok(v.width>300&&v.height>500,'No microscopic video export');
  assert.ok(Math.abs(v.width/v.height-9/16)<.008,'Actual output must be vertical 9:16');
  assert.ok(Math.abs(+probe.format.duration-5)<.02);
  assert.equal(probe.streams.some(s=>s.codec_type==='audio'),false,'Short acting study MUST be muted');
  run('ffmpeg',['-v','error','-xerror','-i',film,'-f','null','-']);
  const stats=fs.statSync(film);
  assert.ok(stats.size>100000,'MP4 missing or too small');
  const manifest={
   schema:'frameforge.muted-acting-five-second/1',targetModelSHA256:'3faf7629bd6f62f70e916d665b4051de35b0b27832e8da3b19b8a4dd93c4be22',
   nativeSourceFrames:150,codec:'h264',fps:30,duration:5,muted:true,modelBones:69,morphTypes:20,
   video:{file:path.basename(film),bytes:stats.size,sha256:crypto.createHash('sha256').update(fs.readFileSync(film)).digest('hex')},
   poses:evidence,codeTests:'pending CI summary',artApproval:'NOT_APPROVED',errors
  };
  fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  assert.deepEqual(errors,[]);
  console.log('P2_REAL_MUTED_5SEC_30FPS_MP4_PASS '+JSON.stringify({bytes:stats.size,frames:150,uniqueFrames:new Set(allHashes).size,probe:probe.format.duration,selected:evidence.length,errors:0}));
 }finally{
  await browser.close();
  if(!process.env.FRAMEFORGE_KEEP_SOURCE_PNG)fs.rmSync(folder,{recursive:true,force:true});
 }
})().catch(e=>{console.error('P2_REAL_MUTED_ACTING_FAIL',e.stack||e);process.exitCode=1});
