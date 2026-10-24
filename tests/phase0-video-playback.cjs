/** Real Chromium playback: V4 archived MP4, local static HTML, no mocked media. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--disable-dev-shm-usage']});
 try {
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(__dirname,'phase0-video-playback.html')).href,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>{
   const v=document.querySelector('video');
   return v.readyState>=1||v.error!==null;
  },null,{timeout:30000});
  const m=await page.locator('video').evaluate(v=>({error:v.error?.code||null,width:v.videoWidth,
   height:v.videoHeight,duration:v.duration,readyState:v.readyState}));
  assert.equal(m.error,null,'Chromium media decoder error');
  assert.equal(m.width,480);assert.equal(m.height,854);
  assert.ok(Math.abs(m.duration-41.842358)<0.2);
  await page.locator('video').evaluate(async v=>{
    v.muted=true;
    v.currentTime=1;
    await v.play();
  });
  await page.waitForFunction(()=>document.querySelector('video').currentTime>1.3,null,{timeout:20000});
  const time=await page.locator('video').evaluate(v=>v.currentTime);
  assert.deepEqual(errors,[]);
  console.log('PHASE0_V4_CHROMIUM_PLAYBACK_PASS',JSON.stringify({width:m.width,height:m.height,duration:m.duration,playedUntil:time}));
 } finally {await browser.close();}
})().catch(e=>{console.error('PHASE0_V4_CHROMIUM_PLAYBACK_FAIL',e.stack||e);process.exitCode=1;});
