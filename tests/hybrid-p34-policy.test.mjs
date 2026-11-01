// Contract-level invalid-input and security regression for P3/P4 imports.
import assert from 'node:assert/strict';
import {inspectGLB} from '../src/rigged-asset-core.mjs';
import {auditRiggedAsset} from '../src/hybrid-rigged-provider.mjs';
import {auditWorldAsset,validateWorldOptions,WORLD_PRESETS} from '../src/hybrid-world-provider.mjs';

const makeGLB=doc=>{
 const encoded=new TextEncoder().encode(JSON.stringify(doc));
 const len=Math.ceil(encoded.length/4)*4;
 const buf=new ArrayBuffer(20+len),v=new DataView(buf);
 v.setUint32(0,0x46546c67,true);v.setUint32(4,2,true);
 v.setUint32(8,20+len,true);v.setUint32(12,len,true);v.setUint32(16,0x4e4f534a,true);
 const out=new Uint8Array(buf,20,len);out.fill(32);out.set(encoded);
 return buf;
};
const base={asset:{version:'2.0'},meshes:[{primitives:[{attributes:{POSITION:0}}]}],
 accessors:[{count:300}],skins:[{joints:[0]}],nodes:[{name:'hips'}]};
const external=makeGLB({...base,images:[{uri:'https://example.org/track.png'}]});
assert.throws(()=>auditRiggedAsset(external),/external asset/);
assert.throws(()=>auditWorldAsset(external),/external asset/);
const compressed=makeGLB({...base,extensionsRequired:['KHR_draco_mesh_compression']});
assert.throws(()=>auditRiggedAsset(compressed),/unsupported|Missing humanoid|unconfigured|requires/i);
const invalid=new ArrayBuffer(24);
assert.throws(()=>auditRiggedAsset(invalid),/header/);
assert.throws(()=>auditWorldAsset(invalid),/header/);
assert.equal(WORLD_PRESETS.length,4);
for(const template of WORLD_PRESETS){
 const o=validateWorldOptions({template,time:'night',foliage:.2,wind:1});
 assert.equal(o.template,template);
}
for(const o of [{template:'unknown'},{template:'forest',foliage:999},
 {template:'snow',wind:-3},{template:'desk',time:'bad'},
 {template:'meadow',particles:['remote-script']}]){
 assert.throws(()=>validateWorldOptions(o));
}
assert.equal(inspectGLB(makeGLB(base)).meshes,1);
console.log('HYBRID_P34_POLICY_PASS: safe self-contained GLB, no external files, bounded forest and actor configs');
