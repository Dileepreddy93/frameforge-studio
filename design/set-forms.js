/* FrameForge set forms (M5.1): set pieces drawn as flat-shaded SVG in perspective for the 2D set directions.
   The light is the characters' (design/dev-forms.js: a warm key from camera-right, a blue rim from behind-left, both in
   view space), the colours are STYLE.md's, and the approved cast are drawn by their own renderers at true scale, so a
   direction's numbers carry into the three.js build. App windows are element lists (rects, circles, text, lines) in a
   1000-px-wide frame, so the same layouts can later be drawn onto the studio's canvas screens.
   Units: DEV's (he stands 2 tall), y up, x right, z toward the front of the set; the ground is y = 0. */
(function(root,factory){
 const lib=factory(root.FrameForgeDesign||(typeof require==='function'?require('./dev-forms.js'):null));
 if(typeof module==='object'&&module.exports)module.exports=lib;
 else root.FrameForgeSet=lib;
})(typeof globalThis!=='undefined'?globalThis:this,function(D){
 'use strict';
 const PI=Math.PI;
 const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],mul=(a,s)=>[a[0]*s,a[1]*s,a[2]*s];
 const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const norm=a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l];};
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const rad=d=>d*PI/180;
 const rotX=(p,a)=>{const c=Math.cos(a),s=Math.sin(a);return[p[0],p[1]*c-p[2]*s,p[1]*s+p[2]*c];};
 const rotY=(p,a)=>{const c=Math.cos(a),s=Math.sin(a);return[p[0]*c+p[2]*s,p[1],-p[0]*s+p[2]*c];};
 const centroid=q=>mul(q.reduce(add,[0,0,0]),1/q.length);
 const f2=v=>(Math.round(v*100)/100).toString();
 // Newell normal: robust for any planar polygon, whatever its winding.
 const newell=q=>{let n=[0,0,0];for(let i=0;i<q.length;i++){const a=q[i],b=q[(i+1)%q.length];n=add(n,[(a[1]-b[1])*(a[2]+b[2]),(a[2]-b[2])*(a[0]+b[0]),(a[0]-b[0])*(a[1]+b[1])]);}return norm(n);};
 function hash(i,seed=1){let h=Math.imul(i+seed*7919,2654435761);h^=h>>>15;h=Math.imul(h,2246822507);h^=h>>>13;return((h^(h>>>16))>>>0)/4294967296;}

 // ---------- materials (STYLE.md: desk #353790 to a #5F418C pool, keys #754DA6, bezel #0B0A12, void #100C1B) ----------
 const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
 const hex=c=>'#'+c.map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('');
 const mixHex=(a,b,t)=>{const A=rgb(a),B=rgb(b);return hex(A.map((v,i)=>v+(B[i]-v)*t));};
 const MAT=D.MAT;
 Object.assign(MAT,{
  deck:{ramp:['#07060F','#1A1736','#34306A'],amb:.06,rim:'#5C6FB8',rimK:.45},
  pad:{ramp:['#0A0818','#221E46','#433C80'],amb:.06,rim:'#6A7CC8',rimK:.4},
  keycap:{ramp:['#07060F','#221C44','#4E3F8C'],amb:.06,rim:'#7F9CFF',rimK:.5},
  keyViolet:{ramp:['#120B26','#4A3480','#754DA6'],amb:.06,rim:'#8F86E0',rimK:.45},
  desk:{ramp:['#0D0A24','#272870','#353790'],amb:.06,rim:'#8F86E0',rimK:.35},
  case:{ramp:['#060510','#16142A','#2E2B50'],amb:.05,rim:'#5C6FB8',rimK:.55},
  setBezel:{ramp:['#050409','#0B0A12','#22213A'],amb:.05,rim:'#4D5C9C',rimK:.6},
  lid:{ramp:['#06050C','#15132A','#2C2950'],amb:.05,rim:'#5C6FB8',rimK:.6},
  mug:{ramp:['#0B1216','#2F4A52','#6A8487'],amb:.06,rim:'#7FA6D9',rimK:.55},
  note:{ramp:['#2E220A','#8E6E22','#D9AE48'],amb:.08,rim:'#B9A8E0',rimK:.3},
  frame:{ramp:['#050409','#100E1E','#24213E'],amb:.05,rim:'#4D5C9C',rimK:.55},
  coffee:{flat:'#1A0D08'}
 });
 for(const m of Object.values(MAT))if(m.ramp&&!m.r){m.r=m.ramp.map(rgb);m.rc=rgb(m.rim);}
 const SCREEN={glass:'#151029',bar:'#1B1534',title:'#A7A1C7',label:'#676284',bad:'#FC5757',badRule:'#E05553',badTint:'#471C30',
  badRow:'#31182D',good:'#44E082',goodRule:'#3A9A66',goodTint:'#16302A',code:'#79C5FF',dim:'#3A3461',amber:'#DEA32F',green:'#23A93B'};
 const MONO='"Ubuntu Sans Mono","JetBrains Mono","DejaVu Sans Mono",monospace';

 // ---------- solids: each returns {polys:[{p,mat|fill}], anchor}; normals come from the points ----------
 // A solid's faces are culled when they face away from the camera; flat faces (screens) are two-sided.
 function solid(polys,anchor,o={}){
  const c=anchor||centroid(polys.flatMap(p=>p.p));
  for(const f of polys){const n=newell(f.p);f.n=dot(n,sub(centroid(f.p),c))<0?mul(n,-1):n;}
  return{polys,anchor:c,solid:true,...o};
 }
 // Axis box [x0,y0,z0]..[x1,y1,z1], optionally turned by ry degrees about its centre. top: a different material for the top.
 function box(a,b,mat,o={}){
  const c=[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2],h=[(b[0]-a[0])/2,(b[1]-a[1])/2,(b[2]-a[2])/2];
  const P=(sx,sy,sz)=>add(c,rotY([sx*h[0],sy*h[1],sz*h[2]],rad(o.ry||0)));
  const faces=[[[1,-1,-1],[1,1,-1],[1,1,1],[1,-1,1]],[[-1,-1,1],[-1,1,1],[-1,1,-1],[-1,-1,-1]],
   [[-1,1,-1],[-1,1,1],[1,1,1],[1,1,-1]],[[-1,-1,1],[-1,-1,-1],[1,-1,-1],[1,-1,1]],
   [[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]]];
  const polys=faces.map((f,i)=>({p:f.map(s=>P(...s)),mat:i===2&&o.top?o.top:mat}));
  // A big top can be cut into tiles so the light pool shades it face by face.
  if(o.tile){
   const top=polys.splice(2,1)[0],nx=Math.max(1,Math.round((b[0]-a[0])/o.tile)),nz=Math.max(1,Math.round((b[2]-a[2])/o.tile));
   for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){
    const x0=a[0]+(b[0]-a[0])*i/nx,x1=a[0]+(b[0]-a[0])*(i+1)/nx,z0=a[2]+(b[2]-a[2])*j/nz,z1=a[2]+(b[2]-a[2])*(j+1)/nz;
    polys.push({p:[[x0,b[1],z0],[x0,b[1],z1],[x1,b[1],z1],[x1,b[1],z0]],mat:top.mat});
   }
  }
  return solid(polys,c,o);
 }
 // A keycap: a frustum from a base footprint to a smaller top, rising h from y0. tilt leans the top back (sculpted rows).
 function key(cx,y0,cz,base,top,h,mat,o={}){
  const [bw,bd]=base,[tw,td]=top,lean=o.lean||0;
  const B=[[cx-bw/2,y0,cz-bd/2],[cx+bw/2,y0,cz-bd/2],[cx+bw/2,y0,cz+bd/2],[cx-bw/2,y0,cz+bd/2]];
  const T=[[cx-tw/2,y0+h+lean,cz-td/2-.02],[cx+tw/2,y0+h+lean,cz-td/2-.02],[cx+tw/2,y0+h-lean,cz+td/2-.02],[cx-tw/2,y0+h-lean,cz+td/2-.02]];
  const polys=[{p:T,mat:o.topMat||mat}];
  for(let i=0;i<4;i++)polys.push({p:[B[i],B[(i+1)%4],T[(i+1)%4],T[i]],mat});
  return solid(polys,[cx,y0+h/2,cz],o);
 }
 // An n-sided prism (mug, plaza disc): centre of the base c, radius r, height h.
 function prism(c,r,h,n,mat,o={}){
  const ring=y=>Array.from({length:n},(_,i)=>{const a=2*PI*(i+.5)/n;return[c[0]+r*Math.cos(a),y,c[2]+r*Math.sin(a)];});
  const lo=ring(c[1]),hi=ring(c[1]+h),polys=[{p:hi.slice().reverse(),mat:o.top||mat}];
  for(let i=0;i<n;i++)polys.push({p:[lo[i],lo[(i+1)%n],hi[(i+1)%n],hi[i]],mat});
  return solid(polys,[c[0],c[1]+h/2,c[2]],o);
 }

 // ---------- app windows: element lists in a 1000-wide frame (h = 1000 * height / width) ----------
 const rr=(x,y,w,h,r,fill)=>({rr:[x,y,w,h,r],fill}),tx=(t,x,y,size,fill,o={})=>({t,x,y,size,fill,...o});
 function chrome(title,rule,H){
  return[{r:[0,0,1000,H],fill:SCREEN.glass},{r:[0,0,1000,70],fill:SCREEN.bar},{c:[38,35,11],fill:'#E05553'},{c:[72,35,11],fill:SCREEN.amber},
   {c:[106,35,11],fill:SCREEN.green},tx(title,142,47,30,SCREEN.title,{bold:1}),{r:[0,70,1000,5],fill:rule}];
 }
 const spark=(x,y,w,h,n,fall,seed)=>Array.from({length:n+1},(_,i)=>[x+i*w/n,y+h*(fall?(i/n)*.25-.75+hash(i,seed)*.6:.35-(i/n)*.3+hash(i,seed)*.35)]);
 const APPS={
  // The story screen: a metric that is bad (or good) right now.
  dashboard(H,o={}){
   const t=o.tone==='good'?{ink:SCREEN.good,rule:SCREEN.goodRule,tint:SCREEN.goodTint}:{ink:SCREEN.bad,rule:SCREEN.badRule,tint:SCREEN.badTint};
   const badge=o.badge??'SLOW',bw=badge.length*24+70;
   return[...chrome(o.title||'Dashboard · /home',t.rule,H),tx(o.label||'p95 page load',56,170,46,SCREEN.label),
    ...(badge?[rr(950-bw,118,bw,72,12,t.tint),tx(badge,950-bw/2,168,40,t.ink,{bold:1,anchor:'middle'})]:[]),tx(o.value||'12.0 s',46,Math.min(H-150,430),Math.min(230,H*.42),t.ink,{bold:1}),
    {line:spark(30,H-40,940,Math.min(150,H*.22),26,o.tone!=='good',3),stroke:t.ink,w:7}];
  },
  inbox(H){
   const rows=[['Priya N.','Login is slow again','09:12',1],['Sam (ops)','Re: deploy 7a4f','09:03',1],['Lee','Dark mode when?','08:47',0],['Ada K.','Export fails on Safari','08:30',1],
    ['Billing','Refund request #88','08:02',0],['Jo','Love the new robots','07:55',0],['Max','Pricing page typo','07:41',0],['Rui','Can I get an invoice?','07:20',0]];
   const out=[...chrome('inbox · support',SCREEN.dim,H),rr(700,96,250,58,29,'#2B2455'),tx('12 new',825,136,32,SCREEN.title,{anchor:'middle',bold:1})];
   rows.forEach(([who,subj,time,unread],i)=>{const y=210+i*92;if(y>H-30)return;
    if(i===0)out.push({r:[0,y-56,1000,88],fill:'#1E1838'});
    if(unread)out.push({c:[44,y-14,9],fill:SCREEN.code});
    out.push(tx(who,72,y-6,32,unread?SCREEN.title:SCREEN.label,{bold:unread}),tx(subj,330,y-6,32,unread?'#C9C3E6':SCREEN.label),tx(time,950,y-6,28,SCREEN.label,{anchor:'end'}));});
   return out;
  },
  review(H){
   const L=[[' ','export async function home() {',0],['-','  const rows = await fetchAll(users)',-1],['-','  return render(rows)',-1],['+','  const rows = cache.get("home")',1],
    ['+','    ?? await fetchPage(users, 50)',1],['+','  return render(rows)',1],[' ','}',0],[' ','',0],['-','test.skip("loads fast")',-1],['+','test("loads in < 1 s")',1]];
   const out=[...chrome('review · PR #214',SCREEN.dim,H),tx('speed up /home',56,150,40,SCREEN.title,{bold:1}),tx('2 files  +18 −41',56,200,30,SCREEN.label)];
   L.forEach(([s,line,k],i)=>{const y=270+i*58;if(y>H-110)return;
    if(k)out.push({r:[0,y-40,1000,54],fill:k<0?SCREEN.badRow:SCREEN.goodTint});
    out.push(tx(s,40,y,32,k<0?SCREEN.bad:k>0?SCREEN.good:SCREEN.label),tx(line,90,y,32,k<0?'#E7A0A8':k>0?'#9FE8BC':SCREEN.label));});
   out.push(rr(730,H-96,220,64,12,SCREEN.goodTint),tx('Approve',840,H-52,32,SCREEN.good,{bold:1,anchor:'middle'}));
   return out;
  },
  changelog(H){
   const L=[['## 0.9.0 · today',SCREEN.title,1,40],['Added',SCREEN.good,1,34],['- dark mode (very dark)',SCREEN.label,0,32],['- instant /home',SCREEN.label,0,32],
    ['Fixed',SCREEN.bad,1,34],['- login timeout',SCREEN.label,0,32],['- export on Safari',SCREEN.label,0,32],['## 0.8.2',SCREEN.title,1,40],['- robots can blink',SCREEN.label,0,32]];
   const out=chrome('CHANGELOG.md',SCREEN.dim,H);
   L.forEach(([t,c,b,s],i)=>{const y=160+i*66;if(y<H-20)out.push(tx(t,56,y,s,c,{bold:b}));});
   return out;
  },
  terminal(H){
   const L=[['$ npm test',SCREEN.title],['  ✓ 48 passed',SCREEN.good],['  ✗ 1 failed  checkout.spec',SCREEN.bad],['$ git push origin main',SCREEN.title],
    ['→ deploying 7a4f …',SCREEN.code],['→ build 41 s',SCREEN.label],['$ tail -f prod.log',SCREEN.title],['GET /home  12034 ms',SCREEN.bad],['GET /home  11870 ms',SCREEN.bad],['$ ',SCREEN.title]];
   const out=[...chrome('~/app · zsh',SCREEN.dim,H),{r:[0,75,1000,H-75],fill:'#0F0B1F'}];
   L.forEach(([t,c],i)=>{const y=150+i*64;if(y<H-20)out.push(tx(t,40,y,34,c));});
   const last=150+Math.min(L.length-1,Math.floor((H-170)/64))*64;out.push({r:[96,last-30,22,38],fill:SCREEN.title});
   return out;
  },
  chat(H){
   const out=chrome('#team · frameforge',SCREEN.dim,H),B=[[0,'is /home fast yet?'],[1,'shipping a fix now'],[0,'what did you change'],[1,'just one tiny thing'],[0,'…'],[1,'🚀']];
   B.forEach(([me,t],i)=>{const y=120+i*96;if(y>H-80)return;const w=40+t.length*19;out.push(rr(me?960-w:40,y,w,70,24,me?'#2B2455':'#3A2732'),tx(t,me?960-w+24:64,y+47,30,me?'#C9C3E6':'#E3B9C2'));});
   return out;
  },
  metrics(H){
   return[...chrome('errors · 24 h',SCREEN.goodRule,H),tx('error rate',56,170,44,SCREEN.label),tx('0.4 %',46,Math.min(H-120,380),Math.min(190,H*.36),SCREEN.good,{bold:1}),
    {line:spark(30,H-40,940,Math.min(120,H*.2),24,false,9),stroke:SCREEN.good,w:6}];
  },
  // A screen shot's insert (projects: shot.insert), laid out for the story window (675 high at 1000 wide): everything
  // that must read sits in the left two thirds, which a screen shot keeps in frame; the graph trails off to the right.
  insert(H,o={}){
   const bad=o.tone==='bad',ink=bad?SCREEN.bad:SCREEN.good,rule=bad?SCREEN.badRule:SCREEN.goodRule,tint=bad?SCREEN.badRow:SCREEN.goodTint;
   const y=v=>v*H/675,graph=Array.from({length:10},(_,i)=>[690+i*30,y(o.graph==='flat'?580:582-50*Math.exp(-i*.6))]);
   return[...chrome(o.window||'',rule,H),tx(o.context||'',56,y(128),28,SCREEN.label),tx(o.headline||'',56,y(200),40,ink,{bold:1}),
    tx(o.value||'',46,y(420),190,ink,{bold:1}),tx(o.caption||'',56,y(480),32,SCREEN.title),
    rr(40,y(510),600,100,12,tint),tx(o.request||'',66,y(552),28,SCREEN.code),tx(o.status||'',66,y(592),26,ink,{bold:1}),
    {r:[690,y(600),270,2],fill:'#2A2442'},{line:graph,stroke:ink,w:6},tx(o.footer||'',56,y(652),24,SCREEN.label)];
  },
  calendar(H){
   const out=chrome('today',SCREEN.dim,H),E=[['10:00','standup',SCREEN.code],['11:30','fix /home',SCREEN.bad],['14:00','demo to Jo',SCREEN.good],['16:00','release 0.9',SCREEN.amber]];
   E.forEach(([t,e,c],i)=>{const y=140+i*120;if(y>H-60)return;out.push(tx(t,56,y+48,32,SCREEN.label),{r:[200,y,10,80],fill:c},rr(230,y,720,80,10,'#1E1838'),tx(e,260,y+52,34,SCREEN.title));});
   return out;
  }
 };
 // A desktop: a dark wallpaper, a thin menu bar and tiled windows [{app, x, y, w, h}] in the screen's px frame.
 function desktop(tiles,H,o={}){
  const out=[{r:[0,0,1000,H],fill:'#0F0B1C'},{r:[0,0,1000,26],fill:'#17122A'},tx(o.menu||'frameforge  ·  6 windows',20,19,15,SCREEN.label),tx(o.clock||'21:04',980,19,15,SCREEN.label,{anchor:'end'})];
  for(const t of tiles){const k=t.w/1000,els=APPS[t.app](t.h/k,t.opt||{});out.push({group:els,x:t.x,y:t.y,k});}
  return out;
 }

 // Draw an element list onto a 2D canvas whose width stands for the 1000-px frame (the studio's in-world screens).
 function drawCanvas(ctx,elements,scale=ctx.canvas.width/1000){
  const walk=(els,ox,oy,k)=>{for(const e of els){
   if(e.group){walk(e.group,ox+e.x*k,oy+e.y*k,k*e.k);continue;}
   const X=x=>(ox+x*k)*scale,Y=y=>(oy+y*k)*scale,L=v=>v*k*scale;
   ctx.fillStyle=e.fill;
   if(e.r){ctx.fillRect(X(e.r[0]),Y(e.r[1]),L(e.r[2]),L(e.r[3]));continue;}
   if(e.rr){const[x,y,w,h,r]=e.rr;ctx.beginPath();ctx.roundRect(X(x),Y(y),L(w),L(h),L(r));ctx.fill();continue;}
   if(e.c){ctx.beginPath();ctx.arc(X(e.c[0]),Y(e.c[1]),L(e.c[2]),0,2*PI);ctx.fill();continue;}
   if(e.line){ctx.strokeStyle=e.stroke;ctx.lineWidth=L(e.w);ctx.lineJoin='miter';ctx.beginPath();e.line.forEach(([x,y],i)=>i?ctx.lineTo(X(x),Y(y)):ctx.moveTo(X(x),Y(y)));ctx.stroke();continue;}
   if(e.t!==undefined){ctx.font=(e.bold?'700 ':'400 ')+L(e.size)+'px '+MONO;ctx.textAlign=e.anchor==='middle'?'center':e.anchor==='end'?'right':'left';ctx.textBaseline='alphabetic';ctx.fillText(e.t,X(e.x),Y(e.y));}
  }};
  walk(elements,0,0,1);
 }
 // A monitor: a screen of w x h at centre c, facing +z turned by ry, tilted back by tilt; a bezel box behind it and
 // optional stand. content: an element list in a 1000-wide frame (APPS / desktop).
 function monitor(c,w,h,content,o={}){
  const ry=rad(o.ry||0),tilt=rad(o.tilt||0),b=o.bezel??.22,depth=o.depth??.25;
  const R=v=>rotY(rotX(v,-tilt),ry),U=R([1,0,0]),V=R([0,-1,0]),N=R([0,0,1]);
  const at=(x,y,z)=>add(c,add(add(mul(U,x),mul(V,-y)),mul(N,z)));
  const bw=w/2+b,bh=h/2+b,corners=[[-bw,bh],[bw,bh],[bw,-bh],[-bw,-bh]];
  const front=corners.map(([x,y])=>at(x,y,-.01)),back=corners.map(([x,y])=>at(x,y,-depth));
  const polys=[{p:front,mat:'setBezel'},{p:back.slice().reverse(),mat:o.backMat||'setBezel'}];
  for(let i=0;i<4;i++)polys.push({p:[front[i],back[i],back[(i+1)%4],front[(i+1)%4]],mat:'setBezel'});
  const obj=solid(polys,at(0,0,-depth/2),{kind:'screen',label:o.label||''});
  obj.face={TL:at(-w/2,h/2,.005),U,V,N,w,h,k:w/1000,elements:content};
  obj.planSeg=[at(-bw,-bh,0),at(bw,-bh,0)];
  const parts=[obj];
  if(o.stand){const s=o.stand,base=at(0,-bh+.5,-depth-.2);
   parts.push(box([base[0]-s.neck/2,s.floor,base[2]-.2],[base[0]+s.neck/2,base[1],base[2]+.2],'lid',{ry:o.ry||0}));
   parts.push(box([base[0]-s.foot[0]/2,s.floor,base[2]-s.foot[1]/2],[base[0]+s.foot[0]/2,s.floor+.14,base[2]+s.foot[1]/2],'lid',{ry:o.ry||0}));}
  return parts;
 }
 // A dark city window far behind: glass, mullions and small lit windows (amber, a few red and green).
 function cityWindow(x0,x1,y0,y1,z,seed=5){
  const polys=[{p:[[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]],fill:'#0B0918'}];
  const lights=[];
  for(let i=0;i<220;i++){const u=hash(i,seed),v=hash(i,seed+1),k=hash(i,seed+2);
   const tower=Math.floor(u*9),th=.35+hash(tower,seed+3)*.6;if(v>th)continue;
   const x=x0+(x1-x0)*u,y=y0+(y1-y0)*v*.98,s=(x1-x0)*.006;
   lights.push({p:[[x-s,y-s,z+.01],[x+s,y-s,z+.01],[x+s,y+s,z+.01],[x-s,y+s,z+.01]],fill:k<.08?'#E05553':k<.14?'#23A93B':'#DEA32F'});}
  const bars=[];for(let i=1;i<4;i++){const x=x0+(x1-x0)*i/4;bars.push({p:[[x-.08,y0,z+.02],[x+.08,y0,z+.02],[x+.08,y1,z+.02],[x-.08,y1,z+.02]],fill:'#05040A'});}
  return{polys:[...polys,...lights,...bars],anchor:[(x0+x1)/2,(y0+y1)/2,z],solid:false,layer:'far'};
 }

 // ---------- camera and drawing ----------
 function camera(spec,W,H){
  const pos=spec.pos,d=sub(spec.target,pos),fov=spec.fov||36;
  const psi=Math.atan2(-d[0],-d[2]),beta=Math.atan2(-d[1],Math.hypot(d[0],d[2]));
  const f=(H/2)/Math.tan(rad(fov)/2);
  const toCam=p=>rotX(rotY(sub(p,pos),-psi),beta),dirCam=v=>rotX(rotY(v,-psi),beta);
  const scr=q=>[W/2+f*q[0]/-q[2],H/2-f*q[1]/-q[2]];
  return{pos,psi,beta,f,W,H,fov,toCam,dirCam,scr,proj:p=>scr(toCam(p))};
 }
 const NEAR=.08;
 // Clip a camera-space polygon to the near plane (z <= -NEAR).
 function clipNear(q){
  const out=[];
  for(let i=0;i<q.length;i++){const a=q[i],b=q[(i+1)%q.length],ia=a[2]<=-NEAR,ib=b[2]<=-NEAR;
   if(ia)out.push(a);
   if(ia!==ib){const t=(-NEAR-a[2])/(b[2]-a[2]);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,-NEAR]);}}
  return out;
 }
 const pts=s=>s.map(p=>f2(p[0])+','+f2(p[1])).join(' ');
 function polyColour(f,cam,pool){
  if(f.fill)return f.fill;
  let c=D.shade(f.mat,cam.dirCam(f.n));
  if(pool&&f.n[1]>.6){const m=centroid(f.p),d2=((m[0]-pool.c[0])**2+(m[2]-pool.c[2])**2)/(pool.r*pool.r);c=mixHex(c,pool.color,pool.k*Math.exp(-d2));}
  return c;
 }
 function drawPolys(obj,cam,pool){
  let s='';
  for(const f of obj.polys){
   if(obj.solid&&dot(f.n,sub(cam.pos,f.p[0]))<=0)continue;
   const q=clipNear(f.p.map(cam.toCam));if(q.length<3)continue;
   const col=polyColour(f,cam,pool);
   s+='<polygon points="'+pts(q.map(cam.scr))+'" fill="'+col+'" stroke="'+col+'" stroke-width=".6"'+(f.opacity?' opacity="'+f.opacity+'"':'')+'/>';
  }
  return s;
 }
 // Screen content in perspective: rects and circles are projected point by point; text uses the local affine map.
 function drawFace(face,cam){
  if(dot(face.N,sub(cam.pos,face.TL))<=0)return'';
  const P=(x,y,k0,ox,oy)=>add(face.TL,add(mul(face.U,(ox+x*k0)*face.k),mul(face.V,(oy+y*k0)*face.k)));
  const proj=p=>{const q=cam.toCam(p);return q[2]<-NEAR?cam.scr(q):null;};
  const poly=(ps,fill)=>{const q=clipNear(ps.map(cam.toCam));return q.length<3?'':'<polygon points="'+pts(q.map(cam.scr))+'" fill="'+fill+'"/>';};
  let s='';
  const walk=(els,ox,oy,k0)=>{for(const e of els){
   if(e.group){walk(e.group,ox+e.x,oy+e.y,k0*e.k);continue;}
   if(e.r){const[x,y,w,h]=e.r;s+=poly([P(x,y,k0,ox,oy),P(x+w,y,k0,ox,oy),P(x+w,y+h,k0,ox,oy),P(x,y+h,k0,ox,oy)],e.fill);continue;}
   if(e.rr){const[x,y,w,h,r]=e.rr,ps=[];for(const[cx,cy,a0]of[[x+w-r,y+r,-90],[x+w-r,y+h-r,0],[x+r,y+h-r,90],[x+r,y+r,180]])for(let i=0;i<=3;i++){const a=rad(a0+i*30);ps.push(P(cx+r*Math.cos(a),cy+r*Math.sin(a),k0,ox,oy));}
    s+=poly(ps,e.fill);continue;}
   if(e.c){const[cx,cy,r]=e.c;s+=poly(Array.from({length:10},(_,i)=>P(cx+r*Math.cos(i*PI/5),cy+r*Math.sin(i*PI/5),k0,ox,oy)),e.fill);continue;}
   if(e.line){const q=e.line.map(([x,y])=>proj(P(x,y,k0,ox,oy)));if(q.some(v=>!v))continue;
    const a=proj(P(500,0,k0,ox,oy)),b=proj(P(510,0,k0,ox,oy));const px=a&&b?Math.hypot(b[0]-a[0],b[1]-a[1])/10:1;
    s+='<polyline points="'+pts(q)+'" fill="none" stroke="'+e.stroke+'" stroke-width="'+f2(Math.max(.4,e.w*px))+'" stroke-linejoin="miter"/>';continue;}
   if(e.t!==undefined){const a=proj(P(e.x,e.y,k0,ox,oy)),b=proj(P(e.x+10,e.y,k0,ox,oy)),c=proj(P(e.x,e.y+10,k0,ox,oy));if(!a||!b||!c)continue;
    const m=[(b[0]-a[0])/10,(b[1]-a[1])/10,(c[0]-a[0])/10,(c[1]-a[1])/10,a[0],a[1]];
    if(Math.hypot(m[0],m[1])*e.size<1.2){const w=e.t.length*e.size*.55;s+=poly([P(e.x-(e.anchor==='end'?w:e.anchor==='middle'?w/2:0),e.y-e.size*.55,k0,ox,oy),P(e.x+(e.anchor==='end'?0:e.anchor==='middle'?w/2:w),e.y-e.size*.55,k0,ox,oy),P(e.x+(e.anchor==='end'?0:e.anchor==='middle'?w/2:w),e.y-e.size*.2,k0,ox,oy),P(e.x-(e.anchor==='end'?w:e.anchor==='middle'?w/2:0),e.y-e.size*.2,k0,ox,oy)],e.fill+'88');continue;}
    s+='<text transform="matrix('+m.map(f2).join(' ')+')" font-family=\''+MONO+'\' font-size="'+f2(e.size)+'" fill="'+e.fill+'"'+(e.bold?' font-weight="700"':'')+(e.anchor?' text-anchor="'+e.anchor+'"':'')+'>'+e.t.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</text>';}
  }};
  walk(face.elements,0,0,1);
  return s;
 }
 // A cast member: drawn by its own renderer (orthographic in view space), seen along the ray to its centre, scaled by
 // perspective at that depth. kit[who] = {render(view) -> {svg,bbox,headBox}, centre: model y of the body centre,
 // feet: model y of the soles, shadow: radius of the contact shadow}.
 function drawActor(a,cam,kit,ground){
  const k=kit[a.who],c=[a.at[0],a.at[1]+(k.centre-k.feet),a.at[2]];
  const q=cam.toCam(c);if(q[2]>-NEAR)return{svg:''};
  const d=sub(c,cam.pos),psi=Math.atan2(-d[0],-d[2]),beta=Math.atan2(-d[1],Math.hypot(d[0],d[2]));
  const out=k.render({yaw:(a.yaw||0)-psi*180/PI,pitch:beta*180/PI,emotion:a.emotion||'neutral'});
  const s=cam.f/-q[2],S=cam.scr(q);
  const shadow=drawPolys({polys:[{p:Array.from({length:14},(_,i)=>[a.at[0]+k.shadow*Math.cos(i*PI/7),ground+.005,a.at[2]+k.shadow*.8*Math.sin(i*PI/7)]),fill:'#000000',opacity:.42}],solid:false},cam);
  const svg=shadow+'<g transform="translate('+f2(S[0])+' '+f2(S[1])+') scale('+(Math.round(s*1000)/1000)+') translate(0 '+(Math.round(k.centre*Math.cos(beta)*1e4)/1e4)+')">'+out.svg+'</g>';
  return{svg,height:(out.bbox[3]-out.bbox[1])*s,head:(out.headBox[2]-out.headBox[0])*s,top:S[1]+(out.bbox[1]+k.centre*Math.cos(beta))*s};
 }
 // Draw a scene from one camera: far room, ground, background screens, then props and cast sorted far to near.
 // opt.soft = {blur, glow}: soften the room and the screens (the reference's background focus and bloom).
 function render(scene,camSpec,W,H,opt={}){
  const cam=camera(camSpec,W,H),depth=o=>-cam.toCam(o.anchor)[2];
  const layers={far:[],ground:[],bg:[],mid:[]};
  for(const o of scene.objects)layers[o.layer||'mid'].push(o);
  for(const a of scene.cast)layers.mid.push({actor:a,anchor:[a.at[0],a.at[1]+1,a.at[2]],bias:-.45});
  const stats={};
  const draw=list=>list.map(o=>({o,d:depth(o)+(o.bias||0)})).sort((a,b)=>b.d-a.d).map(({o})=>{
   if(o.actor){const r=drawActor(o.actor,cam,opt.kit,scene.groundY??0);if(o.actor.who==='dev')Object.assign(stats,{devH:r.height/H,headW:r.head/W});return r.svg;}
   return drawPolys(o,cam,scene.pool)+(o.face?drawFace(o.face,cam):'');
  }).join('');
  const far=draw(layers.far),ground=layers.ground.map(o=>drawPolys(o,cam,scene.pool)).join(''),bg=draw(layers.bg);
  let pool='';
  if(scene.pool){const p=scene.pool,ring=Array.from({length:28},(_,i)=>[p.c[0]+p.r*1.6*Math.cos(i*PI/14),p.c[1]+.004,p.c[2]+p.r*1.6*Math.sin(i*PI/14)]);
   const q=clipNear(ring.map(cam.toCam));if(q.length>2)pool='<polygon points="'+pts(q.map(cam.scr))+'" fill="url(#pool)" style="mix-blend-mode:screen"/>';}
  const mid=draw(layers.mid);
  const soft=opt.soft,id='s'+Math.round(Math.random()*1e9);
  const defs='<defs><radialGradient id="pool"><stop offset="0" stop-color="#5F418C" stop-opacity=".75"/><stop offset=".55" stop-color="#4A3480" stop-opacity=".3"/><stop offset="1" stop-color="#2A2060" stop-opacity="0"/></radialGradient>'+
   (soft?'<filter id="b'+id+'" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="'+soft.blur+'"/></filter><filter id="g'+id+'" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="'+soft.glow+'"/></filter>':'')+'</defs>';
  const back=far+ground+pool+bg;
  const backSvg=soft?'<g filter="url(#b'+id+')">'+back+'</g><g filter="url(#g'+id+')" opacity=".55" style="mix-blend-mode:screen">'+far+bg+'</g>':back;
  const svg='<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" style="background:#100C1B;display:block" overflow="hidden">'+defs+backSvg+mid+'</svg>';
  return{svg,stats,cam};
 }
 // Top-down plan: floors and props by height, screens as blue bars with their app, cast as dots, cameras as wedges.
 function plan(scene,cams,size,aspect=9/16){
  const all=scene.objects.filter(o=>o.layer!=='far').flatMap(o=>o.polys.flatMap(f=>f.p)),xs=all.map(p=>p[0]),zs=all.map(p=>p[2]);
  for(const c of Object.values(cams)){xs.push(c.pos[0]);zs.push(c.pos[2]);}
  const x0=Math.min(...xs)-1,x1=Math.max(...xs)+1,z0=Math.min(...zs)-1,z1=Math.max(...zs)+1,k=size/Math.max(x1-x0,z1-z0);
  const P=p=>[(p[0]-x0)*k+(size-(x1-x0)*k)/2,(p[2]-z0)*k+(size-(z1-z0)*k)/2];
  const tops=[];
  for(const o of scene.objects){if(o.layer==='far')continue;for(const f of o.polys)if(f.n&&f.n[1]>.6)tops.push({q:f.p.map(P),y:centroid(f.p)[1],fill:f.fill||(MAT[f.mat].ramp?MAT[f.mat].ramp[1]:'#333')});}
  tops.sort((a,b)=>a.y-b.y);
  let s=tops.map(t=>'<polygon points="'+pts(t.q)+'" fill="'+t.fill+'" stroke="#0C0916" stroke-width=".4"/>').join('');
  for(const o of scene.objects)if(o.planSeg){const[a,b]=o.planSeg.map(P);s+='<line x1="'+f2(a[0])+'" y1="'+f2(a[1])+'" x2="'+f2(b[0])+'" y2="'+f2(b[1])+'" stroke="#79C5FF" stroke-width="3"/>';
   if(o.label)s+='<text x="'+f2((a[0]+b[0])/2)+'" y="'+f2((a[1]+b[1])/2-6)+'" font-size="11" fill="#A7A1C7" text-anchor="middle" font-family=\''+MONO+'\'>'+o.label+'</text>';}
  const dots={dev:'#C66C48',blue:'#7FA6C9',orange:'#EE9A55'};
  for(const a of scene.cast){const p=P(a.at);s+='<circle cx="'+f2(p[0])+'" cy="'+f2(p[1])+'" r="5" fill="'+dots[a.who]+'"/>';}
  const hf=2*Math.atan(Math.tan(rad(36)/2)*aspect);
  for(const[name,c]of Object.entries(cams)){
   const d=sub(c.target,c.pos),a=Math.atan2(d[2],d[0]),L=3.2*k,p=P(c.pos);
   const e1=[p[0]+L*Math.cos(a-hf/2),p[1]+L*Math.sin(a-hf/2)],e2=[p[0]+L*Math.cos(a+hf/2),p[1]+L*Math.sin(a+hf/2)];
   s+='<polygon points="'+pts([p,e1,e2])+'" fill="#FFE6D0" fill-opacity=".18" stroke="#FFE6D0" stroke-width="1"/><text x="'+f2(p[0])+'" y="'+f2(p[1]+16)+'" font-size="13" fill="#FFE6D0" text-anchor="middle">'+name+'</text>';
  }
  return'<svg width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'" style="background:#0C0916;display:block">'+s+'</svg>';
 }
 return{box,key,prism,monitor,cityWindow,desktop,drawCanvas,APPS,SCREEN,render,plan,camera,hash};
});
