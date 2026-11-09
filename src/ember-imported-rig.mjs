// Ember source imported.js @ 22c745ffdc2d6411707f3a9bbe5bd70b10f9d9db, MIT licensed.
// Adapter imports isolated to FrameForge-pinned dependencies; no V6 renderer changes.
// Imported (GLB/VRM) characters on the studio's performance system: the same gestures, look-at, speech beats,
// lip sync and emotions as built-in characters, driven through the model's own humanoid bones and face shapes.
import * as THREE from '../vendor/three@0.180.0/three.module.min.js';
import {mapHumanoid,analyzeFace} from './ember-import-validator.mjs';
import {gesture,backOut,buildProp} from './ember-character-engine.mjs';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),PI=Math.PI;
const TARGET_HEIGHT=3.4; // matches built-in humanoids (soles to crown) at height 1.0

export function buildImportedRig(member,gltf){
  const json=gltf.parser.json,map=mapHumanoid(json),nodeOf=i=>gltf.parser.associations&&[...gltf.parser.associations].find(([o,a])=>a.nodes===i&&o.isBone)?.[0];
  const byIndex=new Map();for(const [obj,assoc] of gltf.parser.associations)if(assoc.nodes!==undefined&&(obj.isBone||!byIndex.has(assoc.nodes)))byIndex.set(assoc.nodes,obj);
  const B={};for(const [k,{index}] of Object.entries(map)){const o=byIndex.get(index)||nodeOf(index);if(o)B[k]=o;}
  const model=gltf.scene,root=new THREE.Group(),body=new THREE.Group(),turn=new THREE.Group();root.add(body);body.add(turn);turn.add(model);
  model.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.frustumCulled=false;if(o.material){for(const m of [].concat(o.material)){m.side=THREE.FrontSide;if(m.map)m.map.anisotropy=4;}}}});
  // Facing: glTF convention is +Z forward; VRM 0.x faces −Z. Feet/toes confirm the direction when present.
  model.updateMatrixWorld(true);let facing=json.extensions?.VRM?0:0;
  const vrm0=Boolean(json.extensions?.VRM),toe=B.leftFoot?.children.find(c=>c.isBone);
  if(toe&&B.leftFoot){const f=B.leftFoot.getWorldPosition(V()),t=toe.getWorldPosition(V());if(Math.abs(t.z-f.z)>1e-4)facing=t.z<f.z?PI:0;}else if(vrm0)facing=PI;
  if(member.asset?.flip)facing+=PI;turn.rotation.y=facing;
  // Scale to the studio's character height, stand on the ground, centre on the root.
  turn.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(model),h=Math.max(1e-3,bb.max.y-bb.min.y),k=TARGET_HEIGHT*member.look.height/h;
  model.scale.multiplyScalar(k);turn.updateMatrixWorld(true);const bb2=new THREE.Box3().setFromObject(model),c=bb2.getCenter(V());model.position.x-=c.x;model.position.z-=c.z;model.position.y-=bb2.min.y;
  root.updateMatrixWorld(true);
  const bones=Object.values(B),rest=new Map(bones.map(b=>[b,b.quaternion.clone()])),toRoot=o=>root.worldToLocal(o.getWorldPosition(V()));
  const len=(a,b)=>a&&b?a.getWorldPosition(V()).distanceTo(b.getWorldPosition(V())):0;
  // A chest frame aligned with the character (not the bone's own axes) gives gestures their usual coordinates.
  const chestBone=B.chest||B.spine,chestFrame=new THREE.Group();root.add(chestFrame);chestFrame.position.copy(toRoot(chestBone));
  const arms=[['right',-1],['left',1]].map(([side,s])=>{const up=B[side+'UpperArm'],lo=B[side+'LowerArm'],hand=B[side+'Hand'],lenU=len(up,lo),lenF=len(lo,hand);
    const finger=hand?.children.find(ch=>ch.isBone),handOff=finger?Math.max(len(hand,finger)*1.4,lenF*.18):lenF*.22;return {s,upper:up,lower:lo,hand,lenU,lenF,handOff,shoulder:up};});
  const headTop=bb2.max.y,headPos=toRoot(B.head),headSize=Math.max(.2,headTop-headPos.y),shoulderY=arms[1].upper?toRoot(arms[1].upper).y-chestFrame.position.y:.9;
  const sx=arms[1].upper?Math.abs(toRoot(arms[1].upper).x-chestFrame.position.x):.45;
  // Face anchors in head-bone space so they follow every head turn.
  root.updateMatrixWorld(true);const toHead=p=>B.head.worldToLocal(root.localToWorld(p.clone()));
  const anchors={forehead:toHead(headPos.clone().add(V(0,headSize*.62,headSize*.42))),chin:toHead(headPos.clone().add(V(0,headSize*.08,headSize*.4))),face:toHead(headPos.clone().add(V(0,headSize*.4,headSize*.55)))};
  const rig={member,kind:'imported',imported:true,root,body,model,B,rest,arms,chestFrame,anchors,seed:[...member.id].reduce((a,ch)=>a+ch.charCodeAt(0),0),
    m:{sx,sy:shoulderY,reach:(arms[1].lenU+arms[1].lenF+arms[1].handOff)||1.1,hw:headSize*.55,ht:headTop-chestFrame.position.y},headSize,restHead:headPos,face:buildFaceDrivers(gltf,json,B),glow:null};
  rig.sitDrop=TARGET_HEIGHT*member.look.height*.23;
  rig.seat={top:TARGET_HEIGHT*member.look.height*.29,hip:TARGET_HEIGHT*member.look.height*.32,back:.3};
  rig.restChest=chestFrame.position.clone();
  rig.legs=['left','right'].map((side,i)=>{const upper=B[side+'UpperLeg'],lower=B[side+'LowerLeg'],hand=B[side+'Foot'];return {s:i?1:-1,upper,lower,hand,lenU:len(upper,lower),lenF:len(lower,hand),handOff:0,rest:hand?toRoot(hand):null};}).filter(l=>l.upper&&l.lower&&l.hand);
  if(member.look.prop&&member.look.prop!=='none'&&arms[0].hand){rig.propAnchor=new THREE.Group();root.add(rig.propAnchor);rig.prop=buildProp({...rig,arms:[{hand:rig.propAnchor,handOff:0}]},member.look.prop);}
  return rig;
}

