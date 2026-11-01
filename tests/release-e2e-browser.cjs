// M6.5 release test: a new user's whole journey in one fresh browser profile, on the browser named by
// FRAMEFORGE_CHANNEL (chrome, msedge; default Playwright's Chromium).
//   1. download the voices      2. write a new ~60 s script and make it (voiced in the browser)
//   3. change a line (only it is re-voiced)       4. undo / redo
//   5. refresh: the episode comes back            6. offline: a line is voiced with no network
//   7. export the whole film at 1080x1920 and pass the studio's own MP4 check; keep the MP4, the episode file, the
//      report and a summary in FRAMEFORGE_RELEASE_OUT.
//   python3 -m http.server 8959 & FRAMEFORGE_URL=http://127.0.0.1:8959/ node tests/release-e2e-browser.cjs
// Needs the network (Hugging Face) for the first voice download. FRAMEFORGE_VOICE_MODEL=light uses the light model;
// FRAMEFORGE_EXPORT_SIZE=720 exports smaller.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {chromium}=require('playwright');
const {useCdnMirror}=require('./cdn-mirror.cjs');
const URL_=process.env.FRAMEFORGE_URL||'http://127.0.0.1:8959/';
const CHANNEL=process.env.FRAMEFORGE_CHANNEL||undefined,MODEL=process.env.FRAMEFORGE_VOICE_MODEL||'full';
const SIZE=Number(process.env.FRAMEFORGE_EXPORT_SIZE||1080),HEIGHT=Math.round(SIZE*16/9);
const OUT=path.resolve(process.env.FRAMEFORGE_RELEASE_OUT||fs.mkdtempSync(path.join(os.tmpdir(),'frameforge-release-')));
const SCRIPT=fs.readFileSync(path.join(__dirname,'fixtures','feature-freeze.script.txt'),'utf8');
const summary={browser:CHANNEL||'chromium',platform:`${os.platform()} ${os.release()}`,model:MODEL,steps:{}};
const step=async(name,fn)=>{const t=Date.now();process.stdout.write(`… ${name}\n`);const r=await fn();summary.steps[name]={...r,seconds:Math.round((Date.now()-t)/1000)};
 console.log(`✓ ${name} (${summary.steps[name].seconds} s) ${JSON.stringify(r).slice(0,300)}`);return r;};

