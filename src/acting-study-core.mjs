/**
 * FrameForge expressive-acting study v1.
 * A deterministic FIVE SECOND SILENT original micro-scene:
 * suspicion -> recognition -> surprise / silent hold -> recovery -> guarded smile.
 * These are genuine GLB morph-target / named humanoid bone parameters.
 * This is NOT phoneme alignment, a voice engine, or quality certification.
 */
export const ACTING_STUDY_DURATION=5;
const M=[
 'mouthSmile','mouthFrown','mouthPress','jawOpen','mouthPucker','mouthStretch',
 'browInnerUp','browDownLeft','browDownRight','browOuterUpLeft','browOuterUpRight',
 'eyeWideLeft','eyeWideRight','eyeSquintLeft','eyeSquintRight','eyeBlinkLeft','eyeBlinkRight'
];
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
export const ACTING_STUDY_BEATS=Object.freeze([
 {time:0,phase:'listening',face:{mouthPress:.12},headYaw:0,headPitch:0,gaze:.02},
 {time:.38,phase:'anticipation',face:{mouthPress:.38,browDownLeft:.23,browDownRight:.22,eyeSquintLeft:.12,eyeSquintRight:.09},headYaw:-.12,headPitch:-.02,gaze:-.16},
 {time:.78,phase:'suspicion',face:{mouthFrown:.47,browDownLeft:.58,browDownRight:.55,eyeSquintLeft:.25,eyeSquintRight:.22},headYaw:-.14,headPitch:-.075,gaze:-.19},
 {time:1.12,phase:'realization',face:{mouthFrown:.35,browInnerUp:.54,eyeWideLeft:.38,eyeWideRight:.40},headYaw:-.03,headPitch:-.04,gaze:.12},
 {time:1.54,phase:'surprise',face:{jawOpen:.86,mouthStretch:.25,browInnerUp:.84,eyeWideLeft:.85,eyeWideRight:.87},headYaw:.075,headPitch:-.10,gaze:.04},
 {time:1.82,phase:'surprise-hold',face:{jawOpen:.73,browInnerUp:.76,eyeWideLeft:.80,eyeWideRight:.80},headYaw:.085,headPitch:-.115,gaze:.06},
 {time:2.08,phase:'silent-blink',face:{eyeBlinkLeft:1,eyeBlinkRight:1,mouthPress:.42,browInnerUp:.40},headYaw:.04,headPitch:.05,gaze:0},
 {time:2.35,phase:'concern',face:{mouthFrown:.68,browInnerUp:.54,eyeSquintLeft:.21,eyeSquintRight:.18},headYaw:-.08,headPitch:.11,gaze:-.14},
 {time:2.78,phase:'processing',face:{mouthFrown:.34,browInnerUp:.22,mouthPress:.12},headYaw:-.045,headPitch:.04,gaze:0},
 {time:3.20,phase:'recovery',face:{mouthSmile:.20,browOuterUpLeft:.25,browOuterUpRight:.16},headYaw:0,headPitch:0,gaze:.08},
 {time:3.70,phase:'relief',face:{mouthSmile:.77,eyeSquintLeft:.22,eyeSquintRight:.20,browOuterUpLeft:.25},headYaw:.10,headPitch:-.038,gaze:.11},
 {time:4.15,phase:'relief-hold',face:{mouthSmile:.88,jawOpen:.14,eyeSquintLeft:.26,eyeSquintRight:.23},headYaw:.12,headPitch:-.045,gaze:.09},
 {time:4.54,phase:'breath-recovery',face:{mouthSmile:.45,mouthPress:.1,browInnerUp:.1},headYaw:.04,headPitch:.012,gaze:.02},
 {time:5,phase:'neutral-end',face:{mouthSmile:.10},headYaw:0,headPitch:0,gaze:0}
]);
function blend(a,b,t){return a+(b-a)*t}
const smooth=t=>{const x=clamp(t,0,1);return x*x*(3-2*x)};
export function sampleActingStudy(seconds) {
 if(!Number.isFinite(seconds))throw new RangeError('Acting timestamp must be finite');
 const t=clamp(seconds,0,ACTING_STUDY_DURATION);
 let i=0;
 while(i<ACTING_STUDY_BEATS.length-2 && t>ACTING_STUDY_BEATS[i+1].time)i++;
 const prev=ACTING_STUDY_BEATS[i],next=ACTING_STUDY_BEATS[i+1];
 const ratio=smooth((t-prev.time)/(next.time-prev.time));
 const morphs={};
 for(const name of M){
  const weight=blend(prev.face[name]||0,next.face[name]||0,ratio);
  if(weight>1e-5)morphs[name]=clamp(weight,0,1);
 }
 // Very light asymmetric eyelid motion and breathing, periodic but seek-independent.
 const breathing=.015*Math.sin(t*Math.PI*2*.38);
 return Object.freeze({
  time:t,phase:ratio<.5?prev.phase:next.phase,
  morphs:Object.freeze(morphs),
  headYaw:blend(prev.headYaw,next.headYaw,ratio),
  headPitch:blend(prev.headPitch,next.headPitch,ratio)+breathing,
  gazeYaw:blend(prev.gaze,next.gaze,ratio),
  neckRoll:.017*Math.sin(1.65*t),
  breath:breathing
 });
}
export function inventoryActingBones(root) {
 if(!root||typeof root.traverse!=='function')throw new TypeError('Scene root required');
 const wanted=new Set(['Head','Neck','LeftEye','RightEye']);
 const matches=new Map();
 root.traverse(obj=>{
  if(obj.isBone && wanted.has(obj.name) && !matches.has(obj.name)){
   matches.set(obj.name,{bone:obj,rotation:obj.rotation.clone()});
  }
 });
 return matches;
}
export function applyActingBones(bases,pose) {
 if(!(bases instanceof Map)||!pose)throw new TypeError('Bone inventory and pose required');
 const transforms={
  Head:[pose.headPitch,pose.headYaw,0],
  Neck:[pose.headPitch*.13,pose.headYaw*.24,pose.neckRoll],
  LeftEye:[0,pose.gazeYaw,0],
  RightEye:[0,pose.gazeYaw,0]
 };
 for(const [name,original] of bases){
  const [pitch,yaw,roll]=transforms[name]||[0,0,0];
  const rotation=original.rotation;
  original.bone.rotation.set(rotation.x+pitch,rotation.y+yaw,rotation.z+roll,rotation.order);
 }
 return Object.freeze({bones:bases.size});
}
export function restoreActingBones(bases){
 if(!(bases instanceof Map))return;
 for(const {bone,rotation} of bases.values())bone.rotation.copy(rotation);
}
