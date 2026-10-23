from pathlib import Path
p=Path('index.html');s=p.read_text()
pairs=[
("async function exportFrameAccurateMP4({frameLimit=null,width=720,height=1280,download=true}={}){",
 "async function exportFrameAccurateMP4({frameLimit=null,width=720,height=1280,download=true,startTime=0}={}){"),
("if(!Number.isInteger(frames)||frames<=0||frames>18000)throw new Error('Invalid frame count');",
 "if(!Number.isInteger(frames)||frames<=0||frames>18000)throw new Error('Invalid frame count');\n if(!Number.isFinite(startTime)||startTime<0||startTime+frames/fps>duration+.05)throw new Error('Export segment outside the film duration');"),
("if(decoded.length<intendedLength-100)throw new Error('Voice track is shorter than the chosen video duration');",
 "const startSample=Math.round(startTime*decoded.sampleRate);\n  if(decoded.length<startSample+intendedLength-100)throw new Error('Voice track is shorter than the chosen video segment');"),
("decoded.getChannelData(c).subarray(0,intendedLength)","decoded.getChannelData(c).subarray(startSample,startSample+intendedLength)"),
("renderFilmFrame(i/fps,width,height,false);","renderFilmFrame(startTime+i/fps,width,height,false);")
]
for old,new in pairs:
 if s.count(old)!=1:raise RuntimeError('source mismatch: '+old[:100])
 s=s.replace(old,new,1)
p.write_text(s);print('Frame-accurate audio-locked partial export implemented')

