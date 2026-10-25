/* FrameForge robot forms: BLUE and ORANGE drawn as flat-shaded SVG for 2D design sheets (M3.1+), in the same light,
   palette and facet style as DEV (design/dev-forms.js, whose shading this reuses). A robot is a few parametric forms:
   superellipsoid shells (round to boxy) for head and body, tubes for necks, arms, legs and antennae, and a face made of
   flat shapes wrapped onto the head (a screen, or ink drawn on the shell). The same numbers can later drive the three.js
   build. Units: DEV's (DEV's head height = 1), y up, x toward the robot's left, z toward the viewer, ground at y = 0. */
(function(root,factory){
 const lib=factory(root.FrameForgeDesign||(typeof require==='function'?require('./dev-forms.js'):null));
 if(typeof module==='object'&&module.exports)module.exports=lib;
 else root.FrameForgeRobot=lib;
})(typeof globalThis!=='undefined'?globalThis:this,function(D){
 'use strict';
 const PI=Math.PI;
 const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],mul=(a,s)=>[a[0]*s,a[1]*s,a[2]*s];
 const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const norm=a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l];};
 const lerp=(a,b,t)=>a+(b-a)*t,lerp3=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const spow=(c,e)=>Math.sign(c)*Math.pow(Math.abs(c),e);
 const rad=d=>d*PI/180;
 const rotX=(p,a)=>{const c=Math.cos(a),s=Math.sin(a);return[p[0],p[1]*c-p[2]*s,p[1]*s+p[2]*c];};
 const rotY=(p,a)=>{const c=Math.cos(a),s=Math.sin(a);return[p[0]*c+p[2]*s,p[1],-p[0]*s+p[2]*c];};
 const rotZ=(p,a)=>{const c=Math.cos(a),s=Math.sin(a);return[p[0]*c-p[1]*s,p[0]*s+p[1]*c,p[2]];};
 const centroid=q=>mul(q.reduce(add,[0,0,0]),1/q.length);

 // ---------- materials: robot shells and trims, lit like the set (STYLE.md) ----------
 const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
 const MAT=D.MAT;
 Object.assign(MAT,{
  // BLUE: the set's teal-blue, a little greyer. ORANGE: warmer and lighter than DEV's terracotta skin.
  blueShell:{ramp:['#0E1626','#35577C','#7FA6C9'],amb:.07,rim:'#8FB4FF',rimK:.55},
  blueDeep:{ramp:['#0A0F1C','#233C5C','#4E7398'],amb:.06,rim:'#6F93E0',rimK:.5},
  orangeShell:{ramp:['#2A0D04','#B2511F','#EE9A55'],amb:.07,rim:'#B49AE0',rimK:.45},
  orangeDeep:{ramp:['#1E0903','#7E3413','#BC6A36'],amb:.06,rim:'#9682C8',rimK:.4},
  trim:{ramp:['#07060C','#1C1B30','#3B3A5C'],amb:.05,rim:'#5C6FB8',rimK:.7},
  bezel:{ramp:['#050409','#141320','#2A2940'],amb:.05,rim:'#4D5C9C',rimK:.6},
  violet:{ramp:['#120B26','#353790','#6C55B8'],amb:.06,rim:'#8F86E0',rimK:.5},
  visor:{flat:'#151029'},visorDeep:{flat:'#0D0A18'},
  // Face light on the screens: BLUE takes the screens' code blue, ORANGE the window-light amber. Flat, unlit.
  blueFace:{flat:'#79C5FF'},orangeFace:{flat:'#FFC15A'},blueFaceDim:{flat:'#2F5F8F'},orangeFaceDim:{flat:'#8A5A1E'},violetFlat:{flat:'#7A62C8'}
 });
 for(const m of Object.values(MAT))if(m.ramp&&!m.r){m.r=m.ramp.map(rgb);m.rc=rgb(m.rim);}
 const shade=D.shade;

 // ---------- forms ----------
 // Superellipsoid shell: radii r=[rx,ry,rz], squareness n=[around, up/down] (2 = round, 4+ = boxy), u x v facets.
 // Returns its triangles and faceAt(x,y) -> {p,n}: the point on the smooth surface in front of (x,y) and its normal.
 function shell(c,r,n,seg,mat,o={}){
  const [rx,ry,rz]=r,[nh,nv]=n,[U,V]=seg,e1=2/nv,e2=2/nh,pts=[];
  const top=o.top??1,bot=o.bot??1;  // a flattened crown or base
  for(let j=0;j<=V;j++){
   const phi=-PI/2+PI*j/V,cp=Math.cos(phi),sp=Math.sin(phi),row=[];
   for(let i=0;i<U;i++){
    const th=2*PI*(i+(o.offset??.5))/U;
    let y=ry*spow(sp,e1);y=y>0?y*top:y*bot;
    row.push(add(c,[rx*spow(cp,e1)*spow(Math.sin(th),e2),y,rz*spow(cp,e1)*spow(Math.cos(th),e2)]));
   }
   pts.push(row);
  }
  const tris=[];
  for(let j=0;j<V;j++)for(let i=0;i<U;i++){
   const a=pts[j][i],b=pts[j][(i+1)%U],d=pts[j+1][(i+1)%U],e=pts[j+1][i];
   if(j>0)tris.push({p:[a,d,b],mat,o:c});
   if(j<V-1)tris.push({p:[a,e,d],mat,o:c});
  }
  orient(tris);
  const faceAt=(x,y)=>{
   const X=clamp(Math.abs(x)/rx,0,.999),Y=clamp(Math.abs(y)/(y>0?ry*top:ry*bot),0,.999),A=1-Math.pow(Y,nv);
   const S=Math.max(0,Math.pow(Math.max(A,1e-6),nh/nv)-Math.pow(X,nh));
   const p=add(c,[x,y,rz*Math.pow(S,1/nh)]);
   return{p,ok:S>.002};
  };
  const at=(x,y)=>{const a=faceAt(x,y),h=.004,dx=sub(faceAt(x+h,y).p,faceAt(x-h,y).p),dy=sub(faceAt(x,y+h).p,faceAt(x,y-h).p);return{p:a.p,n:norm(cross(dx,dy)),ok:a.ok};};
  return{tris,faceAt:at,c,r};
 }
 function orient(tris){
  for(const t of tris){if(!t.o)continue;const[a,b,c]=t.p;if(dot(cross(sub(b,a),sub(c,a)),sub(centroid(t.p),t.o))<0)t.p=[a,c,b];delete t.o;}
  return tris;
 }
 const tube=(path,radii,sides,mat,o={})=>D.tube(path,radii,sides,mat,o);
 // A disc-shaped cylinder (ear, bolt, wheel) along an axis.
 const disc=(c,axis,r,len,sides,mat)=>tube([add(c,mul(axis,-len/2)),add(c,mul(axis,len/2))],[r,r],sides,mat,{capStart:1,capEnd:1,up:Math.abs(axis[1])>.9?[1,0,0]:[0,1,0]});
 // A mitten: a rounded box with a thumb, palm toward the body (side = +1 left, -1 right).
 function mitten(c,size,mat,side){
  const out=shell(c,size,[3,3],[8,6],mat).tris;
  out.push(...shell(add(c,[-side*size[0]*.55,size[1]*.25,size[2]*.55]),[size[0]*.38,size[1]*.42,size[2]*.42],[2.4,2.4],[6,4],mat).tris);
  return out;
 }

 // ---------- the face ----------
 // Flat shapes in face space (x right, y up, relative to the head centre), wrapped onto the head with faceAt. Each
 // shape is {pts, fill}. Eye styles: 'pill' (tall capsule), 'round', 'ring' (a lit ring with a dark centre),
 // 'square' (rounded square pixels). Channels (all optional): open (eye height x), lidU/lidSlope (upper lid cut and its
 // tilt: + makes the inner corner lower, angry), lidL (happy: the lower lid rises into an arch), scale, gaze [x,y],
 // browLift/browTilt, mouth {s smile, o open, w width, round, shift}.
 const ellipse=(cx,cy,rx,ry,n=20)=>Array.from({length:n},(_,i)=>{const a=2*PI*i/n;return[cx+rx*Math.cos(a),cy+ry*Math.sin(a)];});
 function roundRect(cx,cy,w,h,r,n=5){
  r=Math.min(r,w/2,h/2);const out=[];
  for(const [qx,qy,a0] of [[1,1,0],[-1,1,PI/2],[-1,-1,PI],[1,-1,1.5*PI]])
   for(let i=0;i<=n;i++){const a=a0+PI/2*i/n;out.push([cx+qx*(w/2-r)+r*Math.cos(a),cy+qy*(h/2-r)+r*Math.sin(a)]);}
  return out;
 }
 // Keep the part of a polygon on the side of a line where f(x,y) >= 0 (Sutherland-Hodgman, one edge).
 function clipHalf(poly,f){
  const out=[];
  for(let i=0;i<poly.length;i++){
   const a=poly[i],b=poly[(i+1)%poly.length],fa=f(a),fb=f(b);
   if(fa>=0)out.push(a);
   if((fa>=0)!==(fb>=0)){const t=fa/(fa-fb);out.push([lerp(a[0],b[0],t),lerp(a[1],b[1],t)]);}
  }
  return out;
 }
 // An arch band ("^" happy eye) of half-width w, height h, thickness th.
 function arch(cx,cy,w,h,th,n=12){
  const top=[],bot=[];
  for(let i=0;i<=n;i++){const u=-1+2*i/n,x=cx+u*w,y=cy+h*(1-u*u);top.push([x,y+th/2]);bot.push([x,y-th/2]);}
  return top.concat(bot.reverse());
 }
 function faceShapes(spec,ch={}){
  const f=spec.face,out=[],lit=f.color,dim=f.dim;
  if(f.screen){
   const s=f.screen;
   if(s.bezel)out.push({pts:roundRect(0,s.y,s.w+s.bezel*2,s.h+s.bezel*2,s.r+s.bezel),fill:'bezelFlat'});
   out.push({pts:roundRect(0,s.y,s.w,s.h,s.r),fill:'visor'});
   // A faint scan line or two keeps it reading as a screen, not a hole.
   if(s.lines)for(let k=0;k<s.lines;k++){const y=s.y-s.h/2+s.h*(k+1)/(s.lines+1);out.push({pts:[[-s.w/2+s.r*.6,y+.002],[s.w/2-s.r*.6,y+.002],[s.w/2-s.r*.6,y-.002],[-s.w/2+s.r*.6,y-.002]],fill:'visorDeep'});}
  }
  const e=f.eyes,scale=ch.scale??1,open=ch.open??1,gx=(ch.gaze?.[0]??0),gy=(ch.gaze?.[1]??0);
  for(const side of [1,-1]){
   const cx=side*e.x+gx,cy=e.y+gy,rx=e.rx*scale,ry=e.ry*scale*open;
   const lidU=ch.lidU??0,slope=(ch.lidSlope??0)*side,lidL=ch.lidL??0,own=side>0?(ch.lidUL??lidU):(ch.lidUR??lidU);
   if(lidL>.5){out.push({pts:arch(cx,cy-ry*.2,rx*1.05,ry*.75,Math.max(.012,e.ry*.32)),fill:lit});continue;}
   let poly=e.style==='pill'?roundRect(cx,cy,rx*2,ry*2,rx):e.style==='square'?roundRect(cx,cy,rx*2,ry*2,rx*.35):ellipse(cx,cy,rx,ry);
   // The upper lid: a cut line lowered by lidU, tilted by slope (inner corner = toward the face centre).
   if(own>0){const yTop=cy+ry-2*ry*own;poly=clipHalf(poly,([x,y])=>yTop-(x-cx)*(-slope)*1.2-y);}
   if(poly.length<3)continue;
   if(e.style==='ring'){
    out.push({pts:poly,fill:lit});
    let inner=ellipse(cx,cy,rx*.52,ry*.52);if(own>0){const yTop=cy+ry-2*ry*own;inner=clipHalf(inner,([x,y])=>yTop-(x-cx)*(-slope)*1.2-y-ry*.2);}
    if(inner.length>2)out.push({pts:inner,fill:f.screen?'visor':'ink'});
   }else out.push({pts:poly,fill:lit});
   // Ink eyes drawn on a shell get DEV's two glints.
   if(f.glints&&own<.6){out.push({pts:ellipse(cx+rx*.35,cy+ry*.4,rx*.26,rx*.26,10),fill:'glint'});out.push({pts:ellipse(cx-rx*.3,cy-ry*.25,rx*.12,rx*.12,8),fill:'glint'});}
  }
  if(f.brows){
   const b=f.brows;
   for(const side of [1,-1]){
    const lift=(ch.browLift??0)+(ch.browUp?(side>0?ch.browUp[0]:ch.browUp[1]):0),tilt=(ch.browTilt??0)*side;
    const cx=side*b.x+gx*.5,cy=b.y+lift,l=b.len/2;
    // + tilt raises the inner end (worried); - lowers it (angry).
    const yi=cy+tilt*l*2.2,yo=cy-tilt*l*.6,xi=cx-side*l,xo=cx+side*l;
    out.push({pts:[[xi,yi+b.th/2],[xo,yo+b.th/2],[xo,yo-b.th/2],[xi,yi-b.th/2]],fill:f.ink?'ink':lit});
   }
  }
  if(f.mouth){
   const m=f.mouth,mc=ch.mouth||{},w=m.w*(mc.w??1),s=mc.s??m.s??0,o=mc.o??0,sh=mc.shift??0;
   if(m.style==='segments'&&!mc.round){
    // An LED bar: n segments that follow the smile curve, lit by how open the mouth is.
    const n=m.n||5;
    for(let i=0;i<n;i++){const u=-1+2*(i+.5)/n,x=sh+u*w,y=m.y+s*(u*u-.35)*2.2,hh=m.th/2+o*.6*(1-Math.abs(u)*.5);
     out.push({pts:roundRect(x,y,w*2/n*.72,hh*2,m.th*.3,2),fill:i===0||i===n-1?(dim||lit):lit});}
   }else if(mc.round||o>.015){
    const rx=mc.round?w*.45:w,ry=Math.max(m.th,o);
    out.push({pts:ellipse(sh,m.y-ry*.3,rx,ry,18),fill:f.ink?'mouth':lit});
    if(!f.ink&&f.screen&&!mc.round)out.push({pts:ellipse(sh,m.y-ry*.3,rx*.7,ry*.55,14),fill:'visor'});
   }else{
    // A curved line: smile s bends the ends up (+) or down (-).
    const n=12,top=[],bot=[];
    for(let i=0;i<=n;i++){const u=-1+2*i/n,x=sh+u*w,y=m.y+s*(u*u)*1.8-s*.4;top.push([x,y+m.th/2]);bot.push([x,y-m.th/2]);}
    out.push({pts:top.concat(bot.reverse()),fill:f.ink?'ink':lit});
   }
  }
  if(f.cheeks&&(ch.blush??0)>0)for(const side of [1,-1])out.push({pts:ellipse(side*f.cheeks.x,f.cheeks.y,f.cheeks.r,f.cheeks.r*.6,12),fill:dim||lit});
  return out;
 }
 MAT.bezelFlat={flat:'#0B0A12'};

 // ---------- a robot from its spec ----------
 // Each part is {tris, bias}; the head part also carries the face (wrapped with faceAt). Parts that move with the
 // head are flagged head:true so a head pose turns them together.
 function build(spec){
  const parts=[],P=(tris,o={})=>parts.push({tris,...o});
  const H=spec.head,B=spec.body,mat=spec.mat,deep=spec.deep;
  const head=shell(H.c,H.r,H.n,H.seg,mat,{top:H.top,bot:H.bot});
  P(head.tris,{head:true,name:'head',form:head});
  for(const e of spec.ears||[])for(const side of [1,-1]){
   const c=add(H.c,[side*e.x,e.y,e.z??0]);
   P(disc(c,[1,0,0],e.r,e.len,e.sides||10,e.mat||'trim'),{head:true});
   if(e.cap)P(disc(add(c,[side*e.len*.6,0,0]),[1,0,0],e.r*.55,e.len*.5,8,e.cap),{head:true});
  }
  for(const a of spec.antennae||[]){
   const base=add(H.c,a.base),tip=add(base,a.tip);
   const mid=a.bend?add(lerp3(base,tip,.5),a.bend):lerp3(base,tip,.5);
   P(tube([base,mid,tip],[a.r,a.r*.85,a.r*.7],6,'trim',{capStart:1}),{head:true});
   P(shell(tip,[a.ball,a.ball,a.ball],[2,2],[8,6],a.mat||spec.accent).tris,{head:true});
  }
  if(H.crest)P(shell(add(H.c,H.crest.c),H.crest.r,H.crest.n||[2.4,2.4],[10,6],H.crest.mat||deep).tris,{head:true});
  if(spec.neck)P(tube([spec.neck.top,spec.neck.bot],[spec.neck.r,spec.neck.r*1.1],8,'trim',{capStart:1,capEnd:1}),{bias:-.05});
  const body=shell(B.c,B.r,B.n,B.seg,mat,{top:B.top,bot:B.bot});
  P(body.tris,{name:'body',form:body,decals:spec.chest});
  if(B.belt)P(tube([add(B.c,[0,B.belt.y-B.belt.h/2,0]),add(B.c,[0,B.belt.y+B.belt.h/2,0])],[[B.r[0]*B.belt.k,B.r[2]*B.belt.k],[B.r[0]*B.belt.k,B.r[2]*B.belt.k]],B.seg[0],deep));
  const A=spec.arms;
  for(const side of [1,-1]){
   const sx=v=>[side*v[0],v[1],v[2]];
   if(A.style!=='float'){
    const sh=sx(A.shoulder),el=sx(A.elbow),wr=sx(A.wrist);
    P(shell(sh,[A.r*1.35,A.r*1.35,A.r*1.35],[2.2,2.2],[8,6],deep).tris);
    P(tube([sh,el,wr],[A.r,A.r*.95,A.r*.9],7,'trim'));
   }
   P(mitten(sx(A.hand),A.size,A.handMat||mat,side));
  }
  const G=spec.base;
  if(G.type==='hover'){
   P(tube([[0,G.top,0],[0,G.bot,0]],[[G.r,G.r*G.z],[G.r*.45,G.r*.45*G.z]],10,'trim',{capStart:1,capEnd:1}),{bias:-.02});
   P(tube([[0,G.bot+.012,0],[0,G.bot-.012,0]],[[G.r*.62,G.r*.62*G.z],[G.r*.62,G.r*.62*G.z]],12,spec.accent,{capStart:1,capEnd:1}),{bias:-.03});
  }else if(G.type==='legs'){
   for(const side of [1,-1]){
    // The foot's sole sits on the ground.
    P(tube([[side*G.x,G.top,0],[side*G.x,G.foot[1]*1.6,0]],[G.r,G.r*.92],7,'trim',{capStart:1}));
    P(shell([side*G.x,G.foot[1],G.foot[2]*.25],G.foot,[3.2,3.2],[8,4],deep).tris);
   }
  }else if(G.type==='wheel'){
   P(tube([[0,G.top,0],[0,G.r*2-.02,0]],[G.r*.35,G.r*.35],7,'trim'),{bias:-.04});
   P(disc([0,G.r,0],[1,0,0],G.r,G.w,14,'trim'),{bias:-.01});
   P(disc([0,G.r,0],[1,0,0],G.r*.45,G.w*1.15,10,spec.accent));
  }
  return{spec,parts,head,body,pivot:H.pivot||add(H.c,[0,-H.r[1]*.8,0])};
 }

 // ---------- render ----------
 const f4=v=>Math.round(v*1e4)/1e4;
 const ptsAttr=q=>q.map(p=>f4(p[0])+','+f4(-p[1])).join(' ');
 let uid=0;
 // view: {yaw, pitch} (deg, + turns the face to screen-right), pose: head {roll,pitch,yaw}, face: channels, crop:'head'.
 function render(robot,view={}){
  const yaw=rad(view.yaw||0),pitch=rad(view.pitch||0),pose=view.pose||{},pv=robot.pivot;
  const V=p=>rotX(rotY(p,yaw),pitch);
  const Hd=p=>{let q=sub(p,pv);q=rotZ(q,rad(pose.roll||0));q=rotX(q,rad(pose.pitch||0));q=rotY(q,rad(pose.yaw||0));return V(add(q,pv));};
  const prep=(tris,X)=>{const out=[];for(const t of tris){const q=t.p.map(X);const n=norm(cross(sub(q[1],q[0]),sub(q[2],q[0])));if(n[2]<=1e-5)continue;out.push({q,z:centroid(q)[2],fill:shade(t.mat,n)});}return out;};
  const objs=[];
  for(const part of robot.parts){
   const X=part.head?Hd:V,ts=prep(part.tris,X);
   if(!ts.length)continue;
   ts.sort((a,b)=>a.z-b.z);
   const all=part.tris.flatMap(t=>t.p).map(X),key=all.reduce((s,p)=>s+p[2],0)/all.length+(part.bias||0);
   let face='';
   const wrap=(shapes,form,X2)=>{
    let s='';
    for(const sh of shapes){
     const fa=form.faceAt(...sh.pts[0]);if(!fa.ok)continue;
     const n=norm(sub(X2(add(fa.p,fa.n)),X2(fa.p)));if(n[2]<.03)continue;
     const q=sh.pts.map(([x,y])=>{const a=form.faceAt(x,y);return X2(add(a.p,mul(a.n,.006)));});
     const m=MAT[sh.fill];s+='<polygon points="'+ptsAttr(q)+'" fill="'+(m.flat||shade(sh.fill,n))+'" stroke="'+(m.flat||shade(sh.fill,n))+'"/>';
    }
    return s;
   };
   if(part.name==='head')face=wrap(faceShapes(robot.spec,view.face||{}),part.form,X);
   if(part.name==='body'&&part.decals)face=wrap(part.decals.map(d=>({pts:d.shape==='circle'?ellipse(d.x,d.y,d.r,d.r,16):roundRect(d.x,d.y,d.w,d.h,d.r??.01),fill:d.fill})),part.form,X);
   objs.push({ts,key,face,head:part.name==='head'});
  }
  objs.sort((a,b)=>a.key-b.key);
  const poly=t=>'<polygon points="'+ptsAttr(t.q)+'" fill="'+t.fill+'" stroke="'+t.fill+'"/>';
  let svg='';const allPts=[],headPts=[];
  for(const o of objs){
   const id='rc'+(++uid);
   svg+=o.ts.map(poly).join('');
   if(o.face)svg+='<clipPath id="'+id+'"><path d="'+o.ts.map(t=>'M'+ptsAttr(t.q).replace(/ /g,'L')+'Z').join('')+'"/></clipPath><g clip-path="url(#'+id+')">'+o.face+'</g>';
   for(const t of o.ts){allPts.push(...t.q);if(o.head)headPts.push(...t.q);}
  }
  const box=ps=>[Math.min(...ps.map(p=>p[0])),Math.min(...ps.map(p=>-p[1])),Math.max(...ps.map(p=>p[0])),Math.max(...ps.map(p=>-p[1]))];
  return{svg,bbox:box(allPts),headBox:box(headPts)};
 }
 return{build,render,faceShapes,shell,MAT};
});
