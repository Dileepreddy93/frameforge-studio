// M6.4: the light voice model (8-bit, about 90 MB) next to the full one (326 MB). Downloads both from Hugging Face,
// voices the same three lines with each, checks them and saves WAVs to listen to.
//   python3 -m http.server 8959 & FRAMEFORGE_URL=http://127.0.0.1:8959/ node tests/voice-model-browser.cjs
//   FRAMEFORGE_SAMPLES_OUT=<dir> keeps the WAVs (CI uploads them).
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {chromium}=require('playwright');
const {useCdnMirror}=require('./cdn-mirror.cjs');
const URL_=process.env.FRAMEFORGE_URL||'http://127.0.0.1:8959/';
const OUT=process.env.FRAMEFORGE_SAMPLES_OUT||fs.mkdtempSync(path.join(os.tmpdir(),'frameforge-voices-'));
const LINES=[['dev','am_michael','worried','Our app takes twelve seconds to load.'],['blue','af_heart','happy','I can make it instant!'],
 ['orange','bm_george','neutral','Technically, retention is perfect.']];
function stats(wav){const b=Buffer.from(wav,'base64'),n=(b.length-44)/2;let s=0,peak=0;
 for(let i=0;i<n;i++){const v=b.readInt16LE(44+2*i)/32768;s+=v*v;peak=Math.max(peak,Math.abs(v));}
 return {rmsDb:+(10*Math.log10(s/n)).toFixed(1),peakDb:+(20*Math.log10(peak)).toFixed(1)};}
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1280,height:900}});await useCdnMirror(context);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const summary={};
 try{
  await page.goto(URL_+'studio.html');
  await page.waitForFunction(()=>window.FrameForgeRecovered&&FrameForgeQA?.shots().length>0,null,{timeout:120000});
  for(const q of ['light','full']){
   await page.evaluate(q=>FrameForgeVoiceQA.useModel(q),q);
   const t0=Date.now();
   const engine=await page.evaluate(()=>FrameForgeVoiceQA.ensure());
   const files=await page.evaluate(()=>FrameForgeVoiceQA.downloaded());
   assert.equal(engine.state,'ready');
   assert.match(engine.model,q==='light'?/q8@/:/fp32@/);
   if(q==='light')assert.equal(engine.device,'wasm','the light model runs on WebAssembly');
   const modelMB=+((files.model?.total||0)/1e6).toFixed(1);
   const lines=[];
   for(const [who,voice,emotion,text] of LINES){
    const t=Date.now(),r=await page.evaluate(([t,v,e])=>FrameForgeVoiceQA.speakWav(t,v,e),[text,voice,emotion]);
    const st=stats(r.wav);
    assert.ok(r.seconds>.8&&r.seconds<6,`${q} ${who}: ${r.seconds} s`);
    assert.ok(st.rmsDb>-35&&st.peakDb<=0,`${q} ${who}: speech, not silence or noise (${JSON.stringify(st)})`);
    fs.writeFileSync(path.join(OUT,`${q}-${who}.wav`),Buffer.from(r.wav,'base64'));
    lines.push({who,seconds:+r.seconds.toFixed(2),ms:Date.now()-t,...st});
   }
   summary[q]={model:engine.model,device:engine.device,modelMB,loadS:Math.round((Date.now()-t0)/1000),lines};
  }
  // The light model is much smaller, and says the same lines in about the same time.
  if(summary.light.modelMB&&summary.full.modelMB){assert.ok(summary.light.modelMB<summary.full.modelMB/2.5,JSON.stringify(summary));}
  summary.light.lines.forEach((l,i)=>assert.ok(Math.abs(l.seconds-summary.full.lines[i].seconds)<=Math.max(.6,summary.full.lines[i].seconds*.25),'similar timing '+l.who));
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify(summary,null,2));
  console.log('VOICE_MODEL_BROWSER_PASS',JSON.stringify(summary));
 }finally{await browser.close();}
})().catch(e=>{console.error('VOICE_MODEL_BROWSER_FAIL',e);process.exit(1)});
