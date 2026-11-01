// P6 end-to-end REAL Kokoro voices after existing V6 model tests have
// initialized the official first-party 82M worker in this browser context.
// synthesizeHybridProject gets actual newly synthesized speech, not a mock.
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');

module.exports=async function verifyHybridFreshSpeech(page,base,outputDir){
 await page.addScriptTag({url:base+'src/hybrid-project-core.js'});
 await page.addScriptTag({url:base+'src/hybrid-direction.js'});
 const result=await page.evaluate(async()=>{
   const {synthesizeHybridProject}=await import('/src/hybrid-voice.mjs');
   const old=await(await fetch('/projects/zero-latency.frameforge.json')).json();
   const core=window.FrameForgeHybridProjectCore, director=window.FrameForgeHybridDirector;
   const p=core.upgradeLegacyProject(old);
   p.id='fresh-kokoro-hybrid';
   p.title='The Real Voice Test';
   p.logline='New original lines, new performance, generated locally in the browser.';
   p.characters=[
     {id:'luna',name:'Luna',visualIdentity:'Original Ember human performer',
       voice:{profile:'af_heart',voiceLock:'Consistent original Kokoro voice',kokoro:{voice:'af_heart'}},
       expressions:['neutral','happy','sad','surprised','worried'],sheetStatus:'draft'},
     {id:'atlas',name:'Atlas',visualIdentity:'Original Ember robot performer',
       voice:{profile:'am_michael',voiceLock:'Consistent original Kokoro voice',kokoro:{voice:'am_michael'}},
       expressions:['neutral','happy','sad','surprised','worried'],sheetStatus:'draft'}
   ];
   p.hybrid.cast={
      luna:{provider:'procedural',template:'human'},
      atlas:{provider:'procedural',template:'robot'}
   };
   p.hybrid.world={provider:'procedural',template:'meadow',time:'golden',foliage:.07,particles:['dust']};
   p.shots=[
     {id:'shot-01',speaker:'luna',dialogue:'Our studio makes a new story right here.',
      duration:3.4,camera:{kind:'actor',target:'luna'},intent:'introduction',
      caption:'A NEW STORY',firstFrameStatus:'draft',
      cast:{luna:{emotion:'happy',action:'wave'}},timing:{lead:.15,pauseAfter:.35},
      direction:{move:'push',transition:'cut',blendSeconds:0}},
     {id:'shot-02',speaker:'atlas',dialogue:'And these words are spoken for the first time.',
      duration:3.7,camera:{kind:'two',target:'atlas',secondary:'luna'},intent:'proof',
      caption:'REAL LOCAL VOICES',firstFrameStatus:'draft',
      cast:{atlas:{emotion:'curious',action:'point'}},timing:{lead:.15,pauseAfter:.35},
      direction:{move:'orbit',transition:'blend',blendSeconds:.35},
      screen:{kind:'terminal',tone:'success',title:'RENDER COMPLETE',
       lines:['> studio render --local','** Original voice ready']}
     }
   ];
   p.audio={state:'storyboard_only',masterUrl:null,music:{bpm:104,
     cues:[{shot:'shot-01',style:'groove'},{shot:'shot-02',style:'sting',at:'afterLine'}]}};
   if(!core.validateProject(p).valid)throw Error('V2 speech project schema failed');
   director.verify(p);
   let modelCalls=0;
   const bridge={speak:async(params)=>{
     modelCalls++;
     // Existing FrameForge V6 browser QA uses the *real* Kokoro worker,
     // already initialized in voice-model-browser.cjs. No synthetic waveform.
     const r=await window.FrameForgeVoiceQA.speakWav(params.text,params.voice,
       params.emotion==='curious'?'thinking':params.emotion==='idea'?'happy':params.emotion);
     const binary=Uint8Array.from(atob(r.wav),c=>c.charCodeAt(0));
     const ctx=new AudioContext({sampleRate:48000});
     let decoded;
     try{decoded=await ctx.decodeAudioData(binary.buffer)}finally{await ctx.close()}
     if(decoded.sampleRate!==48000||decoded.numberOfChannels<1)
       throw Error('Kokoro WAV decode returned unsupported rate/channels');
     const raw=decoded.getChannelData(0);
     const lead=Math.round(.06*48000),tail=Math.round(.1*48000);
     if(raw.length<lead+tail+4800)throw Error('Kokoro voice too short');
     const samples=raw.slice(lead,raw.length-tail);
     return {samples,sampleRate:48000,seconds:samples.length/48000,
       speaker:params.speaker,text:params.text,voice:params.voice,
       phonemes:null,source:'kokoro-local',language:'en'};
   }};
   const out=await synthesizeHybridProject(p,{bridge,music:true});
   if(modelCalls!==2||out.mix.markers.length!==2||out.project.shots.length!==2)
     throw Error('Real two-speaker V2 pipeline did not finish');
   if(out.mix.peakDb>=0||!Number.isFinite(out.mix.lufs)||
     out.mix.left.every(v=>Math.abs(v)<.00001))
     throw Error('Fresh V2 audio is clipped or silent');
   const wav=(channels)=>{
     const n=channels[0].length,bytes=new ArrayBuffer(44+n*2*channels.length);
     const view=new DataView(bytes),u=new Uint8Array(bytes);
     const write=(off,t)=>{for(let i=0;i<t.length;i++)u[off+i]=t.charCodeAt(i)};
     write(0,'RIFF');view.setUint32(4,36+n*2*channels.length,true);
     write(8,'WAVE');write(12,'fmt ');view.setUint32(16,16,true);
     view.setUint16(20,1,true);view.setUint16(22,channels.length,true);
     view.setUint32(24,48000,true);view.setUint32(28,48000*channels.length*2,true);
     view.setUint16(32,channels.length*2,true);view.setUint16(34,16,true);
     write(36,'data');view.setUint32(40,n*2*channels.length,true);
     for(let i=0;i<n;i++)for(let ch=0;ch<channels.length;ch++){
       const v=Math.max(-1,Math.min(1,channels[ch][i]));
       view.setInt16(44+2*(i*channels.length+ch),Math.round(v*32767),true);
     }
     let result='';for(let i=0;i<u.length;i+=16384)
       result+=String.fromCharCode(...u.subarray(i,i+16384));
     return btoa(result);
   };
   const report={
     generator:'actual FrameForge Kokoro-82M browser worker via speakWav; two new original English lines',
     speeches:modelCalls,voices:['af_heart','am_michael'],newEnglishText:out.project.shots.map(s=>s.dialogue),
     projectSchema:out.project.schema,speakerIds:out.mix.markers.map(m=>m.speaker),
     duration:out.mix.duration,lufs:out.mix.lufs,peakDb:out.mix.peakDb,
     phonemeForcedAlignment:false,language:'en',multilingualTested:false,
     editorIntegrated:false,rawModelInference:true
   };
   return {voice:wav([out.mix.voice]),master:wav([out.mix.left,out.mix.right]),
     project:out.project,markers:out.mix.markers,report};
 });
 fs.mkdirSync(outputDir,{recursive:true});
 const prefix=path.join(outputDir,'fresh-v2-kokoro');
 fs.writeFileSync(prefix+'-voice.wav',Buffer.from(result.voice,'base64'));
 fs.writeFileSync(prefix+'-master.wav',Buffer.from(result.master,'base64'));
 fs.writeFileSync(prefix+'.json',JSON.stringify({
  project:result.project,markers:result.markers,report:result.report
 },null,2));
 assert.equal(result.report.speeches,2);
 assert.equal(result.report.projectSchema,'frameforge.project/2');
 assert.ok(result.report.peakDb<0);
 assert.equal(result.markers.length,2);
 console.log('HYBRID_P6_REAL_KOKORO_V2_PASS '+JSON.stringify(result.report));
 return result.report;
};