const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1140,height:860},acceptDownloads:true});
 const jsErrors=[],failed=[];page.on('pageerror',e=>jsErrors.push(e.message));page.on('requestfailed',r=>failed.push(r.url()));
 const resp=await page.goto(process.env.FRAMEFORGE_URL||'http://127.0.0.1:8968/',{waitUntil:'domcontentloaded',timeout:35000});
 assert.equal(resp.status(),200);
 await page.waitForFunction(()=>window.FrameForgeProjectsLoaded&&window.FrameForgePerformanceQA&&window.FrameForgeArtLab&&window.FrameForgeQA?.shots().length===14,null,{timeout:45000});
 const props=await page.evaluate(()=>FrameForgePerformanceQA.humanRig());
 assert.deepEqual(props,{upperLids:2,lowerLids:2,cheeks:2,lipCorners:2});
 let faces=[];
 for(const emotion of ['neutral','happy','worried','surprised']){
  const png=await page.evaluate(emotion=>FrameForgeArtLab.capture('dev','front',emotion,360,460,true),emotion);
  assert.match(png,/^data:image\/png;base64,/);
  const data=Buffer.from(png.split(',')[1],'base64');
  assert.ok(data.length>2500,'face PNG should contain actual pixels');
  faces.push({emotion,bytes:data.length,sha:crypto.createHash('sha256').update(data).digest('hex').slice(0,16)});
  if(process.env.FRAMEFORGE_ARTIFACT_DIR){
   fs.mkdirSync(process.env.FRAMEFORGE_ARTIFACT_DIR,{recursive:true});
   fs.writeFileSync(process.env.FRAMEFORGE_ARTIFACT_DIR+'/dev-'+emotion+'.png',data);
  }
 }
 assert.equal(new Set(faces.map(x=>x.sha)).size,4,'all four emotions must visually differ');
 const at=await page.evaluate(()=>{
  FrameForgeQA.setTime(2.40);const a=FrameForgePerformanceQA.peek();
  FrameForgeQA.setTime(24.60);const b=FrameForgePerformanceQA.peek();
  FrameForgeQA.setTime(2.40);const rewind=FrameForgePerformanceQA.peek();
  return {a,b,rewind};
 });
 assert.deepEqual(at.a,at.rewind,'identical timeline seek yields identical facial state');
 assert.notDeepEqual(at.a.browHeights,at.b.browHeights,'different story beats have different brow poses');
 const film=await page.evaluate(()=>FrameForgeQA.renderFilmFrame(24.60,360,640));
 assert.match(film,/^data:image\/jpeg;base64,/);
 assert.equal(jsErrors.length,0,jsErrors.join('; '));
 assert.equal(failed.filter(x=>/project-core|performance-core|frameforge.json/.test(x)).length,0);
 console.log('PERFORMANCE_BROWSER_PASS '+JSON.stringify({facialChannels:props,faces,seekDeterministic:true,browPerformanceChanges:true,filmFrameBytes:film.length,jsErrors}));
 await browser.close();
})().catch(e=>{console.error('PERFORMANCE_BROWSER_FAILURE '+e.stack);process.exit(1)});
