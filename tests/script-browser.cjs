// The studio's script box (M5.7): it shows the open episode as its script, follows shot edits, makes a new episode
// from a typed script (planned, valid, ready to voice) and reports mistakes by line without changing the episode.
//   python3 -m http.server 8959 & FRAMEFORGE_URL=http://127.0.0.1:8959/ node tests/script-browser.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {chromium}=require('playwright');
const {useCdnMirror}=require('./cdn-mirror.cjs');
const URL_=process.env.FRAMEFORGE_URL||'http://127.0.0.1:8959/';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1366,height:900},acceptDownloads:true});
 await useCdnMirror(context);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(URL_+'studio.html',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.FrameForgeProjectsLoaded&&FrameForgeQA?.shots().length===14,null,{timeout:120000});
  // 1. The open episode, as its script.
  const opened=await page.inputValue('#script');
  assert.match(opened,/^# Zero Latency\n/);
  assert.ok(opened.includes('DEV (worried): Our app takes twelve seconds to load.'));
  assert.ok(opened.includes('[wall bad] p95 page load = 12.0 s'));
  // 2. An edit in the shot inspector shows up in the script.
  await page.fill('#dialogue','Our app takes forever to load.');await page.click('#apply');
  assert.ok((await page.inputValue('#script')).includes('DEV (worried): Our app takes forever to load.'));
  // 3. Mistakes: reported by line, the episode is untouched.
  await page.fill('#script','DEV: Fine.\nBOB: Who am I?\nBLUE (furious): Hm.');
  await page.click('#build');
  const err=await page.textContent('#scriptStatus');
  assert.match(err,/Line 2: "BOB" is not in the cast/);assert.match(err,/Line 3: "furious" is not an emotion/);
  assert.equal(await page.evaluate(()=>FrameForgeCurrentProject.id),'zero-latency');
  // 4. A new episode from a typed script.
  await page.fill('#script',`# Bigger Logo
> A designer wants the logo bigger.
[wall bad] logo size = 12 px
DEV (worried): Can we make the logo bigger?
BLUE (happy): Instantly!
ORANGE: How much bigger?
DEV: Just a bit.
BLUE (happy): Done.
[screen good] Logo size = 4,000 km | Visible from the Moon.
DEV (surprised): It's the size of the Moon!
ORANGE: You did say bigger.`);
  await page.click('#build');
  await page.waitForFunction(()=>FrameForgeCurrentProject?.id==='bigger-logo',null,{timeout:20000});
  const made=await page.evaluate(()=>({cams:FrameForgeQA.shots().map(s=>s.camera),audio:FrameForgeCurrentProject.audio.state,
   menu:document.querySelector('#preset').selectedOptions[0].textContent,status:document.getElementById('scriptStatus').textContent,
   planned:FrameForgeQA.shots().filter(s=>s.reactionSource==='planned').length}));
  assert.deepEqual(made.cams,['dev','blue','orange','wide','screen','dev','duo']);
  assert.equal(made.audio,'storyboard_only');
  assert.equal(made.menu,'Bigger Logo — your script');
  assert.match(made.status,/Made 7 shots/);assert.match(made.status,/Voice every line/);
  // It draws: the screen shot shows the script's screen on the story window, and frames render.
  const t=await page.evaluate(()=>{let a=0;for(const s of FrameForgeQA.shots()){if(s.camera==='screen')return a+s.duration*.4;a+=s.duration}});
  const frame=await page.evaluate(t=>FrameForgeQA.renderFilmFrame(t,360,640),t);
  assert.ok(frame.length>8000);
  // 5. Downloading it gives a valid episode file that opens again.
  const [dl]=await Promise.all([page.waitForEvent('download'),page.click('#download')]);
  const file=path.join(os.tmpdir(),'frameforge-script-'+process.pid+'.json');await dl.saveAs(file);
  const saved=JSON.parse(fs.readFileSync(file,'utf8'));fs.rmSync(file);
  assert.equal(saved.title,'Bigger Logo');assert.equal(saved.shots.length,7);
  assert.equal(await page.evaluate(p=>window.FrameForgeProjectCore.validateProject(p).valid,saved),true);
  // 6. Choosing an episode in the menu opens it and shows its script.
  await page.selectOption('#preset','darkmode');
  await page.waitForFunction(()=>FrameForgeCurrentProject?.id==='dark-mode',null,{timeout:12000});
  assert.match(await page.inputValue('#script'),/^# Dark Mode\n/);
  assert.deepEqual(errors,[]);
  console.log('SCRIPT_BROWSER_PASS',JSON.stringify({cams:made.cams,planned:made.planned,frameChars:frame.length}));
 }finally{await browser.close();}
})().catch(e=>{console.error('SCRIPT_BROWSER_FAIL',e);process.exit(1)});
