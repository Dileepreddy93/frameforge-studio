// In-browser voices: Kokoro-82M v1.0 (Apache-2.0) in a worker. Text -> phonemes (kokoro-g2p.js) ->
// ONNX model (WebGPU when the browser has it, otherwise WebAssembly) -> a finished 48 kHz line.
// The model downloads once into the Cache API, and every voiced line is cached by its text, voice and
// speed, so the studio voices lines with no network, no keys and no server after the first download.
import * as ort from 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/ort.webgpu.bundle.min.mjs';
import './kokoro-g2p.js';

const G2P=globalThis.FrameForgeG2P;
const ORT_WASM='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/ort-wasm-simd-threaded.asyncify.wasm';
const REVISION='1939ad2a8e416c0acfeecc08a694d14ef25f2231';
// A models/ folder next to the studio (a downloadable kit, or our test server) wins; otherwise the
// pinned Hugging Face copy, which costs us nothing per buyer.
const SOURCES=[new URL('../models/kokoro-82m-v1.0/',import.meta.url).href,
 `https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/${REVISION}/`];
const MODEL_FILE='onnx/model.onnx',MODEL_ID='kokoro-82m-v1.0-fp32@'+REVISION.slice(0,8);
const FILES='frameforge-voice-model-v1',LINES='frameforge-voice-lines-v1';
const MODEL_RATE=24000,RATE=48000,LUFS=-18,TRUE_PEAK=-2,LEAD_IN=.06,TAIL=.1;
const post=(msg,transfer=[])=>self.postMessage(msg,transfer);

// --- downloads, cached once ----------------------------------------------------------------------
async function cachedBytes(url,label){
 const cache=await caches.open(FILES),hit=await cache.match(url);
 if(hit)return hit.arrayBuffer();
 const response=await fetch(url);
 if(!response.ok)throw new Error(label+' download failed (HTTP '+response.status+')');
 const total=Number(response.headers.get('content-length'))||0,reader=response.body.getReader(),parts=[];
 let loaded=0,shown=0;
 for(;;){
  const {done,value}=await reader.read();if(done)break;
  parts.push(value);loaded+=value.length;
  if(performance.now()-shown>200){post({type:'progress',file:label,loaded,total});shown=performance.now();}
 }
 post({type:'progress',file:label,loaded,total:total||loaded});
 const blob=new Blob(parts);
 try{await cache.put(url,new Response(blob));}catch(e){console.warn('Could not keep '+label+' for offline use',e);}
 return blob.arrayBuffer();
}
async function cachedSource(){
 const cache=await caches.open(FILES);
 for(const base of SOURCES)if(await cache.match(base+MODEL_FILE))return base;
 return null;
}
async function pickSource(){
 const cached=await cachedSource();if(cached)return cached;
 for(const base of SOURCES){try{if((await fetch(base+'tokenizer.json',{method:'HEAD'})).ok)return base;}catch{}}
 throw new Error('The voice model is not downloaded yet, and there is no connection to download it.');
}

