#!/usr/bin/env node
// Render stills of a Creator (frameforge.project/2) project with the real preview engine, to look at the film
// without exporting it. Uses headless Chromium (Playwright) and a local static server.
//
//   node tools/creator-stills.cjs <project.json> <out-dir> [--per-shot] [--times 1.2,4.5] [--size 540x960] [--sheet]
//
// --per-shot (default): one still at the middle of every shot. --sheet: also a contact sheet (needs ffmpeg).
const fs=require('fs'),path=require('path'),http=require('http'),{execFileSync}=require('child_process');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const args=process.argv.slice(2);
if(args.length<2){console.error('usage: creator-stills.cjs <project.json> <out-dir> [--times a,b] [--size WxH] [--sheet]');process.exit(2)}
const [projectPath,outDir]=args;
const opt=n=>{const i=args.indexOf(n);return i<0?null:args[i+1]};
const [W,H]=(opt('--size')||'540x960').split('x').map(Number);
const times=opt('--times')?.split(',').map(Number);
const raw=JSON.parse(fs.readFileSync(projectPath,'utf8'));
const project=raw.format==='frameforge.creator/1'?raw.project:raw;   // a Creator save file wraps the project
fs.mkdirSync(outDir,{recursive:true});

const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json',
  '.wasm':'application/wasm','.png':'image/png','.jpg':'image/jpeg','.css':'text/css','.bin':'application/octet-stream'};
const server=http.createServer((req,res)=>{
  const file=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));
  if(!file.startsWith(root)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end()}
  res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const url=`http://127.0.0.1:${server.address().port}/hybrid-preview.html`;
  const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:W,height:H}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);
  await page.waitForFunction(()=>window.HybridP56Ready||window.HybridP56Error,null,{timeout:60000});
  const info=await page.evaluate(([p,w,h])=>{
    if(window.HybridP56Error)throw Error(window.HybridP56Error);
    const r=window.HybridP56QA.loadEditable(p);window.HybridP56QA.setOutputResolution(w,h);return r},[project,W,H]);
  let at=times;
  if(!at){let t=0;at=project.shots.map(s=>{const m=t+s.duration/2;t+=s.duration;return +m.toFixed(3)})}
  const files=[];
  for(const [i,t] of at.entries()){
    const f=await page.evaluate(t=>{const r=window.HybridP56QA.frameAt(t,true);
      return {image:r.image,shot:r.shot,draw:r.rendererStats.drawCalls,tri:r.rendererStats.triangles}},t);
    const name=path.join(outDir,`${String(i+1).padStart(2,'0')}-${f.shot}-${t}s.png`);
    fs.writeFileSync(name,Buffer.from(f.image.split(',')[1],'base64'));files.push(name);
    console.log(name,`draw=${f.draw} tri=${f.tri}`);
  }
  if(args.includes('--sheet')&&files.length){
    const cols=Math.min(files.length,5),rows=Math.ceil(files.length/cols);
    execFileSync('ffmpeg',['-v','error','-y',...files.flatMap(f=>['-i',f]),'-filter_complex',
      files.map((_,i)=>`[${i}:v]scale=270:480[s${i}]`).join(';')+';'+files.map((_,i)=>`[s${i}]`).join('')+
      `xstack=inputs=${files.length}:layout=`+files.map((_,i)=>`${(i%cols)*270}_${Math.floor(i/cols)*480}`).join('|')+
      (files.length<cols*rows?`:fill=black`:''),path.join(outDir,'sheet.jpg')]);
    console.log(path.join(outDir,'sheet.jpg'));
  }
  if(errors.length)console.error('page errors:',errors.join('; '));
  console.log(JSON.stringify({duration:info.duration,shots:info.shots,stills:files.length}));
  await browser.close();server.close();
})().catch(e=>{console.error('CREATOR_STILLS_FAILURE',e.message);process.exit(1)});
