/* Reproducible 3-second V5.2 film segment, intended for real Chromium CI. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1000,height:830}});
 page.setDefaultTimeout(900000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url=process.env.FRAMEFORGE_URL||'http://127.0.0.1:8959/';
 const resp=await page.goto(url,{waitUntil:'domcontentloaded',timeout:35000});
 if(resp.status()!==200)throw new Error('Render page unavailable: '+resp.status());
 await page.waitForFunction(()=>window.FrameForgeMP4Test&&FrameForgeQA?.envelopeReady()&&window.FrameForgePerformanceQA,null,{timeout:45000});
 const r=await page.evaluate(async()=>{
  const result=await FrameForgeMP4Test({startTime:31.9,frameLimit:90,width:360,height:640,download:false});
  const b64=await new Promise((ok,bad)=>{const reader=new FileReader();reader.onload=()=>ok(reader.result.split(',')[1]);reader.onerror=bad;reader.readAsDataURL(result.blob)});
  return {frames:result.frames,duration:result.duration,bytes:result.bytes,b64};
 });
 if(r.frames!==90||Math.abs(r.duration-3)>0.10||r.bytes<20000)throw new Error('Invalid export metadata');
 if(errors.length)throw new Error('Page errors: '+errors.join('; '));
 const directory=path.join(process.cwd(),'artifacts');
 fs.mkdirSync(directory,{recursive:true});
 const file=path.join(directory,'v5-2-facial-motion-3s.mp4');
 fs.writeFileSync(file,Buffer.from(r.b64,'base64'));
 if(fs.statSync(file).size!==r.bytes)throw new Error('File size mismatch');
 console.log('V5_2_RENDER_PREVIEW_OK '+JSON.stringify({file,frames:r.frames,duration:r.duration,bytes:r.bytes,pageErrors:errors.length}));
 await browser.close();
})().catch(e=>{console.error('V5_2_RENDER_PREVIEW_FAILED',e.stack);process.exit(1)});
