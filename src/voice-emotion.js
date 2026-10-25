/*
 * Emotion in the voice: how a line is delivered when its speaker is happy, worried, angry, and so on.
 * Kokoro has no emotion input, and its prosody barely changes with punctuation, so the delivery is shaped
 * around the model: its own speed control sets the pace, then the raw line's melody is reshaped with
 * TD-PSOLA (pitch level, pitch range, a rise or fall at the end, a slight tremor) without changing its
 * length or the voice's timbre, and a gentle high-shelf makes it brighter or darker. The loudness offset
 * is applied when the line is finished at -18 LUFS. Neutral lines are left exactly as Kokoro made them.
 * The browser worker and tools/voice-emotion.mjs (the offline Python path) both use this file.
 */
(function(root, factory){
 const core=factory();
 if(typeof module==='object'&&module.exports)module.exports=core;
 else root.FrameForgeVoiceEmotion=core;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='emotion-1';
 // speed: x Kokoro speed. pitch: semitones. range: x the melody's spread around its median. end: semitones of
 // rise (+) or fall (-) over the last 30% of the line. tremor: semitones at 5.5 Hz. tilt: dB above 1.5 kHz.
 // gain: dB on the line's -18 LUFS. After Murray & Arnott (1993): happy and surprised are higher, wider and
 // brighter; angry is louder, pressed and wide; sad is slower, lower, flatter, darker and quieter.
 const DELIVERY=Object.freeze({
  neutral:  {speed:1,   pitch:0,   range:1,   end:0,    tremor:0,   tilt:0,    gain:0},
  happy:    {speed:1.05,pitch:1.5, range:1.3, end:.5,   tremor:0,   tilt:1.5,  gain:1},
  surprised:{speed:1.06,pitch:2.5, range:1.45,end:2,    tremor:0,   tilt:2,    gain:2},
  angry:    {speed:1.05,pitch:.5,  range:1.35,end:-.5,  tremor:0,   tilt:3,    gain:3},
  worried:  {speed:1.06,pitch:1,   range:.8,  end:.5,   tremor:.35, tilt:0,    gain:-1},
  sad:      {speed:.88, pitch:-1.5,range:.6,  end:-1.5, tremor:0,   tilt:-3,   gain:-3},
  thinking: {speed:.92, pitch:-.5, range:.85, end:0,    tremor:0,   tilt:-1,   gain:-2}
 });
 const delivery=emotion=>DELIVERY[emotion]??DELIVERY.neutral;
 const isNeutral=emotion=>delivery(emotion)===DELIVERY.neutral;

 // --- melody: YIN pitch every 5 ms ---------------------------------------------------------------------
 function pitchTrack(x,rate){
  const hop=Math.round(.005*rate),win=Math.round(.025*rate),tauMin=Math.floor(rate/500),tauMax=Math.ceil(rate/60);
  const frames=Math.max(0,Math.floor((x.length-win-tauMax)/hop)),f0=new Float32Array(frames),rms=new Float32Array(frames);
  const d=new Float64Array(tauMax+1);
  for(let f=0;f<frames;f++){
   const at=f*hop;let e=0;for(let j=0;j<win;j++)e+=x[at+j]*x[at+j];rms[f]=Math.sqrt(e/win);
   for(let tau=1;tau<=tauMax;tau++){let s=0;for(let j=0;j<win;j++){const v=x[at+j]-x[at+j+tau];s+=v*v;}d[tau]=s;}
   let sum=0,best=-1;
   for(let tau=1;tau<=tauMax;tau++){sum+=d[tau];const c=d[tau]*tau/(sum||1);d[tau]=c;}
   for(let tau=tauMin;tau<tauMax;tau++)if(d[tau]<.2){while(tau+1<tauMax&&d[tau+1]<d[tau])tau++;best=tau;break;}
   if(best<0){let m=tauMin;for(let tau=tauMin;tau<tauMax;tau++)if(d[tau]<d[m])m=tau;if(d[m]<.35)best=m;}
   if(best>0){const a=d[best-1],b=d[best],c=d[best+1],den=a-2*b+c;f0[f]=rate/(best+(den?(a-c)/(2*den):0));}
  }
  // Quiet frames are not voiced; a 5-frame median removes single-frame octave slips.
  let peak=0;for(const v of rms)peak=Math.max(peak,v);
  for(let f=0;f<frames;f++)if(rms[f]<.05*peak)f0[f]=0;
  const out=new Float32Array(frames);
  for(let f=0;f<frames;f++){
   if(!f0[f])continue;
   const near=[];for(let k=f-2;k<=f+2;k++)if(k>=0&&k<frames&&f0[k])near.push(f0[k]);
   near.sort((a,b)=>a-b);out[f]=near[near.length>>1];
  }
  return {f0:out,hop,win};
 }
 const median=v=>{const s=[...v].sort((a,b)=>a-b);return s.length?s[s.length>>1]:0;};

 // --- TD-PSOLA: same length, new melody ----------------------------------------------------------------
 function reshape(x,rate,d){
  const {f0,hop,win}=pitchTrack(x,rate),voiced=[];
  for(let f=0;f<f0.length;f++)if(f0[f])voiced.push(f);
  if(voiced.length<4)return x.slice();
  const centre=Math.log2(median(voiced.map(f=>f0[f]))),first=voiced[0],last=voiced[voiced.length-1];
  const frameAt=i=>Math.min(f0.length-1,Math.max(0,Math.round((i-win/2)/hop)));
  const periodAt=i=>{const v=f0[frameAt(i)];return v?rate/v:0;};
  // The new melody, as a pitch ratio for each voiced frame.
  const ratio=new Float32Array(f0.length).fill(1),endFrom=last-.3*(last-first);
  for(const f of voiced){
   const t=f*hop/rate,lf=Math.log2(f0[f]);
   const ramp=f<=endFrom?0:(u=>u*u*(3-2*u))((f-endFrom)/Math.max(1,last-endFrom));
   const target=centre+d.pitch/12+d.range*(lf-centre)+d.end*ramp/12+d.tremor*Math.sin(2*Math.PI*5.5*t)/12;
   ratio[f]=2**(target-lf);
  }
  // Analysis marks: one per pitch period while voiced, every 5 ms otherwise. Marks sit on the peaks of the
  // waveform low-passed near the pitch, which repeat once per glottal cycle (raw peaks can skip between formants).
  const smooth=lowpass(x,rate,Math.min(800,Math.max(150,2*2**centre)));
  const clean=[];let i=0;
  while(i<x.length){
   const T=periodAt(i);
   if(!T){clean.push({at:i,T:hop,voiced:false});i+=hop;continue;}
   const Ti=Math.round(T),prev=clean[clean.length-1],chain=prev?.voiced;
   // The first mark of a voiced stretch takes the highest peak of its first period; the next ones the highest
   // peak about one period after the last mark.
   const lo=chain?prev.at+Math.round(.75*T):i,hi=Math.min(x.length-1,chain?prev.at+Math.round(1.25*T):i+Ti);
   if(lo>hi)break;
   let m=lo;for(let j=lo;j<=hi;j++)if(smooth[j]>smooth[m])m=j;
   clean.push({at:m,T:Ti,voiced:true});i=m+Ti;
  }
  // Synthesis: walk the line at the new periods, each time overlap-adding the nearest analysis grain. Each grain
  // spans from the previous mark to the next one (or the new period, if longer), so at the original pitch the
  // grains fall back on their own marks and add up to the original line.
  const out=new Float64Array(x.length),weight=new Float64Array(x.length);
  let k=0,ts=clean[0].at,lastStep=clean[0].T;
  while(ts<x.length){
   while(k+1<clean.length&&Math.abs(clean[k+1].at-ts)<=Math.abs(clean[k].at-ts))k++;
   const m=clean[k],r=m.voiced?ratio[frameAt(m.at)]:1;
   const gapNext=(k+1<clean.length?clean[k+1].at:m.at+m.T)-m.at,gapPrev=k>0?m.at-clean[k-1].at:gapNext,step=Math.max(8,gapNext/r);
   const left=Math.round(Math.max(gapPrev,lastStep)),right=Math.round(Math.max(gapNext,step)),at=Math.round(ts);
   for(let j=-left;j<=right;j++){
    const src=m.at+j,dst=at+j;
    if(src<0||src>=x.length||dst<0||dst>=x.length)continue;
    const w=.5+.5*Math.cos(Math.PI*j/(j<0?left:right));
    out[dst]+=w*x[src];weight[dst]+=w;
   }
   ts+=step;lastStep=step;
  }
  const y=new Float32Array(x.length);
  for(let j=0;j<y.length;j++)y[j]=weight[j]>1e-3?out[j]/weight[j]:0;
  return y;
 }

 function biquad(x,b,a){
  const y=new Float32Array(x.length);let x1=0,x2=0,y1=0,y2=0;
  for(let i=0;i<x.length;i++){const v=b[0]*x[i]+b[1]*x1+b[2]*x2-a[0]*y1-a[1]*y2;x2=x1;x1=x[i];y2=y1;y1=v;y[i]=v;}
  return y;
 }
 // RBJ low-pass, run forwards and backwards so its peaks stay where the waveform's are.
 function lowpass(x,rate,hz){
  const w=2*Math.PI*hz/rate,c=Math.cos(w),alpha=Math.sin(w)/2*Math.SQRT2,a0=1+alpha;
  const b=[(1-c)/2/a0,(1-c)/a0,(1-c)/2/a0],a=[-2*c/a0,(1-alpha)/a0];
  return biquad(biquad(x,b,a).reverse(),b,a).reverse();
 }
 // RBJ high shelf at 1.5 kHz: brighter (+dB) or darker (-dB).
 function tilt(x,rate,db){
  const A=10**(db/40),w=2*Math.PI*1500/rate,c=Math.cos(w),alpha=Math.sin(w)/2*Math.SQRT2,sq=2*Math.sqrt(A)*alpha;
  const a0=(A+1)-(A-1)*c+sq;
  return biquad(x,[A*((A+1)+(A-1)*c+sq)/a0,-2*A*((A-1)+(A+1)*c)/a0,A*((A+1)+(A-1)*c-sq)/a0],[2*((A-1)-(A+1)*c)/a0,((A+1)-(A-1)*c-sq)/a0]);
 }

 // A raw line -> the same line with these delivery settings (speed and gain are applied elsewhere).
 function deliver(x,rate,d){
  let y=(d.pitch||d.range!==1||d.end||d.tremor)?reshape(x,rate,d):x.slice();
  if(d.tilt)y=tilt(y,rate,d.tilt);
  return y;
 }
 // A raw Kokoro line (made at speed x delivery.speed) -> the same line delivered with this emotion.
 const apply=(x,rate,emotion)=>isNeutral(emotion)?x:deliver(x,rate,delivery(emotion));

 return Object.freeze({version:VERSION,emotions:Object.keys(DELIVERY),delivery,isNeutral,apply,deliver,pitchTrack,median});
});
