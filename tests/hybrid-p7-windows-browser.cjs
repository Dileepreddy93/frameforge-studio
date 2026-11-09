// Chrome desktop hardware/capability gate: the *customer* V2 editor, real
// Kokoro model inference, live playback and a real native 1080x1920 30fps H264/AAC
// MP4 with independent ffprobe frame count and complete FFmpeg decode.
// No transcoding, synthetic speech or fallback film is accepted.
'use strict';
const path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const doCreator=require('./hybrid-p7-real-creator-voice.cjs');
const OUT=path.resolve(process.env.FRAMEFORGE_WINDOWS_OUT||'artifacts/hybrid-windows-native');
const URL_=process.env.FRAMEFORGE_URL||'http://127.0.0.1:8959/';
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
   const context=await browser.newContext({viewport:{width:1330,height:900},acceptDownloads:true});
   const page=await context.newPage();
   const report=await doCreator(page,URL_,OUT,{width:1080,requireCodec:true});
   assert.equal(report.video,'browser-native-mp4-full-decode');
   console.log('HYBRID_P7_WINDOWS_NATIVE_HD_RELEASE_PASS '+JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error('HYBRID_P7_WINDOWS_NATIVE_HD_RELEASE_FAIL',e.stack||e);process.exitCode=1});
