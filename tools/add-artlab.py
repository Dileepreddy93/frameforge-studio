from pathlib import Path
p=Path('index.html');s=p.read_text()
anchor='window.FrameForgeQA={'
assert s.count(anchor)==1
block="""// V5 Phase 1C — render existing studio rig geometry for actual art QA.
const ART_VIEWS=[
 {id:'front',radians:0,label:'Front'},
 {id:'three-quarter',radians:-Math.PI/4,label:'Three-quarter'},
 {id:'side',radians:-Math.PI/2,label:'Side'},
 {id:'back',radians:Math.PI,label:'Back'}
];
const ART_EXPRESSIONS=['neutral','happy','worried','surprised'];
function artPose(actorId,emotion){
 if(actorId==='dev'){
  const baseBrow=[.19,.19];
  browsNew.forEach((br,i)=>{
   const side=i===0?-1:1;
   br.position.y=baseBrow[i]+(emotion==='worried'?.075:emotion==='angry'?-.050:emotion==='surprised'?.088:emotion==='happy'?.028:0);
   br.rotation.z=side*(emotion==='worried'?-.22:emotion==='angry'?.27:emotion==='happy'?.12:.06);
  });
  const mouthHeight={neutral:.23,happy:.28,worried:.19,surprised:.86}[emotion]??.23;
  mouthNew.scale.y=mouthHeight;
  mouthNew.scale.x=emotion==='happy'?1.38:emotion==='surprised'?.67:1.12;
  humanEyes.forEach(eye=>eye.scale.y=emotion==='happy'?.45:emotion==='worried'?.80:emotion==='surprised'?.93:.61);
  humanHead.rotation.x=emotion==='worried'?-.09:emotion==='happy'?.07:0;
  humanHead.rotation.y=emotion==='surprised'?.06:0;
 }else{
  const face=actorId==='blue'?faces.blue:faces.orange;
  drawActorFace(face,emotion,emotion==='surprised'?.4:emotion==='worried'?.16:0,.5,emotion==='surprised'?'round':'rest',0);
 }
}
function captureCharacterView(actorId,angle='front',emotion='neutral',width=360,height=460){
 const actors={dev,blue:b.root,orange:o.root};
 if(!Object.hasOwn(actors,actorId))throw new Error('Unknown character '+actorId);
 const view=ART_VIEWS.find(x=>x.id===angle);
 if(!view)throw new Error('Unknown view '+angle);
 if(!ART_EXPRESSIONS.includes(emotion))throw new Error('Unknown expression '+emotion);
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<160||height<200||width>1024||height>1024)throw new Error('Invalid sheet resolution');
 const selected=actors[actorId];
 const show=scene.children.map(child=>[child,child.visible]);
 const camera={position:cam.position.clone(),quaternion:cam.quaternion.clone(),fov:cam.fov,aspect:cam.aspect,near:cam.near,far:cam.far};
 const size=renderer.getSize(new T.Vector2());
 const bg=scene.background,fog=scene.fog;
 const baseRotation=selected.rotation.y;
 const faceData={
  mouthScale:mouthNew.scale.clone(),headRotation:humanHead.rotation.clone(),
  eyebrows:browsNew.map(x=>({position:x.position.clone(),rotation:x.rotation.clone()})),
  eyes:humanEyes.map(x=>x.scale.clone())
 };
 try{
  running=false;soundtrack.pause();
  scene.children.forEach(child=>{
   if(child.isLight)return;
   child.visible=(child===selected);
  });
  selected.visible=true;
  selected.rotation.y=view.radians;
  artPose(actorId,emotion);
  scene.background=new T.Color(0x111d30);
  scene.fog=null;
  renderer.setSize(width,height,false);
  cam.aspect=width/height;cam.fov=34;cam.near=.1;cam.far=50;cam.updateProjectionMatrix();
  const centerY=actorId==='dev'?1.84:1.54;
  cam.position.set(selected.position.x,centerY+.15,selected.position.z+6.6);
  cam.lookAt(selected.position.x,centerY,selected.position.z);
  renderer.render(scene,cam);
  return renderer.domElement.toDataURL('image/png');
 }finally{
  selected.rotation.y=baseRotation;
  for(const [child,visible]of show)child.visible=visible;
  mouthNew.scale.copy(faceData.mouthScale);
  humanHead.rotation.copy(faceData.headRotation);
  browsNew.forEach((x,i)=>{x.position.copy(faceData.eyebrows[i].position);x.rotation.copy(faceData.eyebrows[i].rotation)});
  humanEyes.forEach((x,i)=>x.scale.copy(faceData.eyes[i]));
  scene.background=bg;scene.fog=fog;
  renderer.setSize(size.x,size.y,false);
  cam.position.copy(camera.position);cam.quaternion.copy(camera.quaternion);
  cam.fov=camera.fov;cam.aspect=camera.aspect;cam.near=camera.near;cam.far=camera.far;cam.updateProjectionMatrix();
  if(typeof update==='function'&&shots.length)update();
  renderer.render(scene,cam);
 }
}
window.FrameForgeArtLab=Object.freeze({
 version:'v5-phase1c-actual-rigs',
 actors:()=>['dev','blue','orange'],
 views:()=>ART_VIEWS.map(x=>x.id),
 expressions:()=>[...ART_EXPRESSIONS],
 capture:captureCharacterView
});
"""
s=s.replace(anchor,block+'\n'+anchor,1)
p.write_text(s)
print('Integrated real rig capture into studio, chars',len(block))

