// MP4 export audio (M4.4): AAC where the browser encodes it, Opus where it doesn't. The LGPL AAC encoder
// (@mediabunny/aac-encoder) is never loaded.
//   python3 -m http.server 8959 & FRAMEFORGE_URL=http://127.0.0.1:8959/ node tests/export-codec-browser.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {chromium}=require('playwright');
const {useCdnMirror}=require('./cdn-mirror.cjs');

const URL_=process.env.FRAMEFORGE_URL||'http://127.0.0.1:8959/';
const probe=file=>{
 const r=spawnSync('ffprobe',['-v','error','-show_entries','stream=codec_type,codec_name,channels','-of','json',file],{encoding:'utf8'});
 if(r.error||r.status!==0)throw new Error('ffprobe is needed to check the exported MP4 ('+(r.error?.message||r.stderr.trim())+'): install ffmpeg');
 return JSON.parse(r.stdout).streams;
};

async function exportWith(browser,noAac){
 const context=await browser.newContext({viewport:{width:1100,height:850}});
 await useCdnMirror(context);
 // A browser without an AAC encoder: WebCodecs says no to every mp4a config.
 if(noAac)await context.addInitScript(()=>{const orig=AudioEncoder.isConfigSupported.bind(AudioEncoder);
  AudioEncoder.isConfigSupported=async c=>String(c.codec).startsWith('mp4a')?{supported:false,config:c}:orig(c);});
 const page=await context.newPage(),requests=[],errors=[];
 page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
 await page.goto(URL_+'studio.html',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.FrameForgeProjectsLoaded&&window.FrameForgeQA?.shots().length>0&&window.FrameForgeQA.envelopeReady(),null,{timeout:90000});
 const r=await page.evaluate(async()=>{const r=await FrameForgeMP4Test({frameLimit:45,width:360,height:640,download:false});
  const bytes=new Uint8Array(await r.blob.arrayBuffer());let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));
  const native=(await AudioEncoder.isConfigSupported({codec:'mp4a.40.2',sampleRate:48000,numberOfChannels:2,bitrate:128000})).supported;
  return {base64:btoa(s),audioCodec:r.audioCodec,native,status:document.getElementById('mp4Status').textContent};});
 const file=path.join(os.tmpdir(),`frameforge-export-${noAac?'opus':'aac'}-${process.pid}.mp4`);
 fs.writeFileSync(file,Buffer.from(r.base64,'base64'));
 const streams=probe(file);
 const rms=Number(spawnSync('ffmpeg',['-hide_banner','-i',file,'-map','0:a','-af','astats=measure_overall=RMS_level:measure_perchannel=none','-f','null','-'],{encoding:'utf8'}).stderr.match(/RMS level dB:\s*(-?[\d.]+)/)?.[1]);
 if(process.env.FRAMEFORGE_EXPORT_OUT)fs.copyFileSync(file,path.join(process.env.FRAMEFORGE_EXPORT_OUT,path.basename(file).replace(/-\d+\.mp4$/,'.mp4')));
 fs.rmSync(file);
 await context.close();
 return {...r,streams,rms,requests,errors};
}

(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.FRAMEFORGE_CHANNEL||'chrome',
  args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 try{
  // As the browser is: AAC where WebCodecs encodes it (Chrome on Windows and macOS), else Opus (e.g. Chrome on Linux).
  const aac=await exportWith(browser,false);
  assert.equal(aac.audioCodec,aac.native?'aac':'opus');
  assert.equal(aac.streams.find(s=>s.codec_type==='audio')?.codec_name,aac.audioCodec,'the file carries the codec the studio reports');
  const opus=await exportWith(browser,true);
  assert.equal(opus.audioCodec,'opus');
  const a=opus.streams.find(s=>s.codec_type==='audio');
  assert.equal(a?.codec_name,'opus','without AAC the MP4 carries Opus');
  assert.equal(a.channels,2,'stereo');
  assert.equal(opus.streams.find(s=>s.codec_type==='video')?.codec_name,'h264');
  assert.ok(opus.rms>-40,'the Opus track is not silent ('+opus.rms+' dB)');
  assert.match(opus.status,/Opus audio/,'the status says the audio is Opus');
  for(const run of [aac,opus]){
   assert.ok(!run.requests.some(u=>u.includes('aac-encoder')),'the LGPL AAC encoder is never requested');
   assert.deepEqual(run.errors,[],'no page errors');
  }
  console.log('EXPORT_CODEC_BROWSER_PASS',JSON.stringify({nativeAac:aac.native,asIs:aac.audioCodec,asIsRms:aac.rms,opusRms:opus.rms}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
