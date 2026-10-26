// Emotion in the voice (M2.2), without the model: a synthetic vowel with a known melody and formants goes through
// every delivery, and an independent pitch estimate checks that each emotion moves the melody as its table says,
// keeps the line's length and timbre, and that neutral lines are untouched.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const emotion=require('../src/voice-emotion.js');
const core=require('../src/project-core.js');

const RATE=24000;
// 0.9 s of "ah" falling from 135 to 110 Hz, 0.15 s of breath noise, 0.9 s rising 105 -> 125 Hz: pulses through
// resonators at 700, 1220 and 2600 Hz. A seeded random keeps the noise the same on every run.
function vowel(){
 let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647-.5;
 const x=new Float32Array(Math.round(2.1*RATE)),src=new Float32Array(x.length);
 let phase=0;
 for(let i=0;i<x.length;i++){
  const t=i/RATE;
  if(t<.05||(t>=.95&&t<1.1)||t>2.05){src[i]=t>=.95&&t<1.1?rnd()*.3:0;continue;}
  const f=t<.95?135-25*(t-.05)/.9:105+20*(t-1.1)/.95;
  phase+=f/RATE;if(phase>=1){phase-=1;src[i]=1;}
 }
 let y=src;
 for(const [hz,bw] of [[700,90],[1220,110],[2600,170]]){
  const r=Math.exp(-Math.PI*bw/RATE),c=2*r*Math.cos(2*Math.PI*hz/RATE),out=new Float32Array(y.length);
  for(let i=0;i<y.length;i++)out[i]=y[i]+c*(out[i-1]||0)-r*r*(out[i-2]||0);
  y=out;
 }
 let peak=0;for(const v of y)peak=Math.max(peak,Math.abs(v));
 for(let i=0;i<y.length;i++)x[i]=y[i]/peak*.6;
 return x;
}
// Independent pitch: autocorrelation peak per 10 ms frame (60-300 Hz), 0 where quiet or not periodic.
function pitch(x){
 const win=720,out=[];
 for(let at=0;at+win+400<=x.length;at+=240){
  let e=0;for(let j=0;j<win;j++)e+=x[at+j]*x[at+j];
  const r=new Float64Array(401);let best=0;
  for(let tau=80;tau<=400;tau++){let s=0,e2=0;for(let j=0;j<win;j++){s+=x[at+j]*x[at+j+tau];e2+=x[at+j+tau]**2;}r[tau]=s/Math.sqrt(e*e2||1);best=Math.max(best,r[tau]);}
  // The shortest lag that is nearly as good as the best: a period, not a multiple of it.
  let lag=80;while(lag<400&&!(r[lag]>=.95*best&&r[lag]>=r[lag-1]&&r[lag]>=r[lag+1]))lag++;
  out.push(e/win>1e-4&&best>.8?RATE/lag:0);
 }
 return out;
}
const st=(a,b)=>12*Math.log2(b/a);
const median=v=>{const s=[...v].sort((a,b)=>a-b);return s[s.length>>1];};
// Smoothed long-term spectrum of the voiced part: where the first formant sits (timbre), and high/low balance.
function fft(re,im){
 const n=re.length;
 for(let i=1,j=0;i<n;i++){let b=n>>1;for(;j&b;b>>=1)j^=b;j^=b;if(i<j){[re[i],re[j]]=[re[j],re[i]];[im[i],im[j]]=[im[j],im[i]];}}
 for(let len=2;len<=n;len<<=1){const a=-2*Math.PI/len;for(let i=0;i<n;i+=len)for(let k=0;k<len/2;k++){
  const c=Math.cos(a*k),s=Math.sin(a*k),p=i+k,q=p+len/2,tr=re[q]*c-im[q]*s,ti=re[q]*s+im[q]*c;
  re[q]=re[p]-tr;im[q]=im[p]-ti;re[p]+=tr;im[p]+=ti;}}
}
function spectrum(x){
 const n=1024,bins=new Float64Array(n/2);
 for(let at=0;at+n<=x.length;at+=512){
  const re=new Float64Array(n),im=new Float64Array(n);
  for(let j=0;j<n;j++)re[j]=x[at+j]*(.5-.5*Math.cos(2*Math.PI*j/n));
  fft(re,im);for(let k=1;k<n/2;k++)bins[k]+=re[k]*re[k]+im[k]*im[k];
 }
 const hz=k=>k*RATE/n,smooth=bins.map((_,k)=>{let s=0,c=0;for(let j=k-6;j<=k+6;j++)if(j>0&&j<n/2){s+=bins[j];c++;}return s/c;});
 let f1=0;for(let k=1;k<n/2;k++)if(hz(k)>400&&hz(k)<1000&&smooth[k]>(smooth[f1]||0))f1=k;
 let low=0,high=0;for(let k=1;k<n/2;k++){if(hz(k)<1000)low+=bins[k];else if(hz(k)>2000)high+=bins[k];}
 return {f1:hz(f1),tiltDb:10*Math.log10(high/low)};
}

