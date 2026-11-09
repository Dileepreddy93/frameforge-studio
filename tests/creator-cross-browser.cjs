// Phase 4: the Creator in each browser engine Playwright ships (chromium, firefox, webkit = Safari's engine).
// It must either work (scene renders, export support known) or say clearly what's missing, with no page errors.
// Records each engine's capabilities so the landing FAQ and the device matrix stay honest.
//   BROWSER=firefox node tests/creator-cross-browser.cjs
'use strict';
const pw=require('playwright'),assert=require('node:assert/strict'),cp=require('node:child_process'),
 fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),NAME=process.env.BROWSER||'chromium',PORT=8990+['chromium','firefox','webkit'].indexOf(NAME);
const OUT=path.resolve(process.env.FRAMEFORGE_XB_OUT||'artifacts/cross-browser');
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const server=cp.spawn(process.execPath,['tests/static-server.cjs',String(PORT)],{cwd:ROOT,stdio:'pipe'});
 let browser;
 try{
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('static server did not start')),15000);
    server.stdout.on('data',d=>{if(String(d).includes('static server on')){clearTimeout(timer);resolve()}})});
  // CI machines have no GPU: let Firefox use its software WebGL, as Chromium's tests use SwiftShader.
  browser=await pw[NAME].launch({headless:true,...(NAME==='firefox'?{firefoxUserPrefs:{'webgl.force-enabled':true}}:{})});
  const page=await browser.newPage({viewport:{width:1330,height:930}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${PORT}/creator.html`,{waitUntil:'domcontentloaded',timeout:90000});
  const caps=await page.evaluate(async()=>{
    const gl=document.createElement('canvas').getContext('webgl2');
    const video=async(codec,w,h)=>{try{return (await VideoEncoder.isConfigSupported({codec,width:w,height:h,bitrate:8e6,framerate:30})).supported===true}catch{return false}};
    const audio=async codec=>{try{return (await AudioEncoder.isConfigSupported({codec,sampleRate:48000,numberOfChannels:2,bitrate:192000})).supported===true}catch{return false}};
    return {userAgent:navigator.userAgent,webgl2:Boolean(gl),webCodecs:'VideoEncoder' in window,
      h264_720:await video('avc1.640028',720,1280),h264_1080:await video('avc1.640028',1080,1920),
      aac:await audio('mp4a.40.2'),opus:await audio('opus'),webLocks:Boolean(navigator.locks),
      indexedDB:Boolean(window.indexedDB),webgpu:Boolean(navigator.gpu),sharedArrayBuffer:typeof SharedArrayBuffer==='function'};
  });
  // Booted (scene ready) or a clear message: never a silent hang.
  await page.waitForFunction(()=>document.getElementById('play').disabled===false||
    /^(Cannot open|Scene unavailable)/.test(document.getElementById('status').textContent),null,{timeout:120000});
  const state=await page.evaluate(()=>({status:document.getElementById('status').textContent,
    playable:document.getElementById('play').disabled===false,saving:document.getElementById('storage-status').textContent}));
  // Without WebGL the Creator must say so in plain words (and what to do), not crash.
  if(!state.playable)assert.match(state.status,/3D graphics \(WebGL\)|Cannot open/,'a clear message when the Creator cannot start');
  if(!caps.webgl2&&!state.playable)assert.match(state.status,/WebGL/,'the message names the missing WebGL');
  if(state.playable){
    const still=await page.evaluate(()=>{const w=document.getElementById('engine').contentWindow;
      const r=w.HybridP56QA.frameAt(1,true);return {draw:r.rendererStats.drawCalls,image:r.image}});
    assert.ok(still.draw>20,'the scene renders');
    fs.writeFileSync(path.join(OUT,NAME+'.png'),Buffer.from(still.image.split(',')[1],'base64'));
  }
  const report={browser:NAME,version:browser.version(),...caps,creatorBoots:state.playable,status:state.status,
    canExportMP4:caps.webCodecs&&caps.h264_720&&(caps.aac||caps.opus),pageErrors:errors};
  fs.writeFileSync(path.join(OUT,NAME+'.json'),JSON.stringify(report,null,1));
  assert.deepEqual(errors,[],'no page errors in '+NAME);
  console.log('CREATOR_CROSS_BROWSER_PASS '+JSON.stringify(report));
 }finally{await browser?.close();server.kill()}
})().catch(e=>{console.error('CREATOR_CROSS_BROWSER_FAIL '+NAME+' '+(e.stack||e.message));process.exit(1)});
