/**
 * FrameForge rigged asset contract v1 — locally-contained glTF-Binary only.
 * This inspects real GLB bytes before GLTFLoader. It cannot certify character artistry.
 */
export const MAX_GLB_BYTES = 25 * 1024 * 1024;
const textDecoder = new TextDecoder();
export function inspectGLB(buffer) {
  if (!(buffer instanceof ArrayBuffer)) throw new TypeError('Provide an ArrayBuffer');
  if (buffer.byteLength < 20 || buffer.byteLength > MAX_GLB_BYTES) {
    throw new Error('GLB size must be 20 bytes to 25 MiB');
  }
  const dv = new DataView(buffer);
  if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('Not a binary glTF: missing glTF header');
  if (dv.getUint32(4, true) !== 2) throw new Error('Only glTF 2.0 GLB is supported');
  if (dv.getUint32(8, true) !== buffer.byteLength) throw new Error('GLB byte length does not match header');
  const chunkLength=dv.getUint32(12,true);
  if(chunkLength===0 || chunkLength % 4 !== 0 || 20+chunkLength>buffer.byteLength) {
    throw new Error('Invalid GLB JSON chunk size');
  }
  if (dv.getUint32(16,true)!==0x4e4f534a) throw new Error('GLB JSON chunk is absent');
  let json;
  try {
    const utf8=textDecoder.decode(new Uint8Array(buffer,20,chunkLength)).replace(/\u0000+$/g,'').trimEnd();
    json=JSON.parse(utf8);
  } catch {
    throw new Error('GLB contains malformed JSON');
  }
  if(!json.asset || !String(json.asset.version).startsWith('2.')) throw new Error('GLB asset must declare glTF 2.x');
  // Importing a user model never silently requests remote assets or uploads the upload.
  for(const node of [...(json.buffers||[]),...(json.images||[])]) {
    if(node.uri && !/^data:/i.test(node.uri)) throw new Error('GLB has external asset reference; embed all textures and buffers first');
  }
  const morphNames=new Set();
  for(const mesh of json.meshes||[]) {
    for(const name of mesh.extras?.targetNames||[]) if(typeof name==='string')morphNames.add(name);
    for(const prim of mesh.primitives||[]) {
      for(let i=0;i<(prim.targets||[]).length;i++) {
        const name=mesh.extras?.targetNames?.[i]||'target_'+i;
        morphNames.add(String(name));
      }
    }
  }
  return Object.freeze({
    meshes:json.meshes?.length||0,
    skinDefinitions:json.skins?.length||0,
    animationDefinitions:json.animations?.length||0,
    materialDefinitions:json.materials?.length||0,
    morphNames:[...morphNames].sort(),
    bytes:buffer.byteLength,
    generator:String(json.asset.generator||'unspecified').slice(0,120)
  });
}
const presets=Object.freeze({
  neutral:{},
  happy:{mouthSmile:.86,mouthSmileLeft:.8,mouthSmileRight:.8,eyeSquintLeft:.18,eyeSquintRight:.18},
  worried:{browInnerUp:.75,browDownLeft:.24,browDownRight:.24,mouthFrown:.56,mouthFrownLeft:.56,mouthFrownRight:.56},
  surprised:{eyeWideLeft:.84,eyeWideRight:.84,jawOpen:.74,browInnerUp:.66,mouthOpen:.7},
  angry:{browDownLeft:.85,browDownRight:.85,mouthPress:.48,eyeSquintLeft:.32,eyeSquintRight:.32}
});
const normalize=s=>String(s).replace(/[^a-z0-9]/gi,'').toLowerCase();
export function applyMorphPreset(root,preset='neutral') {
  if(!Object.hasOwn(presets,preset)) throw new Error('Unknown expression preset');
  if(!root || typeof root.traverse!=='function') throw new Error('A Three.js model root is required');
  const wanted=Object.fromEntries(Object.entries(presets[preset]).map(([k,v])=>[normalize(k),v]));
  let available=0,matched=0;
  root.traverse(mesh=>{
    if(!mesh.morphTargetDictionary || !mesh.morphTargetInfluences)return;
    for(const [name,index] of Object.entries(mesh.morphTargetDictionary)){
      if(!Number.isInteger(index)||index<0||index>=mesh.morphTargetInfluences.length)continue;
      available++;
      const target=wanted[normalize(name)];
      mesh.morphTargetInfluences[index]=typeof target==='number'?target:0;
      if(typeof target==='number')matched++;
    }
  });
  return Object.freeze({preset,available,matched,supported:available>0 && (preset==='neutral'||matched>0)});
}
// Manual normalized shape weights override named preset channels after any seek.
export function applyMorphControls(root,controls={}) {
 if(!root||typeof root.traverse!=='function')throw new Error('A Three.js model root is required');
 if(!controls||typeof controls!=='object'||Array.isArray(controls))throw new TypeError('Controls must be a shape-name map');
 const requested=new Map();
 for(const [name,value] of Object.entries(controls)){
  if(!Number.isFinite(value)||value<0||value>1)throw new RangeError('Facial weight must be between zero and one');
  requested.set(normalize(name),value);
 }
 let matched=0;
 root.traverse(mesh=>{
  if(!mesh.morphTargetDictionary||!mesh.morphTargetInfluences)return;
  for(const [name,index] of Object.entries(mesh.morphTargetDictionary)){
   const value=requested.get(normalize(name));
   if(value===undefined||!Number.isInteger(index)||index<0||index>=mesh.morphTargetInfluences.length)continue;
   mesh.morphTargetInfluences[index]=value;matched++;
  }
 });
 return Object.freeze({requested:requested.size,matched});
}
export function inspectScene(root,animations=[]) {
  if(!root || typeof root.traverse!=='function') throw new Error('A Three.js model root is required');
  let meshes=0,skinnedMeshes=0,bones=0,vertices=0,morphChannels=0,triangles=0;
  root.traverse(obj=>{
    if(obj.isBone)bones++;
    if(obj.isMesh || obj.isSkinnedMesh) {
      meshes++;if(obj.isSkinnedMesh)skinnedMeshes++;
      const p=obj.geometry?.attributes?.position;
      vertices+=p?.count||0;
      morphChannels+=Object.keys(obj.morphTargetDictionary||{}).length;
      const idx=obj.geometry?.index;
      triangles+=Math.floor((idx?.count||p?.count||0)/3);
    }
  });
  return Object.freeze({meshes,skinnedMeshes,bones,vertices,triangles,morphChannels,animations:animations.length,rigged:skinnedMeshes>0&&bones>0});
}
export const EXPRESSION_NAMES=Object.freeze(Object.keys(presets));
