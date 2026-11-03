// Shared hybrid film engine for the controlled beta and exact same CI QA fixture.
// P5/P6 renderer, direction, voices and canvas preview have a SINGLE source of truth.
// No side-effect network telemetry or commercial asset loading.
import * as T from '../vendor/three@0.180.0/three.module.min.js';
import {registerEmberCharacters} from '../src/ember-actor-provider.mjs';
import {solveLimb,effector} from '../src/ember-character-engine.mjs';
import {registerEmberWorlds} from '../src/hybrid-world-provider.mjs';
import {createOnSetScreen,buildScreenShot} from '../src/hybrid-screen.mjs';
import {resamplePCM,retimeForVoice,renderHybridAudio,HYBRID_AUDIO_RATE,speechAt,sampledEnvelope,createKokoroBridge,synthesizeHybridProject} from '../src/hybrid-voice.mjs';
const H=FrameForgeHybridProjectCore,D=FrameForgeHybridDirector,P=FrameForgeHybridProviders;
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.setSize(360,640,false);document.body.append(renderer.domElement);
const scene=new T.Scene();
const camera=new T.PerspectiveCamera(38,360/640,.1,150);
// The original night set left brown faces in deep shadow; expressive eyes and
// mouth were indistinguishable in actual P7 screenshots. Give the authored cast
// a soft, non-shadowing cinematic key/fill/rim without removing the world's
// time-of-day identity. Intensity is deterministic and derived from the project.
const characterKey=new T.DirectionalLight(0xffe1c9,1.15);
characterKey.position.set(3.5,6.8,7.5);characterKey.castShadow=false;
const characterRim=new T.DirectionalLight(0x9bbcff,.55);
characterRim.position.set(-4.5,5.2,-3.3);characterRim.castShadow=false;
const characterFill=new T.HemisphereLight(0xb9caff,0x34334d,.28);
scene.add(characterKey,characterRim,characterFill);
function setArtLighting(world){
 const isNight=world?.time==='night';
 characterKey.intensity=isNight?2.15:1.10;
 characterFill.intensity=isNight?.48:.25;
 characterRim.intensity=isNight?.83:.55;
}
const overlay=document.createElement('canvas');overlay.width=360;overlay.height=640;
const overlayCtx=overlay.getContext('2d',{alpha:false});
const onSet=createOnSetScreen();
const screenTexture=new T.CanvasTexture(onSet.canvas);screenTexture.colorSpace=T.SRGBColorSpace;
const screenPlane=new T.Mesh(new T.PlaneGeometry(3.8,2.14),
  new T.MeshBasicMaterial({map:screenTexture,side:T.DoubleSide,roughness:1}));
screenPlane.position.set(0,2.1,-2.9);screenPlane.visible=false;scene.add(screenPlane);

// Authored procedural story object, not a guessed object or an imported asset.
// Keep one shared mesh/geometry instance and toggle visibility per V2 shot.
const storyLantern=new T.Group();
const lanternMetal=new T.MeshStandardMaterial({color:0x324455,roughness:.68,metalness:.35});
const lanternGlass=new T.MeshStandardMaterial({color:0xffcd69,emissive:0xf2942d,
  emissiveIntensity:1.3,transparent:true,opacity:.82,roughness:.2});
