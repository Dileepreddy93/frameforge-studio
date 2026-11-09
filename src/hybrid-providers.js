/* FrameForge Ultimate P1 provider adapters.
 * Contract-only additions. FrameForge's existing scene, actors, voices, and export
 * are not replaced; original V6 episodes MUST use their existing renderer.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./hybrid-project-core.js'));
 else root.FrameForgeHybridProviders=factory(root.FrameForgeHybridProjectCore);
})(typeof globalThis!=='undefined'?globalThis:this,function(core){
 'use strict';
 if(!core)throw Error('Hybrid project core required');
 const ID=/^[a-z][a-z0-9-]{0,39}$/;
 const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 const clean=x=>JSON.parse(JSON.stringify(x));
 const isVector=v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite);
 const required=(obj,methods,label)=>{
   if(!isObject(obj)||methods.some(m=>typeof obj[m]!=='function'))
     throw TypeError(label+' requires '+methods.join(', '));
   return obj;
 };
 function createRegistry(){
   const actors=new Map(),worlds=new Map();
   let locked=false;
   function register(type,name,make){
     if(locked)throw Error('Provider registry is locked');
     if(!ID.test(name)||name==='__proto__')throw TypeError('Invalid provider name');
     if(typeof make!=='function')throw TypeError('Provider factory must be a function');
     const target=type==='actor'?actors:worlds;
     if(target.has(name))throw Error('Duplicate '+type+' provider '+name);
     target.set(name,make);
   }
   return Object.freeze({
     registerActor:(name,make)=>register('actor',name,make),
     registerWorld:(name,make)=>register('world',name,make),
     hasActor:name=>actors.has(name),hasWorld:name=>worlds.has(name),
     lock:()=>{locked=true},
     createActor:(name,context)=>{
       if(!actors.has(name))throw Error('Unavailable actor provider '+name);
       return required(actors.get(name)(context),['setPose','getAnchors','dispose'],'ActorProvider');
     },
     createWorld:(name,context)=>{
       if(!worlds.has(name))throw Error('Unavailable world provider '+name);
       return required(worlds.get(name)(context),['setTime','getStageAnchors','dispose'],'WorldProvider');
     }
   });
 }
 function createMemoryAssetStore({maxBytes=25*1024*1024}={}){
   if(!Number.isSafeInteger(maxBytes)||maxBytes<1024)throw RangeError('Invalid asset limit');
   const objects=new Map();
   return Object.freeze({
     put:(entry,bytes)=>{
       if(!isObject(entry)||!ID.test(entry.id)||!['character','world','backdrop'].includes(entry.kind)||
         entry.uri!=='asset://'+entry.id)throw TypeError('Invalid asset descriptor');
       if(!(bytes instanceof ArrayBuffer||ArrayBuffer.isView(bytes)))throw TypeError('Binary bytes required');
       const data=bytes instanceof ArrayBuffer?new Uint8Array(bytes):new Uint8Array(bytes.buffer,bytes.byteOffset,bytes.byteLength);
       if(!data.byteLength||data.byteLength>maxBytes)throw RangeError('Asset size exceeds configured limit');
       if(objects.has(entry.id))throw Error('Duplicate asset '+entry.id);
       objects.set(entry.id,{entry:clean(entry),bytes:new Uint8Array(data)});
       return entry.id;
     },
     get:(id,kind)=>{
       const r=objects.get(id);
       if(!r)return null;
       if(kind&&kind!==r.entry.kind)throw TypeError('Asset kind mismatch for '+id);
       return {entry:clean(r.entry),bytes:new Uint8Array(r.bytes)};
     },
     has:id=>objects.has(id),
     delete:id=>objects.delete(id),
     count:()=>objects.size
   });
 }
 function createCameraDirector(){
   return Object.freeze({evaluate({shot,anchors,worldAnchors}){
     const camera=typeof shot.camera==='string'?{kind:shot.camera}:shot.camera;
     let focus=null,secondary=null;
     const actor=key=>{
       const a=anchors[key];
       if(!a||!isVector(a.head))throw Error('Missing head anchor for '+key);
       return [...a.head];
     };
     if(camera.kind==='actor'||['dev','blue','orange'].includes(camera.kind))focus=actor(camera.target||camera.kind);
     if(camera.kind==='two'){focus=actor(camera.target);secondary=actor(camera.secondary)}
     if(camera.kind==='screen'){
       if(!isVector(worldAnchors.screen))throw Error('World has no screen anchor');
       focus=[...worldAnchors.screen];
     }
     if(camera.kind==='wide'){
       if(!isVector(worldAnchors.center))throw Error('World has no stage center');
       focus=[...worldAnchors.center];
     }
     return {kind:camera.kind,focus,secondary,framing:shot.framing?clean(shot.framing):null};
   }});
 }
 function createAudioDirector(){
   return Object.freeze({evaluate({shot,localTime}){
     if(!Number.isFinite(localTime)||localTime<0||localTime>shot.duration+1e-7)
       throw RangeError('Invalid audio time');
     return {speaker:shot.speaker,dialogue:shot.dialogue,
       lead:shot.timing?.lead??.15,pauseAfter:shot.timing?.pauseAfter??.35,
       pace:shot.timing?.pace??1,
       sfx:clean(shot.sfx??[])};
   }});
 }
 function createSession(project,{registry,assets,createCamera=createCameraDirector(),createAudio=createAudioDirector()}={}){
   core.assertProject(project);
   if(project.schema===core.legacySchema)
     throw Error('Legacy FrameForge projects must use the existing V6 renderer, not the hybrid session');
   required(registry,['createActor','createWorld'],'ProviderRegistry');
   required(createCamera,['evaluate'],'CameraDirector');
   required(createAudio,['evaluate'],'AudioDirector');
   const h=project.hybrid;
   // V2 legacy-only documents are explicitly routed to the original V6 renderer.
   if(h.world.provider==='legacy'||project.characters.some(c=>h.cast[c.id].provider==='legacy'))
     throw Error('Legacy actors/worlds are only available through the original FrameForge renderer until P2 adapters are integrated');
   const instances=new Map(),created=[];
   let world,disposed=false;
   try {
     world=registry.createWorld(h.world.provider,{descriptor:clean(h.world),project:clean(project),assets});
     created.push(world);
     for(const actor of project.characters){
       const descriptor=h.cast[actor.id];
       const item=registry.createActor(descriptor.provider,{actor:clean(actor),descriptor:clean(descriptor),assets});
       instances.set(actor.id,item);created.push(item);
     }
   }catch(err){for(const item of created.reverse())try{item.dispose()}catch{};throw err}
   const duration=project.shots.reduce((a,s)=>a+s.duration,0);
   let last=null;
   return Object.freeze({
     duration,
     seek(t){
       if(disposed)throw Error('Session has been disposed');
       const at=core.timeAt(project,t);
       const stage=world.setTime(t,at.shot);
       const worldAnchors=world.getStageAnchors();
       if(!isObject(worldAnchors))throw TypeError('World anchors required');
       const anchors={};
       for(const [id,item] of instances){
         item.setPose(t,at.shot,at.shot.cast?.[id]??{action:id===at.speaker?'explain':'listen',emotion:'neutral'});
         const a=item.getAnchors();
         if(!isObject(a)||!isVector(a.head)||!isVector(a.root))throw TypeError('Invalid actor anchors for '+id);
         anchors[id]=clean(a);
       }
       const camera=createCamera.evaluate({shot:at.shot,anchors,worldAnchors,stage});
       const audio=createAudio.evaluate({shot:at.shot,localTime:at.localTime});
       last={...at,anchors,worldAnchors:clean(worldAnchors),camera,audio};
       return clean(last);
     },
     last:()=>last?clean(last):null,
     instances:()=>new Map(instances),
     world:()=>world,
     dispose(){
       if(disposed)return;
       disposed=true;for(const item of created.reverse())item.dispose();
       instances.clear();last=null;
     }
   });
 }
 return Object.freeze({createRegistry,createMemoryAssetStore,createCameraDirector,createAudioDirector,createSession});
});
