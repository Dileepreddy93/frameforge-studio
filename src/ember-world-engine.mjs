// Ember Take Studio original world engine @ 22c745ffdc2d6411707f3a9bbe5bd70b10f9d9db, MIT.
// Preserved foliage, deterministic particles and lighting; imported only through P4 adapter.
// Worlds beyond the desk. Each builder returns a group plus the hooks the film scene needs: a screen surface for
// monitor/sign events, a press target, ground height, lights, sky/environment, and animate(t) for ambient motion.
// Everything animates as a pure function of t, so preview and final render match frame for frame.
import * as THREE from '../vendor/three@0.180.0/three.module.min.js';
import {Sky} from './vendor-sky.mjs';
import {GroundedSkybox} from './vendor-groundedskybox.mjs';

const PI=Math.PI,V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
function rng(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function canvasTex(w,h,draw,repeat=1){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;if(repeat>1){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeat,repeat);}t.anisotropy=8;return t;}
const noise=(x,z)=>Math.sin(x*.9+Math.sin(z*.37)*2)*.5+Math.sin(z*.73+x*.21)*.35+Math.sin((x+z)*1.7)*.15;

export const FOREST_TIMES={
  morning:{elev:24,azim:-35,sun:'#fff1d9',sunI:3.1,sky:'#cfe6ff',ground:'#56663a',hemiI:1.35,fill:'#dbe8ff',fillI:.7,fog:'#bfd2cf',fogD:.02,exposure:.95,turbidity:5,rayleigh:1.1,env:.75,shafts:.32,fireflies:0,leaf:['#6f9a45','#9cb84e','#c9a03f']},
  golden:{elev:5,azim:-28,sun:'#ffad5e',sunI:4.3,sky:'#ffd2a3',ground:'#4a3a24',hemiI:1.05,fill:'#8fb2ff',fillI:.75,fog:'#d79a63',fogD:.024,exposure:1.0,turbidity:9,rayleigh:2.8,env:.6,shafts:.55,fireflies:.45,leaf:['#d9822b','#e3a73a','#b8532a']},
  night:{elev:-4,azim:30,sun:'#a8bfff',sunI:1.1,sky:'#2f3b66',ground:'#0f140c',hemiI:.5,fill:'#6d84c9',fillI:.3,fog:'#0d1525',fogD:.034,exposure:1.25,turbidity:2,rayleigh:.4,env:.22,shafts:0,fireflies:1,campfire:true,leaf:['#4d6a3a','#6a5a2a','#3a4a2a']}
};