const x=vowel(),inPitch=pitch(x),inSpec=spectrum(x);

// 1. Every emotion the project format allows has a delivery; neutral is a no-op.
assert.deepEqual([...emotion.emotions].sort(),[...core.emotions].sort(),'one delivery per project emotion');
assert.deepEqual(emotion.delivery('neutral'),{speed:1,pitch:0,range:1,end:0,tremor:0,tilt:0,gain:0});
assert.equal(emotion.apply(x,RATE,'neutral'),x,'neutral lines are left exactly as Kokoro made them');
assert.equal(emotion.delivery('unknown'),emotion.delivery('neutral'));
for(const name of emotion.emotions){
 const d=emotion.delivery(name);
 assert.ok(d.speed>=.85&&d.speed<=1.1&&Math.abs(d.pitch)<=3&&d.range>=.5&&d.range<=1.5&&Math.abs(d.gain)<=3,name+': gentle settings');
}
// 2. Reshaping at the original pitch gives back the original samples.
const same=emotion.deliver(x,RATE,{...emotion.delivery('neutral'),pitch:1e-9});
assert.ok(same.every((v,i)=>Math.abs(v-x[i])<1e-6),'PSOLA at the same pitch reconstructs the line');

// 3. Each emotion moves the melody as described, keeps length and timbre, and stays clean.
const report={};
for(const name of emotion.emotions.filter(e=>e!=='neutral')){
 const d=emotion.delivery(name),y=emotion.apply(x,RATE,name),p=pitch(y),spec=spectrum(y);
 assert.equal(y.length,x.length,name+': same length (pace comes from Kokoro speed)');
 assert.ok(y.every(Number.isFinite),name+': finite');
 let peakIn=0,peakOut=0;for(let i=0;i<x.length;i++){peakIn=Math.max(peakIn,Math.abs(x[i]));peakOut=Math.max(peakOut,Math.abs(y[i]));}
 assert.ok(peakOut<1.6*peakIn,name+': no spikes ('+peakOut.toFixed(2)+' vs '+peakIn.toFixed(2)+')');
 // Pitch level and range over the first sentence (before the end rise/fall).
 const frames=inPitch.map((f,i)=>i).filter(i=>inPitch[i]&&p[i]&&i*240/RATE>.1&&i*240/RATE<.85);
 const shift=median(frames.map(i=>st(inPitch[i],p[i])));
 const spread=v=>{const s=frames.map(i=>Math.log2(v[i]));const m=s.reduce((a,b)=>a+b,0)/s.length;return Math.sqrt(s.reduce((a,b)=>a+(b-m)**2,0)/s.length);};
 const range=spread(p)/spread(inPitch);
 assert.ok(Math.abs(shift-d.pitch)<.6,name+': pitch '+shift.toFixed(2)+' st, wants '+d.pitch);
 if(!d.tremor)assert.ok(Math.abs(range-d.range)<.2,name+': range x'+range.toFixed(2)+', wants x'+d.range);
 // The end of the line rises or falls relative to its middle.
 const tail=inPitch.map((f,i)=>i).filter(i=>inPitch[i]&&p[i]&&i*240/RATE>1.85&&i*240/RATE<2.0);
 const mid=inPitch.map((f,i)=>i).filter(i=>inPitch[i]&&p[i]&&i*240/RATE>1.15&&i*240/RATE<1.4);
 const centre=Math.log2(median(inPitch.filter(Boolean)));
 const expect=i=>d.pitch+(d.range-1)*12*(Math.log2(inPitch[i])-centre);
 const endMove=median(tail.map(i=>st(inPitch[i],p[i])-expect(i)))-median(mid.map(i=>st(inPitch[i],p[i])-expect(i)));
 if(Math.abs(d.end)>=1)assert.ok(Math.sign(endMove)===Math.sign(d.end)&&Math.abs(endMove)>.4*Math.abs(d.end),name+': end moves '+endMove.toFixed(2)+' st, wants '+d.end);
 // Tremor: the worried melody wobbles more, frame to frame, than the original.
 if(d.tremor){
  const wobble=v=>median(frames.slice(1).map((i,k)=>Math.abs(st(v[frames[k]],v[i]))));
  assert.ok(wobble(p)>wobble(inPitch)+.05,name+': tremor '+wobble(p).toFixed(3)+' vs '+wobble(inPitch).toFixed(3));
 }
 // Timbre: the first formant stays put (plain resampling would move it with the pitch); tilt brightens or darkens.
 assert.ok(Math.abs(spec.f1/inSpec.f1-1)<.08,name+': first formant '+spec.f1.toFixed(0)+' Hz vs '+inSpec.f1.toFixed(0));
 const tiltMove=spec.tiltDb-inSpec.tiltDb;
 if(Math.abs(d.tilt)>=1.5)assert.ok(Math.sign(tiltMove)===Math.sign(d.tilt)&&Math.abs(tiltMove)>.5*Math.abs(d.tilt),name+': tilt '+tiltMove.toFixed(1)+' dB, wants '+d.tilt);
 report[name]={pitch:+shift.toFixed(2),range:+range.toFixed(2),end:+endMove.toFixed(2),f1:Math.round(spec.f1),tilt:+tiltMove.toFixed(1)};
}

