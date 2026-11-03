// P7/P8 real browser-only H264/AAC MP4 encoder for voiced V2 projects.
// Calls real Ember scene engine on every frame; verifies first/last decodes.
// No server, no cloud fees, no false WebM-as-MP4 or silent soundtrack.
import * as M from '../vendor/mediabunny@1.62.1/mediabunny.mjs';
const {Output,BufferTarget,Mp4OutputFormat,CanvasSource,AudioBufferSource,Quality,
 canEncodeAudio,canEncodeVideo,Input,BlobSource,ALL_FORMATS,VideoSampleSink}=M;
const FPS=30;
let active=false;
export async function exportHybridFilm(engine,{width=720,seconds=null,onProgress=()=>{},signal}={}){
 if(active)throw Error('Another export is currently active');
 if(![360,720,1080].includes(width))throw Error('Select a supported 9:16 resolution');
 if(!engine||typeof engine.frameAt!=='function'||typeof engine.getExportAudio!=='function')
   throw Error('No loaded hybrid editor project');
 const height=width*16/9;
 const project=engine.getEditableProject(),duration=project.shots.reduce((n,s)=>n+s.duration,0);
 const length=seconds??duration;
 if(!Number.isFinite(length)||length<=0||length>60||length>duration+.005)
   throw RangeError('Current beta supports up to 60 seconds of a fully voiced project');
 if(typeof VideoEncoder!=='function'||!await canEncodeVideo('avc',{width,height}))
   throw Error('H264 is unavailable at this size. Try Chrome/Edge on a supported computer.');
 if(typeof AudioEncoder!=='function'||!await canEncodeAudio('aac'))
   throw Error('AAC is unavailable. MP4 export is disabled rather than creating a misleading incompatible file.');
 const audio=engine.getExportAudio(),frames=Math.floor(length*FPS);
 if(!frames||frames>1800)throw RangeError('Invalid number of frames');
 if(signal?.aborted)throw signal.reason||Error('Export cancelled');
 if(audio.sampleRate!==48000||audio.left.length!==audio.right.length)
   throw Error('Mastered stereo audio must be 48kHz');
 if(audio.left.length<Math.round(length*48000)-100)
   throw Error('Voice master shorter than requested export');
 // Measure the REAL browser export path without estimating frame cost from
 // timestamps or attributing offline synthesis time to video encoding.
 const clock=()=>performance.now();
 const stageMs={renderer:0,canvasTransfer:0,encoder:0,finalize:0};
 const exportStarted=clock();
 const output=new Output({format:new Mp4OutputFormat(),target:new BufferTarget()});
 let video=null,track=null;
 const oldSize={width:360,height:640};
 active=true;
 try{
   engine.setOutputResolution(width,height);
   // The renderer lives inside a same-origin iframe. Mediabunny validates
   // HTMLCanvasElement in the caller's realm, so an iframe canvas fails
   // instanceof and cannot be encoded despite an available H264 codec.
   // Copy the actual pixel buffer to a parent-realm canvas at native size.
   const encodeSurface=document.createElement('canvas');
   encodeSurface.width=width;encodeSurface.height=height;
   const encodeCtx=encodeSurface.getContext('2d',{alpha:false});
   if(!encodeCtx)throw Error('Unable to create an H264 frame surface');
   const sourceSurface=engine.getSurface();
   video=new CanvasSource(encodeSurface,{codec:'avc',
     quality:new Quality({bitrate:width===1080?8000000:width===720?4200000:1200000}),
     keyFrameInterval:2,hardwareAcceleration:'no-preference'});
   track=new AudioBufferSource({codec:'aac',quality:new Quality({bitrate:192000})});
   output.addVideoTrack(video);output.addAudioTrack(track);
   const lengthSamples=Math.round(frames/FPS*48000);
   const audioBuffer=new AudioBuffer({numberOfChannels:2,sampleRate:48000,length:lengthSamples});
   audioBuffer.copyToChannel(audio.left.subarray(0,lengthSamples),0);
   audioBuffer.copyToChannel(audio.right.subarray(0,lengthSamples),1);
   await output.start();
   await track.add(audioBuffer);track.close();track=null;
   for(let i=0;i<frames;i++){
     if(signal?.aborted)throw signal.reason||new DOMException('Export cancelled','AbortError');
     let mark=clock();
     engine.frameAt(i/FPS,false);
     stageMs.renderer+=clock()-mark;
     mark=clock();
     encodeCtx.drawImage(sourceSurface,0,0,width,height);
     stageMs.canvasTransfer+=clock()-mark;
     mark=clock();
     await video.add(i/FPS,1/FPS);
     stageMs.encoder+=clock()-mark;
     if(i%5===0||i===frames-1){
       onProgress({done:i+1,total:frames,progress:(i+1)/frames});
       await new Promise(resolve=>setTimeout(resolve,0));
     }
   }
   let mark=clock();
   video.close();video=null;await output.finalize();
   stageMs.finalize=clock()-mark;
   const raw=output.target.buffer;
   if(!raw||raw.byteLength<1024)throw Error('H264 writer returned an empty file');
   const file=new Blob([raw],{type:'video/mp4'});
   const input=new Input({source:new BlobSource(file),formats:ALL_FORMATS});
   let summary;
   try{
     const [v,a]=await Promise.all([input.getPrimaryVideoTrack(),input.getPrimaryAudioTrack()]);
     if(!v||!a)throw Error('The exported MP4 is missing its video or audio track');
     const [codec,w,h,stats,dur,aCodec,ch,rate]=await Promise.all([
       v.getCodec(),v.getDisplayWidth(),v.getDisplayHeight(),v.computePacketStats(),v.computeDuration(),
       a.getCodec(),a.getNumberOfChannels(),a.getSampleRate()]);
     if(codec!=='avc'||aCodec!=='aac'||w!==width||h!==height||
       stats.packetCount!==frames||Math.abs(stats.averagePacketRate-FPS)>.05||
       Math.abs(dur-frames/FPS)>.04||ch!==2||rate!==48000)
       throw Error('The saved MP4 failed codec/frame/duration verification');
     if(!await v.canDecode())throw Error('This browser cannot independently decode the exported H264 frames');
     const sink=new VideoSampleSink(v),first=await sink.getSample(0),
       last=await sink.getSample(Math.max(0,dur-.5/FPS));
     if(!first||!last)throw Error('First/last H264 frame could not be decoded');
     first.close();last.close();
     summary={ok:true,width,height,fps:FPS,frames,seconds:frames/FPS,
       codec:'h264',audio:'aac',audioChannels:2,audioHz:48000,firstAndLastDecode:true,
       bytes:file.size,source:'frameforge.project/2 browser-native WebCodecs + Mediabunny',
       // Wall time also includes cooperative UI yields and container validation;
       // components are non-overlapping and measured on the same 30 fps source.
       performance:{wallMs:Math.round(clock()-exportStarted),
         renderMs:Math.round(stageMs.renderer),
         canvasTransferMs:Math.round(stageMs.canvasTransfer),
         encodeMs:Math.round(stageMs.encoder),
         finalizeMs:Math.round(stageMs.finalize),
         averageFrameRenderMs:+(stageMs.renderer/frames).toFixed(2),
         averageFrameEncodeMs:+(stageMs.encoder/frames).toFixed(2)}};
   }finally{input.dispose?.()}
   return {file,report:summary};
 }catch(e){
   try{await output.cancel()}catch{}
   throw e;
 }finally{
   video?.close();track?.close();active=false;
   try{engine.setOutputResolution(oldSize.width,oldSize.height)}catch{}
 }
}