// Morph-target channels by naming family; each driver writes one face-shape weight across every mesh that has it.
function buildFaceDrivers(gltf,json,B){
  const meshes=[];gltf.scene.traverse(o=>{if(o.morphTargetDictionary&&o.morphTargetInfluences)meshes.push(o);});
  const find=re=>{const out=[];for(const m of meshes)for(const [n,i] of Object.entries(m.morphTargetDictionary))if(re.test(n))out.push([m,i]);return out;};
  const info=analyzeFace(json),ch={};
  const add=(key,re)=>{const t=find(re);if(t.length)ch[key]=t;};
  if(info.lipSync==='oculus'){add('aa',/^viseme_aa$/i);add('O',/^viseme_O$/i);add('U',/^viseme_U$/i);add('E',/^viseme_E$/i);add('I',/^viseme_I$/i);add('PP',/^viseme_PP$/i);add('FF',/^viseme_FF$/i);}
  else if(info.lipSync==='arkit'){add('jaw',/^jawOpen$/i);add('funnel',/^mouthFunnel$/i);add('pucker',/^mouthPucker$/i);add('stretch',/^mouthStretch(_?L|Left|_?R|Right)$/i);add('close',/^mouthClose$/i);}
  else if(info.lipSync==='vroid'){add('aa',/^Fcl_MTH_A$/i);add('O',/^Fcl_MTH_O$/i);add('U',/^Fcl_MTH_U$/i);add('E',/^Fcl_MTH_E$/i);add('I',/^Fcl_MTH_I$/i);}
  else if(info.lipSync==='generic')add('jaw',/mouth.?open|open.?mouth|^(a|aa|ah|vowel_?a)$/i);
  add('blink',/^(eyeBlink(_?L|Left|_?R|Right)?|blink|Fcl_EYE_Close|eyesClosed|eye.?close)$/i);
  add('smile',/^(mouthSmile(_?L|Left|_?R|Right)?|smile|happy|joy|Fcl_ALL_Joy|Fcl_MTH_Joy)$/i);
  add('frown',/^(mouthFrown(_?L|Left|_?R|Right)?|frown)$/i);add('browUp',/^browInnerUp$/i);add('browDown',/^browDown(_?L|Left|_?R|Right)?$/i);add('wide',/^eyeWide(_?L|Left|_?R|Right)?$/i);
  add('happy',/^(happy|joy|Fcl_ALL_Joy)$/i);add('angry',/^(angry|mad|Fcl_ALL_Angry)$/i);add('sad',/^(sad|sorrow|Fcl_ALL_Sorrow)$/i);add('surprised',/^(surprised|surprise|Fcl_ALL_Surprised)$/i);
  // VRM expressions bind morphs by node/mesh index; resolve them to the loaded meshes.
  const vrmBind=(key,binds)=>{const out=[];for(const b of binds||[]){for(const [obj,a] of gltf.parser.associations){if(!obj.morphTargetInfluences)continue;if((b.node!==undefined&&a.nodes===b.node)||(b.mesh!==undefined&&a.meshes===b.mesh))out.push([obj,b.index,(b.weight??1)>1?b.weight/100:(b.weight??1)]);}}if(out.length&&!ch[key])ch[key]=out;};
  const v1=json.extensions?.VRMC_vrm?.expressions?.preset;if(v1)for(const [k,e] of Object.entries(v1))vrmBind({aa:'aa',oh:'O',ou:'U',ee:'E',ih:'I',blink:'blink',happy:'happy',angry:'angry',sad:'sad',surprised:'surprised'}[k]||k,e.morphTargetBinds);
  for(const g of json.extensions?.VRM?.blendShapeMaster?.blendShapeGroups||[])vrmBind({a:'aa',o:'O',u:'U',e:'E',i:'I',blink:'blink',joy:'happy',angry:'angry',sorrow:'sad',fun:'happy'}[(g.presetName||'').toLowerCase()]||g.presetName,g.binds);
  return {channels:ch,jaw:B.jaw||null,lipSync:info.lipSync};
}
function drive(ch,key,w){const list=ch[key];if(!list)return;for(const [m,i,scale=1] of list)m.morphTargetInfluences[i]=clamp(w*scale,0,1);}

