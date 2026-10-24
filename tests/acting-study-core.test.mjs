import assert from 'node:assert/strict';
import {ACTING_STUDY_BEATS,ACTING_STUDY_DURATION,sampleActingStudy,inventoryActingBones,applyActingBones,restoreActingBones} from '../src/acting-study-core.mjs';
assert.equal(ACTING_STUDY_DURATION,5);
assert.equal(ACTING_STUDY_BEATS.at(0).time,0);assert.equal(ACTING_STUDY_BEATS.at(-1).time,5);
assert.ok(ACTING_STUDY_BEATS.every((b,i)=>i===0||b.time>ACTING_STUDY_BEATS[i-1].time),'No non-monotonic timestamps');
for(let frame=0;frame<=150;frame++){
 const p=sampleActingStudy(frame/30);
 assert.equal(p.time,frame/30);
 assert.ok(Object.values(p.morphs).every(v=>v>=0&&v<=1));
 assert.deepEqual(sampleActingStudy(frame/30),p);
}
assert.equal(sampleActingStudy(-5).time,0);assert.equal(sampleActingStudy(7).time,5);
assert.throws(()=>sampleActingStudy(NaN),/finite/);
assert.ok(sampleActingStudy(1.54).morphs.jawOpen>.8);
assert.ok(sampleActingStudy(2.08).morphs.eyeBlinkLeft>=.99);
assert.ok(sampleActingStudy(2.08).morphs.jawOpen===undefined,'No talking mouth during blink/silence');
assert.ok(sampleActingStudy(4.15).morphs.mouthSmile>.8);
const makeBone=name=>{
 const rot={x:.03,y:.04,z:.02,order:'XYZ',clone(){return {x:this.x,y:this.y,z:this.z,order:this.order}},set(x,y,z){this.x=x;this.y=y;this.z=z},copy(r){Object.assign(this,r)}};
 return {isBone:true,name,rotation:rot};
};
const objs=['Head','Neck','LeftEye','RightEye'].map(makeBone);
const root={traverse:fn=>objs.forEach(fn)};
const bases=inventoryActingBones(root);assert.equal(bases.size,4);
const init=objs.map(o=>({x:o.rotation.x,y:o.rotation.y,z:o.rotation.z}));
applyActingBones(bases,sampleActingStudy(1.54));
const one=objs.map(o=>({x:o.rotation.x,y:o.rotation.y,z:o.rotation.z}));
applyActingBones(bases,sampleActingStudy(4.15));
applyActingBones(bases,sampleActingStudy(1.54));
assert.deepEqual(objs.map(o=>({x:o.rotation.x,y:o.rotation.y,z:o.rotation.z})),one,'Backward scrub must not accumulate rotation');
restoreActingBones(bases);
assert.deepEqual(objs.map(o=>({x:o.rotation.x,y:o.rotation.y,z:o.rotation.z})),init);
console.log('ACTING_STUDY_CORE_PASS: 151 deterministic 30fps poses, silent blink/mouth, 4 rig bones, pose restoration');
