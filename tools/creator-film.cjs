#!/usr/bin/env node
// Make a finished MP4 of a Creator (frameforge.project/2) project on this machine, for reviews and landing media:
// the real preview engine voices every line with the local Kokoro model (models/kokoro-82m-v1.0, else Hugging Face),
// draws every frame at its exact time, and ffmpeg encodes H.264 + AAC. Headless Chromium has no H.264 encoder on
// Linux, so this tool (not the browser) does the encoding; customers' exports still use the browser's WebCodecs.
//
//   node tools/creator-film.cjs <project.json | episode file> <out.mp4> [--size 720x1280] [--seconds N] [--timing-only]
//
// Next to the film it writes <out>.timing.json: each shot's id and voiced length (the landing page's shot sheet
// seeks with it). --timing-only voices the project and writes only that file.
//
// A V6 episode file (frameforge.project/1) is converted with fromEpisode() first.
const fs=require('fs'),path=require('path'),http=require('http'),{spawn}=require('child_process');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const args=process.argv.slice(2);
if(args.length<2){console.error('usage: creator-film.cjs <project.json> <out.mp4> [--size WxH] [--seconds N]');process.exit(2)}
const [projectPath,outPath]=args;
const opt=n=>{const i=args.indexOf(n);return i<0?null:args[i+1]};
const [W,H]=(opt('--size')||'720x1280').split('x').map(Number);
const limit=opt('--seconds')?Number(opt('--seconds')):Infinity;
const raw=JSON.parse(fs.readFileSync(projectPath,'utf8'));
let project=raw.format==='frameforge.creator/1'?raw.project:raw;
if(project.schema==='frameforge.project/1')project=require(path.join(root,'src/hybrid-editor-core.js')).fromEpisode(project);

const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json',
  '.wasm':'application/wasm','.onnx':'application/octet-stream','.bin':'application/octet-stream','.png':'image/png'};
const server=http.createServer((req,res)=>{
  const file=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));
  if(!file.startsWith(root)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end()}
  res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream',
    'cross-origin-opener-policy':'same-origin','cross-origin-embedder-policy':'require-corp'});
  fs.createReadStream(file).pipe(res);
});
(async()=>{
  const started=Date.now();
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:W,height:H}});
  page.on('pageerror',e=>console.error('page error:',e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/hybrid-preview.html`);
  await page.waitForFunction(()=>window.HybridP56Ready||window.HybridP56Error,null,{timeout:60000});
  await page.evaluate(([p,w,h])=>{if(window.HybridP56Error)throw Error(window.HybridP56Error);
    window.HybridP56QA.loadEditable(p);window.HybridP56QA.setOutputResolution(w,h)},[project,W,H]);
  console.log('voicing',project.shots.length,'lines…');
  const voiced=await page.evaluate(async()=>{const r=await window.HybridP56QA.generateEditableVoices();return {duration:r.duration}});
  const timing=await page.evaluate(()=>window.HybridP56QA.getEditableProject().shots.map(s=>({id:s.id,duration:s.duration})));
  fs.writeFileSync(outPath.replace(/\.mp4$/,'')+'.timing.json',JSON.stringify({seconds:voiced.duration,shots:timing},null,1)+'\n');
  if(args.includes('--timing-only')){console.log('timing written');await browser.close();server.close();return}
  const duration=Math.min(voiced.duration,limit),frames=Math.round(duration*30);
  const wav=path.join(path.dirname(path.resolve(outPath)),'.'+path.basename(outPath)+'.wav');
  fs.writeFileSync(wav,Buffer.from(await page.evaluate(()=>window.HybridP56QA.masterWav()),'base64'));
  console.log(`voiced in ${((Date.now()-started)/1000).toFixed(0)} s; drawing ${frames} frames at ${W}x${H}…`);
  const ff=spawn('ffmpeg',['-v','error','-y','-f','image2pipe','-framerate','30','-i','-','-i',wav,
    '-t',String(frames/30),'-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-r','30',
    '-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart',outPath],{stdio:['pipe','inherit','inherit']});
  for(let i=0;i<frames;i++){
    const b64=await page.evaluate(t=>{window.HybridP56QA.frameAt(t,false);
      return window.HybridP56QA.getSurface().toDataURL('image/jpeg',.93).split(',')[1]},i/30);
    if(!ff.stdin.write(Buffer.from(b64,'base64')))await new Promise(r=>ff.stdin.once('drain',r));
    if(i%150===0)console.log(`frame ${i}/${frames}`);
  }
  ff.stdin.end();
  await new Promise((ok,fail)=>ff.on('close',c=>c?fail(Error('ffmpeg exited '+c)):ok()));
  fs.unlinkSync(wav);
  console.log(JSON.stringify({out:outPath,seconds:+(frames/30).toFixed(3),frames,size:`${W}x${H}`,
    wallSeconds:Math.round((Date.now()-started)/1000)}));
  await browser.close();server.close();
})().catch(e=>{console.error('CREATOR_FILM_FAILURE',e.stack||e.message);process.exit(1)});