export function drawImportedFace(rig,m,f,blink){
  const {channels:ch,jaw}=rig.face,open=clamp(m.open+f.open*(1-m.open),0,1),round=m.round||0,wideK=clamp(((m.wide||1)-1)*5,0,1);
  drive(ch,'aa',open*(1-round)*.95);drive(ch,'O',open*round);drive(ch,'U',(1-open)*round*.85);drive(ch,'E',wideK*open*.7);drive(ch,'I',wideK*(1-open)*.4);
  drive(ch,'jaw',open*.8);drive(ch,'funnel',round*open*.6);drive(ch,'pucker',round*(1-open)*.7);drive(ch,'stretch',wideK*.4);
  drive(ch,'blink',1-clamp(f.eye*blink,0,1));drive(ch,'wide',clamp((f.eye-1)*2.5,0,1));
  drive(ch,'smile',Math.max(0,f.smile)*.8);drive(ch,'frown',Math.max(0,-f.smile)*.7);drive(ch,'browUp',Math.max(0,f.brow)*2);drive(ch,'browDown',Math.max(0,-f.brow)*2);
  for(const e of ['happy','angry','sad','surprised'])drive(ch,e,f.emotion===e?.85:0);
  if(jaw&&!ch.jaw&&!ch.aa)rotateInRoot(rig,jaw,_e.set(open*.32,0,0));
}

