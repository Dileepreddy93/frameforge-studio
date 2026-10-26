// Robot design directions (M3.1): every direction builds BLUE and ORANGE, renders them in each view and all seven
// project emotions without broken geometry, and the pair keeps its brief (ORANGE taller, deadpan lids by default).
const assert=require('node:assert/strict');
const R=require('../design/robot-forms.js');
const {DIRS,EMOTIONS,expression,ORDER}=require('../design/robot-directions.js');
const core=require('../src/project-core.js');

assert.deepEqual([...ORDER].sort(),[...core.emotions].sort(),'one robot expression per project emotion');
assert.deepEqual(Object.keys(EMOTIONS).sort(),[...core.emotions].sort());
const heights={};
for(const d of DIRS){
 for(const who of ['blue','orange']){
  const robot=R.build(d[who]);
  for(const yaw of [0,-32,-78])for(const e of ORDER){
   const x=expression(who,e),out=R.render(robot,{yaw,face:x.face,pose:x.pose});
   assert.ok(out.svg.includes('<polygon')&&!out.svg.includes('NaN'),d.id+' '+who+' '+e+' at '+yaw+'°');
   assert.ok(out.bbox.every(Number.isFinite)&&out.headBox.every(Number.isFinite));
  }
  // Each expression draws a different face.
  const faces=new Set(ORDER.map(e=>JSON.stringify(R.faceShapes(d[who],expression(who,e).face))));
  assert.equal(faces.size,ORDER.length,d.id+' '+who+': seven distinct faces');
  const front=R.render(robot,{});
  heights[d.id+who]=d[who].head.c[1]+d[who].head.r[1];
  assert.ok(front.bbox[3]<=.001&&front.bbox[3]>-.15,d.id+' '+who+' stands on (or hovers just above) the ground');
 }
 assert.ok(heights[d.id+'orange']>heights[d.id+'blue'],d.id+': ORANGE is the taller one');
}
assert.ok(expression('orange','neutral').face.lidU>.25&&!expression('blue','neutral').face.lidU,'ORANGE is deadpan, BLUE is not');
assert.equal(expression('orange','surprised').face.lidU,undefined,'surprise breaks the deadpan');
console.log('ROBOT_DESIGN_PASS',DIRS.length,'directions x 2 robots x 3 views x',ORDER.length,'emotions');
