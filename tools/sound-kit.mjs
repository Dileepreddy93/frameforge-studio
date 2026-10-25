// Original, deterministic music and sound effects synthesised in code (no samples, no AI).
// Every function returns Float32Array audio at RATE; randomness uses a fixed seed.
export const RATE=48000;
export const SFX=['typing','chime','buzz','zap','scratch','whoosh','pop'];
export const MUSIC_STYLES=['groove','tension','stop','sting'];

const TAU=Math.PI*2;
const hz=midi=>440*2**((midi-69)/12);
const db=x=>10**(x/20);
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

// --- small building blocks -------------------------------------------------------------
function env(n,attack,release,hold=0){
 const out=new Float32Array(n),a=Math.max(1,attack*RATE),h=hold*RATE;
 for(let i=0;i<n;i++)out[i]=i<a?i/a:i<a+h?1:Math.exp(-(i-a-h)/(release*RATE));
 return out;
}
function lowpass(x,cutoff){
 const k=1-Math.exp(-TAU*cutoff/RATE);let y=0;
 for(let i=0;i<x.length;i++){y+=k*(x[i]-y);x[i]=y}
 return x;
}
function highpass(x,cutoff){
 const k=1-Math.exp(-TAU*cutoff/RATE);let low=0;
 for(let i=0;i<x.length;i++){low+=k*(x[i]-low);x[i]-=low}
 return x;
}
function add(into,src,at,gain=1){
 const start=Math.round(at*RATE);
 for(let i=0;i<src.length&&start+i<into.length;i++)if(start+i>=0)into[start+i]+=src[i]*gain;
}
// Karplus-Strong plucked string: a warm, ukulele-like chord voice.
function pluck(freq,seconds,random,bright=.5){
 const n=Math.round(seconds*RATE),period=Math.max(2,Math.round(RATE/freq)),buf=new Float32Array(period),out=new Float32Array(n);
 for(let i=0;i<period;i++)buf[i]=random()*2-1;
 let idx=0;const damp=.996-.004*(1-bright);
 for(let i=0;i<n;i++){const next=(idx+1)%period;const v=buf[idx];buf[idx]=damp*.5*(v+buf[next]);out[i]=v;idx=next}
 return lowpass(out,2200+3000*bright);
}
function tone(freq,seconds,{shape='sine',attack=.005,release=.2,hold=0,vibrato=0,glideTo=null}={}){
 const n=Math.round(seconds*RATE),out=new Float32Array(n),e=env(n,attack,release,hold);let phase=0;
 for(let i=0;i<n;i++){
  const p=i/n,f=(glideTo?freq*(glideTo/freq)**p:freq)*(1+vibrato*Math.sin(TAU*5.5*i/RATE));
  phase=(phase+f/RATE)%1;
  const s=shape==='sine'?Math.sin(TAU*phase):shape==='saw'?2*phase-1:shape==='square'?(phase<.5?1:-1):1-4*Math.abs(phase-.5);
  out[i]=s*e[i];
 }
 return out;
}
function noise(seconds,random){const out=new Float32Array(Math.round(seconds*RATE));for(let i=0;i<out.length;i++)out[i]=random()*2-1;return out}

// --- sound effects ---------------------------------------------------------------------
export function sfx(name,seed=7){
 const random=rng(seed);
 if(name==='typing'){
  const out=new Float32Array(Math.round(1.6*RATE));let t=0;
  while(t<1.5){const click=highpass(noise(.018,random),1800);const e=env(click.length,.0005,.004);for(let i=0;i<click.length;i++)click[i]*=e[i];add(out,click,t,.5+.4*random());t+=.07+.09*random()}
  return out;
 }
 if(name==='chime'){
  const out=new Float32Array(Math.round(1.2*RATE));
  add(out,tone(hz(88),1.1,{release:.35}),0,.5);add(out,tone(hz(95),1.0,{release:.4}),.09,.45);add(out,tone(hz(100),1.0,{release:.45}),.09,.15);
  return out;
 }
 if(name==='buzz'){
  const b=tone(110,.45,{shape:'square',attack:.01,release:.08,hold:.3});
  for(let i=0;i<b.length;i++)b[i]*=.6+.4*Math.sin(TAU*18*i/RATE);
  const out=lowpass(b,1400);add(out,lowpass(tone(116,.45,{shape:'square',attack:.01,release:.08,hold:.3}),1400),0,.5);return out;
 }
 if(name==='zap'){
  const out=tone(1400,.38,{shape:'triangle',release:.12,hold:.18,glideTo:70});
  const n=lowpass(noise(.38,random),3000),e=env(n.length,.002,.07);
  for(let i=0;i<n.length;i++)out[i]+=n[i]*e[i]*.25;
  return out;
 }
 if(name==='scratch'){
  // Noise through a resonant band that sweeps up then down, like a hand stopping a record.
  const n=noise(.42,random),out=new Float32Array(n.length);let low=0,band=0;
  for(let i=0;i<n.length;i++){const p=i/n.length,f=p<.35?300+2600*p/.35:2900-2500*(p-.35)/.65;const k=2*Math.sin(Math.PI*f/RATE);low+=k*band;const high=n[i]-low-.25*band;band+=k*high;out[i]=band*Math.min(1,(1-p)*3)}
  return out;
 }
 if(name==='whoosh'){
  const n=noise(.5,random),out=new Float32Array(n.length);let low=0,band=0;
  for(let i=0;i<n.length;i++){const p=i/n.length,f=400+3200*Math.sin(Math.PI*p);const k=2*Math.sin(Math.PI*f/RATE);low+=k*band;const high=n[i]-low-.6*band;band+=k*high;out[i]=band*Math.sin(Math.PI*p)*.6}
  return out;
 }
 if(name==='pop')return tone(620,.12,{release:.04,glideTo:980});
 throw new Error('Unknown sound effect: '+name);
}

