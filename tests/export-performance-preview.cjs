/**
 * FrameForge V5.2 — portable deterministic motion-preview export.
 * Renders EXACT scene frames through the Three.js engine, encodes with FFmpeg.
 * Does not require Chromium WebCodecs or hardware H264 acceleration.
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');

const FPS=30,FRAMES=90,WIDTH=360,HEIGHT=640,START=31.9;
const AUDIO='https://agz0k9i7nymp3png.public.blob.vercel-storage.com/frameforge/zero-latency-stereo-foley-v2.ogg';
const output=path.resolve(process.env.FRAMEFORGE_PREVIEW_OUTPUT||'artifacts/v5-2-facial-motion-3s.mp4');
const requireBinary=name=>{
  try{execFileSync(name,['-version'],{stdio:'ignore'});}
  catch(e){throw new Error(name+' must be installed for portable CI video export');}
};
async function main(){
  requireBinary('ffmpeg');requireBinary('ffprobe');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'frameforge-v5-frames-'));
  let browser;
  const errors=[];
  try {
    browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle',
      '--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
    const page=await browser.newPage({viewport:{width:1000,height:830}});
    page.on('pageerror',err=>errors.push(err.message));
    const response=await page.goto(process.env.FRAMEFORGE_URL||'http://127.0.0.1:8959/',
      {waitUntil:'domcontentloaded',timeout:35000});
    assert.equal(response.status(),200);
    await page.waitForFunction(()=>window.FrameForgeQA?.envelopeReady() &&
      typeof window.FrameForgeQA.renderFilmFrame==='function' &&
      window.FrameForgePerformanceQA?.humanRig().upperLids===2,null,{timeout:45000});

    // Batches keep IPC traffic and browser memory bounded.
    let count=0;
    for(let offset=0;offset<FRAMES;offset+=10){
      const images=await page.evaluate(({offset,limit,start,fps,width,height})=>{
        const frames=[];
        for(let i=offset;i<Math.min(offset+limit,90);i++){
          const img=window.FrameForgeQA.renderFilmFrame(start+i/fps,width,height);
          if(!img.startsWith('data:image/jpeg;base64,'))throw new Error('Invalid frame '+i);
          frames.push(img.slice('data:image/jpeg;base64,'.length));
        }
        return frames;
      },{offset,limit:10,start:START,fps:FPS,width:WIDTH,height:HEIGHT});
      for(let i=0;i<images.length;i++){
        const bytes=Buffer.from(images[i],'base64');
        if(bytes.length<2000)throw new Error('Unexpectedly small source frame '+(offset+i));
        const dest=path.join(dir,'frame-'+String(offset+i).padStart(4,'0')+'.jpg');
        fs.writeFileSync(dest,bytes);
        count++;
      }
    }
    assert.equal(count,FRAMES);
    assert.deepEqual(errors,[],'The browser scene must render without JS errors');
    await browser.close();browser=null;

    // Fetch the previously-authored stereo voice + Foley master. Never fabricate sound.
    const audio=path.join(dir,'voice-master.ogg');
    execFileSync('curl',['--fail','--location','--retry','2','--silent','--show-error',
      '--max-time','45','--output',audio,AUDIO],{stdio:'pipe',timeout:60000});
    if(fs.statSync(audio).size<10000)throw new Error('Master soundtrack appears incomplete');
    fs.mkdirSync(path.dirname(output),{recursive:true});

    const args=['-hide_banner','-loglevel','error','-y','-framerate',String(FPS),
      '-i',path.join(dir,'frame-%04d.jpg'),'-ss',String(START),'-i',audio,
      '-map','0:v:0','-map','1:a:0','-frames:v',String(FRAMES),'-t',String(FRAMES/FPS),
      '-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p',
      '-c:a','aac','-b:a','160k','-ac','2','-ar','48000','-movflags','+faststart',output];
    execFileSync('ffmpeg',args,{stdio:'pipe',timeout:180000});
    execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',output,
      '-f','null','-'],{stdio:'pipe',timeout:60000});
    const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames',
      '-show_entries','format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,channels,nb_read_frames',
      '-of','json',output],{encoding:'utf8',timeout:30000}));
    const video=probe.streams.find(s=>s.codec_type==='video'),audioStream=probe.streams.find(s=>s.codec_type==='audio');
    assert.ok(video&&audioStream,'video and audio tracks required');
    assert.equal(video.codec_name,'h264');assert.equal(video.nb_read_frames,String(FRAMES));
    assert.equal(video.width,WIDTH);assert.equal(video.height,HEIGHT);
    assert.equal(audioStream.codec_name,'aac');assert.equal(audioStream.channels,2);
    assert.ok(+probe.format.duration>=2.98&&+probe.format.duration<=3.06);
    const sha256=crypto.createHash('sha256').update(fs.readFileSync(output)).digest('hex');
    console.log('V5_2_PORTABLE_MP4_PASS '+JSON.stringify({file:output,frames:FRAMES,
      duration:+probe.format.duration,bytes:+probe.format.size,sha256,audio:'stereo AAC',
      video:'H264 360x640 30FPS',browserErrors:errors.length}));
  } finally {
    if(browser)await browser.close().catch(()=>{});
    fs.rmSync(dir,{recursive:true,force:true});
  }
}
main().catch(e=>{console.error('V5_2_PORTABLE_MP4_FAIL',e.stack||e.message);process.exitCode=1});
