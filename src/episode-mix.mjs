// An episode's full soundtrack in the browser: the voice track, the shots' sound effects and the episode's music,
// mixed and mastered the way tools/build-audio.mjs does offline: music at -15 dB ducking about 8 dB under speech,
// effects at -9 dB, then -14 LUFS with a peak limiter below -1 dBTP. Music and effects come from src/sound-kit.mjs,
// the same code as our offline renders, so an edited episode keeps its score.
import {RATE,sfx,music} from './sound-kit.mjs';

export const LUFS=-14,TRUE_PEAK=-1.5;  // -1.5 leaves room for codec overshoot under the -1 dBTP limit
const db=x=>10**(x/20);

// shots: [{id,start,lead,seconds,sfx:[{cue,at,gain}]}], start = the shot's start on the episode clock.
// score: {bpm, cues:[{shot,style,at?}]} from project.audio.music. Cues for shots that are gone are dropped.
export function soundEffects(shots,length){
 const fx=new Float32Array(length);
 for(const s of shots)for(const cue of s.sfx??[]){
  const sound=sfx(cue.cue),gain=db(cue.gain??0),start=Math.round((s.start+cue.at)*RATE);
  for(let i=0;i<sound.length&&start+i<fx.length;i++)if(start+i>=0)fx[start+i]+=sound[i]*gain;
 }
 return fx;
}
export function score(shots,total,spec){
 const at=Object.fromEntries(shots.map(s=>[s.id,s]));
 const cues=(spec?.cues??[]).filter(c=>at[c.shot]).map(c=>{const p=at[c.shot];
  return {style:c.style,start:c.at==='afterLine'?p.start+p.lead+p.seconds+.1:p.start};}).sort((a,b)=>a.start-b.start);
 return cues.length?music(cues,total,spec?.bpm??104):null;
}

// The music's gain under the voice: ffmpeg's sidechaincompress as build-audio.mjs sets it (RMS detector,
// threshold 0.02, ratio 8, attack 15 ms, release 350 ms).
export function duckGain(voice){
 const attack=Math.exp(-1/(.015*RATE)),release=Math.exp(-1/(.35*RATE)),threshold=.02,ratio=8,gain=new Float32Array(voice.length);
 let power=0;
 for(let i=0;i<voice.length;i++){
  const p=voice[i]*voice[i];power=p>power?p+(power-p)*attack:p+(power-p)*release;
  const level=Math.sqrt(power);
  gain[i]=level>threshold?(threshold*(level/threshold)**(1/ratio))/level:1;
 }
 return gain;
}

// ITU-R BS.1770 integrated loudness of 48 kHz audio, any number of channels (K-weighting, 400 ms blocks, gating).
function biquad(x,b,a){
 const y=new Float32Array(x.length);let x1=0,x2=0,y1=0,y2=0;
 for(let i=0;i<x.length;i++){const v=b[0]*x[i]+b[1]*x1+b[2]*x2-a[0]*y1-a[1]*y2;x2=x1;x1=x[i];y2=y1;y1=v;y[i]=v;}
 return y;
}
export function loudness(channels){
 const k=channels.map(x=>biquad(biquad(x,[1.53512485958697,-2.69169618940638,1.19839281085285],[-1.69065929318241,.73248077421585]),
  [1,-2,1],[-1.99004745483398,.99007225036621]));
 const n=k[0].length,block=.4*RATE,hop=.1*RATE,powers=[],L=p=>-.691+10*Math.log10(p);
 for(let i=0;i+block<=n;i+=hop){let s=0;for(const c of k)for(let j=i;j<i+block;j++)s+=c[j]*c[j];powers.push(s/block);}
 if(!powers.length){let s=0;for(const c of k)for(const v of c)s+=v*v;powers.push(s/Math.max(1,n));}
 const mean=p=>p.reduce((a,b)=>a+b,0)/p.length;
 let gated=powers.filter(p=>L(p)>-70);if(!gated.length)return -70;
 const relative=L(mean(gated))-10;gated=gated.filter(p=>L(p)>relative);
 return L(mean(gated));
}
// Linked brickwall limiter: 2 ms look-ahead, 50 ms release (build-audio.mjs's alimiter settings).
export function limit(channels,ceiling){
 const n=channels[0].length,look=Math.round(.002*RATE),release=Math.exp(-1/(.05*RATE)),need=new Float32Array(n);
 for(let i=0;i<n;i++){let a=0;for(const c of channels)a=Math.max(a,Math.abs(c[i]));need[i]=a>ceiling?ceiling/a:1;}
 // The smallest gain needed over the next `look` samples, with a monotonic queue.
 const ahead=new Float32Array(n),queue=new Int32Array(n);let head=0,tail=0;
 for(let i=n-1;i>=0;i--){
  while(tail>head&&need[queue[tail-1]]>=need[i])tail--;
  queue[tail++]=i;
  while(queue[head]>i+look-1)head++;
  ahead[i]=need[queue[head]];
 }
 let gain=1;
 for(let i=0;i<n;i++){
  const target=ahead[i];gain=target<gain?target:target+(gain-target)*release;
  for(const c of channels)c[i]*=gain;
 }
 return channels;
}
function master(pre){
 const ceiling=db(TRUE_PEAK-.5),gained=g=>limit(pre.map(c=>{const y=new Float32Array(c.length),k=db(g);for(let i=0;i<c.length;i++)y[i]=c[i]*k;return y;}),ceiling);
 // Limiting lowers loudness a little, so measure once and add the shortfall back.
 let gain=LUFS-loudness(pre),out=gained(gain);
 gain+=LUFS-loudness(out);out=gained(gain);
 return out;
}

// voice: the placed mono voice track at 48 kHz. Returns the stereo master and what went into it.
export function mixEpisode({voice,shots,music:spec}){
 if(!voice.length)throw new Error('Nothing to mix');
 const total=voice.length/RATE,fx=soundEffects(shots,voice.length),bed=score(shots,total,spec),duck=bed?duckGain(voice):null;
 const pre=[0,1].map(ch=>{
  const out=new Float32Array(voice.length),m=bed?.[ch];
  for(let i=0;i<out.length;i++)out[i]=voice[i]+fx[i]*db(-9)+(m?m[i]*db(-15)*duck[i]:0);
  return out;
 });
 const [left,right]=master(pre);
 let peak=0;for(const c of [left,right])for(const v of c)peak=Math.max(peak,Math.abs(v));
 return {left,right,lufs:loudness([left,right]),peakDb:20*Math.log10(peak||1e-9),music:Boolean(bed),
  effects:shots.reduce((n,s)=>n+(s.sfx?.length??0),0)};
}
