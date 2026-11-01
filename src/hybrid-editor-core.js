/* FrameForge hybrid creator state: pure undoable V2 editing, strict validation.
 * Edits replace immutable snapshots; voice is always invalidated on content change.
 * No serialization of external asset bytes, secrets, or TTS PCM into JSON.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./hybrid-project-core.js'),require('./hybrid-direction.js'));
 else root.FrameForgeHybridEditor=factory(root.FrameForgeHybridProjectCore,root.FrameForgeHybridDirector);
})(typeof globalThis!=='undefined'?globalThis:this,function(core,director){
 'use strict';
 const clone=x=>JSON.parse(JSON.stringify(x));
 const TEMPLATES=Object.freeze(['creator','human','robot','creature','bot','mascot']);
 const WORLDS=Object.freeze(['forest','meadow','snow','desk']);
 const EMOTIONS=Object.freeze(['neutral','happy','sad','angry','surprised','worried','curious','idea']);
 const MOVES=Object.freeze(['static','push','pull','drift','orbit']);
 const VOICES=Object.freeze(['af_heart','af_bella','am_michael','am_puck']);
 const match=(v,list,name)=>{if(!list.includes(v))throw Error('Unsupported '+name);return v};
 const safeString=(v,len,name)=>{if(typeof v!=='string'||!v.trim()||v.length>len)throw Error(name+' must be 1–'+len+' characters');return v.trim()};
 const slug=v=>String(v||'').toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,38);
 const ensure=(p)=>{core.assertProject(p);director.verify(p);return p};
 function fromLegacy(original){
  const p=core.upgradeLegacyProject(original);
  p.id='untitled-hybrid-story';
  p.title='My first FrameForge story';
  p.logline='Two original characters make a small story together.';
  const base=p.characters[0],alt=p.characters[1]||base;
  p.characters=[
   {...clone(base),id:'luna',name:'Luna',visualIdentity:'Original fictional human for independent stories',
    voice:{profile:'af_heart',voiceLock:'Consistent original local voice'},
    expressions:[...EMOTIONS],sheetStatus:'draft'},
   {...clone(alt),id:'atlas',name:'Atlas',visualIdentity:'Original fictional robot for independent stories',
    voice:{profile:'am_michael',voiceLock:'Consistent original local voice'},
    expressions:[...EMOTIONS],sheetStatus:'draft'}];
  p.hybrid={version:1,cast:{luna:{provider:'procedural',template:'human'},
    atlas:{provider:'procedural',template:'robot'}},
   world:{provider:'procedural',template:'forest',time:'golden',foliage:.07,wind:.5,particles:['dust']},
   assets:[],director:{oneTake:false}};
  p.shots=[
   {id:'shot-01',speaker:'luna',dialogue:'We can tell our own stories right here.',
    duration:3.2,intent:'A cheerful opening',camera:{kind:'actor',target:'luna'},
    cast:{luna:{emotion:'happy',action:'wave'},atlas:{emotion:'curious',action:'listen'}},
    direction:{move:'push',transition:'cut',blendSeconds:0},caption:'A STORY OF OUR OWN',
    timing:{lead:.15,pauseAfter:.35},firstFrameStatus:'draft'},
   {id:'shot-02',speaker:'atlas',dialogue:'Every new take starts with one great idea.',
    duration:3.5,intent:'A warm reply',camera:{kind:'two',target:'atlas',secondary:'luna'},
    cast:{luna:{emotion:'happy',action:'nod'},atlas:{emotion:'idea',action:'explain'}},
    direction:{move:'drift',transition:'blend',blendSeconds:.3},
    timing:{lead:.15,pauseAfter:.35},firstFrameStatus:'draft'}];
  p.audio={state:'storyboard_only',masterUrl:null};
  ensure(p);return p;
 }
 function createEditor(initial,{limit=35}={}){
  if(!Number.isInteger(limit)||limit<2||limit>100)throw Error('Invalid undo limit');
  let current=clone(ensure(initial)),undo=[],redo=[],voiceRevision=null;
  const commit=(fn)=>{
    const next=clone(current);fn(next);ensure(next);
    if(JSON.stringify(next)===JSON.stringify(current))return false;
    undo.push(current);if(undo.length>limit)undo.shift();
    current=next;redo=[];voiceRevision=null;return true;
  };
  const index=(p,id)=>{const i=p.shots.findIndex(s=>s.id===id);
    if(i<0)throw Error('Unknown shot');return i};
  const actor=(p,id)=>{const c=p.characters.find(c=>c.id===id);
    if(!c)throw Error('Unknown actor');return c};
  return Object.freeze({
   get project(){return clone(current)},
   get duration(){return current.shots.reduce((v,s)=>v+s.duration,0)},
   get canUndo(){return undo.length>0},
   get canRedo(){return redo.length>0},
   get voiced(){return voiceRevision!==null&&voiceRevision===JSON.stringify(current)},
   markVoiced:()=>{voiceRevision=JSON.stringify(current)},
   clearVoice:()=>{voiceRevision=null},
   title:v=>commit(p=>{p.title=safeString(v,120,'Title')}),
   logline:v=>commit(p=>{p.logline=safeString(v,1024,'Story idea')}),
   world:(template,time='golden')=>commit(p=>{
     p.hybrid.world={provider:'procedural',template:match(template,WORLDS,'world'),
       time:match(time,['morning','golden','night'],'time'),foliage:.07,wind:.5,particles:[]}}),
   cast:(id,{template,name,voice}={})=>commit(p=>{
     const c=actor(p,id),d=p.hybrid.cast[id];
     if(template!==undefined)d.template=match(template,TEMPLATES,'character');
     if(name!==undefined)c.name=safeString(name,80,'Character name');
     if(voice!==undefined)c.voice={...c.voice,profile:match(voice,VOICES,'voice')}}),
   shot:(id,patch)=>commit(p=>{
     const s=p.shots[index(p,id)];const {speaker,dialogue,emotion,action,camera,move,caption,duration,screenKind,screenTitle,screenLines}=patch;
     if(speaker!==undefined){actor(p,speaker);s.speaker=speaker}
     if(dialogue!==undefined)s.dialogue=safeString(dialogue,500,'Dialogue');
     if(emotion!==undefined){
       const e=match(emotion,EMOTIONS,'emotion');
       s.cast[s.speaker]={...(s.cast[s.speaker]||{}),emotion:e,action:s.cast[s.speaker]?.action||'explain'};
     }
     if(action!==undefined){s.cast[s.speaker]={...(s.cast[s.speaker]||{emotion:'neutral'}),action:safeString(action,28,'Action')}}
     if(camera!==undefined){
       if(camera==='wide'||camera==='screen')s.camera={kind:camera};
       else if(camera==='actor')s.camera={kind:'actor',target:s.speaker};
       else if(camera==='two'){const other=p.characters.find(c=>c.id!==s.speaker)?.id;
         if(!other)throw Error('Two-shot needs two actors');
         s.camera={kind:'two',target:s.speaker,secondary:other};
       }else throw Error('Unknown camera kind');
     }
     if(move!==undefined)s.direction={...(s.direction||{}),move:match(move,MOVES,'camera movement'),
       transition:s.direction?.transition||'cut',blendSeconds:s.direction?.blendSeconds||0};
     if(caption!==undefined){if(caption){s.caption=safeString(caption,140,'Caption')}else delete s.caption}
     if(duration!==undefined){if(!Number.isFinite(duration)||duration<.5||duration>15)throw Error('Shot must be 0.5–15s');
       s.duration=duration;}
     if(screenKind!==undefined){
       if(screenKind==='none')delete s.screen;
       else{s.screen={kind:match(screenKind,['terminal','chat','code','inbox','browser','grid'],'screen'),
         tone:'info',title:s.screen?.title||'On screen',lines:s.screen?.lines||['Ready']}}
     }
     if(screenTitle!==undefined){if(!s.screen)throw Error('Add a screen first');
       s.screen.title=safeString(screenTitle,160,'Screen title')}
     if(screenLines!==undefined){if(!s.screen)throw Error('Add a screen first');
       const lines=String(screenLines).split(/\r?\n/).map(v=>v.trim()).filter(Boolean);
       if(lines.length>16||lines.some(x=>x.length>120))throw Error('Screen has a maximum of 16 short lines');
       s.screen.lines=lines;
     }
   }),
   addShot:()=>commit(p=>{
     const count=p.shots.reduce((m,s)=>Math.max(m,Number(s.id.match(/^shot-(\d+)$/)?.[1]||0)),0)+1;
     const last=p.shots[p.shots.length-1],shot=clone(last);shot.id='shot-'+String(count).padStart(2,'0');
     shot.dialogue='Here is the next moment in our story.';shot.duration=3;
     shot.direction={move:'static',transition:'cut',blendSeconds:0};
     delete shot.screen;delete shot.caption;p.shots.push(shot)
   }),
   removeShot:id=>commit(p=>{if(p.shots.length<=1)throw Error('Keep at least one shot');
     p.shots.splice(index(p,id),1)}),
   moveShot:(id,dir)=>commit(p=>{const i=index(p,id),j=i+dir;
     if(j<0||j>=p.shots.length)throw Error('Cannot move past the timeline edge');
     [p.shots[i],p.shots[j]]=[p.shots[j],p.shots[i]]}),
   script:source=>{
     if(source===director.projectToScript(current))return false;
     const parsed=director.scriptToProject(source,current);
     if(!parsed.project)throw Error(parsed.errors.map(x=>x.message).join('; '));
     return commit(p=>{
       const previous=new Map(p.shots.map(s=>[s.id,s]));
       p.title=parsed.project.title;p.logline=parsed.project.logline;
       p.shots=parsed.project.shots.map(s=>{
         const old=previous.get(s.id);
         return old?{...clone(old),...clone(s),timing:clone(old.timing||s.timing||{lead:.15,pauseAfter:.35})}:clone(s);
       });
       p.hybrid.director=clone(parsed.project.hybrid.director||{oneTake:false});
     })
   },
   scriptText:()=>director.projectToScript(current),
   undo:()=>{if(!undo.length)return false;redo.push(current);current=undo.pop();voiceRevision=null;return true},
   redo:()=>{if(!redo.length)return false;undo.push(current);current=redo.pop();voiceRevision=null;return true},
   replace:p=>{ensure(p);undo=[];redo=[];current=clone(p);voiceRevision=null},
   serialize:()=>JSON.stringify({format:'frameforge.creator/1',project:current},null,2)
  });
 }
 function parseCreatorFile(raw){
  if(typeof raw!=='string'||raw.length>1_048_576)throw Error('Project must be a text file under 1 MB');
  const data=JSON.parse(raw);const p=data?.format==='frameforge.creator/1'?data.project:data;
  return clone(ensure(p));
 }
 return Object.freeze({TEMPLATES,WORLDS,EMOTIONS,MOVES,VOICES,fromLegacy,createEditor,parseCreatorFile});
});