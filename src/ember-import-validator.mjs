// Ember source character-import.js @ 22c745ffdc2d6411707f3a9bbe5bd70b10f9d9db, MIT licensed.
// Adapter imports isolated to FrameForge-pinned dependencies; no V6 renderer changes.
// Imported 3D characters: GLB/VRM reading, humanoid bone mapping, face-shape detection and the import rules.
// Pure (no three.js, no DOM), so the server validates uploads with exactly the code the tests run.

export const IMPORT_RULES={
  formats:['.glb','.vrm'],maxBytes:40e6,maxTriangles:300000,warnTriangles:120000,maxImages:24,
  // Extensions three.js decodes here without extra decoders.
  supportedExtensions:['KHR_materials_unlit','KHR_materials_emissive_strength','KHR_materials_clearcoat','KHR_materials_sheen','KHR_materials_transmission','KHR_materials_ior','KHR_materials_specular','KHR_materials_volume','KHR_materials_iridescence','KHR_materials_anisotropy','KHR_texture_transform','KHR_mesh_quantization','KHR_lights_punctual','EXT_meshopt_compression','VRM','VRMC_vrm','VRMC_springBone','VRMC_materials_mtoon','VRMC_node_constraint','KHR_materials_variants','KHR_draco_mesh_compression','KHR_texture_basisu','EXT_texture_webp','KHR_materials_dispersion'],
  required:['hips','spine','neck','head','leftUpperArm','leftLowerArm','leftHand','rightUpperArm','rightLowerArm','rightHand'],
  recommended:['chest','leftUpperLeg','leftLowerLeg','leftFoot','rightUpperLeg','rightLowerLeg','rightFoot']
};
export const HUMANOID=['hips','spine','chest','neck','head','jaw','leftShoulder','leftUpperArm','leftLowerArm','leftHand','rightShoulder','rightUpperArm','rightLowerArm','rightHand','leftUpperLeg','leftLowerLeg','leftFoot','rightUpperLeg','rightLowerLeg','rightFoot'];

export function readGlb(input){
  const bytes=input instanceof Uint8Array?input:new Uint8Array(input),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  if(bytes.byteLength<20||view.getUint32(0,true)!==0x46546C67)throw Error('Not a binary glTF file. Export as .glb (glTF Binary) or .vrm.');
  if(view.getUint32(4,true)!==2)throw Error('Only glTF 2.0 files are supported.');
  const len=view.getUint32(12,true);if(view.getUint32(16,true)!==0x4E4F534A)throw Error('The file has no glTF JSON chunk.');
  return JSON.parse(new TextDecoder().decode(bytes.subarray(20,20+len)));
}

// Bone names from Mixamo, VRoid/VRM, Blender/Rigify, Character Creator, 3ds Max Biped and common hand-made rigs.
const STRIP=/mixamorig\d*|j_bip_[clr]_|cc_base_|bip0?1|def[-_]|armature|^.*[|:]/g;
function sideOf(raw){const n=raw.toLowerCase();if(/left|(^|[^a-z])l([^a-z]|$)|[._]l$|_l_/.test(n))return 'left';if(/right|(^|[^a-z])r([^a-z]|$)|[._]r$|_r_/.test(n))return 'right';return '';}
function coreOf(raw){return raw.toLowerCase().replace(/^mixamorig\d*[:_]?/,'').replace(STRIP,'').replace(/left|right/g,'').replace(/(^|[^a-z])[lr](?=[^a-z]|$)/g,'$1').replace(/[^a-z0-9]/g,'');}
const CORE={hips:/^(hips?|pelvis)$/,spine:/^(spine0?1?|abdomen|waist)$/,chest:/^(spine0?[23]|chest|upperchest|torso|spine03)$/,neck:/^neck0?1?$/,head:/^head$/,jaw:/^jaw$/,
  shoulder:/^(shoulder|clavicle)$/,upperArm:/^(upperarm|arm|uparm)$/,lowerArm:/^(forearm|lowerarm|elbow)$/,hand:/^(hand|wrist)$/,
  upperLeg:/^(upleg|upperleg|thigh)$/,lowerLeg:/^(leg|lowerleg|calf|shin|knee)$/,foot:/^(foot|ankle)$/};
