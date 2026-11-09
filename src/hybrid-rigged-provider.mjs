// FrameForge Ultimate P3: validated, local-only GLB/VRM humanoid integration.
// No remote textures, no implicit downloads, no silent success without a usable rig.
// The existing V6 renderer, its three original models and asset cache are untouched.
import * as T from '../vendor/three@0.180.0/three.module.min.js';
import {GLTFLoader} from './vendor-gltf-loader.mjs';
import {inspectGLB,MAX_GLB_BYTES,inspectScene} from './rigged-asset-core.mjs';
import {validateCharacter,IMPORT_RULES} from './ember-import-validator.mjs';
import {buildImportedRig,animateImported,drawImportedFace,importedHeadWorld,disposeImported} from './ember-imported-rig.mjs';
import {FACES} from './ember-actor-provider.mjs';

const MIME_ALLOWED=new Set(['KHR_materials_unlit','KHR_materials_clearcoat','KHR_materials_sheen',
 'KHR_materials_specular','KHR_materials_transmission','KHR_materials_ior',
 'KHR_materials_emissive_strength','KHR_texture_transform','KHR_lights_punctual',
 'KHR_mesh_quantization','VRM','VRMC_vrm']);
const COPY=b=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);
const vec=(v,fallback)=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite)?v:fallback;
const actionMap={listen:'none',typing:'type',react:'nod',question:'shrug',plead:'handsup',
 alarm:'handsup',surprise:'handsup',defeat:'facepalm',announce:'explain',celebrate:'cheer',anticipate:'think'};
