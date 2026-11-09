// Original Ember Take Studio character engine: Dileepreddy93/ember-take-studio @ 22c745ffdc2d6411707f3a9bbe5bd70b10f9d9db.
// Adaptations: use FrameForge-pinned Three.js, vendored rounded geometry, and local math utilities.
// Engine remains separate; the legacy FrameForge V6 scene is not modified.
// The cached hair geometry is cloned per use to avoid disposing one actor's GPU geometry while another still uses it. MIT license (Ember LICENSE).
// Procedural characters in the studio's faceted low-poly style, all built on one rig:
// root → hips → chest → neck → head, chest → shoulder → upper → fore → hand, hips → leg chains with planted feet.
// Arms and legs are solved with two-bone IK, so gestures reach real targets (face, chin, monitor, partner)
// on any body shape. Everything is a pure function of time, so scrubbing and rendering agree frame for frame.
import * as THREE from '../vendor/three@0.180.0/three.module.min.js';
import {RoundedBoxGeometry} from './three-rounded-box.mjs';
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
const lerp=(a,b,k)=>a+(b-a)*k;

const PI=Math.PI,V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),V2=(x,y)=>new THREE.Vector2(x,y);
// Build quality: 'smooth' (premium: high-resolution sculpted shapes, soft PBR shading) or 'lowpoly' (faceted reference look).
let Q={smooth:true};
const seg=n=>Q.smooth?Math.max(n,Math.round(n*3)):n;
function mat(color,{flat=true,rough=.78,metal=0,emissive=null,glow=1,sheen=0,sheenColor=null,coat=0,opacity=1}={}){
  const o={color,roughness:rough,metalness:metal,flatShading:!Q.smooth&&flat,...(emissive&&{emissive,emissiveIntensity:glow}),...(opacity<1&&{transparent:true,opacity,depthWrite:false})};
  if(Q.smooth&&(sheen||coat))return new THREE.MeshPhysicalMaterial({...o,sheen,sheenColor:sheenColor||color,sheenRoughness:.55,clearcoat:coat,clearcoatRoughness:.22});
  return new THREE.MeshStandardMaterial(o);
}
function add(parent,geo,material,x=0,y=0,z=0){const o=new THREE.Mesh(geo,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
const box=(p,w,h,d,m,x,y,z,r=.05)=>add(p,new RoundedBoxGeometry(w,h,d,Q.smooth?4:1,r),m,x,y,z);
const ball=(p,r,m,x,y,z,ws=8,hs=6)=>add(p,new THREE.SphereGeometry(r,seg(ws),seg(hs)),m,x,y,z);
const cyl=(p,a,b,h,m,x,y,z,n=8)=>add(p,new THREE.CylinderGeometry(a,b,h,seg(n)),m,x,y,z);
const capsule=(p,r,len,m,x,y,z,n=7)=>add(p,new THREE.CapsuleGeometry(r,len,Q.smooth?6:2,seg(n)),m,x,y,z);
const cone=(p,r,h,m,x,y,z,n=6)=>add(p,new THREE.ConeGeometry(r,h,Q.smooth?Math.max(n,16):n),m,x,y,z);
const torus=(p,r,t,m,x,y,z,arc=PI*2)=>add(p,new THREE.TorusGeometry(r,t,seg(6),seg(16),arc),m,x,y,z);
const grp=(p,x=0,y=0,z=0)=>{const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;};
function tube(p,points,m,r=.015){const c=new THREE.CatmullRomCurve3(points.map(q=>V(...q)));return add(p,new THREE.TubeGeometry(c,Q.smooth?24:10,r,Q.smooth?10:5,false),m);}
function canvasTexture(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return {canvas:c,ctx:c.getContext('2d'),texture:t};}
// Deterministic vertex jitter gives the hand-cut facets of the low-poly look; shared corners move together.
function facet(geo,amount,seed){
  if(Q.smooth)return geo;
  const pos=geo.attributes.position,seen=new Map();
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),key=`${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
    let f=seen.get(key);if(f===undefined){const h=Math.sin(x*12.9898+y*78.233+z*37.719+seed)*43758.5453;f=1+((h-Math.floor(h))-.5)*amount;seen.set(key,f);}pos.setXYZ(i,x*f,y*f,z*f);}
  geo.computeVertexNormals();return geo;
}
const blob=(r,detail)=>Q.smooth?new THREE.SphereGeometry(r,48,32):new THREE.IcosahedronGeometry(r,detail);
const hash=n=>{const h=Math.sin(n*127.1+311.7)*43758.5453;return h-Math.floor(h);};
// Smooth head: a sphere sculpted into a cartoon skull (tapered jaw, fuller cheeks, flatter back).
function sculptedHead(r){
  const g=new THREE.SphereGeometry(r,72,54),p=g.attributes.position;
  for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const u=y/r;
    if(u<0){const k=1-.17*Math.pow(-u,1.7);x*=k;z*=k;}
    if(u<.15&&u>-.55&&z>0)x*=1+.04*Math.cos((u+.2)*4);
    if(z<0)z*=.95;p.setXYZ(i,x,y,z);}
  g.computeVertexNormals();return g;
}
// A tapered hair lock: wide at the root (+y), pointed at the tip (−y).
let lockGeometry=null;
function lockGeo(){if(lockGeometry)return lockGeometry.clone();const pts=[];for(let i=0;i<=16;i++){const t=i/16;pts.push(V2(Math.max(.0005,.5*Math.pow(Math.sin(PI*t),.7)*(.3+.7*t)),t-.5));}lockGeometry=new THREE.LatheGeometry(pts,24);return lockGeometry.clone();}
function irisTexture(color){
  const {canvas,ctx:x,texture}=canvasTexture(256,256),c=new THREE.Color(color),dark='#'+c.clone().multiplyScalar(.45).getHexString(),light='#'+c.clone().lerp(new THREE.Color('#ffffff'),.35).getHexString();
  const g=x.createRadialGradient(128,128,10,128,128,128);g.addColorStop(0,'#050505');g.addColorStop(.3,'#050505');g.addColorStop(.33,dark);g.addColorStop(.62,light);g.addColorStop(.86,'#'+c.getHexString());g.addColorStop(.95,'#140d0b');g.addColorStop(1,'#140d0b');
  x.fillStyle=g;x.fillRect(0,0,256,256);x.globalAlpha=.18;x.strokeStyle='#000';x.lineWidth=2;for(let i=0;i<48;i++){const a=i/48*PI*2;x.beginPath();x.moveTo(128+Math.cos(a)*44,128+Math.sin(a)*44);x.lineTo(128+Math.cos(a)*108,128+Math.sin(a)*108);x.stroke();}
  texture.needsUpdate=true;return texture;
}

// Body plans: joint offsets (chest space unless noted), limb lengths and face anchors (head space).
const PLANS={
  humanoid:{leg:1.05,hipX:.2,thigh:.52,shin:.48,chestY:.1,shoulderX:.47,shoulderY:.95,neckY:1.04,headY:.06,headC:.58,upper:.54,fore:.5,hand:.16,
    anchors:{forehead:[0,.76,.5],chin:[.04,.2,.4],face:[0,.6,.62],ear:[.56,.6,0]}},
  bot:{leg:.52,hipX:.3,thigh:.27,shin:.27,chestY:.05,shoulderX:.62,shoulderY:.7,neckY:.86,headY:.04,headC:.43,upper:.38,fore:.36,hand:.1,
    anchors:{forehead:[.12,.18,.5],chin:[.08,.02,.5],face:[0,.45,.62],ear:[.7,.43,0]}},
  mascot:{leg:.5,hipX:.36,thigh:.25,shin:.25,chestY:.02,shoulderX:.78,shoulderY:.62,neckY:.2,headY:0,headC:.5,upper:.34,fore:.3,hand:.1,
    anchors:{forehead:[-.4,.15,.58],chin:[.42,-.1,.58],face:[0,.1,.7],ear:[.8,.1,0]}}
};
// Sitting: seat top height, hip height and how far back the hips move (rig units, before the character's height scale).
const SEATS={humanoid:{top:.56,hip:.66,back:.42},bot:{top:.3,hip:.36,back:.3},mascot:{top:.28,hip:.34,back:.32}};

export function buildCharacter(member,style='smooth'){
  Q={smooth:style!=='lowpoly'};
  const a=member.look,kind=member.kind,pk=kind==='bot'||kind==='mascot'?kind:'humanoid',plan=PLANS[pk],b=a.build,seed=[...member.id].reduce((s,c)=>s+c.charCodeAt(0),0),robotic=kind==='robot'||kind==='bot';
  const cloth=(c,extra={})=>mat(c,{rough:.88,sheen:.8,sheenColor:shade(c,.25),...extra});
  const M={skin:mat(a.skin,{rough:kind==='creature'?.9:.6,sheen:kind==='creature'?.9:.45,sheenColor:shade(a.skin,.22)}),hair:mat(a.hair,{rough:.5,sheen:1,sheenColor:shade(a.hair,.35)}),
    top:robotic?mat(a.top,{rough:kind==='bot'?.36:.3,metal:kind==='robot'?.45:.05,coat:.8}):cloth(a.top),
    accent:robotic?mat(a.accent,{rough:.32,metal:.65,coat:.4}):cloth(a.accent,{sheen:.5}),bottom:cloth(a.bottom),shoes:mat(a.shoes,{rough:.6,coat:.2}),
    eye:mat(a.eyes,{rough:.12,flat:false,coat:1}),white:mat('#f3ede4',{rough:.25,flat:false,coat:.6}),shine:mat('#ffffff',{rough:.25,flat:false}),dark:mat('#1b1716',{rough:.5}),
    screen:mat('#0f2221',{rough:.2,metal:.2,coat:1}),sole:mat(shade(a.shoes,-.35),{rough:.8}),blush:mat('#ff8f87',{rough:1,opacity:.28,flat:false})};
  const root=new THREE.Group(),hips=grp(root,0,plan.leg,0),chest=grp(hips,0,plan.chestY,0),neck=grp(chest,0,plan.neckY,0),head=grp(neck,0,plan.headY,0);
  root.scale.setScalar(a.height);head.scale.setScalar(a.head);
  const rig={member,kind,plan,seat:SEATS[pk],root,hips,chest,neck,head,arms:[],legs:[],feet:[],M,seed,face:null,anchors:{},smooth:Q.smooth};

  // Torso and hips.
  if(kind==='mascot'){const cy=plan.neckY+plan.headY+plan.headC,sh=a.shape;
    if(sh==='block')box(chest,1.5*b,1.3,1.15,M.top,0,cy,0,Q.smooth?.12:.03);
    else if(sh==='round'){const body=ball(chest,.74,M.top,0,cy,0,32,24);body.scale.set(b,.95,.92);}
    else{const body=capsule(chest,.6*b,.45,M.top,0,cy,0);body.scale.z=.85;}
    rig.bodyDepth=sh==='block'?1.15:sh==='round'?.74*.92*2:.6*.85*2;}
  else if(kind==='bot'){box(chest,1.12,.78,.72,M.top,0,.43,0,.14);box(chest,.8,.41,.08,M.accent,0,.44,.385,.05);cyl(chest,.11,.11,.02,M.white,-.23,.44,.45,12).rotation.x=PI/2;for(let i=0;i<3;i++)box(chest,.22,.025,.03,M.white,.17,.36+i*.08,.443,.008);box(hips,.7,.16,.5,M.accent,0,.02,0,.05);}
  else if(kind==='robot'){box(chest,.98*b,1.0,.62,M.top,0,.5,0,.12);box(chest,.62*b,.42,.06,M.screen,0,.62,.32,.05);cyl(chest,.08,.08,.02,M.accent,0,.62,.36,10).rotation.x=PI/2;box(hips,.72*b,.36,.5,M.accent,0,0,0,.08);cyl(chest,.16,.18,.18,M.accent,0,1.02,0,10);}
  else{
    let torso;
    if(Q.smooth){const prof=[[.4,0],[.43,.2],[.47,.55],[.5,.8],[.48,.93],[.37,1.02],[.2,1.06],[.001,1.07]].map(([r,y])=>V2(r*b,y));torso=add(chest,new THREE.LatheGeometry(prof,48),M.top);torso.scale.z=.82;
      const waist=torus(hips,.4*b,.055,mat(shade(a.top,-.1),{rough:.9,sheen:.6}),0,.12,0);waist.rotation.x=PI/2;waist.scale.y=.82;}
    else{torso=cyl(chest,.5*b,.42*b,1.05,M.top,0,.52,0,8);torso.scale.z=.92;}
    if(Q.smooth){const pelvis=ball(hips,.4*b,M.bottom,0,-.02,0,16,10);pelvis.scale.set(1,.55,.72);}else box(hips,.72*b,.38,.5,M.bottom,0,0,0,.12);
    cyl(chest,.17,.19,.2,M.skin,0,1.04,0,8);
    const fz=Q.smooth?.82:.92,front=(y,r)=>r*b*fz;
    if(a.topStyle==='hoodie'){
      if(Q.smooth){const roll=torus(chest,.27,.1,M.top,0,1.0,-.04);roll.rotation.x=PI/2;roll.scale.set(1.15*b,.85,1);const hood=ball(chest,.36*b,M.top,0,1.08,-.2,16,12);hood.scale.set(1.05,.62,.7);
        box(chest,.58*b,.3,.07,mat(shade(a.top,-.08),{rough:.9,sheen:.6}),0,.3,front(.3,.45)+.01,.04);
        for(const s of [-1,1]){tube(chest,[[s*.1,.99,.3],[s*.12,.8,front(.8,.5)+.02],[s*.13,.62,front(.62,.48)+.03]],M.accent,.014);cyl(chest,.02,.02,.06,mat('#d9d4c8',{rough:.4,coat:.5}),s*.13,.58,front(.6,.48)+.03,8);}}
      else{const hood=ball(chest,.47*b,M.top,0,1.0,-.1,9,6);hood.scale.set(1,.55,.9);box(chest,.6*b,.3,.12,mat(shade(a.top,-.12)),0,.24,.42,.06);for(const s of [-1,1])tube(chest,[[s*.13,1.0,.36],[s*.15,.72,.47],[s*.16,.5,.47]],M.accent,.016);tube(chest,[[-.25,.36,.46],[0,.3,.48],[.25,.36,.46]],mat(shade(a.top,-.2)),.012);}
    }
    else if(a.topStyle==='tshirt'){const collar=torus(chest,.19,.03,M.top,0,1.02,0);collar.rotation.x=PI/2;box(chest,.24,.07,.03,M.accent,.2*b,.75,front(.75,.5),.01);}
    else if(a.topStyle==='jacket'){box(chest,.3,.98,.04,M.accent,0,.52,front(.5,.48),.02);for(const s of [-1,1]){const lap=box(chest,.12,.42,.04,mat(shade(a.top,.1),{sheen:.6}),s*.17,.8,front(.8,.5)-.01,.015);lap.rotation.z=s*.25;}if(!Q.smooth)box(chest,.86*b,.06,.5,mat(shade(a.top,-.2)),0,.03,0,.02);}
    else{box(chest,.26,.5,.04,mat('#f0ece4',{sheen:.3}),0,.78,front(.78,.5),.02);box(chest,.07,.42,.03,M.accent,0,.72,front(.72,.5)+.02,.015);for(const s of [-1,1]){const lap=box(chest,.13,.5,.04,mat(shade(a.top,.12),{sheen:.5}),s*.15,.78,front(.78,.5)-.005,.015);lap.rotation.z=s*.32;}}
  }

  // Arms: shoulder → upper → fore → hand, each bone hanging along −Y from its joint.
  for(const s of [-1,1]){
    const shoulder=grp(chest,s*(kind==='bot'?plan.shoulderX:plan.shoulderX*b),plan.shoulderY,0),upper=grp(shoulder),fore=grp(upper,0,-plan.upper,0),hand=grp(fore,0,-plan.fore,0);
    const sleeve=a.topStyle==='tshirt'&&!robotic;
    if(kind==='mascot'){box(upper,.2,plan.upper+.08,.2,M.top,0,-plan.upper/2+.04,0,.05);box(fore,.18,plan.fore,.18,M.accent,0,-plan.fore/2,0,.05);}
    else if(kind==='bot'){ball(shoulder,.14,M.accent,0,0,0,10,8);cyl(upper,.09,.09,plan.upper-.06,M.white,0,-plan.upper/2,0,8);ball(fore,.12,M.accent,0,0,0,10,8);cyl(fore,.1,.1,plan.fore-.08,M.top,0,-plan.fore/2,0,8);}
    else if(kind==='robot'){ball(shoulder,.19*b,M.accent,0,0,0,10,8);cyl(upper,.12*b,.11*b,plan.upper-.08,M.top,0,-plan.upper/2,0,8);ball(fore,.13*b,M.accent,0,0,0,10,8);cyl(fore,.11*b,.1*b,plan.fore-.06,M.top,0,-plan.fore/2,0,8);}
    else{ball(shoulder,.2*b,M.top,0,0,0,8,6);capsule(upper,.165*b,plan.upper-.2,sleeve?M.skin:M.top,0,-plan.upper/2,0);if(sleeve)cyl(upper,.19*b,.18*b,.2,M.top,0,-.08,0,8);
      if(Q.smooth)ball(fore,.152*b,sleeve?M.skin:M.top,0,0,0,10,8);
      capsule(fore,.15*b,plan.fore-.18,sleeve?M.skin:M.top,0,-plan.fore/2,0);
      if(!sleeve){if(Q.smooth){const cuff=torus(fore,.135*b,.035,mat(shade(a.top,-.15),{rough:.9,sheen:.6}),0,-plan.fore+.07,0);cuff.rotation.x=PI/2;}else cyl(fore,.155*b,.155*b,.1,mat(shade(a.top,-.15)),0,-plan.fore+.06,0,8);}}
    const palmMat=robotic?M.accent:kind==='mascot'?M.accent:M.skin,size=kind==='bot'?.8:kind==='mascot'?.55:1,fingers=[];let index,thumb;
    if(Q.smooth){
      // Palm, four fingers and a thumb; the palm faces the body at rest and fingers curl toward it.
      const palm=box(hand,.1*size,.17*size,.17*size,palmMat,0,-.085*size,0,.045*size);
      for(let f=0;f<4;f++){const g=grp(hand,0,-.165*size,(.058-f*.037)*size);capsule(g,.026*size*(f===3?.85:1),(f===3?.05:.07)*size,palmMat,0,-.045*size,0,6);if(f===0)index=g;else fingers.push(g);}
      thumb=grp(hand,-s*.02*size,-.05*size,.085*size);capsule(thumb,.03*size,.06*size,palmMat,0,-.045*size,.012,6).rotation.x=-.45;
    }else{
      const palm=ball(hand,.13*size,palmMat,0,-.08*size,0,7,5);palm.scale.set(.72,1,.92);
      const mitt=grp(hand,0,-.16*size,-.015);index=grp(hand,0,-.16*size,.075*size);thumb=grp(hand,0,-.06*size,.1*size);
      box(mitt,.1*size,.15*size,.13*size,palmMat,0,-.07*size,-.01,.04*size);capsule(index,.035*size,.09*size,palmMat,0,-.07*size,0,5);capsule(thumb,.036*size,.08*size,palmMat,0,-.05*size,.02,5).rotation.x=-.5;fingers.push(mitt);
    }
    rig.arms.push({s,shoulder,upper,fore,hand,fingers,index,thumb,lenU:plan.upper,lenF:plan.fore,handOff:plan.hand});
  }

  // Legs end at the ankle; feet are root children so they stay planted while the hips move.
  for(const s of [-1,1]){
    const hip=grp(hips,s*plan.hipX*(kind==='bot'?1:b),kind==='bot'?0:-.08,0),upper=grp(hip),fore=grp(upper,0,-plan.thigh,0),ankleY=.07,foot=grp(root,s*plan.hipX*(kind==='bot'?1:b),ankleY,.04);
    if(kind==='mascot'){box(upper,.24,plan.thigh+.06,.24,M.top,0,-plan.thigh/2,0,.04);box(fore,.22,plan.shin,.22,M.accent,0,-plan.shin/2,0,.04);box(foot,.26,.1,.3,M.accent,0,-.02,.03,.03);
      if(a.shape==='block'){const rear=box(hips,.22,plan.leg+.05,.22,M.accent,s*plan.hipX,-plan.leg/2+.02,-.38,.04);rear.userData.rear=true;}}
    else if(kind==='bot'){cyl(upper,.1,.1,plan.thigh,M.accent,0,-plan.thigh/2,0,8);cyl(fore,.1,.1,plan.shin,M.accent,0,-plan.shin/2,0,8);box(foot,.43,.25,.6,M.top,0,.06,.08,.07);box(foot,.45,.065,.63,M.accent,0,-.05,.08,.025);}
    else{capsule(upper,.17*b,plan.thigh-.2,robotic?M.top:M.bottom,0,-plan.thigh/2,0);if(Q.smooth)ball(fore,.155*b,robotic?M.accent:M.bottom,0,0,0,10,8);capsule(fore,.15*b,plan.shin-.16,robotic?M.top:M.bottom,0,-plan.shin/2,0);if(robotic&&!Q.smooth)ball(fore,.14*b,M.accent,0,0,0,8,6);
      if(Q.smooth&&!robotic){box(foot,.34*b,.17,.56,M.shoes,0,.035,.1,.08);box(foot,.36*b,.055,.6,M.sole,0,-.06,.1,.025);const toe=ball(foot,.16*b,M.shoes,0,0,.27,12,8);toe.scale.set(1.05,.62,.8);for(let k=0;k<3;k++)box(foot,.17*b,.015,.022,mat('#f2ede4',{rough:.5}),0,.13,.08+k*.07,.006);}
      else{box(foot,.36*b,.2,.58,M.shoes,0,.02,.1,.08);box(foot,.37*b,.06,.59,M.sole,0,-.07,.1,.02);}}
    rig.legs.push({s,shoulder:hip,upper,fore,lenU:plan.thigh,lenF:plan.shin-(kind==='bot'||kind==='mascot'?0:.05),handOff:0});
    rig.feet.push(foot);foot.userData.rest=foot.position.clone();
  }

  buildHead(rig,a,M,seed);
  for(const [k,v] of Object.entries(plan.anchors))rig.anchors[k]=V(...v);
  if(kind==='creature')buildTail(rig,a,M);
  if(a.prop!=='none')rig.prop=buildProp(rig,a.prop);
  root.traverse(o=>{if(o.isMesh)o.userData.character=member.id;});
  return rig;
}

// Hand-held props, parented to the right hand. In the hold pose the forearm points forward, so hand +Z faces up.
export function buildProp(rig,kind){
  const arm=rig.arms[0],g=grp(arm.hand,0,-arm.handOff*.75,0),k=rig.kind==='mascot'?1:1.35;g.scale.setScalar(k);g.rotation.x=-.9;
  const dark=mat('#1d1f24',{rough:.35,coat:.8}),glass=mat('#9fd0ff',{emissive:'#7fb8ff',glow:1.6,flat:false});
  if(kind==='phone'||kind==='tablet'){const [w,l]=kind==='phone'?[.17,.3]:[.42,.3];box(g,w,l,.03,dark,0,-l/2+.05,.03,.02);const scr=new THREE.Mesh(new THREE.PlaneGeometry(w*.86,l*.86),glass);scr.position.set(0,-l/2+.05,.047);g.add(scr);}
  else if(kind==='mug'||kind==='coffee'){const c=kind==='mug'?'#d9cfc0':'#f3ede2',cup=cyl(g,.1,kind==='mug'?.1:.08,.22,mat(c,{rough:.4,coat:.6}),0,-.08,.13,16);cup.rotation.x=PI/2;
    if(kind==='coffee'){const lid=cyl(g,.105,.105,.04,mat('#3a2a22'),0,-.08,.25,16);lid.rotation.x=PI/2;const band=cyl(g,.098,.09,.08,mat('#a8784c',{rough:.9}),0,-.08,.12,16);band.rotation.x=PI/2;}
    else{const h=torus(g,.06,.018,mat(c,{rough:.4}),.1,-.08,.13);h.rotation.y=PI/2;const tea=cyl(g,.088,.088,.01,mat('#6b3f22',{rough:.2}),0,-.08,.235,16);tea.rotation.x=PI/2;}}
  else if(kind==='book'){const cover=mat(rig.member.look.accent,{rough:.8});box(g,.36,.27,.05,cover,0,-.1,.04,.02);box(g,.34,.25,.055,mat('#f1ead9',{rough:.9}),.008,-.1,.045,.01);}
  return g;
}
function shade(hex,amount){const c=new THREE.Color(hex);const hsl={};c.getHSL(hsl);c.setHSL(hsl.h,hsl.s,clamp(hsl.l+amount,0,1));return '#'+c.getHexString();}

function buildHead(rig,a,M,seed){
  const {head,kind,plan}=rig,C=plan.headC;
  if(kind==='mascot'){ledFace(rig,{screen:a.eyes},1.05,.6,V(0,C+.05,rig.bodyDepth/2+.012));rig.face.glow=false;return;}
  if(kind==='bot'){
    box(head,1.36,.94,.87,M.top,0,C,0,.14);box(head,1.15,.7,.085,M.accent,0,C+.02,.455,.1);box(head,1.04,.58,.035,M.screen,0,C+.02,.51,.08);
    for(const s of [-1,1]){cyl(head,.18,.18,.12,M.accent,s*.73,C,0,12).rotation.z=PI/2;cyl(head,.12,.12,.13,M.white,s*.79,C,0,12).rotation.z=PI/2;}
    cyl(head,.023,.023,.32,M.accent,.32,C+.61,0,6);rig.glow=mat(a.screen,{emissive:a.screen,glow:1.1,flat:false});ball(head,.09,rig.glow,.32,C+.81,0,10,8);
    ledFace(rig,a,.98,.54,V(0,C+.02,.531));return;
  }
  if(kind==='robot'){
    box(head,1.0,.95,.85,M.top,0,C,0,.16);box(head,.84,.56,.05,M.screen,0,C+.02,.43,.07);for(const s of [-1,1]){cyl(head,.13,.13,.12,M.accent,s*.53,C,0,10).rotation.z=PI/2;}
    cyl(head,.02,.02,.28,M.accent,.25,C+.6,0,6);rig.glow=mat(a.screen,{emissive:a.screen,glow:1.1,flat:false});ball(head,.07,rig.glow,.25,C+.76,0,10,8);
    ledFace(rig,a,.8,.5,V(0,C+.02,.46));hatAndGlasses(rig,a,M,C,.5);return;
  }
  // Human and creature: a sculpted (smooth) or faceted (low-poly) head, eyes, brows and a drawn mouth decal.
  const skull=add(head,Q.smooth?sculptedHead(.55):facet(new THREE.IcosahedronGeometry(.55,2),.045,seed),M.skin,0,C,0);skull.scale.set(1,1.02,.94);
  const muzzle=kind==='creature'&&a.species!=='dragon';
  rig.eyes=[];rig.pupils=[];rig.brows=[];rig.lids=[];
  for(const s of [-1,1]){
    const eye=grp(head,s*.2,C+.07,.43);rig.eyes.push(eye);const pupil=grp(eye);rig.pupils.push(pupil);
    if(a.eyeStyle==='glossy'){const e=ball(pupil,.095,M.eye,0,0,.03,12,10);e.scale.set(.9,1.18,.5);ball(pupil,.014,M.shine,-.03,.045,.08,8,6);ball(pupil,.007,M.shine,.025,-.03,.08,6,4);
      if(Q.smooth){const ring=add(pupil,new THREE.TorusGeometry(.062,.012,8,36),mat(shade(a.eyes,.18),{rough:.2,coat:1,flat:false}),0,-.01,.072);ring.scale.set(.9,1.15,1);}}
    else if(Q.smooth){const w=ball(eye,.112,M.white,0,0,0,12,10);w.scale.set(1,1.08,.62);const iris=add(pupil,new THREE.SphereGeometry(.07,40,20),new THREE.MeshPhysicalMaterial({map:irisTexture(a.eyes),roughness:.25,clearcoat:1,clearcoatRoughness:.05}),0,0,.055);iris.scale.set(1,1,.35);
      ball(pupil,.017,M.shine,-.022,.022,.085,8,6);ball(pupil,.008,M.shine,.02,-.018,.085,6,4);}
    else{const w=ball(eye,.112,M.white,0,0,0,12,10);w.scale.set(1,1.12,.55);const iris=ball(pupil,.065,M.eye,0,-.01,.055,12,10);iris.scale.z=.5;ball(pupil,.03,M.dark,0,-.01,.075,8,6).scale.z=.4;ball(pupil,.016,M.shine,-.018,.015,.088,6,4);}
    // Eyelids (both styles): skin shells that roll down over the eye for blinks, squints, tired and angry looks.
    // FrameForge fix (2026-11-09): the oval comes from the parent's scale and the blink rotation from the child, so a
    // closing lid slides over the eyeball's own surface. (Scaling the shell itself and then rotating it pushed the
    // closed lid far out in front of the eye, which read as skin-coloured blobs and sleepy, half-shut eyes.)
    {const glossy=a.eyeStyle==='glossy',r=glossy?.104:.122,oval=grp(eye,0,0,glossy?.03:0);oval.scale.set(glossy?.92:1,glossy?1.2:1.1,glossy?.62:.68);
      const lid=grp(oval);add(lid,new THREE.SphereGeometry(r,Q.smooth?40:10,Q.smooth?14:4,0,PI*2,0,PI*.5),M.skin);
      const lash=add(lid,new THREE.TorusGeometry(r*(glossy?.923:.951),Q.smooth?.009:.012,Q.smooth?6:3,Q.smooth?40:10,PI),M.dark);lash.rotation.x=PI/2;lash.rotation.z=PI;
      rig.lids.push(lid);}
    // Highlight dots sit in front of the lid; they are hidden while the eye is shut (see drawFace).
    (rig.shines??=[]).push(pupil.children.filter(o=>o.material===M.shine));
    if(Q.smooth){
      const brow=grp(head,s*.21,C+.27,.47);tube(brow,[[-.11*s,-.02,-.01],[0,.022,.01],[.11*s,-.008,-.02]],M.hair,.03);rig.brows.push(brow);
      const blush=ball(head,.1,M.blush,s*.33,C-.13,.4,12,8);blush.scale.set(1,.6,.35);blush.castShadow=false;
    }else rig.brows.push(box(head,.22,.06,.06,M.hair,s*.21,C+.27,.45,.025));
  }
  if(!muzzle){
    if(Q.smooth){const nose=ball(head,.072,M.skin,0,C-.05,.52,12,10);nose.scale.set(.85,.78,1);for(const s of [-1,1]){const ear=ball(head,.13,M.skin,s*.545,C-.02,-.02,10,8);ear.scale.set(.42,1,.8);const inner=ball(head,.075,mat(shade(a.skin,-.1),{rough:.8}),s*.575,C-.02,-.0,8,6);inner.scale.set(.3,.75,.6);}}
    else{const nose=cone(head,.075,.16,M.skin,0,C-.04,.52,3);nose.rotation.x=PI/2;nose.rotation.y=PI;for(const s of [-1,1]){ball(head,.12,M.skin,s*.54,C-.02,-.02,6,5).scale.set(.6,1,.9);}}
  }
  // Mouth decal on a curved strip that follows the jaw (or the front of a muzzle); drawn at 2× for crisp lips.
  const tex=canvasTexture(512,256),R=.5,arc=.8,mg=new THREE.CylinderGeometry(R,R,.2,24,1,true,-arc/2,arc);mg.translate(0,0,-R);
  const mouth=new THREE.Mesh(mg,new THREE.MeshStandardMaterial({map:tex.texture,transparent:true,alphaTest:.04,roughness:.45,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
  mouth.position.set(0,C-.27,muzzle?.66:Q.smooth?.468:.47);mouth.rotation.x=muzzle?.05:.25;mouth.renderOrder=2;if(muzzle)mouth.scale.set(.8,.8,.8);head.add(mouth);
  rig.face={type:'drawn',tex,last:''};
  if(kind==='creature')creatureHead(rig,a,M,C);
  else{hair(rig,a,M,C,seed);facialHair(rig,a,M,C);}
  hatAndGlasses(rig,a,M,C,.52);
}

function hair(rig,a,M,C,seed){
  const {head}=rig,st=a.hairStyle;if(st==='bald')return;
  const cap=add(head,facet(blob(.585,1),.06,seed+3),M.hair,0,C+.1,-.07);cap.scale.set(1,st==='short'||st==='mohawk'?.72:.88,.97);
  // A lock (smooth) or shard (low-poly) lying on the scalp: long axis along the surface, thin along the normal.
  const R=.6,place=(theta,phi,len,wid,n,thick=.42)=>{
    const d=V(Math.sin(theta)*Math.cos(phi),Math.sin(phi),Math.cos(theta)*Math.cos(phi)),up=V(-Math.sin(theta)*Math.sin(phi),Math.cos(phi),-Math.cos(theta)*Math.sin(phi));
    const x=V().crossVectors(up,d),m=new THREE.Matrix4().makeBasis(x,up,d),geo=Q.smooth?lockGeo():new THREE.OctahedronGeometry(.17,0),k=Q.smooth?.34:1;
    const piece=add(head,geo,M.hair,d.x*R,C+.08+d.y*R*.95,d.z*R*.96-.03);piece.quaternion.setFromRotationMatrix(m);piece.rotateZ((hash(n)-.5)*.5);
    piece.scale.set(wid*(.85+hash(n+1)*.3)*k,len*(.85+hash(n+2)*.3)*k,thick*k);return piece;};
  let n=seed;
  if(st==='mohawk'){cap.scale.set(.98,.6,.95);for(let i=0;i<7;i++){const p=place(PI,.35+i*.2,2.2,1.3,n+=3,.7);p.position.x=0;}return;}
  if(st==='shaggy'){
    // Reference look: a mop layered from the crown to a fringe over the brow and the tops of the ears.
    cap.scale.set(1.02,.76,.94);cap.position.y+=.09;
    for(let i=0;i<9;i++)place(-.85+i*.21,.92+hash(n+i)*.1,1.35,1.15,n+=3);
    for(const s of [-1,1])for(let i=0;i<5;i++)place(s*(1.05+i*.32),.38+hash(n+i)*.2,2.3,1.3,n+=3);
    for(let i=0;i<7;i++)place(PI-.9+i*.3,.3+hash(n+i)*.25,2.4,1.35,n+=3);
    for(let i=0;i<10;i++)place(i*.63,1.05+hash(n+i)*.25,1.8,1.5,n+=3);
  }else if(st==='chunky'){
    if(Q.smooth){for(let i=0;i<14;i++)place(-1.2+i*.55%(PI*2),.75+hash(n+i)*.4,1.5,1.8,n+=3,.8);place(-.35,.95,1.6,1.4,n+=3,.9);}
    else{for(let i=0;i<9;i++){const h=add(head,new THREE.DodecahedronGeometry(.22+(i%3)*.035,0),M.hair,-.4+(i%5)*.2,C+.5+Math.sin(i*1.7)*.09,.25-Math.floor(i/5)*.32);h.rotation.set(i*.4,i*.8,i*.6);h.scale.set(1.05,1.25,.85);}
      const quiff=cone(head,.27,.53,M.hair,-.19,C+.68,.23,4);quiff.rotation.z=-.43;}
  }else if(st==='curly'){for(let i=0;i<34;i++){const ang=i*2.39996,r=.12+.42*Math.sqrt(i/34);add(head,Q.smooth?new THREE.SphereGeometry(.12,20,14):new THREE.IcosahedronGeometry(.12,0),M.hair,Math.cos(ang)*r,C+.5+.12*Math.cos(r*2.5),Math.sin(ang)*r*.9-.04);}}
  else if(st==='long'){// FrameForge fix (2026-11-09): the locks run from one side, round the back, to the other side. The original
    // arc began at the front centre, so the first locks hung under the chin and read as a beard.
    for(let i=0;i<13;i++){const ang=PI*1.06+i/12*PI*.88,lock=add(head,Q.smooth?lockGeo():new THREE.OctahedronGeometry(.17,0),M.hair,Math.cos(ang)*.5,C-.25,Math.sin(ang)*.4-.12);lock.scale.set(Q.smooth?.27:.8,Q.smooth?.95:2.8,Q.smooth?.24:.7);}
    for(let i=0;i<6;i++)place(-.75+i*.3,.66,1.9,1.2,n+=3);}
  else if(st==='bun'){add(head,blob(.2,1),M.hair,0,C+.62,-.22);if(Q.smooth)for(let i=0;i<8;i++)place(-1.1+i*.31,.7,1.7,1.4,n+=3);}
  else if(st==='short'&&Q.smooth){for(let i=0;i<8;i++)place(-.85+i*.24,.72,1.3,1.4,n+=3,.5);}
}
function facialHair(rig,a,M,C){
  const {head}=rig;if(a.facialHair==='none')return;
  if(a.facialHair==='beard'){const chin=add(head,facet(blob(.3,1),.08,9),M.hair,0,C-.36,.24);chin.scale.set(1.15,.75,.75);for(const s of [-1,1]){const side=ball(head,.15,M.hair,s*.36,C-.2,.26,6,5);side.scale.set(.8,1.5,.7);}}
  else if(a.facialHair==='mustache'){for(const s of [-1,1]){const m=Q.smooth?capsule(head,.035,.12,M.hair,s*.08,C-.16,.5,8):box(head,.17,.05,.05,M.hair,s*.08,C-.16,.5,.02);m.rotation.z=Q.smooth?s*1.25:s*-.22;}}
  else{const stub=mat(shade(a.skin,-.18),{rough:1,opacity:Q.smooth?.55:1});const s=add(head,facet(blob(.31,1),.03,4),stub,0,C-.3,.2);s.scale.set(1.18,.7,.8);}
}
function hatAndGlasses(rig,a,M,C,front){
  const {head}=rig;
  if(a.glasses!=='none'){const frame=mat('#c4a373',{rough:.25,metal:.8,flat:false,coat:.6});
    for(const s of [-1,1]){if(a.glasses==='round'){torus(head,.16,.02,frame,s*.2,C+.07,front);if(Q.smooth){const lens=ball(head,.155,mat('#cfe3ea',{rough:.05,opacity:.12,flat:false}),s*.2,C+.07,front,16,12);lens.scale.z=.12;lens.castShadow=false;}}
      else{for(const [w,h,x,y] of [[.32,.03,0,.11],[.32,.03,0,-.1],[.03,.22,-.155,0],[.03,.22,.155,0]])box(head,w,h,.03,frame,s*.2+x,C+.07+y,front,.01);}
      tube(head,[[s*.36,C+.09,front-.03],[s*.5,C+.09,.25],[s*.52,C+.08,0]],frame,.016);}
    tube(head,[[-.05,C+.1,front+.01],[0,C+.13,front+.03],[.05,C+.1,front+.01]],frame,.015);}
  if(a.hat==='cap'){const dome=ball(head,.6,M.accent,0,C+.22,-.03,10,6);dome.scale.set(1,.62,1);const brim=box(head,.7,.05,.42,M.accent,0,C+.3,.5,.02);brim.rotation.x=-.12;}
  else if(a.hat==='beanie'){const b=add(head,facet(blob(.6,1),.03,5),M.accent,0,C+.25,-.03);b.scale.set(1,.72,1);torus(head,.56,.07,mat(shade(a.accent,-.12),{sheen:.6}),0,C+.12,-.03).rotation.x=PI/2;ball(head,.1,mat(shade(a.accent,.1),{sheen:.8}),0,C+.72,-.03,6,5);}
  else if(a.hat==='headphones'){torus(head,.6,.04,M.dark,0,C+.05,0,PI);for(const s of [-1,1]){const cup=cyl(head,.17,.17,.12,M.accent,s*.6,C,0,12);cup.rotation.z=PI/2;}}
}
function creatureHead(rig,a,M,C){
  const {head}=rig,inner=M.accent,sp=a.species;
  if(sp!=='dragon'){const m=add(head,facet(blob(.25,1),.05,2),M.skin,0,C-.2,.45);m.scale.set(1.35,.7,.82);
    const tip=ball(head,.065,M.dark,0,C-.08,.67,8,6);tip.scale.set(1.3,.8,.7);
    if(sp==='cat')for(const s of [-1,1])for(let i=-1;i<=1;i++)tube(head,[[s*.18,C-.18+i*.035,.62],[s*.5,C-.2+i*.08,.6]],mat('#efe2d2',{flat:false}),.005);}
  else{const snout=add(head,facet(blob(.26,1),.06,6),M.skin,0,C-.18,.44);snout.scale.set(1.15,.72,1);for(const s of [-1,1])ball(head,.03,M.dark,s*.09,C-.08,.69,6,4);}
  for(const s of [-1,1]){
    if(sp==='fox'||sp==='cat'){const ear=cone(head,sp==='cat'?.19:.22,sp==='cat'?.36:.5,M.skin,s*.36,C+.62,-.05,4);ear.rotation.z=-s*.3;const e2=cone(head,.11,sp==='cat'?.22:.32,inner,s*.36,C+.6,.04,4);e2.rotation.z=-s*.3;}
    else if(sp==='bunny'){const ear=capsule(head,.1,.55,M.skin,s*.2,C+.92,-.05,6);ear.rotation.z=-s*.18;ear.scale.z=.55;const e2=capsule(head,.05,.45,inner,s*.2,C+.92,.0,5);e2.rotation.z=-s*.18;e2.scale.z=.4;}
    else if(sp==='bear'){ball(head,.17,M.skin,s*.4,C+.48,-.02,8,6);ball(head,.09,inner,s*.4,C+.48,.08,6,5);}
    else{const horn=cone(head,.08,.38,M.accent,s*.27,C+.6,-.1,5);horn.rotation.set(-.5,0,-s*.35);}
  }
}
function buildTail(rig,a,M){
  const {hips}=rig,sp=a.species,tail=grp(hips,0,.05,-.3);tail.rotation.x=-.5;rig.tail=tail;
  if(sp==='fox'){const t=add(tail,facet(blob(.3,1),.08,3),M.skin,0,-.02,-.45);t.scale.set(.7,.7,1.7);const tipM=add(tail,blob(.17,1),M.accent,0,.02,-.9);tipM.scale.set(.9,.9,1.1);}
  else if(sp==='cat'){tube(tail,[[0,0,0],[0,.05,-.4],[.1,.35,-.62],[.12,.58,-.52]],M.skin,.06);}
  else if(sp==='bunny'){ball(tail,.16,M.accent,0,0,-.08,8,6);}
  else if(sp==='bear'){ball(tail,.11,M.skin,0,0,-.05,6,5);}
  else{const t=cone(tail,.2,1.1,M.skin,0,0,-.55,6);t.rotation.x=-PI/2;for(let i=0;i<4;i++){const sp2=cone(tail,.07,.18,M.accent,0,.14-i*.02,-.15-i*.25,4);sp2.rotation.x=-.4;}}
}
function ledFace(rig,a,w,h,at){
  const tex=canvasTexture(512,288),plane=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex.texture,transparent:true,toneMapped:false}));
  plane.position.copy(at);rig.head.add(plane);rig.face={type:'led',tex,last:'',color:a.screen};
}

// ---------- Face drawing ----------
const q2=v=>Math.round(v*100)/100;
export function drawFace(rig,m,f,blink,gaze,t){
  const face=rig.face;
  if(face.type==='led')return drawLed(face,m,f,blink,gaze,t);
  for(let i=0;i<2;i++){const side=i===0?1:-1,open=f.eye*blink;if(rig.lids.length){rig.lids[i].rotation.x=lerp(1.5,-.62,clamp(open,0,1.35)/1);rig.lids[i].rotation.z=side*f.brow*.6;for(const g of rig.shines?.[i]||[])g.visible=open>.35;}else rig.eyes[i].scale.y=Math.max(.08,open);rig.brows[i].rotation.z=side*f.brow;rig.brows[i].position.y=rig.plan.headC+.27+f.raise+(f.asym&&i===0?.05*f.asym:0)-Math.max(0,-f.brow)*.03;rig.pupils[i].position.set(gaze*.022,0,0);}
  const open=clamp(m.open+f.open*(1-m.open),0,1),key=[open,m.wide,m.round,m.teeth,m.tongue,f.smile].map(q2).join();if(key===face.last)return;face.last=key;
  const x=face.tex.ctx;x.setTransform(2,0,0,2,0,0);const cx=128,cy=50,w=52*m.wide*(1-m.round*.38)*(1+Math.max(0,f.smile)*.12),hgt=open*85,curve=f.smile*12*(1-open*.5);
  x.clearRect(0,0,256,128);x.lineCap='round';x.lineJoin='round';
  if(hgt<5){x.strokeStyle='#5c2721';x.lineWidth=6;x.beginPath();x.moveTo(cx-w,cy-curve);x.quadraticCurveTo(cx,cy+curve*1.1,cx+w,cy-curve);x.stroke();x.strokeStyle='rgba(140,62,52,.55)';x.lineWidth=4;x.beginPath();x.moveTo(cx-w*.55,cy+7-curve*.2);x.quadraticCurveTo(cx,cy+11+curve*.6,cx+w*.55,cy+7-curve*.2);x.stroke();}
  else{
    const r=m.round,top=cy-hgt*(.42+r*.08),bot=cy+hgt*(.62+r*.1),lx=cx-w,rx=cx+w,ly=cy-curve*.8;
    const outline=()=>{x.beginPath();x.moveTo(lx,ly);x.bezierCurveTo(cx-w*(.55-r*.25),top,cx+w*(.55-r*.25),top,rx,ly);x.bezierCurveTo(cx+w*(.6+r*.2),bot+curve*.4,cx-w*(.6+r*.2),bot+curve*.4,lx,ly);x.closePath();};
    outline();x.fillStyle='#2a0c0b';x.fill();x.save();x.clip();
    if(m.tongue>.05){x.fillStyle='#9c4643';x.beginPath();x.ellipse(cx,bot+hgt*.12,w*.5,hgt*(.18+m.tongue*.16),0,0,PI*2);x.fill();}
    if(m.teeth){x.fillStyle='#f4ebdf';x.fillRect(lx,top-4,w*2,Math.min(16,hgt*.26)+4);}
    x.restore();outline();x.strokeStyle='#6d2c25';x.lineWidth=4.5;x.stroke();
    x.strokeStyle='rgba(160,76,64,.75)';x.lineWidth=5;x.beginPath();x.moveTo(cx-w*.7,bot-hgt*.05);x.quadraticCurveTo(cx,bot+6,cx+w*.7,bot-hgt*.05);x.stroke();
  }
  face.tex.texture.needsUpdate=true;
}
function rr(x,cx,cy,w,h,r){x.beginPath();x.roundRect(cx-w/2,cy-h/2,w,h,Math.min(r,w/2,h/2));}
function drawLed(face,m,f,blink,gaze,t){
  const k=[m.open,m.wide,m.round,f.eye*blink,f.smile,f.brow,f.asym,gaze].map(q2).join()+f.emotion+(f.emotion==='idea'?Math.floor(t*6):0);if(k===face.last)return;face.last=k;
  const x=face.tex.ctx,col=face.color,W=512,H=288;x.clearRect(0,0,W,H);x.fillStyle=col;x.strokeStyle=col;x.lineCap='round';x.shadowColor=col;x.shadowBlur=face.glow===false?0:14;
  const ey=118,eh=74*f.eye*blink,gx=gaze*16;
  for(const s of [-1,1]){
    const cx=256+s*104+gx,big=f.asym&&s===1?1.18:1,w=50*big,h=Math.max(6,eh*big);
    if(f.emotion==='happy'&&blink>.5){x.lineWidth=13;x.beginPath();x.arc(cx,ey+16,30,PI*1.1,PI*1.9);x.stroke();continue;}
    if(f.emotion==='surprised'){x.beginPath();x.ellipse(cx,ey,32*Math.min(1.2,blink*1.2),Math.max(5,40*blink),0,0,PI*2);x.fill();continue;}
    rr(x,cx,ey,w,h,14);x.fill();
    if(Math.abs(f.brow)>.05){x.save();x.globalCompositeOperation='destination-out';x.shadowBlur=0;const cut=Math.abs(f.brow)*80,inner=cx-s*w/2,outer=cx+s*w/2,topY=ey-h/2-2;x.beginPath();
      if(f.brow<0){x.moveTo(inner-s*4,topY);x.lineTo(inner-s*4,topY+cut);x.lineTo(outer+s*4,topY-2);}else{x.moveTo(outer+s*4,topY);x.lineTo(outer+s*4,topY+cut);x.lineTo(inner-s*4,topY-2);}x.closePath();x.fill();x.restore();}
    if(f.emotion==='idea'){const tw=.6+.4*Math.sin(t*9+s);x.lineWidth=5;x.beginPath();x.moveTo(cx+s*36,ey-58-8*tw);x.lineTo(cx+s*36,ey-38+8*tw);x.moveTo(cx+s*26-8*tw,ey-48);x.lineTo(cx+s*46+8*tw,ey-48);x.stroke();}
  }
  const my=214,open=clamp(m.open+f.open*(1-m.open),0,1);
  if(open<.08){x.lineWidth=10;const c=f.smile*20;x.beginPath();x.moveTo(256-40,my-c);x.quadraticCurveTo(256,my+c*1.3,256+40,my-c);x.stroke();}
  else if(m.round>.5){x.beginPath();x.ellipse(256,my,18+22*(1-m.round*.4),8+open*26,0,0,PI*2);x.fill();}
  else{rr(x,256,my,46+50*m.wide*(1-m.round*.3),8+open*38,12);x.fill();}
  x.shadowBlur=0;x.fillStyle='rgba(0,0,0,.16)';for(let y=0;y<H;y+=6)x.fillRect(0,y,W,2);
  face.tex.texture.needsUpdate=true;
}

// ---------- Two-bone IK ----------
const _t=V(),_p=V(),_d=V(),_q=V(),_u=V(),_e=V(),_h=V(),_f=V(),_w=V(),_x=V(),_y=V(),_m=new THREE.Matrix4();
// Aims shoulder→upper→fore so the effector (wrist + handOff along the forearm) reaches targetW, elbow toward poleW.
export function solveLimb(limb,targetW,poleW){
  const parent=limb.shoulder;parent.updateWorldMatrix(true,false);
  const T=parent.worldToLocal(_t.copy(targetW)),P=parent.worldToLocal(_p.copy(poleW)),S=limb.upper.position,a=limb.lenU,b=limb.lenF+limb.handOff;
  const dir=_d.copy(T).sub(S);let dist=dir.length();dir.normalize();dist=clamp(dist,Math.abs(a-b)+.02,a+b-.002);
  const cosA=clamp((a*a+dist*dist-b*b)/(2*a*dist),-1,1),sinA=Math.sqrt(1-cosA*cosA);
  const pole=_q.copy(P).sub(S);pole.addScaledVector(dir,-pole.dot(dir));if(pole.lengthSq()<1e-8){pole.set(0,0,-1).addScaledVector(dir,dir.z);}pole.normalize();
  const u=_u.copy(dir).multiplyScalar(cosA).addScaledVector(pole,sinA),E=_e.copy(S).addScaledVector(u,a),H=_h.copy(S).addScaledVector(dir,dist),f=_f.copy(H).sub(E).normalize();
  const w=_w.copy(f).addScaledVector(u,-f.dot(u));if(w.lengthSq()<1e-8)w.copy(pole).negate();w.normalize();
  const y=_y.copy(u).negate(),x=_x.crossVectors(y,w);_m.makeBasis(x,y,w);limb.upper.quaternion.setFromRotationMatrix(_m);
  limb.fore.rotation.set(-Math.acos(clamp(u.dot(f),-1,1)),0,0);
}
export function effector(limb,out=V()){limb.hand?limb.hand.updateWorldMatrix(true,false):limb.fore.updateWorldMatrix(true,false);return (limb.hand||limb.fore).localToWorld(out.set(0,limb.hand?-limb.handOff:-limb.lenF,0));}

// ---------- Gestures ----------
// Hand shapes: finger curl, index curl, thumb (negative extends it).
export const SHAPES={relaxed:[.55,.45,.2],fist:[1.6,1.6,.9],point:[1.6,0,.7],open:[.05,0,-.35],thumbsup:[1.6,1.6,-1.4],cup:[.35,.25,.1]};
export const backOut=k=>{const c=1.4;return 1+(c+1)*Math.pow(k-1,3)+c*Math.pow(k-1,2);};
// Each gesture returns arm targets in chest space ('c'), head space ('h') or world ('w'),
// with optional elbow pole (chest space), hand shape and wrist rotation, plus body offsets.
export function gesture(name,l,d,g){
  const m=g.m,L=m.reach,beat=g.beat,dom=1,osc=(f,a=1)=>Math.sin(l*f)*a;
  switch(name){
    case 'explain':return {arms:[{c:[-m.sx*.7,m.sy-L*.62+beat*.1,L*.62+beat*.06],shape:'open',wrist:[-.5,0,.9]},{c:[m.sx*.7,m.sy-L*.6+beat*.12,L*.62+beat*.05],shape:'open',wrist:[-.5,0,-.9]}],head:{x:-beat*.06}};
    case 'wave':return {arms:[null,{c:[Math.max(m.sx*1.55,m.hw+.3),Math.min(m.sy+L*.85,m.ht-.15),L*.22],pole:[m.sx*2,m.sy-.4,-.4],shape:'open',wrist:[0,osc(10,.45),-.2]}],head:{z:-.07}};
    case 'point':return {arms:[null,{w:g.toCamera(L*1.05,.15),pole:[m.sx*1.5,m.sy-.7,-.6],shape:'point',wrist:[0,0,0]}],head:{x:-.03}};
    case 'point-screen':return {arms:[null,{w:g.toward(g.screen,L*1.02),pole:[m.sx*1.6,m.sy-.9,.5],shape:'point'}],look:'screen',chest:{y:.25}};
    case 'point-other':return {arms:[{w:g.toward(g.partner,L*1.02,0),pole:[-m.sx*1.6,m.sy-.9,-.4],shape:'point'},null],look:'partner'};
    case 'shrug':return {arms:[{c:[-m.sx*1.65,m.sy-L*.5,L*.45],pole:[-m.sx*2.4,m.sy-.8,-.4],shape:'open',wrist:[-.9,0,1.1]},{c:[m.sx*1.65,m.sy-L*.5,L*.45],pole:[m.sx*2,m.sy-.8,-.4],shape:'open',wrist:[-.9,0,-1.1]}],shoulders:.09,head:{z:.13,x:-.04}};
    case 'facepalm':return {arms:[{h:g.anchor('forehead',-.05,0,.06),pole:[-m.sx*1.8,m.sy-.6,.3],shape:'open',wrist:[.2,-.5,.4]},null],head:{x:.3,z:.06},chest:{x:.14},shoulders:.05};
    case 'think':return {arms:[{c:[m.sx*.25,m.sy-L*.62,L*.5],pole:[-m.sx*1.6,m.sy-.9,0],shape:'relaxed',wrist:[-.4,0,1.2]},{h:g.anchor('chin',.02,-.08,.06),pole:[m.sx*1.4,m.sy-1,.2],shape:'fist',wrist:[.3,0,-.6]}],head:{z:.12,y:-.1,x:.04},chest:{x:.06},eyesUp:1};
    case 'cheer':return {arms:[{c:[-Math.max(m.sx*1.1,m.hw+.2),m.sy+L*.95+osc(9,.06),L*.12],pole:[-m.sx*3,m.sy,-.3],shape:'fist'},{c:[Math.max(m.sx*1.1,m.hw+.2),m.sy+L*.95+osc(9+.5,.06),L*.12],pole:[m.sx*3,m.sy,-.3],shape:'fist'}],root:{y:Math.abs(Math.sin(l*6))*.12},head:{x:-.1}};
    case 'clap':{const gap=.05+.16*(.5+.5*Math.cos(l*13));return {arms:[{c:[-gap,m.sy-L*.35,L*.66],pole:[-m.sx*2,m.sy-.8,-.3],shape:'open',wrist:[0,-1.3,0]},{c:[gap,m.sy-L*.35,L*.66],pole:[m.sx*2,m.sy-.8,-.3],shape:'open',wrist:[0,1.3,0]}]};}
    case 'thumbsup':return {arms:[null,{c:[m.sx*.85,m.sy-L*.25,L*.62],pole:[m.sx*1.8,m.sy-1,-.3],shape:'thumbsup',wrist:[0,-.25,-.15]}],head:{z:-.08}};
    case 'crossarms':return {arms:[{c:[m.sx*.55,m.sy-L*.52,L*.42],pole:[-m.sx*1.6,m.sy-.9,.6],shape:'fist',wrist:[0,0,1.4]},{c:[-m.sx*.55,m.sy-L*.47,L*.5],pole:[m.sx*1.6,m.sy-.9,.6],shape:'fist',wrist:[0,0,-1.4]}],chest:{x:-.05},head:{x:-.06}};
    case 'handsup':return {arms:[{c:[-Math.max(m.sx*1.35,m.hw+.25),m.sy+L*.62,L*.35],pole:[-m.sx*3,m.sy-.4,-.3],shape:'open',wrist:[-1.2,0,.3]},{c:[Math.max(m.sx*1.35,m.hw+.25),m.sy+L*.62,L*.35],pole:[m.sx*3,m.sy-.4,-.3],shape:'open',wrist:[-1.2,0,-.3]}],chest:{x:-.1},root:{y:.06*Math.max(0,Math.sin(Math.min(l,.4)/.4*PI))}};
    case 'raise':return {arms:[null,{c:[Math.max(m.sx*.85,m.hw+.18),m.sy+L*.95,L*.2],pole:[m.sx*2.5,m.sy,-.3],shape:'point'}],head:{z:-.08,x:-.06}};
    case 'type':return {arms:[{c:[-m.sx*.55,m.sy-L*.72,L*.78],shape:'cup',wrist:[.9+osc(23,.25),0,0]},{c:[m.sx*.55,m.sy-L*.72,L*.78],shape:'cup',wrist:[.9+Math.sin(l*23+2)*.25,0,0]}],head:{x:.16},chest:{x:.08}};
    case 'press':{const at=Math.min(d*.45,1.2),tap=smooth((l-at)/.22)*(1-smooth((l-at-.4)/.3));return {arms:[null,{w:g.toward(g.key,L*(1.0-.12*(1-tap))),pole:[m.sx*1.8,m.sy-.6,-.4],shape:'point'}],chest:{x:.05+.07*tap,y:-.2},head:{x:.08},press:tap,look:'key'};}
    case 'nod':return {head:{x:osc(8,.14)}};
    case 'headshake':return {head:{y:osc(9,.3)}};
    case 'lean':return {chest:{x:.2},head:{x:.06},arms:[{c:[-m.sx*1.05,m.sy-L*.82,-.05],shape:'fist'},{c:[m.sx*1.05,m.sy-L*.82,-.05],shape:'fist'}]};
    case 'hop':{const phase=clamp(l,0,1.05),bounce=Math.abs(Math.sin(phase/1.05*PI*2));return {root:{y:bounce*.3},head:{z:Math.sin(phase*8)*.05},arms:[{c:[-m.sx*1.15,m.sy-L*.75,L*.12],shape:'open'},{c:[m.sx*1.15,m.sy-L*.75,L*.12],shape:'open'}]};}
    case 'jump':{const squat=smooth(l/.22)*(1-smooth((l-.22)/.08)),air=Math.max(0,Math.sin(clamp((l-.28)/.55,0,1)*PI)),land=smooth((l-.83)/.08)*(1-smooth((l-.95)/.2));
      // Arms swing out for the take-off and flight, then settle back to the sides after landing (no held T-pose).
      const out=smooth(l/.2)*(1-smooth((l-.95)/.3)),ay=lerp(m.sy-L*.85,m.sy+L*.5*air-L*.4*squat,out),ax=m.sx*lerp(1.05,1.2,out);
      return {hips:{y:-.22*(squat+land*.8)},root:{y:.75*air},arms:[{c:[-ax,ay,L*.2*out+L*.08],pole:[-m.sx*3,m.sy,-.3],shape:'open'},{c:[ax,ay,L*.2*out+L*.08],pole:[m.sx*3,m.sy,-.3],shape:'open'}],head:{x:-.12*air}};}
    default:return {};
  }
}

const _fk=V(),_tg=V(),_pl=V(),_eu=new THREE.Euler(),_qa=new THREE.Quaternion(),_v1=V(),_v2=V();
// One animation frame for a character. ctx: {t, talk, beat, face, mouth, action, blink, look (world point), world points}.
export function animateCharacter(rig,ctx){
  const {t,talk,beat,face,action}=ctx,ph=rig.seed*.37,m=metrics(rig),k=action.k,ease=k<=0?0:k>=1?1:clamp(backOut(k),0,1.08);
  const g=gesture(action.name,action.local,action.dur,{m,beat,screen:ctx.screen,key:ctx.key,partner:ctx.partner,
    // Targets resolve lazily, after this frame's body and head pose, so hands land on where the face is now.
    anchor:(name,dx=0,dy=0,dz=0)=>()=>rig.head.localToWorld(V(rig.anchors[name].x+dx,rig.anchors[name].y+dy,rig.anchors[name].z+dz)),
    toward:(p,len,arm=1)=>()=>{const s=rig.arms[arm].shoulder.getWorldPosition(V());return s.add(p.clone().sub(s).normalize().multiplyScalar(len*rig.root.scale.y));},
    toCamera:(len,up)=>()=>{const s=rig.arms[1].shoulder.getWorldPosition(V());const d=ctx.camera.clone().sub(s);d.y=0;d.normalize();d.y=up;return s.add(d.normalize().multiplyScalar(len*rig.root.scale.y));}});
  // Body: breathing, weight shift, emotion posture, gesture offsets.
  const sad=face.emotion==='sad'?1:0,angry=face.emotion==='angry'?1:0;
  rig.root.position.y=ctx.baseY+(g.root?.y||0)*k*rig.root.scale.y;
  const walk=ctx.walk||0,step=t*8.5,sit=ctx.sit||0,S=rig.seat;
  rig.root.position.y+=Math.abs(Math.sin(step))*.035*walk;
  rig.hips.position.set(Math.sin(t*.55+ph)*.025*(1-sit*.7),lerp(rig.plan.leg+(g.hips?.y||0)*k-sad*.03,S.hip,sit)+Math.sin(t*1.7+ph)*.006,-S.back*sit);
  for(const f of rig.feet){const r=f.userData.rest;f.position.set(r.x*(1+.15*sit),r.y+Math.max(0,Math.sin(step+(r.x<0?0:PI)))*.17*walk,r.z+.14*sit+Math.cos(step+(r.x<0?0:PI))*.22*walk);}
  rig.hips.children.forEach(o=>{if(o.userData.rear)o.visible=sit<.3;});rig.hips.rotation.set(0,Math.sin(t*.4+ph)*.03,Math.sin(t*.55+ph)*.02);
  rig.chest.rotation.set((g.chest?.x||0)*k+angry*.06+sad*.08+talk*beat*.04+sit*.07,Math.sin(t*.65+ph)*.03+(g.chest?.y||0)*k,-Math.sin(t*.55+ph)*.015);
  rig.chest.scale.set(1,1+Math.sin(t*1.7+ph)*.012,1+Math.sin(t*1.7+ph)*.008);
  for(const arm of rig.arms)arm.shoulder.position.y=rig.plan.shoulderY+(g.shoulders||0)*k+sad*-.03;
  // Head: look target, emotion pose, speech nods, gesture offsets.
  rig.neck.updateWorldMatrix(true,false);const hp=rig.neck.getWorldPosition(_v1),look=(g.look&&ctx[g.look])?ctx[g.look]:ctx.look,lookW=look?_v2.copy(look).sub(hp):null;
  let yaw=0,pitch=0;if(lookW){const inv=_qa.copy(rig.chest.getWorldQuaternion(new THREE.Quaternion())).invert();lookW.applyQuaternion(inv);yaw=clamp(Math.atan2(lookW.x,lookW.z),-.9,.9);pitch=clamp(-Math.atan2(lookW.y,Math.hypot(lookW.x,lookW.z)),-.4,.4);}
  const hx=pitch*.6+face.down+(g.head?.x||0)*k+(ctx.nod||0)+talk*(beat*.07+Math.sin(t*5.3+ph)*.015)+Math.sin(t*1.2+ph)*.02,hy=yaw*.75+(g.head?.y||0)*k+Math.sin(t*.7+ph)*.04,hz=face.tilt+(g.head?.z||0)*k+Math.sin(t*.8+ph)*.02;
  rig.neck.rotation.set(hx*.35,hy*.35,hz*.3);rig.head.rotation.set(hx*.65,hy*.65,hz*.7);
  // A mascot is all one body: looks, nods and tilts turn the whole block (and its arms) instead of a separate head.
  if(rig.kind==='mascot'){rig.chest.rotation.x+=hx*.45;rig.chest.rotation.y+=hy*.55;rig.chest.rotation.z+=hz*.5;rig.neck.rotation.set(0,0,0);rig.head.rotation.set(0,0,0);}
  // Arms: an FK base (relaxed, plus speech beats on the dominant hand), then IK toward the gesture target.
  rig.root.updateMatrixWorld(true);
  const domI=rig.prop?1:(rig.seed+Math.floor(ctx.cueIndex||0))%2;
  rig.arms.forEach((arm,i)=>{
    const s=arm.s,dom=i===domI?1:.45,lift=talk*dom*(.25+beat*.55);
    // Hold pose for a prop (forearm forward, item in front of the chest); seated hands rest on the lap.
    const hold=rig.prop&&i===0?1:0;
    _eu.set(-.1-lift*.5-sad*-.04-sit*.4*(1-hold)-hold*.15,0,s*(.12+.04*Math.sin(t*.9+ph+i)+angry*.05));arm.upper.quaternion.setFromEuler(_eu);arm.fore.rotation.set(hold?-1.75+Math.sin(t*.7+ph)*.04:-.28-lift*1.1-angry*.2-sit*.5,0,0);
    const spec=g.arms?.[i];let shape=SHAPES[talk>.2&&dom===1?'open':'relaxed'],wrist=[0,0,0];
    if(spec&&k>0){
      effector(arm,_fk);
      if(spec.c)rig.chest.localToWorld(_tg.set(...spec.c));else _tg.copy((spec.h||spec.w)());
      _tg.lerpVectors(_fk,_tg,ease);_tg.y+=Math.sin(PI*clamp(k,0,1))*.12*rig.root.scale.y*(1-ease);
      rig.chest.localToWorld(_pl.set(...(spec.pole||[s*1.4,rig.plan.shoulderY-1,-.7])));
      solveLimb(arm,_tg,_pl);shape=SHAPES[spec.shape||'relaxed'].map((v,j)=>lerp(shape[j],v,ease));wrist=(spec.wrist||[0,0,0]).map(v=>v*ease);
    }
    if(walk){arm.upper.rotateX(Math.sin(step+i*PI)*.45*walk);}
    arm.hand.rotation.set(wrist[0],wrist[1],wrist[2]);
    arm.fingers.forEach((f,j)=>f.rotation.set(0,0,-s*shape[0]*(1+j*.08)));arm.index.rotation.set(0,0,-s*shape[1]);arm.thumb.rotation.set(0,0,-s*shape[2]);
  });
  // Legs: planted feet, knees bend when the hips drop.
  rig.legs.forEach((leg,i)=>{const foot=rig.feet[i];foot.updateWorldMatrix(true,false);const ft=foot.getWorldPosition(_tg);rig.hips.updateWorldMatrix(true,false);rig.root.localToWorld(_pl.set(leg.s*.1,rig.plan.leg*.6,2));solveLimb(leg,ft,_pl);});
  if(rig.tail)rig.tail.rotation.set(-.5+Math.sin(t*2.2+ph)*.12,Math.sin(t*1.6+ph)*.35,0);
  if(rig.glow)rig.glow.emissiveIntensity=1.05+Math.sin(t*3+ph)*.15;
  return {press:(g.press||0)*k};
}
export function metrics(rig){
  const p=rig.plan,b=rig.kind==='bot'?1:rig.member.look.build,hs=rig.member.look.head,half=rig.kind==='bot'?.68:rig.kind==='mascot'?.78:rig.kind==='robot'?.5:.56;
  // hw: head half-width and ht: head top, in chest space, so raised hands always clear the head.
  return {sx:p.shoulderX*b,sy:p.shoulderY,reach:p.upper+p.fore+p.hand,hw:half*hs,ht:p.neckY+p.headY+(p.headC+(rig.kind==='bot'?.47:rig.kind==='mascot'?.66:.55))*hs};
}
// Rest head centre in world space (for cameras and look-at), independent of animation.
export function headWorld(rig,out=V()){rig.root.updateWorldMatrix(true,true);const p=rig.plan;return rig.root.localToWorld(out.set(0,p.leg+p.chestY+p.neckY+p.headY+p.headC*rig.member.look.head,0));}
export function disposeCharacter(rig){rig.root.traverse(o=>{o.geometry?.dispose();if(o.material){for(const mm of (Array.isArray(o.material)?o.material:[o.material])){mm.map?.dispose();mm.dispose();}}});rig.face?.tex.texture.dispose();}
