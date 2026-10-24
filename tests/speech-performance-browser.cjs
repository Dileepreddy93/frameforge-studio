const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1100,height:850}});
 const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('requestfailed',r=>failed.push(r.url()));
 const resp=await page.goto(process.env.FRAMEFORGE_URL||'http://127.0.0.1:8968/',{waitUntil:'domcontentloaded',timeout:42000});
 assert.equal(resp.status(),200);
 await page.waitForFunction(()=>window.FrameForgeProjectsLoaded&&window.FrameForgeSpeechQA&&FrameForgeQA?.envelopeReady()&&window.FrameForgePerformanceQA,null,{timeout:65000});
 const result=await page.evaluate(()=>{
  const cues=[];for(let i=0;i<60;i++)cues.push(FrameForgeSpeechQA.at(15+i/20));
  const t=24.65,first=FrameForgeSpeechQA.at(t);
  FrameForgeQA.setTime(32.1);FrameForgeQA.setTime(t);
  return{version:FrameForgeSpeechQA.version,cues,first,second:FrameForgeSpeechQA.at(t),frame:FrameForgeQA.renderFilmFrame(t,360,640)};
 });
 assert.match(result.version,/v5\.3/);
 assert.equal(result.cues.length,60);
 assert.deepEqual(result.first,result.second,'seek consistency');
 assert.ok(result.cues.some(p=>p.confidence==='acoustic-guided-approximation'));
 assert.ok(result.cues.every(p=>p.mouthOpen>=0&&p.mouthOpen<=1));
 assert.match(result.frame,/^data:image\/jpeg;base64,/);

 // DEV's line in shot-12 ("You deleted the users?"), located from the episode data, not fixed seconds.
 const line=await page.evaluate(()=>{
  let start=0;for(const s of FrameForgeQA.shots()){if(s.id==='shot-12')break;start+=s.duration}
  const shot=FrameForgeQA.shots().find(s=>s.id==='shot-12'),project=FrameForgeQA.project('comedy').shots.find(s=>s.id==='shot-12');
  const from=start+project.timing.lead,to=from+project.voice.seconds,env=FrameForgeQA.envelope();
  let peak=from;for(let t=from;t<to;t+=.05)if(env[Math.floor(t*20)]>env[Math.floor(peak*20)])peak=t;
  return {start,duration:shot.duration,peak,quiet:to+.3};
 });
 const mouth=await page.evaluate(({peak:voicedTime,quiet:quietTime})=>{
  FrameForgeQA.setTime(voicedTime);
  const voiced={cue:FrameForgeSpeechQA.at(voicedTime),rig:FrameForgePerformanceQA.peek()};
  FrameForgeQA.setTime(quietTime);
  const quiet={cue:FrameForgeSpeechQA.at(quietTime),rig:FrameForgePerformanceQA.peek()};
  FrameForgeQA.setTime(voicedTime);
  return {voiced,quiet,rewind:FrameForgePerformanceQA.peek()};
 },line);
 assert.equal(mouth.voiced.cue.voiced,true,'DEV has a voiced line');
 assert.equal(mouth.quiet.cue.voiced,false,'DEV falls silent');
 assert.ok(mouth.voiced.rig.mouthScale>mouth.quiet.rig.mouthScale+.25,'Mouth closes between syllables');
 assert.deepEqual(mouth.voiced.rig,mouth.rewind,'Same timestamp restores identical facial mesh');
 const mouthWidths=await page.evaluate(({start,duration})=>{
   const frames=[];
   for(let i=0;i<Math.round(duration*30);i++){
     const t=start+i/30,cue=FrameForgeSpeechQA.at(t);
     FrameForgeQA.setTime(t);
     if(cue.voiced&&['round','wide'].includes(cue.viseme)){
       frames.push({viseme:cue.viseme,width:FrameForgePerformanceQA.peek().mouthWidth});
     }
   }
   return frames;
 },line);
 const round=mouthWidths.find(f=>f.viseme==='round');
 const wide=mouthWidths.find(f=>f.viseme==='wide');
 assert.ok(round&&wide,'the reference dialogue must contain both round and wide poses');
 assert.ok(wide.width>round.width+.30,'rendered human mouth width must follow viseme shapes');


 assert.deepEqual(errors,[]);
 assert.deepEqual(failed.filter(u=>/speech-performance|project-core|\.frameforge\.json/.test(u)),[]);
 console.log('V5_3_SPEECH_BROWSER_PASS '+JSON.stringify({version:result.version,samples:result.cues.length,deterministic:true,imageBytes:result.frame.length,mouthDuringSpeech:mouth.voiced.rig.mouthScale,mouthAtSilence:mouth.quiet.rig.mouthScale,seekStable:true,wideMouth:wide.width,roundedMouth:round.width,pageErrors:errors.length}));
 await browser.close();
})().catch(e=>{console.error('V5_3_SPEECH_BROWSER_FAIL '+e.stack);process.exit(1)});
