from pathlib import Path
p=Path('src/project-core.js');s=p.read_text()
anchor=' function summary(p){const v=validateProject(p);return{id:p?.id||null,valid:v.valid,shotCount:v.shotCount,duration:v.duration,errors:v.errors};}'
assert s.count(anchor)==1
s=s.replace(anchor,""" function assertRendererCompatible(p){
  assertProject(p);
  const rigs=new Set(['dev','blue','orange']);
  const unsupported=p.characters.filter(c=>!rigs.has(c.id)).map(c=>c.id);
  if(unsupported.length)throw new Error('This renderer cannot animate custom rigs yet: '+unsupported.join(', '));
  return p;
 }
""" +anchor)
s=s.replace('toTimelineShots,summary});','toTimelineShots,assertRendererCompatible,summary});')
p.write_text(s)
p=Path('index.html');s=p.read_text()
def replace(a,b):
 global s
 assert s.count(a)==1,(a[:120],s.count(a))
 s=s.replace(a,b,1)
replace('<button id="build" class="primary full">✦ Build episode timeline</button>',
"""<button id="build" class="primary full">✦ Build episode timeline</button>
<label for="projectImport">Import a FrameForge JSON episode</label>
<input id="projectImport" type="file" accept=".json,application/json" aria-describedby="projectImportStatus">
<div class="fine" id="projectImportStatus" role="status">Choose a validated episode file. Custom 3D rigs are not yet supported.</div>""")
replace("const project=projectCatalog[p];if(!project){$('recordStatus').textContent='Project not yet loaded';return;}soundtrack.pause();if(p==='comedy'){soundtrack.src='https://agz0k9i7nymp3png.public.blob.vercel-storage.com/frameforge/zero-latency-stereo-foley-v2.ogg';soundtrack.load();$('recordStatus').textContent='14 scenes with real Kokoro dialogue ready';}else{soundtrack.removeAttribute('src');soundtrack.load();$('recordStatus').textContent='Mystery is storyboard-only: no voice master exists';}",
"""const project=projectCatalog[p];if(!project){$('recordStatus').textContent='Project not yet loaded';return;}
 window.FrameForgeProjectCore.assertRendererCompatible(project);
 soundtrack.pause();
 if(project.audio.state==='mastered'){soundtrack.src=project.audio.masterUrl;soundtrack.load();$('recordStatus').textContent=project.shots.length+' scenes with mastered audio ready';}
 else{soundtrack.removeAttribute('src');soundtrack.load();$('recordStatus').textContent='Storyboard only: no voice master attached';}""")
old="""$('download').onclick=()=>{const blob=new Blob([JSON.stringify({title:'FrameForge Episode',shots},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='frameforge-episode.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};"""
new="""function snapshotProject(){
 const base=window.FrameForgeCurrentProject;
 if(!base)throw new Error('No episode loaded');
 const project=structuredClone(base);
 project.shots=shots.map((shot,i)=>({...project.shots[i],dialogue:shot.text,speaker:shot.speaker,camera:shot.camera,duration:shot.duration}));
 window.FrameForgeProjectCore.assertProject(project);
 return project;
}
$('download').onclick=()=>{
 try{
  const project=snapshotProject();
  const blob=new Blob([JSON.stringify(project,null,2)+'\\\\n'],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download=project.id+'.frameforge.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1500);
  $('projectImportStatus').textContent='Exported '+project.title+' as a validated, reusable episode.';
 }catch(err){$('projectImportStatus').textContent='Export refused: '+err.message;}
};
$('projectImport').onchange=async event=>{
 const file=event.target.files?.[0];if(!file)return;
 try{
  if(file.size>1048576)throw new Error('Maximum project file size is 1 MiB');
  const project=JSON.parse(await file.text());
  window.FrameForgeProjectCore.assertRendererCompatible(project);
  projectCatalog.custom=project;
  const select=$('preset');
  let option=select.querySelector('option[value="custom"]');
  if(!option){option=document.createElement('option');option.value='custom';select.add(option);}
  option.textContent=project.title+' — Imported project';
  select.value='custom';
  load();
  $('projectImportStatus').textContent='Loaded '+project.title+' ('+project.shots.length+' scenes). Save edits with Download episode JSON.';
 }catch(err){$('projectImportStatus').textContent='Import rejected: '+err.message;}
 finally{event.target.value='';}
};"""
replace(old,new)
p.write_text(s)
print('Added import/export UI, safe project snapshots, 3D rig compatibility checks')
