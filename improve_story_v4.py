from pathlib import Path
p=Path('index.html')
s=p.read_text()
def once(a,b):
 global s
 count=s.count(a)
 if count!=1: raise RuntimeError(f'Expected one source anchor, found {count}: {a[:100]}')
 s=s.replace(a,b,1)
# Stronger face-first camera blocking; existing targets were torso height.
once("s.camera==='dev'?[-1.7,2.06,-1]:s.camera==='blue'?[0,1.5,.5]:s.camera==='orange'?[1.72,1.65,.5]:[0,1.65,0]",
     "s.camera==='dev'?[-1.7,2.54,-1]:s.camera==='blue'?[0,2.13,.57]:s.camera==='orange'?[1.72,2.13,.57]:[0,2.00,0]")
# Five in-line reaction cuts, planned by speaker/listener role. These deliberately
# change the viewpoint at semantic turn-end pauses rather than gently drifting.
actor="""const reactionCutMap={
 2:{role:'blue',seconds:.58},
 3:{role:'dev',seconds:.50},
 7:{role:'orange',seconds:.67},
 9:{role:'blue',seconds:.64},
 11:{role:'orange',seconds:.72},
 13:{role:'blue',seconds:.92}
};
const performerCoordinates={
 blue:[0,2.14,.54],
 orange:[1.72,2.14,.54],
 dev:[-1.70,2.55,-1.0]
};
function cinematicReaction(shotIndex,local,duration){
 const cut=reactionCutMap[shotIndex];
 if(!cut)return null;
 if(local<duration-cut.seconds)return null;
 const subject=performerCoordinates[cut.role],scale=cut.role==='dev'?3.50:3.05;
 return {role:cut.role,subject,camera:[subject[0]+(cut.role==='orange'?.15:-.14),subject[1]+.08,subject[2]+scale]};
}
"""
once('function update(){',actor+'\nfunction update(){')
once("cam.lookAt(tgt[0],tgt[1]+(si===11?.07:0),tgt[2]);",
"""cam.lookAt(tgt[0],tgt[1]+(si===11?.07:0),tgt[2]);
 // Listener reaction inserts are intentional editorial cuts, not camera jitter.
 const listenerCut=cinematicReaction(si,local,s.duration);
 if(listenerCut){
  cam.position.set(...listenerCut.camera);
  cam.lookAt(...listenerCut.subject);
  cam.fov=listenerCut.role==='dev'?34:31;
  cam.updateProjectionMatrix();
 }""")
# Upgrade robotic gaze direction on a deterministic dialogue schedule.
once("function drawActorFace(f,emotion,open,time,viseme='rest'){",
     "function drawActorFace(f,emotion,open,time,viseme='rest',gaze=0){")
once("const energy=Math.max(0,Math.min(1,open)),look=Math.sin(time*.61)*7+Math.sin(time*1.9)*3;",
     "const energy=Math.max(0,Math.min(1,open)),look=Math.sin(time*.61)*2.2+Math.sin(time*1.9)*1.5+gaze*12;")
old="""if(offlineMode||Math.abs(t-lastFaceDraw)>.04){drawActorFace(faces.blue,expression.blue,shot.speaker==='blue'?open:0,t,viseme);drawActorFace(faces.orange,expression.orange,shot.speaker==='orange'?open:0,t,viseme);lastFaceDraw=t;}"""
new="""const reaction=cinematicReaction(index,local,shot.duration);
 if(reaction){
  // Listeners visibly notice something before the next speaker begins.
  if(reaction.role==='blue')expression.blue='surprised';
  if(reaction.role==='orange')expression.orange='worried';
 }
 const blueGaze=shot.speaker==='dev'?-0.55:shot.speaker==='orange'?0.45:0;
 const orangeGaze=shot.speaker==='dev'?-0.75:shot.speaker==='blue'?-0.48:0;
 if(offlineMode||Math.abs(t-lastFaceDraw)>.04){
  drawActorFace(faces.blue,expression.blue,shot.speaker==='blue'?open:0,t,viseme,blueGaze);
  drawActorFace(faces.orange,expression.orange,shot.speaker==='orange'?open:0,t,viseme,orangeGaze);
  lastFaceDraw=t;
 }"""
once(old,new)
# Reactive human eye-line. Speaking looks towards the listener during pauses.
once("humanHead.rotation.y=devPose.head+.018*Math.sin(t*.72);",
     "humanHead.rotation.y=devPose.head+((shot.speaker==='orange')?.13:(shot.speaker==='blue')?-.12:0)+.018*Math.sin(t*.72);")
