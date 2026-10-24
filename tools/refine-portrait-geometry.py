from pathlib import Path
p=Path("index.html");s=p.read_text()
def rep(a,b):
 global s
 assert s.count(a)==1,(a,s.count(a))
 s=s.replace(a,b,1)
rep("personSkin=velvet(0xad8170,.87,0)","personSkin=velvet(0x9f7869,.87,0)")
rep("eyeWhite=velvet(0xe5dbd7,.5,0)","eyeWhite=velvet(0xddd5cf,.55,0)")
old="""const socket=new T.Mesh(new T.SphereGeometry(.105,16,12),skinDark);
 socket.position.set(side*.184,.035,.466);socket.scale.set(1,.65,.27);humanHead.add(socket);
 const eye=new T.Mesh(new T.SphereGeometry(.083,24,16),eyeWhite);
 eye.position.set(side*.184,.052,.493);eye.scale.set(.99,.79,.57);humanHead.add(eye);humanEyes.push(eye);
 const iris=new T.Mesh(new T.SphereGeometry(.043,20,16),eyeDark);
 iris.position.set(side*.184,.050,.538);iris.scale.set(.92,.96,.54);humanHead.add(iris);humanIrises.push(iris);
 const catchlight=new T.Mesh(new T.SphereGeometry(.012,12,8),eyeWhite);
 catchlight.position.set(side*.184-.014,.067,.562);humanHead.add(catchlight);"""
new="""// Eye planes sit flush with the face; no protruding spheres or googly-eye anatomy.
 const socket=new T.Mesh(new T.CircleGeometry(.088,28),skinDark);
 socket.position.set(side*.184,.053,.501);socket.scale.set(1.13,1.16,1);humanHead.add(socket);
 const eye=new T.Mesh(new T.CircleGeometry(.082,28),eyeWhite);
 eye.position.set(side*.184,.053,.504);eye.scale.set(.96,.82,1);humanHead.add(eye);humanEyes.push(eye);
 const iris=new T.Mesh(new T.CircleGeometry(.037,28),eyeDark);
 iris.position.set(side*.184,.052,.509);iris.scale.set(.92,.96,1);humanHead.add(iris);humanIrises.push(iris);
 const catchlight=new T.Mesh(new T.CircleGeometry(.010,14),eyeWhite);
 catchlight.position.set(side*.184-.013,.068,.514);humanHead.add(catchlight);"""
rep(old,new)
old="""const noseNew=new T.Mesh(new T.SphereGeometry(.105,24,16),personSkin);noseNew.position.set(0,-.075,.49);noseNew.scale.set(.73,.83,.71);humanHead.add(noseNew);"""
new="""const noseNew=new T.Mesh(new T.IcosahedronGeometry(.085,0),artSkin);
noseNew.position.set(0,-.078,.501);noseNew.scale.set(.66,.96,.44);humanHead.add(noseNew);"""
rep(old,new)
old="""const mouthNew=new T.Mesh(new T.SphereGeometry(.17,24,16),mouthDark);
mouthNew.position.set(0,-.302,.481);
mouthNew.scale.set(1.12,.23,.18);humanHead.add(mouthNew);"""
new="""// A flat morphable mouth stays attached to the skin under every camera angle.
const mouthNew=new T.Mesh(new T.CircleGeometry(.115,28),mouthDark);
mouthNew.position.set(0,-.305,.514);
mouthNew.scale.set(1.0,.12,1);humanHead.add(mouthNew);"""
rep(old,new)
old="""const points=[[-.16,smile?-.26:-.34],[ -.08,smile?-.33:-.28],
               [0,smile?-.35:-.26],[.08,smile?-.33:-.28],[.16,smile?-.26:-.34]];"""
new="""const points=[[-.135,smile?-.286:-.322],[-.068,smile?-.309:-.286],
               [0,smile?-.313:-.278],[.068,smile?-.309:-.286],[.135,smile?-.286:-.322]];"""
rep(old,new)
rep("const tube=new T.Mesh(new T.TubeGeometry(curve,24,.021,8,false),mouthDark);",
    "const tube=new T.Mesh(new T.TubeGeometry(curve,24,.012,8,false),mouthDark);")
rep("const xx=(j-4.5)*.104,yy=.37+Math.sin(j*1.8)*.050;",
    "const xx=(j-4.5)*.104,yy=.465+Math.sin(j*1.8)*.030;")
rep("tuft.scale.set(.85,.69,.79);","tuft.scale.set(.80,.61,.71);")
rep("lock.position.set(x,.295+(.035*Math.sin(i*2.1)),.375);",
    "lock.position.set(x,.390+(.025*Math.sin(i*2.1)),.370);")
rep("lock.scale.set(.82,1.0,.79);","lock.scale.set(.76,.78,.74);")
rep("const mouthHeight={neutral:.23,happy:.28,worried:.19,surprised:.86}[emotion]??.23;",
    "const mouthHeight={neutral:.12,happy:.12,worried:.12,surprised:.76}[emotion]??.12;")
rep("mouthNew.scale.x=emotion==='surprised'?.67:1.12;",
    "mouthNew.scale.x=emotion==='surprised'?.62:1.0;")
rep("mouthNew.scale.y=.23*(shot.speaker==='dev'?1+open*2.3:1);",
    "mouthNew.scale.y=.12*(shot.speaker==='dev'?1+open*3.3:1);")
p.write_text(s)
print('De-protruded eyes, subtle expression shapes and hair silhouettes')

