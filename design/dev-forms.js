/* FrameForge design forms: low-poly characters drawn as flat-shaded SVG for 2D design sheets (M1.1+).
   A character is a few parametric forms (head profile curves, hair chunks, body rings) cut into flat facets and lit
   like the V6 set: one warm key from camera-right, one blue rim from behind-left. Face features are 2D shapes
   designed in face space and wrapped onto the head, so the same numbers can later drive the three.js build. */
(function(root,factory){
 const lib=factory();
 if(typeof module==='object'&&module.exports)module.exports=lib;
 else root.FrameForgeDesign=lib;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const PI=Math.PI;
 const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],mul=(a,s)=>[a[0]*s,a[1]*s,a[2]*s];
 const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const norm=a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l];};
 const lerp3=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const spow=(c,e)=>Math.sign(c)*Math.pow(Math.abs(c),e);
 const rad=d=>d*PI/180;
 const rotX=(p,a)=>{const c=Math.cos(a),s=Math.sin(a);return[p[0],p[1]*c-p[2]*s,p[1]*s+p[2]*c];};
 const rotY=(p,a)=>{const c=Math.cos(a),s=Math.sin(a);return[p[0]*c+p[2]*s,p[1],-p[0]*s+p[2]*c];};
 const rotZ=(p,a)=>{const c=Math.cos(a),s=Math.sin(a);return[p[0]*c-p[1]*s,p[0]*s+p[1]*c,p[2]];};
 const centroid=q=>mul(q.reduce(add,[0,0,0]),1/q.length);
 function hash3(a,b,c,seed){
  let h=Math.imul(Math.round(a*1e4)+seed*7919,73856093)^Math.imul(Math.round(b*1e4),19349663)^Math.imul(Math.round(c*1e4),83492791);
  h=Math.imul(h^(h>>>15),2246822507);h=Math.imul(h^(h>>>13),3266489909);return((h^(h>>>16))>>>0)/4294967296;
 }
 // Monotone cubic through [[x,y],...] (Fritsch-Carlson), so profile curves never overshoot.
 function curve(pts){
  if(typeof pts==='number')return()=>pts;
  const n=pts.length,xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),d=[],m=[];
  if(n===1)return()=>ys[0];
  for(let i=0;i<n-1;i++)d.push((ys[i+1]-ys[i])/(xs[i+1]-xs[i]));
  m[0]=d[0];m[n-1]=d[n-2];
  for(let i=1;i<n-1;i++)m[i]=d[i-1]*d[i]<=0?0:(d[i-1]+d[i])/2;
  for(let i=0;i<n-1;i++){
   if(d[i]===0){m[i]=m[i+1]=0;continue;}
   const a=m[i]/d[i],b=m[i+1]/d[i],s=a*a+b*b;
   if(s>9){const k=3/Math.sqrt(s);m[i]=k*a*d[i];m[i+1]=k*b*d[i];}
  }
  return x=>{
   if(x<=xs[0])return ys[0];if(x>=xs[n-1])return ys[n-1];
   let i=0;while(x>xs[i+1])i++;
   const h=xs[i+1]-xs[i],s=(x-xs[i])/h,s2=s*s,s3=s2*s;
   return(2*s3-3*s2+1)*ys[i]+(s3-2*s2+s)*h*m[i]+(-2*s3+3*s2)*ys[i+1]+(s3-s2)*h*m[i+1];
  };
 }

 // ---------- light and materials (palette from STYLE.md) ----------
 const KEY=norm([.5,.5,.72]),RIM=norm([-.62,.62,-.48]);
 const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
 const mixc=(a,b,t)=>[0,1,2].map(i=>a[i]+(b[i]-a[i])*t);
 const hex=c=>'#'+c.map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('');
 const MAT={
  skin:{ramp:['#2C0F06','#8B3F1D','#C66C48'],amb:.08,rim:'#9C88CC',rimK:.42},
  neck:{ramp:['#1E0A04','#5E2913','#8F4426'],amb:.04,rim:'#7E6FB0',rimK:.3},
  hair:{ramp:['#050203','#140907','#3B2720'],amb:.05,rim:'#4B87C0',rimK:1},
  hood:{ramp:['#13222A','#3D5D66','#6F7B70'],amb:.06,rim:'#467498',rimK:.9},
  hoodDark:{ramp:['#0D181E','#2C454D','#566258'],amb:.06,rim:'#3A6286',rimK:.8},
  pants:{ramp:['#0A0B14','#22263F','#3C4163'],amb:.06,rim:'#4A5B98',rimK:.65},
  shoe:{ramp:['#0C0D16','#2A2E46','#4A4F6E'],amb:.06,rim:'#5068A8',rimK:.65},
  sole:{ramp:['#3E3A36','#ADA59C','#E0D8CE'],amb:.12,rim:'#A9B8E8',rimK:.45},
  string:{flat:'#B098B1'},ink:{flat:'#04030A'},mouth:{flat:'#2A0911'},tongue:{flat:'#7C2C33'},
  white:{flat:'#E7DACB'},glint:{flat:'#FFF7EE'},teeth:{flat:'#EADFD1'}
 };
 for(const m of Object.values(MAT))if(m.ramp){m.r=m.ramp.map(rgb);m.rc=rgb(m.rim);}
 function shade(name,n,k=1){
  const m=MAT[name];if(m.flat)return m.flat;
  const v=clamp((m.amb+Math.max(0,dot(n,KEY))*(1-m.amb))*k,0,1);
  let c=v<.5?mixc(m.r[0],m.r[1],v/.5):mixc(m.r[1],m.r[2],(v-.5)/.5);
  const r=Math.pow(Math.max(0,dot(n,RIM)),1.3)*m.rimK;
  if(r>0)c=mixc(c,m.rc,Math.min(1,r));
  return hex(c);
 }

 // ---------- meshes ----------
 // Icosphere with a vertex on each pole and x -> -x symmetry, so faces stay mirror-symmetric.
 const icoCache={};
 function ico(detail){
  if(icoCache[detail])return icoCache[detail];
  const g=(1+Math.sqrt(5))/2;
  let verts=[[-1,g,0],[1,g,0],[-1,-g,0],[1,-g,0],[0,-1,g],[0,1,g],[0,-1,-g],[0,1,-g],[g,0,-1],[g,0,1],[-g,0,-1],[-g,0,1]].map(norm);
  let faces=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  for(let d=0;d<detail;d++){
   const cache=new Map(),nf=[];
   const mid=(a,b)=>{const k=a<b?a+'_'+b:b+'_'+a;if(!cache.has(k)){verts.push(norm(lerp3(verts[a],verts[b],.5)));cache.set(k,verts.length-1);}return cache.get(k);};
   for(const[a,b,c]of faces){const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);nf.push([a,ab,ca],[b,bc,ab],[c,ca,bc],[ab,bc,ca]);}
   faces=nf;
  }
  const th=Math.atan2(1,g);
  verts=verts.map(v=>{const r=rotZ(v,th);return[r[2],r[1],r[0]];});
  faces=faces.map(f=>{const[a,b,c]=f.map(i=>verts[i]);return dot(cross(sub(b,a),sub(c,a)),add(add(a,b),c))<0?[f[0],f[2],f[1]]:f;});
  return icoCache[detail]={verts,faces};
 }
 // Make every closed triangle face away from its inside point o.
 function orient(tris){
  for(const t of tris){if(!t.o)continue;const[a,b,c]=t.p;if(dot(cross(sub(b,a),sub(c,a)),sub(centroid(t.p),t.o))<0)t.p=[a,c,b];delete t.o;}
  return tris;
 }
 function blob(detail,center,scale,mat,seed,o={}){
  const{verts,faces}=ico(detail),jit=o.jitter??.08;
  const vs=verts.map(v=>{
   const j=1+(hash3(Math.abs(v[0]),v[1],v[2],seed)-.5)*jit;
   let p=[v[0]*scale[0]*j,v[1]*scale[1]*j,v[2]*scale[2]*j];
   if(o.rot){p=rotZ(p,o.rot[2]||0);p=rotX(p,o.rot[0]||0);p=rotY(p,o.rot[1]||0);}
   p=add(p,center);if(o.floor!=null)p[1]=Math.max(p[1],o.floor);return p;
  });
  return orient(faces.map(f=>({p:f.map(i=>vs[i]),mat,o:center})));
 }
 // Tube along a path: radii are r or [rx,ry]; the cross-section frame keeps `up` as its second axis.
 function tube(path,radii,sides,mat,o={}){
  const rings=[],n=path.length;
  for(let i=0;i<n;i++){
   const T=norm(sub(path[Math.min(i+1,n-1)],path[Math.max(i-1,0)]));
   let up=o.up||[0,0,1];if(Math.abs(dot(up,T))>.95)up=[1,0,0];
   const S=norm(cross(T,up)),U=cross(S,T),r=radii[i],rx=Array.isArray(r)?r[0]:r,ry=Array.isArray(r)?r[1]:r;
   const ring=[];for(let k=0;k<sides;k++){const a=(k+(o.offset??.5))/sides*2*PI;ring.push(add(path[i],add(mul(S,Math.cos(a)*rx),mul(U,Math.sin(a)*ry))));}
   rings.push(ring);
  }
  const tris=[];
  for(let i=0;i<n-1;i++){const c=lerp3(path[i],path[i+1],.5);for(let k=0;k<sides;k++){const a=rings[i][k],b=rings[i][(k+1)%sides],d=rings[i+1][(k+1)%sides],e=rings[i+1][k];tris.push({p:[a,b,d],mat,o:c},{p:[a,d,e],mat,o:c});}}
  const cap=(i,j)=>{const c=lerp3(path[i],path[j],.15);for(let k=0;k<sides;k++)tris.push({p:[path[i],rings[i][k],rings[i][(k+1)%sides]],mat,o:c});};
  if(o.capStart)cap(0,1);if(o.capEnd)cap(n-1,n-2);
  return orient(tris);
 }

 // ---------- head ----------
 // The head is a stack of superellipse cross-sections over t (0 crown .. 1 chin bottom). w/f/b are half-width, front
 // and back depth factors; ny squares the vertical profile (top/bottom); zc pushes the jaw forward; bumps swell it.
 function headForm(spec){
  const W=curve(spec.w),F=curve(spec.f),B=curve(spec.b),Z=curve(spec.zc??0),N=curve(spec.n??2.2);
  const nyT=spec.nyTop??2,nyB=spec.nyBot??2,bumps=spec.bumps||[];
  const prof=t=>{const c=Math.cos(PI*t),ny=c>=0?nyT:nyB;return[.5*spow(c,2/ny),Math.pow(Math.abs(Math.sin(PI*t)),2/ny)];};
  function surf(t,phi){
   const[y,s]=prof(t),n=N(t);let k=1;
   for(const b of bumps)for(const bp of b.phi?[b.phi,-b.phi]:[0]){const d=Math.atan2(Math.sin(phi-bp),Math.cos(phi-bp));k+=b.a*Math.exp(-(((t-b.t)/b.st)**2)-((d/b.sp)**2));}
   const sp=Math.sin(phi),cp=Math.cos(phi);
   return[W(t)*s*k*spow(sp,2/n),y,Z(t)+(cp>=0?F(t):B(t))*s*k*spow(cp,2/n)];
  }
  function normalAt(t,phi){
   const e=2e-3,t0=clamp(t,e,1-e),a=sub(surf(t0+e,phi),surf(t0-e,phi)),b=sub(surf(t0,phi+e),surf(t0,phi-e));
   let n=norm(cross(a,b));const p=surf(t0,phi);if(dot(n,sub(p,[0,p[1],Z(t0)]))<0)n=mul(n,-1);return n;
  }
  const tOfY=Y=>{const ny=Y>=0?nyT:nyB;return Math.acos(clamp(spow(clamp(2*Y,-1,1),ny/2),-1,1))/PI;};
  // The front surface point straight behind face-space (X,Y), so a front view shows features exactly as designed.
  function faceAt(X,Y){
   const t=tOfY(Y);let lo=-PI/2,hi=PI/2;const xmax=surf(t,hi)[0];X=clamp(X,-xmax*.995,xmax*.995);
   for(let i=0;i<40;i++){const m=(lo+hi)/2;if(surf(t,m)[0]<X)lo=m;else hi=m;}
   const phi=(lo+hi)/2;return{p:surf(t,phi),n:normalAt(t,phi),t,phi};
  }
  function mesh(detail,seed,jit){
   const{verts,faces}=ico(detail);
   const vs=verts.map(v=>{
    const side=Math.abs(v[0])<1e-6?0:Math.sign(v[0]),h=k=>hash3(Math.abs(v[0]),v[1],v[2],seed+k)-.5;
    const t=clamp(Math.acos(clamp(v[1],-1,1))/PI+h(1)*jit[0],0,1),phi=Math.atan2(v[0],v[2])+h(2)*jit[1]*side;
    return add(surf(t,phi),mul(normalAt(t,phi),h(3)*jit[2]));
   });
   return faces.map(f=>({p:f.map(i=>vs[i]),mat:'skin'}));
  }
  return{surf,normalAt,faceAt,tOfY,mesh,spec};
 }

 // ---------- hair ----------
 // The hairline is designed as t over |phi| (front, temple, above the ear, behind it, nape); part shifts one side.
 function hairline(h,phi){
  const p=Math.atan2(Math.sin(phi),Math.cos(phi));h._line=h._line||curve(h.line);
  return h._line(Math.abs(p))+(h.part||0)*Math.sin(p)*Math.max(0,Math.cos(p));
 }
 // A cap of staggered rows from the crown down to the hairline, then a lip that drops back to the skin, so the
 // edge reads as a thick mass with a clean designed line rather than a zigzag of skull triangles.
 function hairCap(form,h,seed){
  const C=h.cols||22,R=h.rows||5,vol=h.volume||[],rows=[];
  const at=(t,phi,off)=>add(form.surf(t,phi),mul(form.normalAt(t,phi),off));
  for(let i=1;i<=R+1;i++){
   const ring=[];
   for(let k=0;k<C;k++){
    const j=n=>hash3(i,k,n,seed)-.5,phi=-PI+(k+(i%2)*.5+(i<=R?j(1)*.3:0))/C*2*PI,hl=hairline(h,phi);
    if(i>R){ring.push(at(hl,phi,-.004));continue;}
    const t=hl*Math.pow(i/R,.9)+(i<R?j(2)*.02:0);
    let off=h.thick*(1-.35*Math.pow(i/R,3))+j(3)*h.thick*.35;
    for(const b of vol){const d=Math.atan2(Math.sin(phi-b.phi),Math.cos(phi-b.phi));off+=b.a*Math.exp(-(((t-b.t)/b.st)**2)-((d/b.sp)**2));}
    ring.push(at(t,phi,off));
   }
   rows.push(ring);
  }
  const top=at(0,0,h.thick),tris=[],o=p=>mul(p,.55);
  for(let k=0;k<C;k++){const a=rows[0][k],b=rows[0][(k+1)%C];tris.push({p:[top,a,b],mat:'hair',o:o(centroid([top,a,b]))});}
  for(let i=0;i<R;i++)for(let k=0;k<C;k++){
   const a=rows[i][k],b=rows[i][(k+1)%C],c=rows[i+1][(k+1)%C],d=rows[i+1][k];
   for(const q of(k+i)%2?[[a,b,c],[a,c,d]]:[[a,b,d],[b,c,d]])tris.push({p:q,mat:'hair',o:o(centroid(q))});
  }
  return orient(tris);
 }
 // A chunk is a tapered diamond blade along a curve. Either three skull points [t,phi,lift,...,w,th], or
 // {at:[t,phi], via:[x,y,z], to:[x,y,z], w, th} with via (the bend) and to (the tip) as offsets from the root.
 function chunk(form,c,mat='hair'){
  const P=(t,f,l)=>add(form.surf(t,f),mul(form.normalAt(t,f),l));
  let A,K,C,w,th,curl;
  if(Array.isArray(c)){const[t0,f0,l0,t1,f1,l1,t2,f2,l2]=c,M=P(t1,f1,l1);A=P(t0,f0,l0);C=P(t2,f2,l2);K=sub(mul(M,2),mul(add(A,C),.5));[w,th,curl=0]=c.slice(9);}
  else{A=P(c.at[0],c.at[1],c.sink??.01);K=add(A,c.via);C=add(A,c.to);w=c.w;th=c.th;curl=c.curl||0;}
  const bez=s=>add(add(mul(A,(1-s)*(1-s)),mul(K,2*s*(1-s))),mul(C,s*s));
  const segs=5,rings=[],spine=[];
  for(let i=0;i<segs;i++){
   const s=i/segs,p=bez(s),T=norm(sub(bez(s+.01),bez(Math.max(0,s-.01))));
   let U=norm(sub(p,[0,0,0]));U=norm(sub(U,mul(T,dot(U,T))));let S=norm(cross(T,U));
   if(curl){const a=curl*s;const S2=add(mul(S,Math.cos(a)),mul(U,Math.sin(a)));U=norm(cross(S2,T));S=S2;}
   const pr=Math.pow(Math.sin(PI*Math.min(1,.22+s*.78)),.7);
   rings.push([add(p,mul(S,w*pr)),add(p,mul(U,th*pr)),add(p,mul(S,-w*pr)),add(p,mul(U,-th*pr*.55))]);spine.push(p);
  }
  const tip=bez(1),tris=[];
  for(let i=0;i<segs-1;i++){const o=lerp3(spine[i],spine[i+1],.5);for(let k=0;k<4;k++){const a=rings[i][k],b=rings[i][(k+1)%4],d=rings[i+1][(k+1)%4],e=rings[i+1][k];tris.push({p:[a,b,d],mat,o},{p:[a,d,e],mat,o});}}
  const o=lerp3(spine[segs-1],tip,.3);for(let k=0;k<4;k++)tris.push({p:[rings[segs-1][k],rings[segs-1][(k+1)%4],tip],mat,o});
  return orient(tris);
 }

 // ---------- glasses: round rims with depth, a bridge and temples, all ink ----------
 function glasses(form,g,ear){
  const tris=[],quad=(a,b,c,d)=>tris.push({p:[a,b,c],mat:'ink',two:1},{p:[a,c,d],mat:'ink',two:1});
  const inner={},outer={};
  for(const side of[-1,1]){
   const fa=form.faceAt(side*g.x,g.y),pn=norm(lerp3([0,0,1],fa.n,g.wrap)),ux=norm(cross([0,1,0],pn)),uy=cross(pn,ux);
   const c=add(fa.p,mul(pn,g.gap)),R=(r,a,d)=>add(add(c,mul(add(mul(ux,Math.cos(a)),mul(uy,Math.sin(a))),r)),mul(pn,d));
   for(let k=0;k<g.segs;k++){
    const a=(k+.5)/g.segs*2*PI,b=(k+1.5)/g.segs*2*PI,ro=g.r+g.w/2,ri=g.r-g.w/2,d=g.d/2;
    quad(R(ro,a,d),R(ro,b,d),R(ri,b,d),R(ri,a,d));quad(R(ro,a,-d),R(ro,b,-d),R(ro,b,d),R(ro,a,d));quad(R(ri,a,d),R(ri,b,d),R(ri,b,-d),R(ri,a,-d));
   }
   inner[side]=R(g.r,side>0?PI:0,0);outer[side]=R(g.r+g.w*.3,side>0?.12:PI-.12,0);
  }
  const mid=add(lerp3(inner[-1],inner[1],.5),[0,g.bridgeLift??.012,.004]);
  tris.push(...tube([inner[-1],lerp3(inner[-1],mid,.6),lerp3(inner[1],mid,.6),inner[1]],[g.w*.32,g.w*.32,g.w*.32,g.w*.32],4,'ink').map(t=>({...t,two:1})));
  for(const side of[-1,1]){const e=ear(side),m=lerp3(outer[side],e,.5);tris.push(...tube([outer[side],[m[0]+side*.012,m[1]+.006,m[2]],e],[g.w*.26,g.w*.26,g.w*.22],4,'ink').map(t=>({...t,two:1})));}
  return tris;
 }

 // ---------- face features (face space: X right, Y up, head units) ----------
 // Shapes are sampled column by column: visible where the lowest top curve is above the highest bottom curve.
 function band(x0,x1,tops,bots,N=36){
  const top=x=>Math.min(...tops.map(f=>f(x))),bot=x=>Math.max(...bots.map(f=>f(x))),T=[],Bt=[];
  for(let i=0;i<=N;i++){const x=x0+(x1-x0)*i/N,a=top(x),b=bot(x);if(a>b){T.push([x,a]);Bt.push([x,b]);}}
  return T.length<2?null:T.concat(Bt.reverse());
 }
 const ellTop=(cx,cy,rx,ry)=>x=>{const q=1-((x-cx)/rx)**2;return q<0?-9:cy+ry*Math.sqrt(q);};
 const ellBot=(cx,cy,rx,ry)=>x=>{const q=1-((x-cx)/rx)**2;return q<0?9:cy-ry*Math.sqrt(q);};
 const circle=(cx,cy,r,N=20)=>Array.from({length:N},(_,i)=>[cx+r*Math.cos(i/N*2*PI),cy+r*Math.sin(i/N*2*PI)]);
 // A curved bar along y(u), u from -1 (inner end) to 1 (outer end), thickness th(u); returns a polygon.
 function bar(xAt,yAt,thAt,N=18){
  const T=[],Bt=[];
  for(let i=0;i<=N;i++){
   const u=-1+2*i/N,x=xAt(u),y=yAt(u),e=.01,dx=xAt(u+e)-xAt(u-e),dy=yAt(u+e)-yAt(u-e),l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l,h=thAt(u)/2;
   T.push([x+nx*h,y+ny*h]);Bt.push([x-nx*h,y-ny*h]);
  }
  return T.concat(Bt.reverse());
 }
 const roundEnds=(th,p=6)=>u=>th*Math.pow(Math.max(0,1-Math.abs(u)**p),.5);
 // Mouth: corners at +-w lifted by s; top bulge u; opening o; w/th scale width and line weight; shift slides it sideways.
 function mouthShapes(m,f,style){
  const out=mouthAt(m,f,style),dx=f.shift||0;
  return dx?out.map(o=>({...o,pts:o.pts.map(([x,y])=>[x+dx,y])})):out;
 }
 function mouthAt(m,f,style){
  f={s:0,...f};const w=m.w*(f.w||1),cy=m.y,q=x=>(x/w)**2,out=[];
  const as=x=>(f.asym||0)*x/w;
  const top=x=>cy+f.s*q(x)+(f.u||0)*Math.sqrt(Math.max(0,1-q(x)))+as(x);
  if((f.o||0)<.006){
   const th=m.th*(f.th||1);out.push({pts:bar(u=>u*w,u=>cy+f.s*u*u+as(u*w),u=>th*Math.pow(Math.max(0,1-Math.abs(u)**4),.6)),fill:'ink'});
   return out;
  }
  const bot=x=>cy+f.s*q(x)-f.o*Math.pow(Math.max(0,1-q(x)),f.round?.5:.75)+as(x);
  const shape=band(-w,w,[top],[bot],40);if(!shape)return out;
  out.push({pts:shape,fill:'mouth'});
  if(style.teeth&&f.teeth){const tb=band(-w*.8,w*.8,[top],[bot,x=>top(x)-f.o*(f.teethH||.32)],30);if(tb)out.push({pts:tb,fill:'teeth'});}
  const tw=w*(f.round?.7:.62),tg=band(-tw,tw,[x=>bot(x)+f.o*.5*Math.max(0,1-(x/tw)**2),top],[bot],30);if(tg)out.push({pts:tg,fill:'tongue'});
  if(m.line){out.push({pts:bar(u=>u*w*1.02,u=>top(u*w),u=>m.line*Math.pow(Math.max(0,1-Math.abs(u)**6),.5)),fill:'ink'});}
  return out;
 }
 // Each eye style is one way for eyes, lids and brows to carry feeling.
 const EYES={
  // Ink ovals; skin lids cut them (a flat top lid, a rising lower lid makes the happy crescent).
  ink(e,f,side){
   const cx=side*e.x+(f.gaze?.[0]||0)*.5,cy=e.y+(f.gaze?.[1]||0)*.4,rx=e.rx*(f.eyeScale||1),ry=e.ry*(f.eyeScale||1),u=x=>side*(x-cx)/rx;
   const U=x=>cy+ry*(1-2*(f.lidU||0))+ry*(f.lidSlope||0)*u(x);
   const L=x=>cy-ry+2*ry*(f.lidL||0)-ry*(f.lidArc||0)*u(x)**2;
   const s=band(cx-rx,cx+rx,[ellTop(cx,cy,rx,ry),U],[ellBot(cx,cy,rx,ry),L],40);
   return s?[{pts:s,fill:'ink'}]:[];
  },
  // Almond whites with a small pupil and glint under a heavy lash line.
  white(e,f,side){
   const cx=side*e.x,cy=e.y,hw=e.hw*(f.eyeScale||1),u=x=>side*(x-cx)/hw,out=[];
   const lift=e.tilt||0,hu=e.hu*(f.eyeScale||1)*(1-(f.lidU||0)),hl=e.hl*(f.eyeScale||1);
   const top=x=>{const k=Math.max(0,1-u(x)**2);return cy+lift*u(x)+hu*Math.pow(k,.55)+(f.lidSlope||0)*hu*u(x)*k;};
   const bot=x=>{const k=Math.max(0,1-u(x)**2);return cy+lift*u(x)-hl*Math.pow(k,.8)*(1-2*(f.lidL||0))+(f.lidL||0)*hl*(f.lidArc||0)*k;};
   const s=band(cx-hw,cx+hw,[top],[bot],40);if(!s)return out;
   out.push({pts:s,fill:'white'});
   const px=cx+(f.gaze?.[0]||0),py=cy+(f.gaze?.[1]||0)+hu*.1,pr=e.pr*(f.pupil||1);
   const p=band(px-pr,px+pr,[top,ellTop(px,py,pr,pr)],[bot,ellBot(px,py,pr,pr)],24);if(p)out.push({pts:p,fill:'ink'});
   const gx=px+pr*.38,gy=py+pr*.38,gr=pr*.3,g=band(gx-gr,gx+gr,[top,ellTop(gx,gy,gr,gr)],[bot,ellBot(gx,gy,gr,gr)],12);if(g)out.push({pts:g,fill:'glint'});
   out.push({pts:bar(v=>cx+side*hw*1.08*v+side*hw*.04,v=>top(cx+side*hw*.98*v)+(v>.7?(v-.7)*hw*.35:0),v=>e.lash*(v<-.85?.6:1)*(v>.9?1-(v-.9)*6:1)),fill:'ink'});
   return out;
  },
  // Big ink pupils with two glints; a heavy upper lid line cuts them and carries the mood.
  glossy(e,f,side){
   const gx0=f.gaze?.[0]||0,gy0=f.gaze?.[1]||0,cx=side*e.x+gx0,cy=e.y+gy0*.8,rx=e.rx*(f.eyeScale||1),ry=e.ry*(f.eyeScale||1),u=x=>side*(x-cx)/rx,out=[];
   const lx=side*e.x+gx0*.3,ly=e.y+gy0*.25;
   const U=x=>cy+ry*(1-2*(f.lidU||0))+ry*(f.lidSlope||0)*u(x)-ry*.12*u(x)**2;
   const L=x=>cy-ry+2*ry*(f.lidL||0)-ry*(f.lidArc||0)*u(x)**2;
   if((f.lidU||0)>=.97){const X=v=>cx+v*rx*1.1;out.push({pts:bar(X,v=>cy-ry*.28+ry*.3*v*v,v=>e.lid*1.15*Math.pow(Math.max(0,1-Math.abs(v)**6),.5)),fill:'ink'});return out;}
   const s=band(cx-rx,cx+rx,[ellTop(cx,cy,rx,ry),U],[ellBot(cx,cy,rx,ry),L],40);if(!s)return out;
   out.push({pts:s,fill:'ink'});
   for(const[gx,gy,gr]of[[lx+rx*.32,ly+ry*.3,rx*.3],[lx-rx*.3,ly-ry*.38,rx*.13]]){const g=band(gx-gr,gx+gr,[ellTop(gx,gy,gr,gr),ellTop(cx,cy,rx,ry),U],[ellBot(gx,gy,gr,gr),ellBot(cx,cy,rx,ry),L],14);if(g)out.push({pts:g,fill:'glint'});}
   if((f.lidU||0)>.02||f.lidSlope){const x0=cx-rx*1.1,x1=cx+rx*1.1,X=v=>x0+(x1-x0)*(v+1)/2;out.push({pts:bar(X,v=>clamp(U(X(v)),cy-ry,cy+ry*1.02)+e.lid*.3,v=>e.lid*Math.pow(Math.max(0,1-Math.abs(v)**6),.5)),fill:'ink'});}
   return out;
  }
 };
 function browShapes(br,f,side){
  const cx=side*br.x,cy=br.y+(f.browLift||0)+(f.browUp?.[side>0?1:0]||0),hl=br.len/2,tilt=f.browTilt||0,arch=br.arch+(f.browArch||0);
  const xAt=u=>cx+side*u*hl,yAt=u=>cy-tilt*u*.5+arch*(1-u*u)+(br.kink?br.kink*Math.max(0,u-.2):0);
  const th=br.taper?(u=>br.th*(1-.55*(u+1)/2)*Math.pow(Math.max(0,1-Math.abs(u)**8),.5)):roundEnds(br.th);
  return[{pts:bar(xAt,yAt,th),fill:'ink'}];
 }
 function faceFeatures(ch,f){
  const d=ch.spec.face,out=[];
  for(const side of[-1,1]){out.push(...EYES[d.eyes.style](d.eyes,f,side));out.push(...browShapes(d.brows,f,side));}
  out.push(...mouthShapes(d.mouth,f.mouth||{s:.01},d.mouth));
  return out;
 }

 // ---------- body ----------
 function trunkRings(rings,sides,mat){
  const R=rings.map(([y,hw,fd,bd,n])=>Array.from({length:sides},(_,k)=>{const a=(k+.5)/sides*2*PI,sp=Math.sin(a),cp=Math.cos(a);return[hw*spow(sp,2/n),y,(cp>=0?fd:bd)*spow(cp,2/n)];}));
  const tris=[];
  for(let i=0;i<R.length-1;i++){const o=[0,(rings[i][0]+rings[i+1][0])/2,0];for(let k=0;k<sides;k++){const a=R[i][k],b=R[i][(k+1)%sides],c=R[i+1][(k+1)%sides],d=R[i+1][k];tris.push({p:[a,b,c],mat,o},{p:[a,c,d],mat,o});}}
  const L=R.length-1,top=[0,rings[0][0]-.02,0],bot=[0,rings[L][0]+.03,0];
  for(let k=0;k<sides;k++){tris.push({p:[top,R[0][(k+1)%sides],R[0][k]],mat,o:[0,top[1]-.1,0]});tris.push({p:[bot,R[L][k],R[L][(k+1)%sides]],mat,o:[0,bot[1]+.1,0]});}
  return orient(tris);
 }
 function trunkAt(rings,x,y){
  let i=0;while(i<rings.length-2&&y<rings[i+1][0])i++;
  const a=rings[i],b=rings[i+1],t=clamp((y-a[0])/(b[0]-a[0]),0,1),hw=a[1]+(b[1]-a[1])*t,fd=a[2]+(b[2]-a[2])*t,n=a[4]+(b[4]-a[4])*t;
  const z=X=>fd*Math.pow(Math.max(0,1-Math.abs(X/hw)**n),1/n);
  return{p:[x,y,z(x)],n:norm([-(z(x+.01)-z(x-.01))/.02,0,1])};
 }
 // Mitten hand with a thumb, built in hand space (x across toward the thumb, y from the wrist to the fingertips, z out of
 // the palm) and placed at the wrist. pose: open, relaxed, fist or point.
 function hand(pose,size,seed){
  const L=size[1]*2,W=size[0],T=size[2],curl={open:0,relaxed:.35,fist:1,point:1}[pose]??.35,tris=[];
  // Palm and fingers are one mitten; curling shortens it, thickens it and tips it toward the palm side.
  tris.push(...blob(1,[0,L*(.52-.12*curl),T*.18*curl],[W,L*(.55-.13*curl),T*(.5+.38*curl)],'skin',seed,{rot:[-.35*curl,0,0],jitter:.04}));
  // Thumb: out to the side when open, along the mitten when relaxed, across the front of the fist.
  const th=curl>.6?{c:[W*.25,L*.5,T*.82],s:[W*.3,L*.24,W*.3],r:[-.2,0,-1.35]}:{c:[W*(1-.22*curl),L*(.36+.06*curl),T*(.12+.2*curl)],s:[W*.3,L*.29,W*.3],r:[0,0,-.7+.45*curl]};
  tris.push(...blob(1,th.c,th.s,'skin',seed+2,{rot:th.r,jitter:.04}));
  if(pose==='point')tris.push(...tube([[W*.28,L*.55,T*.42],[W*.32,L*.92,T*.38],[W*.34,L*1.2,T*.34]],[W*.4,W*.37,W*.32],6,'skin',{capEnd:1,up:[1,0,0]}));
  return tris;
 }
 // Move hand-space parts to the wrist: x along B, y along D (wrist to fingers), z along C (palm normal).
 function place(tris,origin,B,D,C){
  const flip=dot(B,cross(D,C))<0;
  return tris.map(t=>{const q=t.p.map(p=>add(origin,add(add(mul(B,p[0]),mul(D,p[1])),mul(C,p[2]))));return{...t,p:flip?[q[0],q[2],q[1]]:q};});
 }
 function bodyParts(spec){
  const b=spec.body,objs=[];
  const trunk=trunkRings(b.trunk,12,'hood');
  const hood=tube(Array.from({length:9},(_,i)=>{const a=rad(b.hood.from+(360-2*b.hood.from)*i/8);return[b.hood.ax*Math.sin(a),b.hood.y-b.hood.drop*(1-Math.cos(a))/2,b.hood.az*Math.cos(a)-.01];}),Array(9).fill(b.hood.r),6,'hood',{up:[0,1,0],capStart:1,capEnd:1});
  const decals=[];
  const onTrunk=(pts,fill,lift=.006)=>({pts:pts.map(([x,y])=>{const s=trunkAt(b.trunk,x,y);return add(s.p,mul(s.n,lift));}),n:trunkAt(b.trunk,0,pts[0][1]).n,fill});
  const pk=b.pocket;decals.push(onTrunk([[-pk.tw,pk.top],[pk.tw,pk.top],[pk.bw,pk.bot],[-pk.bw,pk.bot]],{mat:'hoodDark',k:1}));
  decals.push(onTrunk([[-pk.tw,pk.top],[pk.tw,pk.top],[pk.tw*.98,pk.top-.012],[-pk.tw*.98,pk.top-.012]],{mat:'hoodDark',k:.6},.007));
  for(const s of[-1,1]){const x=s*b.strings.x;decals.push(onTrunk([[x-.008,b.strings.top],[x+.008,b.strings.top],[x+.008+s*.004,b.strings.bot],[x-.008+s*.004,b.strings.bot]],'string',.012));}
  // The hood lies on the upper back below the collar roll.
  const hp=b.hood.pouch||[.16,.13,.05],pouch=blob(1,[0,b.hood.y-hp[1]*.85,-b.hood.az-hp[2]*.4],hp,'hood',71,{rot:[.35,0,0],jitter:.05});
  objs.push({id:'trunk',tris:trunk.concat(hood,pouch),decals,bias:0});
  for(const s of[-1,1]){
   const a=b.arm,P=p=>[s*p[0],p[1],p[2]],sh=P(a.shoulder),el=P(a.elbow),wr=P(a.wrist),dir=norm(sub(wr,el));
   const arm=tube([sh,el,wr],[a.r[0],a.r[1],a.r[2]],7,'hood',{capStart:1});
   const cuff=tube([sub(wr,mul(dir,.01)),add(wr,mul(dir,a.cuff))],[a.r[2]*1.12,a.r[2]*1.08],7,'hoodDark',{capStart:1,capEnd:1});
   const C=[-s,0,0],B=mul(norm(cross(C,dir)),s),hd=place(hand(a.pose||'relaxed',a.hand,31+s),add(wr,mul(dir,a.cuff*.6)),B,dir,C);
   objs.push({id:'arm'+s,tris:arm.concat(cuff,hd),decals:[],bias:0});
   const l=b.leg,hip=[s*l.x,l.top,0],ank=[s*l.x,l.bot,0];
   objs.push({id:'leg'+s,tris:tube([hip,ank],[l.r,l.r*.92],7,'pants',{capEnd:1}),decals:[],bias:-5});
   const sc=[s*l.x,b.ground+l.shoe[1]*.5,l.shoe[2]*.35];
   objs.push({id:'shoe'+s,tris:blob(1,sc,l.shoe,'shoe',51+s,{floor:b.ground+l.shoe[1]*.28}).concat(blob(1,[sc[0],b.ground+l.shoe[1]*.12,sc[2]],[l.shoe[0]*1.08,l.shoe[1]*.3,l.shoe[2]*1.05],'sole',61+s,{jitter:.02})),decals:[],bias:-4});
  }
  return objs;
 }

 // ---------- character ----------
 function build(spec){
  const form=headForm(spec.head),seed=spec.seed||7;
  const head=form.mesh(spec.head.detail??2,seed,spec.head.jitter||[.012,.05,.012]);
  const attach=[],F=spec.face;
  const earAt=side=>{const fa=form.faceAt(0,F.ear.y),t=fa.t;return add(form.surf(t,side*PI/2),[-side*F.ear.size[0]*.25,0,F.ear.z||0]);};
  for(const side of[-1,1])attach.push(...blob(1,earAt(side),F.ear.size,'skin',11+side,{rot:[-.12,-side*(F.ear.turn??.5),side*.1]}));
  const na=form.faceAt(0,F.nose.y);attach.push(...blob(F.nose.detail??1,add(na.p,mul(na.n,F.nose.size[2]*(F.nose.out??.35))),F.nose.size,'skin',21,{rot:[F.nose.tip||0,0,0],jitter:.04}));
  const earTop=side=>{const e=earAt(side);return[e[0]+side*F.ear.size[0]*.4,e[1]+F.ear.size[1]*.55,e[2]-F.ear.size[2]*.2];};
  attach.push(...glasses(form,F.glasses,earTop));
  attach.push(...hairCap(form,spec.hair,seed+100));
  for(const c of spec.hair.chunks)attach.push(...chunk(form,c));
  const neck=tube([[0,-.3,spec.body.neck.z],[0,spec.body.neck.bot,spec.body.neck.z]],[spec.body.neck.r,spec.body.neck.r*1.05],7,'neck',{capEnd:1});
  return{spec,form,head,attach,neck,body:bodyParts(spec),pivot:[0,-.42,0]};
 }

 // ---------- render ----------
 const f4=v=>Math.round(v*1e4)/1e4;
 const ptsAttr=q=>q.map(p=>f4(p[0])+','+f4(-p[1])).join(' ');
 let uid=0;
 // view: {yaw, pitch} for the whole figure (deg, + turns the face to screen-right), pose: head {roll,pitch,yaw}, face: expression.
 function render(ch,view={}){
  const yaw=rad(view.yaw||0),pitch=rad(view.pitch||0),pose=view.pose||{},pv=ch.pivot;
  const V=p=>rotX(rotY(p,yaw),pitch);
  const H=p=>{let q=sub(p,pv);q=rotZ(q,rad(pose.roll||0));q=rotX(q,rad(pose.pitch||0));q=rotY(q,rad(pose.yaw||0));return V(add(q,pv));};
  const prep=(tris,X,k)=>{const out=[];for(const t of tris){const q=t.p.map(X);let n=norm(cross(sub(q[1],q[0]),sub(q[2],q[0])));if(n[2]<=1e-5){if(!t.two)continue;n=mul(n,-1);}out.push({q,z:centroid(q)[2],fill:shade(t.mat,n,k)});}return out;};
  const head=prep(ch.head,H);
  const occ=head.map(t=>{const[a,b,c]=t.q;return{a,b,c,x0:Math.min(a[0],b[0],c[0]),x1:Math.max(a[0],b[0],c[0]),y0:Math.min(a[1],b[1],c[1]),y1:Math.max(a[1],b[1],c[1])};});
  const behind=p=>{for(const o of occ){if(p[0]<o.x0||p[0]>o.x1||p[1]<o.y0||p[1]>o.y1)continue;const{a,b,c}=o,d=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(d)<1e-12)continue;const l1=((b[1]-c[1])*(p[0]-c[0])+(c[0]-b[0])*(p[1]-c[1]))/d,l2=((c[1]-a[1])*(p[0]-c[0])+(a[0]-c[0])*(p[1]-c[1]))/d,l3=1-l1-l2;if(l1<-1e-6||l2<-1e-6||l3<-1e-6)continue;if(l1*a[2]+l2*b[2]+l3*c[2]>p[2]+1e-4)return true;}return false;};
  const hidden=t=>{const c=centroid(t.q);return[c,...t.q.map(p=>lerp3(p,c,.12)),...[0,1,2].map(i=>lerp3(lerp3(t.q[i],t.q[(i+1)%3],.5),c,.08))].some(behind);};
  const back=[],front=[];
  for(const t of prep(ch.attach,H))(hidden(t)?back:front).push(t);
  for(const t of prep(ch.neck,H))back.push(t);
  const bodyObjs=[];
  for(const o of ch.body){
   const ts=prep(o.tris,V),keep=[];for(const t of ts)(hidden(t)?back:keep).push(t);
   const decals=o.decals.map(d=>{const q=d.pts.map(V),n=V(d.n);if(n[2]<=0)return null;return{q,fill:typeof d.fill==='string'?MAT[d.fill].flat:shade(d.fill.mat,n,d.fill.k)};}).filter(Boolean);
   const z=ts.length?ts.reduce((s,t)=>s+t.z,0)/ts.length:0;bodyObjs.push({keep,decals,key:z+o.bias});
  }
  // Face features wrapped onto the head and clipped to its outline.
  const face=[];
  for(const s of faceFeatures(ch,view.face||{})){
   const pts=s.pts.map(([x,y])=>{const fa=ch.form.faceAt(x,y);return H(add(fa.p,mul(fa.n,.004)));});
   const fa=ch.form.faceAt(...s.pts[0]),n=norm(sub(H(add(fa.p,fa.n)),H(fa.p)));
   if(n[2]<.02)continue;
   face.push({q:pts,fill:s.fill==='skin'?shade('skin',n):MAT[s.fill].flat});
  }
  back.sort((a,b)=>a.z-b.z);head.sort((a,b)=>a.z-b.z);front.sort((a,b)=>a.z-b.z);bodyObjs.sort((a,b)=>a.key-b.key);
  const poly=t=>'<polygon points="'+ptsAttr(t.q)+'" fill="'+t.fill+'" stroke="'+t.fill+'"/>';
  const id='hc'+(++uid);
  let svg='<clipPath id="'+id+'"><path d="'+head.map(t=>'M'+ptsAttr(t.q).replace(/ /g,'L')+'Z').join('')+'"/></clipPath>';
  svg+=back.map(poly).join('')+head.map(poly).join('');
  svg+='<g clip-path="url(#'+id+')">'+face.map(poly).join('')+'</g>';
  for(const o of bodyObjs){o.keep.sort((a,b)=>a.z-b.z);svg+=o.keep.map(poly).join('')+o.decals.map(poly).join('');}
  svg+=front.map(poly).join('');
  const all=[...back,...head,...front,...bodyObjs.flatMap(o=>o.keep)].flatMap(t=>t.q);
  const bb=[Math.min(...all.map(p=>p[0])),Math.min(...all.map(p=>-p[1])),Math.max(...all.map(p=>p[0])),Math.max(...all.map(p=>-p[1]))];
  const hb=head.flatMap(t=>t.q).concat(front.flatMap(t=>t.q));
  const headBox=[Math.min(...hb.map(p=>p[0])),Math.min(...hb.map(p=>-p[1])),Math.max(...hb.map(p=>p[0])),Math.max(...hb.map(p=>-p[1]))];
  const sk=head.flatMap(t=>t.q),skullBox=[Math.min(...sk.map(p=>p[0])),Math.min(...sk.map(p=>-p[1])),Math.max(...sk.map(p=>p[0])),Math.max(...sk.map(p=>-p[1]))];
  return{svg,bbox:bb,headBox,skullBox};
 }
 // Draw loose parts (e.g. a hand) with the same light, no head: rotate by yaw/pitch/roll, cull and depth-sort.
 function renderParts(tris,view={}){
  const X=p=>rotX(rotY(rotZ(p,rad(view.roll||0)),rad(view.yaw||0)),rad(view.pitch||0)),out=[];
  for(const t of tris){const q=t.p.map(X);const n=norm(cross(sub(q[1],q[0]),sub(q[2],q[0])));if(n[2]<=1e-5)continue;out.push({q,z:centroid(q)[2],fill:shade(t.mat,n)});}
  out.sort((a,b)=>a.z-b.z);
  const all=out.flatMap(t=>t.q);
  return{svg:out.map(t=>'<polygon points="'+ptsAttr(t.q)+'" fill="'+t.fill+'" stroke="'+t.fill+'"/>').join(''),bbox:[Math.min(...all.map(p=>p[0])),Math.min(...all.map(p=>-p[1])),Math.max(...all.map(p=>p[0])),Math.max(...all.map(p=>-p[1]))]};
 }
 return{build,render,renderParts,hand,place,tube,headForm,curve,shade,MAT,KEY,RIM};
});
