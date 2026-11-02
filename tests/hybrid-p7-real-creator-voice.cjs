// First-party Kokoro-82M real model -> NEW V2 Creator UI -> original speech
// loaded into Ember performance and export gating. Run in model voice job after
// actual q8/full speech so cache is available on same local origin.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),
 cp=require('node:child_process');
module.exports=async function testCreatorVoice(page,base,out,{width=360,requireCodec=false}={}){
 const errors=[];const onError=e=>errors.push(e.message);
 page.on('pageerror',onError);
 try{
  const response=await page.goto(base+'creator.html',{waitUntil:'domcontentloaded',timeout:90000});
  assert.equal(response.status(),200);
  await page.waitForFunction(()=>!document.getElementById('play').disabled||
     document.getElementById('status')?.textContent?.startsWith('Cannot open'),
    null,{timeout:100000});
  const initial=await page.locator('#status').textContent();
  assert.equal(await page.locator('#play').isEnabled(),true,'V2 Creator must render real WebGL before voicing: '+initial);
  assert.equal(await page.locator('#export').isEnabled(),false,'Unvoiced film is never presented as export-ready');
  await page.locator('#soundtrack').selectOption('groove');
  await page.locator('#shot-sound').selectOption('chime');
  await page.locator('#voice').click();
  await page.waitForFunction(()=>{
    const e=document.getElementById('voice-status');
    return e?.textContent.includes('Real English speech generated')||
      e?.textContent.includes('No speech was saved');
  },null,{timeout:requireCodec?360000:210000});
  const msg=await page.locator('#voice-status').textContent();
  assert.match(msg,/Real English speech generated for 2 shots/, 'Actual Kokoro model must speak the newly authored V2 film: '+msg);
  assert.equal(await page.locator('#export').isEnabled(),true,'Export allowed only for freshly voiced V2 project');
  const info=await page.evaluate(()=>{
    const api=document.getElementById('engine').contentWindow.HybridP56QA;
    const mix=api.getExportAudio();
    const p=api.getEditableProject();
    let peak=0;for(let i=0;i<mix.left.length;i+=137){
      peak=Math.max(peak,Math.abs(mix.left[i]),Math.abs(mix.right[i]));
    }
    return {schema:p.schema,shots:p.shots.map(s=>({speaker:s.speaker,text:s.dialogue,duration:s.duration})),
     duration:mix.duration,lufs:mix.lufs,peakDb:mix.peakDb,sourcePeak:peak,rate:mix.sampleRate,
     music:mix.music,effects:mix.effects};
  });
  assert.equal(info.schema,'frameforge.project/2');
  assert.equal(info.shots.length,2);
  assert.equal(info.rate,48000);assert.ok(info.sourcePeak>.01);
  assert.ok(Number.isFinite(info.lufs)&&info.peakDb<0);
  assert.equal(info.music,true,'Original procedural soundtrack must really be mixed into Creator audio');
  assert.ok(info.effects>=1,'Configured shot SFX must survive rendering and mastering');
  const playbackStartedAt=Date.now();
  await page.locator('#play').click();
  try{
    await page.waitForFunction(()=>Number(document.getElementById('scrub').value)>.2,
      null,{timeout:12000,polling:50});
  }catch(e){
    const state=await page.evaluate(()=>({time:document.getElementById('scrub').value,
       status:document.getElementById('status').textContent,
       playButton:document.getElementById('play').textContent,
       audioWarning:document.getElementById('voice-status').textContent}));
    throw Error('New Creator voiced playhead did not advance: '+JSON.stringify(state));
  }
  const playbackTo200ms=Date.now()-playbackStartedAt;
  if(await page.locator('#play').textContent()!=='Play')await page.locator('#play').click();
  await page.screenshot({path:path.join(out,'p7-actual-kokoro-creator.png'),fullPage:true});
  const browserCodec=await page.evaluate(async(width)=>{
    const m=await import('/vendor/mediabunny@1.62.1/mediabunny.mjs');
    return {h264:await m.canEncodeVideo('avc',{width,height:width*16/9}),
      aac:await m.canEncodeAudio('aac')};
  },width);
  if(requireCodec&&(!browserCodec.h264||!browserCodec.aac))
    throw Error('Windows customer release gate: native H264/AAC MP4 encoders unavailable '+JSON.stringify(browserCodec));
  let exportCheck='unsupported-encoder-fail-closed';
  await page.locator('#resolution').selectOption(String(width));
  await page.locator('#seconds').selectOption('2');
  if(browserCodec.h264&&browserCodec.aac){
    const downloaded=page.waitForEvent('download',{timeout:requireCodec?600000:120000});
    await page.locator('#export').click();
    const movie=await downloaded;
    const source=await movie.path(),dest=path.join(out,'p7-original-Kokoro-browser-native.mp4');
    fs.copyFileSync(source,dest);
    const probe=JSON.parse(cp.execFileSync('ffprobe',['-v','error','-count_frames',
     '-show_entries','stream=codec_name,codec_type,width,height,nb_read_frames:format=duration',
     '-of','json',dest],{encoding:'utf8',timeout:60000}));
    const v=probe.streams.find(s=>s.codec_type==='video'),a=probe.streams.find(s=>s.codec_type==='audio');
    assert.equal(v.codec_name,'h264');assert.equal(a.codec_name,'aac');
    assert.equal(v.width,width);assert.equal(v.height,width*16/9);
    assert.equal(Number(v.nb_read_frames),60);
    cp.execFileSync('ffmpeg',['-v','error','-xerror','-i',dest,'-f','null','-'],
     {stdio:['ignore','pipe','pipe'],timeout:150000});
    exportCheck='browser-native-mp4-full-decode';
  }else{
    await page.locator('#export').click();
    await page.waitForFunction(()=>document.getElementById('export-status')?.textContent?.startsWith('MP4 export unavailable'),
       null,{timeout:30000});
    assert.match(await page.locator('#export-status').textContent(),/H264|AAC/);
  }
  const result={status:'HYBRID_P7_REAL_ENGLISH_KOKORO_CREATOR_PASS',
    originalV2:true,newModelInferenceThroughCreator:true,actors:info.shots.map(s=>s.speaker),
    duration:info.duration,rate:info.rate,lufs:info.lufs,peakDb:info.peakDb,
    proceduralScore:info.music,authoredSoundEffects:info.effects,
    screenshot:true,playbackTo200ms,width,video:exportCheck,codecProbe:browserCodec,
    limits:['Linux Chromium may have no H264 encoder; unsupported codec is correctly rejected',
      'Browser model preload benefits from earlier real Kokoro source tests',
      'Native Telugu/Hindi TTS is not tested']};
  fs.writeFileSync(path.join(out,'p7-real-creator-report.json'),JSON.stringify(result,null,2));
  console.log('HYBRID_P7_REAL_ENGLISH_KOKORO_CREATOR_PASS '+JSON.stringify(result));
  assert.deepEqual(errors,[]);
  return result;
 }finally{page.off('pageerror',onError)}
};