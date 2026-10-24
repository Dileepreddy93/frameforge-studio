from pathlib import Path
p=Path('index.html');s=p.read_text()
def rep(a,b):
 global s
 if a not in s:raise RuntimeError('Missing: '+a[:85])
 s=s.replace(a,b,1)
rep("bevel(1.08,1.16,.66,.18,hoodie,bodyGroup,0,1.16,0);",
"""const jacketProfile=[[.30,.59],[.47,.68],[.54,.88],[.56,1.22],[.52,1.52],[.40,1.70],[.28,1.74]];
const jacket=new T.Mesh(new T.LatheGeometry(jacketProfile.map(([r,y])=>new T.Vector2(r,y)),40),hoodie);
jacket.castShadow=true;jacket.receiveShadow=true;bodyGroup.add(jacket);""")
rep("bevel(.34,.60,.46,.085,trouser,bodyGroup,side*.27,.30,0);",
"const leg=new T.Mesh(new T.CapsuleGeometry(.205,.28,6,16),trouser);leg.position.set(side*.27,.30,0);leg.castShadow=true;bodyGroup.add(leg);")
rep("bevel(.33,.77,.45,.12,hoodie,shoulder,side*.055,-.38,0);",
"const sleeve=new T.Mesh(new T.CapsuleGeometry(.235,.44,8,20),hoodie);sleeve.position.set(side*.055,-.40,0);sleeve.castShadow=true;shoulder.add(sleeve);")
rep("const skull=poly(humanHead,.55,personSkin,0,0,0,1);skull.scale.set(.84,1.05,.82);",
"const skull=new T.Mesh(new T.SphereGeometry(.55,48,32),personSkin);skull.position.set(0,0,0);skull.scale.set(.88,1.06,.86);skull.castShadow=true;humanHead.add(skull);")
rep("const chin=poly(humanHead,.36,personSkin,0,-.30,.10,0);chin.scale.set(.90,.61,1.12);",
"const chin=new T.Mesh(new T.SphereGeometry(.35,32,24),personSkin);chin.position.set(0,-.32,.09);chin.scale.set(.91,.52,.96);humanHead.add(chin);")
rep("const beard=poly(humanHead,.30,skinDark,0,-.37,.16,0);beard.scale.set(.97,.36,1.16);",
"const beard=new T.Mesh(new T.SphereGeometry(.29,32,24),skinDark);beard.position.set(0,-.395,.13);beard.scale.set(.93,.26,.97);humanHead.add(beard);")
rep("const ear=poly(humanHead,.13,personSkin,side*.465,-.085,-.045,0);ear.scale.set(.70,.98,.70);",
"const ear=new T.Mesh(new T.SphereGeometry(.125,24,18),personSkin);ear.position.set(side*.47,-.08,-.04);ear.scale.set(.64,.96,.76);humanHead.add(ear);")
rep("const eye=poly(humanHead,.068,eyeWhite,side*.183,.038,.428,1);eye.scale.set(.93,.62,.38);humanEyes.push(eye);",
"const eye=new T.Mesh(new T.SphereGeometry(.067,24,20),eyeWhite);eye.position.set(side*.184,.035,.449);eye.scale.set(.89,.61,.46);humanHead.add(eye);humanEyes.push(eye);")
rep("const iris=poly(humanHead,.034,eyeDark,side*.183,.034,.458,1);iris.scale.set(.82,.81,.47);humanIrises.push(iris);",
"const iris=new T.Mesh(new T.SphereGeometry(.034,20,16),eyeDark);iris.position.set(side*.184,.032,.477);iris.scale.set(.85,.83,.51);humanHead.add(iris);humanIrises.push(iris);")
rep("const hairCrown=poly(humanHead,.51,blackHair,0,.41,-.08,1);hairCrown.scale.set(.88,.44,.86);",
"const hairCrown=new T.Mesh(new T.SphereGeometry(.51,36,24),blackHair);hairCrown.position.set(0,.40,-.07);hairCrown.scale.set(.92,.39,.91);humanHead.add(hairCrown);")
rep("const tuft=poly(humanHead,.16+(j%3)*.014,blackHair,xx,yy,.24+(j%2)*.065,0);",
"const tuft=new T.Mesh(new T.SphereGeometry(.16+(j%3)*.012,16,12),blackHair);tuft.position.set(xx,yy,.24+(j%2)*.063);humanHead.add(tuft);")
rep("const sideHair=poly(humanHead,.24,blackHair,side*.37,.19,-.07,0);",
"const sideHair=new T.Mesh(new T.SphereGeometry(.24,20,16),blackHair);sideHair.position.set(side*.37,.19,-.07);humanHead.add(sideHair);")
rep("const noseNew=poly(humanHead,.10,personSkin,0,-.07,.49,0);noseNew.scale.set(.8,.95,.75);",
"const noseNew=new T.Mesh(new T.SphereGeometry(.105,24,16),personSkin);noseNew.position.set(0,-.075,.49);noseNew.scale.set(.73,.83,.71);humanHead.add(noseNew);")
rep("iris.position.x=(i?1:-1)*.183+(devPose.head>0?.012:-.010)","iris.position.x=(i?1:-1)*.184+(devPose.head>0?.012:-.010)")
p.write_text(s);print('Human geometry polish written',len(s))

