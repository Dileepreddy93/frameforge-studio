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
   const mobile=viewport.width<=730;
   const context=await browser.newContext({viewport,acceptDownloads:true});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8996/creator.html',{waitUntil:'domcontentloaded',timeout:70000});
   try{
     await page.waitForFunction(()=>document.getElementById('play').disabled===false||
       document.getElementById('status').textContent.startsWith('Cannot open')||
       document.getElementById('status').textContent.startsWith('Scene unavailable'),
       null,{timeout:35000});
   }catch(e){
     const state=await page.evaluate(()=>({status:document.getElementById('status')?.textContent,
       engineReady:document.getElementById('engine')?.contentWindow?.HybridP56Ready,
       engineError:document.getElementById('engine')?.contentWindow?.HybridP56Error}));
     throw Error('Creator boot timed out: '+JSON.stringify(state)+'; JS exceptions: '+errors.join(' | '));
   }
   assert.equal(await page.locator('#play').isEnabled(),true,
     'Real editor must open editable Ember WebGL scene: '+await page.locator('#status').textContent());
   if(mobile){
     assert.equal(await page.locator('#mobile-workspace').isVisible(),true,
       'A mobile author has a fixed one-tap workspace switcher');
     for(const view of ['shot','preview','story']){
       await page.locator('#mobile-workspace [data-view="'+view+'"]').click();
       assert.equal(await page.locator('#pane-'+view).isVisible(),true);
       assert.equal(await page.locator('#mobile-workspace [data-view="'+view+'"]').getAttribute('aria-pressed'),'true');
     }
   }
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
   const before=await page.locator('#live-frame').evaluate(canvas=>canvas.toDataURL('image/png'));
   assert.ok(before.startsWith('data:image/png;base64,'),'Live preview must contain actual 3D frame pixels');
   await page.locator('#title').fill('My authentic hybrid story');
   await page.locator('#title').press('Tab');
   assert.equal(await page.locator('#title').inputValue(),'My authentic hybrid story');
   await page.locator('#cast-type-luna').selectOption('creator');
   await page.locator('#cast-top-luna').evaluate(el=>{
     el.value='#268fbb';el.dispatchEvent(new Event('change',{bubbles:true}));
   });
   await page.locator('#cast-hair-luna').selectOption('bun');
   await page.locator('#cast-style-luna').selectOption('lowpoly');

   await page.locator('#world').selectOption('meadow');
   await page.locator('#timeofday').selectOption('night');
   if(mobile)await page.locator('#mobile-workspace [data-view="shot"]').click();
   await page.locator('#dialogue').fill('This dialogue was edited by the creator.');
   await page.locator('#dialogue').press('Tab');
   await page.locator('#emotion').selectOption('happy');
   await page.locator('#action').selectOption('wave');
   if(mobile)await page.locator('#mobile-workspace [data-view="preview"]').click();
   await page.locator('#soundtrack').selectOption('groove');
   if(mobile)await page.locator('#mobile-workspace [data-view="shot"]').click();
   await page.locator('#shot-sound').selectOption('chime');
   const changed=await page.locator('#live-frame').evaluate(canvas=>canvas.toDataURL('image/png'));
   assert.ok(changed.startsWith('data:image/png;base64,'));
   assert.notEqual(before,changed,'World and actor edits must change real rendered pixels');
   // Fixed 360x640 scene composition: face occupies this central upper region
   // after selecting creator + night + close-up. Old screenshots measured <25
   // luma here; require the expressive face to remain actually readable.
   const faceReadability=await page.locator('#live-frame').evaluate(canvas=>{
     const pixels=canvas.getContext('2d').getImageData(80,145,210,200).data;
     let brightness=0,visible=0;
     for(let i=0;i<pixels.length;i+=4){
       const l=.2126*pixels[i]+.7152*pixels[i+1]+.0722*pixels[i+2];
       brightness+=l;if(l>60)visible++;
     }
     return {mean:brightness/(pixels.length/4),visibleFraction:visible/(pixels.length/4)};
   });
   assert.ok(faceReadability.mean>48&&faceReadability.visibleFraction>.35,
     'Night-scene actor face must remain readable after lighting changes: '+JSON.stringify(faceReadability));

   const beforeLens=await page.locator('#live-frame').evaluate(canvas=>canvas.toDataURL('image/png'));
   await page.locator('#camera-distance').fill('6.2');
   await page.locator('#camera-distance').press('Tab');
   await page.locator('#camera-fov').fill('42');
   await page.locator('#camera-fov').press('Tab');
   const afterLens=await page.locator('#live-frame').evaluate(canvas=>canvas.toDataURL('image/png'));
   assert.notEqual(beforeLens,afterLens,'Creator lens and camera distance must physically change 3D pixels');

   // The on-screen framing control must agree with the actual camera model:
   // monitor-wide default is 11.8, not the actor close-up 4.8.
   await page.locator('#camera').selectOption('screen');
   assert.equal(await page.locator('#camera-distance').inputValue(),'11.8',
     'Creator inspector must not lie about the portrait-safe screen camera distance');
   await page.locator('#camera').selectOption('actor');
   await page.locator('#camera-distance').fill('6.2');
   await page.locator('#camera-distance').press('Tab');
   await page.locator('#camera-fov').fill('42');
   await page.locator('#camera-fov').press('Tab');

   const noProp=await page.locator('#live-frame').evaluate(canvas=>canvas.toDataURL('image/png'));
   await page.locator('#visual-prop').selectOption('lantern');
   const withProp=await page.locator('#live-frame').evaluate(canvas=>canvas.toDataURL('image/png'));
   assert.notEqual(noProp,withProp,'Chosen lantern must change actual rendered 3D pixels');
   assert.equal(await page.locator('#prop-mode').isEnabled(),true);
   await page.locator('#prop-actor').selectOption('luna');
   await page.locator('#prop-mode').selectOption('reach');
   await page.locator('#camera').selectOption('prop');
   const propFocus=await page.evaluate(()=>{
     const api=document.getElementById('engine').contentWindow.HybridP56QA;
     return api.frameAt(1.6,false);
   });
   assert.equal(propFocus.propPose.mode,'reach');
   assert.equal(propFocus.camera.shotId,'shot-01');
   assert.ok(Number.isFinite(propFocus.propPose.gripError));
   assert.ok(propFocus.propPose.bendRadians>=.35,
     'Reaching for a grounded lantern requires visible upper-body motion');
   assert.ok(propFocus.propPose.gripError<=.08,
     'Leaning approach should bring wrist close to the physical handle: '+JSON.stringify(propFocus.propPose));
   await page.locator('#prop-mode').selectOption('lift');
   const groundedStart=await page.evaluate(()=>
     document.getElementById('engine').contentWindow.HybridP56QA.frameAt(.02,false));
   const heldEnd=await page.evaluate(()=>
     document.getElementById('engine').contentWindow.HybridP56QA.frameAt(1.5,false));
   assert.equal(groundedStart.propPose.attachProgress,0,
     'First lift frame must remain on the same physical ground coordinate');
   assert.ok(Math.abs(groundedStart.propPose.position[1])<.01);
   assert.equal(heldEnd.propPose.attachProgress,1,
     'Final lift frames follow the actual IK wrist');
   assert.ok(heldEnd.propPose.gripError<.04);
   await page.locator('#prop-mode').selectOption('reach');
   await page.locator('#ambient-screen').selectOption('hide');
   const quietShot=await page.evaluate(()=>document.getElementById('engine').contentWindow.HybridP56QA.frameAt(1.6,false));
   assert.equal(quietShot.ambientScreen,false);
   assert.equal(quietShot.screenVisible,false);
   assert.equal(quietShot.scenicScreenVisible,false,
     'Hiding the background monitor must remove its complete world sign and light');
   await page.locator('#screenKind').selectOption('terminal');
   const inserted=await page.evaluate(()=>
     document.getElementById('engine').contentWindow.HybridP56QA.frameAt(1.6,false));
   assert.equal(inserted.screenVisible,true);
   assert.equal(inserted.scenicScreenVisible,true,
     'A scripted screen insert must restore the world sign');
   await page.locator('#screenKind').selectOption('none');
   const restored=await page.evaluate(()=>
     document.getElementById('engine').contentWindow.HybridP56QA.frameAt(1.6,false));
   assert.equal(restored.scenicScreenVisible,false,
     'Removing the insert must not leave stale background scenery');
   await page.locator('#camera').selectOption('actor');
   await page.locator('#camera-distance').fill('6.2');await page.locator('#camera-distance').press('Tab');
   await page.locator('#camera-fov').fill('42');await page.locator('#camera-fov').press('Tab');
   if(mobile)await page.locator('#mobile-workspace [data-view="story"]').click();
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
   assert.equal(project.project.audio.music.cues[0].style,'groove');
   assert.equal(project.project.shots[0].sfx[0].cue,'chime');
   assert.equal(project.project.hybrid.cast.luna.look.top,'#268fbb');
   assert.equal(project.project.hybrid.cast.luna.look.hairStyle,'bun');
   assert.equal(project.project.hybrid.cast.luna.style,'lowpoly');
   assert.equal(project.project.shots[0].framing.distance,6.2,'Saved original camera dolly');
   assert.equal(project.project.shots[0].framing.fov,42,'Saved original lens FOV');
   assert.equal(project.project.shots[0].visualProp,'lantern','Chosen story prop survives save/reopen');
   assert.deepEqual(project.project.shots[0].propInteraction,{mode:'reach',actor:'luna'},'Authored grip action persists');
   assert.equal(project.project.shots[0].ambientScreen,false,'Ambient monitor visibility persists');
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
   if(mobile)await page.locator('#mobile-workspace [data-view="preview"]').click();
   const stillDownload=page.waitForEvent('download');
   await page.locator('#still').click();const png=await stillDownload;
   assert.equal(fs.readFileSync(await png.path()).toString('hex',0,4),'89504e47');
   await page.screenshot({path:path.join(OUT,'creator-'+viewport.width+'.png'),fullPage:true});
   if(mobile)assert.ok((await page.evaluate(()=>document.documentElement.scrollHeight))<2300,
     'Mobile preview tab should not force a 4,000px scroll through every editor panel');
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
     // A damaged record must never be discarded by a simple title edit.
     await page.locator('#title').fill('Attempted unsafe replacement');
     await page.locator('#title').press('Tab');
     assert.notEqual(await page.locator('#title').inputValue(),'Attempted unsafe replacement',
       'The editor must refuse edits before the original damaged record is exported');
     assert.match(await page.locator('#status').textContent(),/Export the damaged recovery copy/);
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
   // P14 creator acceptance: author ten original shots by the VISIBLE UI,
   // not programmatically calling the editor model or importing a prepared V2.
   // This is automation, NOT an independent novice/human or physical-phone test.
   for(let i=3;i<10;i++){
     if(mobile)await page.locator('#mobile-workspace [data-view="story"]').click();
     const beforeCount=await page.locator('#shot-list li').count();
     await page.locator('#add-shot').click();
     const diagnostic=await page.evaluate(()=>({
       count:document.querySelectorAll('#shot-list li').length,
       status:document.getElementById('status')?.textContent,
       storage:document.getElementById('storage-status')?.textContent,
       addDisabled:document.getElementById('add-shot')?.disabled,
       selected:[...document.querySelectorAll('#shot-list button')].find(x=>x.getAttribute('aria-current')==='true')?.dataset.shot,
       workspace:document.querySelector('#mobile-workspace button[aria-pressed=true]')?.dataset.view,
       paneVisible:document.getElementById('pane-story')?.dataset.mobileActive
     }));
     console.log('HYBRID_P14_GUI_ADD_DIAGNOSTIC '+JSON.stringify({viewport,i,beforeCount,...diagnostic}));
     if(diagnostic.count!==beforeCount+1)
       await page.screenshot({path:path.join(OUT,'add-shot-failure-'+viewport.width+'.png'),fullPage:true});
     assert.equal(diagnostic.count,beforeCount+1,
       'Clicking Add Shot must insert exactly one saved shot: '+JSON.stringify(diagnostic));
     await page.locator('#shot-list button').last().click();
     await page.locator('#dialogue').fill('Original manually authored scene '+(i+1)+
       ': Our two characters choose the next beat together.');
     await page.locator('#dialogue').press('Tab');
     await page.locator('#shot-duration').fill('3.5');
     await page.locator('#shot-duration').press('Tab');
     await page.locator('#camera').selectOption(i%3===0?'two':'actor');
   }
   assert.equal(await page.locator('#shot-list li').count(),10,
     'Ten real UI-authored shots must be visible');
   const tenDownload=page.waitForEvent('download');
   await page.locator('#save-project').click();
   const tenFile=await tenDownload;
   const tenSource=fs.readFileSync(await tenFile.path(),'utf8');
   const tenProject=JSON.parse(tenSource).project;
   assert.equal(tenProject.shots.length,10);
   assert.equal(tenProject.shots.filter(s=>s.dialogue.includes('Original manually authored scene')).length,7,
     'Each new shot was authored through the visible inspector');
   const tenSeconds=tenProject.shots.reduce((sum,s)=>sum+s.duration,0);
   assert.ok(tenSeconds>=30&&tenSeconds<=60,
     'Real editor must be able to author a commercial-length short: '+tenSeconds);
   assert.equal(await page.locator('#export').isEnabled(),false,
     'Unvoiced ten-shot film cannot be misrepresented as export-ready');
   await page.waitForTimeout(450);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.getElementById('play').disabled===false,
     null,{timeout:120000});
   assert.equal(await page.locator('#shot-list li').count(),10,
     'All ten GUI-authored shots must recover after a real browser refresh');
   if(mobile)await page.locator('#mobile-workspace [data-view="story"]').click();
   await page.locator('#file').setInputFiles({name:'gui-authored-ten-shots.json',
     mimeType:'application/json',buffer:Buffer.from(tenSource)});
   await page.waitForFunction(()=>document.querySelectorAll('#shot-list li').length===10);
   assert.equal(await page.locator('#shot-list li').count(),10,
     'Downloaded GUI-authored ten-shot project must reopen identically');
   await page.locator('#shot-list button').nth(9).click();
   await page.locator('#dialogue').fill('This final change survived an instant refresh.');
   await page.locator('#dialogue').press('Tab');
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.getElementById('play').disabled===false,null,{timeout:120000});
   await page.locator('#shot-list button').nth(9).click();
   assert.equal(await page.locator('#dialogue').inputValue(),
     'This final change survived an instant refresh.',
     'Latest visible edit must survive a refresh without waiting for IndexedDB');
   if(mobile)await page.locator('#mobile-workspace [data-view="story"]').click();
   await page.screenshot({path:path.join(OUT,'ten-shot-gui-'+viewport.width+'.png'),
     fullPage:true});
   assert.deepEqual(errors,[],'No unhandled error in creator UI');
   findings.push({viewport,faceReadability,originalPixelsChanged:true,castWorldShotEditing:true,
     undoRedo:true,reopenJSON:true,IndexedDBRecovery:true,staleAudioRefused:true,PNG:true,
     tenShotGuiAuthoring:true,tenShotGuiReload:true});
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