// Nature presets: the same builder makes forests, meadows and snowy woods from density/wind/particle settings.
export const PARTICLES=['leaves','fireflies','dust','pollen','snow','rain'];
export const NATURE={
  forest:{trees:95,pine:.35,treeMin:9,grass:9000,flowers:160,rocks:16,mushrooms:14,ground:'grass',logs:true,defaults:t=>['leaves','dust',...(t==='morning'?[]:['fireflies'])]},
  meadow:{trees:26,pine:.15,treeMin:22,grass:15000,flowers:900,rocks:8,mushrooms:4,ground:'grass',logs:false,defaults:t=>t==='night'?['fireflies']:['pollen','dust']},
  snow:{trees:80,pine:.92,treeMin:9,grass:1600,flowers:0,rocks:14,mushrooms:0,ground:'snow',logs:true,defaults:()=>['snow'],tint:{morning:{fog:'#dfe7ee',sky:'#e6f0ff',ground:'#c9d3dc',fogD:.028},golden:{fog:'#e7c7b0',ground:'#c9b8a8'},night:{fog:'#1a2436',ground:'#3a4658'}}}
};
// Night defaults to a campfire in forest and snow; o.campfire=false removes it.
export function buildNature(renderer,o={}){
  const preset=NATURE[o.preset]||NATURE.forest,time=o.time||'golden',dens=o.foliage??1,wind=o.wind??1,parts=new Set(o.particles?.length?o.particles:preset.defaults(time)),snowy=preset.ground==='snow';
  const T={...(FOREST_TIMES[time]||FOREST_TIMES.golden),...(preset.tint?.[time]||{})},group=new THREE.Group(),r=rng(7),anim=[];
  const groundAt=(x,z)=>{const d=Math.hypot(x,z);if(d<8.5)return 0;const k=Math.min(1,(d-8.5)/14);return k*k*(1.4*noise(x*.08,z*.08)+.9)+Math.max(0,d-42)*.12;};

  // Sky: physical scattering sky dome (also baked into the environment map so characters pick up its colour).
  const sky=new Sky();sky.scale.setScalar(180);const sun=new THREE.Vector3().setFromSphericalCoords(1,(90-T.elev)*PI/180,(180+T.azim)*PI/180);
  Object.assign(sky.material.uniforms,{});sky.material.uniforms.turbidity.value=T.turbidity;sky.material.uniforms.rayleigh.value=T.rayleigh;sky.material.uniforms.mieCoefficient.value=.006;sky.material.uniforms.mieDirectionalG.value=.86;sky.material.uniforms.sunPosition.value.copy(sun);
  group.add(sky);let env=null;
  if(renderer?.isWebGLRenderer){const pm=new THREE.PMREMGenerator(renderer),sc=new THREE.Scene(),s2=new Sky();s2.scale.setScalar(10);s2.material.uniforms.turbidity.value=T.turbidity;s2.material.uniforms.rayleigh.value=T.rayleigh;s2.material.uniforms.sunPosition.value.copy(sun);sc.add(s2);env=pm.fromScene(sc,.03).texture;pm.dispose();}
  if(time==='night'){
    const sp=[],rs=rng(3);for(let i=0;i<900;i++){const th=rs()*PI*2,ph=Math.acos(rs()*.85+.12);sp.push(Math.sin(ph)*Math.cos(th)*85,Math.cos(ph)*85,Math.sin(ph)*Math.sin(th)*85);}
    const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));group.add(new THREE.Points(sg,new THREE.PointsMaterial({color:'#e8eeff',size:1.6,sizeAttenuation:false,transparent:true,opacity:.85,fog:false})));
    const moon=new THREE.Mesh(new THREE.SphereGeometry(3,32,16),new THREE.MeshBasicMaterial({color:'#f4f1e2',fog:false}));moon.position.copy(V(-.3,.5,-1).normalize().multiplyScalar(80));group.add(moon);
  }

  // Lights: low sun behind the cast for warm rim light, sky/ground bounce, a cool front fill.
  const hemi=new THREE.HemisphereLight(T.sky,T.ground,T.hemiI);group.add(hemi);
  const key=new THREE.DirectionalLight(T.sun,T.sunI);key.position.copy(sun.clone().setY(Math.max(.18,sun.y)).normalize().multiplyScalar(30));key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-13,right:13,top:13,bottom:-8,near:1,far:70});key.shadow.bias=-.0004;key.shadow.normalBias=.04;group.add(key);group.add(key.target);
  const fill=new THREE.DirectionalLight(T.fill,T.fillI);fill.position.set(2,4,10);group.add(fill);

  // Ground: rolling terrain, grass texture, a dirt clearing where the cast stands.
  const grassTex=snowy?canvasTex(512,512,(x,w,h)=>{x.fillStyle='#e9eef2';x.fillRect(0,0,w,h);const g=rng(13);for(let i=0;i<5000;i++){x.fillStyle=g()<.5?'#dde4ea':'#f7f9fb';x.fillRect(g()*w,g()*h,2+g()*5,2+g()*4);}},28):canvasTex(512,512,(x,w,h)=>{x.fillStyle=time==='golden'?'#5e6b2c':'#4c6b2f';x.fillRect(0,0,w,h);const g=rng(11);for(let i=0;i<9000;i++){const s=g();x.fillStyle=s<.33?'#3e5a26':s<.66?'#6a8a3a':'#58772f';if(time==='golden'&&s>.9)x.fillStyle='#8c8a3a';x.fillRect(g()*w,g()*h,1+g()*2,3+g()*6);}},28);
  const gGeo=new THREE.PlaneGeometry(220,220,200,200);gGeo.rotateX(-PI/2);const gp=gGeo.attributes.position;for(let i=0;i<gp.count;i++)gp.setY(i,groundAt(gp.getX(i),gp.getZ(i)));gGeo.computeVertexNormals();
  const ground=new THREE.Mesh(gGeo,new THREE.MeshStandardMaterial({map:grassTex,roughness:snowy?.7:.96,color:time==='night'?(snowy?'#7d8aa8':'#55705a'):'#ffffff'}));ground.receiveShadow=true;group.add(ground);
  const dirt=canvasTex(512,512,(x,w,h)=>{const gr=x.createRadialGradient(w/2,h/2,10,w/2,h/2,w/2);const c0=snowy?'214,222,230':'122,92,60',c1=snowy?'200,210,220':'110,84,54';gr.addColorStop(0,`rgba(${c0},1)`);gr.addColorStop(.6,`rgba(${c1},.9)`);gr.addColorStop(1,`rgba(${c1},0)`);x.fillStyle=gr;x.fillRect(0,0,w,h);const g=rng(5);for(let i=0;i<2500;i++){x.fillStyle=`rgba(${60+g()*60},${45+g()*40},${30+g()*25},${.25+g()*.3})`;const rr=g()*w*.45,a=g()*PI*2;x.beginPath();x.arc(w/2+Math.cos(a)*rr,h/2+Math.sin(a)*rr,1+g()*3,0,PI*2);x.fill();}});
  const clearing=new THREE.Mesh(new THREE.CircleGeometry(8,64),new THREE.MeshStandardMaterial({map:dirt,transparent:true,roughness:1,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));clearing.rotation.x=-PI/2;clearing.position.y=.01;clearing.receiveShadow=true;group.add(clearing);

  // Trees: instanced trunks, leafy canopy blobs and pine tiers, each swaying on its own phase.
  const trees=[];for(let i=0;i<Math.round(preset.trees*dens);i++){let x,z,d;do{const a=r()*PI*2;d=preset.treeMin+Math.pow(r(),.8)*(57-preset.treeMin);x=Math.sin(a)*d;z=-Math.cos(a)*d;}while(z>2&&Math.abs(x)<7&&d<20);trees.push({x,z,y:groundAt(x,z),pine:r()<preset.pine,h:3.5+r()*3.5,s:.8+r()*.6,phase:r()*PI*2});}
  if(preset.trees*dens>40)for(const [x,z] of [[-7.5,4.5],[8,3],[-9,-2],[9.5,-4]])trees.push({x,z,y:groundAt(x,z),pine:snowy,h:5,s:1.1,phase:r()*6});
  if(!trees.length)trees.push({x:-30,z:-40,y:groundAt(-30,-40),pine:true,h:4,s:1,phase:0});
  const bark=new THREE.MeshStandardMaterial({color:'#5b4331',roughness:1}),trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.7,1,1,10),bark,trees.length);trunks.castShadow=trunks.receiveShadow=true;
  const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=V(),pos=V();
  trees.forEach((t,i)=>{const th=t.pine?t.h*.45:t.h,rad=t.pine?.22*t.s:.28*t.s;m4.compose(V(t.x,t.y+th/2,t.z),q.identity(),V(rad,th,rad));trunks.setMatrixAt(i,m4);});group.add(trunks);
  const leafPalette=snowy?['#e8eef0','#d5dfe3','#f4f7f8']:time==='golden'?['#6f7f32','#7f8d36','#5d6e2c','#8a8a3a']:time==='night'?['#243a2a','#2b4430','#1f3324']:['#4f7a3a','#5f8f45','#3f6a32','#6e9b4c'];
  const blobs=[],cones=[];for(const t of trees){if(t.pine){for(let k=0;k<4;k++)cones.push({t,y:t.h*.45+k*1.05*t.s,r:(2.1-k*.42)*t.s,hgt:1.7*t.s});}else{const n=5+Math.floor(r()*3);for(let k=0;k<n;k++){const a=r()*PI*2,rr=r()*1.2*t.s;blobs.push({t,dx:Math.cos(a)*rr,dz:Math.sin(a)*rr,y:t.h+(r()*1.6-.2)*t.s,s:(1.2+r()*1.1)*t.s,c:leafPalette[Math.floor(r()*leafPalette.length)]});}}}
  const leafMat=new THREE.MeshStandardMaterial({roughness:.88}),canopy=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,3),leafMat,blobs.length);canopy.castShadow=canopy.receiveShadow=true;
  blobs.forEach((b,i)=>canopy.setColorAt(i,new THREE.Color(b.c)));
  const pines=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,12),new THREE.MeshStandardMaterial({color:snowy?(time==='night'?'#2c3e48':'#3e5d52'):time==='night'?'#18301f':'#2f5a3a',roughness:.9}),cones.length);pines.castShadow=pines.receiveShadow=true;
  const sway=t=>{blobs.forEach((b,i)=>{const s=b.t,k=b.y/8,ox=Math.sin(t*.9+s.phase)*.09*k*wind,oz=Math.cos(t*.7+s.phase)*.06*k*wind;m4.compose(pos.set(s.x+b.dx+ox,s.y+b.y,s.z+b.dz+oz),q.identity(),sc.set(b.s,b.s*.85,b.s));canopy.setMatrixAt(i,m4);});canopy.instanceMatrix.needsUpdate=true;
    cones.forEach((c,i)=>{const s=c.t,k=c.y/8,ox=Math.sin(t*.8+s.phase)*.07*k*wind;m4.compose(pos.set(s.x+ox,s.y+c.y+c.hgt/2,s.z),q.identity(),sc.set(c.r,c.hgt*1.25,c.r));pines.setMatrixAt(i,m4);});pines.instanceMatrix.needsUpdate=true;};
  sway(0);group.add(canopy,pines);anim.push(sway);

  // Grass: thousands of tapered blades bending in the wind (vertex shader, driven by the film time).
  const blade=new THREE.PlaneGeometry(.07,.55,1,4);blade.translate(0,.275,0);const bp=blade.attributes.position;for(let i=0;i<bp.count;i++){const y=bp.getY(i)/.55;bp.setX(i,bp.getX(i)*(1-y*.85));bp.setZ(i,y*y*.08);}blade.computeVertexNormals();
  const grassMat=new THREE.MeshStandardMaterial({side:THREE.DoubleSide,roughness:.75}),uTime={value:0},uWind={value:wind};
  grassMat.onBeforeCompile=sh=>{sh.uniforms.uTime=uTime;sh.uniforms.uWind=uWind;sh.vertexShader='uniform float uTime;uniform float uWind;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloat ph=instanceMatrix[3].x*.55+instanceMatrix[3].z*.35;float bend=transformed.y*transformed.y;transformed.x+=sin(uTime*1.9+ph)*bend*.32*uWind;transformed.z+=cos(uTime*1.3+ph)*bend*.18*uWind;');};
  const G=Math.max(1,Math.round(preset.grass*dens)),grass=new THREE.InstancedMesh(blade,grassMat,G),gc=snowy?['#cfc4a4','#b9ad8c','#ddd3b8']:time==='golden'?['#8a9a3a','#a3a24a','#6f8a34','#b8a454']:time==='night'?['#2e4a34','#3a5a3c','#25402c']:['#5f8f3a','#7aa848','#4e7d32','#8cb854'];
  for(let i=0;i<G;i++){let x,z,d;do{const a=r()*PI*2;d=3.2+Math.pow(r(),.6)*30;x=Math.sin(a)*d;z=Math.cos(a)*d;}while(d<6&&r()<.75);const s=.6+r()*.9;m4.compose(V(x,groundAt(x,z),z),q.setFromAxisAngle(V(0,1,0),r()*PI*2),V(s,s*(.7+r()*.7),s));grass.setMatrixAt(i,m4);grass.setColorAt(i,new THREE.Color(gc[i%gc.length]));}
  grass.receiveShadow=true;group.add(grass);anim.push(t=>{uTime.value=t;});

  // Rocks, mushrooms, flowers and fallen logs dress the clearing's edge.
  const NR=preset.rocks,rocks=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.5,1),new THREE.MeshStandardMaterial({color:snowy?'#9aa3ab':'#7a7c74',roughness:.95}),NR);rocks.castShadow=rocks.receiveShadow=true;
  for(let i=0;i<NR;i++){const a=r()*PI*2,d=6+r()*6,x=Math.sin(a)*d,z=Math.cos(a)*d*.8-1;m4.compose(V(x,groundAt(x,z)+.1,z),q.setFromEuler(new THREE.Euler(r(),r()*3,r())),V(.5+r()*.9,.35+r()*.5,.5+r()*.8));rocks.setMatrixAt(i,m4);}group.add(rocks);
  const stems=new THREE.InstancedMesh(new THREE.CylinderGeometry(.05,.07,.3,8),new THREE.MeshStandardMaterial({color:'#efe6d2',roughness:.8}),Math.max(1,preset.mushrooms)),caps=new THREE.InstancedMesh(new THREE.SphereGeometry(.16,16,10,0,PI*2,0,PI/2),new THREE.MeshStandardMaterial({color:'#c2412f',roughness:.55}),Math.max(1,preset.mushrooms));
  for(let i=0;i<preset.mushrooms;i++){const t=trees[i*3%trees.length],x=t.x+.8,z=t.z+.6,y=groundAt(x,z),s=.7+r()*.8;m4.compose(V(x,y+.15*s,z),q.identity(),V(s,s,s));stems.setMatrixAt(i,m4);m4.compose(V(x,y+.3*s,z),q.identity(),V(s,s*.8,s));caps.setMatrixAt(i,m4);}group.add(stems,caps);
  const flowers=new THREE.InstancedMesh(new THREE.SphereGeometry(.05,8,6),new THREE.MeshStandardMaterial({roughness:.6,emissiveIntensity:.0}),Math.max(1,preset.flowers)),fc=['#fff6e6','#ffd45a','#ff9ac2','#b9a2ff'];
  for(let i=0;i<preset.flowers;i++){const a=r()*PI*2,d=4.5+r()*(preset.flowers>300?24:9),x=Math.sin(a)*d,z=Math.cos(a)*d;m4.compose(V(x,groundAt(x,z)+.22+r()*.12,z),q.identity(),V(1,1,1));flowers.setMatrixAt(i,m4);flowers.setColorAt(i,new THREE.Color(fc[i%4]));}group.add(flowers);
  if(preset.logs)for(const [x,z,ry] of [[-4.6,-1.2,.4],[4.9,-2.2,-.6]]){const log=new THREE.Mesh(new THREE.CylinderGeometry(.32,.36,3,14),bark);log.rotation.set(0,ry,PI/2);log.position.set(x,.3,z);log.castShadow=log.receiveShadow=true;group.add(log);}

  // Wooden sign for screen events, with a hanging lantern.
  const screenCanvas=document.createElement('canvas');screenCanvas.width=1600;screenCanvas.height=900;const screenTexture=new THREE.CanvasTexture(screenCanvas);screenTexture.colorSpace=THREE.SRGBColorSpace;screenTexture.anisotropy=8;
  // The on-set sign is a whole prop: posts, opaque backing, mapped face and light.
  // Expose deterministic per-frame visibility for the Hybrid director; legacy
  // Ember callers continue to see the same sign by default.
  const signPresent=o.sign!==false;
  const sign=new THREE.Group();sign.name='ember-nature-story-screen';
  sign.position.set(-.3,0,-3.6);if(signPresent)group.add(sign);
  const setScreenVisible=visible=>{
    if(typeof visible!=='boolean')throw TypeError('Scenic screen visibility must be boolean');
    if(!signPresent)return null;
    sign.visible=visible;
    return sign.visible;
  };
  const getScreenVisible=()=>signPresent?sign.visible:null;
  for(const x of [-2.05,2.05]){const post=new THREE.Mesh(new THREE.BoxGeometry(.2,4.6,.2),bark);post.position.set(x,2.3,-.05);post.castShadow=true;sign.add(post);}
  const board=new THREE.Mesh(new THREE.BoxGeometry(4.3,2.42,.12),new THREE.MeshStandardMaterial({color:'#4a3322',roughness:.9}));board.position.y=3.2;board.castShadow=true;sign.add(board);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(4.15,2.33),new THREE.MeshStandardMaterial({map:screenTexture,roughness:.85}));face.position.set(0,3.2,.065);sign.add(face);
  const lantern=new THREE.Mesh(new THREE.SphereGeometry(.12,16,12),new THREE.MeshStandardMaterial({color:'#ffd28a',emissive:'#ffb050',emissiveIntensity:time==='night'?3:1.2}));lantern.position.set(2.05,4.15,.25);sign.add(lantern);
  const screenLight=new THREE.PointLight('#ffc47a',time==='night'?14:5,9,2);screenLight.position.set(2.05,4.0,.6);sign.add(screenLight);

  // The press target: a big glowing mushroom by the cast.
  const keyGroup=new THREE.Group();keyGroup.position.set(2.5,0,1.9);group.add(keyGroup);
  const kStem=new THREE.Mesh(new THREE.CylinderGeometry(.16,.22,.5,16),new THREE.MeshStandardMaterial({color:'#f2ead6',roughness:.7}));kStem.position.y=.25;kStem.castShadow=true;keyGroup.add(kStem);
  const kCap=new THREE.Mesh(new THREE.SphereGeometry(.55,32,16,0,PI*2,0,PI/2),new THREE.MeshStandardMaterial({color:'#ff6a4a',roughness:.45,emissive:'#ff4a2a',emissiveIntensity:time==='night'?.9:.25}));kCap.position.y=.48;kCap.scale.y=.75;kCap.castShadow=true;keyGroup.add(kCap);

  // Atmosphere: sunbeams with dust, falling leaves, fireflies; a campfire at night.
  const beamTex=canvasTex(64,512,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(255,240,210,0)');g.addColorStop(.35,'rgba(255,236,200,.55)');g.addColorStop(1,'rgba(255,236,200,0)');x.fillStyle=g;x.fillRect(0,0,w,h);const g2=x.createLinearGradient(0,0,w,0);g2.addColorStop(0,'rgba(0,0,0,1)');g2.addColorStop(.5,'rgba(0,0,0,0)');g2.addColorStop(1,'rgba(0,0,0,1)');x.globalCompositeOperation='destination-out';x.fillStyle=g2;x.fillRect(0,0,w,h);});
  if(T.shafts){const beams=[];for(let i=0;i<7;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(1.6+r()*2.2,30),new THREE.MeshBasicMaterial({map:beamTex,color:T.sun,transparent:true,opacity:T.shafts,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));m.position.set(-12+i*4+r()*2,9,-9-r()*12);m.lookAt(m.position.clone().add(sun.clone().multiplyScalar(-1)));m.rotateX(PI/2);m.userData.p=r()*6;beams.push(m);group.add(m);}
    anim.push(t=>beams.forEach(b=>b.material.opacity=T.shafts*(.65+.35*Math.sin(t*.35+b.userData.p))));}
  const glowTex=canvasTex(64,64,(x,w,h)=>{const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.3,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,h);});
  const motes=(n,color,size,path)=>{const g=new THREE.BufferGeometry(),p=new Float32Array(n*3),c=new Float32Array(n*3);g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(c,3));
    const pts=new THREE.Points(g,new THREE.PointsMaterial({map:glowTex,size,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));const base=new THREE.Color(color),seeds=[...Array(n)].map(()=>[r(),r(),r(),r()]);
    const step=t=>{for(let i=0;i<n;i++){const [a,b,cc,d]=seeds[i],[x,y,z,br]=path(t,a,b,cc,d);p[i*3]=x;p[i*3+1]=y;p[i*3+2]=z;c[i*3]=base.r*br;c[i*3+1]=base.g*br;c[i*3+2]=base.b*br;}g.attributes.position.needsUpdate=g.attributes.color.needsUpdate=true;};step(0);group.add(pts);anim.push(step);};
  if(T.shafts&&parts.has('dust'))motes(260,'#ffe2b0',.07,(t,a,b,c,d)=>[-9+a*18+Math.sin(t*.2+d*6)*.6,.5+b*7+Math.sin(t*.3+a*5)*.4,-2-c*10,.35+.35*Math.sin(t*.8+d*9)]);
  if(parts.has('fireflies'))motes(Math.round(160*Math.max(.35,T.fireflies)),'#d8ff7a',.22,(t,a,b,c,d)=>{const ang=a*PI*2+t*(.08+b*.12),rad=3+c*11;return [Math.sin(ang)*rad+Math.sin(t*.7+d*9)*.5,.4+b*3+Math.sin(t*.9+a*7)*.35,Math.cos(ang)*rad*.7-2,Math.max(0,Math.sin(t*(1.2+d)+a*20))**3*1.6];});
  const leafTex=canvasTex(64,64,(x)=>{x.fillStyle='#fff';x.beginPath();x.moveTo(32,4);x.quadraticCurveTo(62,30,32,60);x.quadraticCurveTo(2,30,32,4);x.fill();});
  const L=70,leaves=new THREE.InstancedMesh(new THREE.PlaneGeometry(.2,.2),new THREE.MeshStandardMaterial({map:leafTex,alphaTest:.5,side:THREE.DoubleSide,roughness:.8}),L),ls=[...Array(L)].map(()=>[r()*18-9,-1.5-r()*10,r(),r()]);
  ls.forEach((_,i)=>leaves.setColorAt(i,new THREE.Color(T.leaf[i%3])));if(parts.has('leaves'))group.add(leaves);
  const fall=t=>{ls.forEach(([x0,z0,o,s],i)=>{const y=9-((t*(.45+s*.3)+o*9.5)%9.5),x=x0+Math.sin(t*.8+o*12)*1.1*wind,z=z0+Math.cos(t*.6+o*9)*.8;m4.compose(pos.set(x,y,z),q.setFromEuler(new THREE.Euler(t*1.7+o*6,t*1.1+s*4,t*.9)),sc.set(1,1,1));leaves.setMatrixAt(i,m4);});leaves.instanceMatrix.needsUpdate=true;};fall(0);anim.push(fall);
  if(parts.has('pollen'))motes(220,'#fff2a8',.09,(t,a,b,c,d)=>[-12+a*24+Math.sin(t*.25*wind+d*6)*1.2,.3+b*3.5+Math.sin(t*.4+a*5)*.3,-8+c*14,.4+.3*Math.sin(t*.9+d*9)]);
  if(parts.has('snow'))motes(1400,'#ffffff',.08,(t,a,b,c,d)=>{const u=(t*(.08+b*.06)+a)%1;return [-14+c*28+Math.sin(t*.7*wind+d*9)*.6,11-u*11.5,-14+d*20+Math.cos(t*.5+a*7)*.4,.75];});
  if(parts.has('rain')){const n=1500,rg=new THREE.BufferGeometry(),rp=new Float32Array(n*6);rg.setAttribute('position',new THREE.BufferAttribute(rp,3));const seeds=[...Array(n)].map(()=>[r(),r(),r()]);
    const rain=new THREE.LineSegments(rg,new THREE.LineBasicMaterial({color:'#c8d6e6',transparent:true,opacity:.45,depthWrite:false}));group.add(rain);
    const fallRain=t=>{for(let i=0;i<n;i++){const [a,b,c]=seeds[i],y=12-((t*(9+b*4)+a*12)%12.5),x=-12+c*24,z=-12+b*18;rp.set([x,y,z,x-.05*wind,y-.45,z],i*6);}rg.attributes.position.needsUpdate=true;};fallRain(0);anim.push(fallRain);}
  if(T.campfire&&o.preset!=='meadow'&&o.campfire!==false){
    const fire=new THREE.Group();fire.position.set(-3.3,0,1.6);group.add(fire);
    for(let i=0;i<4;i++){const lg=new THREE.Mesh(new THREE.CylinderGeometry(.08,.09,1,8),bark);lg.rotation.set(PI/2-.35,i*PI/2,0);lg.position.y=.15;fire.add(lg);}
    const flames=[...Array(5)].map((_,i)=>{const f=new THREE.Mesh(new THREE.ConeGeometry(.18-i*.02,.7,12,1,true),new THREE.MeshBasicMaterial({color:i<2?'#ffd27a':'#ff7a2a',transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false}));f.position.y=.45;fire.add(f);return f;});
    const fl=new THREE.PointLight('#ff9a4a',26,12,2);fl.position.set(0,.8,0);fl.castShadow=false;fire.add(fl);
    motes(40,'#ffb060',.08,(t,a,b,c,d)=>{const u=(t*(.5+b*.5)+a)%1;return [-3.3+Math.sin(t*2+d*9)*.15*u,.4+u*2.2,1.6+Math.cos(t*1.7+c*9)*.15*u,(1-u)*1.4];});
    anim.push(t=>{const f=1+Math.sin(t*13)*.12+Math.sin(t*7.3)*.1+Math.sin(t*23)*.06;fl.intensity=26*f;flames.forEach((m,i)=>{m.scale.set(1+Math.sin(t*9+i)*.12,f*(1.1-i*.12)+Math.sin(t*11+i*2)*.1,1);m.rotation.y=t*(1+i*.3);});});
  }

  return {group,key,screenLight,setScreenVisible,getScreenVisible,
    screen:{canvas:screenCanvas,ctx:screenCanvas.getContext('2d'),texture:screenTexture,style:'sign'},renderKey:kCap,renderKeyLabel:kStem,keyRest:[.48,.25],
    screenPoint:V(-.3,3.2,-3.5),keyPoint:V(2.5,.55,1.9),screenPose:{pos:V(-.1,3.3,3.4),at:V(-.3,3.2,-3.6),fov:40,ap:.0016},groundY:0,
    background:null,fog:new THREE.FogExp2(T.fog,T.fogD),environment:env,environmentIntensity:T.env,exposure:T.exposure,
    animate:t=>{for(const a of anim)a(t);},dispose:()=>{env?.dispose();group.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of [].concat(o.material)){m.map?.dispose();m.dispose();}});}};
}