export function auditRiggedAsset(bytes,filename='character.glb'){
 if(!(bytes instanceof ArrayBuffer||ArrayBuffer.isView(bytes)))throw TypeError('Expected binary GLB bytes');
 const data=bytes instanceof ArrayBuffer?bytes:COPY(bytes);
 if(data.byteLength>MAX_GLB_BYTES)throw Error('Imported rig exceeds 25 MiB');
 const info=inspectGLB(data);
 const report=validateCharacter(new Uint8Array(data),filename);
 if(!report.ok)throw Error('Unsupported humanoid: '+report.errors.join('; '));
 const json=JSON.parse(new TextDecoder().decode(new Uint8Array(data,20,new DataView(data).getUint32(12,true))).replace(/\u0000+$/,'').trimEnd());
 for(const extension of json.extensionsRequired||[]){
   if(!MIME_ALLOWED.has(extension))throw Error('GLB requires unconfigured extension '+extension+
     ' — re-export without compression before importing');
 }
 if((json.images||[]).length>IMPORT_RULES.maxImages)throw Error('Too many embedded image textures');
 if(report.triangles>IMPORT_RULES.maxTriangles)throw Error('Imported character exceeds mesh triangle limit');
 // GLTFLoader accepts geometry and morphs from VRM, not springbones/MToon physics.
 const capabilities={humanoid:true,vrm:report.vrm||null,secondaryPhysics:false,
   faceShapes:report.face.morphs.length,lipSync:report.face.lipSync,
   warnings:[...report.warnings,...(report.vrm?['VRM secondary physics and MToon materials are not enabled in P3']:[])]};
 return {info,report,capabilities,buffer:data};
}
export async function prepareRiggedCast(project,assets,{loader=new GLTFLoader()}={}){
 if(project.schema!=='frameforge.project/2')throw Error('Rigged cast requires a v2 project');
 if(!assets||typeof assets.get!=='function')throw TypeError('AssetStore with get() is required');
 const prepared=new Map();
 for(const actor of project.characters){
   const d=project.hybrid.cast[actor.id];
   if(d.provider!=='rigged')continue;
   const stored=assets.get(d.assetId,'character');
   if(!stored)throw Error('Missing rigged GLB for '+actor.id);
   const audited=auditRiggedAsset(stored.bytes,d.filename||'character.glb');
   const gltf=await new Promise((resolve,reject)=>loader.parse(audited.buffer,'',resolve,reject));
   const inspected=inspectScene(gltf.scene,gltf.animations);
   if(!inspected.rigged)throw Error('GLB parsed, but contains no actual skinned mesh or bones');
   if(inspected.triangles>IMPORT_RULES.maxTriangles)throw Error('Loaded model is too heavy');
   prepared.set(actor.id,{gltf,inspected,capabilities:audited.capabilities});
 }
 return prepared;
}
export function registerRiggedCharacters(registry,{scene,prepared,positions={},cameraPosition=[0,2.8,7]}={}){
 if(!scene||typeof scene.add!=='function')throw TypeError('Three.js scene required');
 if(!(prepared instanceof Map))throw TypeError('Prepare the cast asynchronously first');
 const camera=new T.Vector3(...cameraPosition),screen=new T.Vector3(0,1.8,-3);
 const activated=new Set();
 registry.registerActor('rigged',({actor,descriptor})=>{
   if(activated.has(actor.id))throw Error('Preloaded rig already claimed; prepare a fresh copy before reuse');
   const item=prepared.get(actor.id);
   if(!item)throw Error('Rigged asset not preloaded for '+actor.id);
   const p=vec(positions[actor.id],[0,0,0]);
   const member={id:actor.id,name:actor.name,kind:'imported',
     look:{height:descriptor.height??1,prop:descriptor.prop??'none'},
     asset:{flip:Boolean(descriptor.flip)}};
   if(member.look.height<.8||member.look.height>1.2)throw RangeError('Invalid rig height');
   let rig;
   try{
     rig=buildImportedRig(member,item.gltf);
     rig.root.position.set(...p);
     rig.baseY=p[1];
     scene.add(rig.root);
     activated.add(actor.id);
   }catch(err){if(rig){scene.remove(rig.root);disposeImported(rig)}throw err}
   let disposed=false,lastFace=null;
   const verify=()=>{if(disposed)throw Error('Imported rig already disposed')};
   return {
     setPose(time,shot,performance){
       verify();
       if(!Number.isFinite(time)||time<0)throw RangeError('Invalid absolute time');
       const emotion=Object.hasOwn(FACES,performance?.emotion)?performance.emotion:'neutral';
       const name=actionMap[performance?.action]||performance?.action||'none';
       const talking=shot.speaker===actor.id;
       const intensity=talking?.55+.2*Math.sin(time*9+rig.seed)**2:0;
       // Reset rig rest quaternions on every seek; Ember animation uses absolute time.
       const ctx={t:time,talk:intensity,beat:talking?.3:0,nod:0,walk:0,sit:0,baseY:p[1],
         cueIndex:0,face:{...FACES[emotion],emotion},action:{name,k:name==='none'?0:1,local:time,dur:shot.duration},
         camera,look:camera,partner:camera,screen,key:screen};
       animateImported(rig,ctx);
       drawImportedFace(rig,{open:intensity,round:0,wide:1,teeth:talking?1:0,tongue:0},ctx.face,1);
       lastFace=ctx.face;
     },
     setSpeech(cue){
       verify();
       if(!lastFace||!cue||typeof cue.mouthOpen!=='number'||!Number.isFinite(cue.mouthOpen)||
           cue.mouthOpen<0||cue.mouthOpen>1)throw RangeError('Valid audio frame required after pose');
       drawImportedFace(rig,{open:cue.mouthOpen,round:cue.viseme==='round'?1:0,
         wide:cue.viseme==='wide'?1.3:1,teeth:cue.viseme==='teeth'?.5:0,tongue:0},lastFace,1);
     },
     getAnchors(){
       verify();
       const h=rig.B?.head?.getWorldPosition(new T.Vector3())||importedHeadWorld(rig);
       return {root:rig.root.getWorldPosition(new T.Vector3()).toArray(),head:h.toArray()};
     },
     getRig:()=>rig,
     getReport:()=>JSON.parse(JSON.stringify({geometry:item.inspected,capabilities:item.capabilities})),
     dispose(){
       if(disposed)return;disposed=true;
       scene.remove(rig.root);disposeImported(rig);activated.delete(actor.id);
     }
   };
 });
}
