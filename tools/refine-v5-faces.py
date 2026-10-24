from pathlib import Path
p=Path("index.html");s=p.read_text()
def rep(a,b):
 global s
 c=s.count(a)
 if c!=1:raise RuntimeError(f'Anchor count={c} {a[:80]}')
 s=s.replace(a,b,1)
rep("const skull=new T.Mesh(new T.SphereGeometry(.55,48,32),personSkin);",
"""const artSkin=personSkin.clone();artSkin.flatShading=true;artSkin.needsUpdate=true;
const artHair=blackHair.clone();artHair.flatShading=true;artHair.needsUpdate=true;
// Purposeful, moderately faceted head silhouette instead of a perfectly round balloon.
const skull=new T.Mesh(new T.SphereGeometry(.55,20,14),artSkin);""")
rep("const eye=new T.Mesh(new T.SphereGeometry(.067,24,20),eyeWhite);eye.position.set(side*.184,.035,.449);eye.scale.set(.89,.61,.46);humanHead.add(eye);humanEyes.push(eye);",
"""const socket=new T.Mesh(new T.SphereGeometry(.105,16,12),skinDark);
 socket.position.set(side*.184,.035,.466);socket.scale.set(1,.65,.27);humanHead.add(socket);
 const eye=new T.Mesh(new T.SphereGeometry(.083,24,16),eyeWhite);
 eye.position.set(side*.184,.052,.493);eye.scale.set(.99,.79,.57);humanHead.add(eye);humanEyes.push(eye);""")
rep("const iris=new T.Mesh(new T.SphereGeometry(.034,20,16),eyeDark);iris.position.set(side*.184,.032,.477);iris.scale.set(.85,.83,.51);humanHead.add(iris);humanIrises.push(iris);",
"""const iris=new T.Mesh(new T.SphereGeometry(.043,20,16),eyeDark);
 iris.position.set(side*.184,.050,.538);iris.scale.set(.92,.96,.54);humanHead.add(iris);humanIrises.push(iris);
 const catchlight=new T.Mesh(new T.SphereGeometry(.012,12,8),eyeWhite);
 catchlight.position.set(side*.184-.014,.067,.562);humanHead.add(catchlight);""")
rep("for(const side of [-1,1]){const br=bevel(.20,.042,.040,.015,blackHair,humanHead,side*.19,.19,.471);br.rotation.z=side*.11;browsNew.push(br)}",
"""for(const side of [-1,1]){const br=bevel(.22,.051,.046,.015,artHair,humanHead,side*.19,.235,.485);br.rotation.z=side*.11;browsNew.push(br)}""")
rep("const hairCrown=new T.Mesh(new T.SphereGeometry(.51,36,24),blackHair);",
    "const hairCrown=new T.Mesh(new T.IcosahedronGeometry(.51,1),artHair);")
rep("const tuft=new T.Mesh(new T.SphereGeometry(.16+(j%3)*.012,16,12),blackHair);",
    "const tuft=new T.Mesh(new T.IcosahedronGeometry(.16+(j%3)*.012,0),artHair);")
rep("const sideHair=new T.Mesh(new T.SphereGeometry(.24,20,16),blackHair);",
    "const sideHair=new T.Mesh(new T.IcosahedronGeometry(.24,0),artHair);")
anchor="// Secondary face/shirt highlights keep the sculpt readable under low-key studio lighting."
add="""// Angular swept fringe and temple locks from the same authored 3D hairstyle at any view.
for(let i=0;i<7;i++){
 const x=(i-3)*.118;
 const lock=new T.Mesh(new T.IcosahedronGeometry(.195+(i%2)*.019,0),artHair);
 lock.position.set(x,.295+(.035*Math.sin(i*2.1)),.375);
 lock.scale.set(.82,1.0,.79);lock.rotation.z=(i-3)*.115;
 lock.rotation.x=-.22;lock.castShadow=true;humanHead.add(lock);
}
for(const side of [-1,1]){
 const sideLock=new T.Mesh(new T.IcosahedronGeometry(.235,0),artHair);
 sideLock.position.set(side*.438,.145,.09);
 sideLock.scale.set(.57,1.1,.79);sideLock.rotation.z=side*.24;
 humanHead.add(sideLock);
}
"""
rep(anchor,add+anchor)
rep("const baseBrow=[.19,.19];","const baseBrow=[.235,.235];")
rep("function captureCharacterView(actorId,angle='front',emotion='neutral',width=360,height=460){",
    "function captureCharacterView(actorId,angle='front',emotion='neutral',width=360,height=460,portrait=false){")
rep("const selected=actors[actorId];\n const show=scene.children.map(child=>[child,child.visible]);",
    "const selected=actors[actorId];\n if(typeof portrait!=='boolean')throw new Error('portrait must be boolean');\n const show=scene.children.map(child=>[child,child.visible]);")
rep("const baseRotation=selected.rotation.y;\n const faceData={",
    "const baseRotation=selected.rotation.y;\n const wasRunning=running;\n const faceData={")
rep("cam.aspect=width/height;cam.fov=34;cam.near=.1;cam.far=50;cam.updateProjectionMatrix();\n  const centerY=actorId==='dev'?1.84:1.54;\n  cam.position.set(selected.position.x,centerY+.15,selected.position.z+6.6);\n  cam.lookAt(selected.position.x,centerY,selected.position.z);",
"""cam.aspect=width/height;cam.fov=portrait?31:34;cam.near=.1;cam.far=50;cam.updateProjectionMatrix();
  const centerY=actorId==='dev'?1.84:1.54;
  const faceY=actorId==='dev'?selected.position.y+2.30:selected.position.y+1.45;
  const targetY=portrait?faceY:centerY;
  cam.position.set(selected.position.x,targetY+(portrait?.04:.15),selected.position.z+(portrait?2.8:6.6));
  cam.lookAt(selected.position.x,targetY,selected.position.z);""")
rep("if(typeof update==='function'&&shots.length)update();\n  renderer.render(scene,cam);",
    "if(typeof update==='function'&&shots.length)update();\n  running=wasRunning;\n  renderer.render(scene,cam);")
p.write_text(s)
p=Path('character-lab.html');lab=p.read_text()
a="const png=api.capture(who,'front',expression,360,460);"
assert lab.count(a)==1
lab=lab.replace(a,"const png=api.capture(who,'front',expression,360,460,true);",1)
lab=lab.replace("<h2>02 / Emotional faces</h2>","<h2>02 / Facial performance portraits</h2>")
p.write_text(lab)
print("V5 close-up portrait photography and faceted human material updates applied")

