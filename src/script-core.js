/* FrameForge script core: a plain-text script in, a planned episode out (and back). Runs in Node and the browser.

   One line per shot:
     # Zero Latency                                   the episode title (optional, first # line)
     > A developer asks two robots to make an app fast.  the logline (optional)
     [wall bad] p95 page load = 12.0 s                the story window behind the following lines (good|bad)
     DEV (worried): Our app takes twelve seconds to load.
     BLUE (happy): Done. Zero milliseconds.
     [screen good] Page load time = 0 ms | Instant page delivery achieved.
                                                      makes the line above a shot of the story window showing this
   Speakers are character ids or names (DEV, BLUE, ORANGE). Emotions: neutral, happy, worried, surprised, angry, sad,
   thinking. Blank lines and lines starting with // are ignored.

   The planner directs it the way the finished episodes are directed: each line on its speaker's close-up, the arena's
   wide once the third character has spoken, a two-shot to close, a screen shot where the script asks for one,
   acting from the line's emotion and punctuation, listeners who react (the shot planner in project-core cuts to them),
   and music and sound cues. Durations are estimates until the lines are voiced, which re-times every shot. */
(function(root,factory){
 const core=factory();
 if(typeof module==='object'&&module.exports)module.exports=core;
 else root.FrameForgeScript=core;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const EMOTIONS=['neutral','happy','worried','surprised','angry','sad','thinking'];
 const MAX_LINES=60,MAX_LINE=500;
 const SPEAKER=/^([A-Za-z][A-Za-z0-9 -]{0,39}?)\s*(?:\(\s*([A-Za-z]+)\s*\))?\s*:\s*(.+)$/;
 const BOX=/^\[\s*(wall|screen)(?:\s+(good|bad))?\s*\]\s*(.*)$/i;

 // Parse: text -> {title, logline, lines:[{speaker, emotion, text, wall?, screen?}], errors:[{line, message}]}.
 function parseScript(text,characters){
  const byKey=new Map();
  for(const c of characters){byKey.set(c.id.toLowerCase(),c.id);if(c.name)byKey.set(String(c.name).toLowerCase(),c.id);}
  const names=characters.map(c=>(c.name||c.id).toUpperCase()).join(', ');
  const out={title:'',logline:'',lines:[],errors:[]};let wall=null;
  String(text||'').split(/\r?\n/).forEach((raw,i)=>{
   const n=i+1,line=raw.trim();
   if(!line||line.startsWith('//'))return;
   if(line.startsWith('#')){const t=line.replace(/^#+\s*/,'');if(!out.title&&t)out.title=t.slice(0,120);return;}
   if(line.startsWith('>')){const l=line.replace(/^>\s*/,'');if(l)out.logline=(out.logline?out.logline+' ':'')+l;return;}
   const box=line.match(BOX);
   if(box){
    const kind=box[1].toLowerCase(),tone=(box[2]||'bad').toLowerCase(),body=box[3].trim();
    const [main,caption='']=body.split('|').map(x=>x.trim());
    const eq=main.indexOf('='),label=(eq<0?main:main.slice(0,eq)).trim(),value=(eq<0?'':main.slice(eq+1)).trim();
    if(!label||!value){out.errors.push({line:n,message:`write a ${kind} as [${kind} ${tone}] label = value${kind==='screen'?' | caption':''}`});return;}
    if(kind==='wall'){
     if(value.length>12||label.length>40){out.errors.push({line:n,message:'a wall value fits 12 characters and its label 40'});return;}
     wall={label,value,tone};return;
    }
    const prev=out.lines[out.lines.length-1];
    if(!prev){out.errors.push({line:n,message:'a [screen] line goes after the line spoken over it'});return;}
    if(value.length>40||label.length>40||caption.length>80){out.errors.push({line:n,message:'a screen value and label fit 40 characters, its caption 80'});return;}
    prev.screen={label,value,caption,tone};return;
   }
   const m=line.match(SPEAKER);
   if(!m){out.errors.push({line:n,message:`expected NAME: line, for example "${characters[0]?.name||'DEV'}: Hello." (speakers: ${names})`});return;}
   const speaker=byKey.get(m[1].trim().toLowerCase());
   if(!speaker){out.errors.push({line:n,message:`"${m[1].trim()}" is not in the cast (speakers: ${names})`});return;}
   const emotion=m[2]?m[2].toLowerCase():'neutral';
   if(!EMOTIONS.includes(emotion)){out.errors.push({line:n,message:`"${m[2]}" is not an emotion (${EMOTIONS.join(', ')})`});return;}
   const said=m[3].trim();
   if(said.length>MAX_LINE){out.errors.push({line:n,message:`a line can be ${MAX_LINE} characters at most`});return;}
   out.lines.push({speaker,emotion,text:said,...(wall?{wall:{...wall}}:{})});
  });
  if(!out.lines.length&&!out.errors.length)out.errors.push({line:0,message:'write at least one line, for example "DEV: Hello."'});
  if(out.lines.length>MAX_LINES)out.errors.push({line:0,message:`an episode can have ${MAX_LINES} lines at most`});
  return out;
 }

 // How the speaker acts a line: from its emotion first, then its punctuation.
 function speakerAction(emotion,text,i){
  const ask=/\?\s*$/.test(text),bang=/!\s*$/.test(text);
  if(emotion==='happy')return bang?'celebrate':'explain';
  if(emotion==='surprised')return'surprise';
  if(emotion==='worried')return ask?'plead':'react';
  if(emotion==='angry')return'alarm';
  if(emotion==='sad')return'defeat';
  if(emotion==='thinking')return'shrug';
  if(ask)return'question';
  if(bang)return'announce';
  return i===0?'typing':'explain';
 }
 // How the others take it: a question makes them think, an exclamation surprises them, bad news worries them.
 function listenerEmotion(line){
  if(/\?\s*$/.test(line.text))return'thinking';
  if(/!\s*$/.test(line.text))return'surprised';
  if(line.emotion==='worried'||line.emotion==='angry'||line.emotion==='sad'||line.screen?.tone==='bad')return'worried';
  if(line.emotion==='happy')return'happy';
  return'neutral';
 }
 const words=t=>String(t).split(/\s+/).filter(Boolean).length;
 const estimate=t=>Math.round(Math.min(8,Math.max(1.4,.5+words(t)/2.6))*30)/30;
 const slug=t=>(String(t).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,32)||'my-episode').replace(/^[^a-z]+/,'')||'my-episode';

 // Plan: parsed script + a base project (characters, style, voices, looks) -> a complete, valid project.
 function planEpisode(parsed,base,{defaultFraming}={}){
  const ids=base.characters.map(c=>c.id),lines=parsed.lines,n=lines.length;
  const cams=lines.map(l=>l.screen?'screen':l.speaker);
  // The arena's wide: on the first change of speaker after every character has been introduced on their own
  // close-up (and not before the fourth line).
  if(n>=6){const seen=new Set();let all=-1;for(let i=0;i<n;i++){seen.add(lines[i].speaker);
   if(all<0){if(seen.size>=Math.min(3,ids.length))all=i;continue;}
   if(i>=3&&cams[i]!=='screen'&&lines[i].speaker!==lines[i-1].speaker){cams[i]='wide';break;}}}
  // A two-shot to close, and never three close-ups of one character in a row.
  if(n>=4&&cams[n-1]!=='screen')cams[n-1]='duo';
  for(let i=2;i<n;i++)if(cams[i]===cams[i-1]&&cams[i]===cams[i-2]&&['dev','blue','orange'].includes(cams[i]))cams[i-1]='duo';
  const title=(parsed.title||base.title||'My episode').slice(0,120);
  const shots=lines.map((l,i)=>{
   const cast={};
   for(const id of ids)cast[id]=id===l.speaker?{action:speakerAction(l.emotion,l.text,i),emotion:l.emotion}
    :{action:i===0&&id==='dev'?'typing':'listen',emotion:listenerEmotion(l)};
   const shot={id:'shot-'+String(i+1).padStart(2,'0'),dialogue:l.text,speaker:l.speaker,camera:cams[i],duration:estimate(l.text),
    intent:i===0?'setup':i===n-1?'payoff':'escalation',cast,firstFrameStatus:'not_created',
    ...(defaultFraming?{framing:{...defaultFraming(cams[i]),move:i===n-1&&n>1?'pull':i%3===2?'drift':'push'}}:{})};
   if(l.wall)shot.wall={window:'Dashboard',label:l.wall.label,value:l.wall.value,badge:l.wall.tone==='bad'?'ALERT':'OK',tone:l.wall.tone};
   if(l.screen){
    const s=l.screen,good=s.tone==='good';
    shot.insert={window:'FRAMEFORGE  /  '+title.toUpperCase().slice(0,60),context:'prod / live',headline:s.label.toUpperCase(),value:s.value,
     caption:s.caption||(good?'Fixed.':'Something is wrong.'),request:('GET /'+slug(s.label)+'  -> '+s.value).slice(0,80),status:good?'ALL GOOD':'NEEDS A LOOK',
     footer:s.label.toUpperCase().slice(0,60)+': '+s.value.slice(0,18),label:s.label,tone:s.tone,graph:good?'drop':'flat'};
    shot.sfx=[{cue:'whoosh',at:0,gain:-6},{cue:good?'chime':'buzz',at:.25}];
   }else if(i===0&&shot.cast.dev?.action==='typing')shot.sfx=[{cue:'typing',at:0,gain:-4}];
   return shot;
  });
  const project={
   schema:base.schema,id:slug(title),title,logline:(parsed.logline||(title+': an episode written in the studio.')).slice(0,1024),
   output:base.output,style:base.style,environment:base.environment,characters:base.characters,
   ...(base.pronunciations?{pronunciations:base.pronunciations}:{}),
   shots,
   audio:{state:'storyboard_only',masterUrl:null,music:{bpm:104,cues:[{shot:shots[0].id,style:'groove'},
    ...(n>2?[{shot:shots[n-1].id,style:'stop'},{shot:shots[n-1].id,style:'sting',at:'afterLine'}]:[])]}}
  };
  return project;
 }

 // options.defaultFraming: the camera presets (FrameForgeProjectCore.defaultFraming), so each shot gets a move.
 function scriptToProject(text,base,options={}){
  const parsed=parseScript(text,base.characters);
  if(parsed.errors.length)return{project:null,errors:parsed.errors};
  return{project:planEpisode(parsed,base,options),errors:[]};
 }

 // An episode as its script, so any episode can be read and rewritten as text.
 function projectToScript(p){
  const name=Object.fromEntries(p.characters.map(c=>[c.id,(c.name||c.id).toUpperCase()]));
  const out=['# '+p.title];if(p.logline)out.push('> '+p.logline);out.push('');
  let wall='';
  for(const s of p.shots){
   if(s.wall){const w=`[wall ${s.wall.tone}] ${s.wall.label} = ${s.wall.value}`;if(w!==wall){out.push(w);wall=w;}}
   const emotion=s.cast?.[s.speaker]?.emotion;
   out.push(`${name[s.speaker]||s.speaker}${emotion&&emotion!=='neutral'?' ('+emotion+')':''}: ${s.dialogue}`);
   if(s.insert)out.push(`[screen ${s.insert.tone}] ${s.insert.label} = ${s.insert.value}${s.insert.caption?' | '+s.insert.caption:''}`);
  }
  return out.join('\n')+'\n';
 }

 return Object.freeze({parseScript,planEpisode,scriptToProject,projectToScript,EMOTIONS,MAX_LINES});
});
