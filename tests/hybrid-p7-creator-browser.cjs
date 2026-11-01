// P7 actual browser authoring + save/reopen + stale voice and responsive usability.
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),
 {AxeBuilder}=require('@axe-core/playwright'),
 cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),OUT=path.resolve(process.env.FRAMEFORGE_P7_OUT||'artifacts/p7-creator');
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const server=cp.spawn(process.execPath,['tests/static-server.cjs','8996'],
  {cwd:ROOT,stdio:'pipe'});
 let browser;
 try{
  await new Promise((resolve,reject)=>{
   let ready=false;
   server.once('error',reject);
   const timer=setTimeout(()=>reject(Error('Creator HTTP server did not start')),15000);
   server.stdout.on('data',d=>{if(!ready&&String(d).includes('static server on')){ready=true;clearTimeout(timer);resolve()}});
  });
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl',
    '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
  const findings=[];
  for(const viewport of [{width:1330,height:930},{width:390,height:844}]){
   const context=await browser.newContext({viewport,acceptDownloads:true});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8996/creator.html',{waitUntil:'domcontentloaded',timeout:70000});
   await page.waitForFunction(()=>document.getElementById('play').disabled===false||
      document.getElementById('status').textContent.startsWith('Cannot open'),
     null,{timeout:120000});
   assert.equal(await page.locator('#play').isEnabled(),true,
     'Real editor must open editable Ember WebGL scene: '+await page.locator('#status').textContent());
   const accessibility=await new AxeBuilder({page})
     .withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
   fs.writeFileSync(path.join(OUT,'axe-'+viewport.width+'.json'),JSON.stringify({
     viewport,violations:accessibility.violations.map(v=>({id:v.id,impact:v.impact,
       targets:v.nodes.map(n=>n.target),details:v.description}))
   },null,2));
   assert.deepEqual(accessibility.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[],
     'New Creator must pass WCAG A/AA automated scans');
   const h=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,view:innerWidth}));
   assert.ok(h.doc<=h.view+2,'Creator must not overflow horizontally');
   const before=await page.locator('#frame').getAttribute('src');
   assert.ok(before.startsWith('data:image/png;base64,'));
   await page.locator('#title').fill('My authentic hybrid story');
   await page.locator('#title').press('Tab');
   assert.equal(await page.locator('#title').inputValue(),'My authentic hybrid story');
   await page.locator('#cast-type-luna').selectOption('creator');
   await page.locator('#world').selectOption('meadow');
   await page.locator('#timeofday').selectOption('night');
   await page.locator('#dialogue').fill('This dialogue was edited by the creator.');
   await page.locator('#dialogue').press('Tab');
   await page.locator('#emotion').selectOption('happy');
   await page.locator('#action').selectOption('wave');
   const changed=await page.locator('#frame').getAttribute('src');
   assert.ok(changed.startsWith('data:image/png;base64,'));
   assert.notEqual(before,changed,'World and actor edits must change real rendered pixels');
   await page.locator('#add-shot').click();
   assert.equal(await page.locator('#shot-list li').count(),3);
   await page.locator('#undo').click();
   assert.equal(await page.locator('#shot-list li').count(),2);
   await page.locator('#redo').click();
   assert.equal(await page.locator('#shot-list li').count(),3);
   const projectFile=page.waitForEvent('download');
   await page.locator('#save-project').click();const downloaded=await projectFile;
   assert.match(downloaded.suggestedFilename(),/\.json$/);
   const source=fs.readFileSync(await downloaded.path(),'utf8'),project=JSON.parse(source);
   assert.equal(project.format,'frameforge.creator/1');
   assert.equal(project.project.title,'My authentic hybrid story');
   assert.equal(project.project.shots.length,3);
   assert.equal(project.project.hybrid.world.template,'meadow');
   assert.equal(project.project.hybrid.cast.luna.template,'creator');
   assert.equal(await page.locator('#export').isEnabled(),false,
     'Must never export an unvoiced screenplay as if voice mixing was complete');
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.getElementById('play').disabled===false,null,{timeout:120000});
   assert.equal(await page.locator('#title').inputValue(),'My authentic hybrid story','IndexedDB recovery');
   assert.equal(await page.locator('#shot-list li').count(),3,'Recovered all authored shots');
   // Full file reopen is different from IndexedDB refresh.
   await page.locator('#world').selectOption('snow');
   await page.locator('#file').setInputFiles({name:'my-film.json',mimeType:'application/json',buffer:Buffer.from(source)});
   await page.waitForFunction(()=>document.getElementById('world').value==='meadow');
   assert.equal(await page.locator('#export').isEnabled(),false);
   const stillDownload=page.waitForEvent('download');
   await page.locator('#still').click();const png=await stillDownload;
   assert.equal(fs.readFileSync(await png.path()).toString('hex',0,4),'89504e47');
   await page.screenshot({path:path.join(OUT,'creator-'+viewport.width+'.png'),fullPage:true});
   // Corrupt browser data must remain recoverable, not silently overwritten.
   if(viewport.width===390){
     await page.evaluate(()=>new Promise((resolve,reject)=>{
       const request=indexedDB.open('frameforge-hybrid-projects',1);
       request.onsuccess=()=>{
         const db=request.result,tx=db.transaction('documents','readwrite');
         tx.objectStore('documents').put({text:'{"corrupted":',savedAt:Date.now()},'last-editor-project');
         tx.oncomplete=()=>{db.close();resolve()};
         tx.onerror=()=>reject(tx.error);
       };request.onerror=()=>reject(request.error);
     }));
     await page.reload({waitUntil:'domcontentloaded'});
     await page.waitForFunction(()=>document.getElementById('play').disabled===false,
       null,{timeout:120000});
     assert.equal(await page.locator('#recovery-backup').isVisible(),true);
     const recoveryDownload=page.waitForEvent('download');
     await page.locator('#recovery-backup').click();
     const damaged=await recoveryDownload;
     assert.equal(fs.readFileSync(await damaged.path(),'utf8'),'{"corrupted":');
     const persisted=await page.evaluate(()=>new Promise((resolve,reject)=>{
       const req=indexedDB.open('frameforge-hybrid-projects',1);
       req.onsuccess=()=>{
         const db=req.result,tx=db.transaction('documents','readonly');
         const get=tx.objectStore('documents').get('last-editor-project');
         get.onsuccess=()=>{const value=get.result?.text;db.close();resolve(value)};
         get.onerror=()=>reject(get.error);
       };req.onerror=()=>reject(req.error)
     }));
     assert.equal(persisted,'{"corrupted":','Damaged recovery is never overwritten automatically');
   }
   assert.deepEqual(errors,[],'No unhandled error in creator UI');
   findings.push({viewport,originalPixelsChanged:true,castWorldShotEditing:true,
     undoRedo:true,reopenJSON:true,IndexedDBRecovery:true,staleAudioRefused:true,PNG:true});
   await context.close();
  }
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify({
   verdict:'HYBRID_P7_CREATOR_BROWSER_PASS',findings,
   tested:'Real Chromium WebGL desktop and mobile viewport simulation',
   limitations:['English Kokoro inference not executed in this dedicated P7 test',
     'Browser H264 encoding may be unsupported on Chromium CI',
     'Mobile viewport emulation is not real iOS/Android hardware']
  },null,2));
  console.log('HYBRID_P7_CREATOR_BROWSER_PASS '+JSON.stringify(findings));
 }finally{await browser?.close();server.kill()}
})().catch(e=>{console.error('HYBRID_P7_CREATOR_BROWSER_FAIL '+e.stack);process.exitCode=1});
