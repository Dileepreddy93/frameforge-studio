// Independent long-film release gate: the real original V2 Creator project,
// 10 new lines with real local Kokoro voices, 1080x1920/30fps browser-generated
// H264/AAC, no code-side frames/transcodes, full external ffmpeg decode.
// This is explicitly NOT an automatic 10/10 art or customer usability claim.
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const OUT=path.resolve(process.env.FRAMEFORGE_EXTENDED_OUT||'artifacts/hybrid-long-film');
const ROOT=process.env.FRAMEFORGE_URL||'http://127.0.0.1:8959/';
const SCENARIO=process.env.FRAMEFORGE_FILM_SCENARIO||'original';
assert.ok(['original','lantern'].includes(SCENARIO),'Unknown film scenario');
const ALTERNATE=SCENARIO==='lantern';
const ORIGINAL_LINES=[
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
// Independent second original episode; cast IDs and local voice profiles are
// explicitly cross-checked against the first delivered 35.7-second movie.
const LANTERN_LINES=[
 'The snow had swallowed every light around our little workshop.',
 'I could hear a tiny signal calling from beneath the ice.',
 'We followed it slowly, listening between each gust of wind.',
 'The old map showed a lantern, still blinking after midnight.',
 'I reached for the lantern, but its glow began to fade.',
 'Then I realized it needed a story, not another battery.',
 'We told it about the stars, the river, and the way home.',
 'One by one, the missing lights returned across the valley.',
 'The lantern was never lost. It had been waiting for us.',
 'And now the night could finally tell its own story.'
];
const LINES=ALTERNATE?LANTERN_LINES:ORIGINAL_LINES;
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
  const raw=await page.evaluate(async({lines,alternate})=>{
   const base=await(await fetch('/projects/zero-latency.frameforge.json')).json();
   const e=FrameForgeHybridEditor.createEditor(FrameForgeHybridEditor.fromLegacy(base));
   e.title(alternate?'The Lantern That Learned to Listen':'The Story We Made Together');
   e.logline(alternate?
     'Two friends trace a fading light through a snowy valley and give it a story.':
     'Two friends discover a self-contained creative studio in a living forest.');
   e.world(alternate?'snow':'forest',alternate?'night':'golden');
   e.soundtrack(alternate?'tension':'groove');
   for(let i=0;i<lines.length;i++){
     if(i>=2)e.addShot();
     const p=e.project,shot=p.shots[i].id;
     const screenInsert=alternate?(i===3||i===7):(i===5||i===8);
     const alternateCamera=['actor','two','wide','screen','prop',
       'prop','two','screen','actor','wide'][i];
     e.shot(shot,{speaker:i%2?'atlas':'luna',dialogue:lines[i],
       emotion:alternate?
         ['worried','curious','worried','surprised','sad','idea','happy','happy','curious','happy'][i]:
         ['curious','idea','happy','surprised','worried'][i%5],
       action:alternate?
         ['think','point','listen','press','plead','raise','explain','cheer','nod','wave'][i]:
         ['wave','explain','think','point','nod'][i%5],
       camera:alternate?([4,5].includes(i)?'actor':alternateCamera):screenInsert?'screen':i%3===2?'two':'actor',
       move:alternate?(screenInsert?'pull':i%2?'drift':'push'):i%2?'drift':'push',duration:4.5,
       caption:alternate?({0:'WHERE DID THE LIGHT GO?',7:'THE VALLEY WAKES',
         9:'THE NIGHT REMEMBERS'}[i]||''):i%3===0?'OUR STORY, MADE HERE':''});
     if(!screenInsert&&(alternate?![1,2,6,9].includes(i):i%3!==2)){
       // Different portrait distances for emotional reactions, with headroom.
       e.shot(shot,{cameraDistance:6.2,cameraFov:42});
     }
     if(alternate&&!screenInsert)e.shot(shot,{ambientScreen:'hide'});
     if(alternate&&!screenInsert&&i>=3){
       e.shot(shot,{visualProp:'lantern'});
       if([4,5].includes(i)){
         e.shot(shot,{camera:'prop'});
         e.shot(shot,{cameraDistance:i===4?4.4:3.8,cameraFov:i===4?38:34});
       }
       if(i===4)e.shot(shot,{propMode:'reach',propActor:'luna'});
       if(i===5)e.shot(shot,{propMode:'lift',propActor:'luna'});
       if([6,8,9].includes(i))e.shot(shot,{propMode:'carry',propActor:'luna'});
     }
     if(screenInsert){
       e.shot(shot,{screenKind:'terminal',
         screenTitle:alternate?(i===3?'BEACON SIGNAL':'VALLEY LIGHTS'):
           (i===5?'CONNECTION LOST':'EXPORT VERIFIED'),
         screenLines:alternate?(i===3?'Signal: weak\nMap: northern ridge':
           'Village lights: online\nSignal stable\nThe valley wakes'):
           (i===5?'Network offline\nLocal project safe':
           'H264 1080p ready\nStereo AAC mastered\nStory ready to share')});
     }
   }
   e.shotSound(e.project.shots[alternate?3:5].id,'buzz');
   e.shotSound(e.project.shots[7].id,'chime');
   if(alternate){
     // Author three listening/reaction beats; persist them in the original V2
     // project so the same cast can reopen and repeat the performance.
     const p=e.project;
     p.shots[1].reactions=[{actor:'luna',at:.9,emotion:'curious',action:'listen'}];
     p.shots[4].reactions=[{actor:'atlas',at:.8,emotion:'worried',action:'think'}];
     p.shots[8].reactions=[{actor:'atlas',at:.9,emotion:'happy',action:'nod'}];
     e.replace(p);
   }
   return e.serialize();
  },{lines:LINES,alternate:ALTERNATE});
  const episode=JSON.parse(raw).project;
  assert.equal(episode.shots.length,10);
  assert.equal(episode.hybrid.world.template,ALTERNATE?'snow':'forest');
  assert.equal(episode.shots.filter(s=>s.screen).length,2);
  assert.deepEqual(episode.characters.map(c=>[c.id,c.voice.profile]),
    [['luna','af_heart'],['atlas','am_michael']],
    'Both independently authored episodes must preserve the original character and voice locks');
  if(ALTERNATE){
    assert.equal(episode.shots.filter(s=>s.caption).length,3);
    assert.equal(episode.shots.filter(s=>s.reactions?.length).length,3);
    assert.ok(episode.shots.filter(s=>s.visualProp==='lantern').length>=4,
      'The narrated lantern must exist as a persisted, original 3D prop');
    assert.ok(episode.shots.some(s=>s.camera.kind==='wide'));
    assert.deepEqual([4,5,6].map(i=>episode.shots[i].propInteraction?.mode),['reach','lift','carry']);
    assert.equal(episode.shots[5].camera.kind,'prop');
    assert.equal(episode.shots.filter(s=>s.ambientScreen===false).length,8,
      'Eight scripted outdoor shots should not show the background workstation');
    assert.equal(episode.audio.music.cues[0].style,'tension');
  }
  fs.writeFileSync(path.join(OUT,'ten-shot-source.frameforge.json'),raw);
  await page.locator('#file').setInputFiles({name:'ten-shot-source.json',
    mimeType:'application/json',buffer:Buffer.from(raw)});
  await page.waitForFunction(()=>document.querySelectorAll('#shot-list li').length===10,
    null,{timeout:60000});
  assert.equal(await page.locator('#soundtrack').inputValue(),ALTERNATE?'tension':'groove');
  if(ALTERNATE){
    const spatial=await page.evaluate(()=>{
      const api=document.getElementById('engine').contentWindow.HybridP56QA;
      const project=api.getEditableProject();
      const at=(i,k=.7)=>project.shots.slice(0,i).reduce((n,s)=>n+s.duration,0)+project.shots[i].duration*k;
      return [4,5,6].map(i=>{
        const frame=api.frameAt(at(i,i===5?.85:.75),false);
        return {shot:i+1,mode:frame.propPose?.mode,position:frame.propPose?.position,
          gripError:frame.propPose?.gripError,cameraTarget:frame.camera?.target};
      });
    });
    assert.deepEqual(spatial.map(x=>x.mode),['reach','lift','carry']);
    assert.ok(spatial[0].gripError<=.05,
      'End-of-reach must touch lantern handle: '+JSON.stringify(spatial[0]));
    assert.ok(spatial[1].position[1]>spatial[0].position[1]+.25,
      'Lantern must rise physically in the authored lift shot: '+JSON.stringify(spatial));
    assert.ok(spatial[2].position[1]>.15,'Carried lantern must leave the ground');
    assert.ok(spatial.slice(1).every(x=>x.gripError<.04),
      'Lantern handle must stay attached to the rigged wrist in lift/carry shots');
    fs.writeFileSync(path.join(OUT,'authored-lantern-spatial-proof.json'),JSON.stringify(spatial,null,2));
  }
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
  let dl,performanceDownload;
  try{
    const performanceReport=page.waitForEvent('download',{
      predicate:d=>d.suggestedFilename().endsWith('-export-report.json'),timeout:3000000});
    const downloaded=page.waitForEvent('download',{
      predicate:d=>d.suggestedFilename().endsWith('.mp4'),timeout:3000000});
    const failure=page.waitForFunction(()=>
      document.getElementById('export-status')?.textContent?.startsWith('MP4 export unavailable'),
      null,{timeout:3000000,polling:1500}).then(async()=>{throw Error(await page.locator('#export-status').textContent())});
    await page.locator('#export').click();
    dl=await Promise.race([downloaded,failure]);
    performanceDownload=await performanceReport;
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
  const performancePath=path.join(OUT,'actual-export-performance.json');
  fs.copyFileSync(await performanceDownload.path(),performancePath);
  const browserReport=JSON.parse(fs.readFileSync(performancePath,'utf8'));
  assert.ok(browserReport.performance&&
    ['wallMs','renderMs','canvasTransferMs','encodeMs','finalizeMs'].every(k=>
      Number.isFinite(browserReport.performance[k])&&browserReport.performance[k]>=0),
    'Real completed export must measure rendering, copy and encoding costs');
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
  // Independent delivered-file examination: detect silent AAC, blank or
  // frozen frames, codec/container mismatch, and truncated full-film audio.
  const {verifyFilm}=require('../tools/verify-hybrid-delivery.cjs');
  const finalAudit=verifyFilm(movie);
  fs.writeFileSync(path.join(OUT,'independent-delivery-report.json'),JSON.stringify(finalAudit,null,2));
  assert.equal(finalAudit.verdict,'FRAMEFORGE_FULL_DELIVERY_VERIFIED');
  assert.equal(finalAudit.framesSampled,5);
  console.log('HYBRID_LONG_FILM_INDEPENDENT_SIGNAL_PASS '+JSON.stringify({
    frames:finalAudit.frames,seconds:finalAudit.seconds,
    audio:finalAudit.soundtrack,brightness:finalAudit.samples.map(f=>f.mean)
  }));
  const retimed=await page.evaluate(()=>{
    const p=document.getElementById('engine').contentWindow.HybridP56QA.getEditableProject();
    let t=0;return p.shots.map(s=>{const out={start:t,duration:s.duration,id:s.id,mode:s.propInteraction?.mode||'ground'};t+=s.duration;return out});
  });
  for(const [label,index] of (ALTERNATE?[['reach',4],['lift',5],['carry',6]]:[])){
    const shot=retimed[index],timestamp=shot.start+shot.duration*(label==='lift'?.84:.75);
    cp.execFileSync('ffmpeg',['-v','error','-y','-ss',timestamp.toFixed(3),
      '-i',movie,'-frames:v','1',path.join(OUT,'interaction-'+label+'.png')],
      {stdio:['ignore','pipe','pipe'],timeout:40000});
  }
  for(const [label,t] of [['first',.1],['middle',audio.duration/2],['last',audio.duration-.2]]){
    cp.execFileSync('ffmpeg',['-v','error','-y','-ss',t.toFixed(3),
      '-i',movie,'-frames:v','1',path.join(OUT,label+'.png')],
      {stdio:['ignore','pipe','pipe'],timeout:40000});
  }
  const report={verdict:'HYBRID_P7_30_TO_60_SECOND_WINDOWS_HD_PASS',
    scenario:SCENARIO,title:episode.title,world:episode.hybrid.world.template,
    identitySignature:episode.characters.map(c=>c.id+':'+c.voice.profile).join(','),
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