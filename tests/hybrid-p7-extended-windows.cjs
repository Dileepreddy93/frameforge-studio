// Independent long-film release gate: the real original V2 Creator project,
// 10 new lines with real local Kokoro voices, 1080x1920/30fps browser-generated
// H264/AAC, no code-side frames/transcodes, full external ffmpeg decode.
// This is explicitly NOT an automatic 10/10 art or customer usability claim.
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const OUT=path.resolve(process.env.FRAMEFORGE_EXTENDED_OUT||'artifacts/hybrid-long-film');
const ROOT=process.env.FRAMEFORGE_URL||'http://127.0.0.1:8959/';
const LINES=[
 'Morning arrived, and our little studio had one big question.',
 'Could two unlikely friends make an entire movie from scratch?',
 'I drew our characters, then gave each a unique voice.',
 'And I built a forest where every scene could happen.',
 'The camera drifted closer as the music quietly began.',
 'Suddenly, the connection vanished, and the screen went dark.',
 'I thought all our careful work had disappeared forever.',
 'But our story was safe, because it lived right here.',
 'We heard the voices, checked the film, and pressed export.',
 'Then we smiled, already imagining the next great adventure.'
];
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const browser=await chromium.launch({channel:'chrome',headless:true});
 let context;
 try{
  context=await browser.newContext({acceptDownloads:true,viewport:{width:1400,height:950}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(ROOT+'creator.html',{waitUntil:'domcontentloaded',timeout:90000});
  assert.equal(response.status(),200);
  await page.waitForFunction(()=>document.getElementById('play').disabled===false,
    null,{timeout:100000});
  const raw=await page.evaluate(async(lines)=>{
   const base=await(await fetch('/projects/zero-latency.frameforge.json')).json();
   const e=FrameForgeHybridEditor.createEditor(FrameForgeHybridEditor.fromLegacy(base));
   e.title('The Story We Made Together');
   e.logline('Two friends discover a self-contained creative studio in a living forest.');
   e.world('forest','golden');
   e.soundtrack('groove');
   for(let i=0;i<lines.length;i++){
     if(i>=2)e.addShot();
     const p=e.project,shot=p.shots[i].id;
     e.shot(shot,{speaker:i%2?'atlas':'luna',dialogue:lines[i],
       emotion:['curious','idea','happy','surprised','worried'][i%5],
       action:['wave','explain','think','point','nod'][i%5],
       camera:i%3===2?'two':'actor',
       move:i%2?'drift':'push',duration:4.5,
       caption:i%3===0?'OUR STORY, MADE HERE':''});
   }
   e.shotSound(e.project.shots[5].id,'buzz');
   e.shotSound(e.project.shots[7].id,'chime');
   return e.serialize();
  },LINES);
  fs.writeFileSync(path.join(OUT,'ten-shot-source.frameforge.json'),raw);
  await page.locator('#file').setInputFiles({name:'ten-shot-source.json',
    mimeType:'application/json',buffer:Buffer.from(raw)});
  await page.waitForFunction(()=>document.querySelectorAll('#shot-list li').length===10,
    null,{timeout:60000});
  assert.equal(await page.locator('#soundtrack').inputValue(),'groove');
  assert.equal(await page.locator('#export').isEnabled(),false,'No stale speech can export');
  console.log('HYBRID_LONG_FILM_AUTHOR_PASS '+JSON.stringify({shots:LINES.length,bytes:raw.length}));
  await page.locator('#voice').click();
  await page.waitForFunction(()=>{
    const t=document.getElementById('voice-status')?.textContent||'';
    return t.startsWith('Real English speech generated')||t.startsWith('No speech was saved');
  },null,{timeout:600000,polling:3000});
  const voiceResult=await page.locator('#voice-status').textContent();
  assert.match(voiceResult,/Real English speech generated for 10 shots/,
    'All 10 original lines require real model inference: '+voiceResult);
  const audio=await page.evaluate(()=>{
    const api=document.getElementById('engine').contentWindow.HybridP56QA;
    const p=api.getEditableProject(),mix=api.getExportAudio();
    return {duration:p.shots.reduce((n,s)=>n+s.duration,0),shots:p.shots.length,
       voiceDuration:mix.duration,music:mix.music,effects:mix.effects,
       lufs:mix.lufs,peakDb:mix.peakDb,rate:mix.sampleRate};
  });
  assert.equal(audio.shots,10);assert.ok(audio.duration>=30&&audio.duration<=60,
    'The film must be a genuine complete 30-60s work, not 2s: '+JSON.stringify(audio));
  assert.equal(audio.music,true);assert.ok(audio.effects>=2);
  assert.equal(audio.rate,48000);
  assert.ok(Number.isFinite(audio.lufs)&&audio.peakDb<0);
  await page.locator('#resolution').selectOption('1080');
  await page.locator('#seconds').selectOption('full');
  const start=Date.now(),events=[];
  let previous='';
  const check=async()=>{
    try{
      const x=await page.evaluate(()=>({text:document.getElementById('export-status').textContent,
        progress:document.getElementById('progress').value}));
      if(x.text!==previous){previous=x.text;const record={timeSec:Math.round((Date.now()-start)/1000),...x};
        events.push(record);if(events.length>300)events.shift();
        if(events.length===1||events.length%20===0||x.progress===1)
          console.log('HYBRID_LONG_FILM_PROGRESS '+JSON.stringify(record));}
    }catch(e){console.warn('Export status unavailable: '+e.message)}
  };
  const tick=setInterval(()=>void check(),10000);
  let dl;
  try{
    const downloaded=page.waitForEvent('download',{timeout:3000000});
    const failure=page.waitForFunction(()=>
      document.getElementById('export-status')?.textContent?.startsWith('MP4 export unavailable'),
      null,{timeout:3000000,polling:1500}).then(async()=>{throw Error(await page.locator('#export-status').textContent())});
    await page.locator('#export').click();
    dl=await Promise.race([downloaded,failure]);
  }catch(e){
    await check();fs.writeFileSync(path.join(OUT,'failure-report.json'),JSON.stringify({
      error:e.message,audio,events,errors
    },null,2));
    try{await page.screenshot({path:path.join(OUT,'failure-screen.png'),fullPage:true})}catch{}
    throw Error('Full Creator export failed: '+e.message+'; last status: '+previous);
  }finally{clearInterval(tick)}
  assert.match(dl.suggestedFilename(),/\.mp4$/);
  const movie=path.join(OUT,'ten-shot-browser-native-1080x1920.mp4');
  fs.copyFileSync(await dl.path(),movie);
  const probe=JSON.parse(cp.execFileSync('ffprobe',['-v','error','-count_frames',
    '-show_entries','stream=codec_name,codec_type,width,height,r_frame_rate,nb_read_frames,sample_rate,channels:format=duration,size',
    '-of','json',movie],{encoding:'utf8',timeout:90000}));
  const v=probe.streams.find(x=>x.codec_type==='video'),
    a=probe.streams.find(x=>x.codec_type==='audio');
  assert.ok(v&&a);assert.equal(v.codec_name,'h264');assert.equal(a.codec_name,'aac');
  assert.equal(v.width,1080);assert.equal(v.height,1920);assert.equal(v.r_frame_rate,'30/1');
  const expected=Math.floor(audio.duration*30);
  assert.equal(Number(v.nb_read_frames),expected);
  assert.equal(a.sample_rate,'48000');assert.equal(a.channels,2);
  assert.ok(Number(probe.format.duration)>=audio.duration-.05);
  cp.execFileSync('ffmpeg',['-v','error','-xerror','-i',movie,'-f','null','-'],
    {stdio:['ignore','pipe','pipe'],timeout:400000});
  for(const [label,t] of [['first',.1],['middle',audio.duration/2],['last',audio.duration-.2]]){
    cp.execFileSync('ffmpeg',['-v','error','-y','-ss',t.toFixed(3),
      '-i',movie,'-frames:v','1',path.join(OUT,label+'.png')],
      {stdio:['ignore','pipe','pipe'],timeout:40000});
  }
  const report={verdict:'HYBRID_P7_30_TO_60_SECOND_WINDOWS_HD_PASS',
    filmDuration:audio.duration,shots:audio.shots,frames:expected,
    width:1080,height:1920,fps:30,fullDecode:true,codec:'H264+AAC',
    source:'original user-editable V2 project imported through real Creator UI',
    originalEnglishKokoro:true,scored:audio.music,effects:audio.effects,
    lufs:audio.lufs,peakDb:audio.peakDb,
    elapsedSeconds:Math.round((Date.now()-start)/1000),
    bytes:fs.statSync(movie).size,threeDecodedStills:true,
    limitations:['No human creative-quality rating','Not a real mobile-device hardware run',
      'Import/editor workflow tested; not 10-shot manual GUI authoring']};
  fs.writeFileSync(path.join(OUT,'verification.json'),JSON.stringify(report,null,2));
  assert.deepEqual(errors,[]);
  console.log('HYBRID_P7_30_TO_60_SECOND_WINDOWS_HD_PASS '+JSON.stringify(report));
 }finally{await context?.close();await browser.close()}
})().catch(e=>{console.error('HYBRID_P7_LONG_FILM_FAIL',e.stack||e);process.exitCode=1});