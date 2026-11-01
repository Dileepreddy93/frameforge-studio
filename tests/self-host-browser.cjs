// M6.1: the studio's libraries come from our own site, fall back to the CDN, and the studio says clearly why it can't
// start when neither loads or the browser has no WebGL 2.
//   python3 -m http.server 8959 & FRAMEFORGE_URL=http://127.0.0.1:8959/ node tests/self-host-browser.cjs
//   FRAMEFORGE_VOICE=1 also starts the voice engine with the CDN blocked (downloads the Kokoro model).
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {useCdnMirror}=require('./cdn-mirror.cjs');
const URL_=process.env.FRAMEFORGE_URL||'http://127.0.0.1:8959/';
const ARGS=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'];

async function open(browser,{blockCdn=false,blockVendor=false,noWebGL2=false}={}){
 const context=await browser.newContext({viewport:{width:1280,height:900}});
 // The CDN mirror (sandboxes only) stands in for jsDelivr; blocking routes are added after it, so they win.
 if(!blockCdn)await useCdnMirror(context);
 if(blockCdn)await context.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 if(blockVendor)await context.route(/\/vendor\//,r=>r.abort());
 if(noWebGL2)await context.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...a){return type==='webgl2'?null:get.call(this,type,...a)};});
 const page=await context.newPage(),requests=[];
 page.on('request',r=>requests.push(r.url()));
 await page.goto(URL_+'studio.html',{waitUntil:'domcontentloaded',timeout:60000});
 return {context,page,requests};
}
const ready=page=>page.waitForFunction(()=>window.FrameForgeProjectsLoaded&&window.FrameForgeQA?.shots().length>0,null,{timeout:120000});
const failure=page=>page.waitForFunction(()=>getComputedStyle(document.getElementById('failure')).display!=='none',null,{timeout:120000})
 .then(()=>page.textContent('#failure'));

(async()=>{
 const browser=await chromium.launch({headless:true,args:ARGS});
 try{
  // 1. CDN unreachable: everything from our own site, and an MP4 still exports.
  {
   const {context,page,requests}=await open(browser,{blockCdn:true});
   await ready(page);
   assert.ok(requests.some(u=>u.includes('/vendor/three@0.180.0/three.module.min.js')));
   assert.ok(!requests.some(u=>u.includes('cdn.jsdelivr.net')&&!/\/npm\/mediabunny|onnxruntime/.test(u)),'three.js came from our site');
   await page.waitForFunction(()=>FrameForgeQA.envelopeReady(),null,{timeout:60000});
   const r=await page.evaluate(async()=>{const r=await FrameForgeMP4Test({frameLimit:6,width:180,height:320,download:false});return {bytes:r.blob.size,codec:r.audioCodec}});
   assert.ok(r.bytes>2000,'an MP4 was written with our copy of Mediabunny');
   assert.ok(requests.some(u=>u.includes('/vendor/mediabunny@1.62.1/mediabunny.mjs')));
   // The voice runtime's files are served (the worker loads them when voices start).
   const ort=await page.evaluate(async()=>{const m=await import('./vendor/onnxruntime-web@1.30.0/ort.webgpu.bundle.min.mjs');
    const w=await fetch('./vendor/onnxruntime-web@1.30.0/ort-wasm-simd-threaded.asyncify.wasm');return {session:typeof m.InferenceSession?.create,wasm:w.ok,bytes:Number(w.headers.get('content-length'))||(await w.arrayBuffer()).byteLength}});
   assert.equal(ort.session,'function');assert.equal(ort.wasm,true);assert.ok(ort.bytes>20e6);
   if(process.env.FRAMEFORGE_VOICE==='1'){
    const v=await page.evaluate(()=>FrameForgeVoiceQA.ensure());
    assert.equal(v.state,'ready','the voice engine starts with the CDN blocked');
   }
   await context.close();
  }
  // 2. Our copy unreachable: the studio falls back to the pinned CDN version.
  {
   const {context,page,requests}=await open(browser,{blockVendor:true});
   await ready(page);
   assert.ok(requests.some(u=>u.startsWith('https://cdn.jsdelivr.net/npm/three@0.180.0/')),'three.js came from the CDN');
   await context.close();
  }
  // 3. Neither: a specific message and a Try again button, not "Loading engine…" forever.
  {
   const {context,page}=await open(browser,{blockCdn:true,blockVendor:true});
   const text=await failure(page);
   assert.match(text,/could not be downloaded \(three\.js\)/);assert.match(text,/Try again/);
   assert.equal(await page.textContent('#status'),'The studio could not start');
   await context.close();
  }
  // 4. No WebGL 2: says how to fix it.
  {
   const {context,page}=await open(browser,{noWebGL2:true});
   assert.match(await failure(page),/WebGL 2.*graphics acceleration/s);
   await context.close();
  }
  console.log('SELF_HOST_BROWSER_PASS: own copies with the CDN blocked (studio, MP4 export, voice runtime), CDN fallback, clear failures');
 }finally{await browser.close();}
})().catch(e=>{console.error('SELF_HOST_BROWSER_FAIL',e);process.exit(1)});