// Custom worlds from the library: a 360° background (equirectangular JPG/PNG or HDR, projected onto a ground dome
// so characters stand on it) and/or an imported 3D scene (scaled, turned, its animations played on the film clock).
// Returns at once; `ready` resolves when the assets are in. `onGround` reports the detected floor height.
export function buildCustomWorld(renderer,o,assets,{loadGLTF,loadImage,loadHDR},onGround){
  const T=FOREST_TIMES[o.time]||FOREST_TIMES.golden,group=new THREE.Group(),anim=[],world={group};
  const sun=new THREE.Vector3().setFromSphericalCoords(1,(90-Math.max(8,T.elev))*PI/180,(180+T.azim)*PI/180);
  const hemi=new THREE.HemisphereLight(T.sky,T.ground,T.hemiI*.8);group.add(hemi);
  const key=new THREE.DirectionalLight(T.sun,T.sunI*.8);key.position.copy(sun.multiplyScalar(30));key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-13,right:13,top:13,bottom:-8,near:1,far:80});key.shadow.bias=-.0004;key.shadow.normalBias=.04;group.add(key,key.target);
  const fill=new THREE.DirectionalLight(T.fill,T.fillI);fill.position.set(2,4,10);group.add(fill);
  const catcher=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.ShadowMaterial({opacity:.38}));catcher.rotation.x=-PI/2;catcher.receiveShadow=true;group.add(catcher);
  const screenCanvas=document.createElement('canvas');screenCanvas.width=1600;screenCanvas.height=900;const screenTexture=new THREE.CanvasTexture(screenCanvas);screenTexture.colorSpace=THREE.SRGBColorSpace;
  const screenLight=new THREE.PointLight('#ffc47a',0,1);group.add(screenLight);
  if(o.sign){const board=new THREE.Mesh(new THREE.BoxGeometry(4.3,2.42,.12),new THREE.MeshStandardMaterial({color:'#4a3322',roughness:.9}));board.position.set(-.3,3.2,-3.6);group.add(board);const face=new THREE.Mesh(new THREE.PlaneGeometry(4.15,2.33),new THREE.MeshStandardMaterial({map:screenTexture,roughness:.85}));face.position.set(-.3,3.2,-3.535);group.add(face);
    for(const x of [-2.35,1.75]){const post=new THREE.Mesh(new THREE.BoxGeometry(.2,4.6,.2),new THREE.MeshStandardMaterial({color:'#5b4331',roughness:1}));post.position.set(x,2.3,-3.65);group.add(post);}}
  const press=new THREE.Group(),dummy=new THREE.Group();press.add(dummy);group.add(press);
  Object.assign(world,{key,screenLight,screen:{canvas:screenCanvas,ctx:screenCanvas.getContext('2d'),texture:screenTexture,style:'sign'},renderKey:dummy,renderKeyLabel:dummy,keyRest:[0,0],
    screenPoint:V(-.3,3.2,-3.5),keyPoint:V(2.5,.6,1.9),screenPose:{pos:V(-.1,3.3,3.4),at:V(-.3,3.2,-3.6),fov:40,ap:.0016},groundY:0,
    background:new THREE.Color(T.fog),fog:null,environment:null,environmentIntensity:1,exposure:T.exposure*.95,animate:t=>{for(const a of anim)a(t);},
    dispose:()=>{world.environment?.dispose();group.traverse(x=>{x.geometry?.dispose();if(x.material)for(const m of [].concat(x.material)){for(const k of ['map','normalMap','roughnessMap','metalnessMap','emissiveMap','aoMap'])m[k]?.dispose();m.dispose();}});world.backdropTexture?.dispose();}});
  const jobs=[];
  if(assets.backdrop)jobs.push((assets.backdrop.file.endsWith('.hdr')?loadHDR(assets.backdrop.buf):loadImage(assets.backdrop.buf)).then(tex=>{
    tex.mapping=THREE.EquirectangularReflectionMapping;world.backdropTexture=tex;
    if(renderer?.isWebGLRenderer){const pm=new THREE.PMREMGenerator(renderer);world.environment=pm.fromEquirectangular(tex).texture;pm.dispose();}
    const h=o.panoHeight||4,dome=new GroundedSkybox(tex,h,90);dome.position.y=h-.01;dome.rotation.y=(o.turn||0)*PI/180;group.add(dome);world.background=null;world.environmentIntensity=.9;
    world.onEnvironment?.();}));
  if(assets.scene)jobs.push(loadGLTF(assets.scene.buf).then(gltf=>{
    const root=gltf.scene;root.scale.setScalar(o.scale||2);root.rotation.y=(o.turn||0)*PI/180;root.updateMatrixWorld(true);
    // Scenes authored in centimetres (or kilometres) are refitted to a 40-unit stage so they never swallow the cast.
    {const size=new THREE.Box3().setFromObject(root).getSize(V()),big=Math.max(size.x,size.z);if(big>300||big<4){root.scale.multiplyScalar(40/Math.max(big,1e-3));world.autoScaled=true;}}
    root.position.set(o.offsetX||0,o.offsetY||0,o.offsetZ||0);root.traverse(m=>{if(m.isMesh){m.castShadow=m.receiveShadow=true;}});group.add(root);catcher.visible=!assets.backdrop;
    if(gltf.animations?.length){const mixer=new THREE.AnimationMixer(root);for(const clip of gltf.animations)mixer.clipAction(clip).play();anim.push(t=>mixer.setTime(t));}
    // Floor: cast a ray down near the stage centre; characters stand on the first surface found.
    root.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(root),ray=new THREE.Raycaster(V(0,box.max.y+5,.4),V(0,-1,0));const hit=ray.intersectObject(root,true)[0];
    world.groundY=hit?hit.point.y:box.min.y;catcher.position.y=world.groundY+.005;onGround?.(world.groundY);}));
  world.ready=Promise.all(jobs);return world;
}