function addLanternPart(geometry,material,y){
 const part=new T.Mesh(geometry,material);part.position.y=y;storyLantern.add(part);
}
addLanternPart(new T.CylinderGeometry(.34,.39,.13,8),lanternMetal,.27);
addLanternPart(new T.CylinderGeometry(.28,.30,.65,8),lanternGlass,.66);
addLanternPart(new T.CylinderGeometry(.34,.32,.12,8),lanternMetal,1.05);
addLanternPart(new T.SphereGeometry(.1,8,6),lanternMetal,1.19);
const lanternHandle=new T.Mesh(new T.TorusGeometry(.22,.05,7,12,Math.PI),lanternMetal);
lanternHandle.position.y=1.31;storyLantern.add(lanternHandle);
for(const x of [-.25,.25])for(const z of [-.25,.25]){
 const bar=new T.Mesh(new T.CylinderGeometry(.025,.025,.72,6),lanternMetal);
 bar.position.set(x,.66,z);storyLantern.add(bar);
}
const lanternLight=new T.PointLight(0xffbb57,1.25,5,2);
lanternLight.position.set(0,.8,0);lanternLight.castShadow=false;
storyLantern.add(lanternLight);
storyLantern.position.set(-.35,0,.72);storyLantern.visible=false;scene.add(storyLantern);
// Deterministic spatial blocking: the lantern follows the actual IK wrist,
// not a screen overlay. All poses are pure functions of shot and absolute time.
const lanternGround=new T.Vector3(-.35,0,.72);
const lanternHandleOffset=new T.Vector3(0,1.31,0);
const smooth01=x=>{const k=Math.max(0,Math.min(1,x));return k*k*(3-2*k)};
function blockLantern(shot,localTime,instances){
 storyLantern.visible=shot.visualProp==='lantern';
 storyLantern.position.copy(lanternGround);
 if(!storyLantern.visible)return null;
 const interaction=shot.propInteraction;
 if(!interaction||interaction.mode==='ground')
   return {mode:'ground',position:storyLantern.position.toArray(),
     focus:storyLantern.position.clone().add(new T.Vector3(0,.83,0)).toArray(),gripError:null};
 const actor=instances.get(interaction.actor),rig=actor?.getRig?.();
 if(!rig?.arms?.[1])throw Error('Authored prop actor has no right-hand rig');
 const arm=rig.arms[1];
 rig.root.updateMatrixWorld(true);
 const shoulder=arm.shoulder.getWorldPosition(new T.Vector3());
 const initial=lanternGround.clone().add(lanternHandleOffset);
 const held=shoulder.clone().add(new T.Vector3(.12,-.38,.57));
 const originalWrist=effector(arm,new T.Vector3());
 let target;
 if(interaction.mode==='reach')target=originalWrist.lerp(initial,smooth01((localTime-.12)/1.2));
 else if(interaction.mode==='lift')target=initial.clone().lerp(held,smooth01((localTime-.12)/(shot.duration*.68)));
 else target=held;
 const pole=shoulder.clone().add(new T.Vector3(1,-.55,-.45));
 solveLimb(arm,target,pole);
 const wrist=effector(arm,new T.Vector3());
 if(interaction.mode==='lift'||interaction.mode==='carry')
   storyLantern.position.copy(wrist).sub(lanternHandleOffset);
 const handleWorld=storyLantern.position.clone().add(lanternHandleOffset);
 return {mode:interaction.mode,actor:interaction.actor,position:storyLantern.position.toArray(),
   focus:storyLantern.position.clone().add(new T.Vector3(0,.83,0)).toArray(),
   gripError:wrist.distanceTo(handleWorld)};
}

