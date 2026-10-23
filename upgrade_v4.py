from pathlib import Path
p=Path('index.html')
s=p.read_text()
def replace(a,b):
 global s
 if a not in s:raise ValueError('Source missing: '+a[:110])
 s=s.replace(a,b,1)
actor="""function buildActor(actor,kind){
 actor.root.children.forEach(c=>c.visible=false);
 const group=new T.Group();actor.root.add(group);const isBlue=kind==='blue';
 const shell=new T.MeshPhysicalMaterial({color:isBlue?0x6484b8:0xd38357,metalness:.22,roughness:.35,clearcoat:.64,clearcoatRoughness:.17});
 const darkMat=new T.MeshStandardMaterial({color:isBlue?0x1a324f:0x4b2a2c,metalness:.42,roughness:.42});
 const trim=new T.MeshStandardMaterial({color:isBlue?0x9ebdc5:0xdec195,metalness:.74,roughness:.32});
 const neon=new T.MeshStandardMaterial({color:isBlue?0x87ecfc:0xffc98e,emissive:isBlue?0x428eae:0xaf652d,emissiveIntensity:1.25});
 const glass=new T.MeshPhysicalMaterial({color:0x08111d,metalness:.22,roughness:.17,clearcoat:1,clearcoatRoughness:.07});
 const attach=(geo,mat,x,y,z,sx=1,sy=1,sz=1)=>{
  const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;
 };
 // A continuous lathed torso, flowing into sculpted hips.
 const outline=[[.23,.07],[.43,.16],[.56,.31],[.58,.53],[.59,.76],[.54,.99],[.42,1.17],[.22,1.25]];
 attach(new T.LatheGeometry(outline.map(([r,y])=>new T.Vector2(r,y)),40),shell,0,0,0);
 attach(new T.SphereGeometry(.49,36,24),shell,0,.35,0,1.13,.80,.92);
 attach(new T.CylinderGeometry(.21,.30,.24,32),darkMat,0,1.24,0);
 const neckTrim=attach(new T.TorusGeometry(.27,.027,10,40),trim,0,1.26,0);neckTrim.rotation.x=Math.PI/2;
 // A single head hull with recessed curved dark face; no exposed cube corners.
 attach(new T.SphereGeometry(.71,48,36),shell,0,1.76,0,1.06,.89,.89);
 attach(new T.SphereGeometry(.59,48,36),glass,0,1.77,.42,1,.73,.39);
 attach(new T.TorusGeometry(.49,.035,10,56),trim,0,1.77,.685,1.07,.73,1);
 for(const sign of [-1,1]){
  attach(new T.SphereGeometry(.23,24,16),darkMat,sign*.74,1.75,0,.82,1,1);
  const cap=attach(new T.CylinderGeometry(.18,.18,.10,24),shell,sign*.80,1.75,0);cap.rotation.z=Math.PI/2;
  const led=attach(new T.TorusGeometry(.126,.019,8,30),neon,sign*.845,1.75,0);led.rotation.y=Math.PI/2;
  attach(new T.SphereGeometry(.27,24,16),darkMat,sign*.30,.20,.015,.9,.74,.95);
  attach(new T.SphereGeometry(.23,24,16),shell,sign*.30,.11,.145,1.18,.54,1.30);
  attach(new T.SphereGeometry(.205,20,16),darkMat,sign*.64,1.03,-.02);
 }
 const chest=attach(new T.TorusGeometry(.17,.027,8,40),neon,0,.70,.55);chest.scale.y=.83;
 const cv=document.createElement('canvas');cv.width=cv.height=512;
 const texture=new T.CanvasTexture(cv);texture.colorSpace=T.SRGBColorSpace;
 const face=new T.Mesh(new T.PlaneGeometry(.92,.68),new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false,side:T.DoubleSide}));
 face.position.set(0,1.77,.74);group.add(face);
 // A single dynamic display enables the same eye and mouth animation on BOTH robots.
 return {ctx:cv.getContext('2d'),texture,group,head:group,blue:isBlue,orangeEyes:[],orangeBrows:[],orangeMouth:null};
}
"""
a=s.index('function buildActor(');b=s.index('const faces=',a)
s=s[:a]+actor+s[b:]
# Make a rough text-driven articulation rhythm conditional on the audio envelope;
# label it heuristic, NOT an actual speech-alignment engine.
vis="""function estimateViseme(text,local,duration){
 const words=text.toLowerCase().match(/[a-z']+/g)||[];
 if(!words.length||local<.10||local>duration*.91)return 'rest';
 const weights=words.map(w=>Math.max(2,w.length*.7+1.5));
 const total=weights.reduce((a,b)=>a+b,0);
 const cursor=Math.max(0,Math.min(.999,(local-.1)/(duration*.90-.1)))*total;
 let amount=0,word=words[0],within=0;
 for(let i=0;i<words.length;i++){
  if(cursor<amount+weights[i]){word=words[i];within=(cursor-amount)/weights[i];break;}
  amount+=weights[i];
 }
 const letter=word[Math.min(word.length-1,Math.floor(within*word.length))]||'a';
 return /[bmp]/.test(letter)?'closed':/[oouw]/.test(letter)?'round':/[iey]/.test(letter)?'wide':/[fv]/.test(letter)?'teeth':'open';
}
"""
replace('const oldUpdate=update;let lastFaceDraw=0;',vis+'\\nconst oldUpdate=update;let lastFaceDraw=0;')
replace('const index=shots.indexOf(shot);const emotionMap=',"const viseme=estimateViseme(shot.text,local,shot.duration);\\n const index=shots.indexOf(shot);const emotionMap=")
replace("function drawActorFace(f,emotion,open,time){","function drawActorFace(f,emotion,open,time,viseme='rest'){")
replace('const h=15+energy*51,w=35+energy*8;',"const shape=viseme==='round'?.58:viseme==='wide'?1.45:viseme==='closed'?.12:viseme==='teeth'?.43:1;const h=15+energy*51*shape,w=(35+energy*8)*(viseme==='wide'?1.2:viseme==='round'?.72:1);")
replace("drawActorFace(faces.blue,expression.blue,shot.speaker==='blue'?open:0,t);drawActorFace(faces.orange,expression.orange,shot.speaker==='orange'?open:0,t);",
"drawActorFace(faces.blue,expression.blue,shot.speaker==='blue'?open:0,t,viseme);drawActorFace(faces.orange,expression.orange,shot.speaker==='orange'?open:0,t,viseme);")
# Distinct shot compositions; remove mechanically repeated three camera setups.
start=s.index("let pos=s.camera==='wide'?");stop=s.index("b.root.position.y=",start)
camera="""const shotCamera=[
 [4.7,-.18,.09,36],[4.25,.20,.05,35],[3.55,-.16,.11,33],
 [3.75,.16,.07,34],[4.18,-.10,.04,34],[7.15,-.30,.15,40],
 [6.90,.0,.03,42],[3.30,.24,.15,33],[6.90,0,.03,42],
 [3.48,-.17,.05,34],[3.62,.15,.08,35],[3.08,.12,.13,31],
 [4.12,-.19,.03,36],[7.22,.26,.12,40]
 ];
 const [distance,offset,up,fov]=shotCamera[si]||shotCamera[0];
 const wide=s.camera==='duo'||s.camera==='wide'||s.camera==='screen';
 const ease=Math.max(0,Math.min(1,local/s.duration));
 const dolly=(ease*ease*(3-2*ease)-.5)*.33;
 const pos=wide?[offset,2.66+up,distance]:[tgt[0]+offset,2.16+up,tgt[2]+distance];
 cam.fov=fov;cam.updateProjectionMatrix();
 cam.position.set(pos[0]+dolly*.14+Math.sin(t*.38)*sway*.14,pos[1]+Math.sin(t*.32)*sway*.08,pos[2]-dolly);
 cam.lookAt(tgt[0],tgt[1]+(si===11?.07:0),tgt[2]);
 """
s=s[:start]+camera+s[stop:]
p.write_text(s)
print('UPGRADED',len(s),'bytes')

