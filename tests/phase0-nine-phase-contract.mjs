import fs from 'node:fs';
import assert from 'node:assert/strict';
const p=JSON.parse(fs.readFileSync('spec/implementation-plan-v2.json','utf8'));
assert.equal(p.schema,'frameforge.phases/2');assert.equal(p.phases.length,9);
assert.deepEqual(p.phases.map(x=>x.id),Array.from({length:9},(_,i)=>'P'+i));
assert.ok(p.phases.every(x=>['planned','in_progress','verified'].includes(x.status)));
assert.ok(!p.phases.some(x=>x.exitGateApproved));
const doc=fs.readFileSync(p.source,'utf8');
for(let i=0;i<9;i++)assert.ok(doc.includes('P'+i+' —'),'Missing controlling phase P'+i);
for(const file of ['docs/EXECUTION_LEDGER.md','docs/REFERENCE_RESEARCH_REGISTER.md','docs/VISUAL_QUALITY_RUBRIC.md','docs/TOOLCHAIN_REPRODUCIBILITY.md','tools/verify-phase0.mjs','tests/phase0-video-playback.cjs'])
 assert.ok(fs.statSync(file).size>100);
const csv=fs.readFileSync('docs/REFERENCE_SHOT_MATRIX.csv','utf8').trim().split(/\r?\n/);
assert.equal(csv.length,15,'1 header + 14 zero-latency shot rows');
assert.ok(csv.every((line,i)=>i===0||line.startsWith('own-zero-latency,')));
console.log('PHASE0_NINE_PHASE_CONTRACT_PASS');
