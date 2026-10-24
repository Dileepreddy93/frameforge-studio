from pathlib import Path
p=Path('index.html')
s=p.read_text()
def once(old,new):
 global s
 if s.count(old)!=1:raise RuntimeError(f'Expected one occurrence, got {s.count(old)}: {old[:110]}')
 s=s.replace(old,new,1)
a=s.index('const templates={');b=s.index('let shots=[]',a)
boot="""// V5 projects are versioned documents, NOT hardcoded dialogue arrays.
const projectCatalog=Object.create(null);
const projectFiles={comedy:'./projects/zero-latency.frameforge.json',
                    mystery:'./projects/mountain-mystery.frameforge.json'};
const projectReady=Promise.all(Object.entries(projectFiles).map(async ([key,path])=>{
 const response=await fetch(path,{cache:'no-cache'});
 if(!response.ok)throw new Error('Missing project '+path+' (HTTP '+response.status+')');
 const document=await response.json();
 window.FrameForgeProjectCore.assertProject(document);
 projectCatalog[key]=document;
})).then(()=>{window.FrameForgeProjectsLoaded=true;});
"""
s=s[:a]+boot+s[b:]
once("function load(){const p=$('preset').value;let lines=templates[p];soundtrack.pause();",
"function load(){const p=$('preset').value;const project=projectCatalog[p];if(!project){$('recordStatus').textContent='Project not yet loaded';return;}soundtrack.pause();")
once("shots=lines.map(a=>({text:a[0],speaker:a[1],camera:a[2],duration:a[3]}));$('idea').value=p==='comedy'?'A developer asks two AI assistants to make an app load instantly. Their solution is spectacularly wrong.':'A mysterious mountain hides a forgotten futuristic city.';",
"shots=window.FrameForgeProjectCore.toTimelineShots(project);$('idea').value=project.logline;window.FrameForgeCurrentProject=project;")
once("load();requestAnimationFrame(frame);",
"projectReady.then(()=>{load();requestAnimationFrame(frame);}).catch(err=>{$('recordStatus').textContent='PROJECT ERROR: '+err.message;console.error('FrameForge project load failed',err);});")
once('<script type="module">', '<script src="./src/project-core.js"></script>\n<script type="module">')
p.write_text(s)
print('Project JSON integrated into actual Three.js studio',len(s))

