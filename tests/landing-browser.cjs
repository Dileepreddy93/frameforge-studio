// The landing page's shot sheet is built from the episode files and drives the reel.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const ROOT=path.resolve(__dirname,'..');
const TYPES={'.webm':'video/webm','.html':'text/html','.js':'text/javascript','.json':'application/json','.mp4':'video/mp4','.mp3':'audio/mpeg','.jpg':'image/jpeg','.png':'image/png'};
function serve(){
 const server=http.createServer((req,res)=>{
  const file=path.join(ROOT,decodeURIComponent(new URL(req.url,'http://x').pathname).replace(/\/$/,'/index.html'));
  if(!file.startsWith(ROOT)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end();}
  // Byte ranges, like a real host: browsers need them to seek inside a video.
  const size=fs.statSync(file).size,type=TYPES[path.extname(file)]||'application/octet-stream';
  const range=/bytes=(\d*)-(\d*)/.exec(req.headers.range||'');
  if(range){
   const start=range[1]?Number(range[1]):size-Number(range[2]),end=range[1]&&range[2]?Math.min(Number(range[2]),size-1):size-1;
   res.writeHead(206,{'content-type':type,'accept-ranges':'bytes','content-range':`bytes ${start}-${end}/${size}`,'content-length':end-start+1});
   return fs.createReadStream(file,{start,end}).pipe(res);
  }
  res.writeHead(200,{'content-type':type,'accept-ranges':'bytes','content-length':size});
  fs.createReadStream(file).pipe(res);
 });
 return new Promise(ok=>server.listen(0,'127.0.0.1',()=>ok(server)));
}
const episode=file=>JSON.parse(fs.readFileSync(path.join(ROOT,'projects',file),'utf8'));

(async()=>{
 const server=await serve();
 // Always its own server: it must answer range requests, which python http.server does not.
 const url=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&!/fonts\.(googleapis|gstatic)/.test(r.url()))missing.push(r.status()+' '+r.url())});
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});

 // Episode 01: one row per shot, in order, with its line.
 const ep1=episode('zero-latency.frameforge.json');
 await page.waitForFunction(n=>document.querySelectorAll('#rows .row').length===n,ep1.shots.length,{timeout:20000});
 const lines=await page.locator('#rows .line').allTextContents();
 assert.deepEqual(lines,ep1.shots.map(s=>'“'+s.dialogue+'”'));

 // Clicking a row seeks the reel to that shot and marks it current.
 const ninth=ep1.shots.slice(0,8).reduce((a,s)=>a+s.duration,0);
 await page.locator('#rows .row').nth(8).click();
 await page.waitForFunction(()=>document.querySelectorAll('#rows .row')[8]?.getAttribute('aria-current')==='true',null,{timeout:10000});
 const seek=await page.evaluate(()=>({t:document.getElementById('reel').currentTime,current:[...document.querySelectorAll('#rows .row')].findIndex(r=>r.getAttribute('aria-current')==='true')}));
 assert.ok(Math.abs(seek.t-ninth)<.6,`reel seeks to shot 9 (${seek.t} vs ${ninth})`);
 assert.equal(seek.current,8);

 // The episode 02 tab swaps the reel and the sheet.
 const ep2=episode('dark-mode.frameforge.json');
 await page.locator('#tab-darkmode').click();
 await page.waitForFunction(n=>document.querySelectorAll('#rows .row').length===n,ep2.shots.length,{timeout:20000});
 assert.match(await page.locator('#reel').getAttribute('src'),/ep02-dark-mode\.(mp4|webm)$/);
 assert.equal(await page.locator('#tab-darkmode').getAttribute('aria-pressed'),'true');

 // Every call to action opens the studio.
 for(const href of await page.locator('a.btn.primary').evaluateAll(as=>as.map(a=>a.getAttribute('href'))))assert.equal(href,'studio.html');
 await page.waitForTimeout(500);
 assert.deepEqual(missing,[],'every page asset loads');
 assert.equal(errors.length,0,'page errors: '+errors.join('; '));
 await browser.close();server.close();
 console.log('LANDING_BROWSER_PASS: shot sheet from episode data, row seek, episode tabs, assets load');
})().catch(e=>{console.error('LANDING_BROWSER_FAILURE '+e.message);process.exit(1)});
