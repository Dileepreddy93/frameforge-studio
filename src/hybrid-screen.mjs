// P5 single-clock screen application bridge: original Ember on-set app drawing,
// but shot timing, authored rows, placement and audio cues come only from FrameForge v2.
import {drawAppScreen,screenPlan,screenSounds} from './ember-screen-apps.mjs';
import {SFX} from './sound-kit.mjs';
const TYPES=new Set(['terminal','chat','code','inbox','browser','grid']);
const TONES=new Set(['info','calm','alert','success']);
export function buildScreenShot(shot,elapsed){
 if(!shot?.screen)return null;
 const s=shot.screen;
 if(!TYPES.has(s.kind)||!TONES.has(s.tone)||typeof s.title!=='string'||s.title.length>160||
  !Array.isArray(s.lines)||s.lines.length>16||
  s.lines.some(r=>typeof r!=='string'||r.length>120))
  throw Error('Invalid screen app content');
 if(typeof elapsed!=='number'||!Number.isFinite(elapsed)||elapsed<0)throw Error('Invalid screen time');
 const span=shot.duration,plan=screenPlan(s,span);
 const cues=screenSounds(s,span).filter(c=>c.t<=span).map(c=>({
    at:c.t, cue:c.type==='key'?'typing':c.type==='error'?'buzz':c.type==='success'?'chime':'pop'
 }));
 if(cues.some(c=>!SFX.includes(c.cue)))throw Error('Unknown screen effect');
 return {app:s,elapsed:Math.min(elapsed,span),span,plan,cues,caption:shot.caption||null};
}
export function createOnSetScreen({width=1600,height=900}={}){
 if(width!==1600||height!==900)throw Error('Ember screen renderer requires 1600×900 reference canvas');
 if(typeof document==='undefined')throw Error('Canvas drawing requires browser document');
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d',{alpha:false});
 return Object.freeze({
  canvas,
  draw:(shot,elapsed)=>{
    const frame=buildScreenShot(shot,elapsed);
    if(!frame)return false;
    drawAppScreen(ctx,frame.app,frame.elapsed,frame.app.title,frame.span);
    return true;
  }
 });
}