const _q=new THREE.Quaternion(),_q2=new THREE.Quaternion(),_rq=new THREE.Quaternion(),_e=new THREE.Euler(),_t=V(),_p=V(),_fk=V(),_tg=V();
// Rotate a bone by an Euler given in the character's own frame (x nods, y turns, z tilts), whatever the bone's axes.
function rotateInRoot(rig,bone,euler){
  rig.root.getWorldQuaternion(_rq);_q.setFromEuler(euler);_q.premultiply(_rq).multiply(_rq.clone().invert());
  bone.updateWorldMatrix(true,false);const world=bone.getWorldQuaternion(new THREE.Quaternion()).premultiply(_q),parent=bone.parent.getWorldQuaternion(_q2);
  bone.quaternion.copy(parent.invert().multiply(world));bone.updateWorldMatrix(false,true);
}
// Turn a bone so the direction toward its child points at a world target.
function aim(bone,child,target){
  bone.updateWorldMatrix(true,true);const b=bone.getWorldPosition(V()),c=child.getWorldPosition(V()),d0=c.sub(b).normalize(),d1=target.clone().sub(b).normalize();
  _q.setFromUnitVectors(d0,d1);const world=bone.getWorldQuaternion(new THREE.Quaternion()).premultiply(_q),parent=bone.parent.getWorldQuaternion(_q2);
  bone.quaternion.copy(parent.invert().multiply(world));bone.updateWorldMatrix(false,true);
}
function solveArm(arm,target,pole){
  const S=arm.upper.getWorldPosition(V()),a=arm.lenU,b=arm.lenF+arm.handOff,dir=target.clone().sub(S);let dist=dir.length();dir.normalize();dist=clamp(dist,Math.abs(a-b)+.02,a+b-.002);
  const cosA=clamp((a*a+dist*dist-b*b)/(2*a*dist),-1,1),pl=pole.clone().sub(S);pl.addScaledVector(dir,-pl.dot(dir));if(pl.lengthSq()<1e-8)pl.set(0,-1,0);pl.normalize();
  const elbow=S.clone().addScaledVector(dir.clone().multiplyScalar(cosA).addScaledVector(pl,Math.sqrt(1-cosA*cosA)),a);
  aim(arm.upper,arm.lower,elbow);aim(arm.lower,arm.hand,S.clone().addScaledVector(dir,dist));
}
export function importedHandPos(arm,out=V()){const l=arm.lower.getWorldPosition(V()),h=arm.hand.getWorldPosition(out);return h.add(h.clone().sub(l).normalize().multiplyScalar(arm.handOff));}

