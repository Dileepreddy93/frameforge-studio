/* FrameForge set directions (M5.1): three ways to build a set at a scale where the cast read small in wides, with walls
   of in-world app screens (inbox, review, changelog, terminal...) around a keyboard or a desk. Each direction is a scene
   for design/set-forms.js (the same numbers can drive the three.js build) plus its wide, two-shot and close-up cameras.
   Measured in the reference wides: the cast stand 9-21% of the frame height, and a key is about 0.3 of a character's
   height. Units: DEV's (he stands 2 tall), ground y = 0, z toward the front of the set. */
(function(root,factory){
 const req=f=>typeof require==='function'?require(f):null;
 const lib=factory(root.FrameForgeSet||req('./set-forms.js'),root.FrameForgeArena||req('./set-arena.js'));
 if(typeof module==='object'&&module.exports)module.exports=lib;
 else root.FrameForgeSetDirections=lib;
})(typeof globalThis!=='undefined'?globalThis:this,function(F,AR){
 'use strict';
 const rad=d=>d*Math.PI/180;
 // Key rows in key units (each row is 15 units wide), back row first.
 const ROWS=[[1,1,1,1,1,1,1,1,1,1,1,1,1,2],[1.5,1,1,1,1,1,1,1,1,1,1,1,1,1.5],[1.75,1,1,1,1,1,1,1,1,1,1,1,2.25],
  [2.25,1,1,1,1,1,1,1,1,1,1,2.75],[1.25,1.25,1.25,6.25,1.25,1.25,1.25,1.25]];
 // A keyboard: rows from zBack forward, centred on x = 0. k = {pitch, gap, y0, h(row) , inset, lean, mat, topMat}.
 function keyboard(zBack,k){
  const out=[];
  ROWS.forEach((row,j)=>{let x=-7.5*k.pitch;const z=zBack+j*k.pitch,h=typeof k.h==='function'?k.h(j):k.h;
   row.forEach(u=>{const w=u*k.pitch-k.gap,d=k.pitch-k.gap;
    out.push(F.key(x+u*k.pitch/2,k.y0,z,[w,d],[w-2*k.inset,d-2*k.inset],h,k.mat,{topMat:k.topMat,lean:k.lean||0}));x+=u*k.pitch;});});
  return out;
 }
 // Windows on a desktop grid: cells [app, column, row, column span] on cols x rows, in the screen's 1000-wide frame.
 const grid=(cells,cols,rows,H)=>{const g=12,w=(1000-(cols+1)*g)/cols,h=(H-26-(rows+1)*g)/rows;
  return cells.map(([app,c,r,span=1,opt])=>({app,x:g+c*(w+g),y:26+g+r*(h+g),w:w*span+g*(span-1),h,opt}));};
 // The studio's DEV close-up (src/project-core.js 'dev' framing, distance 4.7 at fov 35, in DEV units): level with his
 // head centre, 4.47 in front of him.
 const closeOn=(at,dx=-.12)=>({pos:[at[0]+dx,at[1]+1.54,at[2]+4.47],target:[at[0],at[1]+1.5,at[2]],fov:35});

 // A · Laptop: the cast stand on a giant laptop keyboard; its screen behind them is a wall of six app windows.
 function laptop(){
  const objs=[],hinge=[0,0,-3.35],tilt=12,w=14.4,h=9.2,b=.45,up=[0,Math.cos(rad(tilt)),-Math.sin(rad(tilt))];
  objs.push({...F.box([-7.6,-.5,-3.35],[7.6,0,5.4],'deck',{tile:.9}),layer:'ground'});
  objs.push({...F.box([-2.6,-.02,1.3],[2.6,.006,4.4],'pad'),layer:'ground'});
  objs.push(...keyboard(-2.55,{pitch:.72,gap:.12,y0:0,h:.1,inset:.035,mat:'keycap',topMat:'keyViolet'}));
  objs.push(F.box([-6,-.05,-3.6],[6,.34,-3.12],'lid'));
  const H=Math.round(1000*h/w);
  objs.push(...F.monitor([hinge[0],hinge[1]+up[1]*(h/2+b),hinge[2]+up[2]*(h/2+b)-.2],w,h,
   F.desktop(grid([['inbox',0,0],['changelog',1,0],['chat',2,0],['calendar',3,0],['terminal',0,1],['metrics',1,1],['review',2,1],['inbox',3,1],
   ['review',0,2],['dashboard',1,2,2],['terminal',3,2]],4,3,H),H,{menu:'frameforge  ·  11 windows'}),{tilt,bezel:b,depth:.35,backMat:'lid',label:'laptop screen: 11 apps'}).map(o=>({...o,layer:'bg'})));
  objs.push(F.cityWindow(5,16,7.5,14,-11));
  return{objects:objs,groundY:.1,pool:{c:[-.3,.1,-.6],r:3.2,color:'#5F418C',k:.5},
   cast:[{who:'dev',at:[-1.7,.1,-.7],yaw:18},{who:'blue',at:[.3,.1,-.25],yaw:-15},{who:'orange',at:[2.3,.1,-1],yaw:-25}]};
 }
 // B · Desk canyon: the cast stand on a giant desk behind a mechanical keyboard with knee-high keys; separate
 // monitors rise around them like towers, each showing one app; a mug and sticky notes are the landmarks.
 function deskCanyon(){
  const objs=[];
  objs.push({...F.box([-18,-.8,-14],[18,0,9],'desk',{tile:1.2}),layer:'ground'});
  objs.push(F.box([-6.45,0,.3],[6.45,.34,4.4],'case'));
  objs.push(...keyboard(.7,{pitch:.8,gap:.1,y0:.34,h:j=>[.62,.55,.5,.52,.58][j],inset:.13,lean:.03,mat:'keycap',topMat:'keycap'}));
  const mon=(c,w,h,app,o)=>objs.push(...F.monitor(c,w,h,F.APPS[app](Math.round(1000*h/w),o.app||{}),{depth:.5,bezel:.3,label:app,...o}).map(x=>({...x,layer:'bg'})));
  // Centre tower: the story dashboard on a stand, a second screen stacked above it, tilted down at the cast.
  mon([0,5.2,-5.6],9.6,5.6,'dashboard',{tilt:2,stand:{floor:0,neck:1.2,foot:[4.4,2.8]},label:'dashboard (story)'});
  mon([0,11.3,-5.9],9.6,5.6,'changelog',{tilt:-10});
  // Side towers, turned in toward the cast: a portrait terminal on the left, review over inbox on the right.
  mon([-6.3,5.6,-3.4],5.2,8.8,'terminal',{ry:30,stand:{floor:0,neck:1,foot:[3,2.4]}});
  mon([6.4,3.9,-3.2],6.4,3.9,'inbox',{ry:-30,stand:{floor:0,neck:1,foot:[3,2.4]}});
  mon([6.4,8.4,-3.4],6.4,3.9,'review',{ry:-30,tilt:-8});
  mon([-5.6,11.6,-5],5,3.2,'metrics',{ry:24,tilt:-12});
  objs.push(F.prism([-4.6,0,-1.6],1.25,3.1,10,'mug',{top:'coffee'}),F.box([-6.25,.9,-1.8],[-5.75,2.4,-1.4],'mug'));
  objs.push(F.box([-5.15,1.55,-5.27],[-4.15,2.55,-5.2],'note'),F.box([-3.95,1.75,-5.27],[-2.95,2.75,-5.2],'note'));
  objs.push(F.cityWindow(-15,15,14.5,20,-12));
  return{objects:objs,groundY:0,pool:{c:[.2,0,-.8],r:3.4,color:'#5F418C',k:.5},
   cast:[{who:'dev',at:[-1.5,0,-.7],yaw:15},{who:'blue',at:[.4,0,-.4],yaw:-15},{who:'orange',at:[2.4,0,-1.2],yaw:-25}]};
 }
 // C · Screen arena: a half-ring of app windows in three tiers around a field of keycaps, with a few more windows
 // behind the camera, so every angle (reverse shots and reaction cuts too) has screens behind it.
 // The approved numbers live in design/set-arena.js (shared with the three.js build).
 function arena(){
  const A=AR.ARENA,objs=[];
  objs.push({...F.box([-15,-.5,-14],[15,0,9],'deck',{tile:1.5}),layer:'ground'});
  objs.push({...F.prism([0,0,0],A.plaza.r,A.plaza.h,A.plaza.sides,'case',{top:'desk'}),layer:'ground'});
  const k=A.keys;
  for(const[x,z,violet]of AR.keys())objs.push(F.key(x,0,z,[k.base,k.base],[k.top,k.top],k.h,'keycap',{topMat:violet?'keyViolet':'keycap'}));
  for(const w of AR.windows()){
   const app=w.story?'dashboard':w.app;
   // Windows behind the camera can stand between it and the cast: sort those with the cast, not behind everything.
   const layer=Math.abs(w.ry)>90?'mid':'bg';
   objs.push(...F.monitor(w.c,w.w,w.h,F.APPS[app](Math.round(1000*w.h/w.w)),{ry:w.ry,tilt:w.tilt,bezel:A.bezel,depth:A.depth,backMat:'frame',label:w.story?'story':w.app}).map(o=>({...o,layer})));
   const p=w.post.c;objs.push({...F.box([p[0]-.25,0,p[2]-.25],[p[0]+.25,w.post.top,p[2]+.25],'frame',{ry:w.ry}),layer});
  }
  return{objects:objs,groundY:A.plaza.h,pool:{c:[0,A.plaza.h,0],r:A.pool.r,color:'#5F418C',k:A.pool.k},
   cast:[{who:'dev',at:[-1.3,.16,.3],yaw:18},{who:'blue',at:[.5,.16,.7],yaw:-15},{who:'orange',at:[2,.16,-.5],yaw:-25}]};
 }
 const DIRS=[
  {id:'A',name:'Laptop landscape',build:laptop,
   notes:['The cast stand on a giant laptop keyboard (keys 0.36 of DEV\'s height, ankle-high); the trackpad is a plaza in front',
    'Its screen is the back wall: eleven app windows in a 4 × 3 grid; the story dashboard sits right behind the cast',
    'One scale in every shot, like the reference; closest to its grammar. City window off to the side'],
   cams:{wide:{pos:[3.5,7.2,14.5],target:[.2,3,-2]},two:{pos:[-.5,2.3,6.6],target:[-.65,1.5,-.5]},close:closeOn([-1.7,.1,-.7])}},
  {id:'B',name:'Desk canyon',build:deskCanyon,
   notes:['The cast stand on a giant desk behind a mechanical keyboard; its knee-high keys hide their legs in close-ups (the M1.5 problem)',
    'Monitors stacked into three towers at different depths, turned in toward the cast, one app each and readable; a mug and sticky notes as landmarks',
    'More depth and less like the reference. The keyboard sits between camera and cast, as in the WhatsApp reference'],
   cams:{wide:{pos:[2.5,9.5,20.5],target:[0,5.4,-3]},two:{pos:[-.5,2.3,7.6],target:[-.6,1.6,-.6]},close:closeOn([-1.5,0,-.7])}},
  {id:'C',name:'Screen arena',build:arena,
   notes:['A half-ring of 15 app windows in three tiers around a field of keycaps; the cast stand on a violet plaza in the middle',
    'Four more windows far behind the camera: every angle, reverse shots and reaction cuts included, has screens behind it',
    'The densest wall of screens, no device metaphor; the most abstract and the most "world of software"'],
   cams:{wide:{pos:[.5,7.5,15],target:[0,3.8,-4]},two:{pos:[-.4,2.4,7.6],target:[-.5,1.5,-.8]},close:closeOn([-1.3,.16,.3])}}
 ];
 return{DIRS,ROWS};
});
