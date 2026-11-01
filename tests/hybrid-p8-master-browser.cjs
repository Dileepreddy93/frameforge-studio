// P8 native-resolution export certification — no low-res enlargement.
// FrameForge v2 -> real WebGL native 1080x1920 frame buffer at 30 fps
// -> FFmpeg H.264/AAC packaging -> full independent decode and metadata audit.
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),
 cp=require('node:child_process'),http=require('node:http'),assert=require('node:assert/strict'),
 crypto=require('node:crypto');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const OUT=path.resolve(process.env.FRAMEFORGE_P8_OUT||'artifacts/p8-master-cert');
const HASH=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
function serve(){
 return new Promise(ok=>{
 const s=http.createServer((req,res)=>{
   let file;
   try{file=path.resolve(ROOT,decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/,''));}
   catch{res.writeHead(400).end();return}
   if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
   const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.mp3':'audio/mpeg'};
   res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream'});
   fs.createReadStream(file).pipe(res);
 });
 s.listen(0,'127.0.0.1',()=>ok(s));
 });
}
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});const host=await serve();
 let browser,dir;
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl',
    '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:430,height:790}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+host.address().port+'/tests/hybrid-p56-proof.html',
    {waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.HybridP56Ready||window.HybridP56Error,null,{timeout:90000});
  assert.equal(await page.evaluate(()=>window.HybridP56Error||null),null);
  const size=await page.evaluate(()=>HybridP56QA.setOutputResolution(1080,1920));
  assert.deepEqual(size,{width:1080,height:1920,surfacePixels:2073600});
  // WebGL and composite dimensions MUST both match the real export surface.
  const frame0=await page.evaluate(()=>HybridP56QA.frameAt(.125));
  assert.ok(frame0.image.startsWith('data:image/png;base64,'));
  const first=Buffer.from(frame0.image.split(',')[1],'base64');
  const pngResolution=b=>[b.readUInt32BE(16),b.readUInt32BE(20)];
  assert.deepEqual(pngResolution(first),[1080,1920]);
  const variance=await page.evaluate(()=>{
    const canvas=document.createElement('canvas');
    canvas.width=1080;canvas.height=1920;
    const ctx=canvas.getContext('2d');
    const image=new Image();return new Promise((resolve,reject)=>{
      image.onload=()=>{
        ctx.drawImage(image,0,0);
        const data=ctx.getImageData(120,350,840,1200).data;
        let min=255,max=0,sum=0,sumSq=0,n=0;
        for(let i=0;i<data.length;i+=4*197){
          const y=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];
          min=Math.min(min,y);max=Math.max(max,y);sum+=y;sumSq+=y*y;n++;
        }
        resolve({min,max,stddev:Math.sqrt(sumSq/n-(sum/n)**2)});
      };image.onerror=reject;image.src=HybridP56QA.frameAt(.125).image;
    });
  });
  assert.ok(variance.stddev>7&&variance.max-variance.min>20,
    'Real HD frame is blank or renders as one color: '+JSON.stringify(variance));
  dir=fs.mkdtempSync(path.join(os.tmpdir(),'hybrid-p8-master-'));
  const FPS=30,SECONDS=2,N=FPS*SECONDS;const started=Date.now();
  const stills=[];
  for(let i=0;i<N;i++){
    const png=await page.evaluate(t=>HybridP56QA.frameAt(t).image,.15+i/FPS);
    const file=path.join(dir,'frame-'+String(i).padStart(3,'0')+'.png');
    fs.writeFileSync(file,Buffer.from(png.split(',')[1],'base64'));
    if(i===0||i===Math.floor(N/2)||i===N-1){
      assert.deepEqual(pngResolution(fs.readFileSync(file)),[1080,1920]);
      stills.push({frame:i,sha256:HASH(file)});
      fs.copyFileSync(file,path.join(OUT,'cert-frame-'+String(i).padStart(3,'0')+'.png'));
    }
  }
  const master=path.join(OUT,'master.wav');
  fs.writeFileSync(master,Buffer.from(await page.evaluate(()=>HybridP56QA.masterWav()),'base64'));
  const film=path.join(OUT,'hybrid-native-1080x1920-30fps.mp4');
  cp.execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',
    '-framerate','30','-i',path.join(dir,'frame-%03d.png'),'-i',master,
    '-t',String(SECONDS),'-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p',
    '-profile:v','high','-b:v','8000k','-c:a','aac','-b:a','192k',
    '-ar','48000','-ac','2','-movflags','+faststart',film],
    {stdio:['ignore','pipe','pipe'],timeout:240000});
  const probe=JSON.parse(cp.execFileSync('ffprobe',['-v','error','-count_frames',
    '-show_entries','stream=codec_name,codec_type,width,height,r_frame_rate,nb_read_frames,sample_rate,channels:format=duration',
    '-of','json',film],{encoding:'utf8',timeout:60000}));
  const v=probe.streams.find(s=>s.codec_type==='video'),a=probe.streams.find(s=>s.codec_type==='audio');
  assert.equal(v.codec_name,'h264');assert.equal(a.codec_name,'aac');assert.equal(v.width,1080);
  assert.equal(v.height,1920);assert.equal(v.r_frame_rate,'30/1');
  assert.equal(Number(v.nb_read_frames),N);assert.equal(a.sample_rate,'48000');assert.equal(a.channels,2);
  assert.ok(Math.abs(Number(probe.format.duration)-SECONDS)<.12);
  cp.execFileSync('ffmpeg',['-v','error','-xerror','-i',film,'-f','null','-'],
    {stdio:['ignore','pipe','pipe'],timeout:180000});
  assert.deepEqual(errors,[]);
  const result={status:'HYBRID_P8_NATIVE_HD_PASS',source:'real 3D WebGL output, NOT scaled 360p frames',
    width:1080,height:1920,fps:30,frames:N,seconds:SECONDS,videoCodec:'h264',
    audioCodec:'aac',channels:2,audioHz:48000,completeDecode:true,
    firstMiddleLastStills:stills,variance,secondsToRenderAndEncode:(Date.now()-started)/1000,
    fileSize:fs.statSync(film).size,sourceCommit:process.env.GITHUB_SHA||null,
    limitations:['2s technical proof rather than 30–60s commercial film',
     'ffmpeg CI packaging is not browser WebCodecs export certification',
     'Chromium software renderer CI is not iOS/Android/macOS/Windows hardware compatibility']};
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(result,null,2));
  console.log('HYBRID_P8_NATIVE_HD_PASS '+JSON.stringify(result));
  await page.evaluate(()=>HybridP56QA.dispose());
 }finally{if(browser)await browser.close();await new Promise(ok=>host.close(ok));
   if(dir)fs.rmSync(dir,{recursive:true,force:true})}
})().catch(e=>{console.error('HYBRID_P8_NATIVE_HD_FAIL '+e.stack);process.exitCode=1});
