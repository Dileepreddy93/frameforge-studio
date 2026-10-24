import fs from 'node:fs';
import assert from 'node:assert/strict';
const refs=JSON.parse(fs.readFileSync(new URL('../spec/reference-register.json',import.meta.url),'utf8'));
const gates=JSON.parse(fs.readFileSync(new URL('../spec/quality-gates.json',import.meta.url),'utf8'));
const ids=new Set();assert.equal(refs.version,1);assert.equal(gates.version,1);
for(const ref of refs.references){
 assert.ok(!ids.has(ref.id),ref.id);ids.add(ref.id);
 for(const k of ['url','status','role','nextTest','rights'])assert.ok(typeof ref[k]==='string'&&ref[k].length>3);
}
const phases=new Set();
for(const phase of gates.phases){
 assert.ok(!phases.has(phase.id));phases.add(phase.id);
 assert.ok(['planned','in_progress','verified'].includes(phase.status));
 assert.ok(phase.requirements.length>=4);
}
assert.equal(gates.phases.length,8);
for(const e of gates.evidence)assert.ok(phases.has(e.phase));
assert.equal(gates.referenceStatus,'not_met');
assert.ok(!gates.phases.some(p=>p.status==='verified'));
console.log('SOURCE_AND_GATE_CONTRACT_PASS');
