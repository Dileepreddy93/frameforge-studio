// FrameForge P7 Creator. Real model, no React state duplication, no telemetry.
import {createProjectStore} from './hybrid-editor-storage.mjs';
import {exportHybridFilm} from './hybrid-browser-export.mjs';
const $=id=>document.getElementById(id),M=window.FrameForgeHybridEditor,C=window.FrameForgeHybridProjectCore;
let editor=null,store=null,engine=null,selected='shot-01',play=false,last=0,animation=0;
let busy=false,exportAbort=null,storageSequence=Promise.resolve(),rebuildGeneration=0,recoveryRaw=null,initialRecoveryCorrupt=false;
let audioContext=null,audioSource=null,audioTimelineStart=null;
const text=(id,message)=>{$(id).textContent=message};
function download(blob,name){
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),30000);
}
const projectDuration=p=>p.shots.reduce((sum,s)=>sum+s.duration,0);
const byId=(p,id)=>p.shots.find(s=>s.id===id)||p.shots[0];
const fillSelect=(el,items,value)=>{
 el.replaceChildren();
 for(const item of items){
   const [val,label]=Array.isArray(item)?item:[item,item];
   el.append(new Option(label,val));
 }
 el.value=value;
};
const stopAudio=()=>{if(audioSource){try{audioSource.stop()}catch{}audioSource.disconnect();audioSource=null}};
const stop=()=>{play=false;cancelAnimationFrame(animation);stopAudio();audioTimelineStart=null;$('play').textContent='Play'};
async function startVoicePlayback(at){
 if(!editor?.voiced)return false;
 const mix=engine.getExportAudio();
 if(mix.sampleRate!==48000||mix.left.length!==mix.right.length)
   throw Error('Unsupported voice master');
 audioContext??=new (window.AudioContext||window.webkitAudioContext)({sampleRate:48000});
 await audioContext.resume();
 const source=audioContext.createBufferSource();
 const buf=audioContext.createBuffer(2,mix.left.length,mix.sampleRate);
 buf.copyToChannel(mix.left,0);buf.copyToChannel(mix.right,1);
 source.buffer=buf;source.connect(audioContext.destination);
 audioSource=source;audioTimelineStart=audioContext.currentTime-at;
 source.onended=()=>{if(audioSource===source){audioSource.disconnect();audioSource=null}};
 source.start(0,at);
 return true;
}
function frame(t){
 if(!engine||!editor)return;
 const duration=projectDuration(editor.project),safe=Math.min(Math.max(0,t),Math.max(0,duration-.02));
 const result=engine.frameAt(safe);
 if(result?.image?.startsWith('data:image/png;base64,')){
   $('frame').src=result.image;$('frame').hidden=false;$('placeholder').hidden=true;
 }
 $('time').value=safe.toFixed(2)+'s';$('scrub').value=String(safe);
}
function setBusy(value){busy=value;
 for(const id of ['voice','render','still','play','export','add-shot','save-project','open-project'])
  $(id).disabled=value||!engine||!editor||id==='export'&&!editor.voiced;
 $('cancel').disabled=!exportAbort;
}
function renderUI({render3d=true}={}){
 if(!editor)return;
 const p=editor.project;
 $('title').value=p.title;$('logline').value=p.logline;
 $('world').value=p.hybrid.world.template;
 $('timeofday').value=p.hybrid.world.time||'golden';
 const cast=$('cast');cast.replaceChildren();
 for(const character of p.characters){
   const area=document.createElement('section'),head=document.createElement('h3');
   head.textContent=character.name;
   const name=document.createElement('input');name.id='cast-name-'+character.id;name.value=character.name;
   name.setAttribute('aria-label','Name of '+character.name);
   const type=document.createElement('select');type.id='cast-type-'+character.id;
   fillSelect(type,M.TEMPLATES,p.hybrid.cast[character.id].template);
   type.setAttribute('aria-label','3D character model for '+character.name);
   const voice=document.createElement('select');voice.id='cast-voice-'+character.id;
   fillSelect(voice,M.VOICES,character.voice.profile);
   voice.setAttribute('aria-label','Voice for '+character.name);
   const grid=document.createElement('div');grid.className='cols';
   const column=(label,control)=>{const div=document.createElement('div'),l=document.createElement('label');
     l.textContent=label;l.htmlFor=control.id;div.append(l,control);return div};
   grid.append(column('Character model',type),column('English voice',voice));
   const wrapper=document.createElement('div');
   const l=document.createElement('label');l.textContent='Character name';l.htmlFor=name.id;
   wrapper.append(l,name);area.append(head,wrapper,grid);cast.append(area);
   const change=patch=>changeProject(()=>editor.cast(character.id,patch));
   name.onchange=()=>change({name:name.value});
   type.onchange=()=>change({template:type.value});
   voice.onchange=()=>change({voice:voice.value});
 }
 const shots=$('shot-list');shots.replaceChildren();
 for(let i=0;i<p.shots.length;i++){
   const s=p.shots[i],li=document.createElement('li'),button=document.createElement('button');
   button.type='button';button.dataset.shot=s.id;
   button.setAttribute('aria-current',String(s.id===selected));
   const strong=document.createElement('strong'),small=document.createElement('small');
   strong.textContent='SHOT '+String(i+1).padStart(2,'0')+' · '+s.duration.toFixed(1)+'s';
   small.textContent=s.dialogue;button.append(strong,small);li.append(button);shots.append(li);
   button.onclick=()=>{
     selected=s.id;renderUI({render3d:false});
     let elapsed=0;for(const x of p.shots){if(x.id===selected)break;elapsed+=x.duration}
     stop();frame(elapsed+.05);
   };
 }
 const current=byId(p,selected);selected=current.id;
 fillSelect($('speaker'),p.characters.map(x=>[x.id,x.name]),current.speaker);
 $('dialogue').value=current.dialogue;$('emotion').value=current.cast?.[current.speaker]?.emotion||'neutral';
 $('action').value=current.cast?.[current.speaker]?.action||'explain';
 $('camera').value=current.camera?.kind||'actor';$('move').value=current.direction?.move||'static';
 $('caption').value=current.caption||'';$('shot-duration').value=current.duration.toFixed(2);
 $('screenKind').value=current.screen?.kind||'none';
 $('screenTitle').disabled=!current.screen;$('screenLines').disabled=!current.screen;
 $('screenTitle').value=current.screen?.title||'';$('screenLines').value=current.screen?.lines.join('\n')||'';
 $('undo').disabled=!editor.canUndo;$('redo').disabled=!editor.canRedo;
 $('delete-shot').disabled=p.shots.length<=1;
 const n=p.shots.findIndex(x=>x.id===selected);
 $('move-up').disabled=n===0;$('move-down').disabled=n===p.shots.length-1;
 $('scrub').max=String(Math.max(.5,projectDuration(p)-.015));
 $('export').disabled=!editor.voiced||busy;
 $('voice-status').textContent=editor.voiced?
   'Current English dialogue is voiced and ready for MP4. Reopening requires voice regeneration.':
   'Storyboard only — changed text/cast/world has no valid spoken soundtrack. Generate English voice again.';
 if(!$('script-pane').hidden)$('script').value=editor.scriptText();
 if(render3d&&engine)rebuild();
}
function queueSave(){
 if(!store||initialRecoveryCorrupt)return;
 const json=editor.serialize();
 storageSequence=storageSequence.catch(()=>{}).then(async()=>{
   try{await store.save(json);
     text('storage-status','Autosaved on this device ('+store.mode+'). Download a copy before clearing browser storage.')}
   catch(e){text('storage-status','Storage error: '+e.message+' Download a backup now.')}
 });
}
function rebuild(){
 const token=++rebuildGeneration;
 stop();if(!engine||busy)return;
 try{
   const p=editor.project;
   const result=engine.loadEditable(p);
   if(token!==rebuildGeneration)return;
   $('scrub').value='0';frame(0);
   text('status','Rendered '+p.shots.length+' editable shots in '+p.hybrid.world.template+'.');
   $('play').disabled=false;$('still').disabled=false;$('render').disabled=false;$('voice').disabled=false;
   $('export').disabled=true;
 }catch(e){text('status','Scene unavailable: '+e.message);$('export').disabled=true}
}
function changeProject(action){
 if(!editor||busy)return;
 try{if(action()){initialRecoveryCorrupt=false;renderUI();queueSave()}}
 catch(e){text('status','Not saved: '+e.message);renderUI({render3d:false})}
}
for(const id of ['title','logline'])$(id).onchange=()=>changeProject(()=>editor[id]($(id).value));
for(const id of ['world','timeofday'])$(id).onchange=()=>changeProject(()=>editor.world($('world').value,$('timeofday').value));
for(const id of ['speaker','dialogue','emotion','action','camera','move','caption','shot-duration','screenKind','screenTitle','screenLines'])
 $(id).onchange=()=>{
   const patchKey=id==='shot-duration'?'duration':id;
   const patch={ [patchKey]:id==='shot-duration'?Number($(id).value):$(id).value};
   // Screen camel-case as expected by the V2 editor model.
   const mapped=id==='screenKind'?'screenKind':id==='screenTitle'?'screenTitle':
     id==='screenLines'?'screenLines':patchKey;
   changeProject(()=>editor.shot(selected,{[mapped]:patch[patchKey]}));
 };
