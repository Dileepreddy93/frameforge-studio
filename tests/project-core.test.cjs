const assert=require('node:assert/strict');
const fs=require('node:fs');
const cp=require('node:child_process');
const {validateProject,assertProject,toTimelineShots,summary,schema}=require('../src/project-core.js');
const get=n=>JSON.parse(fs.readFileSync('projects/'+n+'.frameforge.json','utf8'));
const clone=x=>structuredClone(x);
const comedy=get('zero-latency'),mystery=get('mountain-mystery');
for(const [p,n,total] of [[comedy,14,41.8],[mystery,6,30]]){
 const v=validateProject(p);assert.equal(v.valid,true,JSON.stringify(v.errors));assert.equal(v.shotCount,n);
 assert.ok(Math.abs(v.duration-total)<.001);
 assert.equal(summary(p).valid,true);assert.equal(schema,p.schema);
 const shots=toTimelineShots(p);
 assert.equal(shots.length,n);assert.deepEqual(shots.map(s=>s.speaker),p.shots.map(s=>s.speaker));
 assert.ok(shots.every(s=>s.text&&s.camera&&s.duration));
}
assert.equal(comedy.audio.state,'mastered');
assert.equal(mystery.audio.state,'storyboard_only');
assert.equal(mystery.audio.masterUrl,null);
const original=cp.execFileSync('git',['show','v3.0-stable:index.html'],{encoding:'utf8'});
const section=original.slice(original.indexOf('const templates={'),original.indexOf('let shots=[]',original.indexOf('const templates={')));
const pattern=/\["([^"]+)","([^"]+)","([^"]+)",([0-9]+(?:\.[0-9]+)?)\]/g;
const sourceComedy=[...section.split('comedy:[')[1].split('mystery:[')[0].matchAll(pattern)];
const sourceMystery=[...section.split('mystery:[')[1].matchAll(pattern)];
for(const [legacy,project]of [[sourceComedy,comedy],[sourceMystery,mystery]]){
 assert.equal(legacy.length,project.shots.length,'shot count unchanged from V3 source');
 legacy.forEach((m,i)=>{const shot=project.shots[i];assert.equal(shot.dialogue,m[1]);assert.equal(shot.speaker,m[2]);assert.equal(shot.camera,m[3]);assert.equal(shot.duration,Number(m[4]));});
}
const invalid=(name,mutator)=>{
 const doc=clone(comedy);mutator(doc);const v=validateProject(doc);
 assert.equal(v.valid,false,name);assert.throws(()=>assertProject(doc),/Invalid FrameForge project/);return v;
};
invalid('wrong schema',p=>p.schema='wrong');
invalid('extra bad output',p=>p.output.fps=24);
invalid('duplicate shot',p=>p.shots[1].id=p.shots[0].id);
invalid('unknown speaker',p=>p.shots[0].speaker='not-a-real-person');
invalid('invalid camera',p=>p.shots[0].camera='orbit');
invalid('zero duration',p=>p.shots[0].duration=0);
invalid('too-long duration',p=>p.shots[0].duration=16);
invalid('empty story',p=>p.shots=[]);
invalid('no characters',p=>p.characters=[]);
invalid('insecure id',p=>p.id='__proto__');
invalid('bad safe zone',p=>p.environment.safeZone.bottom=1720);
invalid('missing voice lock',p=>p.characters[0].voice.voiceLock='');
invalid('missing expression set',p=>p.characters[0].expressions=['neutral']);
invalid('false mastered audio',p=>p.audio={state:'mastered',masterUrl:null});
invalid('false storyboard audio',p=>p.audio={state:'storyboard_only',masterUrl:'fake.ogg'});
invalid('shot style drift',p=>p.shots[0].styleLock='different art style');
invalid('nonfinite time',p=>p.shots[0].duration=Infinity);
invalid('duplicate character id',p=>p.characters[2].id='blue');
invalid('unapproved status',p=>p.shots[0].firstFrameStatus='approved_by_magic');
assert.equal(validateProject(null).valid,false);
console.log('PROJECT_CORE_TESTS_PASS: two episode fixtures, exact V3 preservation, 20+ invalid cases');