export function animateImported(rig,ctx){
  const {t,talk,beat,face,action}=ctx,ph=rig.seed*.37,k=action.k,ease=k<=0?0:k>=1?1:clamp(backOut(k),0,1.08),m=rig.m,B=rig.B;
  for(const [bone,q] of rig.rest)bone.quaternion.copy(q);
  const g=gesture(action.name,action.local,action.dur,{m,beat,screen:ctx.screen,key:ctx.key,partner:ctx.partner,
    anchor:(name,dx=0,dy=0,dz=0)=>()=>B.head.localToWorld(rig.anchors[name].clone()).add(V(dx,dy,dz).multiplyScalar(rig.root.scale.y)),
    toward:(p,len,arm=1)=>()=>{const s=rig.arms[arm].upper.getWorldPosition(V());return s.add(p.clone().sub(s).normalize().multiplyScalar(len));},
    toCamera:(len,up)=>()=>{const s=rig.arms[1].upper.getWorldPosition(V()),d=ctx.camera.clone().sub(s);d.y=0;d.normalize();d.y=up;return s.add(d.normalize().multiplyScalar(len));}});
  const sad=face.emotion==='sad'?1:0,angry=face.emotion==='angry'?1:0;
  rig.root.position.y=ctx.baseY+(g.root?.y||0)*k;rig.body.position.y=Math.sin(t*1.7+ph)*.006*TARGET_HEIGHT+(g.hips?.y||0)*k*.5;
  const sit=ctx.sit||0,drop=sit*rig.sitDrop;rig.body.position.y-=drop;
  rig.chestFrame.position.copy(rig.restChest);rig.chestFrame.position.y-=drop;
  rig.root.updateMatrixWorld(true);
  // Torso: lean, breathing, gesture chest offsets; the chest frame follows so gesture targets lean with it.
  const cx=(g.chest?.x||0)*k+angry*.06+sad*.08+talk*beat*.04+Math.sin(t*1.7+ph)*.01,cy=Math.sin(t*.65+ph)*.03+(g.chest?.y||0)*k,cz=-Math.sin(t*.55+ph)*.015;
  if(B.spine)rotateInRoot(rig,B.spine,_e.set(cx*.4,cy*.4,cz*.5));if(B.chest&&B.chest!==B.spine)rotateInRoot(rig,B.chest,_e.set(cx*.6,cy*.6,cz*.5));
  rig.chestFrame.rotation.set(cx,cy,cz);
  // Head: look target, emotion, speech nods, gesture offsets.
  const hp=B.neck?B.neck.getWorldPosition(V()):B.head.getWorldPosition(V()),look=(g.look&&ctx[g.look])?ctx[g.look]:ctx.look;let yaw=0,pitch=0;
  if(look){const d=look.clone().sub(hp).applyQuaternion(rig.root.getWorldQuaternion(new THREE.Quaternion()).invert());yaw=clamp(Math.atan2(d.x,d.z)-cy,-.9,.9);pitch=clamp(-Math.atan2(d.y,Math.hypot(d.x,d.z)),-.4,.4);}
  const hx=pitch*.6+face.down+(g.head?.x||0)*k+talk*(beat*.07+Math.sin(t*5.3+ph)*.015)+(ctx.nod||0)+Math.sin(t*1.2+ph)*.02,hy=yaw*.75+(g.head?.y||0)*k+Math.sin(t*.7+ph)*.04,hz=face.tilt+(g.head?.z||0)*k+Math.sin(t*.8+ph)*.02;
  if(B.neck)rotateInRoot(rig,B.neck,_e.set(hx*.35,hy*.35,hz*.3));rotateInRoot(rig,B.head,_e.set(hx*(B.neck?.65:1),hy*(B.neck?.65:1),hz*.7));
  // Arms: relaxed hang (T-pose rigs come down to the sides), speech beats, then IK toward the gesture target.
  const domI=(rig.seed+Math.floor(ctx.cueIndex||0))%2;rig.root.updateMatrixWorld(true);
  rig.arms.forEach((arm,i)=>{
    if(!arm.upper||!arm.lower||!arm.hand)return;const s=arm.s,dom=i===domI?1:.45,lift=talk*dom*(.25+beat*.55);
    rig.chestFrame.localToWorld(_fk.set(s*m.sx*1.18,m.sy-m.reach*(.93-lift*.35),m.reach*(.1+lift*.4)+(rig.prop&&i===0?.55:0)));
    const spec=g.arms?.[i];_tg.copy(_fk);
    if(spec&&k>0){const goal=spec.c?rig.chestFrame.localToWorld(V(...spec.c)):(spec.h||spec.w)();_tg.lerpVectors(_fk,goal,ease);_tg.y+=Math.sin(PI*clamp(k,0,1))*.12*(1-ease);}
    rig.chestFrame.localToWorld(_p.set(...(spec&&k>0&&spec.pole?spec.pole:[s*1.4,m.sy-1,-.7])));solveArm(arm,_tg,_p);
  });
  if(sit){for(const leg of rig.legs){const target=rig.root.localToWorld(leg.rest.clone().add(V(0,0,sit*.65))),pole=rig.root.localToWorld(V(leg.rest.x,.8,2));solveArm(leg,target,pole);}}
  if(rig.propAnchor){rig.root.updateMatrixWorld(true);rig.propAnchor.position.copy(rig.root.worldToLocal(rig.arms[0].hand.getWorldPosition(V())));rig.propAnchor.quaternion.copy(rig.root.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(rig.arms[0].hand.getWorldQuaternion(new THREE.Quaternion())));}
  if(ctx.walk&&!sit){for(const [i,side] of ['left','right'].entries()){
    if(B[side+'UpperLeg'])rotateInRoot(rig,B[side+'UpperLeg'],_e.set(Math.sin(t*8.5+i*PI)*.42*ctx.walk,0,0));
    if(B[side+'LowerLeg'])rotateInRoot(rig,B[side+'LowerLeg'],_e.set(Math.max(0,-Math.sin(t*8.5+i*PI))*.55*ctx.walk,0,0));}}
  return {press:(g.press||0)*k};
}
export function importedHeadWorld(rig,out=V()){rig.root.updateMatrixWorld(true);return rig.root.localToWorld(out.copy(rig.restHead).add(V(0,rig.headSize*.4,0)));}
export function disposeImported(rig){rig.root.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of [].concat(o.material)){for(const k of ['map','normalMap','roughnessMap','metalnessMap','emissiveMap','aoMap'])m[k]?.dispose();m.dispose();}});}