const original=await(await fetch('../projects/zero-latency.frameforge.json')).json();
const speechResponse=await fetch('../audio/zero-latency/voice.mp3');
if(!speechResponse.ok)throw Error('Existing V6 synthesized voice track unavailable');
const input=await speechResponse.arrayBuffer();
const ac=new (window.AudioContext||window.webkitAudioContext)();
const decoded=await ac.decodeAudioData(input);await ac.close();
const src=decoded.getChannelData(0),rate=decoded.sampleRate;
const extracted=[
 {start:(original.shots[0].timing?.lead??.15),len:original.shots[0].duration-.5},
 {start:original.shots[0].duration+(original.shots[1].timing?.lead??.15),
  len:original.shots[1].duration-.5}
];
const clip=(from,seconds)=>new Float32Array(src.slice(Math.round(from*rate),Math.round((from+seconds)*rate)));
let session=null,film=null,mix=null,project=null,registry=null;
function prepareProject(variant){
 const p=H.upgradeLegacyProject(original);
 p.id='p56-film-'+variant;
 p.characters=[
 {id:'luna',name:'Luna',visualIdentity:'Original cast original Ember rig',
  voice:{profile:'am_michael',voiceLock:'Synthetic Kokoro local voice'},
  expressions:['neutral','happy','sad','surprised','worried'],sheetStatus:'draft'},
 {id:'atlas',name:'Atlas',visualIdentity:'Independent original robot cast',
  voice:{profile:'af_heart',voiceLock:'Synthetic Kokoro local voice'},
  expressions:['neutral','happy','sad','surprised','worried'],sheetStatus:'draft'}];
 p.hybrid.cast={luna:{provider:'procedural',template:variant===1?'human':'creator'},
   atlas:{provider:'procedural',template:variant===1?'robot':'bot'}};
 p.hybrid.world={provider:'procedural',template:variant===1?'forest':'meadow',time:variant===1?'golden':'night',
   foliage:.07,particles:variant===1?['dust']:['fireflies']};
 p.shots=original.shots.slice(0,2).map((s,i)=>({
  id:s.id,duration:s.duration,speaker:i===0?'luna':'atlas',dialogue:s.dialogue,
  camera:{kind:'actor',target:i===0?'luna':'atlas'},intent:i===0?'intro':'reveal',
  firstFrameStatus:'draft',cast:{[i===0?'luna':'atlas']:{emotion:i===0?'worried':'happy',
    action:i===0?'think':'wave'}}}));
 p.audio={state:'storyboard_only',masterUrl:null,music:{bpm:104,cues:[{shot:'shot-01',style:'groove'}]}};
 return p;
}
const scripts=variant=>[
 '# '+(variant===1?'The Instant Solution':'The Local Studio'),
 '> Two original characters discover the value of creating locally.',
 '@mode '+(variant===2?'one-take':'cuts'),
 '',
 '@shot id=shot-01 duration=2.6333333333 camera=actor:luna move=push transition=cut intent=intro caption=WHO%20NEEDS%20THE%20CLOUD%3F',
 'Luna (worried) [think]: Our app takes twelve seconds to load.',
 '',
 '@shot id=shot-02 duration=1.9333333333 camera='+encodeURIComponent(variant===1?'two:atlas,luna':'screen')+
  ' move=drift transition=blend blend=0.4 intent=reveal caption=BUILD%20IT%20HERE',
 'Atlas (happy) [wave]: I can make it instant.',
 '@reaction actor=luna at=0.4 emotion=surprised action=nod',
 '@screen kind=terminal tone=success title=LOCAL%20BUILD%20STATUS',
 '| > npm run build',
 '| ** Export ready'
].join('\n');
async function create(variant){
 if(![1,2].includes(variant))throw Error('Unknown proof variant');
 session?.dispose();
 project=prepareProject(variant);setArtLighting(project.hybrid.world);
 const parsed=D.scriptToProject(scripts(variant),project);
 if(parsed.errors.length)throw Error('P5 script invalid '+JSON.stringify(parsed.errors));
 project=parsed.project;
 const voiceClips=new Map();
 project.shots.forEach((s,i)=>{
   const pcm=resamplePCM(clip(extracted[i].start,extracted[i].len),rate);
   voiceClips.set(s.id,{samples:pcm,sampleRate:HYBRID_AUDIO_RATE,seconds:pcm.length/HYBRID_AUDIO_RATE,
     speaker:s.speaker,text:s.dialogue,rights:{source:'kokoro-local',consent:true},
     phonemes:''});
 });
 project=retimeForVoice(project,voiceClips);
 // Screen cues are not a second timeline: screenPlan uses the exact shot duration.
 const cues=project.shots.flatMap(s=>buildScreenShot(s,0)?.cues
   .filter((x,i)=>x.cue!=='typing'||i===0).slice(0,3).map(x=>({...x,shotId:s.id}))||[]);
 mix=renderHybridAudio(project,voiceClips,{music:true,screenSounds:cues});
 mix.envelope=sampledEnvelope(mix.voice);
 registry=P.createRegistry();
 registerEmberCharacters(registry,{scene,positions:{luna:[-1,0,0],atlas:[1,0,0]}});
 registerEmberWorlds(registry,{scene,renderer});
 registry.lock();
 session=P.createSession(project,{registry});
 film=variant;
 document.getElementById('msg').textContent='P5/P6 original FrameForge one-clock film '+variant;
 return {variant,shots:project.shots.map(s=>({id:s.id,duration:s.duration,camera:s.camera,
   screen:s.screen?.kind??null,direction:s.direction,caption:s.caption})),
  voices:mix.markers,lufs:mix.lufs,peakDb:mix.peakDb,audioSeconds:mix.duration,
  authoredScript:D.projectToScript(project)};
}
async function loadFresh(modelPrefix='/artifacts/voice-model-samples/fresh-v2-kokoro'){
 const [metadata,masterBytes,voiceBytes]=await Promise.all([
   fetch(modelPrefix+'.json').then(r=>{if(!r.ok)throw Error('Fresh V2 metadata missing');return r.json()}),
   fetch(modelPrefix+'-master.wav').then(r=>{if(!r.ok)throw Error('Fresh stereo master missing');return r.arrayBuffer()}),
   fetch(modelPrefix+'-voice.wav').then(r=>{if(!r.ok)throw Error('Fresh voice track missing');return r.arrayBuffer()})
 ]);
 if(!metadata?.project||metadata.project.schema!==H.schema||
   metadata?.report?.rawModelInference!==true)
   throw Error('Fresh proof requires genuine V2 Kokoro inference metadata');
 const audioContext=new AudioContext({sampleRate:HYBRID_AUDIO_RATE});
 let master,voice;
 try{
   [master,voice]=await Promise.all([
     audioContext.decodeAudioData(masterBytes),audioContext.decodeAudioData(voiceBytes)
   ]);
 }finally{await audioContext.close()}
 if(master.sampleRate!==HYBRID_AUDIO_RATE||master.numberOfChannels!==2||
    voice.sampleRate!==HYBRID_AUDIO_RATE||voice.numberOfChannels!==1)
   throw Error('V2 evidence PCM must be 48kHz stereo master and mono voice');
 session?.dispose();
 project=metadata.project;
 D.verify(project);
 mix={left:new Float32Array(master.getChannelData(0)),
   right:new Float32Array(master.getChannelData(1)),
   voice:new Float32Array(voice.getChannelData(0)),
   markers:metadata.markers,duration:metadata.report.duration,
   peakDb:metadata.report.peakDb,lufs:metadata.report.lufs};
 mix.envelope=sampledEnvelope(mix.voice);
 registry=P.createRegistry();
 registerEmberCharacters(registry,{scene,positions:{luna:[-1,0,0],atlas:[1,0,0]}});
 registerEmberWorlds(registry,{scene,renderer});
 registry.lock();session=P.createSession(project,{registry});
 film='fresh-kokoro';
 return {newText:project.shots.map(x=>x.dialogue),
   markers:mix.markers,duration:mix.duration,projectSchema:project.schema,
   voices:metadata.report.voices,provenance:metadata.report.generator};
}
// P7 editor: never reuse prior movie audio after ANY project edit.
let editableVoiceReady=false,voiceBusy=false;
function loadEditable(source){
 const p=JSON.parse(JSON.stringify(source));
 H.assertProject(p);D.verify(p);
 if(p.schema!==H.schema||p.hybrid.world.provider!=='procedural'||
    p.characters.some(c=>p.hybrid.cast[c.id]?.provider!=='procedural'))
   throw Error('This editor supports built-in Ember cast/world projects. Imported rigs require Asset Lab and are not silently downgraded.');
 if(p.characters.length>6)throw Error('Editor preview currently supports a maximum of six active characters');
 // Explicitly dispose all old assets/sessions before taking control.
 session?.dispose();
 project=p;
 setArtLighting(project.hybrid.world);
 mix=renderHybridAudio(project,new Map(),{music:false});
 mix.envelope=sampledEnvelope(mix.voice);
 registry=P.createRegistry();
 const positionIds=project.characters.map(c=>c.id);
 const positions=Object.fromEntries(positionIds.map((id,i)=>[id,[(i-(positionIds.length-1)/2)*1.8,0,0]]));
 registerEmberCharacters(registry,{scene,positions});
 registerEmberWorlds(registry,{scene,renderer});
 registry.lock();session=P.createSession(project,{registry});
 film='editable';editableVoiceReady=false;
 return {duration:session.duration,shots:project.shots.length,voicesGenerated:false};
}
async function generateEditableVoices(){
 if(voiceBusy)throw Error('Voice synthesis already active');
 if(!session||film!=='editable')throw Error('Open an editable V2 project first');
 const snapshot=JSON.stringify(project);
 voiceBusy=true;
 const bridge=createKokoroBridge({timeoutMs:180000});
 try{
   const screenSounds=project.shots.flatMap(s=>
     buildScreenShot(s,0)?.cues.map(c=>({shotId:s.id,at:c.at,cue:c.cue}))||[]);
   // The verified original code-generated score and interactive-screen effects
   // are mixed at 48 kHz, ducked under speech, and mastered to the same limiter.
   const output=await synthesizeHybridProject(project,{bridge,music:true,screenSounds});
   if(JSON.stringify(project)!==snapshot)throw Error('Project changed during voice generation; output discarded');
   // Synthesis may alter shot lengths; rebuild every provider with its new V2 source.
   loadEditable(output.project);
   mix=output.mix;editableVoiceReady=true;
   return {duration:mix.duration,markers:mix.markers,language:'en',
     voicesGenerated:true,provenance:output.provenance,
     project:JSON.parse(JSON.stringify(project))};
 }finally{bridge.dispose();voiceBusy=false}
}
function getEditableProject(){return JSON.parse(JSON.stringify(project))}
function getExportAudio(){
 if(!editableVoiceReady)throw Error('Generate current dialogue before MP4 export. Silent storyboards cannot be sold as voiced films.');
 return {left:new Float32Array(mix.left),right:new Float32Array(mix.right),
   sampleRate:HYBRID_AUDIO_RATE,duration:mix.duration,peakDb:mix.peakDb,lufs:mix.lufs,
   music:mix.music,effects:mix.effects};
}
function setOutputResolution(width=360,height=640){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<180||height<320||
    width>1080||height>1920||width*16!==height*9)
    throw RangeError('Output must be portrait 9:16, 180×320 through 1080×1920');
 renderer.setPixelRatio(1);
 renderer.setSize(width,height,false);
 camera.aspect=width/height;camera.updateProjectionMatrix();
 overlay.width=width;overlay.height=height;
 return {width:renderer.domElement.width,height:renderer.domElement.height,
   surfacePixels:renderer.domElement.width*renderer.domElement.height};
}
function frameAt(t,encode=true){
 if(!session)throw Error('Not prepared');
 const state=session.seek(t);
 const performance=D.performanceAt(project,t);
 const actors=new Map(session.instances());
 for(const [id,actor] of actors)
   actor.setPose(t,state.shot,performance.cast[id]||{emotion:'neutral',action:'listen'});
 const shot=state.shot,speech=speechAt(project,t,mix,FrameForgeSpeechCore);
 const propPose=blockLantern(shot,state.localTime,actors);
 const alignedAnchors=Object.fromEntries([...actors].map(([id,actor])=>[id,actor.getAnchors()]));
 const stage={...state.worldAnchors,prop:propPose?.focus||[-.35,.83,.72]};
 const pose=D.cameraAt(project,t,alignedAnchors,stage);
 if(storyLantern.visible)lanternLight.intensity=1.2+.12*Math.sin(t*2.4);
 for(const [id,actor] of actors)
   actor.setSpeech(id===shot.speaker&&speech.voiced?speech:{mouthOpen:0,viseme:'rest'});
 const authoredScreen=onSet.draw(shot,state.localTime);
 const ambientScreen=!authoredScreen&&shot.ambientScreen!==false;
 if(ambientScreen)onSet.drawAmbient(project.title,t);
 screenPlane.visible=Boolean(authoredScreen||ambientScreen);
 // Synchronize BOTH the overlay monitor and the complete wooden world sign
 // before rendering, including direct seeks and reverse scrubbing.
 const scenicScreenVisible=session.world().setScreenVisible(screenPlane.visible);
 if(screenPlane.visible)screenTexture.needsUpdate=true;
 camera.position.fromArray(pose.position);camera.lookAt(...pose.target);
 camera.fov=pose.fov;camera.updateProjectionMatrix();
 renderer.render(scene,camera);
 overlayCtx.drawImage(renderer.domElement,0,0,overlay.width,overlay.height);
 if(shot.caption){
   const scale=overlay.width/360;
   overlayCtx.save();overlayCtx.scale(scale,scale);
   overlayCtx.fillStyle='rgba(12,17,24,.88)';
   overlayCtx.fillRect(24,545,312,69);
   overlayCtx.fillStyle='#fff';overlayCtx.font='bold 19px Arial';overlayCtx.textAlign='center';
   overlayCtx.fillText(shot.caption,180,584,294);
   overlayCtx.restore();
 }
 return {image:encode?overlay.toDataURL('image/png'):null,time:t,shot:shot.id,
   activeActor:shot.speaker,voiced:speech.voiced,mouthOpen:speech.mouthOpen,
   viseme:speech.viseme,screen:authoredScreen,ambientScreen,screenVisible:screenPlane.visible,
   scenicScreenVisible,camera:pose,caption:shot.caption,
   reactions:performance.active,propPose};
}
function masterWav(){
 const L=mix.left,R=mix.right,n=Math.min(L.length,R.length);
 const arr=new ArrayBuffer(44+4*n),d=new DataView(arr),u=new Uint8Array(arr);
 const write=(off,str)=>{for(let i=0;i<str.length;i++)u[off+i]=str.charCodeAt(i)};
 write(0,'RIFF');d.setUint32(4,36+4*n,true);write(8,'WAVE');write(12,'fmt ');
 d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,2,true);
 d.setUint32(24,HYBRID_AUDIO_RATE,true);d.setUint32(28,HYBRID_AUDIO_RATE*4,true);
 d.setUint16(32,4,true);d.setUint16(34,16,true);write(36,'data');d.setUint32(40,n*4,true);
 for(let i=0;i<n;i++){
  d.setInt16(44+i*4,Math.max(-32768,Math.min(32767,Math.round(L[i]*32767))),true);
  d.setInt16(46+i*4,Math.max(-32768,Math.min(32767,Math.round(R[i]*32767))),true);
 }
 let result='';for(let i=0;i<u.length;i+=16384)result+=String.fromCharCode(...u.subarray(i,i+16384));
 return btoa(result);
}
window.HybridP56QA={create,loadFresh,loadEditable,generateEditableVoices,getEditableProject,getExportAudio,getSurface:()=>overlay,setOutputResolution,frameAt,masterWav,summary:()=>({film,shots:project?.shots.length,
 cast:project?.characters.map(c=>c.id),world:project?.hybrid.world.template,
 generatedSpeech:false,modelSource:'existing V6 Kokoro speech segments, re-timed through P6'}),
 dispose:()=>{session?.dispose();screenTexture.dispose();screenPlane.geometry.dispose();screenPlane.material.dispose();
 storyLantern.traverse(o=>{o.geometry?.dispose?.()});lanternMetal.dispose();lanternGlass.dispose();renderer.dispose()}};
await create(1);
window.HybridP56Ready=true;
