/*
 * V5.3 audio-guided performance estimator.
 * Maps dialogue text positions into active acoustic regions of a soundtrack's envelope.
 * This is deliberately NOT speech recognition, diarization, or phoneme forced alignment.
 */
(function(root, factory){
 const core=factory();
 if(typeof module==='object'&&module.exports)module.exports=core;
 else root.FrameForgeSpeechCore=core;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const clip=(n,min=0,max=1)=>Math.min(max,Math.max(min,n));
 const TYPES=Object.freeze(['rest','closed','round','wide','teeth','open']);
 const syllableWeights={a:1.1,e:1.1,i:1.0,o:1.2,u:1.0};
 const visemeOf=token=>{
  const s=token.toLowerCase();
  // Indic grapheme heuristics, not linguistic forced alignment or speech recognition.
  if(/[మపబభमपबभ]/u.test(s[0]||''))return 'closed';
  if(/[ఫవफ़फव]/u.test(s[0]||''))return 'teeth';
  if(/[ఊఉఒఓఔుూఒొోౌउऊओऔुूोौ]/u.test(s))return 'round';
  if(/[ఇఈఎఏఐిీెేైइईएऐिीेै]/u.test(s))return 'wide';
  if(/^(m|b|p)/.test(s))return 'closed';
  if(/^(f|v)/.test(s))return 'teeth';
  if(/^(oo|ou|ow|u|o|w|r)/.test(s))return 'round';
  if(/^(ee|ea|i|e|y)/.test(s))return 'wide';
  if(/^(s|t|d|n|l|k|g|h|sh|th|ch)/.test(s))return 'open';
  return 'open';
 };
 function textUnits(text){
  const words=(typeof text==='string'?text:'').normalize('NFC').toLowerCase().match(/[\p{L}\p{M}']+/gu)||[];
  const units=[];
  for(let wi=0;wi<words.length;wi++){
   const word=words[wi];
   const segments=/^[a-z']+$/u.test(word)
     ?(word.match(/sh|th|ch|ph|oo|ee|ea|ow|ou|[a-z]/g)||[word])
     :Array.from(new Intl.Segmenter('und',{granularity:'grapheme'}).segment(word),part=>part.segment);
   for(let i=0;i<segments.length;i++){
    const letter=segments[i];
    const vowel=/[aeiouyఅఆఇఈఉఊఋఎఏఐఒఓఔాిీుూఋెేైొోౌअआइईउऊऋएऐओऔािीुूृेैोौ]/u.test(letter);
    units.push({type:visemeOf(letter),weight:(vowel?1.35:.8)*(syllableWeights[letter]||1),
      wordIndex:wi,word,segment:letter});
   }
  }
  return units;
 }
 function evaluate({text='',local=0,duration=3,shotStart=0,samples=null,rate=20,audioEnergy=0,speaker='dev'}={}){
  if(!Number.isFinite(local)||!Number.isFinite(duration)||duration<=0||!Number.isFinite(shotStart)||!Number.isFinite(rate)||rate<1||rate>240)throw new Error('Invalid speech timeline');
  if(typeof text!=='string'||text.length>500)throw new Error('Invalid speech transcript');
  if(typeof speaker!=='string'||speaker.length>40)throw new Error('Invalid speaker');
  const units=textUnits(text),fallback=(units.length?clip(local/duration):0);
  if(local<0||local>=duration||units.length===0)return Object.freeze({viseme:'rest',mouthOpen:0,voiced:false,progress:fallback,wordIndex:-1,confidence:'estimated'});
  const hasEnvelope=samples&&typeof samples.length==='number'&&samples.length>=2;
  let active=[],effectiveProgress=fallback,voiced=false,intensity=clip(audioEnergy);
  if(hasEnvelope){
   const start=Math.max(0,Math.round(shotStart*rate));
   const end=Math.min(samples.length,Math.max(start+1,Math.round((shotStart+duration)*rate)));
   let window=[];
   for(let i=start;i<end;i++)window.push(clip(Number(samples[i])||0));
   if(window.length>3){
    const sorted=window.slice().sort((a,b)=>a-b);
    const quant=q=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*q))];
    const floor=quant(.23),top=quant(.92);
    const threshold=Math.max(.055,Math.min(.65,floor+(top-floor)*.24));
    const energyScale=Math.max(.09,top-threshold);
    active=window.map(v=>clip((v-threshold)/energyScale));
    let sum=active.reduce((a,b)=>a+b,0);
    if(sum>1.1){
      let offset=Math.max(0,Math.min(window.length-1,Math.floor(local*rate)));
      let accum=0;for(let i=0;i<=offset;i++)accum+=active[i];
      effectiveProgress=clip(accum/sum);
      let e=active[offset];
      // Suppress orphan peaks from Foley by requiring more than one active audio frame.
      const nearby=Math.max(active[offset-1]||0,active[offset+1]||0);
      voiced=e>.16&&(nearby>.12||e>.56);
      intensity=voiced?clip(e*.84+Math.min(.16,e*.2)):0;
    }
   }
  }else{
   voiced=intensity>.10;
   intensity=voiced?intensity:0;
  }
  const total=units.reduce((sum,u)=>sum+u.weight,0);
  let cursor=effectiveProgress*total,index=units.length-1;
  for(let i=0;i<units.length;i++){if(cursor<units[i].weight){index=i;break}cursor-=units[i].weight;}
  const unit=units[index];
  // Bilabial closure is visible even during otherwise voiced moments.
  const mouthOpen=(!voiced||unit.type==='closed')?0:clip(intensity*(unit.type==='round'?.78:unit.type==='teeth'?.49:.97));
  return Object.freeze({viseme:voiced?unit.type:'rest',mouthOpen,voiced,
    progress:effectiveProgress,wordIndex:voiced?unit.wordIndex:-1,confidence:hasEnvelope?'acoustic-guided-approximation':'time-estimate'});
 }
 return Object.freeze({version:'v5.3-audio-guided',types:TYPES,textUnits,evaluate});
});
