// The robots' model sheet (M3.2): the design numbers the 3D build matches. Both robots build, render every emotion,
// every chart entry and every viseme, and keep the brief (ORANGE taller and deadpan; speech opens the mouth; blinks
// close the eyes).
const assert=require('node:assert/strict');
const R=require('../design/robot-forms.js');
const C=require('../design/robot-character.js');
const core=require('../src/project-core.js');

assert.deepEqual([...C.ORDER].sort(),[...core.emotions].sort());
assert.match(C.STATUS,/^approved/,'the sheet records its approval');
const robots={blue:R.build(C.ROBOTS.blue),orange:R.build(C.ROBOTS.orange)};
const top=who=>-R.render(robots[who],{}).bbox[1];
assert.ok(top('orange')>top('blue')+.05,'ORANGE is taller: '+top('orange').toFixed(2)+' vs '+top('blue').toFixed(2));
for(const who of ['blue','orange']){
 for(const e of C.ORDER)for(const yaw of [0,-32,-80,180]){
  const out=R.render(robots[who],{yaw,face:C.face(who,e),pose:C.pose(e)});
  assert.ok(!out.svg.includes('NaN')&&out.bbox.every(Number.isFinite),who+' '+e+' '+yaw);
 }
 for(const f of Object.values(C.EYE_CHART))R.faceShapes(C.ROBOTS[who],f);
 const shapes=f=>JSON.stringify(R.faceShapes(C.ROBOTS[who],f));
 // Speech: each viseme gives its own mouth, and louder means more open.
 const rest=shapes(C.face(who,'neutral'));
 const mouths=new Set(Object.keys(C.VISEME_MOUTH).map(v=>shapes(C.face(who,'neutral',{viseme:v,open:.8}))));
 assert.ok(mouths.size>=4&&!mouths.has(rest),who+': visemes change the mouth');
 assert.notEqual(shapes(C.face(who,'neutral',{viseme:'open',open:.3})),shapes(C.face(who,'neutral',{viseme:'open',open:.9})),who+': louder opens wider');
 assert.notEqual(shapes(C.face(who,'happy',{blink:true})),shapes(C.face(who,'happy')),who+': blinks');
 assert.notEqual(shapes(C.face(who,'neutral',{look:1})),rest,who+': looks toward the speaker');
}
// Every arm part is tagged with its side and has a shoulder to swing from.
for(const who of ['blue','orange']){
 const r=robots[who];
 assert.ok([1,-1].every(side=>r.parts.some(p=>p.arm===side)&&r.shoulders[side].every(Number.isFinite)),who+' arms');
}
console.log('ROBOT_CHARACTER_PASS',JSON.stringify({blue:+top('blue').toFixed(2),orange:+top('orange').toFixed(2)}));