# Explicit attention-shifting screens to tell the actual joke visually, not generic numbers.
a=s.index("if(shots[activeIndex].camera==='screen'){",s.index('function renderFilmFrame('))
b=s.index(" // Title treatment is part of the final frame",a)
display="""if(shots[activeIndex].camera==='screen'){
  const revealUsers=activeIndex===8,shift=Math.max(0,Math.min(1,(time-accumulated)/Math.max(.1,shots[activeIndex].duration)));
  const grd=outCtx.createLinearGradient(0,0,360,H);
  grd.addColorStop(0,'#172340');grd.addColorStop(.7,'#0b1128');grd.addColorStop(1,'#060a18');
  outCtx.fillStyle=grd;outCtx.fillRect(0,0,360,H);
  const glass=outCtx.createLinearGradient(0,118,0,H*.79);
  glass.addColorStop(0,'#192a42');glass.addColorStop(1,'#0b1428');
  outCtx.fillStyle=glass;roundRect(16,112,328,H*.72,15);outCtx.fill();
  outCtx.lineWidth=1.5;outCtx.strokeStyle='#48668c';outCtx.stroke();
  outCtx.fillStyle='#0b1425';roundRect(26,124,308,H*.69,11);outCtx.fill();
  outCtx.textAlign='left';
  outCtx.fillStyle='#8d9fb4';outCtx.font='bold 11px Arial';
  outCtx.fillText('FRAMEFORGE  /  LIVE TELEMETRY',39,154);
  for(let j=0;j<3;j++){outCtx.fillStyle=['#e97e80','#edbc6c','#71d5ab'][j];outCtx.beginPath();outCtx.arc(281+j*16,148,4,0,Math.PI*2);outCtx.fill();}
  outCtx.fillStyle='#8e9db3';outCtx.font='11px monospace';
  outCtx.fillText('prod / deployment 7a4f',40,187);
  outCtx.fillStyle=revealUsers?'#f2a3ad':'#82f0c8';outCtx.font='bold 17px Arial';
  outCtx.fillText(revealUsers?'CUSTOMER SESSIONS':'PAGE LOAD TIME',40,235);
  outCtx.textAlign='center';outCtx.font='900 83px Arial';
  outCtx.fillText(revealUsers?'0':'0 ms',180,341);
  outCtx.font='13px Arial';outCtx.fillStyle='#e4e9f5';
  outCtx.fillText(revealUsers?'No one can use the app.':'Instant page delivery achieved.',180,376);
  outCtx.textAlign='left';
  outCtx.fillStyle='#172438';roundRect(40,404,280,53,7);outCtx.fill();
  outCtx.fillStyle='#a9bdca';outCtx.font='13px monospace';
  outCtx.fillText(revealUsers?'GET /customers  -> []':'GET /api       -> disabled',52,425);
  outCtx.fillStyle=revealUsers?'#f4a1a8':'#a3f1cf';outCtx.font='bold 12px monospace';
  outCtx.fillText(revealUsers?'0 ACTIVE USERS':'REQUESTS ELIMINATED',52,445);
  const graphY=Math.min(H-60,505),barMax=240;
  outCtx.strokeStyle='#344b67';outCtx.lineWidth=1;outCtx.beginPath();
  outCtx.moveTo(45,graphY+80);outCtx.lineTo(315,graphY+80);outCtx.stroke();
  outCtx.strokeStyle=revealUsers?'#f1a0aa':'#80e5bf';outCtx.lineWidth=3;outCtx.beginPath();
  for(let i=0;i<10;i++){
   let px=46+i*(barMax/9),v=revealUsers?72:75-23*Math.exp(-i*.6);
   if(i===0)outCtx.moveTo(px,graphY+v);else outCtx.lineTo(px,graphY+v);
  }
  outCtx.stroke();outCtx.font='11px Arial';outCtx.fillStyle='#8b9eb5';
  outCtx.fillText(revealUsers?'NO CUSTOMERS DETECTED':'LOAD TIME: 0.000 SECONDS',45,graphY+106);
  if(shift>.68){outCtx.fillStyle=revealUsers?'#ef7e87':'#64d4a3';outCtx.fillRect(40,H*.77,280,2);}
 }
"""
s=s[:a]+display+s[b:]
# Avoid stale summary implying true phoneme sync.
s=s.replace('true phoneme visemes','actual aligned phoneme visemes')
p.write_text(s)
print('EDIT_OK: reaction cuts, gaze and storytelling telemetry')

