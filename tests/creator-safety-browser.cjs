// Phase 5 in a real browser: a second Creator tab can't overwrite the first one's work, and an earlier version can be
// restored from the "Earlier versions" menu.
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),
 cp=require('node:child_process'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),PORT=8995,URL_=`http://127.0.0.1:${PORT}/creator.html`;
const ready=page=>page.waitForFunction(()=>document.getElementById('play').disabled===false,null,{timeout:60000});
const title=page=>page.evaluate(()=>document.getElementById('engine').contentWindow.HybridP56QA.getEditableProject().title);
(async()=>{
 const server=cp.spawn(process.execPath,['tests/static-server.cjs',String(PORT)],{cwd:ROOT,stdio:'pipe'});
 let browser;
 try{
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('static server did not start')),15000);
    server.stdout.on('data',d=>{if(String(d).includes('static server on')){clearTimeout(timer);resolve()}})});
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader',
    '--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:1330,height:930}}),errors=[];
  const first=await context.newPage();first.on('pageerror',e=>errors.push(e.message));first.on('dialog',d=>d.accept());
  await first.goto(URL_,{waitUntil:'domcontentloaded'});await ready(first);
  await first.locator('#title').fill('First tab story');await first.locator('#title').press('Tab');
  await first.waitForFunction(()=>/^Autosaved/.test(document.getElementById('storage-status').textContent),null,{timeout:45000}).catch(async e=>{throw Error('first tab never autosaved: '+await first.locator('#storage-status').textContent())});

  // A second tab opens read-only and says so; its edits are not saved over the first tab's work.
  const second=await context.newPage();second.on('pageerror',e=>errors.push(e.message));
  await second.goto(URL_,{waitUntil:'domcontentloaded'});await ready(second);
  assert.match(await second.locator('#storage-status').textContent(),/already open in another tab/);
  assert.equal(await second.locator('#storage-status').getAttribute('data-read-only'),'true');
  await second.locator('#title').fill('Second tab overwrite');await second.locator('#title').press('Tab');
  await second.waitForTimeout(1500);
  await second.close();
  await first.reload({waitUntil:'domcontentloaded'});await ready(first);
  assert.equal(await title(first),'First tab story','the second tab did not overwrite the first');

  // Earlier versions: put an older version in the history store, reload, restore it from the menu.
  await first.evaluate(()=>new Promise((ok,fail)=>{
    const req=indexedDB.open('frameforge-hybrid-projects',1);
    req.onsuccess=()=>{const db=req.result,tx=db.transaction('documents','readwrite'),st=tx.objectStore('documents');
      const g=st.get('last-editor-project');
      g.onsuccess=()=>{const now=g.result,old=JSON.parse(now.text);
        (old.project||old).title='An older version';
        st.put([{text:now.text,savedAt:now.savedAt},{text:JSON.stringify(old),savedAt:now.savedAt-120000}],'editor-history')};
      tx.oncomplete=()=>{db.close();ok()};tx.onerror=()=>fail(tx.error)};
    req.onerror=()=>fail(req.error)}));
  await first.reload({waitUntil:'domcontentloaded'});await ready(first);
  await first.waitForFunction(()=>!document.getElementById('versions').disabled,null,{timeout:45000}).catch(async()=>{
    throw Error('versions menu stayed disabled: '+JSON.stringify(await first.evaluate(()=>({saving:document.getElementById('storage-status').textContent,
      options:[...document.getElementById('versions').options].map(o=>o.textContent)}))))});
  assert.equal(await first.locator('#versions option').count(),2);
  await first.locator('#versions').selectOption('1');
  await first.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Earlier version restored'),null,{timeout:30000});
  assert.equal(await title(first),'An older version');

  // Report a problem: a readable report, never sent by itself, without the story's lines.
  await first.locator('#report').click();
  await first.waitForFunction(()=>document.getElementById('report-dialog').open,null,{timeout:5000});
  const report=await first.locator('#report-text').inputValue();
  assert.match(report,/^FrameForge Creator problem report/);
  assert.match(report,/Project: \d+ shots/);
  const lines=await first.evaluate(()=>document.getElementById('engine').contentWindow.HybridP56QA.getEditableProject().shots.map(s=>s.dialogue));
  assert.ok(lines.every(l=>!report.includes(l)),'the report leaves out the story lines');
  assert.match(await first.locator('#report-open').getAttribute('href'),/^https:\/\/github\.com\/Dileepreddy93\/frameforge-studio\/issues\/new\?/);
  await first.locator('#report-close').click();
  assert.deepEqual(errors,[],'no page errors');
  console.log('CREATOR_SAFETY_BROWSER_PASS second tab read-only, no overwrite; earlier version restored; problem report');
 }finally{await browser?.close();server.kill()}
})().catch(e=>{console.error('CREATOR_SAFETY_BROWSER_FAIL '+(e.stack||e.message));process.exit(1)});
