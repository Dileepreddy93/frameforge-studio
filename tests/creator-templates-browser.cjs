// Phase 1: the V6 episodes open in the Creator as templates, with DEV, BLUE and ORANGE rebuilt as Creator cast, and a
// V6 episode file opened with "Open project" becomes a Creator project too. Real Creator UI, real WebGL render.
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),
 cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),OUT=path.resolve(process.env.FRAMEFORGE_TEMPLATES_OUT||'artifacts/creator-templates');
const PORT=8997;
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const server=cp.spawn(process.execPath,['tests/static-server.cjs',String(PORT)],{cwd:ROOT,stdio:'pipe'});
 let browser;
 try{
  await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('static server did not start')),15000);
   server.stdout.on('data',d=>{if(String(d).includes('static server on')){clearTimeout(timer);resolve()}});
  });
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle',
    '--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:1330,height:930}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',d=>d.accept());
  await page.goto(`http://127.0.0.1:${PORT}/creator.html`,{waitUntil:'domcontentloaded',timeout:70000});
  await page.waitForFunction(()=>document.getElementById('play').disabled===false,null,{timeout:60000});

  const options=await page.locator('#start-from option').evaluateAll(os=>os.map(o=>[o.value,o.textContent]));
  await page.waitForFunction(()=>document.querySelectorAll('#start-from option').length>=8,null,{timeout:15000});
  const options2=await page.locator('#start-from option').evaluateAll(os=>os.map(o=>o.value));
  assert.deepEqual(options2.slice(0,4),['','blank','zero-latency.frameforge.json','dark-mode.frameforge.json']);
  assert.ok(options2.includes('templates/why-leaves-change.frameforge.json'),'ready-made stories are listed');
  // A ready-made story opens with its own cast and set.
  await page.locator('#start-from').selectOption('templates/why-leaves-change.frameforge.json');
  await page.waitForFunction(()=>{try{return document.getElementById('engine').contentWindow.HybridP56QA.getEditableProject().title==='Why Leaves Change Colour'}catch{return false}},null,{timeout:60000});
  assert.deepEqual(await page.evaluate(()=>Object.values(document.getElementById('engine').contentWindow.HybridP56QA.getEditableProject().hybrid.cast).map(c=>c.template)),['creature','mascot']);

  const results={};
  for(const [file,shots,first] of [['zero-latency.frameforge.json',14,'Our app takes twelve seconds to load.'],
                                   ['dark-mode.frameforge.json',12,'Users keep asking for dark mode.']]){
   await page.locator('#start-from').selectOption(file);
   await page.waitForFunction(n=>document.querySelectorAll('#shot-list li').length===n,shots,{timeout:30000});
   await page.waitForFunction(()=>/^(Opened|Rendered)/.test(document.getElementById('status').textContent),null,{timeout:60000});
   const state=await page.evaluate(()=>{
     const w=document.getElementById('engine').contentWindow,p=w.HybridP56QA.getEditableProject();
     return {cast:Object.fromEntries(Object.entries(p.hybrid.cast).map(([id,d])=>[id,d.template])),
       world:p.hybrid.world.template,first:p.shots[0].dialogue,schema:p.schema,
       screens:p.shots.filter(s=>s.screen).length,
       types:[...document.querySelectorAll('select[id^="cast-type-"]')].map(s=>s.value)};
   });
   assert.equal(state.schema,'frameforge.project/2');
   assert.deepEqual(state.cast,{dev:'dev',blue:'blue',orange:'orange'},'DEV, BLUE and ORANGE are Creator cast');
   assert.deepEqual(state.types,['dev','blue','orange'],'the cast panel shows the rebuilt characters');
   assert.equal(state.world,'desk');assert.equal(state.first,first);
   assert.ok(state.screens>=1,'screen inserts carry over');
   const still=await page.evaluate(()=>{const w=document.getElementById('engine').contentWindow;
     const r=w.HybridP56QA.frameAt(1.2,true);return {image:r.image,draw:r.rendererStats.drawCalls}});
   assert.ok(still.draw>20,'the scene really renders');
   fs.writeFileSync(path.join(OUT,file.replace('.frameforge.json','')+'-1.2s.png'),Buffer.from(still.image.split(',')[1],'base64'));
   results[file]={shots,screens:state.screens};
  }

  // A V6 episode file opened through "Open project" becomes a Creator project.
  await page.locator('#file').setInputFiles(path.join(ROOT,'projects/dark-mode.frameforge.json'));
  await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Validated project reopened'),null,{timeout:30000});
  const opened=await page.evaluate(()=>document.getElementById('engine').contentWindow.HybridP56QA.getEditableProject().hybrid.cast.blue.template);
  assert.equal(opened,'blue');

  // creator.html#start=<episode> (the landing page's button) opens that episode for a new visitor.
  const fresh=await browser.newPage({viewport:{width:1330,height:930}});
  fresh.on('pageerror',e=>errors.push(e.message));
  await fresh.goto(`http://127.0.0.1:${PORT}/creator.html#start=dark-mode.frameforge.json`,{waitUntil:'domcontentloaded',timeout:70000});
  await fresh.waitForFunction(()=>document.querySelectorAll('#shot-list li').length===12,null,{timeout:60000});
  assert.equal(await fresh.evaluate(()=>document.getElementById('engine').contentWindow.HybridP56QA.getEditableProject().title),'Dark Mode');
  assert.equal(await fresh.evaluate(()=>location.hash),'','the start link is consumed once');
  assert.deepEqual(errors,[],'no page errors');
  console.log('CREATOR_TEMPLATES_BROWSER_PASS '+JSON.stringify(results));
 }finally{await browser?.close();server.kill()}
})().catch(e=>{console.error('CREATOR_TEMPLATES_BROWSER_FAIL '+(e.stack||e.message));process.exit(1)});
