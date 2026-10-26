// BLUE and ORANGE's acting (M3.4): pure and seekable, every action moves the body, key poses land around the accent and
// release before the cut, speech pulses the speaker, the head turns to whoever speaks, and the two act in character
// (BLUE moves more than deadpan ORANGE).
const assert=require('node:assert/strict');
const A=require('../src/robot-acting-core.js');
const core=require('../src/project-core.js');
assert.deepEqual([...A.actions].sort(),[...core.actions].sort(),'one acting definition per project action');
const peak=(robot,action,ch)=>{let m=0;for(let l=0;l<=2.4;l+=1/30){const c=A.evaluate({robot,action,local:l,duration:2.4,time:0,accentAt:.5}).channels;m=Math.max(m,Math.abs(c[ch]));}return m;};
const motion=(robot,action)=>{let m=0;for(let l=0;l<=2.4;l+=1/30){const c=A.evaluate({robot,action,local:l,duration:2.4,time:0,accentAt:.5}).channels;m=Math.max(m,...A.channels.map(k=>Math.abs(c[k])));}return m;};
for(const action of A.actions)for(const robot of ['blue','orange']){
 // Same input, same pose.
 const a=A.evaluate({robot,action,local:1.1,duration:2.4,time:5,accentAt:.5}),b=A.evaluate({robot,action,local:1.1,duration:2.4,time:5,accentAt:.5});
 assert.deepEqual(a,b,robot+' '+action+' is seekable');
 assert.ok(A.channels.every(c=>Number.isFinite(a.channels[c])));
 if(action!=='listen')assert.ok(motion(robot,action)>.05,robot+' '+action+' moves');
 // Back near rest by the end of the shot (idle bob and sway aside).
 const end=A.evaluate({robot,action,local:2.39,duration:2.4,time:0,accentAt:.5}).channels;
 assert.ok(Math.abs(end['L.swing'])<.12&&Math.abs(end['R.swing'])<.12&&Math.abs(end.tilt)<.05,robot+' '+action+' releases before the cut');
}
// In character: BLUE's big moves are bigger than ORANGE's.
for(const [action,ch] of [['celebrate','L.out'],['alarm','R.swing'],['surprise','hover'],['announce','R.swing']])
 assert.ok(peak('blue',action,ch)>peak('orange',action,ch)*1.4,action+': BLUE '+peak('blue',action,ch).toFixed(3)+' vs ORANGE '+peak('orange',action,ch).toFixed(3));
// The accent: the strike of "announce" peaks near the accent, not at the start.
let at=0,best=0;for(let l=0;l<=2.4;l+=1/60){const v=A.evaluate({robot:'blue',action:'announce',local:l,duration:2.4,accentAt:.6}).channels['R.swing'];if(v>best){best=v;at=l;}}
assert.ok(at>1.1&&at<1.9,'announce strikes around its accent ('+at.toFixed(2)+' s)');
// Speech pulses the head; looking turns it toward the speaker (screen left is negative yaw).
const quiet=A.evaluate({robot:'blue',action:'explain',local:1.2,duration:2.4,time:0,speaking:true,energy:0}).channels,loud=A.evaluate({robot:'blue',action:'explain',local:1.2,duration:2.4,time:0,speaking:true,energy:1}).channels;
assert.ok(loud.headP>quiet.headP+.03,'speech nods the head');
assert.ok(A.evaluate({robot:'orange',action:'listen',local:1,duration:2,look:-1}).channels.headY<-.1,'looks toward a speaker on screen left');
assert.throws(()=>A.evaluate({local:-1}),/Invalid/);
console.log('ROBOT_ACTING_PASS',A.actions.length,'actions x 2 robots');
