/* FrameForge Ultimate: v2 hybrid project contract. No legacy renderer changes.
 * CommonJS in Node; UMD in browser (requires FrameForgeProjectCore first).
 * v1 is deliberately delegated byte-for-byte to src/project-core.js.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./project-core.js'));
  else root.FrameForgeHybridProjectCore = factory(root.FrameForgeProjectCore);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (legacy) {
  'use strict';
  if (!legacy || typeof legacy.validateProject !== 'function') throw Error('FrameForge v1 project core is required');
  const schema='frameforge.project/2';
  const MAX_CAST=12,MAX_SHOTS=120,MAX_SECONDS=180,MAX_ASSETS=80;
  const ID=/^[a-z][a-z0-9-]{0,39}$/;
  const FINITE=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
  const OBJ=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
  const TEXT=(s,max=2048)=>typeof s==='string'&&s.trim().length>0&&s.length<=max;
  const TYPES=new Set(['legacy','procedural','rigged']);
  const WORLDS=new Set(['legacy','procedural','imported']);
  const ASSET_TYPES=new Set(['character','world','backdrop']);
  const CAMERA_TYPES=new Set(['actor','two','wide','screen','prop']);
  const LEGACY_CAMERAS=new Set(['dev','blue','orange','duo','wide','screen']);
  const EMOTIONS=new Set([...legacy.emotions,'curious','idea']);
  const ACTIONS=new Set([...legacy.actions,'none','wave','point','point-screen','point-other','shrug',
    'facepalm','think','cheer','clap','thumbsup','crossarms','handsup','nod','headshake','lean',
    'jump','type','press','raise','hop','enter','exit','sit','stand']);
  const SAFE_URI=/^asset:\/\/[a-z][a-z0-9-]{0,39}$/;
  const allowedTop=new Set(['schema','id','title','logline','banner','output','style','environment',
    'characters','shots','audio','pronunciations','hybrid']);
  const oldKeys=new Set(['schema','id','title','logline','banner','output','style','environment',
    'characters','shots','audio','pronunciations']);

  function validateProject(p){
    if(p?.schema===legacy.schema)return legacy.validateProject(p);
    const errors=[],fail=(path,message)=>errors.push({path,message});
    if(!OBJ(p))return {valid:false,errors:[{path:'$',message:'Expected project object'}],duration:0,shotCount:0};
    if(p.schema!==schema)fail('schema','Expected '+schema);
    for(const k of Object.keys(p))if(!allowedTop.has(k))fail(k,'Unknown top-level project field');
    if(!ID.test(String(p.id||'')))fail('id','Expected safe slug');
    if(!TEXT(p.title,120)||!TEXT(p.logline,1024))fail('title/logline','Required title and logline');
    if(p.banner!==undefined&&!TEXT(p.banner,80))fail('banner','Invalid short banner');
    if(!OBJ(p.output)||p.output.width!==1080||p.output.height!==1920||p.output.fps!==30)
      fail('output','Target must remain 1080x1920 at 30 fps for this release');
    if(!OBJ(p.style)||!TEXT(p.style.styleLock,1500))fail('style','Missing locked original visual identity');
    if(!OBJ(p.environment)||!ID.test(String(p.environment.id||''))||!TEXT(p.environment.description))
      fail('environment','Expected environment id and description');
    const safe=p.environment?.safeZone;
    if(!OBJ(safe)||!Number.isInteger(safe.top)||!Number.isInteger(safe.bottom)||
       safe.top<0||safe.bottom<0||safe.top+safe.bottom>950)
      fail('environment.safeZone','Invalid platform safe zones');
    if(!Array.isArray(p.characters)||p.characters.length<1||p.characters.length>MAX_CAST)
      fail('characters','Expected 1-'+MAX_CAST+' character identities');
    const charIds=new Set();
    if(Array.isArray(p.characters))p.characters.forEach((c,i)=>{
      const at='characters['+i+']';
      if(!OBJ(c)){fail(at,'Expected character object');return}
      if(!ID.test(String(c.id||''))||charIds.has(c.id))fail(at+'.id','Invalid/duplicate character id');
      charIds.add(c.id);
      if(!TEXT(c.name,80)||!TEXT(c.visualIdentity,1500))fail(at,'Missing name or visualIdentity');
      if(!OBJ(c.voice)||!TEXT(c.voice.voiceLock,600)||!TEXT(c.voice.profile,120))
        fail(at+'.voice','Missing voice identity');
      if(!Array.isArray(c.expressions)||c.expressions.length<4||new Set(c.expressions).size!==c.expressions.length||
         c.expressions.some(e=>!EMOTIONS.has(e)))fail(at+'.expressions','Expected four or more supported distinct expressions');
      if(!['not_created','draft','approved'].includes(c.sheetStatus))fail(at+'.sheetStatus','Missing artwork status');
      if(c.look!==undefined&&(!OBJ(c.look)||Object.values(c.look).some(v=>!/^#[a-f0-9]{6}$/i.test(String(v)))))
        fail(at+'.look','Look colors must be six-digit hex values');
    });
    const hybrid=p.hybrid;
    if(hybrid?.director!==undefined&&(!OBJ(hybrid.director)||
      typeof hybrid.director.oneTake!=='boolean'||
      (hybrid.director.subtitles!==undefined&&typeof hybrid.director.subtitles!=='boolean')||
      Object.keys(hybrid.director).some(k=>!['oneTake','subtitles'].includes(k))))
      fail('hybrid.director','Director options are oneTake and optional subtitles (true or false)');

    if(!OBJ(hybrid)||hybrid.version!==1)fail('hybrid','Expected hybrid version 1');
    const cast=hybrid?.cast;
    if(!OBJ(cast))fail('hybrid.cast','Expected an actor descriptor for every character');
    if(OBJ(cast)){
      for(const id of Object.keys(cast))if(!charIds.has(id))fail('hybrid.cast.'+id,'Unknown actor');
      for(const id of charIds){
        const a=cast[id];
        if(!OBJ(a)||!TYPES.has(a.provider)){fail('hybrid.cast.'+id,'Missing/unknown actor provider');continue}
        if(a.provider==='legacy'&&!['dev','blue','orange'].includes(id))
          fail('hybrid.cast.'+id,'The legacy renderer has no rig for this character');
        if(a.provider==='procedural'&&!ID.test(String(a.template||'')))
          fail('hybrid.cast.'+id+'.template','Expected a template id');
        if(a.provider==='rigged'&&!ID.test(String(a.assetId||'')))
          fail('hybrid.cast.'+id+'.assetId','Rigged actors require an asset id');
      }
    }
    const w=hybrid?.world;
    if(!OBJ(w)||!WORLDS.has(w.provider))fail('hybrid.world','Missing/unknown world provider');
    else {
      if(w.provider==='procedural'&&!ID.test(String(w.template||'')))
        fail('hybrid.world.template','Procedural worlds require a template id');
      if(w.provider==='imported'&&!ID.test(String(w.assetId||'')))
        fail('hybrid.world.assetId','Imported worlds require an asset id');
    }
    const assets=hybrid?.assets??[];
    if(!Array.isArray(assets)||assets.length>MAX_ASSETS)fail('hybrid.assets','Expected at most '+MAX_ASSETS+' assets');
    const assetMap=new Map();
    if(Array.isArray(assets))assets.forEach((a,i)=>{
      const at='hybrid.assets['+i+']';
      if(!OBJ(a)||!ID.test(String(a.id||''))||assetMap.has(a.id)||!ASSET_TYPES.has(a.kind)||
        typeof a.uri!=='string'||!SAFE_URI.test(a.uri)||a.uri!=='asset://'+a.id)
        fail(at,'Expected unique safe id, kind, and matching asset://id reference');
      else assetMap.set(a.id,a.kind);
    });
    if(OBJ(cast))for(const [id,a] of Object.entries(cast))
      if(a?.provider==='rigged'&&assetMap.get(a.assetId)!=='character')
        fail('hybrid.cast.'+id+'.assetId','Missing character asset');
    if(w?.provider==='imported'&&assetMap.get(w.assetId)!=='world')
      fail('hybrid.world.assetId','Missing world asset');
    if(!Array.isArray(p.shots)||p.shots.length<1||p.shots.length>MAX_SHOTS)
      fail('shots','Expected 1-'+MAX_SHOTS+' shots');
    const shots=new Set();let total=0;
    if(Array.isArray(p.shots))p.shots.forEach((s,i)=>{
      const at='shots['+i+']';
      if(!OBJ(s)){fail(at,'Expected shot object');return}
      if(!ID.test(String(s.id||''))||shots.has(s.id))fail(at+'.id','Invalid/duplicate shot id');
      shots.add(s.id);
      if(!TEXT(s.dialogue,2048)||!charIds.has(s.speaker))fail(at+'.dialogue/speaker','Dialogue and registered speaker required');
      if(!FINITE(s.duration,0.4,15))fail(at+'.duration','Duration must be 0.4-15 seconds');
      else total+=s.duration;
      if(!TEXT(s.intent,240))fail(at+'.intent','Short director intent required');
      if(!['not_created','draft','approved'].includes(s.firstFrameStatus))
        fail(at+'.firstFrameStatus','Required status');
      if(s.styleLock!==undefined&&s.styleLock!==p.style?.styleLock)fail(at+'.styleLock','Style lock drift');
      if(s.direction!==undefined && (!OBJ(s.direction)||
        !['static','push','pull','drift','orbit'].includes(s.direction.move)||
        !['cut','blend'].includes(s.direction.transition)||
        !FINITE(s.direction.blendSeconds??0,0,1.5)||
        (s.direction.transition==='blend'&&s.direction.blendSeconds>s.duration/2)))
        fail(at+'.direction','Invalid director camera movement/transition');
      if(s.screen!==undefined && (!OBJ(s.screen)||
        !['terminal','chat','code','inbox','browser','grid'].includes(s.screen.kind)||
        !['info','calm','alert','success'].includes(s.screen.tone)||
        !TEXT(s.screen.title,160)||!Array.isArray(s.screen.lines)||
        s.screen.lines.length>16||s.screen.lines.some(x=>!TEXT(x,120))))
        fail(at+'.screen','Screen app must contain safe authored text and supported kind');
      if(s.ambientScreen!==undefined&&typeof s.ambientScreen!=='boolean')
        fail(at+'.ambientScreen','Background monitor must be true or false');
      if(s.visualProp!==undefined&&s.visualProp!=='lantern')
        fail(at+'.visualProp','Unsupported on-set visual prop');
      if(s.propInteraction!==undefined&&(!OBJ(s.propInteraction)||s.visualProp!=='lantern'||
        !['ground','reach','lift','carry'].includes(s.propInteraction.mode)||
        !charIds.has(s.propInteraction.actor)||Object.keys(s.propInteraction).some(k=>!['actor','mode'].includes(k))))
        fail(at+'.propInteraction','Lantern interaction requires a registered actor and safe action');
      if(s.caption!==undefined&&!TEXT(s.caption,140))
        fail(at+'.caption','Caption exceeds safety limit');
      if(s.reactions!==undefined&&(!Array.isArray(s.reactions)||
        s.reactions.length>6||s.reactions.some(r=>!OBJ(r)||!charIds.has(r.actor)||
          !EMOTIONS.has(r.emotion)||!ACTIONS.has(r.action)||!FINITE(r.at,0,s.duration))))
        fail(at+'.reactions','Reaction requires registered actor, safe action and in-shot time');

      if(typeof s.camera==='string'){
        if(!LEGACY_CAMERAS.has(s.camera))fail(at+'.camera','Unknown legacy camera');
        if(['dev','blue','orange'].includes(s.camera)&&!charIds.has(s.camera))
          fail(at+'.camera','Camera subject is absent');
      }else if(OBJ(s.camera)){
        if(!CAMERA_TYPES.has(s.camera.kind))fail(at+'.camera.kind','Unknown camera type');
        if(s.camera.kind==='prop'&&s.visualProp!=='lantern')
          fail(at+'.camera','Prop camera requires a visible lantern');
        if(s.camera.kind==='actor'&&!charIds.has(s.camera.target))
          fail(at+'.camera.target','Missing/unknown camera target');
        if(s.camera.kind==='two'&&(!charIds.has(s.camera.target)||!charIds.has(s.camera.secondary)||
           s.camera.target===s.camera.secondary))fail(at+'.camera','Two distinct actors required');
      }else fail(at+'.camera','Expected preset name or camera descriptor');
      if(s.cast!==undefined&&(!OBJ(s.cast)||Object.entries(s.cast).some(([id,v])=>
        !charIds.has(id)||!OBJ(v)||(v.action!==undefined&&!ACTIONS.has(v.action))||
        (v.emotion!==undefined&&!EMOTIONS.has(v.emotion)))))
        fail(at+'.cast','Invalid actor performance');
      if(s.framing!==undefined&&(!OBJ(s.framing)||!Object.values(s.framing).every(v=>
        typeof v==='number'&&Number.isFinite(v)||typeof v==='string'&&ID.test(v))||
        (s.framing.fov!==undefined&&!FINITE(s.framing.fov,15,75))||
        (s.framing.distance!==undefined&&!FINITE(s.framing.distance,1,30))))
        fail(at+'.framing','Invalid camera framing');
      if(s.timing!==undefined&&(!OBJ(s.timing)||
        (s.timing.lead!==undefined&&!FINITE(s.timing.lead,0,2))||
        (s.timing.pauseAfter!==undefined&&!FINITE(s.timing.pauseAfter,0,4))||
        (s.timing.pace!==undefined&&!FINITE(s.timing.pace,.7,1.4))))
        fail(at+'.timing','Invalid voice timing');
    });
    if(total>MAX_SECONDS)fail('shots','Film exceeds '+MAX_SECONDS+' seconds');
    if(!OBJ(p.audio)||!['mastered','storyboard_only'].includes(p.audio.state))
      fail('audio','Expected mastered or storyboard_only');
    if(p.audio?.state==='mastered'&&!TEXT(p.audio.masterUrl,2048))
      fail('audio.masterUrl','Master audio path required');
    if(p.audio?.state==='storyboard_only'&&p.audio.masterUrl)
      fail('audio.masterUrl','Storyboard must not claim a mastered track');
    return {valid:errors.length===0,errors,duration:+total.toFixed(3),
      shotCount:Array.isArray(p.shots)?p.shots.length:0};
  }
  const clone=x=>JSON.parse(JSON.stringify(x));
  function assertProject(p){
    const v=validateProject(p);
    if(!v.valid)throw Error('Invalid hybrid project: '+v.errors.map(x=>x.path+' '+x.message).join('; '));
    return p;
  }
  function upgradeLegacyProject(original){
    legacy.assertRendererCompatible(original);
    const p=clone(original);
    p.schema=schema;
    p.hybrid={
      version:1,
      cast:Object.fromEntries(p.characters.map(c=>[c.id,{provider:'legacy'}])),
      world:{provider:'legacy'},
      assets:[]
    };
    assertProject(p);
    return p;
  }
  function toLegacyProject(p){
    assertProject(p);
    if(p.schema===legacy.schema)return clone(p);
    const h=p.hybrid;
    if(h.world.provider!=='legacy'||(h.assets??[]).length||
       p.characters.some(c=>h.cast[c.id]?.provider!=='legacy')||
       p.shots.some(s=>typeof s.camera!=='string'))
      throw Error('Extended v2 actor/world/camera features cannot be downgraded to the V6 renderer');
    const out=clone(p);out.schema=legacy.schema;delete out.hybrid;
    for(const k of Object.keys(out))if(!oldKeys.has(k))throw Error('Cannot silently discard extended field '+k);
    legacy.assertRendererCompatible(out);
    return out;
  }
  function timeAt(p,seconds) {
    assertProject(p);
    const end=p.shots.reduce((sum,s)=>sum+s.duration,0);
    if(!FINITE(seconds,0,end))throw RangeError('Time is outside episode duration');
    let begin=0,shot=p.shots[p.shots.length-1],index=p.shots.length-1;
    for(let i=0;i<p.shots.length;i++){
      const next=begin+p.shots[i].duration;
      if(seconds<next||i===p.shots.length-1){shot=p.shots[i];index=i;break}
      begin=next;
    }
    return Object.freeze({time:seconds,duration:end,index,shotId:shot.id,localTime:seconds-begin,
      speaker:shot.speaker,camera:clone(shot.camera),shot:clone(shot),
      world:p.schema===schema?clone(p.hybrid.world):{provider:'legacy'}});
  }
  function toTimelineShots(p) {
    assertProject(p);
    if(p.schema===legacy.schema)return legacy.toTimelineShots(p);
    const timeline=[],start={value:0};
    p.shots.forEach((s,i)=>{
      const cast=Object.fromEntries(p.characters.map(c=>[c.id,{
        action:s.cast?.[c.id]?.action??(c.id===s.speaker?'explain':'listen'),
        emotion:s.cast?.[c.id]?.emotion??'neutral'}]));
      timeline.push({...clone(s),start:start.value,index:i,text:s.dialogue,cast});
      start.value+=s.duration;
    });
    return timeline;
  }
  return Object.freeze({schema,legacySchema:legacy.schema,validateProject,assertProject,
    upgradeLegacyProject,toLegacyProject,timeAt,toTimelineShots});
});
