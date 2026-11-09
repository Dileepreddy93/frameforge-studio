// FrameForge hybrid offline-first recovery, including a synchronous immediate
// checkpoint against pagehide/refresh racing an IndexedDB commit. No network.
const DB='frameforge-hybrid-projects',STORE='documents',KEY='last-editor-project',MIRROR=DB+':immediate';
const validText=text=>typeof text==='string'&&text.length>0&&text.length<=1_048_576;
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
       try{await trans('readwrite',st=>st.put({text,savedAt},KEY))}
       catch(e){fail(e)}
     },
     load:async()=>{
       const dbRecord=await trans('readonly',st=>st.get(KEY));
       const immediate=readMirror();
       // Keep the latest record, even when it is invalid/corrupt. The Creator
       // handles recovery safely and NEVER silently overwrites a damaged copy.
       return immediate&&(!dbRecord||immediate.savedAt>=dbRecord.savedAt)?
         immediate.text:dbRecord?.text??null;
     },
     clear:async()=>{await trans('readwrite',st=>st.delete(KEY));clearMirror()},
     close:()=>db.close()
   });
  }catch(e){ /* Private mode: use bounded localStorage when available. */ }
 }
 if(!localStorage)throw Error('No durable project storage. Use Download Project after every change.');
 try{localStorage.setItem(DB+':probe','1');localStorage.removeItem(DB+':probe')}
 catch{throw Error('Browser blocks local storage. Download your project to prevent losing edits.')}
 const localSave=(text,at)=>{check(text);
   try{localStorage.setItem(KEY,text);writeMirror(text,timestamp(at));return true}
   catch(e){fail(e)}
 };
 return Object.freeze({
   mode:'localStorage',
   saveNow:localSave,
   save:async(text,at)=>{localSave(text,at)},
   load:async()=>localStorage.getItem(KEY)||readMirror()?.text||null,
   clear:async()=>{localStorage.removeItem(KEY);clearMirror()},
   close:()=>{}
 });
}
export const EDITOR_RECOVERY_VERSION=1;
