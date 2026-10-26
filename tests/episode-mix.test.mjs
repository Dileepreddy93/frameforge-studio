// Music and sound effects in the browser (M2.5): src/episode-mix.mjs mixes and masters an episode's soundtrack like
// tools/build-audio.mjs. Synthetic checks, then parity with the shipped Zero Latency master (needs ffmpeg).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {mixEpisode,duckGain,loudness,limit,LUFS,TRUE_PEAK} from '../src/episode-mix.mjs';
import {RATE} from '../src/sound-kit.mjs';

// Three "lines" of buzzy speech-like sound with silences between them.
function voiceTrack(shots,total){
 const x=new Float32Array(Math.round(total*RATE));
 for(const s of shots){const a=Math.round((s.start+s.lead)*RATE),n=Math.round(s.seconds*RATE);
  for(let i=0;i<n;i++){const t=i/RATE;x[a+i]=.3*Math.sin(2*Math.PI*140*t)*(.6+.4*Math.sin(2*Math.PI*4*t))*Math.min(1,i/480,(n-i)/480);}}
 return x;
}
const shots=[
 {id:'a',start:0,lead:.15,seconds:1.6,sfx:[{cue:'typing',at:0,gain:-4}]},
 {id:'b',start:2.2,lead:.15,seconds:1.4,sfx:[]},
 {id:'c',start:4.2,lead:.15,seconds:1.5,sfx:[{cue:'chime',at:1.8,gain:0}]}];
const total=6.4,voice=voiceTrack(shots,total);
const score={bpm:104,cues:[{shot:'a',style:'groove'},{shot:'c',style:'sting',at:'afterLine'},{shot:'gone',style:'tension'}]};
const rms=(c,from,to)=>{let s=0;const a=Math.round(from*RATE),b=Math.round(to*RATE);for(let i=a;i<b;i++)s+=c[i]*c[i];return Math.sqrt(s/(b-a));};
const dB=x=>20*Math.log10(x);

// 1. Mastered like the offline renders: -14 LUFS, peaks under the ceiling, stereo, deterministic.
const r=mixEpisode({voice,shots,music:score});
assert.equal(r.left.length,voice.length);assert.equal(r.right.length,voice.length);
assert.ok(Math.abs(r.lufs-LUFS)<.3,'loudness '+r.lufs.toFixed(2)+' LUFS');
assert.ok(r.peakDb<=TRUE_PEAK-.5+.01,'peak '+r.peakDb.toFixed(2)+' dBFS');
assert.equal(r.music,true);assert.equal(r.effects,2);
const again=mixEpisode({voice,shots,music:score});
assert.ok(again.left.every((v,i)=>v===r.left[i]),'the same episode mixes to the same samples');
assert.ok(r.left.some((v,i)=>Math.abs(v-r.right[i])>1e-3),'the music is in stereo');

// 2. Music plays in the pauses, and ducks under speech by about 8 dB.
const duck=duckGain(voice);
// An 8:1 compressor above 0.02: the music drops by 7/8 of how far the voice's RMS is over the threshold.
// On a steady tone: the detector (fast up, slow down, as ffmpeg's) sits near the tone's peak power.
const steady=Float32Array.from({length:RATE},(_,i)=>.2*Math.sin(2*Math.PI*140*i/RATE)),over=dB(.2/.02),ducked=dB(duckGain(steady)[RATE*.8]);
assert.ok(Math.abs(ducked+over*7/8)<1,'ducked '+ducked.toFixed(1)+' dB with the voice '+over.toFixed(1)+' dB over threshold');
assert.ok(dB(duck[Math.round(.9*RATE)])<-6,'the music ducks under a line');
assert.ok(dB(duck[Math.round(2.3*RATE)])-dB(duck[Math.round(1.75*RATE)])>3,'and comes back up in the pause after it (350 ms release)');

// 3. Sound effects land at their cue times; cues for missing shots are ignored; no score means no music.
const dry=mixEpisode({voice,shots:shots.map(s=>({...s,sfx:[]})),music:null});
assert.equal(dry.music,false);
const chimeAt=4.2+1.8;
assert.ok(rms(r.left,chimeAt,chimeAt+.3)>2*rms(dry.left,chimeAt,chimeAt+.3),'the chime plays at its cue');
assert.ok(rms(dry.left,1.85,2.1)<1e-4,'no music, no effects: silence between lines');
assert.ok(rms(r.left,1.85,2.1)>20*Math.max(1e-5,rms(dry.left,1.85,2.1)),'with the score, music plays between lines ('+rms(r.left,1.85,2.1).toFixed(4)+')');

// 4. The limiter holds a hard ceiling.
const loud=[Float32Array.from({length:RATE},(_,i)=>2*Math.sin(i/7))];
limit(loud,.5);assert.ok(Math.max(...loud[0].map(Math.abs))<=.5+1e-6,'limiter ceiling');
// BS.1770 reference: a 1 kHz sine at -20 dBFS peak on one channel reads -23.0 LUFS.
const sine=loudness([Float32Array.from({length:RATE*3},(_,i)=>.1*Math.sin(2*Math.PI*1000*i/RATE))]);
assert.ok(Math.abs(sine+23.01)<.2,'1 kHz reference reads '+sine.toFixed(2)+' LUFS');

// 5. Parity: Zero Latency's shipped voice track, mixed here, matches its ffmpeg-mastered mix.mp3.
let parity=null;
if(spawnSync('ffmpeg',['-version']).status===0){
 const p=JSON.parse(fs.readFileSync('projects/zero-latency.frameforge.json','utf8'));
 const pcm=(f,ch)=>{const b=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-i',f,'-ac',String(ch),'-ar',String(RATE),'-f','f32le','-'],{maxBuffer:1<<29}).stdout;return new Float32Array(b.buffer,b.byteOffset,b.length/4);};
 let clock=0;const placed=p.shots.map(s=>{const o={id:s.id,start:clock,lead:s.timing?.lead??.15,seconds:s.voice.seconds,sfx:s.sfx};clock=Math.round((clock+s.duration)*30)/30;return o;});
 const mix=mixEpisode({voice:pcm('audio/zero-latency/voice.mp3',1).slice(0,Math.round(clock*RATE)),shots:placed,music:p.audio.music});
 const ref=pcm('audio/zero-latency/mix.mp3',2);
 // The two MP3 encodes start a few samples apart: take the best alignment within 10 ms.
 let best={lag:0,c:-1};
 for(let lag=-480;lag<=480;lag++){let s=0,a=0,b=0;for(let i=RATE*2;i<RATE*8;i+=4){const x=mix.left[i],y=ref[2*(i+lag)];s+=x*y;a+=x*x;b+=y*y;}const c=s/Math.sqrt(a*b);if(c>best.c)best={lag,c};}
 const L=Float32Array.from({length:ref.length/2},(_,i)=>ref[2*i]),R=Float32Array.from({length:ref.length/2},(_,i)=>ref[2*i+1]);
 parity={correlation:+best.c.toFixed(3),lag:best.lag,browser:+mix.lufs.toFixed(2),offline:+loudness([L,R]).toFixed(2)};
 assert.ok(best.c>.93,'browser mix matches the offline master (correlation '+best.c.toFixed(3)+')');
 assert.ok(Math.abs(parity.browser-parity.offline)<.3,'same loudness as the offline master');
}else console.log('ffmpeg not found: offline parity not checked');

console.log('EPISODE_MIX_PASS',JSON.stringify({lufs:+r.lufs.toFixed(2),peakDb:+r.peakDb.toFixed(2),duckDb:+ducked.toFixed(1),voiceOverDb:+over.toFixed(1),parity}));
