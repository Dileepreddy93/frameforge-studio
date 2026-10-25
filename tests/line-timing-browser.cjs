// Line timing (M2.4), in the studio with the real Kokoro model. In the Shot inspector:
// 1. "Before the line" and "Pause after" re-time the cut from the cached lines: the line starts later, the next one
//    waits, nothing is re-synthesised.
// 2. "Line pace" re-voices that line faster (or slower) and the shot shrinks to fit.
// 3. The timing is saved in the downloaded episode, comes back when it is opened again, and our offline renders
//    (tools/voice_lines.py, if .venv is installed) speak the line at the same pace.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {chromium}=require('playwright');
const {useCdnMirror}=require('./cdn-mirror.cjs');

const ROOT=path.resolve(__dirname,'..');
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.mp3':'audio/mpeg','.png':'image/png','.wasm':'application/wasm'};
function serve(){
 const server=http.createServer((req,res)=>{
  const file=path.join(ROOT,decodeURIComponent(new URL(req.url,'http://x').pathname).replace(/\/$/,'/index.html'));
  if(!file.startsWith(ROOT)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end();}
  res.writeHead(200,{'content-type':TYPES[path.extname(file)]||'application/octet-stream','content-length':fs.statSync(file).size});
  if(req.method==='HEAD')return res.end();
  fs.createReadStream(file).pipe(res);
 });
 return new Promise(ok=>server.listen(0,'127.0.0.1',()=>ok(server)));
}
const frames=x=>Math.round(x*30)/30;