// --- the model ------------------------------------------------------------------------------------
let ready=null,session=null,device=null,vocab=null,source=null,g2p=null,lexicon=null;
const styles=new Map();
// The pronunciation dictionary is enough to read text: no model needed.
function loadG2P(){
 lexicon??=fetch(new URL('../assets/voice/en-us-lexicon.json',import.meta.url))
  .then(r=>{if(!r.ok)throw new Error('Pronunciation dictionary HTTP '+r.status);return r.json()})
  .then(data=>g2p=G2P.createG2P(data)).catch(e=>{lexicon=null;throw e});
 return lexicon;
}
async function webgpu(){try{return Boolean(navigator.gpu&&await navigator.gpu.requestAdapter())}catch{return false}}
const open=(bytes,ep)=>ort.InferenceSession.create(bytes,{executionProviders:[ep],graphOptimizationLevel:'all'});
function init(){
 if(ready)return ready;
 ready=(async()=>{
  const started=performance.now();
  source=await pickSource();
  const [,tokenizer]=await Promise.all([loadG2P(),cachedBytes(source+'tokenizer.json','tokenizer').then(b=>JSON.parse(new TextDecoder().decode(b)))]);
  vocab=tokenizer.model.vocab;
  ort.env.logLevel='error';
  ort.env.wasm.wasmBinary=await cachedBytes(ORT_WASM,'runtime');
  ort.env.wasm.numThreads=self.crossOriginIsolated?Math.min(8,navigator.hardwareConcurrency||4):1;
  let model=await cachedBytes(source+MODEL_FILE,'model');
  if(await webgpu()){try{session=await open(model,'webgpu');device='webgpu';}catch(e){console.warn('WebGPU voice model failed; using WebAssembly',e);}}
  if(!session){session=await open(model,'wasm');device='wasm';}
  // Some GPUs return NaN for this model: check one short line and fall back to WebAssembly.
  if(device==='webgpu'&&!(await run('hˈI.','af_heart',1)).every(Number.isFinite)){
   await session.release();session=await open(model,'wasm');device='wasm';
  }
  model=null;
  return {device,source:source===SOURCES[0]?'local':'huggingface',model:MODEL_ID,threads:ort.env.wasm.numThreads,ms:Math.round(performance.now()-started)};
 })();
 ready.catch(()=>{ready=null;session=null;});
 return ready;
}
async function style(voice){
 if(!styles.has(voice))styles.set(voice,new Float32Array(await cachedBytes(source+'voices/'+voice+'.bin','voice '+voice)));
 return styles.get(voice);
}
async function run(ps,voice,speed){
 const ids=G2P.encode(ps,vocab),pack=await style(voice),row=Math.min(Math.max(ids.length-3,0),509);
 const out=await session.run({
  input_ids:new ort.Tensor('int64',BigInt64Array.from(ids,BigInt),[1,ids.length]),
  style:new ort.Tensor('float32',pack.slice(row*256,row*256+256),[1,256]),
  speed:new ort.Tensor('float32',new Float32Array([speed]),[1])});
 return out.waveform.data;
}

// --- finishing a line (the same steps as tools/voice_lines.py) --------------------------------------
function trim(x){
 const floor=10**(-50/20);let a=0,b=x.length-1;
 while(a<b&&Math.abs(x[a])<floor)a++;
 while(b>a&&Math.abs(x[b])<floor)b--;
 const y=x.slice(a,b+1),fade=Math.min(y.length,Math.round(.005*MODEL_RATE));
 for(let i=0;i<fade;i++)y[i]*=i/fade;
 return y;
}
// 24 -> 48 kHz: zero-stuff and low-pass with a Blackman-windowed sinc.
const TAPS=(()=>{const n=63,m=(n-1)/2,h=[];for(let i=0;i<n;i++){const t=i-m,s=t===0?.5:Math.sin(Math.PI*.5*t)/(Math.PI*t);
 h.push(2*s*(.42-.5*Math.cos(2*Math.PI*i/(n-1))+.08*Math.cos(4*Math.PI*i/(n-1))));}return h;})();
function upsample(x){
 const y=new Float32Array(x.length*2),m=(TAPS.length-1)/2;
 for(let i=0;i<y.length;i++){let s=0;for(let j=(i+m)%2;j<TAPS.length;j+=2){const k=(i+m-j)/2;if(k>=0&&k<x.length)s+=x[k]*TAPS[j];}y[i]=s;}
 return y;
}
function biquad(x,b,a){
 const y=new Float32Array(x.length);let x1=0,x2=0,y1=0,y2=0;
 for(let i=0;i<x.length;i++){const v=b[0]*x[i]+b[1]*x1+b[2]*x2-a[0]*y1-a[1]*y2;x2=x1;x1=x[i];y2=y1;y1=v;y[i]=v;}
 return y;
}
// ITU-R BS.1770 integrated loudness of a 48 kHz mono signal (K-weighting, 400 ms blocks, gating).
function loudness(x){
 const k=biquad(biquad(x,[1.53512485958697,-2.69169618940638,1.19839281085285],[-1.69065929318241,.73248077421585]),
  [1,-2,1],[-1.99004745483398,.99007225036621]);
 const block=.4*RATE,hop=.1*RATE,powers=[],L=p=>-.691+10*Math.log10(p);
 for(let i=0;i+block<=k.length;i+=hop){let s=0;for(let j=i;j<i+block;j++)s+=k[j]*k[j];powers.push(s/block);}
 if(!powers.length){let s=0;for(const v of k)s+=v*v;powers.push(s/Math.max(1,k.length));}
 const mean=p=>p.reduce((a,b)=>a+b,0)/p.length;
 let gated=powers.filter(p=>L(p)>-70);if(!gated.length)return -70;
 const relative=L(mean(gated))-10;gated=gated.filter(p=>L(p)>relative);
 return L(mean(gated));
}
// Peak limiter: 3 ms look-ahead, 40 ms release.
function limit(x,ceiling){
 const look=Math.round(.003*RATE),release=Math.exp(-1/(.04*RATE)),need=new Float32Array(x.length);
 for(let i=0;i<x.length;i++){const a=Math.abs(x[i]);need[i]=a>ceiling?ceiling/a:1;}
 let gain=1;
 for(let i=0;i<x.length;i++){
  let target=1;for(let j=i,end=Math.min(x.length,i+look);j<end;j++)if(need[j]<target)target=need[j];
  gain=target<gain?target:target+(gain-target)*release;
  x[i]*=gain;
 }
 return x;
}
function finishLine(raw){
 const voice=upsample(trim(raw)),gain=10**((LUFS-loudness(voice))/20);
 for(let i=0;i<voice.length;i++)voice[i]*=gain;
 limit(voice,10**((TRUE_PEAK-.5)/20));
 const out=new Float32Array(Math.round(LEAD_IN*RATE)+voice.length+Math.round(TAIL*RATE));
 out.set(voice,Math.round(LEAD_IN*RATE));
 return out;
}