export function mapHumanoid(json){
  const nodes=json.nodes||[],joints=new Set((json.skins||[]).flatMap(s=>s.joints||[]));
  const map={},parent=new Map();nodes.forEach((n,i)=>(n.children||[]).forEach(c=>parent.set(c,i)));
  // VRM files declare their humanoid map; trust it first.
  const v1=json.extensions?.VRMC_vrm?.humanoid?.humanBones,v0=json.extensions?.VRM?.humanoid?.humanBones;
  if(v1)for(const [bone,{node}] of Object.entries(v1))if(HUMANOID.includes(bone))map[bone]=node;
  if(v0)for(const {bone,node} of v0)if(HUMANOID.includes(bone))map[bone]=node;
  const candidates=(joints.size?[...joints]:nodes.map((_,i)=>i)).filter(i=>nodes[i]?.name);
  const spines=[];
  for(const i of candidates){
    const raw=nodes[i].name,core=coreOf(raw),side=sideOf(raw);if(/end$|twist|roll|toe|index|middle|ring|pinky|thumb|eye|finger/.test(core))continue;
    for(const [kind,re] of Object.entries(CORE)){
      if(!re.test(core))continue;
      if(['shoulder','upperArm','lowerArm','hand','upperLeg','lowerLeg','foot'].includes(kind)){if(!side)continue;const key=side+kind[0].toUpperCase()+kind.slice(1);if(map[key]===undefined)map[key]=i;}
      else if(kind==='spine'||kind==='chest')spines.push([kind,i]);
      else if(map[kind]===undefined)map[kind]=i;
      break;
    }
  }
  for(const [kind,i] of spines)if(map[kind]===undefined)map[kind]=i;
  // Rigs without a "hand" bone (palm/finger roots only): use the forearm's first child joint.
  for(const s of ['left','right'])if(map[s+'Hand']===undefined&&map[s+'LowerArm']!==undefined){const kids=(nodes[map[s+'LowerArm']].children||[]).filter(c=>!joints.size||joints.has(c));if(kids.length)map[s+'Hand']=kids[Math.floor(kids.length/2)];}
  if(map.chest===undefined&&map.spine!==undefined){const up=(nodes[map.spine].children||[]).find(c=>joints.has(c)&&c!==map.neck);if(up!==undefined)map.chest=up;}
  if(map.chest===undefined&&map.spine!==undefined)map.chest=map.spine;
  return Object.fromEntries(Object.entries(map).map(([k,i])=>[k,{index:i,name:nodes[i].name}]));
}

// Face shapes (morph targets) and VRM expressions → which lip-sync, blink and emotion drivers are available.
export function analyzeFace(json){
  const names=new Set();for(const m of json.meshes||[]){for(const n of m.extras?.targetNames||[])names.add(n);for(const p of m.primitives||[])for(const n of p.extras?.targetNames||[])names.add(n);}
  const has=re=>[...names].some(n=>re.test(n)),vrm1=json.extensions?.VRMC_vrm?.expressions?.preset||{},vrm0=(json.extensions?.VRM?.blendShapeMaster?.blendShapeGroups||[]).map(g=>(g.presetName||g.name||'').toLowerCase());
  const vrmHas=k=>Boolean(vrm1[k])||vrm0.includes(k);
  let lipSync='none';
  if(has(/^viseme_(aa|o)$/i))lipSync='oculus';else if(has(/^jawopen$/i))lipSync='arkit';else if(has(/^fcl_mth_a$/i))lipSync='vroid';
  else if(vrmHas('aa')||vrmHas('a'))lipSync='vrm';else if(has(/mouth.?open|open.?mouth|^(a|aa|ah|vowel_?a)$/i))lipSync='generic';
  const blink=has(/blink|eye.?close|fcl_eye_close|eyesclosed/i)||vrmHas('blink');
  const emotions=['happy','angry','sad','surprised'].filter(e=>has({happy:/smile|happy|joy/i,angry:/angry|browdown|mad/i,sad:/sad|sorrow|frown/i,surprised:/surpris|wide/i}[e])||vrmHas({happy:'happy',angry:'angry',sad:'sad',surprised:'surprised'}[e])||vrmHas({happy:'joy',angry:'angry',sad:'sorrow',surprised:'surprised'}[e]));
  return {morphs:[...names],lipSync,blink,emotions};
}