$('add-shot').onclick=()=>changeProject(()=>editor.addShot());
$('delete-shot').onclick=()=>changeProject(()=>editor.removeShot(selected));
$('move-up').onclick=()=>changeProject(()=>editor.moveShot(selected,-1));
$('move-down').onclick=()=>changeProject(()=>editor.moveShot(selected,1));
$('undo').onclick=()=>{if(editor?.undo()){renderUI();queueSave()}};
$('redo').onclick=()=>{if(editor?.redo()){renderUI();queueSave()}};
$('script-toggle').onclick=()=>{
 $('script-pane').hidden=!$('script-pane').hidden;
 if(!$('script-pane').hidden)$('script').value=editor.scriptText();
};
$('apply-script').onclick=()=>changeProject(()=>editor.script($('script').value));
$('scrub').oninput=()=>{stop();try{frame(Number($('scrub').value))}catch(e){text('status',e.message)}};
function tick(now){
 if(!play)return;if(!last)last=now;
 const next=audioSource&&audioTimelineStart!==null?
   audioContext.currentTime-audioTimelineStart:
   Number($('scrub').value)+Math.min(.09,Math.max(0,(now-last)/1000));
 last=now;
 if(next>=projectDuration(editor.project)-.02){stop();frame(0);return}
 try{frame(next)}catch(e){stop();text('status',e.message);return}
 animation=requestAnimationFrame(tick);
}
$('play').onclick=async()=>{
 if(!engine)return;if(play){stop();return}
 const offset=Number($('scrub').value);
 try{await startVoicePlayback(offset)}
 catch(error){text('status','Audio preview unavailable: '+error.message+'. Visual preview still works.')}
 play=true;last=0;$('play').textContent=editor?.voiced?'Pause film and voice':'Pause silent preview';
 animation=requestAnimationFrame(tick);
};
$('still').onclick=()=>{
 if(!engine)return;
 const png=engine.frameAt(Number($('scrub').value)).image;
 const a=document.createElement('a');a.href=png;a.download='frameforge-'+editor.project.id+'-frame.png';a.click();
};
$('render').onclick=()=>rebuild();
$('save-project').onclick=()=>{
 if(!editor)return;download(new Blob([editor.serialize()],{type:'application/json'}),
   'frameforge-'+editor.project.id+'.json');
};
$('recovery-backup').onclick=()=>{
 if(!recoveryRaw)return;
 download(new Blob([recoveryRaw],{type:'text/plain'}),
   'frameforge-damaged-local-recovery.txt');
};
$('open-project').onclick=()=>$('file').click();
$('file').onchange=async()=>{
 const file=$('file').files?.[0];$('file').value='';if(!file)return;
 try{
   if(file.size>1_048_576)throw Error('Project file exceeds 1 MB');
   const p=M.parseCreatorFile(await file.text());
   editor.replace(p);selected=p.shots[0].id;initialRecoveryCorrupt=false;renderUI();queueSave();
   text('status','Validated project reopened. Generate current voices before export.');
 }catch(e){text('status','Project import refused: '+e.message)}
};
$('voice').onclick=async()=>{
 if(!engine||!editor||busy)return;
 stop();setBusy(true);
 text('voice-status','Synthesizing current English dialogue with the local Kokoro model. Model download may be large.');
 try{
   const result=await engine.generateEditableVoices();
   editor.replace(result.project);editor.markVoiced();selected=result.project.shots[0].id;
   renderUI({render3d:false});frame(0);queueSave();
   text('voice-status','Real English speech generated for '+result.markers.length+' shots. Audio is held locally in this session; voice again after reopening.');
   text('status','Current film voiced and ready to preview/export on compatible hardware.');
 }catch(e){text('voice-status','No speech was saved: '+e.message)}
 finally{setBusy(false);$('export').disabled=!editor.voiced}
};
$('cancel').onclick=()=>{exportAbort?.abort(new DOMException('User cancelled export','AbortError'))};
$('export').onclick=async()=>{
 if(!engine||!editor.voiced||busy)return;
 stop();exportAbort=new AbortController();setBusy(true);$('cancel').disabled=false;
 $('progress').hidden=false;$('progress').value=0;
 text('export-status','Checking real H264/AAC encoders…');
 try{
   const duration=projectDuration(editor.project);
   const seconds=$('seconds').value==='full'?Math.min(duration,60):Math.min(2,duration);
   const result=await exportHybridFilm(engine,{width:Number($('resolution').value),
    seconds,signal:exportAbort.signal,
    onProgress:p=>{$('progress').value=p.progress;text('export-status',
      'Rendering '+p.done+' / '+p.total+' frames · '+Math.round(p.progress*100)+'%');}});
   download(result.file,'frameforge-'+editor.project.id+'-'+result.report.width+'x'+result.report.height+'.mp4');
   download(new Blob([JSON.stringify(result.report,null,2)],{type:'application/json'}),
     'frameforge-'+editor.project.id+'-export-report.json');
   text('export-status','Verified H264/AAC '+result.report.frames+' frames · '+result.report.seconds.toFixed(2)+'s · file downloaded.');
 }catch(e){text('export-status','MP4 export unavailable: '+e.message+' Project backup is still available.')}
 finally{exportAbort=null;setBusy(false);$('cancel').disabled=true;$('progress').hidden=true}
};
window.addEventListener('keydown',e=>{
 if((e.ctrlKey||e.metaKey)&&!e.altKey&&e.key.toLowerCase()==='z'&&!busy){
   e.preventDefault();if(e.shiftKey?editor?.redo():editor?.undo()){renderUI();queueSave()}
 }
});
let booting=false;
async function bootEditor(){
 if(booting||editor)return;booting=true;
 try{
   const w=$('engine').contentWindow;let tries=0;
   while(!w.HybridP56Ready&&!w.HybridP56Error&&tries++<180)
     await new Promise(resolve=>setTimeout(resolve,250));
   if(w.HybridP56Error)throw Error(String(w.HybridP56Error));
   if(!w.HybridP56Ready)throw Error('3D renderer could not start');
   engine=w.HybridP56QA;
   store=await createProjectStore();
   let saved=null;
   try{saved=await store.load()}catch(e){text('storage-status','Recovery read failed: '+e.message)}
   let p;
   if(saved){
     try{p=M.parseCreatorFile(saved)}
     catch(e){
       recoveryRaw=saved;initialRecoveryCorrupt=true;
       $('recovery-backup').hidden=false;
       text('storage-status','Damaged saved project preserved. Download the recovery copy before editing. '+e.message);
     }
   }
   if(!p){
     const fixture=await fetch('./projects/zero-latency.frameforge.json').then(r=>{
       if(!r.ok)throw Error('Original FrameForge project fixture unavailable');return r.json()});
     p=M.fromLegacy(fixture);
   }
   editor=M.createEditor(p);selected=p.shots[0].id;renderUI();
   if(!initialRecoveryCorrupt)queueSave();
   if(!initialRecoveryCorrupt)
     text('storage-status',saved?'Recovered a locally saved project.':'Created new project with local autosave.');
 }catch(e){
   text('status','Cannot open the hybrid creator: '+e.message+
    '. Your original V6 editor remains available.');
   booting=false;
 }
}
$('engine').addEventListener('load',bootEditor);
// The iframe may finish before the editor module is evaluated, especially when
// the media muxer module is already cached. Do not miss that event.
if($('engine').contentWindow?.HybridP56Ready)bootEditor();
window.addEventListener('pagehide',()=>{
 stop();store?.close();try{engine?.dispose()}catch{}try{audioContext?.close()}catch{}
});