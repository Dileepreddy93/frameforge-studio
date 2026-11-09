/* P5: FrameForge-owned directional script, shot screen and camera grammar.
 * UMD for Node tests and editor. One timeline: src/hybrid-project-core.js timeAt().
 * No editing legacy frameforge.project/1 or its script/film path.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./hybrid-project-core.js'));
 else root.FrameForgeHybridDirector=factory(root.FrameForgeHybridProjectCore);
})(typeof globalThis!=='undefined'?globalThis:this,function(core){
 'use strict';
 const MOVES=new Set(['static','push','pull','drift','orbit']);
 const KINDS=new Set(['terminal','chat','code','inbox','browser','grid']);
 const TONES=new Set(['info','calm','alert','success']);
 const EMOTIONS=new Set(['neutral','happy','sad','angry','surprised','worried','curious','idea']);
 const ACTIONS=new Set(['none','wave','point','shrug','facepalm','think','cheer','clap','thumbsup',
 'crossarms','handsup','nod','headshake','lean','jump','type','press','raise','hop','enter',
 'exit','sit','stand','explain','listen','typing','react','question','plead','alarm','surprise',
 'defeat','announce','celebrate','anticipate']);
 const SLUG=/^[a-z][a-z0-9-]{0,39}$/, safe=x=>typeof x==='string'&&x.length>0&&x.length<=160;
 const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 const clone=x=>JSON.parse(JSON.stringify(x));
 const finite=(x,a,b)=>typeof x==='number'&&Number.isFinite(x)&&x>=a&&x<=b;
 const encode=x=>encodeURIComponent(String(x));
 const decode=x=>decodeURIComponent(x);
 function verify(p){
   core.assertProject(p);
   if(p.schema!==core.schema)throw Error('P5 director requires v2; legacy V6 film remains independent');
   if(p.hybrid.director!==undefined && (!obj(p.hybrid.director)||typeof p.hybrid.director.oneTake!=='boolean'))
     throw Error('One-take camera setting must be explicit boolean');
   for(let i=0;i<p.shots.length;i++){
     const s=p.shots[i],where='shot '+s.id;
     if(s.direction!==undefined){
       if(!obj(s.direction)||!MOVES.has(s.direction.move)||!['cut','blend'].includes(s.direction.transition)||
         !finite(s.direction.blendSeconds??0,0,1.5) ||
         (s.direction.transition==='blend'&&s.direction.blendSeconds>s.duration/2))
         throw Error(where+' contains unsafe camera motion/transition');
     }
     if(s.screen!==undefined){
       if(!obj(s.screen)||!KINDS.has(s.screen.kind)||!TONES.has(s.screen.tone)||
         !safe(s.screen.title)||!Array.isArray(s.screen.lines)||s.screen.lines.length>16||
         s.screen.lines.some(x=>!safe(x)||x.length>120))
         throw Error(where+' contains invalid screen application');
     }
     if(s.reactions!==undefined&&(!Array.isArray(s.reactions)||s.reactions.length>6||
       s.reactions.some(r=>!obj(r)||!p.characters.some(c=>c.id===r.actor)||
         !EMOTIONS.has(r.emotion)||!ACTIONS.has(r.action)||!finite(r.at,0,s.duration))))
       throw Error(where+' contains invalid reaction beats');
     if(s.visualProp!==undefined&&s.visualProp!=='lantern')
       throw Error(where+' has unsupported visual prop');
     if(s.propInteraction!==undefined&&(!obj(s.propInteraction)||s.visualProp!=='lantern'||
       !['ground','reach','lift','carry'].includes(s.propInteraction.mode)||
       !p.characters.some(c=>c.id===s.propInteraction.actor)))
       throw Error(where+' has invalid story prop interaction');
     if(s.camera?.kind==='prop'&&s.visualProp!=='lantern')
       throw Error(where+' has a prop camera without a prop');
     if(s.caption!==undefined&&(!safe(s.caption)||s.caption.length>140))
       throw Error(where+' contains invalid caption');
   }
   return p;
 }
 function cameraString(camera){
   if(typeof camera==='string')return camera;
   return camera.kind+(camera.target?':'+camera.target:'')+(camera.secondary?','+camera.secondary:'');
 }
 function parseCamera(raw,ids){
   if(['wide','screen','prop','duo'].includes(raw))return raw==='duo'?{kind:'wide'}:{kind:raw};
   const m=/^(actor|two):([a-z][a-z0-9-]{0,39})(?:,([a-z][a-z0-9-]{0,39}))?$/.exec(raw);
   if(!m)throw Error('Camera must be actor:ID, two:ID,ID, wide or screen');
   if(!ids.has(m[2])||(m[1]==='two'&&(!ids.has(m[3])||m[2]===m[3])))
      throw Error('Camera references unknown or duplicate actor');
   return m[1]==='two'?{kind:'two',target:m[2],secondary:m[3]}:{kind:'actor',target:m[2]};
 }
 function readAttrs(line,tag){
   const s=line.trim().slice(tag.length).trim().split(/\s+/);
   const out={};
   for(const bit of s) {
     const eq=bit.indexOf('=');
     if(eq<1||out[bit.slice(0,eq)]!==undefined)throw Error('Invalid '+tag+' field '+bit);
     out[bit.slice(0,eq)]=decode(bit.slice(eq+1));
   }
   return out;
 }
 function scriptToProject(script,base){
   const result={project:null,errors:[]};
   try{
     verify(base);
     const p=clone(base);p.shots=[];
     const actors=new Map();
     for(const c of p.characters){
       for(const n of [c.id,c.name])if(n)actors.set(n.toLowerCase(),c.id);
     }
     const lines=String(script||'').split(/\r?\n/);
     let active=null,seen=new Set();
     for(let n=0;n<lines.length;n++){
       const line=lines[n].trim();
       if(!line||line.startsWith('//'))continue;
       if(line.startsWith('# ')){p.title=line.slice(2).trim().slice(0,120);continue}
       if(line.startsWith('> ')){p.logline=line.slice(2).trim().slice(0,1024);continue}
       if(line.startsWith('@mode ')){
         if(!['@mode cuts','@mode one-take'].includes(line))throw Error('Use @mode cuts or one-take');
         p.hybrid.director={oneTake:line==='@mode one-take'};continue;
       }
       if(line.startsWith('@shot ')){
         const a=readAttrs(line,'@shot');
         if(!SLUG.test(a.id||'')||seen.has(a.id))throw Error('Unique shot id required');
         seen.add(a.id);
         const duration=Number(a.duration);
         if(!finite(duration,.4,15))throw Error('Shot duration must be .4–15 seconds');
         const camera=parseCamera(a.camera,new Set(p.characters.map(x=>x.id)));
         if(!MOVES.has(a.move??'static')||!['cut','blend'].includes(a.transition??'cut'))
           throw Error('Unknown camera movement');
         if(a.ambient!==undefined&&!['show','hide'].includes(a.ambient))throw Error('Ambient monitor must be show or hide');
         const blendSeconds=Number(a.blend??0);
         if(!finite(blendSeconds,0,1.5))throw Error('Blend time invalid');
         active={id:a.id,duration,camera,dialogue:'',speaker:'',intent:a.intent||'scripted',
           firstFrameStatus:'draft',cast:{},direction:{move:a.move||'static',
             transition:a.transition||'cut',blendSeconds},
           ...(a.caption?{caption:a.caption}:{}),
           ...(a.ambient==='hide'?{ambientScreen:false}:{}),
           timing:{lead:.15,pauseAfter:.35}};
         p.shots.push(active);continue;
       }
       if(!active)throw Error('First declare @shot before dialogue');
       if(line.startsWith('@prop ')){
         const a=readAttrs(line,'@prop');
         if(a.name!=='lantern'||Object.keys(a).some(k=>!['name','mode','actor'].includes(k)))
           throw Error('Supported visual prop: lantern with optional mode and actor');
         active.visualProp=a.name;
         if(a.mode||a.actor)active.propInteraction={mode:a.mode||'ground',actor:a.actor||active.speaker};
         continue;
       }
       if(line.startsWith('@reaction ')){
         const a=readAttrs(line,'@reaction');
         if(!p.characters.some(c=>c.id===a.actor))throw Error('Reaction references missing actor');
         (active.reactions??=[]).push({actor:a.actor,at:Number(a.at||0),
           emotion:a.emotion||'neutral',action:a.action||'nod'});
         continue;
       }
       if(line.startsWith('@screen ')){
         const a=readAttrs(line,'@screen');
         active.screen={kind:a.kind,tone:a.tone||'info',title:a.title||'On screen',lines:[]};
         continue;
       }
       if(line.startsWith('| ')){
         if(!active.screen)throw Error('Screen row must follow @screen');
         active.screen.lines.push(line.slice(2));continue;
       }
       const match=/^([^:]{1,80}?)(?:\s+\(([^)]+)\))?(?:\s+\[([^\]]+)\])?:\s*(.+)$/.exec(line);
       if(!match)throw Error('Expected ACTOR (emotion) [action]: dialogue');
       if(active.speaker)throw Error('Only one spoken line per @shot');
       const actor=actors.get(match[1].trim().toLowerCase());
       if(!actor)throw Error('Unknown actor name '+match[1]);
       const emo=match[2]||'neutral',action=match[3]||'explain';
       if(!EMOTIONS.has(emo)||!ACTIONS.has(action))throw Error('Unknown emotion/action');
       active.speaker=actor;active.dialogue=match[4].trim();
       active.cast[actor]={emotion:emo,action};
     }
     if(!p.shots.length||p.shots.some(s=>!s.speaker))throw Error('Every shot needs one speaking actor');
     if(p.shots.length>120)throw Error('Too many shots');
     verify(p);result.project=p;
   }catch(e){result.errors.push({message:e.message})}
   return result;
 }
 function projectToScript(p){
   verify(p);
   const names=Object.fromEntries(p.characters.map(x=>[x.id,x.name]));
   const out=['# '+p.title,'> '+p.logline,'@mode '+(p.hybrid.director?.oneTake?'one-take':'cuts'),''];
   for(const s of p.shots){
     const d=s.direction||{move:'static',transition:'cut',blendSeconds:0};
     const parts=['@shot','id='+encode(s.id),'duration='+s.duration,
      'camera='+encode(cameraString(s.camera)),'move='+d.move,
      'transition='+d.transition,'blend='+(d.blendSeconds||0),
      'intent='+encode(s.intent)];
     if(s.caption)parts.push('caption='+encode(s.caption));
     if(s.ambientScreen===false)parts.push('ambient=hide');
     out.push(parts.join(' '));
     const acting=s.cast?.[s.speaker]||{emotion:'neutral',action:'explain'};
     out.push((names[s.speaker]||s.speaker)+' ('+(acting.emotion||'neutral')+
       ') ['+(acting.action||'explain')+']: '+s.dialogue);
     if(s.visualProp)out.push('@prop name='+encode(s.visualProp)+
       (s.propInteraction?' mode='+encode(s.propInteraction.mode)+' actor='+encode(s.propInteraction.actor):''));
     for(const r of s.reactions||[])out.push('@reaction actor='+r.actor+' at='+r.at+
       ' emotion='+r.emotion+' action='+r.action);
     if(s.screen){
       out.push('@screen kind='+s.screen.kind+' tone='+s.screen.tone+
        ' title='+encode(s.screen.title));
       out.push(...s.screen.lines.map(x=>'| '+x));
     }
     out.push('');
   }
   return out.join('\n');
 }
 function reorderShots(p,ordered){
   verify(p);
   if(!Array.isArray(ordered)||ordered.length!==p.shots.length||
       new Set(ordered).size!==ordered.length)throw Error('Shot reorder must include each shot exactly once');
   const shots=new Map(p.shots.map(s=>[s.id,s]));
   if(ordered.some(id=>!shots.has(id)))throw Error('Unknown shot in new order');
   const v=clone(p);v.shots=ordered.map(id=>clone(shots.get(id)));
   verify(v);
   return v;
 }
 const v3=(a)=>Array.isArray(a)&&a.length===3&&a.every(Number.isFinite);
 const lerp=(a,b,k)=>a+(b-a)*k;
 const smooth=t=>{const k=Math.max(0,Math.min(1,t));return k*k*(3-2*k)};
 function performanceAt(p,time){
   verify(p);
   const frame=core.timeAt(p,time),cast=clone(frame.shot.cast||{});
   const active=[];
   for(const reaction of frame.shot.reactions||[]){
     if(frame.localTime>=reaction.at){
       cast[reaction.actor]={emotion:reaction.emotion,action:reaction.action};
       active.push(reaction.actor);
     }
   }
   return {cast,active,shotId:frame.shotId};
 }
 function cameraAt(p,time,anchors,stage){
   verify(p);
   const f=core.timeAt(p,time),s=f.shot,d=s.direction||{move:'static',transition:'cut',blendSeconds:0};
   const src=typeof s.camera==='string'?{kind:s.camera}:s.camera;
   const head=id=>{const a=anchors[id]?.head;if(!v3(a))throw Error('Missing head anchor '+id);return a};
   // A portrait prop close-up must show the performer reacting to the object.
   // One shared focal point follows both live actor and real 3D prop as they move.
   const propFocus=shot=>{
     if(!v3(stage.prop))throw Error('No prop anchor');
     const holder=shot.propInteraction?.actor;
     return holder&&anchors[holder]?.head?
       stage.prop.map((v,i)=>lerp(v,head(holder)[i],.36)):[...stage.prop];
   };
   let focus,azimuth=.15;
   if(src.kind==='actor')focus=head(src.target);
   else if(src.kind==='two'){const a=head(src.target),b=head(src.secondary);focus=a.map((v,i)=>(v+b[i])/2)}
   else if(src.kind==='screen'){if(!v3(stage.screen))throw Error('No screen anchor');focus=stage.screen}
   else if(src.kind==='prop')focus=propFocus(s)
   else {if(!v3(stage.center))throw Error('No stage center');focus=stage.center}
   const progress=f.localTime/s.duration;
   const fov=s.framing?.fov??38;
   // Portrait aspect cuts horizontal field of view to only ~21° at 38° vertical.
   // The old 6.5-unit two-shot cropped a full actor's head; two actors at
   // x≈±1 each need >1.65 units half-width including facial silhouettes.
   // A 3.8-unit wide in-world monitor cannot fit a portrait shot at the old
   // actor-close-up distance (4.8): over half the authored text was cropped.
   // Preserve intentional user framing overrides, but fit the full screen by
   // default (including the .9-unit push move) with a little side breathing room.
   // Screen shots fill the portrait frame with the app's zoomed centre column (about 3.1 units wide), not the whole
   // landscape monitor (FrameForge 2026-11-09).
   const screenFit=1.6/(Math.tan(fov*Math.PI/360)*9/16);
   const baseDist=s.framing?.distance??(src.kind==='wide'?11.2:src.kind==='two'?9.4:src.kind==='screen'?screenFit:src.kind==='prop'?4.6:5.6);
   const mod={push:-.9,pull:.9,drift:0,orbit:0,static:0}[d.move]||0;
   const distance=baseDist+mod*smooth(progress);
   if(d.move==='orbit')azimuth+=.5*progress;
   if(d.move==='drift')azimuth+=.12*(progress-.5);
   let camY=focus[1]+.48+Math.sin(progress*Math.PI)*.04;
   if(src.kind==='screen'){
     // Rise just enough that the line of sight to the screen's lower edge clears the tallest head standing between
     // the camera and the screen (head anchors + 0.75 for hair, hats and antennae).
     const heads=Object.values(anchors).filter(a=>v3(a?.head)&&v3(a?.root));
     if(heads.length){
       const top=Math.max(...heads.map(a=>a.head[1]))+.75,castZ=heads.reduce((z,a)=>z+a.root[2],0)/heads.length;
       const camZ=focus[2]+Math.cos(azimuth)*distance,low=focus[1]-1.1,sa=(camZ-castZ)/Math.max(.01,camZ-focus[2]);
       if(sa>0&&sa<.98)camY=Math.max(camY,(top-low*sa)/(1-sa));
     }
   }
   // Close-ups aim a little below the head's centre so the whole head and some shoulders fit, with headroom
   // (FrameForge 2026-11-09: the old aim cropped the top of big heads).
   const aim=src.kind==='actor'?[focus[0],focus[1]-.32,focus[2]]:[...focus];
   if(src.kind==='actor')camY-=.18;
   const raw={position:[focus[0]+Math.sin(azimuth)*distance,camY,focus[2]+Math.cos(azimuth)*distance],
     target:aim,fov};
   const transition=p.hybrid.director?.oneTake&&f.index>0?'blend':d.transition;
   const blendSeconds=p.hybrid.director?.oneTake&&f.index>0?Math.min(.7,s.duration/3):d.blendSeconds;
   if(transition==='blend'&&f.index>0&&f.localTime<blendSeconds&&blendSeconds>0){
     const prior=p.shots[f.index-1],priorCamera=typeof prior.camera==='string'?{kind:prior.camera}:prior.camera;
     const pastFocus=priorCamera.kind==='actor'?head(priorCamera.target):priorCamera.kind==='two'?
       head(priorCamera.target).map((v,i)=>(v+head(priorCamera.secondary)[i])/2):
       priorCamera.kind==='screen'?stage.screen:priorCamera.kind==='prop'?propFocus(prior):stage.center;
     const k=smooth(f.localTime/blendSeconds),oldDist=prior.framing?.distance??5.4;
     raw.position=raw.position.map((v,i)=>lerp(
       [pastFocus[0]+Math.sin(.15)*oldDist,pastFocus[1]+.48,pastFocus[2]+Math.cos(.15)*oldDist][i],v,k));
     raw.target=raw.target.map((v,i)=>lerp(pastFocus[i],v,k));
   }
   return {...raw,shotId:s.id,localTime:f.localTime,move:d.move,
     transition,captionBounds:s.caption?{x:24,y:547,width:312,height:67}:null,
     screenBounds:s.screen?{x:30,y:133,width:300,height:310}:null};
 }
 return Object.freeze({verify,scriptToProject,projectToScript,reorderShots,cameraAt,performanceAt});
});