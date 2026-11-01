import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {validateVoiceRequest,createKokoroBridge,retimeForVoice,renderHybridAudio,
 resamplePCM,validateVoiceRights,sampledEnvelope,envelopeAt,HYBRID_AUDIO_RATE} from '../src/hybrid-voice.mjs';
const require=createRequire(import.meta.url);
const core=require('../src/hybrid-project-core.js');
const fs=require('node:fs');
const base=core.upgradeLegacyProject(JSON.parse(fs.readFileSync('projects/zero-latency.frameforge.json','utf8')));
base.shots=base.shots.slice(0,2);
base.audio={state:'storyboard_only',masterUrl:null};
assert.equal(HYBRID_AUDIO_RATE,48000);
assert.equal(validateVoiceRequest({text:'Hello!',voice:'af_bella'}).language,'en');
assert.throws(()=>validateVoiceRequest({text:'నమస్కారం',language:'te',voice:'af_bella'}),/does not support/);
assert.throws(()=>validateVoiceRequest({text:'नमस्ते',language:'hi',voice:'af_bella'}),/does not support/);
assert.throws(()=>validateVoiceRequest({text:'Hello',voice:'untrusted_model'}),/voice/);
assert.throws(()=>validateVoiceRights({source:'original-recording',consent:false}),/consent/);
assert.throws(()=>resamplePCM(new Float32Array([NaN]),48000));
const mock=[];
let worker;
const b=createKokoroBridge({timeoutMs:5000,createWorker:()=>{
  worker={onmessage:null,onerror:null,terminated:false,
   postMessage(data){mock.push(data);
     queueMicrotask(()=>worker.onmessage({data:{id:data.id,
       type:data.type,samples:new Float32Array(48000).fill(.11),
       rate:48000,seconds:1,voiceStart:.06,phonemes:'hɛlˌoʊ'}}))},
   terminate(){this.terminated=true}};
  return worker;
}});
const response=await b.speak({text:'Hello!',voice:'af_bella',speaker:'dev',language:'en'});
assert.equal(response.samples.length,40320,'worker line trimmed by 60 ms lead and 100 ms tail');assert.equal(response.source,'kokoro-local');
assert.equal(mock[0].type,'speak');assert.equal(mock[0].quality,'light');
assert.equal(mock[0].voice,'af_bella');
b.dispose();assert.equal(worker.terminated,true);
await assert.rejects(b.status(),/closed/);
const tone=(rate,seconds)=>Float32Array.from({length:Math.round(rate*seconds)},(_,i)=>.20*Math.sin(i/rate*440*Math.PI*2));
const p16=resamplePCM(tone(16000,.8),16000);
assert.ok(Math.abs(p16.length-38400)<=1);
const clips=new Map(base.shots.map((s,i)=>[s.id,{
  samples:tone(i?16000:48000,.8),sampleRate:i?16000:48000,seconds:.8,
  speaker:s.speaker,text:s.dialogue,rights:{source:'original-recording',consent:true}
}]));
const timed=retimeForVoice(base,clips);
assert.ok(timed.shots.every(s=>s.duration>=1.2&&s.duration<=1.35));
assert.equal(base.shots[0].duration>timed.shots[0].duration,true);
const mixed=renderHybridAudio(timed,clips,{music:false});
assert.ok(mixed.voice.some(v=>v!==0));
assert.equal(mixed.markers.length,2);
assert.equal(mixed.markers[0].speaker,base.shots[0].speaker);
assert.equal(mixed.left.length,mixed.right.length);
assert.ok(Number.isFinite(mixed.peakDb)&&Number.isFinite(mixed.lufs));
assert.ok(mixed.peakDb<0,'audio must stay below 0 dBFS');
assert.ok(envelopeAt(mixed.voice,.35)>.02);
const env=sampledEnvelope(mixed.voice);
assert.ok(env.length>=50);
assert.ok(env.some(v=>v>.02));
const bad=new Map(clips);bad.set(base.shots[0].id,{...bad.get(base.shots[0].id),speaker:'someone-else'});
assert.throws(()=>retimeForVoice(base,bad),/identity/);
const badRights=new Map(clips);badRights.set(base.shots[0].id,{...badRights.get(base.shots[0].id),rights:{source:'original-recording',consent:false}});
assert.throws(()=>renderHybridAudio(timed,badRights,{music:false}),/consent/);
assert.throws(()=>renderHybridAudio(timed,clips,{music:false,screenSounds:[{shotId:'bogus',cue:'whoosh',at:0}]}),/Unsafe screen/);
console.log('HYBRID_P6_AUDIO_PASS: worker transport, language fail-closed, consent, 16/48k resampling, two-actor timing, mastered stereo and speech envelope');