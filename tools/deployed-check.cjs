// Checks a deployed FrameForge site the way a buyer meets it, on a desktop and a phone-sized viewport:
// the landing page (both reels play, posters and cast cards load, the episode toggle works), the credits page,
// the studio (loads, no page errors, no sideways scrolling). Screenshots go to OUT.
//   node tools/deployed-check.cjs https://frameforge-v6.vercel.app/ OUT
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
const [base,out]=process.argv.slice(2);
if(!base||!out)throw new Error('usage: node tools/deployed-check.cjs <url> <out-dir>');

async function check(browser,name,viewport,isMobile){
 const context=await browser.newContext({viewport,isMobile,hasTouch:isMobile,deviceScaleFactor:isMobile?3:1});
 const page=await context.newPage(),errors=[],bad=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&!r.url().includes('/models/'))bad.push(r.status()+' '+r.url())});
 const result={name};
 await page.goto(base,{waitUntil:'load',timeout:60000});
 result.landingOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 const video=async()=>page.waitForFunction(()=>{const v=document.querySelector('video');return v&&v.readyState>=2&&v.videoWidth>0},null,{timeout:30000})
  .then(()=>page.evaluate(()=>{const v=document.querySelector('video');return {src:v.currentSrc.split('/').pop(),w:v.videoWidth,h:v.videoHeight,duration:+v.duration.toFixed(2)}}));
 result.ep01=await video();
 await page.evaluate(()=>{const b=[...document.querySelectorAll('button,[role=tab],a')].find(x=>/02|dark mode/i.test(x.textContent));b?.click()});
 await page.waitForFunction(()=>document.querySelector('video')?.currentSrc.includes('ep02'),null,{timeout:15000}).catch(()=>{});
 result.ep02=await video();
 result.images=await page.evaluate(async()=>{for(const i of document.images)i.loading='eager';
  await Promise.all([...document.images].map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r})));
  return [...document.images].map(i=>({src:i.src.split('/').pop(),ok:i.naturalWidth>0}))});
 await page.screenshot({path:path.join(out,`${name}-landing.png`),fullPage:false});
 await page.goto(base+'credits.html',{waitUntil:'load'});
 result.credits=await page.evaluate(()=>({title:document.title,rows:document.querySelectorAll('tbody tr').length,overflow:document.documentElement.scrollWidth-innerWidth}));
 await page.screenshot({path:path.join(out,`${name}-credits.png`),fullPage:false});
 await page.goto(base+'studio.html',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.FrameForgeProjectsLoaded&&window.FrameForgeQA?.shots().length>0,null,{timeout:90000});
 result.studio={shots:await page.evaluate(()=>FrameForgeQA.shots().length),overflow:await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),
  creditsLink:await page.evaluate(()=>!!document.querySelector('a[href="./credits.html"]'))};
 await page.waitForTimeout(1500);
 await page.screenshot({path:path.join(out,`${name}-studio.png`),fullPage:false});
 result.errors=errors;result.failedRequests=bad;
 await context.close();
 return result;
}

(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.FRAMEFORGE_CHANNEL||'chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  for(const [name,vp,mobile] of [['desktop',{width:1280,height:800},false],['phone',{width:390,height:844},true]]){
   const r=await check(browser,name,vp,mobile);
   console.log(JSON.stringify(r));
   assert.ok(r.ep01.src.startsWith('ep01')&&r.ep01.h===1280,name+': episode 01 reel plays');
   assert.ok(r.ep02.src.startsWith('ep02'),name+': the toggle switches to episode 02');
   assert.ok(r.images.every(i=>i.ok),name+': every image loads');
   assert.ok(r.credits.rows>=9,name+': credits page lists the parts');
   assert.ok(r.studio.shots>0&&r.studio.creditsLink,name+': studio loads and links the credits');
   assert.deepEqual(r.errors,[],name+': no page errors');
   assert.deepEqual(r.failedRequests,[],name+': no failed requests');
   if(name==='phone')for(const k of ['landingOverflow']){assert.ok(r[k]<=1,name+': no sideways scroll on the landing page ('+r[k]+' px)')}
  }
  console.log('DEPLOYED_CHECK_PASS');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