export function validateCharacter(buffer,filename=''){
  const errors=[],warnings=[],ext=(filename.match(/\.[a-z0-9]+$/i)?.[0]||'').toLowerCase(),size=buffer.byteLength;
  const report={ok:false,errors,warnings,format:ext==='.vrm'?'vrm':'glb',sizeMB:Math.round(size/1e5)/10,triangles:0,meshes:0,skins:0,bones:{},face:{morphs:[],lipSync:'none',blink:false,emotions:[]},vrm:null};
  if(!IMPORT_RULES.formats.includes(ext))errors.push(`Use a .glb or .vrm file (got "${ext||'no extension'}"). Export from Blender with File → Export → glTF 2.0 (.glb).`);
  if(size>IMPORT_RULES.maxBytes)errors.push(`The file is ${report.sizeMB} MB; the limit is ${IMPORT_RULES.maxBytes/1e6} MB. Reduce texture sizes (2048 px is plenty) and re-export.`);
  let json;try{json=readGlb(buffer);}catch(e){errors.push(e.message);return report;}
  report.vrm=json.extensions?.VRMC_vrm?'1.0':json.extensions?.VRM?'0.x':null;if(report.vrm)report.format='vrm';
  const unsupported=(json.extensionsRequired||json.extensionsUsed||[]).filter(e=>!IMPORT_RULES.supportedExtensions.includes(e));
  if(unsupported.length)(json.extensionsRequired||[]).some(e=>unsupported.includes(e))?errors.push(`Uses compression this studio cannot decode: ${unsupported.join(', ')}. Re-export it without that extension.`):warnings.push(`Ignores these optional extensions: ${unsupported.join(', ')}.`);
  for(const m of json.meshes||[]){report.meshes++;for(const p of m.primitives||[]){const acc=json.accessors?.[p.indices??p.attributes?.POSITION];if(acc)report.triangles+=Math.round(p.indices!==undefined?acc.count/3:acc.count/3);}}
  report.skins=(json.skins||[]).length;
  if(!report.meshes)errors.push('The file has no meshes.');
  if(!report.skins)errors.push('The model has no skeleton (skin). Rig it first: free auto-rigging at mixamo.com, or VRoid Studio exports rigged .vrm files.');
  if(report.triangles>IMPORT_RULES.maxTriangles)errors.push(`${report.triangles.toLocaleString()} triangles is too heavy (limit ${IMPORT_RULES.maxTriangles.toLocaleString()}). Decimate the mesh in Blender.`);
  else if(report.triangles>IMPORT_RULES.warnTriangles)warnings.push(`${report.triangles.toLocaleString()} triangles: renders more slowly. Under ${IMPORT_RULES.warnTriangles.toLocaleString()} is ideal.`);
  if((json.images||[]).length>IMPORT_RULES.maxImages)warnings.push(`${json.images.length} textures: consider merging them for faster loading.`);
  if(report.skins){
    const bones=mapHumanoid(json);report.bones=bones;
    const missing=IMPORT_RULES.required.filter(b=>!bones[b]);
    if(missing.length)errors.push(`Missing humanoid bones: ${missing.join(', ')}. Use a standard humanoid rig (Mixamo, VRoid/VRM, Rigify, Character Creator).`);
    const soft=IMPORT_RULES.recommended.filter(b=>!bones[b]);if(soft.length)warnings.push(`Missing ${soft.join(', ')}: the body still animates, but legs will not bend.`);
  }
  report.face=analyzeFace(json);
  if(report.face.lipSync==='none'){if(report.bones.jaw){report.face.lipSync='jaw';warnings.push('No mouth shapes found: lip sync will move the jaw bone only.');}else warnings.push('No mouth shapes (visemes, ARKit jawOpen or VRM aa/oh) and no jaw bone: the mouth will not move. Add shape keys in Blender for lip sync.');}
  if(!report.face.blink)warnings.push('No blink shape (eyeBlink / Fcl_EYE_Close / VRM blink): the eyes will not blink.');
  if(!report.face.emotions.length)warnings.push('No expression shapes: feelings show through body language and head pose only.');
  report.ok=!errors.length;return report;
}

