import fs from 'node:fs';
import assert from 'node:assert/strict';
const r=JSON.parse(fs.readFileSync('spec/git-blame-reference.json','utf8'));
assert.equal(r.schema,'frameforge.exact-reference/1');
assert.equal(r.source.sha256,'560ca0dd7fc3b8f0e762dd818423a15e2192029f40383765a5db52b49029247e');
assert.equal(r.source.bytes,3365415);
assert.equal(r.technical.frames,1564);
assert.equal(r.technical.fps,'30/1');
assert.equal(r.technical.codec_video,'h264');
assert.equal(r.technical.codec_audio,'aac');
assert.equal(r.extracted_stills.count,24);
assert.equal(r.extracted_stills.frames.length,24);
assert.ok(r.extracted_stills.frames.every(x=>x.time_s>=0&&x.time_s<r.technical.duration_s&&/^[a-f0-9]{64}$/.test(x.sha256)));
const lines=fs.readFileSync('docs/GIT_BLAME_SHOT_MATRIX.csv','utf8').trim().split(/\r?\n/);
assert.equal(lines.length,28);
const times=lines.slice(1).map(l=>l.match(/^"git-blame.mp4","[0-9]+","([0-9.]+)","([0-9.]+)"/));
assert.ok(times.every(Boolean),'Shot CSV must have 27 candidate rows');
for(let i=0;i<times.length;i++) {
 const a=+times[i][1],b=+times[i][2];assert.ok(b>a,'positive shot interval');
 if(i)assert.ok(Math.abs(a-(+times[i-1][2]))<=.002,'noncontiguous intervals');
}
assert.ok(Math.abs(+times.at(-1)[2]-r.technical.duration_s)<.002);
assert.equal(r.source.publisher_provenance,'not_authenticated');
console.log('GIT_BLAME_REFERENCE_CONTRACT_PASS: verified metadata, 24 extracted-frame hashes, 27 candidate intervals; source media bytes not part of CI');
