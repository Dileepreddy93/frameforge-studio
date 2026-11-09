#!/usr/bin/env node
// Independent verification of the final customer-delivered MP4.
// Only FFmpeg, FFprobe and Node built-ins; does not trust browser claims.
'use strict';
const fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto');
function execute(bin,args,{maxBuffer=24*1024*1024,timeout=360000}={}){
 const r=cp.spawnSync(bin,args,{encoding:null,maxBuffer,timeout});
 if(r.error)throw new Error(bin+': '+r.error.message);
 if(r.status!==0)throw new Error(bin+' exited '+r.status+': '+String(r.stderr||'').slice(-1800));
 return r;
}
function analyzeGray(raw){
 if(!raw?.length)throw Error('Empty decoded video frame');
 let total=0,square=0,black=0,bright=0;
 for(const v of raw){total+=v;square+=v*v;if(v<=12)black++;if(v>=35)bright++}
 const mean=total/raw.length,standardDeviation=Math.sqrt(Math.max(0,square/raw.length-mean*mean));
 return {mean:+mean.toFixed(2),std:+standardDeviation.toFixed(2),
   blackFraction:+(black/raw.length).toFixed(4),visibleFraction:+(bright/raw.length).toFixed(4),
   hash:crypto.createHash('sha256').update(raw).digest('hex')};
}
function sampleFrame(file,seconds){
 const raw=execute('ffmpeg',['-hide_banner','-nostdin','-v','error','-ss',seconds.toFixed(3),
  '-i',file,'-frames:v','1','-vf','scale=144:256:flags=bicubic,format=gray',
  '-f','rawvideo','pipe:1'],{maxBuffer:1000000,timeout:120000}).stdout;
 if(raw.length!==144*256)throw Error('Sampled frame has unexpected pixels at '+seconds.toFixed(3)+'s');
 return analyzeGray(raw);
}
function getAudioLevels(file){
 const result=execute('ffmpeg',['-hide_banner','-nostdin','-v','info','-i',file,
  '-map','0:a:0','-vn','-af','volumedetect','-f','null','-'],
 {maxBuffer:8*1024*1024,timeout:360000});
 const log=String(result.stderr);
 const mean=Number(log.match(/mean_volume:\s*(-?[\d.]+)\s*dB/)?.[1]),
  max=Number(log.match(/max_volume:\s*(-?[\d.]+)\s*dB/)?.[1]);
 if(!Number.isFinite(mean)||!Number.isFinite(max))throw Error('FFmpeg could not measure final AAC content');
 return {meanDb:mean,maxDb:max};
}
function verifyFilm(file,{width=1080,height=1920,fps=30,minSeconds=30,maxSeconds=60,
 minVisibleStd=4,minAudioMeanDb=-50}={}){
 if(!fs.existsSync(file))throw Error('Film does not exist: '+file);
 const probe=JSON.parse(execute('ffprobe',['-v','error','-count_frames',
   '-show_entries','stream=codec_type,codec_name,width,height,r_frame_rate,nb_read_frames,sample_rate,channels:format=duration,size',
   '-of','json',file],{timeout:240000}).stdout.toString('utf8'));
 const video=probe.streams?.find(s=>s.codec_type==='video'),audio=probe.streams?.find(s=>s.codec_type==='audio');
 if(!video||!audio)throw Error('Completed MP4 must contain BOTH video and audio');
 const duration=Number(probe.format?.duration),frames=Number(video.nb_read_frames);
 if(video.codec_name!=='h264'||audio.codec_name!=='aac')throw Error('Expected real H264/AAC, got '+video.codec_name+'/'+audio.codec_name);
 if(video.width!==width||video.height!==height)throw Error('Wrong video size: '+video.width+'×'+video.height);
 const fraction=/^(\d+)\/(\d+)$/.exec(video.r_frame_rate||'');
 const actualFps=fraction?Number(fraction[1])/Number(fraction[2]):Number(video.r_frame_rate);
 if(Math.abs(actualFps-fps)>.02)throw Error('Expected '+fps+' fps, got '+actualFps);
 if(!Number.isFinite(duration)||duration<minSeconds||duration>maxSeconds+.12)
   throw Error('Uncertified film duration: '+duration);
 const expected=Math.floor(duration*fps);
 if(!Number.isInteger(frames)||Math.abs(frames-expected)>2)
   throw Error('Missing decoded frames: '+frames+' vs expected '+expected);
 if(audio.channels!==2||Number(audio.sample_rate)!==48000)
   throw Error('Master audio must be real 48 kHz stereo');
 execute('ffmpeg',['-hide_banner','-nostdin','-v','error','-xerror','-i',file,'-f','null','-'],{timeout:900000});
 const at=[.15,duration*.25,duration*.5,duration*.75,duration-.25];
 const screenshots=at.map((t,i)=>({time:+t.toFixed(3),...sampleFrame(file,t)}));
 const audioLevels=getAudioLevels(file);
 if(audioLevels.meanDb<minAudioMeanDb||audioLevels.maxDb<minAudioMeanDb+10)
   throw Error('Silent or unacceptably low-level AAC soundtrack: '+JSON.stringify(audioLevels));
 if(audioLevels.maxDb>.2)
   throw Error('Clipped AAC audio: '+JSON.stringify(audioLevels));
 if(screenshots.every(s=>s.std<minVisibleStd))
   throw Error('Every independently decoded film sample is visually empty or monochrome');
 if(new Set(screenshots.map(s=>s.hash)).size<2)
   throw Error('Long film has no measurable visual variation across five samples');
 return {
   verdict:'FRAMEFORGE_FULL_DELIVERY_VERIFIED',file,codec:'H264/AAC',
   width,height,fps,frames,seconds:duration,fullDecode:true,
   soundtrack:audioLevels,framesSampled:screenshots.length,
   samples:screenshots,bytes:fs.statSync(file).size,
   checks:['full external frame-and-audio decode','H264/AAC streams','dimensions and fps',
     'frame count','30–60s length','48 kHz stereo','measurably audible nonclipped soundtrack',
     'five nonidentical decodable visual samples'],
   limitations:['Does not establish artistic quality or clear speech by ear',
     'Does not prove lip-sync quality, captions, legal music rights or mobile performance']
 };
}
if(require.main===module){
 try{
  const f=process.argv[2];if(!f)throw Error('Usage: node tools/verify-hybrid-delivery.cjs path/to/film.mp4');
  console.log(JSON.stringify(verifyFilm(f),null,2));
 }catch(e){console.error('FRAMEFORGE_DELIVERY_FAIL '+e.message);process.exitCode=1}
}
module.exports={analyzeGray,verifyFilm};