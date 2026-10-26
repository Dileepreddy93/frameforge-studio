// Deliver a raw Kokoro line with an emotion, in place (the offline twin of the browser worker's step).
//   node tools/voice-emotion.mjs <line.wav> <emotion>
//   node tools/voice-emotion.mjs --delivery      prints every emotion's settings as JSON
// Reads a mono 16-bit or float WAV, writes it back as 32-bit float WAV at the same rate.
// tools/voice_lines.py calls this, so both voice paths share src/voice-emotion.js.
import fs from 'node:fs';
import emotion from '../src/voice-emotion.js';

const [file,name]=process.argv.slice(2);
if(file==='--delivery'){
 console.log(JSON.stringify({version:emotion.version,emotions:Object.fromEntries(emotion.emotions.map(e=>[e,emotion.delivery(e)]))}));
 process.exit(0);
}
if(!file||!emotion.emotions.includes(name))throw new Error('usage: node tools/voice-emotion.mjs <line.wav> <'+emotion.emotions.join('|')+'>');

function readWav(buf){
 let at=12,fmt=null,data=null;
 while(at+8<=buf.length){
  const id=buf.toString('ascii',at,at+4),size=buf.readUInt32LE(at+4);
  if(id==='fmt ')fmt={format:buf.readUInt16LE(at+8),channels:buf.readUInt16LE(at+10),rate:buf.readUInt32LE(at+12),bits:buf.readUInt16LE(at+22)};
  if(id==='data')data=buf.subarray(at+8,at+8+size);
  at+=8+size+(size&1);
 }
 if(!fmt||!data||fmt.channels!==1)throw new Error(file+': expected a mono WAV');
 if(!(fmt.format===3&&fmt.bits===32)&&!(fmt.format===1&&fmt.bits===16))throw new Error(file+': expected 16-bit or float WAV');
 const n=data.length/(fmt.bits/8),x=new Float32Array(n);
 for(let i=0;i<n;i++)x[i]=fmt.format===3?data.readFloatLE(i*4):data.readInt16LE(i*2)/32768;
 return {x,rate:fmt.rate};
}
function writeWav(x,rate){
 const h=Buffer.alloc(44),data=Buffer.alloc(x.length*4);
 for(let i=0;i<x.length;i++)data.writeFloatLE(x[i],i*4);
 h.write('RIFF',0);h.writeUInt32LE(36+data.length,4);h.write('WAVE',8);h.write('fmt ',12);
 h.writeUInt32LE(16,16);h.writeUInt16LE(3,20);h.writeUInt16LE(1,22);h.writeUInt32LE(rate,24);
 h.writeUInt32LE(rate*4,28);h.writeUInt16LE(4,32);h.writeUInt16LE(32,34);h.write('data',36);h.writeUInt32LE(data.length,40);
 return Buffer.concat([h,data]);
}
const {x,rate}=readWav(fs.readFileSync(file));
fs.writeFileSync(file,writeWav(emotion.apply(x,rate,name),rate));