// Desk room surroundings, all from settings: the window's view (city, mountains, ocean, forest, space or a plain wall),
// sky colours, string lights and their colour, and particles inside the room (motes, dust, fireflies, pollen) or
// outside the glass (snow, rain, leaves). Palettes by time of day also drive the desk lighting.
export const DESK_TIMES={
  night:{keys:'#4d5160',sky:['#040817','#0c1840','#1f3370'],city:'#080e24',cityFar:'#121d44',lit:.5,win:'#ffc985',frame:'#0a0f24',desk:'#8a7c8c',land:['#0b1230','#141f45','#1d2b5a'],sea:'#0a1433',orb:'moon',hemi:['#4c66b8','#1d140f',.95],key:['#ffb06a',3.6],rim:['#7d98ff',2.4],rim2:['#ff9a5a',1.4],fill:['#5b74c9',.55],lamp:46,screen:22,bg:'#070d24',fog:['#0b1434',.011],exposure:1.08,bulbs:1,stars:1,motes:1,wall:'#151a33'},
  golden:{keys:'#9a8f84',sky:['#33325f','#b8667e','#ffae66'],city:'#38263a',cityFar:'#7c5466',lit:.16,win:'#ffd9a0',frame:'#2b1d1d',desk:'#ffffff',land:['#4a2f45','#7a4a5a','#b06a68'],sea:'#6a4a6a',orb:'sun',hemi:['#ffcfa6','#6a4630',1.7],key:['#ffcb8a',4.3],rim:['#ff914d',3.4],rim2:['#ffb070',1.6],fill:['#82bbd4',1.2],lamp:26,screen:16,bg:'#2a1d2a',fog:['#3a2833',.012],exposure:1.1,bulbs:.75,stars:0,motes:.8,wall:'#5a3b36'},
  morning:{keys:'#b9b3a1',sky:['#7fb0e6','#b8d4f0','#eef2f2'],city:'#7a8ca6',cityFar:'#a8b8cc',lit:0,win:'#ffffff',frame:'#e6e2da',desk:'#f4eee8',land:['#5f7f6a','#87a38f','#b4c8c4'],sea:'#5d8fb8',orb:null,hemi:['#dcebff','#8a6a50',2.3],key:['#fff1dc',4.6],rim:['#ffe2b8',1.8],rim2:['#ffffff',.8],fill:['#a8c8e8',1.4],lamp:8,screen:14,bg:'#bccfe2',fog:['#c6d5e3',.009],exposure:1.04,bulbs:0,stars:0,motes:.6,wall:'#d8d0c4'}
};
// Default particles per time when the world does not choose its own.
export const deskParticles=time=>time==='morning'?['dust']:['motes'];
// Generated textures are cached by their settings: rebuilding the room for a prop or light change reuses the sky and
// view layers instead of redrawing and re-uploading them. Cached textures are never disposed with a world.
const TEX=new Map();
function memo(key,make){let v=TEX.get(key);if(v){TEX.delete(key);TEX.set(key,v);return v;}v=make();for(const t of [].concat(v))if(t)t.userData.cached=true;TEX.set(key,v);
  if(TEX.size>24){const [k,old]=TEX.entries().next().value;TEX.delete(k);for(const t of [].concat(old))t?.dispose();}return v;}
