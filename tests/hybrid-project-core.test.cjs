// P1 contract tests: real original V6 projects, strict v1/v2 boundaries,
// safe asset references, deterministic time evaluation and provider lifecycle.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const legacy=require('../src/project-core.js');
const hybrid=require('../src/hybrid-project-core.js');
const {createRegistry,createMemoryAssetStore,createSession}=require('../src/hybrid-providers.js');
const read=id=>JSON.parse(fs.readFileSync('projects/'+id+'.frameforge.json','utf8'));
const copy=structuredClone;
const original=read('zero-latency');
const dark=read('dark-mode');

for(const p of [original,dark]){
 assert.equal(legacy.validateProject(p).valid,true);
 assert.deepEqual(hybrid.validateProject(p),legacy.validateProject(p),'v1 validator remains exactly unchanged');
 assert.deepEqual(hybrid.toTimelineShots(p),legacy.toTimelineShots(p),'v1 timeline remains unchanged');
 const upgraded=hybrid.upgradeLegacyProject(p);
 assert.equal(upgraded.schema,'frameforge.project/2');
 assert.deepEqual(hybrid.toLegacyProject(upgraded),p,'v1 -> v2 -> v1 roundtrip must be lossless');
 assert.deepEqual(hybrid.toTimelineShots(hybrid.toLegacyProject(upgraded)),legacy.toTimelineShots(p));
 assert.notEqual(upgraded,p,'v2 upgrade returns new document');
 assert.equal(p.schema,'frameforge.project/1','original must not mutate');
}
assert.equal(hybrid.schema,'frameforge.project/2');
assert.throws(()=>hybrid.upgradeLegacyProject({...original,schema:'invalid'}));
const doc=hybrid.upgradeLegacyProject(original);
for(const c of doc.characters){
 doc.hybrid.cast[c.id]={provider:'procedural',template:c.id==='dev'?'human':'robot'};
}
doc.hybrid.world={provider:'procedural',template:'night-city'};
doc.shots[0].camera={kind:'actor',target:'dev'};
doc.shots[1].camera={kind:'two',target:'dev',secondary:'blue'};
assert.equal(hybrid.validateProject(doc).valid,true,JSON.stringify(hybrid.validateProject(doc).errors));
assert.throws(()=>hybrid.toLegacyProject(doc),/cannot be downgraded/);
assert.equal(hybrid.timeAt(doc,0).shotId,original.shots[0].id);
assert.equal(hybrid.timeAt(doc,0).localTime,0);
assert.equal(hybrid.timeAt(doc,doc.shots[0].duration).index,1);
assert.equal(hybrid.timeAt(doc,doc.shots.reduce((a,s)=>a+s.duration,0)).index,doc.shots.length-1);
assert.throws(()=>hybrid.timeAt(doc,-.001),RangeError);
const tl=hybrid.toTimelineShots(doc);
assert.equal(tl.length,14);
assert.equal(tl[0].camera.kind,'actor');
assert.equal(tl[0].cast.dev.emotion,'worried');
assert.equal(tl[1].start,doc.shots[0].duration);
const flipped=copy(doc);flipped.shots.reverse();
assert.deepEqual(hybrid.toTimelineShots(flipped).find(x=>x.id==='shot-03').cast,
 hybrid.toTimelineShots(doc).find(x=>x.id==='shot-03').cast,
 'reordering must preserve authored per-shot acting');
