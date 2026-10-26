/* FrameForge set: the screen arena, direction C of design/set-directions.html, picked by the user on 2026-10-26.
   A violet plaza for the cast, a field of keycaps around it, and app windows in three tiers on a half-ring facing the
   plaza, plus a few behind the camera so reverse angles have screens too. The sheet (design/set-directions.js) and the
   three.js build (src/arena-set.js) both read these numbers. App names are FrameForgeSet.APPS layouts; 'story' is the
   window that shows each shot's wall (window title, label, value, badge, tone).
   Units: DEV's (he stands 2 tall), y up, ground (the floor under the keys) y = 0, plaza centre at x = z = 0.
   Angles: degrees around the plaza, 0 = straight behind the cast, positive = to the right. */
(function(root,factory){
 const lib=factory();
 if(typeof module==='object'&&module.exports)module.exports=lib;
 else root.FrameForgeArena=lib;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const STATUS='approved: direction C (screen arena), by the user on 2026-10-26';
 const ARENA={
  plaza:{r:3.2,h:.16,sides:16},
  // Keycaps on a grid (pitch), kept between rMin and rMax from the plaza centre; a few are missing, a few are violet.
  keys:{pitch:.8,base:.68,top:.58,h:.12,rMin:3.5,rMax:9.2,cols:[-14,14],rows:[-14,10],skip:.06,violet:.08},
  // Windows: tiers on rings of radius R, centre height y, size w x h, tilted back by tilt (negative leans in).
  tiers:[
   {R:10.5,y:2.5,w:5.2,h:3.4,tilt:0,at:[-75,-45,-15,15,45,75],apps:['chat','inbox','review','changelog','terminal','metrics']},
   {R:12,y:6.6,w:6,h:3.8,tilt:-8,at:[-68,-36,0,36,68],apps:['calendar','metrics','story','inbox','review']},
   {R:13.5,y:11,w:6.4,h:4,tilt:-14,at:[-45,-15,15,45],apps:['terminal','changelog','chat','calendar']},
   // Behind the camera, for reverse angles: far enough out that a wide (camera up to ~15 in front of the plaza) stands
   // inside the ring, with a gap straight behind it.
   {R:17,y:3,w:6,h:3.8,tilt:0,at:[145,165,195,215],apps:['review','inbox','terminal','chat']}
  ],
  // The story window is bigger and a little higher than its tier; screen shots look at it (M5.2), so it is tall
  // enough for a whole insert (title, context, headline, value, description, request and status, footer).
  story:{w:8,h:5.4,lift:.3},
  bezel:.2,depth:.3,post:.5,
  pool:{r:3,k:.55}
 };
 // Where each window stands: centre [x, y, z], turn ry (degrees, facing the plaza), and its post's footprint centre.
 function windows(){
  const out=[];
  for(const t of ARENA.tiers)t.at.forEach((a,i)=>{
   const app=t.apps[i],story=app==='story',w=story?ARENA.story.w:t.w,h=story?ARENA.story.h:t.h,y=t.y+(story?ARENA.story.lift:0);
   const s=Math.sin(a*Math.PI/180),c=Math.cos(a*Math.PI/180),pr=t.R+ARENA.post;
   out.push({app,story,w,h,tilt:t.tilt,ry:-a,c:[t.R*s,y,-t.R*c],post:{c:[pr*s,0,-pr*c],top:y-h/2}});
  });
  return out;
 }
 // The same deterministic hash as design/set-forms.js, so the sheet and the build drop and colour the same keys.
 function hash(i,seed=1){let h=Math.imul(i+seed*7919,2654435761);h^=h>>>15;h=Math.imul(h,2246822507);h^=h>>>13;return((h^(h>>>16))>>>0)/4294967296;}
 // The keycap grid: [x, z, violet?] for every key that is kept.
 function keys(){
  const k=ARENA.keys,out=[];
  for(let i=k.cols[0];i<=k.cols[1];i++)for(let j=k.rows[0];j<=k.rows[1];j++){
   const x=i*k.pitch,z=j*k.pitch,r=Math.hypot(x,z),n=(i+20)*40+j+20;
   if(r<k.rMin||r>k.rMax||hash(n,4)<k.skip)continue;
   out.push([x,z,hash(n,5)<k.violet]);
  }
  return out;
 }
 return{STATUS,ARENA,windows,keys};
});
