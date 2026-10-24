// Offline, frame-exact episode render: headless Chrome draws frame i at t = i/30, FFmpeg encodes
// H.264 1080x1920 and muxes the episode's mastered mix. Rendering speed never affects timing.
//   node tools/render-episode.mjs projects/zero-latency.frameforge.json
//   node tools/render-episode.mjs projects/zero-latency.frameforge.json --shots shot-01:shot-04 --out renders/review.mp4
// Options: --out FILE  --shots FIRST:LAST  --from S --to S  --width 1080 --height 1920  --quality 0.95
//          --chrome PATH (default: Playwright's Chromium; software WebGL keeps frames deterministic)
// Needs: npm install --no-save playwright@1.56.1 && npx playwright install chromium; ffmpeg on PATH.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const FPS=30,BATCH=6;
const argv=process.argv.slice(2),projectFile=argv[0];
const opt=(name,fallback)=>{const i=argv.indexOf('--'+name);return i>0?argv[i+1]:fallback};
if(!projectFile||projectFile.startsWith('--'))throw new Error('usage: node tools/render-episode.mjs <project.json> [options]');
const project=JSON.parse(fs.readFileSync(projectFile,'utf8'));
const width=Number(opt('width',project.output.width)),height=Number(opt('height',project.output.height));
const quality=Number(opt('quality',.95));
if(width%2||height%2)throw new Error('Width and height must be even for H.264');
if(project.audio.state!=='mastered')throw new Error('Run tools/build-audio.mjs first: this episode has no mastered audio');

// Segment: whole episode, a shot range, or explicit seconds.
const starts=[];let total=0;
for(const s of project.shots){starts.push(total);total+=s.duration}
let from=0,to=total;
const shots=opt('shots');
if(shots){
 const [a,b=a]=shots.split(':'),ia=project.shots.findIndex(s=>s.id===a),ib=project.shots.findIndex(s=>s.id===b);
 if(ia<0||ib<ia)throw new Error('Unknown shot range '+shots);
 from=starts[ia];to=starts[ib]+project.shots[ib].duration;
}
from=Number(opt('from',from));to=Math.min(total,Number(opt('to',to)));
const first=Math.round(from*FPS),frames=Math.round(to*FPS)-first;
if(frames<=0)throw new Error('Empty segment');
const out=path.resolve(opt('out',path.join(ROOT,'renders',`${project.id}-${width}x${height}${shots?'-'+shots.replace(':','-'):''}.mp4`)));
fs.mkdirSync(path.dirname(out),{recursive:true});

// Static server for the studio page and episode assets.
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.mp3':'audio/mpeg','.ogg':'audio/ogg','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.css':'text/css'};
const server=http.createServer((req,res)=>{
 const file=path.join(ROOT,decodeURIComponent(new URL(req.url,'http://x').pathname).replace(/\/$/,'/index.html'));
 if(!file.startsWith(ROOT)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end()}
 res.writeHead(200,{'content-type':TYPES[path.extname(file)]||'application/octet-stream'});
 fs.createReadStream(file).pipe(res);
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));

const browser=await chromium.launch({headless:true,executablePath:opt('chrome'),
 args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const ffmpeg=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y',
 '-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-',
 '-ss',from.toFixed(4),'-t',(frames/FPS).toFixed(4),'-i',path.join(ROOT,project.audio.masterUrl),
 '-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p',
 '-r',String(FPS),'-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart',out],{stdio:['pipe','inherit','inherit']});
const ffmpegDone=new Promise((ok,fail)=>ffmpeg.on('close',code=>code===0?ok():fail(new Error('ffmpeg exited '+code))));
const write=buf=>new Promise(ok=>ffmpeg.stdin.write(buf)?ok():ffmpeg.stdin.once('drain',ok));

const started=Date.now();
try{
 const page=await browser.newPage({viewport:{width:1100,height:900},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/studio.html`,{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.FrameForgeProjectsLoaded&&window.FrameForgeQA?.openProject,null,{timeout:90000});
 await page.evaluate(p=>FrameForgeQA.openProject(p),project);
 await page.waitForFunction(()=>FrameForgeQA.envelopeReady(),null,{timeout:60000});
 for(let i=0;i<frames;i+=BATCH){
  const batch=await page.evaluate(({start,count,width,height,quality,fps})=>{
   const out=[];for(let k=0;k<count;k++)out.push(FrameForgeQA.renderFrameJPEG((start+k)/fps,width,height,quality).slice(23));
   return out;
  },{start:first+i,count:Math.min(BATCH,frames-i),width,height,quality,fps:FPS});
  for(const b64 of batch)await write(Buffer.from(b64,'base64'));
  const done=Math.min(frames,i+BATCH),rate=done/((Date.now()-started)/1000);
  process.stdout.write(`\rframe ${done}/${frames}  ${rate.toFixed(1)} fps  eta ${Math.round((frames-done)/rate)} s   `);
 }
 if(errors.length)throw new Error('Page errors: '+errors.join('; '));
 ffmpeg.stdin.end();
 await ffmpegDone;
}finally{
 await browser.close();server.close();
}
const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_entries',
 'stream=codec_type,codec_name,width,height,r_frame_rate,nb_read_frames:format=duration,size','-of','json',out],{encoding:'utf8'}));
const v=probe.streams.find(s=>s.codec_type==='video');
if(Number(v.nb_read_frames)!==frames||v.width!==width||v.height!==height||v.r_frame_rate!=='30/1')
 throw new Error(`Output check failed: ${v.nb_read_frames} frames ${v.width}x${v.height} @ ${v.r_frame_rate}`);
console.log(`\n${out}\n${frames} frames, ${width}x${height} @ 30 fps, ${Number(probe.format.duration).toFixed(2)} s, `+
 `${(probe.format.size/1048576).toFixed(1)} MB, rendered in ${Math.round((Date.now()-started)/1000)} s`);
