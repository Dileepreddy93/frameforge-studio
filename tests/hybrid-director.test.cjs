'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const core=require('../src/hybrid-project-core.js');
const direction=require('../src/hybrid-direction.js');
const v1=JSON.parse(fs.readFileSync('projects/zero-latency.frameforge.json','utf8'));
const base=core.upgradeLegacyProject(v1);
base.characters=[
 {id:'luna',name:'Luna',visualIdentity:'Original customizable humanoid',
  voice:{profile:'af_bella',voiceLock:'Stable local voice'},
  expressions:['neutral','happy','sad','worried'],sheetStatus:'draft'},
 {id:'atlas',name:'Atlas',visualIdentity:'Original customizable robot',
  voice:{profile:'am_puck',voiceLock:'Stable local voice'},
  expressions:['neutral','happy','sad','worried'],sheetStatus:'draft'}
];
base.shots=[
 {id:'shot-one',duration:2.4,dialogue:'We have a story to build.',speaker:'luna',
  camera:{kind:'actor',target:'luna'},cast:{luna:{emotion:'happy',action:'wave'}},
  direction:{move:'push',transition:'cut',blendSeconds:0},
  screen:{kind:'terminal',tone:'info',title:'Studio build',lines:['> npm run build','** Export ready']},
  caption:'BUILDING TOGETHER',intent:'setup',firstFrameStatus:'draft'},
 {id:'shot-two',duration:2.9,dialogue:'And our studio can render it.',speaker:'atlas',
  camera:{kind:'two',target:'atlas',secondary:'luna'},
  cast:{atlas:{emotion:'curious',action:'point'}},
  direction:{move:'drift',transition:'blend',blendSeconds:.5},
  intent:'payoff',firstFrameStatus:'draft'}
];
base.hybrid.cast={luna:{provider:'procedural',template:'human'},atlas:{provider:'procedural',template:'robot'}};
base.hybrid.world={provider:'procedural',template:'forest'};
base.hybrid.director={oneTake:true};
base.shots[1].reactions=[{actor:'luna',emotion:'surprised',action:'nod',at:.8}];
assert.equal(core.validateProject(base).valid,true,JSON.stringify(core.validateProject(base).errors));
direction.verify(base);
const printed=direction.projectToScript(base);
assert.match(printed,/@shot/);
assert.match(printed,/@screen kind=terminal/);
assert.match(printed,/Luna \(happy\) \[wave\]:/);
const reconstructed=direction.scriptToProject(printed,base);
assert.deepEqual(reconstructed.errors,[],JSON.stringify(reconstructed.errors));
const roundtrip=reconstructed.project;
assert.deepEqual(roundtrip.shots.map(s=>s.id),base.shots.map(s=>s.id));
assert.deepEqual(roundtrip.shots.map(s=>s.camera),base.shots.map(s=>s.camera));
assert.deepEqual(roundtrip.shots.map(s=>s.cast),base.shots.map(s=>s.cast));
assert.deepEqual(roundtrip.shots.map(s=>s.screen),base.shots.map(s=>s.screen));
assert.deepEqual(roundtrip.shots.map(s=>s.direction),base.shots.map(s=>s.direction));
assert.deepEqual(roundtrip.shots.map(s=>s.reactions),base.shots.map(s=>s.reactions));
assert.equal(roundtrip.hybrid.director.oneTake,true);
assert.equal(direction.projectToScript(roundtrip),printed,'script serializes deterministically');
const reordered=direction.reorderShots(base,['shot-two','shot-one']);
assert.equal(reordered.shots[0].speaker,'atlas');assert.equal(base.shots[0].speaker,'luna');
assert.ok(direction.scriptToProject('Not a real script',base).errors.length);
assert.ok(direction.scriptToProject('@shot id=x duration=2 camera=actor:bad\\nLuna: hi',base).errors.length);
assert.ok(direction.scriptToProject('@shot id=x duration=2 camera=actor:luna\\nLuna (alien): hi',base).errors.length);
assert.throws(()=>direction.reorderShots(base,['shot-one','shot-one']));
assert.throws(()=>direction.reorderShots(base,['shot-one','missing']));
const anchors={luna:{head:[-1,1.7,0]},atlas:{head:[1,1.7,0]}},
stage={center:[0,1.1,0],screen:[0,2,-3]};
const c1=direction.cameraAt(base,.4,anchors,stage);
const c2=direction.cameraAt(base,2.4+.25,anchors,stage);
const c3=direction.cameraAt(base,2.4+.25,anchors,stage);
assert.deepEqual(c2,c3,'cross-cut camera seek must be deterministic');
assert.equal(c1.shotId,'shot-one');assert.equal(c2.shotId,'shot-two');
assert.equal(c1.move,'push');assert.equal(c2.transition,'blend');
assert.deepEqual(direction.performanceAt(base,2.4+.85).active,['luna']);
assert.ok(direction.performanceAt(base,2.4+.3).active.length===0);
assert.ok(c1.screenBounds.y+c1.screenBounds.height<c1.captionBounds.y,
 'authored monitor and captions must not collide');
assert.equal(c2.screenBounds,null);
assert.ok(c2.position.every(Number.isFinite));
const fullTwo=direction.cameraAt(base,2.4+1.5,anchors,stage);
const portraitHorizontalHalfWidth=Math.tan(fullTwo.fov*Math.PI/360)*
  Math.hypot(fullTwo.position[0],fullTwo.position[2])*9/16;
assert.ok(portraitHorizontalHalfWidth>1.65,
  'A real portrait two-shot must not crop an actor when heads are about ±1 unit from center');

// Real monitor geometry in hybrid-preview-engine.mjs is 3.8 units wide.
// With a 9:16 output and a push toward its end, the complete monitor plus
// 0.1-unit margin per side must stay in frame by default, not just its middle.
const screenProject=structuredClone(base);
screenProject.shots[0].camera={kind:'screen'};
screenProject.shots[0].direction.move='push';
const fullScreen=direction.cameraAt(screenProject,2.3,anchors,stage);
const screenDistance=Math.hypot(...fullScreen.position.map((v,i)=>v-stage.screen[i]));
const screenPortraitHalfWidth=Math.tan(fullScreen.fov*Math.PI/360)*screenDistance*9/16;
assert.ok(screenPortraitHalfWidth>=2.0,
  'Portrait screen insert must show full 3.8-unit monitor and 0.1-unit horizontal margin');
const authoredCloseScreen=structuredClone(screenProject);
authoredCloseScreen.shots[0].framing={distance:4.8,fov:38};
const close=direction.cameraAt(authoredCloseScreen,2.3,anchors,stage);
assert.ok(Math.hypot(...close.position.map((v,i)=>v-stage.screen[i]))<screenDistance,
  'Explicit artist camera overrides remain authoritative');

const malformed=structuredClone(base);malformed.shots[0].screen.lines=['x'.repeat(250)];
assert.throws(()=>direction.verify(malformed));
const malformed2=structuredClone(base);malformed2.shots[1].direction.move='executeJavascript';
assert.throws(()=>direction.verify(malformed2));
assert.equal(v1.schema,'frameforge.project/1');
assert.equal(core.validateProject(v1).valid,true);
console.log('HYBRID_P5_DIRECTOR_PASS: lossless authored script fields, arbitrary cast, camera blending, shot reorder, safe screens, original V1 unchanged');