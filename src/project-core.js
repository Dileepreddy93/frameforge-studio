/* FrameForge V5 project-core contract. Runs unchanged in Node and in a browser. */
(function(root,factory){
 const core=factory();
 if(typeof module==='object'&&module.exports)module.exports=core;
 else root.FrameForgeProjectCore=core;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const format='frameforge.project/1';
 const CAMERAS=new Set(['dev','blue','orange','duo','wide','screen']);
 const ACTOR_ID=/^[a-z][a-z0-9-]{0,39}$/;
 const isRecord=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 const goodText=(s,max=2048)=>typeof s==='string'&&s.trim().length>0&&s.length<=max;
 const allowedStatuses=new Set(['not_created','draft','approved']);
 function validateProject(p){
  const errors=[];
  const fail=(path,message)=>errors.push({path,message});
  if(!isRecord(p))return{valid:false,errors:[{path:'$',message:'Expected object'}]};
  if(p.schema!==format)fail('schema','Unsupported project schema');
  for(const field of ['id','title','logline'])if(!goodText(p[field],field==='logline'?1024:120))fail(field,'Required nonempty short text');
  if(!ACTOR_ID.test(String(p.id||'')))fail('id','Expected safe slug');
  if(!isRecord(p.output)||p.output.width!==1080||p.output.height!==1920||p.output.fps!==30)fail('output','Expected native 1080x1920 30 FPS project target');
  if(!isRecord(p.style)||!goodText(p.style.styleLock,1500))fail('style.styleLock','Missing immutable visual style');
  if(!isRecord(p.environment)||!ACTOR_ID.test(String(p.environment.id||''))||!goodText(p.environment.description))fail('environment','Missing environment specification');
  const safe=p.environment?.safeZone;
  if(!isRecord(safe)||!Number.isInteger(safe.top)||!Number.isInteger(safe.bottom)||safe.top<0||safe.bottom<0||safe.top+safe.bottom>950)fail('environment.safeZone','Invalid platform overlay safe zones');
  if(!Array.isArray(p.characters)||p.characters.length<1||p.characters.length>12)fail('characters','Expected 1-12 character identities');
  const characterIds=new Set();
  if(Array.isArray(p.characters))p.characters.forEach((c,i)=>{
   const at='characters['+i+']';
   if(!isRecord(c)){fail(at,'Expected object');return;}
   if(!ACTOR_ID.test(String(c.id||''))||characterIds.has(c.id))fail(at+'.id','Duplicate/invalid character id');
   characterIds.add(c.id);
   if(!goodText(c.name,80)||!goodText(c.visualIdentity,1500))fail(at,'Missing fixed character visual identity');
   if(!isRecord(c.voice)||!goodText(c.voice.voiceLock,600)||!goodText(c.voice.profile,120))fail(at+'.voice','Missing reusable voice identity');
   if(!allowedStatuses.has(c.sheetStatus))fail(at+'.sheetStatus','Must declare unapproved/draft/approved art');
   if(!Array.isArray(c.expressions)||c.expressions.length<4||new Set(c.expressions).size!==c.expressions.length)fail(at+'.expressions','Four distinct expressions required');
  });
  if(!Array.isArray(p.shots)||p.shots.length<1||p.shots.length>120)fail('shots','Expected 1-120 scenes');
  const ids=new Set();let total=0;
  if(Array.isArray(p.shots))p.shots.forEach((s,i)=>{
   const at='shots['+i+']';if(!isRecord(s)){fail(at,'Expected object');return;}
   if(!ACTOR_ID.test(String(s.id||''))||ids.has(s.id))fail(at+'.id','Duplicate/invalid shot id');
   ids.add(s.id);
   if(!goodText(s.dialogue,500))fail(at+'.dialogue','Missing spoken line');
   if(!characterIds.has(s.speaker))fail(at+'.speaker','Speaker is not a registered character');
   if(!CAMERAS.has(s.camera))fail(at+'.camera','Unknown camera preset');
   if(!Number.isFinite(s.duration)||s.duration<.4||s.duration>15)fail(at+'.duration','Duration outside 0.4 to 15 seconds');
   else total+=s.duration;
   if(!goodText(s.intent,200)||!goodText(s.emotion,80)||!goodText(s.action,80))fail(at,'Director intent, emotion and action required');
   if(!allowedStatuses.has(s.firstFrameStatus))fail(at+'.firstFrameStatus','Missing explicit first frame approval status');
   if(s.styleLock!==undefined&&s.styleLock!==p.style?.styleLock)fail(at+'.styleLock','Shot style lock drift');
  });
  if(total>180)fail('shots','Film exceeds 180-second limit');
  if(!isRecord(p.audio)||!['mastered','storyboard_only'].includes(p.audio.state))fail('audio.state','Mastered/storyboard_only state required');
  if(p.audio?.state==='mastered'&&!goodText(p.audio.masterUrl))fail('audio.masterUrl','Mastered episodes need a real media URL');
  if(p.audio?.state==='storyboard_only'&&p.audio.masterUrl)fail('audio.masterUrl','Storyboard-only episodes must not claim a master');
  return{valid:errors.length===0,errors,duration:+total.toFixed(3),shotCount:Array.isArray(p.shots)?p.shots.length:0};
 }
 function assertProject(p){
  const r=validateProject(p);
  if(!r.valid)throw new Error('Invalid FrameForge project: '+r.errors.map(e=>e.path+' '+e.message).join('; '));
  return p;
 }
 function toTimelineShots(p){
  assertProject(p);
  return p.shots.map(s=>({
   id:s.id,text:s.dialogue,speaker:s.speaker,camera:s.camera,
   duration:s.duration,intent:s.intent,emotion:s.emotion,action:s.action
  }));
 }
 function summary(p){const v=validateProject(p);return{id:p?.id||null,valid:v.valid,shotCount:v.shotCount,duration:v.duration,errors:v.errors};}
 return Object.freeze({schema:format,validateProject,assertProject,toTimelineShots,summary});
});
