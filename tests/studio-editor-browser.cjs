// The studio's shot inspector edits the episode the way a user would, and the saved JSON keeps every edit.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const ROOT=path.resolve(__dirname,'..');
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.mp3':'audio/mpeg','.png':'image/png','.jpg':'image/jpeg','.css':'text/css'};
function serve(){
 const server=http.createServer((req,res)=>{
  const file=path.join(ROOT,decodeURIComponent(new URL(req.url,'http://x').pathname).replace(/\/$/,'/index.html'));
  if(!file.startsWith(ROOT)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end();}
  res.writeHead(200,{'content-type':TYPES[path.extname(file)]||'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
 });
 return new Promise(ok=>server.listen(0,'127.0.0.1',()=>ok(server)));
}

(async()=>{
 const server=await serve();
 const url=(process.env.FRAMEFORGE_URL||`http://127.0.0.1:${server.address().port}/`)+'studio.html';
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,
  args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1280,height:900},acceptDownloads:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:35000});
 await page.waitForFunction(()=>window.FrameForgeProjectsLoaded&&window.FrameForgeQA?.shots().length===14&&FrameForgeQA.envelopeReady(),null,{timeout:60000});

 // The monitor shows the composited film canvas, not the bare WebGL canvas.
 const monitor=await page.evaluate(()=>({film:!!document.querySelector('#stage canvas.film'),canvases:document.querySelectorAll('#stage canvas').length}));
 assert.deepEqual(monitor,{film:true,canvases:1});

 // Select shot 3 and edit title, a performance and the camera from the inspector.
 await page.locator('#shots button').nth(2).click();
 assert.equal(await page.locator('#shotTitle').inputValue(),'NO REGRETS?');
 await page.locator('#shotTitle').fill('EDITED TITLE');await page.locator('#shotTitle').press('Enter');
 await page.locator('#act-blue').selectOption('celebrate');
 await page.locator('#move').selectOption('static');
 await page.locator('#roll').fill('-9');
 let state=await page.evaluate(()=>{const s=FrameForgeQA.shots()[2];return{title:s.title,blue:s.cast.blue.action,move:s.framing.move,roll:s.framing.roll,audio:document.getElementById('audioState').textContent}});
 assert.deepEqual({...state,audio:undefined},{title:'EDITED TITLE',blue:'celebrate',move:'static',roll:-9,audio:undefined});
 assert.match(state.audio,/in sync/,'title, camera and performance edits keep audio in sync');

 // Duplicate, move and delete shots; the audio is then out of date and export refuses.
 await page.locator('#shotDup').click();
 await page.locator('#shotUp').click();
 let ids=await page.evaluate(()=>FrameForgeQA.shots().map(s=>s.id));
 assert.equal(ids.length,15);assert.deepEqual(ids.slice(1,4),['shot-02','shot-03-copy','shot-03']);
 await page.locator('#shots button').nth(13).click();await page.locator('#shotDel').click();
 ids=await page.evaluate(()=>FrameForgeQA.shots().map(s=>s.id));
 assert.equal(ids.length,14);assert.ok(!ids.includes('shot-13'));
 assert.match(await page.locator('#audioState').textContent(),/out of date/);
 const refused=await page.evaluate(()=>FrameForgeMP4Test({frameLimit:2,width:360,height:640,download:false}).then(()=>'exported',e=>e.message));
 assert.match(refused,/out of date/);

 // A new hoodie colour changes the frame and saves with the episode.
 const recolour=await page.evaluate(()=>{
  const before=FrameForgeQA.renderFilmFrame(1.2,360,640);
  const input=document.getElementById('look-dev-hoodie');input.value='#c0392b';input.dispatchEvent(new Event('input'));
  return {changed:before!==FrameForgeQA.renderFilmFrame(1.2,360,640),inputs:document.querySelectorAll('#looks input[type=color]').length};
 });
 assert.deepEqual(recolour,{changed:true,inputs:4});

 // Download keeps the new order, the copy and all inspector edits, and marks the audio for rebuild.
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#download').click()]);
 const saved=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
 assert.deepEqual(saved.shots.map(s=>s.id),ids);
 const copy=saved.shots.find(s=>s.id==='shot-03-copy'),edited=saved.shots.find(s=>s.id==='shot-03');
 assert.equal(edited.title,'EDITED TITLE');assert.equal(edited.cast.blue.action,'celebrate');
 assert.deepEqual([edited.framing.move,edited.framing.roll],['static',-9]);
 assert.equal(copy.voice,undefined,'a duplicated shot needs its own voice line');
 assert.equal(saved.audio.state,'storyboard_only');assert.equal(saved.audio.masterUrl,null);
 assert.ok(saved.audio.music,'music cues survive the round trip');
 assert.deepEqual(saved.characters.find(c=>c.id==='dev').look,{hoodie:'#c0392b'});
 assert.equal(errors.length,0,'page errors: '+errors.join('; '));
 await browser.close();server.close();
 console.log('STUDIO_EDITOR_BROWSER_PASS: film monitor, live inspector edits, duplicate/reorder/delete, stale-audio guard, JSON round trip');
})().catch(e=>{console.error('STUDIO_EDITOR_BROWSER_FAILURE '+e.message);process.exit(1)});
