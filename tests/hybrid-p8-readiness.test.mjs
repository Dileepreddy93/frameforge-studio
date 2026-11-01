import assert from 'node:assert/strict';
import {EXPORT_PROFILES,validateRenderRequest,describeRenderCost,createExportSession,
 inspectBrowserExport} from '../src/hybrid-export-readiness.mjs';
assert.deepEqual(Object.keys(EXPORT_PROFILES),['preview','social','master']);
assert.equal(validateRenderRequest({seconds:2}).frames,60);
assert.equal(validateRenderRequest({profile:'preview',seconds:2}).frames,30);
assert.throws(()=>validateRenderRequest({seconds:185}),/180/);
assert.throws(()=>validateRenderRequest({seconds:4,format:'webm'}),/H264/);
assert.throws(()=>validateRenderRequest({seconds:4,hasAudio:false}),/soundtrack/);
const costs=describeRenderCost({seconds:2});
assert.ok(costs.estimatedRequiredBytes>40_000_000);
const supported={
 isSecureContext:true,location:{hostname:'localhost'},
 document:{createElement:()=>({getContext:x=>x==='webgl2'?{getExtension:()=>null}:null})},
 VideoEncoder:class{static async isConfigSupported(){return{supported:true}}},
 AudioEncoder:class{static async isConfigSupported(){return{supported:true}}},
 navigator:{storage:{estimate:async()=>({quota:1_000_000_000,usage:100_000_000}),
 persisted:async()=>false}}
};
const yes=await inspectBrowserExport({seconds:2,global:supported});
assert.equal(yes.ready,true);assert.equal(yes.browser.codecAAC,true);
const no=await inspectBrowserExport({seconds:2,global:{...supported,VideoEncoder:undefined}});
assert.equal(no.ready,false);assert.ok(no.errors.some(e=>e.includes('H.264')));
const low=await inspectBrowserExport({seconds:2,global:{...supported,
 navigator:{storage:{estimate:async()=>({quota:10_000_000,usage:9_800_000})}}}});
assert.equal(low.ready,false);
const job=createExportSession({seconds:2,profile:'preview'});
assert.equal(job.start().frames,30);
assert.throws(()=>job.frame(1),/in order/);
for(let i=0;i<30;i++)job.frame(i);
assert.equal(job.finish().state,'verifying');
assert.throws(()=>job.verified({fullDecode:false}),/verification failed/);
assert.equal(job.verified({fullDecode:true,codec:'h264',audio:'aac',
 frames:30,width:360,height:640}).state,'complete');
job.dispose();
assert.throws(()=>job.start(),/disposed/);
const abort=createExportSession({seconds:2});
abort.start();abort.abort();assert.equal(abort.status.cancelled,true);
assert.throws(()=>abort.frame(0),/Invalid export transition/);
console.log('HYBRID_P8_READINESS_PASS: 1080p profile, codec probes, storage fail-closed, no silent export, ordered frames and cancellation');