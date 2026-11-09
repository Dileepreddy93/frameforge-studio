// FrameForge hybrid offline-first recovery, including a synchronous immediate
// checkpoint against pagehide/refresh racing an IndexedDB commit. No network.
const DB='frameforge-hybrid-projects',STORE='documents',KEY='last-editor-project',HISTORY='editor-history',MIRROR=DB+':immediate';
const validText=text=>typeof text==='string'&&text.length>0&&text.length<=1_048_576;
// Earlier versions (plan phase 5): the latest save is always version 1; a new version starts once the newest one is
// at least SNAPSHOT_GAP old, so the list keeps edits a minute or more apart. Pure, so it is unit-tested in Node.
export const HISTORY_MAX=5,SNAPSHOT_GAP=60_000;
export function nextHistory(list,text,savedAt,{max=HISTORY_MAX,gap=SNAPSHOT_GAP}={}){
 const prior=Array.isArray(list)?list.filter(v=>validText(v?.text)&&Number.isFinite(v?.savedAt)):[];
 if(prior[0]&&savedAt<prior[0].savedAt)return prior;          // an older queued write never rewrites history
 const next=prior[0]&&savedAt-prior[0].savedAt<gap?[{text,savedAt},...prior.slice(1)]:[{text,savedAt},...prior];
 return next.slice(0,max);
}
export async function createProjectStore({indexedDB=globalThis.indexedDB,localStorage=globalThis.localStorage}={}){
 const fail=e=>{throw Error('Autosave failed; please download a project backup. '+e.message)};
 const check=text=>{if(!validText(text))throw Error('Project too large or missing')};
 const timestamp=value=>Number.isFinite(value)&&value>0?value:Date.now();
 const readMirror=()=>{
   try{const raw=localStorage?.getItem(MIRROR);if(!raw)return null;
     const o=JSON.parse(raw);
     return validText(o?.text)&&Number.isFinite(o?.savedAt)?o:null;
   }catch{return null}
 };
 const writeMirror=(text,savedAt)=>{
   check(text);
   if(!localStorage)return false;
   try{
     const prior=readMirror();
     if(prior?.savedAt>savedAt)return true; // A queued, older write cannot clobber a new edit.
     localStorage.setItem(MIRROR,JSON.stringify({text,savedAt}));
     return true;
   }catch{return false} // IndexedDB can still save when localStorage is blocked.
 };
 const clearMirror=()=>{try{localStorage?.removeItem(MIRROR)}catch{}};
 if(indexedDB?.open){
  try{
   const db=await new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB,1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||Error('IndexedDB blocked'));
   });
   const trans=(mode,action)=>new Promise((resolve,reject)=>{
     const tx=db.transaction(STORE,mode),st=tx.objectStore(STORE),req=action(st);
     let result=null;req.onsuccess=()=>{result=req.result};tx.oncomplete=()=>resolve(result);
     tx.onabort=()=>reject(tx.error||Error('Storage transaction aborted'));
     tx.onerror=()=>reject(tx.error||Error('Storage transaction failed'));
   });
   return Object.freeze({
     mode:'indexeddb',
     // This write completes synchronously on the input event, before navigation.
     saveNow:(text,at)=>writeMirror(text,timestamp(at)),
     save:async(text,at)=>{
       check(text);const savedAt=timestamp(at);
       writeMirror(text,savedAt);
       // The project and its version list are written in ONE transaction, so overlapping saves can't lose a version.
       try{await new Promise((resolve,reject)=>{
         const tx=db.transaction(STORE,'readwrite'),st=tx.objectStore(STORE);
         st.put({text,savedAt},KEY);
         const list=st.get(HISTORY);list.onsuccess=()=>st.put(nextHistory(list.result,text,savedAt),HISTORY);
         tx.oncomplete=()=>resolve();
         tx.onabort=()=>reject(tx.error||Error('Storage transaction aborted'));
         tx.onerror=()=>reject(tx.error||Error('Storage transaction failed'));
       })}
       catch(e){fail(e)}
     },
     history:async()=>((await trans('readonly',st=>st.get(HISTORY)))||[]).map(v=>({savedAt:v.savedAt,bytes:v.text.length})),
     version:async i=>((await trans('readonly',st=>st.get(HISTORY)))||[])[i]?.text??null,
     load:async()=>{
       const dbRecord=await trans('readonly',st=>st.get(KEY));
       const immediate=readMirror();
       // Keep the latest record, even when it is invalid/corrupt. The Creator
       // handles recovery safely and NEVER silently overwrites a damaged copy.
       return immediate&&(!dbRecord||immediate.savedAt>=dbRecord.savedAt)?
         immediate.text:dbRecord?.text??null;
     },
     clear:async()=>{await trans('readwrite',st=>{st.delete(HISTORY);return st.delete(KEY)});clearMirror()},
     close:()=>db.close()
   });
  }catch(e){ /* Private mode: use bounded localStorage when available. */ }
 }
 if(!localStorage)throw Error('No durable project storage. Use Download Project after every change.');
 try{localStorage.setItem(DB+':probe','1');localStorage.removeItem(DB+':probe')}
 catch{throw Error('Browser blocks local storage. Download your project to prevent losing edits.')}
 const LOCAL_HISTORY=DB+':history',readLocalHistory=()=>{try{return JSON.parse(localStorage.getItem(LOCAL_HISTORY)||'[]')}catch{return []}};
 const localSave=(text,at)=>{check(text);const savedAt=timestamp(at);
   try{localStorage.setItem(KEY,text);writeMirror(text,savedAt)}
   catch(e){fail(e)}
   // localStorage is small (about 5 MB): keep two earlier versions at most, and never fail a save over them.
   try{localStorage.setItem(LOCAL_HISTORY,JSON.stringify(nextHistory(readLocalHistory(),text,savedAt,{max:2})))}catch{}
   return true;
 };
 return Object.freeze({
   mode:'localStorage',
   saveNow:localSave,
   save:async(text,at)=>{localSave(text,at)},
   load:async()=>localStorage.getItem(KEY)||readMirror()?.text||null,
   history:async()=>readLocalHistory().map(v=>({savedAt:v.savedAt,bytes:v.text.length})),
   version:async i=>readLocalHistory()[i]?.text??null,
   clear:async()=>{localStorage.removeItem(KEY);localStorage.removeItem(LOCAL_HISTORY);clearMirror()},
   close:()=>{}
 });
}
export const EDITOR_RECOVERY_VERSION=1;

