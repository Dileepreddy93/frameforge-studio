// Pronunciation (M2.3), in the studio with the real Kokoro model:
// 1. ORANGE's British voice reads British English (misaki's GB dictionary); DEV's stays American.
// 2. A name the dictionary does not know is guessed and reported; "+ Add a pronunciation" starts from it, and a
//    respelling (koh-KOR-oh) re-voices only the line that uses it. The list is saved in the downloaded episode.
// 3. Our offline renders read every line with the same phonemes (tools/phonemize.mjs). If the offline voices are
//    installed (.venv), tools/voice_lines.py renders the downloaded episode and its line lengths are compared.
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
const ORANGE_LINE='Kokoro says the colour of the door is rather off.';
const OUT=process.env.FRAMEFORGE_PRONUNCIATION_OUT;

(async()=>{
 const server=await serve();
 const base=`http://127.0.0.1:${server.address().port}/`,profile=fs.mkdtempSync(path.join(os.tmpdir(),'frameforge-pron-'));
 const work=OUT||fs.mkdtempSync(path.join(os.tmpdir(),'frameforge-pron-out-'));fs.mkdirSync(work,{recursive:true});
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

  // 1. Dialects.
  const gb=await page.evaluate(()=>FrameForgeVoiceQA.phonemize('The water party was better after dark.','bm_george'));
  const us=await page.evaluate(()=>FrameForgeVoiceQA.phonemize('The water party was better after dark.','am_michael'));
  assert.equal(gb.phonemes,'ðə wˈɔːtə pˈɑːti wɒz bˈɛtə ˈɑːftə dˈɑːk.','British voices read British English');
  assert.equal(us.phonemes,'ðə wˈɔTəɹ pˈɑɹTi wʌz bˈɛTəɹ ˈæftəɹ dˈɑɹk.','American voices read American English');

  // 2. A three-line storyboard where ORANGE (British) says a name the dictionary does not know.
  await page.evaluate(line=>{const p=FrameForgeQA.project('mystery');p.id='pronunciation-test';p.shots=p.shots.slice(0,3);
   p.shots[1].speaker='orange';p.shots[1].dialogue=line;p.characters.find(c=>c.id==='orange').voice.kokoro={voice:'bm_george',speed:1};
   FrameForgeQA.openProject(p);FrameForgeQA.setOffline(true);},ORANGE_LINE);
  const voiced=fn=>page.waitForFunction(fn,null,{timeout:300000});
  await voiced(()=>{const s=FrameForgeVoiceQA.status();return s.mode==='browser'&&!s.stale&&s.lines?.length===3;});
  const before=await page.evaluate(()=>({lines:FrameForgeVoiceQA.status().lines,status:document.querySelector('#voiceStatus').textContent}));
  assert.deepEqual(before.lines[1].guessed,['Kokoro']);
  assert.match(before.lines[1].phonemes,/kˈQkQɹQ/,'guessed in British: '+before.lines[1].phonemes);
  assert.match(before.lines[1].phonemes,/kˈʌlə /,'colour, the British way');
  assert.match(before.status,/Guessed pronunciations: Kokoro \(fix them under Pronunciations\)/);
  // "+ Add a pronunciation" starts from the guessed word; a respelling re-voices that line only.
  await page.click('#pronAdd');
  assert.equal(await page.inputValue('#pron-word-0'),'Kokoro');
  await page.fill('#pron-say-0','koh-KOR-oh');await page.dispatchEvent('#pron-say-0','change');
  await voiced(()=>{const s=FrameForgeVoiceQA.status();return s.mode==='browser'&&!s.stale&&s.lines?.length===3&&s.lines[1].phonemes.startsWith('kQkˈɔːQ');});
  const after=await page.evaluate(()=>FrameForgeVoiceQA.status().lines);
  assert.equal(after[1].cached,false,'the line with Kokoro was re-voiced');
  assert.deepEqual(after[1].guessed,[],'and nothing is guessed any more');
  assert.ok(after[0].cached&&after[2].cached,'the other lines are untouched');
  // Saved with the episode.
  const [download]=await Promise.all([page.waitForEvent('download'),page.click('#download')]);
  const saved=path.join(work,'pronunciation-test.frameforge.json');await download.saveAs(saved);
  const project=JSON.parse(fs.readFileSync(saved,'utf8'));
  assert.deepEqual(project.pronunciations,[{word:'Kokoro',sayAs:'koh-KOR-oh'}]);
  assert.deepEqual(errors,[],'no page errors');

  // 3. Offline renders read the same phonemes.
  const voices={dev:'am_michael',blue:'af_heart',orange:'bm_george'};
  for(const c of project.characters)if(c.voice.kokoro)voices[c.id]=c.voice.kokoro.voice;
  const requests=project.shots.map(s=>JSON.stringify({text:s.dialogue,voice:voices[s.speaker],pronunciations:project.pronunciations})).join('\n');
  const offline=spawnSync('node',[path.join(ROOT,'tools/phonemize.mjs')],{input:requests,encoding:'utf8'}).stdout.trim().split('\n').map(l=>JSON.parse(l).phonemes);
  assert.deepEqual(offline,after.map(l=>l.phonemes),'tools/phonemize.mjs reads every line as the browser does');
  let lengths=null;
  if(fs.existsSync(path.join(ROOT,'.venv/bin/python'))){
   for(const c of project.characters)c.voice.kokoro??={voice:voices[c.id],speed:1};
   fs.writeFileSync(saved,JSON.stringify(project,null,1));
   const dir=path.join(work,'offline-lines');
   const r=spawnSync(path.join(ROOT,'.venv/bin/python'),['-I','tools/voice_lines.py','episode',saved,dir],{cwd:ROOT,encoding:'utf8'});
   if(r.status===0){
    const lines=JSON.parse(fs.readFileSync(path.join(dir,'lines.json'),'utf8')).lines;
    assert.deepEqual(lines.map(l=>l.phonemes),offline,'the offline manifest records the same phonemes');
    lengths=lines.map((l,i)=>({shot:l.shot,offline:l.seconds,browser:+after[i].seconds.toFixed(3)}));
    console.log('line lengths (s)',JSON.stringify(lengths));
    for(const l of lengths)assert.ok(Math.abs(l.offline/l.browser-1)<.2,l.shot+': offline '+l.offline+' s vs browser '+l.browser+' s');
   }else console.log('offline voices unavailable:',r.stderr.trim().split('\n').pop());
  }else console.log('offline voices not installed (.venv): line lengths not compared');
  console.log('PRONUNCIATION_BROWSER_PASS',JSON.stringify({before:before.lines[1].phonemes,after:after[1].phonemes,lengths}));
 }finally{
  await context.close();server.close();
  fs.rmSync(profile,{recursive:true,force:true});
  if(!OUT)fs.rmSync(work,{recursive:true,force:true});
 }
})().catch(e=>{console.error(e);process.exit(1)});
