const assert=require('node:assert/strict');
const {evaluate,emotions,version}=require('../src/performance-core.js');
assert.match(version,/v5\.2/);
assert.ok(emotions.length>=5);
const base={time:1.35,local:.55,duration:2.7,speaking:true,energy:.5};
const poses=Object.fromEntries(emotions.map(emotion=>[emotion,evaluate({...base,emotion})]));
for(const p of Object.values(poses)){
 for(const [k,v] of Object.entries(p))assert.ok(Number.isFinite(v),'not finite '+k);
 assert.ok(p.lid>=0&&p.lid<=1);assert.ok(p.mouthOpen>=0&&p.mouthOpen<=1);
 assert.ok(p.mouthWidth>=.48&&p.mouthWidth<=1.35);
}
assert.ok(poses.happy.smile>.6);
assert.ok(poses.worried.smile<-.5);
assert.ok(poses.surprised.round>.7);
assert.ok(poses.surprised.brow>.7);
assert.ok(poses.angry.brow<0);
assert.ok(poses.happy.cheek>poses.neutral.cheek);
assert.deepEqual(evaluate({...base,emotion:'happy'}),evaluate({...base,emotion:'happy'}),'frame seeking must be deterministic');
const begin=evaluate({...base,local:0,emotion:'surprised',fromEmotion:'neutral'});
const mid=evaluate({...base,local:.10,emotion:'surprised',fromEmotion:'neutral'});
const end=evaluate({...base,local:.30,emotion:'surprised',fromEmotion:'neutral'});
assert.ok(begin.round<mid.round&&mid.round<end.round,'smooth transition preserves motion continuity');
const talking=evaluate({...base,emotion:'neutral',speaking:true,energy:.9});
const quiet=evaluate({...base,emotion:'neutral',speaking:false,energy:0});
assert.ok(talking.mouthOpen>quiet.mouthOpen+.45,'mouth responds to dialogue signal');
for(const input of [{time:NaN},{time:-2},{duration:0},{local:Infinity},{emotion:'invented'}])assert.throws(()=>evaluate(input));
let blinkAt=null;
for(let i=0;i<700;i++){const t=i/100,p=evaluate({time:t,local:t,duration:9});if(p.blink>.75){blinkAt=t;break}}
assert.ok(blinkAt!==null,'deterministic blinks occur');
const blink=evaluate({time:blinkAt,local:blinkAt,duration:9});
const open=evaluate({time:blinkAt+.33,local:blinkAt+.33,duration:9});
assert.ok(blink.lid<open.lid*.5,'blink closes eyelid');
for(let i=0;i<1200;i++){
 const t=i/30,p=evaluate({time:t,local:t%2.6,duration:2.6,emotion:emotions[i%emotions.length],speaking:i%2===1,energy:Math.abs(Math.sin(t))});
 assert.ok(p.mouthOpen<=1&&p.lid<=1&&Number.isFinite(p.headRoll));
}
console.log('V5_2_PERFORMANCE_CORE_PASS: emotional distinction, deterministic blinks, easing, 1200 frames');
// DEV's body acting (M1.4): every project action has its own pose, starts and ends at rest, overshoots and settles,
// and is a pure function of time.
{
 const acting=require('../src/dev-acting-core.js');
 assert.deepEqual([...acting.actions].sort(),[...require('../src/project-core.js').actions].sort(),'one body performance per project action');
 const at=(action,local,extra={})=>acting.evaluate({action,local,duration:2.4,accentAt:.45,time:local,...extra});
 const reach=p=>Math.max(...Object.entries(p.channels).filter(([k])=>/^(L|R)\.(raise|out|bend)$|^spineP$|^headP$|^crouch$/.test(k)).map(([,v])=>Math.abs(v)));
 const holds={};
 for(const action of acting.actions){
  assert.deepEqual(at(action,1.3),at(action,1.3),action+' is deterministic');
  assert.ok(reach(at(action,0))<.05,action+' starts at rest');
  assert.ok(reach(at(action,2.39))<.12,action+' returns toward rest before the cut');
  for(let f=0;f<=72;f++)for(const v of Object.values(at(action,f/30).channels))assert.ok(Number.isFinite(v)&&Math.abs(v)<3.2,action+' stays in joint range');
  holds[action]=JSON.stringify(Object.values(at(action,1.45).channels).map(v=>v.toFixed(2)));
 }
 assert.equal(new Set(Object.values(holds)).size,acting.actions.length,'every action holds a different pose');
 // The strike overshoots its hold and settles back (springs), and a jump leaves the floor.
 const out=[...Array(61).keys()].map(f=>at('celebrate',f/30).channels['L.out']);
 const peak=Math.max(...out),settled=at('celebrate',1.5).channels['L.out'];
 assert.ok(peak>settled+.02,'arms overshoot their hold before settling');
 assert.ok(Math.max(...[...Array(61).keys()].map(f=>at('surprise',f/30).channels.hop))>.03,'surprise hops');
 assert.ok(at('typing',1.2).hands.L==='relaxed'&&at('announce',1.4).hands.R==='point'&&at('celebrate',1.4).hands.L==='fist','hands change shape per action');
 assert.throws(()=>acting.evaluate({action:'typing',local:-1,duration:2}));
 console.log('M1_4_DEV_ACTING_PASS: '+acting.actions.length+' actions, rest-to-rest, distinct holds, springs, hops, hand shapes');
}
