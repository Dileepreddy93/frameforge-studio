import assert from 'node:assert/strict';
import {inspectGLB,applyMorphPreset,applyMorphControls,inspectScene,EXPRESSION_NAMES} from '../src/rigged-asset-core.mjs';
const encode=text=>new TextEncoder().encode(text);
function makeGLB(doc){
 const j=encode(JSON.stringify(doc));const len=Math.ceil(j.length/4)*4;
 const b=new ArrayBuffer(20+len);const d=new DataView(b);d.setUint32(0,0x46546c67,true);d.setUint32(4,2,true);
 d.setUint32(8,20+len,true);d.setUint32(12,len,true);d.setUint32(16,0x4e4f534a,true);
 const a=new Uint8Array(b,20,len);a.fill(32);a.set(j);return b;
}
const src=makeGLB({asset:{version:'2.0'},skins:[{}],animations:[{name:'idle'}],meshes:[{extras:{targetNames:['mouthSmile','jawOpen']},primitives:[{targets:[{},{}]}]}]});
const d=inspectGLB(src);
assert.equal(d.skinDefinitions,1);assert.equal(d.animationDefinitions,1);
assert.deepEqual(d.morphNames,['jawOpen','mouthSmile']);assert.equal(d.meshes,1);
assert.throws(()=>inspectGLB(new ArrayBuffer(21)),/missing glTF header/);
const wrong=src.slice(0);new DataView(wrong).setUint32(8,999,true);assert.throws(()=>inspectGLB(wrong),/length/);
assert.throws(()=>inspectGLB(makeGLB({asset:{version:'2.0'},images:[{uri:'https://example.com/x.png'}]})),/external asset reference/);
assert.ok(EXPRESSION_NAMES.includes('surprised'));
const channels={mouthSmile:0,jawOpen:1,eyeblinkLeft:2};
const mesh={morphTargetDictionary:channels,morphTargetInfluences:[0,0,0]};
const root={traverse:f=>f(mesh)};
const h=applyMorphPreset(root,'happy');assert.equal(h.matched,1);assert.equal(mesh.morphTargetInfluences[0],.86);
const surprised=applyMorphPreset(root,'surprised');assert.equal(surprised.matched,1);
assert.equal(mesh.morphTargetInfluences[0],0);assert.equal(mesh.morphTargetInfluences[1],.74);
assert.throws(()=>applyMorphPreset(root,'madeup'),/Unknown/);
const fake={traverse:f=>{f({isBone:true});f({isSkinnedMesh:true,isMesh:true,geometry:{attributes:{position:{count:60}},index:{count:120}},morphTargetDictionary:channels})}};
const scene=inspectScene(fake,[{name:'Idle'}]);assert.equal(scene.skinnedMeshes,1);assert.equal(scene.bones,1);assert.equal(scene.triangles,40);
console.log('RIGGED_ASSET_CORE_PASS',JSON.stringify({formats:['GLB2'],meshes:d.meshes,expressions:EXPRESSION_NAMES.length}));

const manual=applyMorphControls(root,{mouthSmile:.98,jawOpen:.40});
assert.equal(manual.matched,2);
assert.equal(mesh.morphTargetInfluences[0],.98);
assert.equal(mesh.morphTargetInfluences[1],.40);
assert.throws(()=>applyMorphControls(root,{mouthSmile:1.5}),/between zero and one/);
applyMorphPreset(root,'neutral');applyMorphControls(root,{mouthSmile:.67});
assert.equal(mesh.morphTargetInfluences[0],.67,'manual shape survives deterministic seek');
console.log('P1_REAL_MORPH_OVERRIDE_PASS');
