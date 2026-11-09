// Script core: a plain-text script becomes a valid, directed episode, and any episode reads back as its script.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const S=require('../src/script-core.js');
const C=require('../src/project-core.js');
const get=id=>JSON.parse(fs.readFileSync(`projects/${id}.frameforge.json`,'utf8'));
const zl=get('zero-latency'),dm=get('dark-mode');
const opts={defaultFraming:C.defaultFraming};

// 1. Both hand-directed episodes, read as scripts and planned again, come back valid with the same cameras.
for(const p of [zl,dm]){
 const r=S.scriptToProject(S.projectToScript(p),p,opts);
 assert.deepEqual(r.errors,[]);
 assert.equal(C.validateProject(r.project).valid,true,JSON.stringify(C.validateProject(r.project).errors));
 assert.deepEqual(r.project.shots.map(s=>s.camera),p.shots.map(s=>s.camera),p.id+': the planner directs it the way it was directed by hand');
 assert.deepEqual(r.project.shots.map(s=>s.dialogue),p.shots.map(s=>s.dialogue));
 assert.deepEqual(r.project.shots.map(s=>s.speaker),p.shots.map(s=>s.speaker));
 assert.equal(r.project.title,p.title);assert.equal(r.project.logline,p.logline);
}

// 2. A new script from scratch.
const script=`# Bigger Logo
> A designer wants the logo bigger. The robots deliver.

[wall bad] logo size = 12 px
DEV (worried): Can we make the logo bigger?
BLUE (happy): Instantly!
ORANGE: How much bigger?
DEV: Just a bit.
BLUE (happy): Done.
[screen good] Logo size = 4,000 km | Visible from the Moon.
DEV (surprised): It's the size of the Moon!
ORANGE: You did say bigger.
`;
const {project,errors}=S.scriptToProject(script,zl,opts);
assert.deepEqual(errors,[]);
const v=C.validateProject(project);assert.equal(v.valid,true,JSON.stringify(v.errors));
assert.equal(project.id,'bigger-logo');assert.equal(project.title,'Bigger Logo');
assert.equal(project.audio.state,'storyboard_only');assert.equal(project.audio.masterUrl,null);
assert.equal(project.shots.length,7);
const cams=project.shots.map(s=>s.camera);
assert.deepEqual(cams,['dev','blue','orange','wide','screen','dev','duo']);
assert.equal(project.shots[0].wall.value,'12 px');assert.equal(project.shots[0].wall.tone,'bad');
assert.equal(project.shots[4].insert.value,'4,000 km');assert.equal(project.shots[4].insert.caption,'Visible from the Moon.');
assert.equal(project.shots[4].insert.tone,'good');
assert.deepEqual(project.shots[4].sfx.map(x=>x.cue),['whoosh','chime']);
// Acting from emotion and punctuation; listeners react.
assert.equal(project.shots[0].cast.dev.action,'plead');                 // worried question
assert.equal(project.shots[1].cast.blue.action,'celebrate');            // happy exclamation
assert.equal(project.shots[2].cast.orange.action,'question');
assert.equal(project.shots[5].cast.dev.action,'surprise');
assert.equal(project.shots[0].cast.blue.emotion,'thinking');            // a question makes the listeners think
assert.equal(project.shots[5].cast.orange.emotion,'surprised');         // an exclamation surprises them
// Characters, voices and looks come from the episode it was written over.
assert.deepEqual(project.characters,zl.characters);assert.deepEqual(project.style,zl.style);
// Music: in on the first line, stopped and stung on the last.
assert.deepEqual(project.audio.music.cues.map(c=>c.style),['groove','stop','sting']);
// The shot planner adds reaction cuts on long lines only; every shot keeps an estimated duration until voiced.
const timeline=C.toTimelineShots(project);
assert.ok(timeline.every(s=>s.duration>=1.4&&s.duration<=8));
// It reads back as the same script lines.
const back=S.projectToScript(project);
for(const line of ['DEV (worried): Can we make the logo bigger?','[screen good] Logo size = 4,000 km | Visible from the Moon.','[wall bad] logo size = 12 px'])
 assert.ok(back.includes(line),'reads back: '+line);

// 3. Short scripts: no wide before six lines, no two-shot before four.
assert.deepEqual(S.scriptToProject('DEV: Hi.',zl,opts).project.shots.map(s=>s.camera),['dev']);
assert.deepEqual(S.scriptToProject('DEV: Hi.\nBLUE: Hello.\nORANGE: Greetings.\nDEV: Bye.',zl,opts).project.shots.map(s=>s.camera),['dev','blue','orange','duo']);
// Three lines in a row from one speaker: the middle one opens up to a two-shot.
assert.deepEqual(S.scriptToProject('DEV: One.\nDEV: Two.\nDEV: Three.',zl,opts).project.shots.map(s=>s.camera),['dev','duo','dev']);
// Names are case-insensitive; comments and blank lines are skipped.
assert.equal(S.scriptToProject('// a note\n\ndev: hi\nBlue (Happy): yes',zl,opts).project.shots.length,2);

// 4. Mistakes are reported with their line number and fix, and nothing is made.
const bad=S.scriptToProject('DEV: ok\nBOB: hello\nBLUE (furious): no\n[screen good] just text\nORANGE sure\n[wall bad] value = this is far too long',zl,opts);
assert.equal(bad.project,null);
assert.deepEqual(bad.errors.map(e=>e.line),[2,3,4,5,6]);
assert.match(bad.errors[0].message,/not in the cast.*DEV, BLUE, ORANGE/);
assert.match(bad.errors[1].message,/not an emotion/);
assert.match(bad.errors[2].message,/label = value/);
assert.match(bad.errors[3].message,/NAME: line/);
assert.match(bad.errors[4].message,/12 characters/);
assert.match(S.scriptToProject('[screen good] a = b',zl,opts).errors[0].message,/after the line/);
assert.match(S.scriptToProject('   \n// only a comment',zl,opts).errors[0].message,/at least one line/);
assert.match(S.scriptToProject(Array.from({length:61},(_,i)=>'DEV: line '+i).join('\n'),zl,opts).errors[0].message,/60 lines/);

console.log('SCRIPT_CORE_TESTS_PASS: both episodes round-trip with their hand-directed cameras; a new script plans cameras, acting, screens and music; errors name the line');
