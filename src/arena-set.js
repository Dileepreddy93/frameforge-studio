/* FrameForge set in three.js: the screen arena (design/set-arena.js, direction C, approved 2026-10-26), built to
   STYLE.md: flat-shaded Lambert facets lit by the studio's key and rim, screens as unlit canvas textures drawn from the
   same app layouts as the design sheet (design/set-forms.js), keycaps instanced. The design is in DEV units; the
   studio passes its scale (DEV_S) and the world point under the plaza centre, so the plaza top meets DEV's feet.
   build(T, {scale, origin}) -> {group, plaza, drawStory(state), storyFrame}: the caller adds the group and the plaza
   (separately, so the art lab can keep the plaza under a posed character). drawStory({wall}) or drawStory({insert})
   redraws the story window only when what it shows changes; storyFrame is that window's centre and its normal,
   right and up axes in the world, for the camera of screen shots. */
(function(root){
 'use strict';
 // Albedos: up-facing faces take the rim (9) as well as the key (4.4), so the tops are dark here to land near STYLE.md's
 // desk #353790 and keys #754DA6 on screen.
 const COLOURS={floor:0x120F24,plazaTop:0x1F1A43,plazaSide:0x110E26,key:0x1C1838,keyTop:0x221C44,violetTop:0x5C3F8C,bezel:0x0B0A12,frame:0x100E1E};
 function build(T,{scale:S,origin:O}){
  const A=root.FrameForgeArena.ARENA,F=root.FrameForgeSet,group=new T.Group();
  const W=(x,y,z)=>new T.Vector3(O[0]+x*S,O[1]+y*S,O[2]+z*S);
  const flat=c=>new T.MeshLambertMaterial({color:c,flatShading:true});
  // Floor under the keys, wide enough to fill the wides to the frame edges.
  const floor=new T.Mesh(new T.BoxGeometry(34*S,.5*S,30*S),flat(COLOURS.floor));
  floor.position.copy(W(0,-.25,-4));floor.receiveShadow=true;group.add(floor);
  // The plaza the cast stand on: a 16-sided violet disc (side, top, bottom materials).
  const p=A.plaza,plaza=new T.Mesh(new T.CylinderGeometry(p.r*S,p.r*S,p.h*S,p.sides),[flat(COLOURS.plazaSide),flat(COLOURS.plazaTop),flat(COLOURS.plazaSide)]);
  plaza.position.copy(W(0,p.h/2,0));plaza.receiveShadow=true;
  // The pink-violet pool on the plaza (STYLE.md): an additive radial glow, no light.
  const pc=document.createElement('canvas');pc.width=pc.height=256;const px=pc.getContext('2d'),g=px.createRadialGradient(128,128,0,128,128,128);
  g.addColorStop(0,'rgba(95,65,140,'+A.pool.k+')');g.addColorStop(.55,'rgba(74,52,128,'+(A.pool.k*.4)+')');g.addColorStop(1,'rgba(42,32,96,0)');px.fillStyle=g;px.fillRect(0,0,256,256);
  const pool=new T.Mesh(new T.CircleGeometry(A.pool.r*1.5*S,48),new T.MeshBasicMaterial({map:new T.CanvasTexture(pc),transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));
  pool.rotation.x=-Math.PI/2;pool.position.copy(W(0,p.h+.004,0));group.add(pool);
  // Keycaps: one frustum, instanced; the top is a separate material group so tops and sides take different colours.
  const k=A.keys,b=k.base*S/2,t=k.top*S/2,h=k.h*S;
  const B=[[-b,0,-b],[b,0,-b],[b,0,b],[-b,0,b]],Tp=[[-t,h,-t],[t,h,-t],[t,h,t],[-t,h,t]],pos=[];
  for(const q of [[Tp[0],Tp[3],Tp[2],Tp[1]]])pos.push(...q[0],...q[1],...q[2],...q[0],...q[2],...q[3]);
  for(let i=0;i<4;i++){const a=B[i],c=B[(i+1)%4],d=Tp[(i+1)%4],e=Tp[i];pos.push(...a,...d,...c,...a,...e,...d);}
  const keyGeo=new T.BufferGeometry();keyGeo.setAttribute('position',new T.Float32BufferAttribute(pos,3));keyGeo.computeVertexNormals();
  keyGeo.addGroup(0,6,0);keyGeo.addGroup(6,24,1);
  const keyList=root.FrameForgeArena.keys(),m4=new T.Matrix4();
  for(const violet of [false,true]){
   const list=keyList.filter(x=>x[2]===violet),mesh=new T.InstancedMesh(keyGeo,[flat(violet?COLOURS.violetTop:COLOURS.keyTop),flat(COLOURS.key)],list.length);
   list.forEach(([x,z],i)=>mesh.setMatrixAt(i,m4.makeTranslation(W(x,0,z))));
   mesh.receiveShadow=true;group.add(mesh);
  }
  // Windows: a bezel box, an unlit canvas screen and a post down to the floor.
  const bezelMats=[...Array(4).fill(flat(COLOURS.bezel)),flat(COLOURS.bezel),flat(COLOURS.frame)];
  let story=null,storyFrame=null;
  for(const w of root.FrameForgeArena.windows()){
   const win=new T.Group();win.position.copy(W(...w.c));win.rotation.set(-w.tilt*Math.PI/180,w.ry*Math.PI/180,0,'YXZ');group.add(win);
   const bezel=new T.Mesh(new T.BoxGeometry((w.w+2*A.bezel)*S,(w.h+2*A.bezel)*S,A.depth*S),bezelMats);bezel.position.z=-A.depth*S/2-.01;win.add(bezel);
   const cv=document.createElement('canvas');cv.width=w.story?1024:768;cv.height=Math.round(cv.width*w.h/w.w);
   const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;
   win.add(new T.Mesh(new T.PlaneGeometry(w.w*S,w.h*S),new T.MeshBasicMaterial({map:tex,toneMapped:false})));
   const H=1000*w.h/w.w,ctx=cv.getContext('2d');
   if(w.story){story={ctx,tex,H,drawn:undefined};win.updateMatrixWorld(true);const e=win.matrixWorld.elements;
    storyFrame={c:win.position.toArray(),u:[e[0],e[1],e[2]],v:[e[4],e[5],e[6]],n:[e[8],e[9],e[10]]};}
   else{F.drawCanvas(ctx,F.APPS[w.app](H));tex.needsUpdate=true;}
   const post=new T.Mesh(new T.BoxGeometry(A.post*S,w.post.top*S,A.post*S),flat(COLOURS.frame));
   post.position.copy(W(w.post.c[0],w.post.top/2,w.post.c[2]));post.rotation.y=w.ry*Math.PI/180;group.add(post);
  }
  // The story window shows a shot's wall (a dashboard) or a screen shot's insert; with neither yet it is dark glass.
  function drawStory(state){
   const key=JSON.stringify(state??null);if(!story||story.drawn===key)return;story.drawn=key;
   const wall=state?.wall,els=state?.insert?F.APPS.insert(story.H,state.insert)
    :wall?F.APPS.dashboard(story.H,{title:wall.window,label:wall.label,value:wall.value,badge:wall.badge??'',tone:wall.tone}):[{r:[0,0,1000,story.H],fill:F.SCREEN.glass}];
   story.ctx.clearRect(0,0,story.ctx.canvas.width,story.ctx.canvas.height);F.drawCanvas(story.ctx,els);story.tex.needsUpdate=true;
  }
  return{group,plaza,drawStory,storyFrame};
 }
 root.FrameForgeArenaSet={build,COLOURS};
})(typeof globalThis!=='undefined'?globalThis:this);
