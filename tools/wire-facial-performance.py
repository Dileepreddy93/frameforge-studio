from pathlib import Path
p=Path('index.html');s=p.read_text()
def once(a,b):
 global s
 if s.count(a)!=1:raise RuntimeError('source anchor unexpected '+repr(a[:95])+' occurrences '+str(s.count(a)))
 s=s.replace(a,b,1)
once('<script src="./src/project-core.js"></script>','<script src="./src/project-core.js"></script>\n<script src="./src/performance-core.js"></script>')
anchor='const humanSmile=createExpressionMouth(true),humanFrown=createExpressionMouth(false);'
rig="""
// A composited facial rig: eyelid meshes, cheeks and lip corners share one pose driver.
const humanUpperLids=[],humanLowerLids=[],humanCheeks=[],humanLipCorners=[];
const cheekMat=new T.MeshStandardMaterial({color:0xa97066,roughness:.92,metalness:0,transparent:true,opacity:.28,depthWrite:false,side:T.DoubleSide});
for(const side of [-1,1]){
 const lid=new T.Mesh(new T.PlaneGeometry(.174,.074),artSkin);
 lid.position.set(side*.184,.101,.519);humanHead.add(lid);humanUpperLids.push(lid);
 const lower=new T.Mesh(new T.PlaneGeometry(.172,.041),artSkin);
 lower.position.set(side*.184,-.014,.518);humanHead.add(lower);humanLowerLids.push(lower);
 const cheek=new T.Mesh(new T.CircleGeometry(.064,20),cheekMat);
 cheek.position.set(side*.305,-.169,.450);cheek.scale.set(1,.34,1);humanHead.add(cheek);humanCheeks.push(cheek);
 const corner=new T.Mesh(new T.SphereGeometry(.014,12,9),mouthDark);
 corner.position.set(side*.112,-.304,.517);corner.scale.set(.88,.66,.35);
 humanHead.add(corner);humanLipCorners.push(corner);
}
function applyHumanFacePose(pose){
 const lid=pose.lid,raise=pose.brow,tilt=pose.slope;
 browsNew.forEach((b,i)=>{
  const side=i===0?-1:1;
  b.position.y=.235+raise*.13;
  b.rotation.z=side*(.04+tilt*.36);
 });
 humanEyes.forEach((eye,i)=>{
  eye.scale.y=Math.max(.04,lid*.81);
  const iris=humanIrises[i];
  iris.scale.y=Math.max(.04,lid*.95);
  iris.position.x=(i===0?-.184:.184)+pose.gazeX*.023;
  iris.position.y=.052+pose.gazeY*.020;
  const upper=humanUpperLids[i],lower=humanLowerLids[i];
  upper.position.y=.111-(1-lid)*.060;upper.scale.y=1+(1-lid)*.53;
  lower.position.y=-.008+(1-lid)*.026;lower.scale.y=.87+(1-lid)*.24;
  const cheek=humanCheeks[i];
  cheek.material.opacity=.17+pose.cheek*.17;
  cheek.position.y=-.169+pose.cheek*.018;
  cheek.scale.y=.35+pose.cheek*.12;
  const corner=humanLipCorners[i];
  corner.position.x=(i===0?-1:1)*(.112+pose.smile*.008-pose.round*.019);
  corner.position.y=-.304+pose.smile*.024;
 });
 const smile=pose.smile>.30&&pose.mouthOpen<.34;
 const frown=pose.smile<-.25&&pose.mouthOpen<.35;
 humanSmile.visible=smile;humanFrown.visible=frown;
 mouthNew.visible=!smile&&!frown;
 mouthNew.scale.x=pose.mouthWidth;
 mouthNew.scale.y=Math.max(.09,pose.mouthOpen*1.04+pose.round*.18);
 mouthNew.position.y=-.305-pose.jaw*.013;
 chin.position.y=-.32-pose.mouthOpen*.022;
 beard.position.y=-.395-pose.mouthOpen*.019;
 humanHead.rotation.x+=pose.headPitch;
 humanHead.rotation.z+=pose.headRoll;
}
"""
once(anchor,anchor+'\n'+rig)
once(" oldUpdate();\n};\n// V5 projects", """ oldUpdate();
 // Apply coordinated facial acting AFTER the legacy mouth, brow and head updates.
 const prior=shots[index-1];
 const fromEmotion=prior?.speaker==='dev'?(prior.emotion||'neutral'):'neutral';
 const toEmotion=shot.emotion||({dev:'worried',blue:'neutral',orange:'neutral'}[shot.speaker]||'neutral');
 const facialPose=window.FrameForgePerformanceCore.evaluate({
  time:t,local,duration:shot.duration,emotion:toEmotion,fromEmotion,
  speaking:shot.speaker==='dev',energy:shot.speaker==='dev'?open:0,
  gazeX:shot.speaker==='orange'?.38:shot.speaker==='blue'?-.34:devPose.head*.6
 });
 applyHumanFacePose(facialPose);
};
// V5 projects""")
# Make art sheets use the exact same performance poses as runtime, not a second invented codepath.
old="""  const baseBrow=[.235,.235];"""
once(old,"""  const pose=window.FrameForgePerformanceCore.evaluate({
    time:1.25,local:1,duration:2,emotion,
    speaking:emotion==='surprised',energy:emotion==='surprised'?.42:0,
    gazeX:0,gazeY:0
  });
  humanHead.rotation.set(0,0,0);
  applyHumanFacePose(pose);
  return;
  const baseBrow=[.235,.235];""")
once('window.FrameForgeArtLab=Object.freeze({',
"""window.FrameForgePerformanceQA=Object.freeze({
 poseAt:(input)=>window.FrameForgePerformanceCore.evaluate(input),
 facialChannels:()=>['lid','brow','slope','cheek','smile','round','jaw','gazeX','gazeY','mouthOpen','mouthWidth'],
 humanRig:()=>({upperLids:humanUpperLids.length,lowerLids:humanLowerLids.length,cheeks:humanCheeks.length,lipCorners:humanLipCorners.length}),
 peek:()=>({mouthScale:mouthNew.scale.y,chinY:chin.position.y,browHeights:browsNew.map(b=>b.position.y),eyeOpen:humanEyes.map(x=>x.scale.y)})
});
window.FrameForgeArtLab=Object.freeze({""")
p.write_text(s)
print('Facial rig wired to deterministic pure pose evaluations.')

