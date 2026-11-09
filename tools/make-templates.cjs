#!/usr/bin/env node
// Builds the Creator's ready-made stories (plan phase 6) into projects/templates/*.frameforge.json, through the
// Creator's own validated editor core, so a template can never drift from the project format.
//   node tools/make-templates.cjs [--lantern <creator save file>]
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),M=require(path.join(root,'src/hybrid-editor-core.js'));
const out=path.join(root,'projects/templates');fs.mkdirSync(out,{recursive:true});
const base=()=>M.fromEpisode(JSON.parse(fs.readFileSync(path.join(root,'projects/zero-latency.frameforge.json'),'utf8')));
const EMO=['neutral','happy','sad','angry','surprised','worried','curious','idea'];

function story({id,title,logline,cast,world,shots,music='groove',ambient=true}){
  const p=base();
  p.id=id;p.title=title;p.logline=logline;delete p.banner;
  p.characters=cast.map(c=>({id:c.id,name:c.name,visualIdentity:'Original FrameForge character',
    voice:{profile:c.voice,voiceLock:'Consistent original local voice'},sheetStatus:'draft',expressions:[...EMO]}));
  p.hybrid.cast=Object.fromEntries(cast.map(c=>[c.id,{provider:'procedural',template:c.template,...(c.look?{look:c.look}:{})}]));
  p.hybrid.world={provider:'procedural',template:world.template,time:world.time,foliage:.07,wind:.5,particles:[],...(world.view?{view:world.view}:{})};
  p.hybrid.director={oneTake:false,subtitles:true};
  const ids=cast.map(c=>c.id);
  p.shots=shots.map((s,i)=>{
    const other=ids.find(x=>x!==s.who);
    const shot={id:'shot-'+String(i+1).padStart(2,'0'),speaker:s.who,dialogue:s.line,duration:s.secs||3,intent:s.intent||'scene',
      camera:s.cam==='two'?{kind:'two',target:s.who,secondary:other}:s.cam==='wide'?{kind:'wide'}:s.cam==='screen'?{kind:'screen'}:{kind:'actor',target:s.who},
      cast:Object.fromEntries(ids.map(x=>[x,x===s.who?{emotion:s.feel||'neutral',action:s.act||'explain'}:{emotion:s.listen||'curious',action:'listen'}])),
      direction:{move:s.move||'static',transition:'cut',blendSeconds:0},timing:{lead:.15,pauseAfter:.35},firstFrameStatus:'draft'};
    if(s.screen)shot.screen={kind:s.screen.kind,tone:s.screen.tone||'info',title:s.screen.title,lines:s.screen.lines};
    if(s.caption)shot.caption=s.caption;
    if(!ambient)shot.ambientScreen=false;
    if(s.sfx)shot.sfx=[{cue:s.sfx,at:.2,gain:-12}];
    return shot;
  });
  p.audio={state:'storyboard_only',masterUrl:null,...(music?{music:{bpm:104,cues:[{shot:'shot-01',style:music}]}}:{})};
  const checked=M.createEditor(p).project;   // throws if anything is invalid
  fs.writeFileSync(path.join(out,id+'.frameforge.json'),JSON.stringify({format:'frameforge.creator/1',project:checked},null,1)+'\n');
  return {id,title,shots:checked.shots.length,seconds:+checked.shots.reduce((t,s)=>t+s.duration,0).toFixed(1)};
}

const made=[];
made.push(story({id:'password-manager-explainer',title:'How a Password Manager Works',
  logline:'DEV explains to BLUE why one strong password beats fifty weak ones.',
  cast:[{id:'dev',name:'DEV',template:'dev',voice:'am_michael'},{id:'blue',name:'BLUE',template:'blue',voice:'af_heart'}],
  world:{template:'desk',time:'morning'},shots:[
  {who:'blue',line:'I use the same password everywhere. Is that bad?',feel:'curious',act:'shrug',cam:'actor',secs:3.4},
  {who:'dev',line:'If one site leaks it, every account is open.',feel:'worried',act:'explain',cam:'two',secs:3.4},
  {who:'dev',line:'A password manager remembers a different one for each site.',feel:'idea',act:'point-screen',cam:'screen',secs:3.8,
   screen:{kind:'browser',tone:'success',title:'Vault · 48 logins',lines:['email · strong','bank · strong','shop · strong','You remember one master password']}},
  {who:'blue',line:'So I only remember one?',feel:'surprised',act:'raise',cam:'actor',secs:2.6},
  {who:'dev',line:'One long master password, plus a second factor.',feel:'happy',act:'thumbsup',cam:'two',secs:3.4},
  {who:'blue',line:'Changing all of them today!',feel:'happy',act:'cheer',cam:'wide',secs:2.8,sfx:'chime'}]}));
