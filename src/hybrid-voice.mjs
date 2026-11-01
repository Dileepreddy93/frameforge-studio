// P6: real PCM/Kokoro speech bridge and hybrid timeline mixer.
 // FrameForge's existing 48kHz Kokoro worker, sound effects, and -14 LUFS mix are
 // single sources of truth. Not a replacement TTS model. No unsupported-language
 // imitation, cloud account requirement, or implicit upload of recorded voices.
import {mixEpisode} from './episode-mix.mjs';
import {RATE,SFX} from './sound-kit.mjs';

const goodNum=(v,lo,hi)=>typeof v==='number'&&Number.isFinite(v)&&v>=lo&&v<=hi;
const clone=v=>JSON.parse(JSON.stringify(v));
const PACE=30,MAX_SECONDS=180;
const CLIPS=Object.freeze({maxVoiceSeconds:15,maxTotalSeconds:MAX_SECONDS,maxAssets:120});
const ENGLISH=/^en(?:-US|-GB)?$/i;
const VOICE=/^[ab][fm]_[a-z]+$/;
export function validateVoiceRequest({text,voice,emotion='neutral',language='en',speed=1}={}){
 if(typeof text!=='string'||!text.trim()||text.length>500)throw Error('Voice line is missing or longer than 500 characters');
 if(!ENGLISH.test(language))throw Error('Kokoro English model does not support '+language+
   '; select a separately verified Indic-language speech provider or import consented recordings');
 if(!VOICE.test(voice||''))throw Error('Unsupported Kokoro voice identifier');
 if(!['neutral','happy','sad','angry','surprised','worried','curious','idea'].includes(emotion))
   throw Error('Unknown voice emotion');
 if(!goodNum(speed,.7,1.4))throw RangeError('Voice speed must be .7–1.4');
 return {text,voice,emotion,speed,language};
}
export function createKokoroBridge({createWorker=()=>new Worker(new URL('./kokoro-worker.js',import.meta.url),{type:'module'}),
 timeoutMs=180000,quality='light'}={}){
 if(!['light','full'].includes(quality)||!Number.isInteger(timeoutMs)||timeoutMs<1000)
   throw Error('Invalid Kokoro configuration');
 let worker=null,closed=false,serial=0;
 const pending=new Map();
 const failAll=e=>{for(const [,p] of pending){clearTimeout(p.timeout);p.reject(e)}pending.clear()};
 const connect=()=>{
   if(closed)throw Error('Voice bridge is closed');
   if(worker)return worker;
   worker=createWorker();
   worker.onmessage=({data})=>{
     const p=pending.get(data.id);if(!p)return;
     clearTimeout(p.timeout);pending.delete(data.id);
     if(data.type==='error')p.reject(Error(data.message));
     else p.resolve(data);
   };
   worker.onerror=e=>failAll(Error('Kokoro worker failed: '+(e.message||'unknown error')));
   return worker;
 };
 const request=(type,args={})=>new Promise((resolve,reject)=>{
   const w=connect(),id=++serial;
   const timeout=setTimeout(()=>{
     pending.delete(id);reject(Error('Kokoro '+type+' exceeded timeout'));},timeoutMs);
   pending.set(id,{resolve,reject,timeout});
   try{w.postMessage({id,type,quality,...args})}catch(e){
     clearTimeout(timeout);pending.delete(id);reject(e);
   }
 });
 return Object.freeze({
   status:()=>request('status'),
   init:()=>request('init'),
   speak:async params=>{
     const a=validateVoiceRequest(params);
     const r=await request('speak',a);
     if(!(r.samples instanceof Float32Array)||r.rate!==RATE)
       throw Error('Kokoro returned unsupported or missing 48kHz PCM');
     if(!goodNum(r.seconds,.1,CLIPS.maxVoiceSeconds)||r.samples.length>RATE*CLIPS.maxVoiceSeconds||
        r.samples.some(x=>!Number.isFinite(x)))
       throw Error('Kokoro generated invalid audio');
     return {samples:r.samples,sampleRate:RATE,seconds:r.seconds,voiceStart:r.voiceStart||0,
       speaker:params.speaker,text:a.text,voice:a.voice,phonemes:r.phonemes||'',cached:Boolean(r.cached),
       language:a.language,source:'kokoro-local'};
   },
   dispose:()=>{closed=true;failAll(Error('Voice bridge disposed'));worker?.terminate?.();worker=null}
 });
}
export function resamplePCM(samples,sampleRate){
 if(!(samples instanceof Float32Array)||!goodNum(sampleRate,8000,96000))
   throw TypeError('Voice must be mono Float32Array at 8–96 kHz');
 if(!samples.length||samples.length>sampleRate*CLIPS.maxVoiceSeconds)
   throw RangeError('Voice file must contain between 0 and 15 seconds of decoded PCM');
 if(samples.some(x=>!Number.isFinite(x)))throw Error('Nonfinite imported speech sample');
 if(sampleRate===RATE)return new Float32Array(samples);
 const n=Math.ceil(samples.length*RATE/sampleRate),out=new Float32Array(n);
 for(let i=0;i<n;i++){const t=i*sampleRate/RATE,k=Math.floor(t),a=t-k;
   out[i]=samples[Math.min(k,samples.length-1)]*(1-a)+samples[Math.min(k+1,samples.length-1)]*a;
 }
 return out;
}
export function validateVoiceRights(meta){
 if(!meta||!['original-recording','licensed-voice','kokoro-local'].includes(meta.source)||
   meta.consent!==true)throw Error('Voice use requires a documented lawful source and speaker consent/licence');
 return meta;
}
export function retimeForVoice(project,lines){
 if(project?.schema!=='frameforge.project/2')throw Error('P6 requires v2 project');
 if(!(lines instanceof Map))throw TypeError('Voice lines must be keyed by shot id');
 const p=clone(project),known=new Set(p.shots.map(x=>x.id));
 if([...lines.keys()].some(id=>!known.has(id)))throw Error('Unknown voiced shot');
 let seconds=0;
 for(const s of p.shots){
   const a=lines.get(s.id);
   if(a){
     if(a.speaker!==s.speaker||a.text!==s.dialogue)throw Error('Voice identity or text mismatches shot '+s.id);
     if(!goodNum(a.seconds,.1,CLIPS.maxVoiceSeconds))throw Error('Invalid voice duration');
     const lead=s.timing?.lead??.15,tail=s.timing?.pauseAfter??.35;
     s.duration=Math.round((lead+a.seconds+tail)*PACE)/PACE;
     if(s.duration>15)throw Error('Voiced shot exceeds 15-second film safety limit');
   }
   seconds+=s.duration;
 }
 if(seconds>MAX_SECONDS)throw Error('Voiced project exceeds maximum film duration');
 return p;
}
export function renderHybridAudio(project,lines,{music=true,screenSounds=[]}={}){
 if(project?.schema!=='frameforge.project/2')throw Error('P6 audio requires a v2 project');
 if(!(lines instanceof Map)||lines.size>CLIPS.maxAssets)throw Error('Invalid voice lines');
 const duration=project.shots.reduce((x,s)=>x+s.duration,0);
 if(!goodNum(duration,.2,MAX_SECONDS))throw Error('Invalid film length');
 const voice=new Float32Array(Math.ceil(duration*RATE)),markers=[],shots=[];
 let cursor=0;
 for(const s of project.shots){
   const entry=lines.get(s.id),lead=s.timing?.lead??.15,pause=s.timing?.pauseAfter??.35;
   const shot={id:s.id,start:cursor,lead,seconds:entry?.seconds??Math.max(.1,s.duration-lead-pause),
     sfx:(s.sfx||[]).map(x=>({...x}))};
   if(entry){
     if(entry.speaker!==s.speaker||entry.text!==s.dialogue)
       throw Error('Voice metadata does not match actor and dialogue for '+s.id);
     validateVoiceRights(entry.rights);
     const pcm=resamplePCM(entry.samples,entry.sampleRate);
     if(!goodNum(entry.seconds,.1,15)||Math.abs(pcm.length/RATE-entry.seconds)>.08)
       throw Error('Speech duration does not match its waveform');
     const start=Math.round((cursor+lead)*RATE);
     const stop=start+pcm.length;
     if(stop>Math.round((cursor+s.duration-pause+.012)*RATE))
       throw Error('Voice audio overruns next shot. Re-time before mixing.');
     if(stop>voice.length)throw Error('Voice audio exceeds episode');
     voice.set(pcm,start);
     markers.push({shotId:s.id,speaker:s.speaker,start:cursor+lead,end:cursor+lead+pcm.length/RATE,
       seconds:pcm.length/RATE,phonemes:entry.phonemes||null,source:entry.rights.source});
   }
   shots.push(shot);cursor+=s.duration;
 }
 for(const e of screenSounds){
   if(!shots.some(x=>x.id===e.shotId)||!SFX.includes(e.cue)||!goodNum(e.at,0,15))
     throw Error('Unsafe screen sound cue');
   shots.find(x=>x.id===e.shotId).sfx.push({cue:e.cue,at:e.at,gain:-6});
 }
 const r=mixEpisode({voice,shots,music:music?project.audio?.music:null});
 if(!(r.left instanceof Float32Array)||r.left.length!==voice.length)
   throw Error('Invalid mastered mix result');
 return {voice,left:r.left,right:r.right,markers,rate:RATE,lufs:r.lufs,
   peakDb:r.peakDb,duration,effects:r.effects,music:r.music};
}
export function envelopeAt(voice,time,rate=20){
 if(!(voice instanceof Float32Array)||!goodNum(time,0,MAX_SECONDS)||!goodNum(rate,4,100))
   throw Error('Invalid speech envelope request');
 const span=Math.floor(RATE/rate),start=Math.round(time*RATE),a=Math.max(0,start-span/2|0),b=Math.min(voice.length,start+span/2);
 let sum=0;
 for(let i=a;i<b;i++)sum+=voice[i]*voice[i];
 return Math.min(1,Math.sqrt(sum/Math.max(1,b-a))*6);
}
export function sampledEnvelope(voice,rate=20){
 if(!(voice instanceof Float32Array)||!goodNum(rate,4,100))throw Error('Invalid envelope');
 const n=Math.ceil(voice.length/RATE*rate),samples=new Float32Array(n);
 for(let i=0;i<n;i++)samples[i]=envelopeAt(voice,i/rate,rate);
 return samples;
}
export function speechAt(project,time,master,core){
 if(!core||typeof core.evaluate!=='function')throw Error('FrameForgeSpeechCore is required');
 const f=(globalThis.FrameForgeHybridProjectCore?.timeAt||(()=>{throw Error('Hybrid core not loaded')}))(project,time);
 const line=master.markers.find(m=>m.shotId===f.shotId),active=!!line;
 const cue=core.evaluate({text:f.shot.dialogue,local:f.localTime,duration:f.shot.duration,
   shotStart:master.markers.find(m=>m.shotId===f.shotId)?.start??0,
   samples:master.envelope??sampledEnvelope(master.voice),rate:20,
   audioEnergy:envelopeAt(master.voice,time),speaker:f.speaker});
 return {...cue,speaker:active?f.speaker:null,shotId:f.shotId};
}
export const HYBRID_AUDIO_RATE=RATE;