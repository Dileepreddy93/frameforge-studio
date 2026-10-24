/**
 * Mobile-size Chromium device emulation of REAL Ara GLB: no device hardware asserted.
 * Catches page overflow, unusable controls, missing WebGL content and expression reset.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  page.setDefaultTimeout(120000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const url=(process.env.FRAMEFORGE_URL||'http://127.0.0.1:8959/')+'asset-lab.html';
  const resp=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  assert.equal(resp.status(),200);
  await page.waitForFunction(()=>Boolean(window.FrameForgeRigLabQA),null,{timeout:70000});
  await page.locator('#human').scrollIntoViewIfNeeded();
  const start=Date.now();await page.locator('#human').click();
  await page.waitForFunction(()=>window.FrameForgeRigLabQA.getStatus().startsWith('READY'),null,{timeout:120000});
  const loadingMs=Date.now()-start;
  const scene=await page.evaluate(()=>window.FrameForgeRigLabQA.getSummary().scene);
  assert.equal(scene.bones,69);assert.equal(scene.animations,63);assert.ok(scene.skinnedMeshes>=9);
  const dimensions=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,viewportWidth:document.documentElement.clientWidth,
    canvasWidth:document.querySelector('#viewport canvas').width,canvasHeight:document.querySelector('#viewport canvas').height}));
  assert.ok(dimensions.scrollWidth<=dimensions.viewportWidth+4,'Unwanted mobile horizontal page overflow');
  assert.ok(dimensions.canvasWidth>=290&&dimensions.canvasHeight>=390,'Small or missing actual mobile WebGL canvas');
  await page.locator('#framing').selectOption('portrait');
  await page.locator('#expression').selectOption('worried');
  await page.locator('#faceLab summary').click();
  const slider=page.locator('input[data-morph="mouthFrown"]');
  await slider.scrollIntoViewIfNeeded();
  await slider.evaluate(el=>{el.value='1';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.evaluate(()=>window.FrameForgeRigLabQA.setTime(.33));
  assert.equal(await page.evaluate(()=>window.FrameForgeRigLabQA.getManualMorphs().mouthFrown),1);
  const out=process.env.FRAMEFORGE_MOBILE_OUT||'artifacts/p1-mobile-character';
  fs.mkdirSync(out,{recursive:true});
  const data=await page.evaluate(()=>window.FrameForgeRigLabQA.capture());
  assert.match(data,/^data:image\/png;base64,/);
  const bytes=Buffer.from(data.split(',')[1],'base64');
  assert.ok(bytes.length>30000,'Missing real mobile WebGL image');
  fs.writeFileSync(path.join(out,'mobile-face-worried.png'),bytes);
  await page.locator('#viewport').screenshot({path:path.join(out,'mobile-real-lab.png')});
  const manifest={schema:'frameforge.mobile-character-browser/1',test:'Chromium mobile emulation; not physical Android',viewport:{width:390,height:844},
    loadingMs,scene,dimensions,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),artApproval:'NOT_APPROVED',errors};
  fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  assert.deepEqual(errors,[]);
  console.log('P1_REAL_HUMAN_MOBILE_CHROMIUM_PASS',JSON.stringify({loadingMs,bones:scene.bones,morphChannels:scene.morphChannels,dimensions,errors:0}));
 }finally{await browser.close()}
})().catch(e=>{console.error('P1_REAL_HUMAN_MOBILE_CHROMIUM_FAIL',e.stack||e);process.exitCode=1});
