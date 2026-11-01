// M6.3: every MP4 export shows progress, can be cancelled (and tried again), and is read back and checked; the
// report is in the studio and downloadable.
//   python3 -m http.server 8959 & FRAMEFORGE_URL=http://127.0.0.1:8959/ node tests/export-report-browser.cjs
//   FRAMEFORGE_CHANNEL=chrome|msedge to use an installed browser (default: Playwright's Chromium).
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {useCdnMirror}=require('./cdn-mirror.cjs');
const URL_=process.env.FRAMEFORGE_URL||'http://127.0.0.1:8959/';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.FRAMEFORGE_CHANNEL||undefined,
  args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1366,height:900}});await useCdnMirror(context);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(URL_+'studio.html');
  await page.waitForFunction(()=>window.FrameForgeRecovered&&FrameForgeQA?.shots().length>0&&FrameForgeQA.envelopeReady(),null,{timeout:120000});
  // 1. A short export: the report checks every property and passes.
  const r=await page.evaluate(async()=>{const r=await FrameForgeMP4Test({frameLimit:45,width:360,height:640,download:false});return r.report});
  assert.equal(r.ok,true,JSON.stringify(r.checks.filter(c=>c.ok===false)));
  assert.equal(r.result.frames,45);assert.equal(r.result.width,360);assert.equal(r.result.height,640);
  assert.equal(r.result.fps,30);assert.equal(r.result.videoCodec,'avc');
  assert.equal(r.result.channels,2);assert.equal(r.result.sampleRate,48000);
  for(const name of ['Video codec','Size','Frames','Frame rate','Video length','Audio codec','Audio channels','Audio sample rate','Audio not cut short'])
   assert.equal(r.checks.find(c=>c.name===name)?.ok,true,name);
  assert.ok(r.checks.find(c=>c.name==='First and last frames decode'),'the decode check is reported (run or skipped)');
  assert.ok(r.audioLevels.peakDb<0&&r.audioLevels.peakDb>-30,'the audio is there and doesn\'t clip');
  assert.match(await page.textContent('#exportReport'),/The MP4 checks out/);
  assert.match(await page.getAttribute('#exportReport a','download'),/-report\.json$/);
  // 2. A full-length export, cancelled part way: it stops, says so, and leaves nothing behind.
  const run=page.evaluate(()=>FrameForgeMP4Test({width:720,height:1280,download:false}).then(()=>'finished',e=>e.name+': '+e.message));
  await page.waitForFunction(()=>!document.getElementById('exportCancel').hidden&&document.getElementById('mp4Progress').value>.03,null,{timeout:120000});
  const progress=await page.textContent('#mp4Status');
  assert.match(progress,/Rendering frame \d+ of 1109 \(\d+%\) · [\d.]+ frames\/s · about .* left/);
  await page.click('#exportCancel');
  assert.equal(await run,'AbortError: Export cancelled');
  assert.equal(await page.textContent('#mp4Status'),'Export cancelled. Nothing was saved.');
  assert.equal(await page.isHidden('#exportCancel'),true);assert.equal(await page.isHidden('#mp4Progress'),true);
  // 3. Trying again works.
  const again=await page.evaluate(async()=>(await FrameForgeMP4Test({frameLimit:15,width:360,height:640,download:false})).report.ok);
  assert.equal(again,true);
  assert.deepEqual(errors,[]);
  console.log('EXPORT_REPORT_BROWSER_PASS',JSON.stringify({checks:r.checks.map(c=>c.name+':'+(c.ok===null?'skipped':c.ok)),progress}));
 }finally{await browser.close();}
})().catch(e=>{console.error('EXPORT_REPORT_BROWSER_FAIL',e);process.exit(1)});
