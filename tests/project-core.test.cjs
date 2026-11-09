const assert=require('node:assert/strict');
const fs=require('node:fs');
const cp=require('node:child_process');
const {validateProject,assertProject,toTimelineShots,summary,schema}=require('../src/project-core.js');
const get=n=>JSON.parse(fs.readFileSync('projects/'+n+'.frameforge.json','utf8'));
const clone=x=>structuredClone(x);
const comedy=get('zero-latency'),mystery=get('mountain-mystery');
const comedyTotal=comedy.shots.reduce((a,s)=>a+s.duration,0);
for(const [p,n,total] of [[comedy,14,comedyTotal],[mystery,6,30]]){
 const v=validateProject(p);assert.equal(v.valid,true,JSON.stringify(v.errors));assert.equal(v.shotCount,n);
 assert.ok(Math.abs(v.duration-total)<.001);
 assert.equal(summary(p).valid,true);assert.equal(schema,p.schema);
 const shots=toTimelineShots(p);
 assert.equal(shots.length,n);assert.deepEqual(shots.map(s=>s.speaker),p.shots.map(s=>s.speaker));
 assert.ok(shots.every(s=>s.text&&s.camera&&s.duration));
}
assert.equal(comedy.audio.state,'mastered');
// Voice is the clock: each voiced shot lasts lead + its spoken line + the authored pause, frame-rounded.
for(const s of comedy.shots)assert.equal(s.duration,Math.round((s.timing.lead+s.voice.seconds+s.timing.pauseAfter)*30)/30,s.id+' duration follows its voice line');
assert.ok(comedy.audio.masterUrl.startsWith('audio/')&&fs.existsSync(comedy.audio.masterUrl)&&fs.existsSync(comedy.audio.voiceUrl),'mastered audio ships with the repo');
assert.equal(mystery.audio.state,'storyboard_only');
assert.equal(mystery.audio.masterUrl,null);
const original=cp.execFileSync('git',['show','v3.0-stable:index.html'],{encoding:'utf8'});
const section=original.slice(original.indexOf('const templates={'),original.indexOf('let shots=[]',original.indexOf('const templates={')));
const pattern=/\["([^"]+)","([^"]+)","([^"]+)",([0-9]+(?:\.[0-9]+)?)\]/g;
const sourceComedy=[...section.split('comedy:[')[1].split('mystery:[')[0].matchAll(pattern)];
const sourceMystery=[...section.split('mystery:[')[1].matchAll(pattern)];
// Cameras re-shot on purpose since V3: M5.1 made the first two-shot of Zero Latency the arena's wide.
const reshot={'shot-06':['duo','wide']};
for(const [legacy,project]of [[sourceComedy,comedy],[sourceMystery,mystery]]){
 assert.equal(legacy.length,project.shots.length,'shot count unchanged from V3 source');
 legacy.forEach((m,i)=>{const shot=project.shots[i],[was,now]=project===comedy&&reshot[shot.id]||[];assert.equal(shot.dialogue,m[1]);assert.equal(shot.speaker,m[2]);
  if(was){assert.equal(m[3],was);assert.equal(shot.camera,now);}else assert.equal(shot.camera,m[3]);if(!shot.voice)assert.equal(shot.duration,Number(m[4]));});
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
const core=require('../src/project-core.js');
const alien=clone(mystery);
alien.characters.push({...alien.characters[1],id:'alien',name:'ALIEN'});
alien.shots[0].speaker='alien';
assert.equal(validateProject(alien).valid,true);
assert.throws(()=>core.assertRendererCompatible(alien),/cannot animate custom rigs/);
console.log('RIG_COMPATIBILITY_GATE_PASS');

// Per-shot direction lives on the shot itself, so reordering shots never changes what a shot shows.
const comedyShots=toTimelineShots(comedy);
const reversed=clone(comedy);reversed.shots.reverse();
const byId=Object.fromEntries(toTimelineShots(reversed).map(s=>[s.id,s]));
for(const s of comedyShots)assert.deepEqual(byId[s.id],s,'shot '+s.id+' keeps its own direction when moved');
const trade=comedyShots.find(s=>s.id==='shot-09');
assert.equal(trade.title,'THE TRADE');assert.equal(trade.insert.tone,'bad');assert.equal(trade.cast.orange.emotion,'angry');
assert.deepEqual(comedyShots.find(s=>s.id==='shot-03').reactionCut,{role:'blue',seconds:.58,emotion:'surprised'});
assert.equal(comedyShots.find(s=>s.id==='shot-12').framing.lookUp,.07);
// Unauthored shots get complete defaults: speaker explains, others listen, framing comes from the camera preset.
const plain=toTimelineShots(mystery)[0];
assert.deepEqual(plain.cast.blue,{action:'listen',emotion:'neutral'});
assert.equal(plain.cast[plain.speaker].action,'explain');
assert.deepEqual(plain.framing,{distance:21,offset:.3,up:4.34,fov:40,lookUp:3.5,move:'push',amount:.33,roll:0,aim:'center'});
const duo=toTimelineShots(mystery).find(s=>s.camera==='duo');assert.equal(duo.framing.aim,duo.speaker,'two-shots favour the speaker by default');
invalid('look colour not hex',p=>p.characters[0].look={hoodie:'red'});
invalid('look slot the rig lacks',p=>p.characters[1].look={hoodie:'#ff0000'});
assert.equal(validateProject({...clone(comedy),characters:comedy.characters.map(c=>c.id==='dev'?{...c,look:{hoodie:'#aa3344',hair:'#221100'}}:c)}).valid,true,'valid looks pass');
invalid('unknown camera move',p=>p.shots[0].framing.move='orbit');
invalid('roll too steep',p=>p.shots[0].framing.roll=45);
invalid('aim at unknown character',p=>p.shots[0].framing.aim='nobody');
assert.equal(plain.title,'');assert.equal(plain.insert,null);assert.equal(plain.reactionCut,null);assert.equal(plain.wall,null);
assert.deepEqual(comedyShots[0].wall,{window:'Dashboard · /home',label:'p95 page load',value:'12.0 s',badge:'SLOW',tone:'bad'});
invalid('wall screen without a value',p=>p.shots[0].wall={window:'w',label:'l',tone:'bad'});
invalid('wall screen with unknown tone',p=>p.shots[0].wall={window:'w',label:'l',value:'1 s',tone:'meh'});
// Older files that only set acting.devEmotion still open.
const legacy=clone(mystery);delete legacy.shots[0].cast;legacy.shots[0].acting={devEmotion:'happy'};
assert.equal(toTimelineShots(legacy)[0].cast.dev.emotion,'happy');
invalid('unknown action',p=>p.shots[0].cast.dev.action='moonwalk');
invalid('unknown emotion',p=>p.shots[0].cast.blue.emotion='smug');
invalid('cast for unregistered character',p=>p.shots[0].cast.alien={action:'listen'});
invalid('framing out of range',p=>p.shots[0].framing.fov=120);
invalid('reaction longer than shot',p=>p.shots[2].reactionCut.seconds=99);
invalid('reaction by unknown role',p=>p.shots[2].reactionCut.role='nobody');
invalid('incomplete screen insert',p=>delete p.shots[8].insert.caption);
invalid('bad insert tone',p=>p.shots[8].insert.tone='meh');
invalid('empty title',p=>p.shots[0].title='');
invalid('empty banner',p=>p.banner='');
console.log('SHOT_DIRECTION_TESTS_PASS: order-independent shots, defaults, legacy acting, 12 invalid cases');

// Shot planner (M5.4): long close-ups and screen shots end on a listener's reaction; authored cuts win; false opts out.
{
 const planned=comedyShots.filter(s=>s.reactionSource==='planned');
 assert.deepEqual(planned.map(s=>s.id),['shot-01','shot-05','shot-07','shot-09','shot-11','shot-13']);
 assert.deepEqual(comedyShots.find(s=>s.id==='shot-05').reactionCut,{role:'dev',seconds:.82,emotion:'worried'});
 assert.deepEqual(comedyShots.find(s=>s.id==='shot-01').reactionCut,{role:'blue',seconds:.79});
 for(const s of comedyShots){
  if(!s.reactionCut)continue;
  assert.ok(s.reactionCut.role!==s.camera,s.id+' never cuts to the character already on screen');
  if(s.reactionSource==='planned'){assert.notEqual(s.reactionCut.role,s.speaker);assert.ok(s.duration-s.reactionCut.seconds>=1.4-1e-9,s.id+' keeps 1.4 s before its cut');}
 }
 assert.ok(comedyShots.filter(s=>s.camera==='wide'||s.camera==='duo').every(s=>s.reactionSource!=='planned'),'wides and two-shots are not cut by the planner');
 assert.ok(comedyShots.filter(s=>s.duration<2.4).every(s=>s.reactionSource!=='planned'),'short shots are not cut');
 assert.equal(comedyShots.find(s=>s.id==='shot-03').reactionSource,'authored');
 const off=clone(comedy);off.shots[0].reactionCut=false;
 const offShot=toTimelineShots(off)[0];assert.equal(offShot.reactionCut,null);assert.equal(offShot.reactionSource,'off');
 assert.equal(validateProject(off).valid,true);
 const bad=clone(comedy);bad.shots[0].reactionCut=true;assert.equal(validateProject(bad).valid,false);
 // The film keeps its length: the planner only changes the picture.
 assert.equal(comedyShots.reduce((a,s)=>a+s.duration,0),comedyTotal);
 console.log('SHOT_PLANNER_TESTS_PASS: 6 planned cuts in Zero Latency, authored cuts kept, opt-out, timing unchanged');
}
