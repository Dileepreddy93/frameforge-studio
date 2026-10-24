// The renderer must take every per-shot decision from the episode JSON, never from shot position.
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const ROOT=path.resolve(__dirname,'..');
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.ogg':'audio/ogg','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.css':'text/css'};
function serve(){
 const server=http.createServer((req,res)=>{
  const file=path.join(ROOT,decodeURIComponent(new URL(req.url,'http://x').pathname).replace(/\/$/,'/index.html'));
  if(!file.startsWith(ROOT)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end();}
  res.writeHead(200,{'content-type':TYPES[path.extname(file)]||'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
 });
 return new Promise(ok=>server.listen(0,'127.0.0.1',()=>ok(server)));
}
const sha=dataUrl=>crypto.createHash('sha256').update(dataUrl.split(',')[1]).digest('hex').slice(0,16);

(async()=>{
 const server=await serve();
 const url=process.env.FRAMEFORGE_URL||`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,
  args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1140,height:860}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:35000});
 await page.waitForFunction(()=>window.FrameForgeProjectsLoaded&&window.FrameForgeQA?.shots().length>0&&window.FrameForgeQA.envelopeReady(),null,{timeout:60000});
 const result=await page.evaluate(()=>{
  const QA=FrameForgeQA,frame=t=>QA.renderFilmFrame(t,360,640);
  const comedy=QA.project('comedy');
  const start=id=>{let t=0;for(const s of QA.shots()){if(s.id===id)return t;t+=s.duration}throw Error('no '+id)};
  // 1. The screen insert fills the frame, so shot-09 must look identical wherever it sits in the episode.
  QA.openProject(structuredClone(comedy));
  const inPlace=frame(start('shot-09')+1.5),titleInPlace=QA.sceneTitle();
  const moved=structuredClone(comedy);
  moved.shots.unshift(...moved.shots.splice(8,1));
  QA.openProject(moved);
  const movedFirst=frame(start('shot-09')+1.5),titleMoved=QA.sceneTitle();
  // 2. Editing the JSON changes the film: new title and insert text.
  const edited=structuredClone(comedy);
  const trade=edited.shots.find(s=>s.id==='shot-09');
  trade.title='EDITED TITLE';trade.insert.value='404';
  QA.openProject(edited);
  const editedFrame=frame(start('shot-09')+1.5),titleEdited=QA.sceneTitle();
  // 3. A shot with no authored title falls back to the episode title, not another shot's title.
  const untitled=structuredClone(comedy);delete untitled.shots[0].title;
  QA.openProject(untitled);frame(.5);
  const fallbackTitle=QA.sceneTitle();
  return {inPlace,movedFirst,editedFrame,titleInPlace,titleMoved,titleEdited,fallbackTitle};
 });
 await browser.close();server.close();
 assert.equal(sha(result.movedFirst),sha(result.inPlace),'shot-09 renders the same after being moved to the front');
 assert.equal(result.titleMoved,'THE TRADE');assert.equal(result.titleInPlace,'THE TRADE');
 assert.notEqual(sha(result.editedFrame),sha(result.inPlace),'editing insert data changes the frame');
 assert.equal(result.titleEdited,'EDITED TITLE');
 assert.equal(result.fallbackTitle,'ZERO LATENCY');
 assert.equal(errors.length,0,'page errors: '+errors.join('; '));
 console.log('EPISODE_DATA_BROWSER_PASS: position-independent shot, JSON edits reach the film, title fallback');
})().catch(e=>{console.error('EPISODE_DATA_BROWSER_FAILURE '+e.message);process.exit(1)});