// Paints sharp, then blurs once (a blur filter on every small shape is far slower).
function softTex(cw,ch,soft,paint){return canvasTex(cw,ch,x=>{const c=document.createElement('canvas');c.width=cw;c.height=ch;paint(c.getContext('2d'));x.filter=soft?`blur(${soft}px)`:'none';x.drawImage(c,0,0);});}
export function deskAtmosphere(time,w={}){
  const T={...(DESK_TIMES[time]||DESK_TIMES.golden)};if(w.sky)T.sky=w.sky;if(w.glow)T.win=w.glow;
  if(w.view==='space')Object.assign(T,{sky:w.sky||['#010208','#050a1c','#0b1230'],stars:1,lit:T.lit});
  const view=w.view||'city',parts=new Set(w.particles??deskParticles(time)),group=new THREE.Group(),r=rng(19),anim=[],basic=o=>new THREE.MeshBasicMaterial({fog:false,depthWrite:false,transparent:true,...o});
  const hdr=(hex,k)=>new THREE.Color(hex).multiplyScalar(k),winRGB=hdr(T.win,2.4);
  const glowTex=memo('glow',()=>canvasTex(64,64,(x)=>{const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.3,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);}));
  // Lens-bokeh disc: flat body with a soft, slightly brighter rim, so distant lights read as out of focus at any aperture.
  const discTex=memo('disc',()=>canvasTex(64,64,(x)=>{const g=x.createRadialGradient(32,32,0,32,32,31);g.addColorStop(0,'rgba(255,255,255,.55)');g.addColorStop(.8,'rgba(255,255,255,.7)');g.addColorStop(.92,'rgba(255,255,255,.4)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);}));
  // The planet's sun is present in every view (dark unless space) so the light count, and with it every shader, stays the same.
  const sun=new THREE.DirectionalLight('#fff0dc',0);sun.position.set(-40,10,-20);group.add(sun,sun.target);
  const outside=view!=='none';
  if(outside){
    // Sky: gradient, stars, and a low sun or moon (or a ringed planet from space).
    const sky=new THREE.Mesh(new THREE.PlaneGeometry(320,140),basic({transparent:false,map:memo('sky|'+view+'|'+T.sky+'|'+T.stars+'|'+T.orb,()=>canvasTex(512,512,(x,cw,ch)=>{const g=x.createLinearGradient(0,0,0,ch);g.addColorStop(0,T.sky[0]);g.addColorStop(.55,T.sky[1]);g.addColorStop(1,T.sky[2]);x.fillStyle=g;x.fillRect(0,0,cw,ch);
      if(T.stars){const s=rng(4);for(let i=0;i<(view==='space'?900:260);i++){x.fillStyle=`rgba(230,236,255,${.25+s()*.6})`;x.fillRect(s()*cw,s()*ch*(view==='space'?1:.6),s()<.1?2:1,s()<.1?2:1);}}
      if(view==='space'){for(const [cx,cy,rad,c] of [[150,180,140,'rgba(120,70,200,.18)'],[380,300,180,'rgba(40,120,200,.16)']]){const n=x.createRadialGradient(cx,cy,0,cx,cy,rad);n.addColorStop(0,c);n.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=n;x.fillRect(0,0,cw,ch);}}
      else if(T.orb){const [ox,oy,orr,c]=T.orb==='moon'?[330,120,14,'#f3efe0']:[300,400,30,'#ffe2b0'];const halo=x.createRadialGradient(ox,oy,orr*.5,ox,oy,orr*5);halo.addColorStop(0,T.orb==='moon'?'rgba(220,230,255,.35)':'rgba(255,220,160,.6)');halo.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=halo;x.fillRect(0,0,cw,ch);x.fillStyle=c;x.beginPath();x.arc(ox,oy,orr,0,Math.PI*2);x.fill();}}))}));
    sky.position.set(0,26,-110);group.add(sky);
    // Distance bands: silhouettes on a canvas, plus an additive HDR overlay for anything lit, softly pre-blurred so
    // lights read as bokeh even before depth of field.
    const band=(z,width,seed,soft,draw,lights)=>{const cw=2048,ch=512,H=width*ch/cw,y0=-8+H/2;
      // Keyed by the layer's settings (draw functions carry their own colours and amounts in `key`).
      const [tex,ltex]=memo(`band|${z}|${seed}|${soft}|${draw.key}|${lights?.key}`,()=>{const g=rng(seed),shapes=[];return [softTex(cw,ch,soft*.4,x=>draw(x,g,cw,ch,shapes)),lights?softTex(cw,ch,soft,x=>lights(x,g,shapes)):null];});
      const m=new THREE.Mesh(new THREE.PlaneGeometry(width,H),basic({map:tex}));m.position.set(0,y0,z);group.add(m);
      if(ltex){const l=new THREE.Mesh(new THREE.PlaneGeometry(width,H),basic({map:ltex,blending:THREE.AdditiveBlending}));l.material.color.copy(winRGB);l.position.set(0,y0,z+.05);group.add(l);}};
    const keyed=(f,...k)=>Object.assign(f,{key:k.join(',')});
    const city=(tall,color,lit)=>[keyed((x,g,cw,ch,blds)=>{let bx=0;while(bx<cw){const w=40+g()*120,h=ch*(.2+g()*.75)*tall;blds.push([bx,ch-h,w,h]);bx+=w+g()*14;}x.fillStyle=color;for(const [px,py,w,h] of blds){x.fillRect(px,py,w,h);if(g()<.3)x.fillRect(px+w*.4,py-18,4,18);}},'city',tall,color),
      lit?keyed((x,g,blds)=>{for(const [px,py,w,h] of blds){const cols=Math.floor(w/14),rows=Math.floor(h/16);for(let i=0;i<cols;i++)for(let j=0;j<rows;j++)if(g()<lit){const v=.55+g()*.45;x.fillStyle=g()<.12?`rgba(170,210,255,${v})`:`rgba(255,${200+Math.floor(g()*40)},${120+Math.floor(g()*60)},${v})`;x.fillRect(px+4+i*14,py+7+j*16,9,11);}}},'lit',lit):null];
    const ridge=(color,base,amp,rough,pines)=>keyed((x,g,cw,ch)=>{x.fillStyle=color;x.beginPath();x.moveTo(0,ch);let y=ch*base;const ph=g()*9;
      for(let px=0;px<=cw;px+=8){y=ch*(base-amp*(.55*Math.sin(px/cw*6+ph)+.3*Math.sin(px/cw*17+ph*2)+rough*.15*Math.sin(px/cw*71+ph*3)));x.lineTo(px,y);
        if(pines&&g()<.55){const h=18+g()*46;x.lineTo(px+4,y-h);x.lineTo(px+8,y);}}x.lineTo(cw,ch);x.closePath();x.fill();},'ridge',color,base,amp,rough,pines);
    const L=T.land;
    if(view==='city'){band(-95,240,31,2,...city(.45,T.cityFar,T.lit*.6));band(-70,150,23,3,...city(.65,T.cityFar,T.lit*.8));band(-48,110,17,4,...city(1,T.city,T.lit));}
    else if(view==='mountains'){band(-100,260,41,3,ridge(L[2],.25,.22,1));band(-75,170,42,2,ridge(L[1],.42,.16,1));band(-50,120,43,2,ridge(L[0],.62,.1,1,true));}
    else if(view==='forest'){band(-95,240,51,3,ridge(L[2],.5,.08,.5,true));band(-70,160,52,2,ridge(L[1],.6,.07,.5,true));band(-46,110,53,2,ridge(L[0],.72,.05,.5,true));}
    else if(view==='ocean'){
      // Sea: a band from the sill to the horizon with a shimmering path under the sun or moon.
      const sea=new THREE.Mesh(new THREE.PlaneGeometry(320,26),basic({transparent:false,map:canvasTex(256,256,(x,cw,ch)=>{const g=x.createLinearGradient(0,0,0,ch);g.addColorStop(0,T.sky[2]);g.addColorStop(.06,T.sea);g.addColorStop(1,'#050814');x.fillStyle=g;x.fillRect(0,0,cw,ch);})}));sea.position.set(0,-4,-90);group.add(sea);
      band(-80,200,61,3,ridge(L[1],.86,.05,.3));
      for(let i=0;i<60;i++){const s2=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:T.orb?hdr(T.orb==='moon'?'#dfe8ff':'#ffd59a',1.6):hdr('#ffffff',.8),transparent:true,depthWrite:false,fog:false,blending:THREE.AdditiveBlending}));const d=r();s2.position.set(-6+(r()-.5)*(2+d*14),8.4-d*12,-88+d*6);s2.scale.set(.5+r()*1.4,.12,1);s2.userData.p=r()*9;group.add(s2);anim.push(t=>s2.material.opacity=.15+.6*Math.max(0,Math.sin(t*1.6+s2.userData.p*4)));}
    }
    else if(view==='space'){
      const planet=new THREE.Mesh(new THREE.SphereGeometry(16,48,32),new THREE.MeshStandardMaterial({map:canvasTex(512,256,(x,cw,ch)=>{const g=rng(71);for(let i=0;i<ch;i+=4){x.fillStyle=`hsl(${18+g()*24},${45+g()*25}%,${30+g()*30}%)`;x.fillRect(0,i,cw,4+g()*6);}}),roughness:1,fog:false}));
      planet.position.set(22,-6,-80);group.add(planet);sun.intensity=2.4;sun.target=planet;
      const ring=new THREE.Mesh(new THREE.RingGeometry(20,29,96),new THREE.MeshBasicMaterial({color:'#c8a27a',transparent:true,opacity:.35,side:THREE.DoubleSide,fog:false,depthWrite:false}));ring.position.copy(planet.position);ring.rotation.set(1.25,.2,.3);group.add(ring);
      anim.push(t=>{planet.rotation.y=t*.02;});
    }
    // Distant lights (street lamps, cars, stars, boats): big soft discs between the window and the view.
    const lit=view==='city'?T.lit:view==='space'?.5:view==='mountains'||view==='forest'?T.lit*.3:0;
    for(let i=0;i<(lit?34:0);i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:discTex,color:new THREE.Color(r()<.7?T.win:r()<.5?'#ff6f6f':'#8fc6ff').multiplyScalar(1.4),transparent:true,depthWrite:false,fog:false,opacity:.55*(.5+r()*.5),blending:THREE.AdditiveBlending}));s.position.set(-30+r()*60,(view==='space'?0:-4)+r()*(view==='space'?20:9),-30-r()*14);s.scale.setScalar(.8+r()*2);s.userData.p=r()*6;group.add(s);anim.push(t=>s.material.opacity=.55*(.6+.4*Math.sin(t*.5+s.userData.p*3)));}
  }
  // Window wall: floor-to-ceiling glass with mullions, or (view=none) a plain wall with a soft pool of light.
  const frame=new THREE.MeshStandardMaterial({color:T.frame,roughness:.8}),bar=(w,h,x,y)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,.6),frame);b.position.set(x,y,-24);b.receiveShadow=true;group.add(b);};
  if(outside){for(const x of [-21,-7,7,21])bar(.55,34,x,16);for(const y of [-.2,13.5,30])bar(70,.6,0,y);bar(14,34,-35,16);bar(14,34,35,16);}
  else{const wall=new THREE.Mesh(new THREE.PlaneGeometry(90,40),new THREE.MeshStandardMaterial({color:T.wall,roughness:.95,map:canvasTex(256,256,(x,cw,ch)=>{const g=x.createRadialGradient(cw*.45,ch*.55,10,cw*.45,ch*.55,cw*.7);g.addColorStop(0,'#ffffff');g.addColorStop(1,'#8a8a8a');x.fillStyle=g;x.fillRect(0,0,cw,ch);})}));wall.position.set(0,18,-24);wall.receiveShadow=true;group.add(wall);}
  // String lights: two sagging strands that sway and twinkle; bulbs are HDR so they bloom.
  const bulbs=[],on=w.lights===false?0:Math.max(T.bulbs,view==='space'||view==='none'?.8:0),lc=w.lightColor||'#ffc070';
  if(w.lights!==false)for(const [z,y,half,n,sag] of [[-10,10.6,14,11,2.2],[-17,12.5,21,15,2.8]]){
    const strand=new THREE.Group(),pts=[];strand.position.set(0,y,z);group.add(strand);
    for(let i=0;i<=40;i++){const u=i/40*2-1;pts.push(V(u*half,-sag*(1-u*u),0));}
    strand.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),60,.03,5),new THREE.MeshBasicMaterial({color:'#1a1410'})));
    for(let i=0;i<n;i++){const u=(i+.5)/n*2-1,p=V(u*half,-sag*(1-u*u)-.22,0),c=new THREE.Color(lc).lerp(new THREE.Color('#ffffff'),i%4===3?.25:0);
      const bulb=new THREE.Mesh(new THREE.SphereGeometry(.17,12,8),new THREE.MeshBasicMaterial({color:c.clone().multiplyScalar(6*on+.15)}));bulb.position.copy(p);strand.add(bulb);
      const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:c,transparent:true,depthWrite:false,opacity:.55*on,blending:THREE.AdditiveBlending}));halo.position.copy(p);halo.scale.setScalar(2.2);strand.add(halo);bulbs.push({bulb,halo,c,ph:r()*6});}
    anim.push(t=>{strand.rotation.x=Math.sin(t*.45+z)*.025;strand.rotation.z=Math.sin(t*.31+z)*.006;});
  }
  if(on)anim.push(t=>{for(const b of bulbs){const k=.88+.12*Math.sin(t*1.7+b.ph*5)*Math.sin(t*.43+b.ph);b.bulb.material.color.copy(b.c).multiplyScalar(6*on*k);b.halo.material.opacity=.55*on*k;}});
  // Particles. Inside: drifting motes around the cast and near the lens. Outside the glass: snow, rain, leaves.
  const points=(n,color,size,place)=>{const g=new THREE.BufferGeometry(),p=new Float32Array(n*3),c=new Float32Array(n*3);g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(c,3));
    group.add(new THREE.Points(g,new THREE.PointsMaterial({map:glowTex,size,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));const base=new THREE.Color(color),seeds=[...Array(n)].map(()=>[r(),r(),r(),r()]);
    anim.push(t=>{for(let i=0;i<n;i++){const [x,y,z,br]=place(t,...seeds[i]);p[i*3]=x;p[i*3+1]=y;p[i*3+2]=z;c[i*3]=base.r*br;c[i*3+1]=base.g*br;c[i*3+2]=base.b*br;}g.attributes.position.needsUpdate=g.attributes.color.needsUpdate=true;});};
  const rise=(amp,speed=1,spread=1)=>(t,a,b,cc,d)=>{const u=(b+t*(.006+.012*cc)*speed)%1;return [-11*spread+a*22*spread+Math.sin(t*.17+d*9)*.9,.3+u*10,-9+d*16+Math.cos(t*.13+a*7)*.6,amp*Math.sin(Math.PI*u)*(.6+.4*Math.sin(t*.9+d*20))];};
  const A=T.motes||.6;
  if(parts.has('motes')){points(150,'#ffdcaa',.09,rise(A));points(26,'#ff5a5a',.13,rise(A*.9));points(18,'#a8dcff',.11,rise(A*.7));}
  if(parts.has('dust'))points(220,'#fff1d6',.05,rise(.7,.5,.8));
  if(parts.has('pollen'))points(140,'#fff2a8',.08,rise(.8,1.4));
  if(parts.has('fireflies'))points(60,'#d8ff7a',.16,(t,a,b,cc,d)=>{const ang=a*PI*2+t*(.08+b*.1);return [Math.sin(ang)*(3+cc*8),1+b*6+Math.sin(t*.9+a*7)*.4,Math.cos(ang)*(2+cc*5)-3,Math.max(0,Math.sin(t*(1.2+d)+a*20))**3*1.6];});
  const out=(n,color,size,speed,drift)=>points(n,color,size,(t,a,b,cc,d)=>{const u=(t*speed*(.7+b*.6)+a)%1;return [-28+cc*56+Math.sin(t*.7+d*9)*drift,22-u*26,-26-d*16,.8];});
  if(parts.has('snow'))out(900,'#ffffff',.16,.05,.8);
  if(parts.has('leaves'))out(160,'#e39a3a',.24,.04,2);
  if(parts.has('rain')){const n=1400,rg=new THREE.BufferGeometry(),rp=new Float32Array(n*6),seeds=[...Array(n)].map(()=>[r(),r(),r()]);rg.setAttribute('position',new THREE.BufferAttribute(rp,3));
    group.add(new THREE.LineSegments(rg,new THREE.LineBasicMaterial({color:'#b8c8dc',transparent:true,opacity:.4,depthWrite:false,fog:false})));
    anim.push(t=>{for(let i=0;i<n;i++){const [a,b,c]=seeds[i],y=22-((t*(14+b*5)+a*26)%26),x=-28+c*56,z=-26-b*16;rp.set([x,y,z,x-.08,y-.9,z],i*6);}rg.attributes.position.needsUpdate=true;});}
  return {group,T,animate:t=>{for(const a of anim)a(t);},dispose:()=>group.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of [].concat(o.material)){if(!m.map?.userData.cached)m.map?.dispose();m.dispose();}})};
}
