from pathlib import Path
p=Path('index.html')
s=p.read_text()
anchor="window.FrameForgeArtLab=Object.freeze({"
assert s.count(anchor)==1
code="""function captureEnvironment(width=360,height=640){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<160||height<220||width>1024||height>1400)throw new Error('Invalid environment output size');
 const actors=[dev,b.root,o.root];
 const previous=actors.map(actor=>actor.visible);
 const oldSize=renderer.getSize(new T.Vector2()),position=cam.position.clone(),quat=cam.quaternion.clone();
 const oldFov=cam.fov,oldAspect=cam.aspect,oldTime=time,wasRunning=running;
 try{
  running=false;soundtrack.pause();
  actors.forEach(actor=>actor.visible=false);
  renderer.setSize(width,height,false);
  cam.aspect=width/height;cam.fov=40;cam.updateProjectionMatrix();
  cam.position.set(0,3.1,8.6);cam.lookAt(0,1.45,0);
  renderer.render(scene,cam);
  return renderer.domElement.toDataURL('image/png');
 }finally{
  actors.forEach((actor,i)=>actor.visible=previous[i]);
  renderer.setSize(oldSize.x,oldSize.y,false);
  cam.position.copy(position);cam.quaternion.copy(quat);cam.fov=oldFov;cam.aspect=oldAspect;cam.updateProjectionMatrix();
  time=oldTime;running=wasRunning;
  renderer.render(scene,cam);
 }
}
"""
s=s.replace(anchor,code+anchor)
s=s.replace('capture:captureCharacterView\n});','capture:captureCharacterView,\n captureEnvironment\n});',1)
p.write_text(s)
p=Path('character-lab.html');s=p.read_text()
old='<p>Source guide: NMXWZ specifies front / three-quarter / side / back at matching scale plus four close-up expressions.'
new='''<section><h2>03 / Environment-only first frame</h2><p>Actors hidden. Set materials, lighting, props, and vertical framing are rendered from the same 3D world. Caption-safe placement must be visually approved.</p><figure style="max-width:360px"><img id="environment" alt="Environment-only 3D render"><figcaption>3D environment · unapproved</figcaption></figure></section>
<p>Source guide: NMXWZ specifies front / three-quarter / side / back at matching scale plus four close-up expressions.'''
assert old in s;s=s.replace(old,new,1)
old="save.disabled=false;status.textContent=who.toUpperCase()+' · 8 true 3D frames rendered; art approval pending';"
new="if(!$('environment').src){$('environment').src=api.captureEnvironment(360,640);}\n  save.disabled=false;status.textContent=who.toUpperCase()+' · 8 true 3D frames rendered; art approval pending';"
assert old in s;s=s.replace(old,new,1)
p.write_text(s)
print('Added real empty-environment capture and dedicated visual QA card')