(async()=>{
 const server=await serve();
 const base=`http://127.0.0.1:${server.address().port}/`,profile=fs.mkdtempSync(path.join(os.tmpdir(),'frameforge-timing-'));
 const work=fs.mkdtempSync(path.join(os.tmpdir(),'frameforge-timing-out-'));
 const context=await chromium.launchPersistentContext(profile,{headless:true,channel:process.env.FRAMEFORGE_CHANNEL||'chrome',viewport:{width:1100,height:850},acceptDownloads:true,
  args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 await useCdnMirror(context);
 const errors=[];
 try{
  const page=context.pages()[0]||await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'studio.html',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.FrameForgeProjectsLoaded&&window.FrameForgeQA?.shots().length>0&&window.FrameForgeVoiceQA&&
   FrameForgeVoiceQA.status().state!=='unknown',null,{timeout:90000});
  await page.evaluate(()=>FrameForgeQA.setOffline(true));
  if(await page.evaluate(()=>FrameForgeVoiceQA.status().state)==='missing')await page.click('#voiceDownload');
  assert.equal((await page.evaluate(()=>FrameForgeVoiceQA.ensure())).state,'ready');
  await page.evaluate(()=>{const p=FrameForgeQA.project('mystery');p.id='timing-test';p.shots=p.shots.slice(0,3);FrameForgeQA.openProject(p);FrameForgeQA.setOffline(true);});
  const settled=()=>page.waitForFunction(()=>{const s=FrameForgeVoiceQA.status();return s.mode==='browser'&&!s.stale&&s.lines?.length===3;},null,{timeout:300000});
  await settled();
  const state=()=>page.evaluate(()=>({lines:FrameForgeVoiceQA.status().lines,shots:FrameForgeQA.shots().map(s=>({duration:s.duration,timing:s.timing}))}));
  const slide=async(id,value)=>{await page.$eval('#'+id,(el,v)=>{el.value=String(v);el.dispatchEvent(new Event('input'));el.dispatchEvent(new Event('change'));},value);await settled();};
  await page.click('#shots .shot');
  const before=await state();
  assert.deepEqual(before.shots[0].timing,{lead:.15,pauseAfter:.35,pace:1});
  assert.equal(await page.textContent('#leadValue'),'0.15 s');

  // 1. Lead and pause re-time from the cache.
  await slide('lead',.6);await slide('pauseAfter',1);
  const retimed=await state();
  assert.deepEqual(retimed.shots[0].timing,{lead:.6,pauseAfter:1,pace:1});
  assert.ok(retimed.lines.every(l=>l.cached),'re-timing re-synthesises nothing');
  assert.ok(Math.abs(retimed.lines[0].start-.6)<1e-9,'the first line starts 0.6 s in');
  assert.equal(retimed.shots[0].duration,frames(.6+retimed.lines[0].seconds+1),'the shot is lead + line + pause');
  assert.ok(Math.abs(retimed.lines[1].start-(retimed.shots[0].duration+retimed.shots[1].timing.lead))<1e-6,'the next line waits for the pause');
  const quiet=await page.evaluate(([a,b])=>FrameForgeVoiceQA.rms(a,b),[.02,.55]),gap=await page.evaluate(l=>FrameForgeVoiceQA.rms(l.start+l.seconds+.05,l.start+l.seconds+.9),retimed.lines[0]);
  assert.ok(quiet<.002&&gap<.002,'silence before the line and in the pause ('+quiet+', '+gap+')');
  assert.equal(await page.textContent('#pauseValue'),'1.00 s');

  // 2. Pace re-voices the line, and the shot shrinks to fit.
  await slide('pace',1.2);
  const faster=await state();
  assert.equal(faster.lines[0].cached,false,'a new pace is a new take');
  assert.ok(faster.lines[1].cached&&faster.lines[2].cached,'the other lines are untouched');
  assert.ok(faster.lines[0].seconds<retimed.lines[0].seconds*.92,'faster: '+faster.lines[0].seconds.toFixed(2)+' s vs '+retimed.lines[0].seconds.toFixed(2)+' s');
  assert.equal(faster.shots[0].duration,frames(.6+faster.lines[0].seconds+1));
  assert.equal(await page.textContent('#paceValue'),'×1.20');

  // 3. Saved, reopened, and spoken at the same pace offline.
  const [download]=await Promise.all([page.waitForEvent('download'),page.click('#download')]);
  const saved=path.join(work,'timing-test.frameforge.json');await download.saveAs(saved);
  const project=JSON.parse(fs.readFileSync(saved,'utf8'));
  assert.deepEqual(project.shots[0].timing,{lead:.6,pauseAfter:1,pace:1.2},'timing is saved');
  assert.equal(project.shots[1].timing,undefined,'default timing is left out');
  await page.evaluate(p=>{FrameForgeQA.openProject(p);FrameForgeQA.setOffline(true);},project);
  await settled();await page.click('#shots .shot');
  assert.equal(await page.inputValue('#pace'),'1.2');
  const reopened=await state();
  assert.equal(reopened.lines[0].cached,true,'the reopened episode finds its takes in the cache');
  assert.equal(reopened.shots[0].duration,faster.shots[0].duration);
  assert.deepEqual(errors,[],'no page errors');
  let offline=null;
  if(fs.existsSync(path.join(ROOT,'.venv/bin/python'))){
   for(const c of project.characters)c.voice.kokoro??={voice:{dev:'am_michael',blue:'af_heart',orange:'bm_george'}[c.id],speed:1};
   fs.writeFileSync(saved,JSON.stringify(project,null,1));
   const dir=path.join(work,'lines'),r=spawnSync(path.join(ROOT,'.venv/bin/python'),['-I','tools/voice_lines.py','episode',saved,dir],{cwd:ROOT,encoding:'utf8'});
   if(r.status===0){
    const line=JSON.parse(fs.readFileSync(path.join(dir,'lines.json'),'utf8')).lines[0];
    assert.equal(line.pace,1.2);
    offline={seconds:line.seconds,browser:+faster.lines[0].seconds.toFixed(3)};
    assert.ok(Math.abs(line.seconds/faster.lines[0].seconds-1)<.12,'offline line at the same pace: '+JSON.stringify(offline));
   }else console.log('offline voices unavailable:',r.stderr.trim().split('\n').pop());
  }else console.log('offline voices not installed (.venv): pace not compared offline');
  console.log('LINE_TIMING_BROWSER_PASS',JSON.stringify({line:{normal:+retimed.lines[0].seconds.toFixed(3),pace1_2:+faster.lines[0].seconds.toFixed(3)},shot:{before:before.shots[0].duration,retimed:retimed.shots[0].duration,faster:faster.shots[0].duration},offline}));
 }finally{
  await context.close();server.close();
  fs.rmSync(profile,{recursive:true,force:true});fs.rmSync(work,{recursive:true,force:true});
 }
})().catch(e=>{console.error(e);process.exit(1)});