(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'frameforge-profile-'));
 const context=await chromium.launchPersistentContext(profile,{headless:true,channel:CHANNEL,viewport:{width:1400,height:950},acceptDownloads:true,
  args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 await useCdnMirror(context);
 summary.browserVersion=context.browser()?.version()??'(persistent context)';
 const page=context.pages()[0]||await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const ready=()=>page.waitForFunction(()=>window.FrameForgeRecovered&&window.FrameForgeQA?.shots().length>0,null,{timeout:180000});
 const voiceAll=()=>page.evaluate(async()=>{await FrameForgeVoiceQA.voiceAll();return document.getElementById('voiceStatus').textContent;});
 const edit=async(i,text)=>{await page.evaluate(i=>document.querySelectorAll('.shot')[i].click(),i);await page.fill('#dialogue',text);await page.click('#apply');
  await page.waitForTimeout(700);await page.evaluate(async()=>{FrameForgeHistoryQA.checkpoint();await FrameForgeHistoryQA.saved();});};
 const line=i=>page.evaluate(i=>FrameForgeQA.shots()[i].text,i);
 try{
  await page.goto(URL_+'studio.html',{timeout:120000});await ready();
  summary.userAgent=await page.evaluate(()=>navigator.userAgent);

  await step('1. download the voices',async()=>{
   if(MODEL==='light')await page.evaluate(()=>FrameForgeVoiceQA.useModel('light'));
   const e=await page.evaluate(()=>FrameForgeVoiceQA.ensure());assert.equal(e.state,'ready');
   const files=await page.evaluate(()=>FrameForgeVoiceQA.downloaded());
   return {model:e.model,device:e.device,modelMB:+((files.model?.total||0)/1e6).toFixed(1),runtimeMB:+((files.runtime?.total||0)/1e6).toFixed(1)};
  });

  const made=await step('2. write a new script and make the episode',async()=>{
   await page.fill('#script',SCRIPT);await page.click('#build');
   await page.waitForFunction(()=>FrameForgeCurrentProject?.id==='feature-freeze',null,{timeout:30000});
   const status=await voiceAll();
   const s=await page.evaluate(()=>({shots:FrameForgeQA.shots().length,seconds:+FrameForgeQA.shots().reduce((a,s)=>a+s.duration,0).toFixed(2),
    cams:FrameForgeQA.shots().map(s=>s.camera).join(' '),mix:FrameForgeVoiceQA.status().mix}));
   assert.match(status,/^Voiced 21 lines in your browser/);
   assert.ok(s.seconds>=45&&s.seconds<=90,'a ~60 s episode: '+s.seconds);
   assert.ok(Math.abs(s.mix.lufs+14)<1.5,'mastered near −14 LUFS: '+s.mix.lufs);
   return {...s,status};
  });

  await step('3. change a line: only it is voiced again',async()=>{
   await edit(2,'No. No new features. Not one. We need a feature freeze.');
   const status=await voiceAll();
   assert.match(status,/\(1 new, 20 from the cache\)/);
   return {status};
  });

  await step('4. undo and redo',async()=>{
   await page.click('#undo');assert.equal(await line(2),'No. No new features. We need a feature freeze.');
   await page.click('#redo');assert.equal(await line(2),'No. No new features. Not one. We need a feature freeze.');
   const status=await voiceAll();assert.match(status,/\(0 new, 21 from the cache\)/);
   return {status};
  });

  await step('5. refresh: the episode comes back',async()=>{
   await page.reload();await ready();
   assert.equal(await page.evaluate(()=>FrameForgeCurrentProject.id),'feature-freeze');
   assert.equal(await line(2),'No. No new features. Not one. We need a feature freeze.');
   const banner=await page.textContent('#recovery');assert.match(banner,/Welcome back: “Feature Freeze”/);
   await page.evaluate(()=>FrameForgeVoiceQA.ensure());
   const status=await voiceAll();assert.match(status,/\(0 new, 21 from the cache\)/);
   return {banner,status};
  });

  await step('6. offline: a new line is voiced with no network',async()=>{
   await context.setOffline(true);
   await page.reload();await ready();
   await page.evaluate(()=>FrameForgeVoiceQA.ensure());
   await edit(20,'Ship it. Quickly, before it melts.');
   const status=await voiceAll();assert.match(status,/\(1 new, 20 from the cache\)/);
   await page.click('#undo');assert.equal(await line(20),'Ship it.');
   const back=await voiceAll();assert.match(back,/\(0 new, 21 from the cache\)/);
   await context.setOffline(false);
   return {status};
  });

  const exported=await step(`7. export the whole film at ${SIZE}x${HEIGHT}`,async()=>{
   const seconds=await page.evaluate(()=>FrameForgeQA.shots().reduce((a,s)=>a+s.duration,0));
   const [download,report]=await Promise.all([page.waitForEvent('download',{timeout:3*3600e3}),
    page.evaluate(([w,h])=>FrameForgeMP4Test({width:w,height:h,download:true}).then(r=>r.report),[SIZE,HEIGHT])]);
   const file=path.join(OUT,`feature-freeze-${SIZE}x${HEIGHT}.mp4`);await download.saveAs(file);
   fs.writeFileSync(path.join(OUT,`feature-freeze-${SIZE}x${HEIGHT}.report.json`),JSON.stringify(report,null,2));
   assert.equal(report.ok,true,JSON.stringify(report.checks.filter(c=>c.ok===false)));
   assert.equal(report.result.frames,Math.round(seconds*30));
   if(os.platform()==='win32'||os.platform()==='darwin')assert.equal(report.result.audioCodec,'aac','Chrome and Edge on Windows and macOS write AAC');
   return {file:path.basename(file),bytes:fs.statSync(file).size,frames:report.result.frames,videoSeconds:report.result.videoSeconds,audioSeconds:report.result.audioSeconds,
    audioCodec:report.result.audioCodec,decode:report.checks.find(c=>c.name==='First and last frames decode')?.actual,exportS:report.elapsedS};
  });

  await step('8. keep the episode file and the script',async()=>{
   const [dl]=await Promise.all([page.waitForEvent('download'),page.click('#download')]);
   const file=path.join(OUT,'feature-freeze.frameforge.json');await dl.saveAs(file);
   const p=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(p.shots.length,21);
   fs.writeFileSync(path.join(OUT,'feature-freeze.script.txt'),SCRIPT);
   return {shots:p.shots.length,seconds:+p.shots.reduce((a,s)=>a+s.duration,0).toFixed(2)};
  });
  assert.deepEqual(errors,[],'no page errors');
  summary.ok=true;summary.exported=exported;
 }catch(e){summary.ok=false;summary.error=String(e.stack||e);await page.screenshot({path:path.join(OUT,'failure.png')}).catch(()=>{});throw e;}
 finally{
  fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify(summary,null,2));
  await context.close();fs.rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:300});
 }
 console.log('RELEASE_E2E_PASS',JSON.stringify({browser:summary.browser,version:summary.browserVersion,exported:summary.exported}));
})().catch(e=>{console.error('RELEASE_E2E_FAIL',e);process.exit(1)});