// Worlds: imported 3D scenes (no skeleton needed) and 360° backgrounds.
export const WORLD_RULES={formats:['.glb'],maxBytes:80e6,maxTriangles:2000000,warnTriangles:800000,backdropFormats:['.jpg','.jpeg','.png','.hdr'],maxBackdropBytes:60e6};
export function validateWorld(buffer,filename=''){
  const errors=[],warnings=[],ext=(filename.match(/\.[a-z0-9]+$/i)?.[0]||'').toLowerCase(),report={ok:false,kind:'world',errors,warnings,format:'glb',sizeMB:Math.round(buffer.byteLength/1e5)/10,triangles:0,meshes:0,animations:0,lights:0};
  if(!WORLD_RULES.formats.includes(ext))errors.push(`Use a .glb file for a 3D world (got "${ext||'no extension'}"). Blender: File → Export → glTF 2.0 (.glb).`);
  if(buffer.byteLength>WORLD_RULES.maxBytes)errors.push(`The file is ${report.sizeMB} MB; the limit is ${WORLD_RULES.maxBytes/1e6} MB. Reduce textures to 2048 px or use Draco compression.`);
  let json;try{json=readGlb(buffer);}catch(e){errors.push(e.message);return report;}
  const unsupported=(json.extensionsRequired||[]).filter(e=>!IMPORT_RULES.supportedExtensions.includes(e));if(unsupported.length)errors.push(`Uses extensions this studio cannot read: ${unsupported.join(', ')}.`);
  for(const m of json.meshes||[]){report.meshes++;for(const pr of m.primitives||[]){const acc=json.accessors?.[pr.indices??pr.attributes?.POSITION];if(acc)report.triangles+=Math.round(acc.count/3);}}
  report.animations=(json.animations||[]).length;report.lights=json.extensions?.KHR_lights_punctual?.lights?.length||0;
  if(!report.meshes)errors.push('The file has no meshes.');
  if(report.triangles>WORLD_RULES.maxTriangles)errors.push(`${report.triangles.toLocaleString()} triangles is too heavy for a world (limit ${WORLD_RULES.maxTriangles.toLocaleString()}).`);
  else if(report.triangles>WORLD_RULES.warnTriangles)warnings.push(`${report.triangles.toLocaleString()} triangles: renders more slowly.`);
  if(report.animations)warnings.push(`${report.animations} animation${report.animations>1?'s':''} will loop on the film clock.`);
  if(json.skins?.length)warnings.push('This model has a skeleton, so it may be a character. Import it from the Cast tab if it should act and speak.');
  report.ok=!errors.length;return report;
}
// Reads image size from the file header (PNG, JPEG, Radiance HDR) without decoding pixels.
export function imageSize(bytes){
  const b=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes),v=new DataView(b.buffer,b.byteOffset,b.byteLength);
  if(b[0]===0x89&&b[1]===0x50)return {type:'png',width:v.getUint32(16),height:v.getUint32(20)};
  if(b[0]===0xFF&&b[1]===0xD8){let i=2;while(i<b.length-9){if(b[i]!==0xFF){i++;continue;}const m=b[i+1],len=v.getUint16(i+2);if(m>=0xC0&&m<=0xCF&&![0xC4,0xC8,0xCC].includes(m))return {type:'jpeg',height:v.getUint16(i+5),width:v.getUint16(i+7)};i+=2+len;}}
  const head=new TextDecoder().decode(b.subarray(0,Math.min(4096,b.length)));if(/^#\?(RADIANCE|RGBE)/.test(head)){const m=head.match(/-Y (\d+) \+X (\d+)/);if(m)return {type:'hdr',width:Number(m[2]),height:Number(m[1])};}
  return null;
}
export function validateBackdrop(buffer,filename=''){
  const errors=[],warnings=[],ext=(filename.match(/\.[a-z0-9]+$/i)?.[0]||'').toLowerCase(),report={ok:false,kind:'backdrop',errors,warnings,format:ext.slice(1),sizeMB:Math.round(buffer.byteLength/1e5)/10,width:0,height:0};
  if(!WORLD_RULES.backdropFormats.includes(ext))errors.push(`Use a .jpg, .png or .hdr 360° image (got "${ext||'no extension'}").`);
  if(buffer.byteLength>WORLD_RULES.maxBackdropBytes)errors.push(`The image is ${report.sizeMB} MB; the limit is ${WORLD_RULES.maxBackdropBytes/1e6} MB.`);
  const size=imageSize(buffer);if(!size){errors.push('Could not read the image. Save it as a standard JPEG, PNG or Radiance .hdr.');return report;}
  Object.assign(report,{width:size.width,height:size.height,format:size.type});const ratio=size.width/size.height;
  if(Math.abs(ratio-2)>.05)errors.push(`This image is ${size.width}×${size.height}. A 360° background must be equirectangular, twice as wide as tall (2:1). Poly Haven HDRIs and phone 360° photos are.`);
  if(size.width<2048)warnings.push('Under 2048 px wide: the background will look soft. 4096 px or more is best.');
  if(size.width>8192)warnings.push('Over 8192 px wide: uses a lot of memory; 4096–8192 px is plenty.');
  if(size.type!=='hdr')warnings.push('JPEG/PNG backgrounds light the scene less realistically than .hdr files.');
  report.ok=!errors.length;return report;
}
