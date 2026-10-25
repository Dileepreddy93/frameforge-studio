// Build an episode's audio from its JSON: the voice is the clock.
//   node tools/build-audio.mjs projects/zero-latency.frameforge.json
// 1. (Re)generates voice lines with tools/voice_lines.py when the text, voice or speaker's emotion changed.
// 2. Sets each shot's duration = timing.lead + line length + timing.pauseAfter (frame-rounded).
// 3. Places the lines on one voice track, synthesises music and sound effects from the cue lists,
//    ducks the music under speech and masters to -14 LUFS / <= -1 dBTP.
// 4. Writes audio/<id>/mix.mp3 and voice.mp3 and updates the project's durations and audio URLs.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {RATE,sfx,music} from '../src/sound-kit.mjs';
import core from '../src/project-core.js';

const FPS=30,LUFS=-14,TRUE_PEAK=-1.5;  // -1.5 leaves room for codec overshoot under the -1 dBTP limit
const projectFile=process.argv[2];
if(!projectFile)throw new Error('usage: node tools/build-audio.mjs <project.json>');
const project=JSON.parse(fs.readFileSync(projectFile,'utf8'));
core.assertProject(project);
const outDir=path.join('audio',project.id),linesDir=path.join(outDir,'lines'),work=path.join(outDir,'.work');
fs.mkdirSync(work,{recursive:true});
const ffmpeg=(...args)=>execFileSync('ffmpeg',['-hide_banner','-nostats','-y',...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']});

// --- 1. voice lines ---------------------------------------------------------------------
const voiceOf=Object.fromEntries(project.characters.map(c=>[c.id,c.voice.kokoro]));
// The speaker's emotion, as tools/voice_lines.py reads it.
const lineEmotion=s=>s.cast?.[s.speaker]?.emotion??(s.speaker==='dev'?s.acting?.devEmotion:null)??'neutral';
const readManifest=()=>{try{return JSON.parse(fs.readFileSync(path.join(linesDir,'lines.json'),'utf8'))}catch{return null}};
const stale=m=>!m||project.shots.some(s=>{const l=m.lines.find(x=>x.shot===s.id),v=voiceOf[s.speaker];
 return !l||l.text!==s.dialogue||l.voice!==v?.voice||l.speed!==(v?.speed??1)||(l.emotion??'neutral')!==lineEmotion(s)||!fs.existsSync(path.join(linesDir,l.file))});
let manifest=readManifest();
if(stale(manifest)){
 console.log('Generating voice lines…');
 execFileSync('.venv/bin/python',['-I','tools/voice_lines.py','episode',projectFile,linesDir],{stdio:'inherit'});
 manifest=readManifest();
 if(stale(manifest))throw new Error('Voice lines still do not match the script');
}
const line=Object.fromEntries(manifest.lines.map(l=>[l.shot,l]));

// --- 2. timing ----------------------------------------------------------------------------
let clock=0;
const placed=project.shots.map(s=>{
 const lead=s.timing?.lead??.15,pause=s.timing?.pauseAfter??.35,seconds=line[s.id].seconds;
 s.duration=Math.round((lead+seconds+pause)*FPS)/FPS;
 s.voice={file:'lines/'+line[s.id].file,seconds};
 const at={id:s.id,start:clock,lead,seconds,duration:s.duration};
 clock=Math.round((clock+s.duration)*FPS)/FPS;
 return at;
});
const total=clock;
const shotAt=Object.fromEntries(placed.map(p=>[p.id,p]));

// --- 3. tracks ------------------------------------------------------------------------------
function writeWav(file,channels){
 const n=channels[0].length,data=Buffer.alloc(n*channels.length*4);
 for(let i=0;i<n;i++)channels.forEach((c,ch)=>data.writeFloatLE(c[i],(i*channels.length+ch)*4));
 const h=Buffer.alloc(44);
 h.write('RIFF',0);h.writeUInt32LE(36+data.length,4);h.write('WAVE',8);h.write('fmt ',12);
 h.writeUInt32LE(16,16);h.writeUInt16LE(3,20);h.writeUInt16LE(channels.length,22);h.writeUInt32LE(RATE,24);
 h.writeUInt32LE(RATE*channels.length*4,28);h.writeUInt16LE(channels.length*4,32);h.writeUInt16LE(32,34);
 h.write('data',36);h.writeUInt32LE(data.length,40);
 fs.writeFileSync(file,Buffer.concat([h,data]));
}
// Voice: every line at its shot start + lead.
const voiceInputs=placed.flatMap(p=>['-i',path.join(linesDir,line[p.id].file)]);
const voiceGraph=placed.map((p,i)=>`[${i}]adelay=${Math.round((p.start+p.lead)*1000)}:all=1[v${i}]`).join(';')+';'+
 placed.map((_,i)=>`[v${i}]`).join('')+`amix=inputs=${placed.length}:normalize=0,apad=whole_dur=${total},atrim=0:${total}`;
ffmpeg(...voiceInputs,'-filter_complex',voiceGraph,'-ar',String(RATE),'-ac','1','-c:a','pcm_f32le',path.join(work,'voice.wav'));

// Sound effects from each shot's cue list.
const fx=new Float32Array(Math.round(total*RATE));
for(const s of project.shots)for(const cue of s.sfx??[]){
 const sound=sfx(cue.cue),gain=10**((cue.gain??0)/20),start=Math.round((shotAt[s.id].start+cue.at)*RATE);
 for(let i=0;i<sound.length&&start+i<fx.length;i++)fx[start+i]+=sound[i]*gain;
}
writeWav(path.join(work,'sfx.wav'),[fx]);

// Music from the episode cue list; "afterLine" starts just after that shot's line ends.
const cues=(project.audio.music?.cues??[]).map(c=>{const p=shotAt[c.shot];
 return {style:c.style,start:c.at==='afterLine'?p.start+p.lead+p.seconds+.1:p.start}}).sort((a,b)=>a.start-b.start);
writeWav(path.join(work,'music.wav'),music(cues,total,project.audio.music?.bpm??104));

// --- 4. mix and master -----------------------------------------------------------------------
// Music sits low and ducks a further ~8 dB whenever someone speaks.
const mixGraph='[0]asplit=2[vox][key];[2]volume=-15dB[bed];'+
 '[bed][key]sidechaincompress=threshold=0.02:ratio=8:attack=15:release=350:makeup=1[ducked];'+
 '[1]volume=-9dB,aformat=channel_layouts=stereo[fx];[vox]aformat=channel_layouts=stereo[voxs];'+
 '[voxs][fx][ducked]amix=inputs=3:normalize=0';
const pre=path.join(work,'premaster.wav');
ffmpeg('-i',path.join(work,'voice.wav'),'-i',path.join(work,'sfx.wav'),'-i',path.join(work,'music.wav'),'-filter_complex',mixGraph,'-c:a','pcm_f32le',pre);
// ffmpeg prints loudnorm's JSON on stderr; spawnSync captures it without a shell.
const stats=f=>{const r=spawnSync('ffmpeg',['-hide_banner','-nostats','-i',f,'-af',`loudnorm=I=${LUFS}:TP=${TRUE_PEAK}:print_format=json`,'-f','null','-'],{encoding:'utf8'});return JSON.parse(r.stderr.slice(r.stderr.lastIndexOf('{')))};
// Gain to the target, then a brickwall limiter so loud peaks stay under the ceiling. Limiting
// lowers loudness a little, so measure once and add the shortfall back.
const master=path.join(work,'master.wav');
const limitTo=g=>ffmpeg('-i',pre,'-af',`volume=${g.toFixed(2)}dB,alimiter=limit=${(10**((TRUE_PEAK-.5)/20)).toFixed(3)}:attack=2:release=50:level=disabled`,'-c:a','pcm_f32le',master);
let gain=LUFS-Number(stats(pre).input_i);
limitTo(gain);
gain+=LUFS-Number(stats(master).input_i);
limitTo(gain);
ffmpeg('-i',master,'-c:a','libmp3lame','-b:a','192k',path.join(outDir,'mix.mp3'));
// MP3, not AAC: open-source Chromium (Playwright, CI) cannot decode AAC. LAME gapless headers keep
// decoded MP3 sample-aligned with the source (checked in Chrome and Chromium).
ffmpeg('-i',path.join(work,'voice.wav'),'-c:a','libmp3lame','-b:a','64k',path.join(outDir,'voice.mp3'));

project.audio={...project.audio,state:'mastered',masterUrl:`audio/${project.id}/mix.mp3`,voiceUrl:`audio/${project.id}/voice.mp3`,
 audioAlignment:'per_line_voice_clock'};
core.assertProject(project);
fs.writeFileSync(projectFile,JSON.stringify(project,null,2)+'\n');

const final=stats(path.join(outDir,'mix.mp3'));
console.log(`Episode ${project.id}: ${placed.length} shots, ${total.toFixed(2)} s`);
console.log(`Master: ${final.input_i} LUFS integrated, ${final.input_tp} dBTP true peak (targets ${LUFS} LUFS, <= -1 dBTP)`);