made.push(story({id:'launch-day-ad',title:'Launch Day',
  logline:'ORANGE and BLUE announce a new app in thirty seconds.',
  cast:[{id:'orange',name:'ORANGE',template:'orange',voice:'bm_george'},{id:'blue',name:'BLUE',template:'blue',voice:'af_heart'}],
  world:{template:'desk',time:'night',view:'space'},music:'tension',shots:[
  {who:'blue',line:'Big news. Our app is live!',feel:'happy',act:'cheer',cam:'actor',secs:2.6,sfx:'whoosh'},
  {who:'orange',line:'It plans your week in one tap.',feel:'neutral',act:'explain',cam:'actor',secs:2.8},
  {who:'blue',line:'Look at that.',feel:'surprised',act:'point-screen',cam:'screen',secs:3.4,
   screen:{kind:'grid',tone:'success',title:'Your week, planned',lines:['[x] Gym · Mon 7:00','[x] Team call · Tue 10:00','[x] Groceries · Wed 18:30','(Done)']}},
  {who:'orange',line:'It also remembers your coffee order. Technically, that is a feature.',feel:'neutral',act:'crossarms',cam:'two',secs:4.0},
  {who:'blue',line:'Download it today. Link in the description!',feel:'happy',act:'wave',cam:'wide',secs:3.0,caption:'AVAILABLE NOW',sfx:'chime'}]}));
made.push(story({id:'why-leaves-change',title:'Why Leaves Change Colour',
  logline:'A curious fox asks a friendly mascot why autumn leaves turn red and gold.',
  cast:[{id:'fox',name:'Pip',template:'creature',voice:'af_nicole'},{id:'sunny',name:'Sunny',template:'mascot',voice:'af_bella'}],
  world:{template:'forest',time:'golden'},music:'groove',ambient:false,shots:[
  {who:'fox',line:'Sunny, why are the leaves turning orange?',feel:'curious',act:'point',cam:'actor',secs:3.2},
  {who:'sunny',line:'Leaves are green because of chlorophyll. It makes food from sunlight.',feel:'happy',act:'explain',cam:'two',secs:4.2},
  {who:'sunny',line:'In autumn the days get shorter, so trees stop making it.',feel:'neutral',act:'think',cam:'actor',secs:3.6},
  {who:'fox',line:'And then the green fades away?',feel:'surprised',act:'raise',cam:'actor',secs:2.8},
  {who:'sunny',line:'Yes! The yellow and orange were hiding there all along.',feel:'idea',act:'cheer',cam:'two',secs:3.6},
  {who:'fox',line:'Nature has secret colours!',feel:'happy',act:'hop',cam:'wide',secs:2.6,caption:'THE END',sfx:'pop'}]}));
const i=process.argv.indexOf('--lantern');
if(i>0){const raw=JSON.parse(fs.readFileSync(process.argv[i+1],'utf8')),p=raw.project||raw;
  p.id='the-lantern';p.hybrid.director={...(p.hybrid.director||{oneTake:false}),subtitles:true};
  const checked=M.createEditor(p).project;
  fs.writeFileSync(path.join(out,'the-lantern.frameforge.json'),JSON.stringify({format:'frameforge.creator/1',project:checked},null,1)+'\n');
  made.push({id:'the-lantern',title:checked.title,shots:checked.shots.length});}
fs.writeFileSync(path.join(out,'index.json'),JSON.stringify({templates:made.map(m=>({file:'templates/'+m.id+'.frameforge.json',label:m.title}))},null,1)+'\n');
console.log(JSON.stringify(made));
