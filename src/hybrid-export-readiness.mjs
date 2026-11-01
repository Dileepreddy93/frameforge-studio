// P8 release-quality fail-closed export readiness. Never invent an MP4 encoder.
// Browser is probed on-device, not inferred from browser brand or user agent.
export const EXPORT_PROFILES=Object.freeze({
  preview:Object.freeze({width:360,height:640,fps:15,bitrate:1_200_000}),
  social:Object.freeze({width:720,height:1280,fps:30,bitrate:4_000_000}),
  master:Object.freeze({width:1080,height:1920,fps:30,bitrate:8_000_000})
});
export const LIMITS=Object.freeze({maxSeconds:180,maxBytes:768*1024*1024,maxPixelCount:2073600});
export function validateRenderRequest({profile='master',seconds,hasAudio=true,format='mp4'}={}){
 const spec=EXPORT_PROFILES[profile];
 if(!spec)throw Error('Unknown release export profile');
 if(!Number.isFinite(seconds)||seconds<=0||seconds>LIMITS.maxSeconds)
   throw RangeError('Film duration must be positive and <=180 seconds');
 if(format!=='mp4')throw Error('This pipeline only certifies H264/AAC MP4');
 if(hasAudio!==true)throw Error('Release profile requires a real, consented, mastered soundtrack');
 return Object.freeze({profile,...spec,seconds,frames:Math.ceil(seconds*spec.fps),format});
}
export function describeRenderCost(options){
 const spec=validateRenderRequest(options);
 const bytesPerPixel=4,frameBytes=spec.width*spec.height*bytesPerPixel;
 const estimates={frameBytes,canvasAndEncoderBytes:Math.ceil(frameBytes*5.5),
   audioBytes:Math.ceil(spec.seconds*48000*4*2),estimatedVideoBytes:Math.ceil(spec.bitrate/8*spec.seconds*1.45)};
 return Object.freeze({...estimates,estimatedRequiredBytes:
   estimates.canvasAndEncoderBytes+estimates.audioBytes+estimates.estimatedVideoBytes});
}
export async function inspectBrowserExport({profile='master',seconds=5,
 global=globalThis}={}){
 const req=validateRenderRequest({profile,seconds});
 const warnings=[],errors=[];
 const secure=global.isSecureContext===true||
   ['localhost','127.0.0.1'].includes(global.location?.hostname);
 if(!secure)errors.push('HTTPS required for the browser encoder and local file storage');
 const browser={secure,webgl2:false,codecH264:false,codecAAC:false,videoEncoder:false,
   audioEncoder:false,storageEstimate:null,persistentStorage:null};
 try{
   const canvas=global.document?.createElement('canvas');
   const context=canvas?.getContext('webgl2');
   browser.webgl2=!!context;
   context?.getExtension('WEBGL_lose_context')?.loseContext();
 }catch{browser.webgl2=false}
 if(!browser.webgl2)errors.push('WebGL2 unavailable: cannot create scene frames');
 browser.videoEncoder=typeof global.VideoEncoder==='function';
 browser.audioEncoder=typeof global.AudioEncoder==='function';
 if(browser.videoEncoder){
   for(const codec of ['avc1.640033','avc1.4d0033','avc1.420033']){
     try{const r=await global.VideoEncoder.isConfigSupported({codec,width:req.width,
       height:req.height,bitrate:req.bitrate,framerate:req.fps,hardwareAcceleration:'no-preference'});
       if(r.supported){browser.codecH264=true;browser.h264Codec=codec;break}}catch{}
   }
 }
 if(browser.audioEncoder){
   try{browser.codecAAC=Boolean((await global.AudioEncoder.isConfigSupported({
      codec:'mp4a.40.2',sampleRate:48000,numberOfChannels:2,bitrate:192000})).supported)}catch{}
 }
 if(!browser.codecH264)errors.push('H.264 VideoEncoder unsupported at requested resolution; do not export silent/fake MP4');
 if(!browser.codecAAC)errors.push('AAC AudioEncoder unsupported; stop or choose a user-visible compatible workflow');
 const storage=global.navigator?.storage;
 if(storage?.estimate){
   try{const data=await storage.estimate();
     browser.storageEstimate={quota:data.quota,usage:data.usage};
     const estimate=describeRenderCost({profile,seconds});
     if(data.quota-data.usage<estimate.estimatedRequiredBytes)
       errors.push('Insufficient storage quota for a reliable output/recovery buffer');
     else if(data.quota-data.usage<estimate.estimatedRequiredBytes*2)
       warnings.push('Storage margin is low; download your project backup first');
     browser.persistentStorage=storage.persisted?await storage.persisted():null;
   }catch{warnings.push('Storage quota unavailable: export only after local backup')}
 }else warnings.push('Persistent storage API unavailable; autosave cannot be assumed');
 return {ready:errors.length===0,request:req,browser,errors,warnings,
   fallback:'If no supported H.264/AAC encoder exists, offer PNG frames or export from another supported device; never present WebM renamed as MP4.'};
}
export function createExportSession(options){
 const req=validateRenderRequest(options),controller=new AbortController();
 let state='idle',frame=0,disposed=false;
 const needState=v=>{if(disposed)throw Error('Export was disposed');if(state!==v)throw Error('Invalid export transition: '+state)};
 return Object.freeze({
  start:()=>{needState('idle');state='rendering';return {state,frames:req.frames}},
  frame:(index)=>{needState('rendering');if(controller.signal.aborted)throw controller.signal.reason;
    if(!Number.isInteger(index)||index!==frame||index>=req.frames)
      throw Error('Frames must be rendered once, in order, with no gaps');
    frame++;return {done:frame,total:req.frames,progress:frame/req.frames}},
  finish:()=>{needState('rendering');if(frame!==req.frames)throw Error('Cannot finish missing frames');
    state='verifying';return {state}},
  verified:(report)=>{needState('verifying');
    if(!report||report.fullDecode!==true||report.codec!=='h264'||report.audio!=='aac'||
      report.frames!==req.frames||report.width!==req.width||report.height!==req.height)
      throw Error('Decoded MP4 verification failed; do not publish the file');
    state='complete';return{state,report}},
  abort:(reason='User cancelled export')=>{if(disposed)return;controller.abort(Error(reason));state='cancelled';return{state}},
  dispose:()=>{disposed=true;controller.abort(Error('Export disposed'));state='disposed'},
  get status(){return{state,frame,total:req.frames,progress:frame/req.frames,cancelled:controller.signal.aborted}},
  get signal(){return controller.signal}
 });
}