// P7 offline-first project recovery: IndexedDB transaction + versioned document.
// No network storage, no silent loss after quota failures and no user identity.
const DB='frameforge-hybrid-projects',STORE='documents',KEY='last-editor-project';
export async function createProjectStore({indexedDB=globalThis.indexedDB,localStorage=globalThis.localStorage}={}){
 const fail=e=>{throw new Error('Autosave failed; please download a project backup. '+e.message)};
 if(indexedDB?.open){
  try{
   const db=await new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB,1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||Error('IndexedDB blocked'))
   });
   const trans=(mode,action)=>new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,mode),st=tx.objectStore(STORE),req=action(st);
    let result=null;req.onsuccess=()=>{result=req.result};tx.oncomplete=()=>resolve(result);
    tx.onabort=()=>reject(tx.error||Error('Storage transaction aborted'));
    tx.onerror=()=>reject(tx.error||Error('Storage transaction failed'));
   });
   return Object.freeze({
    mode:'indexeddb',
    save:async(value)=>{if(typeof value!=='string'||value.length>1_048_576)throw Error('Project too large');
      try{await trans('readwrite',st=>st.put({text:value,savedAt:Date.now()},KEY))}
      catch(e){fail(e)}},
    load:async()=>{const v=await trans('readonly',st=>st.get(KEY));return v?.text??null},
    clear:async()=>{await trans('readwrite',st=>st.delete(KEY))},
    close:()=>db.close()
   });
  }catch(e){ /* May be private mode: use bounded localStorage if functional. */ }
 }
 if(!localStorage)throw Error('No durable project storage. Use Download Project after every change.');
 try{localStorage.setItem(DB+':probe','1');localStorage.removeItem(DB+':probe')}
 catch{throw Error('Browser blocks local storage. Download your project to prevent losing edits.')}
 return Object.freeze({
   mode:'localStorage',
   save:async text=>{if(typeof text!=='string'||text.length>1_048_576)throw Error('Project too large');
     try{localStorage.setItem(KEY,text)}catch(e){fail(e)}},
   load:async()=>localStorage.getItem(KEY),
   clear:async()=>{localStorage.removeItem(KEY)},
   close:()=>{}
 });
}
export const EDITOR_RECOVERY_VERSION=1;