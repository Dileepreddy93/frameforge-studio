#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {inspectGLB} from '../src/rigged-asset-core.mjs';
const p=process.argv[2],out=process.argv[3];
if(!p||!out)throw Error('Usage: node tools/check-ara-candidate.mjs candidate.glb manifest.json');
const buffer=fs.readFileSync(p);
const bb=buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength);
const info=inspectGLB(bb);
const result={
 schema:'frameforge.ara-character-spike/1',
 generatorRepo:'https://github.com/olatunde85/3d-gen',
 generatorCommit:'8aa993d7141b6f37e5d16f611264e6f1ab520f30',
 generatorLicense:'MIT',
 assets:'MakeHuman CC0 system/core as described by Ara; CMU motion data includes separate no-resale terms',
 file:path.basename(p),
 sha256:crypto.createHash('sha256').update(buffer).digest('hex'),
 bytes:buffer.byteLength,
 glb:info,
 licenseAndSourceVerifiedAgainstPublisher:false,
 artisticAcceptance:'NOT_APPROVED',
 renderAcceptance:'PENDING',
 note:'Test source pinned, secondary MakeHuman assets downloaded by setup are not content-hash pinned'
};
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log('ARA_CANDIDATE_GLTF_INVENTORY '+JSON.stringify(result));
assert.ok(info.meshes>0,'No actual mesh');
assert.ok(info.skinDefinitions>0,'Export is not rigged');
assert.ok(info.animationDefinitions>0,'Export must have timeline clips');
assert.ok(info.morphNames.filter(x=>/(blink|brow|smile|jaw|mouth|eye)/i.test(x)).length>=5,'No expressive blendshape names; do not claim facial controls');
