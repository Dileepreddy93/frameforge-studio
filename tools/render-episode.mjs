// Offline, frame-exact episode render: headless Chrome draws frame i at t = i/30, FFmpeg encodes
// H.264 1080x1920 and muxes the episode's mastered mix. Rendering speed never affects timing.
//   node tools/render-episode.mjs projects/zero-latency.frameforge.json
//   node tools/render-episode.mjs projects/zero-latency.frameforge.json --shots shot-01:shot-04 --out renders/review.mp4
// Options: --out FILE  --shots FIRST:LAST  --from S --to S  --width 1080 --height 1920  --quality 0.95
//          --chrome PATH (default: Playwright's Chromium; software WebGL keeps frames deterministic)
//          --gpu  render on the GPU through the installed Chrome (Vulkan): much faster, but pixels can
//                 differ slightly from software rendering and between machines
// Needs: npm install --no-save playwright@1.56.1 && npx playwright install chromium; ffmpeg on PATH.
// Fails loudly (M5.6): any ffmpeg failure (missing, crashed, bad exit) ends the render with a non-zero exit code and
// leaves nothing at --out. Frames go to a temporary file beside it, which replaces --out only after the final check.
// FRAMEFORGE_CDN_MIRROR=<folder> serves the pinned CDN libraries from a local npm folder (tests/cdn-mirror.cjs).
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {spawn,execFileSync,spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
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
const partial=out.replace(/\.mp4$/i,'')+`.partial-${process.pid}.mp4`;
const fail=message=>{try{fs.rmSync(partial,{force:true})}catch{}console.error('render-episode: '+message);process.exit(1)};
{const v=spawnSync('ffmpeg',['-version'],{encoding:'utf8'});if(v.error||v.status!==0)fail('ffmpeg is not available ('+(v.error?.code||'exit '+v.status)+'): install ffmpeg and put it on PATH');}

// Static server for the studio page and episode assets.
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.mp3':'audio/mpeg','.ogg':'audio/ogg','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.css':'text/css'};
const server=http.createServer((req,res)=>{
 const file=path.join(ROOT,decodeURIComponent(new URL(req.url,'http://x').pathname).replace(/\/$/,'/index.html'));
 if(!file.startsWith(ROOT)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end()}
 res.writeHead(200,{'content-type':TYPES[path.extname(file)]||'application/octet-stream'});
 fs.createReadStream(file).pipe(res);
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));

const gpu=argv.includes('--gpu');
const browser=await chromium.launch({headless:true,executablePath:opt('chrome'),channel:gpu&&!opt('chrome')?'chrome':undefined,
 args:gpu?['--no-sandbox','--use-angle=vulkan','--enable-features=Vulkan','--ignore-gpu-blocklist','--disable-dev-shm-usage']
  :['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const ffmpeg=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y',
 '-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-',
 '-ss',from.toFixed(4),'-t',(frames/FPS).toFixed(4),'-i',path.join(ROOT,project.audio.masterUrl),
 '-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p',
 '-r',String(FPS),'-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart',partial],{stdio:['pipe','inherit','inherit']});
// ffmpeg can die at any point (bad input, full disk, killed): remember why, and stop feeding it frames.
let ffmpegError=null;
const ffmpegDone=new Promise(ok=>{
 ffmpeg.on('error',e=>{ffmpegError??=new Error('ffmpeg could not run: '+e.message);ok()});
 ffmpeg.on('close',(code,signal)=>{if(code!==0)ffmpegError??=new Error(`ffmpeg exited ${code??signal} before the render finished`);ok()});
});
ffmpeg.stdin.on('error',e=>{ffmpegError??=new Error('ffmpeg stopped reading frames ('+e.code+')')});
const write=buf=>new Promise((ok,no)=>{
 if(ffmpegError)return no(ffmpegError);
 const closed=()=>no(ffmpegError||new Error('ffmpeg closed its input'));
 if(ffmpeg.stdin.write(buf))return ok();
 ffmpeg.stdin.once('drain',()=>{ffmpeg.off('close',closed);ok()});ffmpeg.once('close',closed);
});

const started=Date.now();
try{
 const page=await browser.newPage({viewport:{width:1100,height:900},deviceScaleFactor:1});
 if(process.env.FRAMEFORGE_CDN_MIRROR)await createRequire(import.meta.url)('../tests/cdn-mirror.cjs').useCdnMirror(page);
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
 if(ffmpegError)throw ffmpegError;
}catch(e){
 if(ffmpeg.exitCode===null)ffmpeg.kill('SIGKILL');
 await browser.close().catch(()=>{});server.close();
 fail((e.message||String(e))+(ffmpegError&&e!==ffmpegError?' (ffmpeg: '+ffmpegError.message+')':''));
}
await browser.close();server.close();
let probe;
try{probe=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_entries',
 'stream=codec_type,codec_name,width,height,r_frame_rate,nb_read_frames:format=duration,size','-of','json',partial],{encoding:'utf8'}));}
catch(e){fail('the encoded file does not read back with ffprobe: '+e.message)}
const v=probe.streams?.find(s=>s.codec_type==='video');
if(!v||Number(v.nb_read_frames)!==frames||v.width!==width||v.height!==height||v.r_frame_rate!=='30/1'||!probe.streams.some(s=>s.codec_type==='audio'))
 fail(`output check failed: ${v?.nb_read_frames} frames ${v?.width}x${v?.height} @ ${v?.r_frame_rate}, expected ${frames} frames ${width}x${height} @ 30/1 with audio`);
fs.renameSync(partial,out);
console.log(`\n${out}\n${frames} frames, ${width}x${height} @ 30 fps, ${Number(probe.format.duration).toFixed(2)} s, `+
 `${(probe.format.size/1048576).toFixed(1)} MB, rendered in ${Math.round((Date.now()-started)/1000)} s`);
