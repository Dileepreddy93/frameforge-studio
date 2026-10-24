from pathlib import Path
p=Path('index.html');s=p.read_text()
def rep(a,b):
 global s
 if s.count(a)!=1:raise RuntimeError('Expected 1 match '+repr(a[:110])+' got '+str(s.count(a)))
 s=s.replace(a,b,1)
rep('<script src="./src/performance-core.js"></script>','<script src="./src/performance-core.js"></script>\n<script src="./src/speech-performance-core.js"></script>')
rep(" const viseme=estimateViseme(shot.text,local,shot.duration);",
""" // Acoustic envelope maps graphemes into speaking regions and pauses.
 const speechCue=window.FrameForgeSpeechCore.evaluate({
   text:shot.text,local,duration:shot.duration,shotStart:t-local,
   samples:envReady?decodedEnvelope:null,rate:20,audioEnergy:open,speaker:shot.speaker
 });
 const viseme=speechCue.viseme;
 const speechPower=speechCue.mouthOpen;""")
rep("drawActorFace(faces.blue,expression.blue,shot.speaker==='blue'?open:0,t,viseme,blueGaze);",
    "drawActorFace(faces.blue,expression.blue,shot.speaker==='blue'?speechPower:0,t,viseme,blueGaze);")
rep("drawActorFace(faces.orange,expression.orange,shot.speaker==='orange'?open:0,t,viseme,orangeGaze);",
    "drawActorFace(faces.orange,expression.orange,shot.speaker==='orange'?speechPower:0,t,viseme,orangeGaze);")
rep("faces.orange.orangeMouth.scale.y=shot.speaker==='orange'?1+open*1.9:1;",
    "faces.orange.orangeMouth.scale.y=shot.speaker==='orange'?1+speechPower*1.9:1;")
rep("speaking:shot.speaker==='dev',energy:shot.speaker==='dev'?open:0,",
    "speaking:shot.speaker==='dev'&&speechCue.voiced,energy:shot.speaker==='dev'?speechPower:0,")
rep("window.FrameForgePerformanceQA=Object.freeze({",
"""window.FrameForgeSpeechQA=Object.freeze({
 version:window.FrameForgeSpeechCore.version,
 types:window.FrameForgeSpeechCore.types,
 at:(seconds)=>{
  const secondsSafe=Math.max(0,Number(seconds)||0);let cursor=0,shot=shots.at(-1);
  for(const s of shots){if(secondsSafe<cursor+s.duration){shot=s;break}cursor+=s.duration}
  return window.FrameForgeSpeechCore.evaluate({text:shot.text,local:secondsSafe-cursor,
    duration:shot.duration,shotStart:cursor,samples:envReady?decodedEnvelope:null,
    rate:20,audioEnergy:0,speaker:shot.speaker});
 }
});
window.FrameForgePerformanceQA=Object.freeze({""")
p.write_text(s)
print('V5.3 acoustic-guided speech timing wired to actual Three.js performers')