// 4. The offline tool (tools/voice_lines.py's step) gives the same samples as the browser's module.
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'voice-emotion-')),file=path.join(dir,'line.wav');
try{
 const h=Buffer.alloc(44),data=Buffer.alloc(x.length*2);
 for(let i=0;i<x.length;i++)data.writeInt16LE(Math.round(x[i]*32767),i*2);
 h.write('RIFF',0);h.writeUInt32LE(36+data.length,4);h.write('WAVE',8);h.write('fmt ',12);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);
 h.writeUInt16LE(1,22);h.writeUInt32LE(RATE,24);h.writeUInt32LE(RATE*2,28);h.writeUInt16LE(2,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(data.length,40);
 fs.writeFileSync(file,Buffer.concat([h,data]));
 const pcm=Float32Array.from({length:x.length},(_,i)=>data.readInt16LE(i*2)/32768);
 execFileSync('node',[path.join(__dirname,'..','tools','voice-emotion.mjs'),file,'sad']);
 const out=fs.readFileSync(file),expected=emotion.apply(pcm,RATE,'sad');
 assert.equal(out.readUInt16LE(20),3,'float WAV');assert.equal((out.length-44)/4,expected.length);
 for(let i=0;i<expected.length;i++)assert.equal(out.readFloatLE(44+i*4),expected[i]);
 const table=JSON.parse(execFileSync('node',[path.join(__dirname,'..','tools','voice-emotion.mjs'),'--delivery'],{encoding:'utf8'}));
 assert.equal(table.version,emotion.version);assert.deepEqual(table.emotions.angry,emotion.delivery('angry'));
}finally{fs.rmSync(dir,{recursive:true,force:true});}

console.log('VOICE_EMOTION_PASS',JSON.stringify(report));
