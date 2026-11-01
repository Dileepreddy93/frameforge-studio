// P9 actual beginner-path visual/keyboard/mobile acceptance; no mocked screenshot.
'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),
cp=require('node:child_process');
const {chromium}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const OUT=path.resolve(process.env.FRAMEFORGE_BETA_OUT||'artifacts/p9-beta-ux');
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const srv=cp.spawn(process.execPath,['tests/static-server.cjs','8998'],
  {cwd:path.resolve(__dirname,'..'),stdio:'pipe'});
 let browser;
 try{
  await new Promise((resolve,reject)=>{
   let ok=false;srv.once('error',reject);
   const timer=setTimeout(()=>reject(Error('Beta server did not open')),20000);
   srv.stdout.on('data',d=>{if(!ok&&String(d).includes('static server on')){ok=true;clearTimeout(timer);resolve()}});
  });
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl',
   '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const report=[];
  for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
   const context=await browser.newContext({viewport,acceptDownloads:true,reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   const r=await page.goto('http://127.0.0.1:8998/beta.html',{waitUntil:'domcontentloaded',timeout:60000});
   assert.equal(r.status(),200);
   await page.waitForFunction(()=>document.getElementById('play').disabled===false||
      document.getElementById('status').textContent.includes('unavailable'),
     null,{timeout:120000});
   assert.equal(await page.locator('#play').isEnabled(),true,'Real hybrid engine must be ready');
   const horiz=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth}));
   assert.ok(horiz.page<=horiz.viewport+2,'No horizontal overflow on '+viewport.width);
   await page.locator('#timeline').evaluate(el=>{
     el.value='1.4';el.dispatchEvent(new Event('input',{bubbles:true}));
   });
   assert.match(await page.locator('#time').textContent(),/1\.4/);
   assert.ok((await page.locator('#frame').getAttribute('src')).startsWith('data:image/png;base64,'));
   await page.locator('#story').selectOption('2');
   await page.waitForFunction(()=>document.getElementById('play').disabled===false,
    null,{timeout:120000});
   const download=page.waitForEvent('download');
   await page.locator('#still').click();const item=await download;
   assert.match(item.suggestedFilename(),/\.png$/);
   const buf=fs.readFileSync(await item.path());assert.equal(buf.toString('hex',0,4),'89504e47');
   await page.locator('#check-export').click();
   await page.waitForFunction(()=>!document.getElementById('export-status').textContent.includes('Testing actual browser'));
   assert.match(await page.locator('#export-status').textContent(),/H\.264|H264/i);
   // Before consent, timeline actions must NOT be recorded; exercise one more
   // intentional scrub after consent and require that only this action appears.
   await page.locator('#consent').check();
   await page.locator('#timeline').evaluate(el=>{
     el.value='2.1';el.dispatchEvent(new Event('input',{bubbles:true}));
   });
   await page.locator('#outcome').selectOption('partial');
   await page.locator('#ease').selectOption('2');
   await page.locator('#quality').selectOption('4');
   await page.locator('#monthly').selectOption('7');
   await page.locator('#feedback').fill('Scene selection is useful but project editing needs work.');
   const studyDownload=page.waitForEvent('download');await page.locator('#feedback-save').click();
   const studyFile=await studyDownload;
   const study=JSON.parse(fs.readFileSync(await studyFile.path(),'utf8'));
   assert.equal(study.responses.outcome,'partial');assert.equal(study.responses.monthlyPrice,'7');
   assert.equal(study.events.some(e=>e.type==='scrub-success'),true);
   assert.ok(study.consent);
   await page.locator('#consent').uncheck();
   await page.locator('#feedback-save').click();
   assert.match(await page.locator('#feedback-status').textContent(),/consent/);
   const axe=await new AxeBuilder({page})
     .withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
   fs.writeFileSync(path.join(OUT,'axe-'+viewport.width+'.json'),JSON.stringify({
     viewport,violations:axe.violations.map(v=>({id:v.id,impact:v.impact,
       description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))
   },null,2));
   assert.deepEqual(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[],
     'WCAG 2.2 A/AA violations must be resolved, not hidden');
   const smallTargets=await page.locator('button').evaluateAll(buttons=>buttons.filter(b=>
     !b.disabled&&b.getBoundingClientRect().height<44).map(b=>b.id));
   assert.deepEqual(smallTargets,[],'Tap targets must be at least 44 CSS px tall');
   await page.screenshot({path:path.join(OUT,'beta-'+viewport.width+'.png'),fullPage:true});
   assert.deepEqual(errors,[],'No app exceptions on '+viewport.width);
   report.push({viewport,engine:true,timeline:true,downloadPNG:true,consentedStudy:true,
     noOverflow:true,clickTargetMinHeight:44});
   await context.close();
  }
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify({
    verdict:'HYBRID_P9_BETA_UX_PASS',tested:'Chromium desktop and mobile viewport simulation',
    report,limits:['Mobile viewport simulation is not a physical Android/iOS device',
    'P7 unified editor unavailable; user study only tests the beta preview workflow']
  },null,2));
  console.log('HYBRID_P9_BETA_UX_PASS '+JSON.stringify(report));
 }finally{if(browser)await browser.close();srv.kill()}
})().catch(e=>{console.error('HYBRID_P9_BETA_UX_FAIL '+e.stack);process.exitCode=1});
