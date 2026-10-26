import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
const pathArg=process.argv[2];
assert.ok(pathArg,'Provide an evidence manifest path');
const obj=JSON.parse(fs.readFileSync(pathArg,'utf8'));
assert.equal(obj.schema,'frameforge.reference-evidence/1');
assert.equal(obj.source_name,'frameforge-v4-complete-director-41s.mp4');
assert.equal(obj.source_sha256,'7aa90314e91208ad14254b70f2e5b8738c3333544789a46ea167b9e41daf4590');
assert.equal(obj.frames.length,5);
assert.equal(obj.identity_verified_against_publisher,false);
for(const frame of obj.frames) {
 assert.ok(frame.timestamp_s>=0&&frame.timestamp_s<obj.duration_s);
 assert.match(frame.sha256,/^[0-9a-f]{64}$/);
 assert.ok(fs.statSync(path.join(path.dirname(pathArg),frame.path)).size>1000);
}
console.log('PHASE0_FRAME_EVIDENCE_MANIFEST_PASS',JSON.stringify({frames:obj.frames.length,sha256:obj.source_sha256}));
