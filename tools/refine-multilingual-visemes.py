from pathlib import Path
s=Path("src/speech-performance-core.js").read_text()
a=""" const visemeOf=token=>{
  const s=token.toLowerCase();"""
b=""" const visemeOf=token=>{
  const s=token.toLowerCase();
  // Indic grapheme heuristics, not linguistic forced alignment or speech recognition.
  if(/[మపబభमपबभ]/u.test(s[0]||''))return 'closed';
  if(/[ఫవफ़फव]/u.test(s[0]||''))return 'teeth';
  if(/[ఊఉఒఓఔుూఒొోౌउऊओऔुूोौ]/u.test(s))return 'round';
  if(/[ఇఈఎఏఐిీెేైइईएऐिीेै]/u.test(s))return 'wide';"""
assert s.count(a)==1;s=s.replace(a,b,1)
a="""  const words=(typeof text==='string'?text:'').toLowerCase().match(/[a-z']+/g)||[];"""
b="""  const words=(typeof text==='string'?text:'').normalize('NFC').toLowerCase().match(/[\\p{L}\\p{M}']+/gu)||[];"""
assert s.count(a)==1;s=s.replace(a,b,1)
a="""   const segments=word.match(/sh|th|ch|ph|oo|ee|ea|ow|ou|[a-z]/g)||[word];"""
b="""   const segments=/^[a-z']+$/u.test(word)
     ?(word.match(/sh|th|ch|ph|oo|ee|ea|ow|ou|[a-z]/g)||[word])
     :Array.from(new Intl.Segmenter('und',{granularity:'grapheme'}).segment(word),part=>part.segment);"""
assert s.count(a)==1;s=s.replace(a,b,1)
a="""    const vowel=/[aeiouy]/.test(letter);"""
b="""    const vowel=/[aeiouyఅఆఇఈఉఊఋఎఏఐఒఓఔాిీుూఋెేైొోౌअआइईउऊऋएऐओऔािीुूृेैोौ]/u.test(letter);"""
assert s.count(a)==1;s=s.replace(a,b,1)
Path("src/speech-performance-core.js").write_text(s)

p=Path("index.html");s=p.read_text()
a="function applyHumanFacePose(pose){"
b="function applyHumanFacePose(pose,speech=null){"
assert s.count(a)==1;s=s.replace(a,b,1)
a=""" const smile=pose.smile>.30&&pose.mouthOpen<.34;
 const frown=pose.smile<-.25&&pose.mouthOpen<.35;"""
b=""" const speaking=!!speech&&speech.viseme!=='rest';
 const smile=!speaking&&pose.smile>.30&&pose.mouthOpen<.34;
 const frown=!speaking&&pose.smile<-.25&&pose.mouthOpen<.35;"""
assert s.count(a)==1;s=s.replace(a,b,1)
a=""" mouthNew.scale.x=pose.mouthWidth;
 mouthNew.scale.y=Math.max(.09,pose.mouthOpen*1.04+pose.round*.18);"""
b=""" const visemeWidth={rest:1,closed:.88,round:.62,wide:1.34,teeth:1.10,open:1}[speech?.viseme]??1;
 mouthNew.scale.x=pose.mouthWidth*visemeWidth;
 mouthNew.scale.y=speech?.viseme==='closed'?.045:
  Math.max(speech?.viseme==='rest'?.075:.09,pose.mouthOpen*1.04+pose.round*.18);
 humanLipCorners.forEach((corner,i)=>{
  corner.position.x=(i===0?-1:1)*(.112+pose.smile*.008-pose.round*.019)*visemeWidth;
 });"""
assert s.count(a)==1;s=s.replace(a,b,1)
a=""" applyHumanFacePose(facialPose);
};
// V5 projects"""
b=""" applyHumanFacePose(facialPose,shot.speaker==='dev'?speechCue:null);
};
// V5 projects"""
assert s.count(a)==1;s=s.replace(a,b,1)
Path("index.html").write_text(s)
print("Applied script-aware Telugu/Hindi mouth cues and distinct 3D DEV mouth widths")
