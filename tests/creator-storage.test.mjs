// Phase 5: never lose a customer's work. Earlier versions, localStorage-only mode, a full quota, the editor lock.
import assert from 'node:assert/strict';
import {nextHistory,createProjectStore,holdEditorLock,storageReport,HISTORY_MAX} from '../src/hybrid-editor-storage.mjs';

// Versions: newest first, at least a minute apart, at most five; an older queued write never rewrites history.
let h=[];
for(const [text,at] of [['a',0],['b',10e3],['c',70e3],['d',75e3],['e',200e3],['f',300e3],['g',400e3],['h',500e3]])h=nextHistory(h,text,at);
assert.deepEqual(h.map(v=>v.text),['h','g','f','e','d']);
assert.equal(h.length,HISTORY_MAX);
assert.deepEqual(nextHistory(h,'old',1).map(v=>v.text),h.map(v=>v.text),'a late, older write is ignored');
assert.deepEqual(nextHistory([{text:'',savedAt:1},{nope:1}],'x',5).map(v=>v.text),['x'],'damaged entries are dropped');

// localStorage-only mode (private windows): saves, keeps two earlier versions, and restores them.
const fakeStorage=(limit=Infinity)=>{const m=new Map();return {m,
  getItem:k=>m.has(k)?m.get(k):null,removeItem:k=>m.delete(k),
  setItem:(k,v)=>{const size=[...m].reduce((n,[kk,vv])=>n+(kk===k?0:vv.length),0)+String(v).length;
    if(size>limit)throw Object.assign(Error('QuotaExceededError'),{name:'QuotaExceededError'});m.set(k,String(v))}}};
const ls=fakeStorage();
const store=await createProjectStore({indexedDB:undefined,localStorage:ls});
assert.equal(store.mode,'localStorage');
await store.save('{"v":1}',1000);await store.save('{"v":2}',90_000);await store.save('{"v":3}',200_000);
assert.equal(await store.load(),'{"v":3}');
assert.deepEqual((await store.history()).map(v=>v.bytes),[7,7],'two versions kept in localStorage mode');
assert.equal(await store.version(1),'{"v":2}');

// A full quota fails the save loudly (the Creator then tells the user to download), and never corrupts what's saved.
const tight=fakeStorage(40);
const small=await createProjectStore({indexedDB:undefined,localStorage:tight});
await small.save('{"ok":1}',1);
await assert.rejects(small.save('{"too":"'+'x'.repeat(60)+'"}',2),/Autosave failed; please download a project backup/);
assert.equal(await small.load(),'{"ok":1}','the last good save survives a failed one');

// The editor lock: the first tab gets it; a second tab is told no; no Web Locks API means no lock to wait for.
// Like the real API: a request for a held lock waits until it is free or its signal aborts.
const held=new Map();
const locks={request:(name,opts,cb)=>{
  if(!held.has(name)){held.set(name,true);cb({name});return new Promise(()=>{})}
  return new Promise((_,reject)=>{
    const free=setInterval(()=>{if(!held.has(name)){clearInterval(free);held.set(name,true);cb({name})}},5);
    opts.signal?.addEventListener('abort',()=>{clearInterval(free);reject(Object.assign(Error('aborted'),{name:'AbortError'}))});
  })}};
assert.equal(await holdEditorLock(locks,'lock-a',{wait:50}),true);
assert.equal(await holdEditorLock(locks,'lock-a',{wait:50}),false,'a second tab gives up after the wait');
// A refresh: the old page lets go a moment after the new page asks; the new page still gets the lock.
setTimeout(()=>held.delete('lock-a'),20);
assert.equal(await holdEditorLock(locks,'lock-a',{wait:200}),true,'a refresh is not mistaken for a second tab');
assert.equal(await holdEditorLock(undefined),true);

// Storage report: asks for persistent storage and flags low space (< 50 MB free).
const report=await storageReport({persisted:async()=>false,persist:async()=>true,estimate:async()=>({usage:990e6,quota:1000e6})});
assert.deepEqual(report,{persisted:true,usage:990e6,quota:1000e6,low:true});
console.log('CREATOR_STORAGE_TEST_PASS versions, localStorage mode, full quota, editor lock, storage report');
