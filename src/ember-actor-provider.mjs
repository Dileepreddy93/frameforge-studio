// FrameForge Ultimate P2 — Ember built-in character adapter, isolated from V6.
// Original cast templates/look defaults are taken from Ember dist/timeline.js
// @ 22c745ffdc2d6411707f3a9bbe5bd70b10f9d9db (MIT).
import * as T from '../vendor/three@0.180.0/three.module.min.js';
import {buildCharacter,animateCharacter,drawFace,headWorld,disposeCharacter} from './ember-character-engine.mjs';

export const TEMPLATE_IDS=Object.freeze(['creator','human','robot','creature','bot','mascot','dev','blue','orange']);
export const KINDS=Object.freeze(['human','robot','creature','bot','mascot']);
export const EMOTIONS=Object.freeze(['neutral','happy','sad','angry','surprised','worried','curious','idea']);
export const LOOK_DEFAULTS=Object.freeze({
  height:1,build:1,head:1,species:'fox',hairStyle:'shaggy',facialHair:'none',
  eyeStyle:'glossy',topStyle:'hoodie',glasses:'none',hat:'none',shape:'block',
  prop:'none',stance:'stand',skin:'#c78a65',hair:'#2a211e',eyes:'#1b1514',
  top:'#2e3a55',accent:'#c9b8a4',bottom:'#1b222c',shoes:'#d6cbb5',screen:'#94f3d4'
});
export const TEMPLATES=Object.freeze({
  creator:{kind:'human',voice:'am_puck',look:{head:1.22,build:.95,height:1}},
  human:{kind:'human',voice:'af_bella',look:{hairStyle:'long',top:'#b5543f',accent:'#f0d9b5',skin:'#e0a57f',hair:'#5a3422',eyeStyle:'glossy',topStyle:'jacket',bottom:'#2b3346'}},
  robot:{kind:'robot',voice:'am_echo',look:{top:'#8aa1ad',accent:'#3d4650',screen:'#7fd6ff',bottom:'#3d4650',shoes:'#2b3036'}},
  creature:{kind:'creature',voice:'af_sky',look:{species:'fox',skin:'#d9793d',hair:'#2a1e1a',top:'#3f6b58',accent:'#f2e2c9',bottom:'#2d3a33',eyeStyle:'glossy'}},
  bot:{kind:'bot',voice:'af_nova',look:{top:'#4f8fd6',accent:'#2e3440',screen:'#ffd27a'}},
  mascot:{kind:'mascot',voice:'af_sky',look:{shape:'block',top:'#e8743c',accent:'#c9572e',eyes:'#1c1310'}},
  // The FrameForge cast from the V6 episodes, rebuilt in the Creator's style (owner decision 2026-11-09). Colours from
  // STYLE.md and design/robot-forms.js: DEV's warm-brown skin, teal hoodie, black hair and round glasses; BLUE a
  // blue-shell bot with a light-blue face; ORANGE an orange-shell robot with an amber face; violet joints.
  dev:{kind:'human',voice:'am_michael',look:{hairStyle:'chunky',glasses:'round',topStyle:'hoodie',head:1.25,
    skin:'#c66c48',hair:'#120806',top:'#3d5d66',accent:'#b098b1',bottom:'#232a3a',shoes:'#d6cbb5'}},
  blue:{kind:'bot',voice:'af_heart',look:{top:'#4f7fae',accent:'#5c6fb8',screen:'#79c5ff'}},
  orange:{kind:'robot',voice:'bm_george',look:{top:'#d0703a',accent:'#5c6fb8',screen:'#ffc15a',bottom:'#3b2a40',shoes:'#1c1b30'}}
});
export const FACES=Object.freeze({
  neutral:{brow:0,raise:0,eye:1,smile:.05,tilt:0,down:0,open:0},
  happy:{brow:-.05,raise:.03,eye:.74,smile:.9,tilt:.05,down:-.03,open:0},
  sad:{brow:.32,raise:-.01,eye:.72,smile:-.7,tilt:.06,down:.12,open:0},
  angry:{brow:-.4,raise:-.04,eye:.78,smile:-.45,tilt:0,down:.06,open:0},
  surprised:{brow:0,raise:.09,eye:1.28,smile:0,tilt:0,down:-.06,open:.3},
  worried:{brow:.24,raise:.02,eye:1.05,smile:-.35,tilt:.03,down:.04,open:0},
  curious:{brow:.1,raise:.05,eye:1.05,smile:.15,tilt:.13,down:0,open:0,asym:1},
  idea:{brow:-.08,raise:.07,eye:1.12,smile:.55,tilt:-.04,down:-.05,open:0}
});
const OPTIONS={
  species:['fox','cat','dragon','bear','bunny'],
  hairStyle:['shaggy','chunky','short','curly','long','bun','mohawk','bald'],
  facialHair:['none','stubble','beard','mustache'],
  eyeStyle:['glossy','classic'],
  topStyle:['hoodie','tshirt','jacket','suit'],
  glasses:['none','round','square'],
  hat:['none','cap','beanie','headphones'],
  shape:['block','round','bean'],
  prop:['none','phone','mug','book','tablet','coffee'],
  stance:['stand','sit']
};
const COLOR_KEYS=new Set(['skin','hair','eyes','top','accent','bottom','shoes','screen']);
const RANGE={height:[.8,1.2],build:[.75,1.35],head:[.85,1.3]};
const copy=x=>JSON.parse(JSON.stringify(x));
// Original, deterministic facial micro-performance. Derived ONLY from film
// time and stable character identity: seek/replay/export are pixel repeatable.
// A blink takes ~180 ms, occurring every ~3-4 seconds, with no state or RNG.
export function facialMicroPerformance(time,seed=0,listenerDirection=0){
  if(!Number.isFinite(time)||time<0||!Number.isFinite(seed)||
     !Number.isFinite(listenerDirection)||Math.abs(listenerDirection)>1)
    throw RangeError('Facial micro-performance requires valid absolute time and direction');
  const identity=Math.abs(Math.floor(seed)),cycle=3.05+(identity%5)*.21;
  const first=1.18+(identity%4)*.14;
  const phase=((time-first)%cycle+cycle)%cycle;
  const distance=Math.min(phase,cycle-phase);
  const pulse=Math.max(0,1-distance/.11);
  const blink=1-.93*(pulse*pulse*(3-2*pulse));
  const period=1.85+(identity%3)*.13;
  const scaled=time/period,n=Math.floor(scaled),blend=Math.min(1,(scaled-n)/.12);
  const ease=blend*blend*(3-2*blend);
  const prev=Math.sin((n-1)*2.43+identity*.71)*.2;
  const next=Math.sin(n*2.43+identity*.71)*.2;
  const gaze=Math.max(-.65,Math.min(.65,listenerDirection*.36+prev*(1-ease)+next*ease));
  return {blink,gaze};
}
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const safeText=s=>typeof s==='string'&&s.length>0&&s.length<=80;
export function normalizeLook(input={}){
  if(!isObj(input))throw TypeError('Appearance must be a plain object');
  const out={...LOOK_DEFAULTS};
  for(const [key,value] of Object.entries(input)){
    if(!(key in LOOK_DEFAULTS))throw Error('Unknown Ember appearance field '+key);
    if(COLOR_KEYS.has(key)){
      if(typeof value!=='string'||!/^#[0-9a-f]{6}$/i.test(value))throw Error('Color '+key+' must be #RRGGBB');
      out[key]=value.toLowerCase();
    }else if(key in RANGE){
      const [min,max]=RANGE[key];
      if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)
        throw RangeError(key+' must be '+min+'–'+max);
      out[key]=value;
    }else{
      if(!OPTIONS[key]?.includes(value))throw Error('Unsupported '+key+' option');
      out[key]=value;
    }
  }
  return out;
}
export function createCharacterConfig({id,name,template='creator',look={},style='smooth'}={}){
  if(typeof id!=='string'||!/^[a-z][a-z0-9-]{0,39}$/.test(id))throw TypeError('Safe actor id required');
  if(!safeText(name))throw TypeError('Character name required');
  if(!Object.hasOwn(TEMPLATES,template))throw Error('Unknown Ember template '+template);
  if(!['smooth','lowpoly'].includes(style))throw Error('Unsupported character style');
  const t=TEMPLATES[template],normalized=normalizeLook({...t.look,...look});
  return {id,name,kind:t.kind,voice:t.voice,look:normalized,style};
}
export function registerEmberCharacters(registry,{scene,positions={},cameraPosition=[0,3,7]}={}){
  if(!scene||typeof scene.add!=='function'||typeof scene.remove!=='function')
    throw TypeError('A Three.js scene is required');
  const eye=new T.Vector3(...cameraPosition);
  const scenePoint=new T.Vector3(0,2,-3);
  registry.registerActor('procedural',({actor,descriptor})=>{
    const config=createCharacterConfig({id:actor.id,name:actor.name,template:descriptor.template,
      look:descriptor.look||{},style:descriptor.style||'smooth'});
    const rig=buildCharacter(config,config.style);
    const origin=positions[actor.id]||[0,0,0];
    if(!Array.isArray(origin)||origin.length!==3||!origin.every(Number.isFinite))
      throw TypeError('Invalid actor stage coordinates');
    rig.root.position.set(...origin);
    rig.baseY=origin[1];scene.add(rig.root);
    const point=new T.Vector3();
    let disposed=false,pose=null,lastFrame=null;
    return {
      setPose(time,shot,performance){
        if(disposed)throw Error('Actor already disposed');
        if(!Number.isFinite(time)||time<0)throw RangeError('Invalid absolute time');
        const emotion=EMOTIONS.includes(performance?.emotion)?performance.emotion:'neutral';
        const raw=performance?.action||'none';
        const action=raw==='listen'?'none':raw==='typing'?'type':raw==='react'?'nod':
          raw==='question'?'shrug':raw==='plead'?'handsup':raw==='alarm'?'handsup':
          raw==='surprise'?'handsup':raw==='defeat'?'facepalm':raw==='announce'?'explain':
          raw==='celebrate'?'cheer':raw==='anticipate'?'think':raw;
        // Original Ember gesture animation is pure in t, so video/export and seek agree.
        const speech=shot.speaker===actor.id;
        const dur=Number.isFinite(shot.duration)?shot.duration:3;
        const local=(time-Math.max(0,time-dur));
        const intensity=speech?.45+.30*Math.abs(Math.sin(time*6+rig.seed)):.05;
        const ctx={t:time,talk:speech?intensity:0,beat:speech?Math.abs(Math.sin(time*3+rig.seed))*.3:0,
          face:{...FACES[emotion],emotion},action:{name:action,k:action==='none'?0:1,local,dur},
          baseY:origin[1],cueIndex:0,nod:0,walk:0,sit:config.look.stance==='sit'?1:0,
          look:eye,partner:eye,screen:scenePoint,key:scenePoint,camera:eye};
        animateCharacter(rig,ctx);
        const other=positions[shot.speaker]?.[0]??origin[0];
        const direction=speech?0:Math.sign(other-origin[0]);
        const micro=facialMicroPerformance(time,rig.seed,direction);
        drawFace(rig,{open:speech?intensity:0,wide:1,round:0,teeth:speech?.3:0,tongue:0},
          ctx.face,micro.blink,micro.gaze,time);
        pose={time,emotion,action,speaking:speech};
        lastFrame={time,face:ctx.face,...micro};
      },
      // P6 optional acoustic control. Applied after setPose() at the same
      // absolute time; replaces the P2 demo's approximate mouth motion.
      setSpeech(cue){
        if(disposed||!lastFrame)throw Error('Set a valid actor pose before audio');
        if(!cue||typeof cue.mouthOpen!=='number'||!Number.isFinite(cue.mouthOpen)||
           cue.mouthOpen<0||cue.mouthOpen>1)throw RangeError('Invalid mouth control');
        const round=cue.viseme==='round'?1:0,wide=cue.viseme==='wide'?1.3:1;
        drawFace(rig,{open:cue.mouthOpen,wide,round,
          teeth:cue.viseme==='teeth'?.5:0,tongue:0},
          lastFrame.face,lastFrame.blink,lastFrame.gaze,lastFrame.time);
        pose.audioDriven=true;pose.mouthOpen=cue.mouthOpen;
      },
      getAnchors(){
        if(disposed)throw Error('Actor already disposed');
        const head=rig.head.getWorldPosition(point);
        return {root:rig.root.getWorldPosition(new T.Vector3()).toArray(),head:head.toArray()};
      },
      getRig:()=>rig,
      getConfig:()=>copy(config),
      getPose:()=>pose?{...pose}:null,
      dispose(){
        if(disposed)return;disposed=true;
        scene.remove(rig.root);disposeCharacter(rig);
      }
    };
  });
}
