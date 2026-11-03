// FrameForge Ultimate P4 world provider; deterministic Ember sets with explicit
// stage coordinates, safe scene restoration, capped complexity, and disposal.
// No writes to legacy V6 arena/world implementation.
import * as T from '../vendor/three@0.180.0/three.module.min.js';
import {buildNature,deskAtmosphere} from './ember-world-engine.mjs';
import {GLTFLoader} from './vendor-gltf-loader.mjs';
import {inspectGLB,MAX_GLB_BYTES,inspectScene} from './rigged-asset-core.mjs';
import {validateWorld} from './ember-import-validator.mjs';

export const WORLD_PRESETS=Object.freeze(['forest','meadow','snow','desk']);
export const WORLD_TIMES=Object.freeze(['morning','golden','night']);
const within=(n,lo,hi)=>typeof n==='number'&&Number.isFinite(n)&&n>=lo&&n<=hi;
const v3=x=>Array.isArray(x)&&x.length===3&&x.every(Number.isFinite);
const disposeMaterial=m=>{
 if(!m)return;
 for(const x of (Array.isArray(m)?m:[m])){
   for(const k of ['map','normalMap','roughnessMap','metalnessMap','emissiveMap','aoMap','envMap'])x[k]?.dispose?.();
   x.dispose?.();
 }
};
function disposeGroup(group){
 group.traverse(o=>{o.geometry?.dispose?.();disposeMaterial(o.material)});
}
export function validateWorldOptions(o={}){
 if(!WORLD_PRESETS.includes(o.template))throw Error('Unknown Ember world template');
 if(o.time!==undefined&&!WORLD_TIMES.includes(o.time))throw Error('Invalid time of day');
 if(o.foliage!==undefined&&!within(o.foliage,0,1))throw RangeError('World foliage must be 0–1');
 if(o.wind!==undefined&&!within(o.wind,0,2))throw RangeError('World wind must be 0–2');
 if(o.particles!==undefined&&(!Array.isArray(o.particles)||o.particles.length>6||
   o.particles.some(p=>!['leaves','fireflies','dust','pollen','snow','rain','motes'].includes(p))))
   throw Error('World particles not supported');
 return {...o,time:o.time||'golden',foliage:o.foliage??.5,wind:o.wind??1};
}
function attachWorld(scene,source,descriptor,{stageOffset=[0,0,0]}={}){
 if(!v3(stageOffset))throw TypeError('World offset must be a finite 3D vector');
 const old={fog:scene.fog,background:scene.background,
  environment:scene.environment,environmentIntensity:scene.environmentIntensity};
 source.group.position.set(...stageOffset);
 scene.add(source.group);
 if(source.fog)scene.fog=source.fog;
 if(source.background)scene.background=source.background;
 if(source.environment)scene.environment=source.environment;
 if(source.environmentIntensity!==undefined)scene.environmentIntensity=source.environmentIntensity;
 const worldY=(source.groundY??0)+stageOffset[1];
 let disposed=false;
 return {
   setTime(time){
     if(disposed)throw Error('World disposed');
     if(!Number.isFinite(time)||time<0)throw RangeError('Invalid world time');
     source.animate?.(time);
     return {time,preset:descriptor.template||'imported'};
   },
   getStageAnchors(){
     if(disposed)throw Error('World disposed');
     const vec=p=>p?.toArray?.()||null;
     const center=[stageOffset[0],worldY+1.5,stageOffset[2]];
     const rawScreen=vec(source.screenPoint);
     const screen=rawScreen?rawScreen.map((v,i)=>v+stageOffset[i]):[stageOffset[0],worldY+2.0,stageOffset[2]-3];
     if(!v3(screen))throw Error('Invalid world screen anchor');
     return {center,screen,ground:[stageOffset[0],worldY,stageOffset[2]]};
   },
   // Optional world scenery: desk/imported worlds may have no wooden sign.
   // Null means absent, false means a real sign explicitly hidden.
   setScreenVisible(visible){
     if(disposed)throw Error('World disposed');
     if(typeof visible!=='boolean')throw TypeError('Scenic screen visibility must be boolean');
     return typeof source.setScreenVisible==='function'?source.setScreenVisible(visible):null;
   },
   getScreenVisible(){
     if(disposed)throw Error('World disposed');
     return typeof source.getScreenVisible==='function'?source.getScreenVisible():null;
   },
   getGroup:()=>source.group,
   dispose(){
     if(disposed)return;disposed=true;
     scene.remove(source.group);
     if(scene.fog===source.fog)scene.fog=old.fog;
     if(scene.background===source.background)scene.background=old.background;
     if(scene.environment===source.environment)scene.environment=old.environment;
     if(source.environmentIntensity!==undefined)scene.environmentIntensity=old.environmentIntensity;
     source.dispose?.();
     if(source._owned)disposeGroup(source.group);
   }
 };
}
export function auditWorldAsset(bytes,filename='world.glb'){
 if(!(bytes instanceof ArrayBuffer||ArrayBuffer.isView(bytes)))throw TypeError('Expected binary GLB bytes');
 const data=bytes instanceof ArrayBuffer?bytes:
  bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
 if(data.byteLength>MAX_GLB_BYTES)throw Error('World GLB exceeds 25 MiB project safety cap');
 const inspection=inspectGLB(data);
 const policy=validateWorld(new Uint8Array(data),filename);
 if(!policy.ok)throw Error('Invalid imported world: '+policy.errors.join('; '));
 const str=new TextDecoder().decode(new Uint8Array(data,20,new DataView(data).getUint32(12,true))).replace(/\u0000+$/,'').trimEnd();
 const json=JSON.parse(str);
 const safe=new Set(['KHR_materials_unlit','KHR_materials_clearcoat','KHR_materials_sheen',
  'KHR_texture_transform','KHR_lights_punctual','KHR_mesh_quantization']);
 for(const e of json.extensionsRequired||[])if(!safe.has(e))
   throw Error('World needs unsupported decoder/extension '+e);
 if(policy.triangles>800000)throw Error('World triangle budget exceeds conservative browser cap');
 return {buffer:data,inspection,policy};
}
export async function prepareImportedWorld(project,assets,{loader=new GLTFLoader()}={}){
 const d=project?.hybrid?.world;
 if(d?.provider!=='imported')return null;
 const v=assets?.get(d.assetId,'world');
 if(!v)throw Error('Imported world asset missing: '+d.assetId);
 const audit=auditWorldAsset(v.bytes,d.filename||'world.glb');
 const gltf=await new Promise((ok,fail)=>loader.parse(audit.buffer,'',ok,fail));
 const sceneInfo=inspectScene(gltf.scene,gltf.animations);
 if(sceneInfo.meshes<1)throw Error('Imported world has no actual mesh');
 return {gltf,audit,sceneInfo};
}
export function registerEmberWorlds(registry,{scene,renderer,preparedWorld=null,stageOffset=[0,0,0]}={}){
 if(!scene||typeof scene.add!=='function')throw TypeError('Three.js scene required');
 registry.registerWorld('procedural',({descriptor})=>{
   const o=validateWorldOptions(descriptor);
   if(o.template==='desk'){
     const atmo=deskAtmosphere(o.time,{view:o.view||'city',particles:o.particles});
     const floor=new T.Mesh(new T.PlaneGeometry(40,40),
       new T.MeshStandardMaterial({color:'#293746',roughness:.96}));
     floor.rotation.x=-Math.PI/2;atmo.group.add(floor);
     const key=new T.DirectionalLight('#ffca92',2.1);key.position.set(-3,6,5);atmo.group.add(key);
     const light=new T.HemisphereLight('#c4dbff','#303044',1.5);atmo.group.add(light);
     // Use actual atmosphere animation, not a placeholder background; own only our additions.
     return attachWorld(scene,{...atmo,screenPoint:new T.Vector3(0,2,-3),
       dispose(){atmo.dispose?.();floor.geometry.dispose();floor.material.dispose()}}
      ,o,{stageOffset});
   }
   // Ember's native procedural trees, grass, snow, light, sign, particles and sky.
   // A <=1 density value is capped before any GPU allocation.
   const world=buildNature(renderer,{preset:o.template,time:o.time,
     foliage:o.foliage,wind:o.wind,particles:o.particles});
   return attachWorld(scene,world,o,{stageOffset});
 });
 registry.registerWorld('imported',({descriptor})=>{
   if(!preparedWorld)throw Error('Call prepareImportedWorld() before creating the imported world session');
   const model=preparedWorld.gltf.scene;
   const group=new T.Group();group.add(model);
   let mixer=null;
   if(preparedWorld.gltf.animations.length){
     mixer=new T.AnimationMixer(model);
     for(const clip of preparedWorld.gltf.animations)mixer.clipAction(clip).play();
   }
   const source={group,groundY:0,_owned:true,
     animate:t=>mixer?.setTime(t)};
   return attachWorld(scene,source,descriptor,{stageOffset});
 });
}
