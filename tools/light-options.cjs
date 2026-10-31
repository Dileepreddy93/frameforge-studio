// M5.3 light options: renders film frames (with captions, as the films are) under light variants, for judging
// before anything in studio.html changes. Each variant can add character-only lights (camera-relative, no shadows:
// patched into the cast's materials, so the set is untouched) and a black lift (a screen-blend quad on the camera).
// usage: node tools/light-options.cjs <variants.json> <outdir> <project-id> <t1> <t2> ...
//   env MASK=1   also writes each frame without the cast (<name>_nocast.png) for cast-only luma
//   env ONLY=A,B render only these variants;  env THREE_DIR=<three/build> when cdn.jsdelivr.net is unreachable
// studio.html is served with one extra QA accessor; the repo's files are not changed.
const fs=require('fs'),path=require('path'),http=require('http');
const {chromium}=require('playwright');
const REPO=path.resolve(__dirname,'..'),THREE=process.env.THREE_DIR;
const [varFile,outDir,projectId,...times]=process.argv.slice(2);
const variants=JSON.parse(fs.readFileSync(varFile,'utf8'));
const only=process.env.ONLY?process.env.ONLY.split(','):null;
fs.mkdirSync(outDir,{recursive:true});
const TYPES={'.html':'text/html','.js':'text/javascript','.json':'application/json','.mp3':'audio/mpeg','.ogg':'audio/ogg','.png':'image/png','.css':'text/css'};
const server=http.createServer((req,res)=>{
 const p=decodeURIComponent(new URL(req.url,'http://x').pathname).replace(/\/$/,'/index.html');
 const file=path.join(REPO,p);
 if(!file.startsWith(REPO)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end()}
 let body=fs.readFileSync(file);
 if(p==='/studio.html'){body=body.toString().replace('window.FrameForgeQA={','window.FrameForgeQA={\n __light:()=>({T,dev,b,o,key,rim,cam}),');}
 res.writeHead(200,{'content-type':TYPES[path.extname(file)]||'application/octet-stream'});res.end(body);
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const browser=await chromium.launch({args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const project=JSON.parse(fs.readFileSync(path.join(REPO,'projects',projectId+'.frameforge.json'),'utf8'));
 for(const [name,v] of Object.entries(variants)){
  if(only&&!only.includes(name))continue;
  const page=await browser.newPage({viewport:{width:1100,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  if(THREE)await page.route('https://cdn.jsdelivr.net/**',route=>{
   const u=new URL(route.request().url());const m=u.pathname.match(/three@0\.180\.0\/build\/(.+)$/);
   if(m)return route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(THREE,m[1]))});
   return route.abort();
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/studio.html`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.FrameForgeProjectsLoaded&&window.FrameForgeQA?.openProject,null,{timeout:120000});
  await page.evaluate(p=>FrameForgeQA.openProject(p),project);
  await page.waitForFunction(()=>FrameForgeQA.envelopeReady(),null,{timeout:120000});
  const info=await page.evaluate(applyLight,v);
  for(const t of times){
   const data=await page.evaluate(([t])=>window.__png(Number(t)),[t]);
   fs.writeFileSync(path.join(outDir,`${projectId}_${name}_${Number(t).toFixed(2)}.png`),Buffer.from(data,'base64'));
   if(process.env.MASK){const m=await page.evaluate(([t])=>window.__png(Number(t),true),[t]);
    fs.writeFileSync(path.join(outDir,`${projectId}_${name}_${Number(t).toFixed(2)}_nocast.png`),Buffer.from(m,'base64'));}
  }
  console.log(name,JSON.stringify(info),errors.length?'ERRORS '+errors.join(' | '):'');
  await page.close();
 }
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});

// Runs in the page.
function applyLight(v){
 const {T,dev,b,o,key,rim,cam}=FrameForgeQA.__light();
 const scene=FrameForgeQA.scene;
 // lossless frame grab: renderFilmFrame(…,encode=false) is not exposed, so re-compose through renderFrameJPEG's canvas
 const orig=HTMLCanvasElement.prototype.toDataURL;
 window.__png=(t,nocast)=>{let out=null;const roots=[dev,b.root,o.root];const saved=[];if(nocast){key.shadow.camera.layers.enable(1);roots.forEach(r=>r.traverse(x=>{saved.push([x,x.layers.mask]);x.layers.set(1)}))}HTMLCanvasElement.prototype.toDataURL=function(){out=orig.call(this,'image/png');return out};
  try{FrameForgeQA.renderFrameJPEG(t,1080,1920,1)}finally{HTMLCanvasElement.prototype.toDataURL=orig;saved.forEach(([x,m])=>x.layers.mask=m)}return out.slice(22)};
 const hemi=scene.children.find(c=>c.isHemisphereLight);
 if(v.key){if(v.key.intensity!=null)key.intensity=v.key.intensity;}
 if(v.hemi!=null)hemi.intensity=v.hemi;
 // The studio's update() resets key.intensity from the lighting slider every frame; pin it through the slider's scale.
 if(v.key?.intensity!=null){document.getElementById('lighting').value=String(1.3*v.key.intensity/4.4);}
 const lights=(v.charLights||[]).map(L=>{const az=L.az*Math.PI/180,el=L.el*Math.PI/180;
  return {dir:new T.Vector3(Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el)).normalize(),col:new T.Color(L.color).multiplyScalar(L.intensity)}});
 let patched=0;const kinds={};
 if(lights.length){
  const decl=lights.map((_,i)=>`uniform vec3 uCKDir${i};uniform vec3 uCKCol${i};`).join('\n');
  const add=lights.map((_,i)=>`reflectedLight.directDiffuse+=uCKCol${i}*saturate(dot(normal,uCKDir${i}))*BRDF_Lambert(diffuseColor.rgb);`).join('\n');
  const seen=new Set();
  for(const root of [dev,b.root,o.root])root.traverse(m=>{
   if(!m.isMesh)return;for(const mat of [].concat(m.material)){
    kinds[mat.type]=(kinds[mat.type]||0)+1;
    if(seen.has(mat)||!(mat.isMeshLambertMaterial||mat.isMeshStandardMaterial||mat.isMeshPhongMaterial))continue;seen.add(mat);
    mat.onBeforeCompile=sh=>{lights.forEach((L,i)=>{sh.uniforms['uCKDir'+i]={value:L.dir};sh.uniforms['uCKCol'+i]={value:L.col}});
     sh.fragmentShader=decl+'\n'+sh.fragmentShader.replace('#include <lights_fragment_end>','#include <lights_fragment_end>\n'+add);};
    mat.customProgramCacheKey=()=>'m53-'+lights.length;mat.needsUpdate=true;patched++;
   }});
 }
 if(v.lift){
  if(!cam.parent)scene.add(cam);
  const q=new T.Mesh(new T.PlaneGeometry(10,10),new T.MeshBasicMaterial({color:v.lift,toneMapped:false,transparent:true,depthTest:false,depthWrite:false,
   blending:T.CustomBlending,blendEquation:T.AddEquation,blendSrc:T.OneMinusDstColorFactor,blendDst:T.OneFactor}));
  q.position.z=-.15;q.renderOrder=1e6;q.frustumCulled=false;cam.add(q);
 }
 return {patched,kinds,key:key.intensity,hemi:hemi.intensity};
}