const reject=(name,mutate)=>{
 const p=copy(doc);mutate(p);
 const v=hybrid.validateProject(p);assert.equal(v.valid,false,name+' should be rejected');
 assert.throws(()=>hybrid.assertProject(p),/Invalid hybrid project/);
};
reject('bad schema',p=>p.schema='frameforge.project/99');
reject('unknown extra top field',p=>p.javascript='alert(1)');
reject('unsafe id',p=>p.id='../etc');
reject('duplicate actors',p=>p.characters[1].id=p.characters[0].id);
reject('missing provider',p=>delete p.hybrid.cast.blue);
reject('unknown provider',p=>p.hybrid.cast.blue.provider='arbitrary-js');
reject('unregistered camera actor',p=>p.shots[0].camera.target='missing');
reject('bad two-shot pair',p=>p.shots[1].camera.secondary='dev');
reject('no matching speaker',p=>p.shots[0].speaker='unknown');
reject('duplicate shots',p=>p.shots[1].id=p.shots[0].id);
reject('bad duration',p=>p.shots[0].duration=-1);
reject('no world template',p=>delete p.hybrid.world.template);
reject('unknown world provider',p=>p.hybrid.world.provider='browser-script');
reject('rig without asset',p=>p.hybrid.cast.dev={provider:'rigged',assetId:'rig-one'});
reject('unapproved emotion',p=>p.shots[0].cast.dev.emotion='not-an-emotion');
reject('unapproved action',p=>p.shots[0].cast.dev.action='script-injection');
reject('bad framing',p=>p.shots[0].framing={fov:600});
reject('unbounded export duration',p=>p.shots.forEach(s=>s.duration=15));
reject('invalid output',p=>p.output.width=10000);
reject('unsafe asset ref',p=>{p.hybrid.assets=[{id:'rig-one',kind:'character',uri:'https://evil.test/payload.glb'}]});
reject('wrong asset kind',p=>{p.hybrid.assets=[{id:'rig-one',kind:'world',uri:'asset://rig-one'}];p.hybrid.cast.dev={provider:'rigged',assetId:'rig-one'}});
const withAsset=copy(doc);
withAsset.hybrid.assets=[{id:'rig-one',kind:'character',uri:'asset://rig-one'}];
withAsset.hybrid.cast.dev={provider:'rigged',assetId:'rig-one'};
assert.equal(hybrid.validateProject(withAsset).valid,true,JSON.stringify(hybrid.validateProject(withAsset).errors));
const store=createMemoryAssetStore({maxBytes:4096});
const seed=new Uint8Array([0,1,2,3]),descriptor={id:'rig-one',kind:'character',uri:'asset://rig-one'};
store.put(descriptor,seed);seed[0]=99;
const copy1=store.get('rig-one','character');
assert.deepEqual([...copy1.bytes],[0,1,2,3],'binary data copied into store');
copy1.bytes[1]=99;
assert.equal(store.get('rig-one').bytes[1],1,'retrieved bytes are copies');
assert.throws(()=>store.put(descriptor,new Uint8Array([1])),/Duplicate/);
assert.throws(()=>store.get('rig-one','world'),/kind mismatch/);
assert.throws(()=>store.put({id:'bad',kind:'world',uri:'https://unsafe'},seed),/Invalid/);
assert.throws(()=>store.put({id:'too-big',kind:'world',uri:'asset://too-big'},new Uint8Array(4100)),/limit/);
assert.equal(store.count(),1);
assert.equal(store.delete('rig-one'),true);assert.equal(store.count(),0);

const registry=createRegistry(),counts={actorCreates:0,actorDisposes:0,worldCreates:0,worldDisposes:0,poses:0};
registry.registerActor('procedural',({actor})=>{
 counts.actorCreates++;
 let pose=null;
 return {
  setPose:(time,shot,performance)=>{counts.poses++;pose={time,shot:shot.id,performance}},
  getAnchors:()=>({root:[0,0,0],head:[actor.id==='dev'?0:actor.id==='blue'?1:2,1.6,0]}),
  dispose:()=>{counts.actorDisposes++},
  getPose:()=>copy(pose)
 };
});
registry.registerWorld('procedural',({descriptor})=>{
 counts.worldCreates++;
 let time=0;
 return {
  setTime:t=>{time=t;return {time,template:descriptor.template}},
  getStageAnchors:()=>({center:[0,1,0],screen:[0,1.9,-2]}),
  dispose:()=>{counts.worldDisposes++}
 };
});
assert.throws(()=>registry.registerActor('procedural',()=>{}),/Duplicate/);
registry.lock();assert.throws(()=>registry.registerWorld('another',()=>{}),/locked/);
assert.throws(()=>createSession(original,{registry}),/Legacy FrameForge/);
const session=createSession(doc,{registry,assets:store});
const f1=session.seek(.5),f2=session.seek(8),f3=session.seek(.5);
assert.deepEqual(f1,f3,'absolute-time seek and rewind must be identical');
assert.equal(f1.camera.kind,'actor');assert.deepEqual(f1.camera.focus,[0,1.6,0]);
assert.equal(f1.audio.speaker,'dev');assert.equal(f2.index>0,true);
assert.deepEqual(session.last(),f3);
assert.equal(counts.actorCreates,3);assert.equal(counts.worldCreates,1);
session.dispose();session.dispose();
assert.equal(counts.actorDisposes,3);assert.equal(counts.worldDisposes,1);
assert.throws(()=>session.seek(0),/disposed/);
assert.throws(()=>createSession(doc,{registry:createRegistry()}),/Unavailable world provider/);
console.log('HYBRID_P1_CONTRACT_PASS: v1 exact roundtrips, v2 validation, 21 negative cases, asset isolation, actor/world/camera/audio lifecycle, deterministic seek');