// --- lines ------------------------------------------------------------------------------------------
async function lineKey(text,voice,speed){
 const data=new TextEncoder().encode(JSON.stringify([MODEL_ID,G2P.version,voice,speed,text]));
 const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(b=>b.toString(16).padStart(2,'0')).join('');
 return new URL('../__voice-lines/'+hash.slice(0,40)+'.f32',import.meta.url).href;
}
async function speak({text,voice,speed=1}){
 if(!/^[a-z]{2}_[a-z]+$/.test(voice))throw new Error('Unknown voice '+voice);
 const started=performance.now(),key=await lineKey(text,voice,speed),cache=await caches.open(LINES),hit=await cache.match(key);
 let raw,phonemes,guessed=[];
 if(hit){
  raw=new Float32Array(await hit.arrayBuffer());
  phonemes=decodeURIComponent(hit.headers.get('x-phonemes')||'');guessed=JSON.parse(decodeURIComponent(hit.headers.get('x-guessed')||'%5B%5D'));
 }else{
  await init();
  ({phonemes,guessed}=g2p.phonemize(text));
  if(!phonemes)throw new Error('Nothing to say in "'+text+'"');
  const parts=[];for(const ps of G2P.splitPhonemes(phonemes))parts.push(await run(ps,voice,speed));
  raw=new Float32Array(parts.reduce((n,p)=>n+p.length,0));let at=0;for(const p of parts){raw.set(p,at);at+=p.length;}
  if(!raw.every(Number.isFinite))throw new Error('The voice model returned invalid audio');
  try{await cache.put(key,new Response(raw.slice(),{headers:{'x-phonemes':encodeURIComponent(phonemes),'x-guessed':encodeURIComponent(JSON.stringify(guessed))}}));}
  catch(e){console.warn('Could not cache the voiced line',e);}
 }
 const samples=finishLine(raw);
 return {samples,rate:RATE,seconds:samples.length/RATE,voiceStart:LEAD_IN,phonemes,guessed,cached:Boolean(hit),ms:Math.round(performance.now()-started)};
}

// One request at a time: a session must not run twice at once.
let queue=Promise.resolve();
self.onmessage=({data})=>{
 const {id,type}=data;
 queue=queue.then(async()=>{
  try{
   if(type==='status'){const s=await cachedSource();post({id,type,modelCached:Boolean(s),source:s===SOURCES[0]?'local':s?'huggingface':null,model:MODEL_ID,g2p:G2P.version});}
   else if(type==='init')post({id,type,...await init()});
   else if(type==='speak'){const r=await speak(data);post({id,type,...r},[r.samples.buffer]);}
   else if(type==='phonemize'){await loadG2P();post({id,type,...g2p.phonemize(data.text)});}
   else throw new Error('Unknown request '+type);
  }catch(e){post({id,type:'error',message:e.message||String(e)});}
 });
};
