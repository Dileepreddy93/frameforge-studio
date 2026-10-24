/**
 * Real browser film-engine integration test.
 * Serve this repository over HTTP, then:
 * FRAMEFORGE_BASE_URL=http://127.0.0.1:8957 node tests/render-cinematic.cjs
 * Requires Playwright + Chromium in the test worker. No production deployment needed.
 */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
(async()=>{
 const browser=await chromium.launch({headless:true,args:[
  '--no-sandbox','--enable-webgl','--use-gl=angle',
  '--use-angle=swiftshader','--enable-unsafe-swiftshader'
 ]});
 const page=await browser.newPage({viewport:{width:980,height:800}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const resp=await page.goto(process.env.FRAMEFORGE_BASE_URL||'http://127.0.0.1:8957/',{waitUntil:'domcontentloaded',timeout:30000});
 assert.equal(resp.status(),200);
 await page.waitForFunction(()=>window.FrameForgeQA?.envelopeReady(),null,{timeout:25000});
 const lines=await page.evaluate(()=>FrameForgeQA.shots().map(s=>({text:s.text,duration:s.duration,camera:s.camera})));
 assert.equal(lines.length,14);
 let at=0,passed=0;
 for(const shot of lines){
  await page.evaluate(t=>FrameForgeQA.setTime(t),at+shot.duration/2);
  assert.equal((await page.locator('#subtitle').textContent()).trim(),shot.text);
  passed++;at+=shot.duration;
 }
 const samples=[];
 for(const t of [7.63,8.01,17.75,24.30,28.75]){
  const x=await page.evaluate(t=>{
   const jpeg=FrameForgeQA.renderFilmFrame(t,360,640);
   return{jpeg,camera:FrameForgeQA.cam.position.toArray().map(v=>+v.toFixed(3))};
  },t);
  assert.match(x.jpeg,/^data:image\/jpeg;base64,/);
  samples.push({time:t,camera:x.camera,sha:crypto.createHash('sha256').update(x.jpeg).digest('hex').slice(0,12)});
 }
 // Each authored listener cut must actually change camera composition.
 const cuts=[{index:2,d:0.58},{index:3,d:0.50},{index:7,d:0.67},{index:9,d:0.64},{index:11,d:0.72},{index:13,d:0.92}];
 let cutChecks=0;
 for(const cut of cuts){
  const start=lines.slice(0,cut.index).reduce((acc,x)=>acc+x.duration,0);
  const boundary=start+lines[cut.index].duration-cut.d;
  const a=await page.evaluate(t=>{FrameForgeQA.setTime(t);return FrameForgeQA.cam.position.toArray()},boundary-.10);
  const b=await page.evaluate(t=>{FrameForgeQA.setTime(t);return FrameForgeQA.cam.position.toArray()},boundary+.10);
  const delta=Math.hypot(...a.map((v,i)=>v-b[i]));
  assert.ok(delta>.60,'Reaction '+cut.index+' did not cut camera ('+delta.toFixed(2)+')');
  cutChecks++;
 }
 // Deterministic editorial cut in the third spoken line.
 assert.ok(Math.abs(samples[0].camera[0]-samples[1].camera[0])>1.0,'reaction shot changes character viewpoint');
 assert.notEqual(samples[2].sha,samples[3].sha,'0ms and 0-users screens render differently');
 assert.deepEqual(errors,[],'no uncaught JavaScript errors');
 console.log(JSON.stringify({status:'PASS',shots:lines.length,captionChecks:passed,reactionChecks:cutChecks,examinedFrames:samples,errors},null,2));
 await browser.close();
})().catch(e=>{console.error('FILM QA FAILED',e.stack);process.exit(1)});