// One editing tab at a time (plan phase 5). Resolves true when this tab holds the Creator's lock for its whole life,
// false when another tab still has it after `wait` ms. The wait matters: on a refresh the old page can still hold the
// lock for a moment, and a refresh must never be mistaken for a second tab. No Web Locks API means true.
export function holdEditorLock(locks=globalThis.navigator?.locks,name='frameforge-creator-editor',{wait=2000}={}){
 if(!locks?.request)return Promise.resolve(true);
 return new Promise(resolve=>{
   const stop=typeof AbortController==='function'?new AbortController():null;
   const timer=setTimeout(()=>{stop?.abort();resolve(false)},wait);
   locks.request(name,stop?{signal:stop.signal}:{ifAvailable:true},lock=>{
     clearTimeout(timer);resolve(Boolean(lock));return lock?new Promise(()=>{}):undefined})
     .catch(e=>{if(e?.name!=='AbortError'){clearTimeout(timer);resolve(true)}});
 });
}
// Ask the browser to keep the Creator's storage (no eviction under pressure) and report space, for the status line.
export async function storageReport(storage=globalThis.navigator?.storage){
 const out={persisted:null,usage:null,quota:null,low:false};
 try{out.persisted=await storage?.persisted?.()||await storage?.persist?.()||false}catch{}
 try{const e=await storage?.estimate?.();if(e){out.usage=e.usage??null;out.quota=e.quota??null;
   out.low=Number.isFinite(e.quota)&&Number.isFinite(e.usage)&&e.quota-e.usage<50*1024*1024}}catch{}
 return out;
}