// --- music ------------------------------------------------------------------------------
// Chords as MIDI notes; groove is I-vi-IV-V in C, tension is vi-IV-ii-III.
const GROOVE=[[60,64,67],[57,60,64],[53,57,60],[55,59,62]];
const TENSION=[[57,60,64],[53,57,60],[50,53,57],[52,56,59]];

function bars(style,seconds,bpm,random){
 const beat=60/bpm,bar=beat*4,left=new Float32Array(Math.round(seconds*RATE)),right=new Float32Array(left.length);
 const progression=style==='groove'?GROOVE:TENSION;
 for(let b=0;b*bar<seconds;b++){
  const chord=progression[b%4],t0=b*bar;
  // Bass: root on beats 1 and 3 (groove) or a held root (tension).
  const bassNotes=style==='groove'?[[0,beat*1.6],[2*beat,beat*1.6]]:[[0,bar]];
  for(const [at,len] of bassNotes)add(left,lowpass(tone(hz(chord[0]-24),len,{shape:'triangle',release:len*.6}),500),t0+at,.55),add(right,lowpass(tone(hz(chord[0]-24),len,{shape:'triangle',release:len*.6}),500),t0+at,.55);
  if(style==='groove'){
   // Syncopated plucked chords, slightly strummed and panned.
   for(const at of [0,1.5,2.5,3.5])chord.forEach((m,i)=>{const p=pluck(hz(m+12),beat*1.4,random,.45);add(left,p,t0+at*beat+i*.012,.22*(1-i*.15));add(right,p,t0+at*beat+i*.012,.22*(.7+i*.15))});
   // Kick on 1 and 3, soft hat on the off-beats.
   for(const at of [0,2])add(left,tone(110,.25,{release:.08,glideTo:45}),t0+at*beat,.5),add(right,tone(110,.25,{release:.08,glideTo:45}),t0+at*beat,.5);
   for(let h=0;h<4;h++){const hat=highpass(noise(.05,random),7000),e=env(hat.length,.001,.012);for(let i=0;i<hat.length;i++)hat[i]*=e[i];add(left,hat,t0+(h+.5)*beat,.16);add(right,hat,t0+(h+.5)*beat,.2)}
  }else{
   // Low sustained pad and a ticking clock: something is about to go wrong.
   chord.forEach((m,i)=>{const pad=lowpass(tone(hz(m),bar,{shape:'saw',attack:.4,release:bar*.5,hold:bar*.3,vibrato:.002}),900);add(left,pad,t0,.07);add(right,pad,t0+.011*i,.07)});
   for(let q=0;q<4;q++){const tick=highpass(tone(2600,.03,{release:.006}),1500);add(left,tick,t0+q*beat,.12);add(right,tick,t0+q*beat,.12)}
  }
 }
 return [left,right];
}

// Descending "wah-wah" brass sting for the final punchline.
function sting(){
 const notes=[70,69,68,67],out=new Float32Array(Math.round(2.6*RATE));
 notes.forEach((m,i)=>{const last=i===notes.length-1,len=last?1.3:.42;const brass=lowpass(tone(hz(m-12),len,{shape:'saw',attack:.03,release:last?.5:.12,hold:last?.6:.22,vibrato:last?.012:.004}),1200);add(out,brass,i*.45,.5)});
 return out;
}

// cues: [{start, style}] in seconds, sorted; returns stereo [left,right] of `seconds` length.
export function music(cues,seconds,bpm=104,seed=11){
 const random=rng(seed),left=new Float32Array(Math.round(seconds*RATE)),right=new Float32Array(left.length);
 cues.forEach((cue,i)=>{
  const end=i+1<cues.length?cues[i+1].start:seconds,len=end-cue.start;
  if(len<=0||cue.style==='stop')return;
  if(cue.style==='sting'){const s=sting();add(left,s,cue.start);add(right,s,cue.start);return}
  const [l,r]=bars(cue.style,len+.6,bpm,random);
  // 40 ms fade in, 250 ms fade out at the section boundary.
  const fadeOut=Math.round(.25*RATE),endSample=Math.round(len*RATE);
  for(let n=0;n<l.length;n++){const g=Math.min(1,n/(.04*RATE))*Math.max(0,Math.min(1,(endSample-n)/fadeOut+1));l[n]*=g;r[n]*=g}
  add(left,l,cue.start);add(right,r,cue.start);
 });
 return [left,right];
}

export {db};
