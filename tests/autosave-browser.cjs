// M6.2: work is never lost. Edits save in the browser as you go; undo/redo step through them; a refresh, or the
// browser being killed outright, brings the episode back as it was; a typed script survives too.
//   python3 -m http.server 8959 & FRAMEFORGE_URL=http://127.0.0.1:8959/ node tests/autosave-browser.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright');
const {useCdnMirror}=require('./cdn-mirror.cjs');
const URL_=process.env.FRAMEFORGE_URL||'http://127.0.0.1:8959/';
const GL=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'];
const ready=page=>page.waitForFunction(()=>window.FrameForgeRecovered&&window.FrameForgeQA?.shots().length>0,null,{timeout:120000});
const line=(page,i=0)=>page.evaluate(i=>FrameForgeQA.shots()[i].text,i);
// The autosave runs 0.5 s after the last change; then wait for its write to be on disk.
const settle=async page=>{await page.waitForTimeout(700);await page.evaluate(()=>FrameForgeHistoryQA.saved());};

async function edit(page,text){
 await page.evaluate(()=>document.querySelectorAll('.shot')[0].click());
 await page.fill('#dialogue',text);await page.click('#apply');await settle(page);
}

(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox',...GL]});
 try{
  const context=await browser.newContext({viewport:{width:1366,height:900}});await useCdnMirror(context);
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(URL_+'studio.html');await ready(page);
  const original=await line(page);
  assert.equal(await page.isDisabled('#undo'),true,'nothing to undo on a fresh episode');
  // 1. Edits are saved and can be undone and redone (buttons and keyboard).
  await edit(page,'Our app takes a whole minute to load.');
  await page.evaluate(()=>{const e=document.getElementById('look-dev-hoodie');e.value='#aa3366';e.dispatchEvent(new Event('input',{bubbles:true}));});
  await settle(page);
  assert.match(await page.textContent('#saveState'),/Saved in this browser at/);
  assert.deepEqual(await page.evaluate(()=>FrameForgeHistoryQA.depth()),{undo:2,redo:0});
  await page.click('#undo');assert.equal(await page.evaluate(()=>FrameForgeCurrentProject.characters.find(c=>c.id==='dev').look?.hoodie),undefined,'undo takes the colour back');
  await page.click('#undo');assert.equal(await line(page),original,'undo takes the line back');
  assert.equal(await page.isDisabled('#undo'),true);
  await page.click('#redo');assert.equal(await line(page),'Our app takes a whole minute to load.');
  await page.locator('body').click({position:{x:5,y:5}});
  await page.keyboard.press('Control+z');assert.equal(await line(page),original,'Ctrl+Z undoes');
  await page.keyboard.press('Control+Shift+z');assert.equal(await line(page),'Our app takes a whole minute to load.','Ctrl+Shift+Z redoes');
  await settle(page);
  // 2. A refresh brings it back, with a note and a way back to the original.
  await page.reload();await ready(page);
  assert.equal(await line(page),'Our app takes a whole minute to load.');
  assert.match(await page.textContent('#recovery'),/Welcome back: “Zero Latency” is as you left it/);
  // 3. Choosing another episode and back: your saved changes, the original one click away.
  await page.selectOption('#preset','darkmode');await page.waitForFunction(()=>FrameForgeCurrentProject.id==='dark-mode');
  await page.selectOption('#preset','comedy');await page.waitForFunction(()=>FrameForgeCurrentProject.id==='zero-latency');
  assert.equal(await line(page),'Our app takes a whole minute to load.');
  assert.match(await page.textContent('#recovery'),/Opened your saved changes to “Zero Latency”/);
  await page.click('#recovery button');await page.waitForFunction(o=>FrameForgeQA.shots()[0].text===o,original);await settle(page);
  await page.reload();await ready(page);
  assert.equal(await line(page),original,'after "Use the original instead" the saved copy is gone');
  // 4. A typed script that was never made survives a refresh.
  await page.fill('#script','# Draft\nDEV: This is only a draft.\nBLUE: Unsaved, but kept.');await settle(page);
  await page.reload();await ready(page);
  assert.match(await page.inputValue('#script'),/This is only a draft\.\nBLUE: Unsaved, but kept\./);
  // 5. An episode made from a script exists nowhere else: it is saved at once and reopens after a refresh.
  await page.click('#build');await page.waitForFunction(()=>FrameForgeCurrentProject.id==='draft');await settle(page);
  await page.reload();await ready(page);
  assert.equal(await page.evaluate(()=>FrameForgeCurrentProject.id),'draft');
  assert.equal(await line(page,1),'Unsaved, but kept.');
  assert.deepEqual(errors,[]);
  await context.close();
 }finally{await browser.close();}

 // 6. The browser is killed outright (no unload events), then started again on the same profile.
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'frameforge-crash-'));
 const port=9300+Math.floor(Math.random()*500);
 const start=()=>{const p=spawn(chromium.executablePath(),['--headless=new','--no-sandbox',...GL,`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',detached:true});return p;};
 // The whole browser dies at once (main process and its helpers), as in a crash or power cut.
 const kill=p=>new Promise(r=>{if(p.exitCode!==null)return r();p.once('exit',r);try{process.kill(-p.pid,'SIGKILL')}catch{p.kill('SIGKILL')}});
 const attach=async()=>{for(let i=0;i<100;i++){try{return await chromium.connectOverCDP(`http://127.0.0.1:${port}`)}catch{await new Promise(r=>setTimeout(r,200))}}throw new Error('Chromium did not start')};
 try{
  let proc=start(),cdp=await attach();
  let ctx=cdp.contexts()[0];await useCdnMirror(ctx);let page=await ctx.newPage();
  await page.goto(URL_+'studio.html');await ready(page);
  await edit(page,'Saved just before the crash.');
  await kill(proc);
  proc=start();cdp=await attach();ctx=cdp.contexts()[0];await useCdnMirror(ctx);page=await ctx.newPage();
  await page.goto(URL_+'studio.html');await ready(page);
  assert.equal(await line(page),'Saved just before the crash.','the edit survived the browser being killed');
  assert.match(await page.textContent('#recovery'),/Welcome back/);
  await cdp.close().catch(()=>{});await kill(proc);
 }finally{try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:10,retryDelay:300})}catch(e){console.warn('could not remove the test profile',e.code)}}
 console.log('AUTOSAVE_BROWSER_PASS: save, undo/redo (buttons, keys), refresh recovery, saved changes per episode, original on demand, script draft, script episode, crash recovery');
})().catch(e=>{console.error('AUTOSAVE_BROWSER_FAIL',e);process.exit(1)});
