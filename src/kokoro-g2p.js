/*
 * English text -> Kokoro phonemes, for the voices (browser worker, tools/phonemize.mjs and Node tests).
 * American by default; a lexicon with "british": true (en-gb-lexicon.json) gives British English, as misaki's
 * british=True does: its own dictionaries, -s/-ed with ɪ, no flapped t, and guessed words made non-rhotic.
 * The dictionary half is a JavaScript port of misaki's en.py (hexgrad/misaki, Apache-2.0, see
 * assets/voice/NOTICE.md): gold and silver dictionaries, the -s/-ed/-ing stem rules, stress rules,
 * function words and numbers. misaki asks spaCy for part-of-speech tags and eSpeak NG (GPL) for
 * unknown words; here a few context rules stand in for the tagger, and our own compound splitter
 * and letter-to-sound rules guess unknown words. No GPL code is involved.
 */
(function(root, factory){
 const core=factory();
 if(typeof module==='object'&&module.exports)module.exports=core;
 else root.FrameForgeG2P=core;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='g2p-1';
 const PUNCTS=new Set(';:,.!?—…"“”'),NON_QUOTE_PUNCTS=new Set(';:,.!?—…');
 const SUBTOKEN_JUNKS=new Set("',-._‘’/");
 const VOWELS=new Set('AIOQWYaiuæɑɒɔəɛɜɪʊʌᵻ'),CONSONANTS=new Set('bdfhjklmnpstvwzðŋɡɹɾʃʒʤʧθ');
 const DIPHTHONGS=new Set('AIOQWYʤʧ'),US_TAUS=new Set('AIOWYiuæɑəɛɪɹʊʌ');
 const PRIMARY='ˈ',SECONDARY='ˌ';
 const CURRENCIES={'$':['dollar','cent'],'£':['pound','pence'],'€':['euro','cent']};
 const ORDINALS=new Set(['st','nd','rd','th']),SYMBOLS={'%':'percent','&':'and','+':'plus','@':'at'};
 const isLexiconChars=w=>/^[A-Za-z'-]+$/.test(w);
 const isAlpha=w=>/^\p{L}+$/u.test(w);
 const isDigits=w=>/^[0-9]+$/.test(w);
 const isUpper=w=>w===w.toUpperCase()&&w!==w.toLowerCase();
 const capitalize=w=>w.charAt(0).toUpperCase()+w.slice(1).toLowerCase();

 function applyStress(ps,stress){
  const restress=ps=>{
   const ips=[...ps].map((p,i)=>[i,p]);
   for(const [i,p] of ips.slice())if(p===PRIMARY||p===SECONDARY){const j=ips.findIndex(([k,v])=>k>=i&&VOWELS.has(v));if(j>=0)ips[i]=[ips[j][0]-.5,p];}
   return ips.sort((a,b)=>a[0]-b[0]).map(x=>x[1]).join('');
  };
  const has=c=>ps.includes(c),noStress=!has(PRIMARY)&&!has(SECONDARY),noVowel=![...ps].some(c=>VOWELS.has(c));
  if(stress==null)return ps;
  if(stress<-1)return ps.replaceAll(PRIMARY,'').replaceAll(SECONDARY,'');
  if(stress===-1||((stress===0||stress===-.5)&&has(PRIMARY)))return ps.replaceAll(SECONDARY,'').replaceAll(PRIMARY,SECONDARY);
  if([0,.5,1].includes(stress)&&noStress)return noVowel?ps:restress(SECONDARY+ps);
  if(stress>=1&&!has(PRIMARY)&&has(SECONDARY))return ps.replaceAll(SECONDARY,PRIMARY);
  if(stress>1&&noStress)return noVowel?ps:restress(PRIMARY+ps);
  return ps;
 }
 const stressWeight=ps=>ps?[...ps].reduce((a,c)=>a+(DIPHTHONGS.has(c)?2:1),0):0;

 // --- numbers (the parts of num2words that misaki uses) -------------------------------------
 const ONES=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen',
  'fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
 const TENS=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
 const SCALES=[[1e12,'trillion'],[1e9,'billion'],[1e6,'million'],[1e3,'thousand']];
 function cardinal(n){
  if(n<0)return 'minus '+cardinal(-n);
  if(n<20)return ONES[n];
  if(n<100)return TENS[Math.floor(n/10)]+(n%10?'-'+ONES[n%10]:'');
  if(n<1000)return ONES[Math.floor(n/100)]+' hundred'+(n%100?' and '+cardinal(n%100):'');
  for(const [size,name] of SCALES)if(n>=size){const rest=n%size;
   return cardinal(Math.floor(n/size))+' '+name+(rest?(rest<100?' and ':', ')+cardinal(rest):'');}
  return String(n);
 }
 const ORDINAL_WORDS={one:'first',two:'second',three:'third',five:'fifth',eight:'eighth',nine:'ninth',twelve:'twelfth'};
 function ordinal(n){
  const words=cardinal(n),m=words.match(/([a-z]+)$/),last=m[1],stem=words.slice(0,-last.length);
  return stem+(ORDINAL_WORDS[last]??(last.endsWith('y')?last.slice(0,-1)+'ieth':last+'th'));
 }
 function year(n){
  const high=Math.floor(n/100),low=n%100;
  if(high===0||(high%10===0&&low<10)||high>=100)return cardinal(n);
  return cardinal(high)+' '+(low===0?'hundred':low<10?'oh-'+cardinal(low):cardinal(low));
 }
 function decimal(text){
  const [whole,frac='']=text.split('.'),digits=frac.replace(/0+$/,'');
  return (whole?cardinal(Number(whole)):'zero')+(digits?' point '+[...digits].map(d=>ONES[d]).join(' '):'');
 }

 // --- the lexicon ------------------------------------------------------------------------------
 function grow(d){
  const e={};
  for(const [k,v] of Object.entries(d)){
   if(k.length<2)continue;
   if(k===k.toLowerCase()){if(k!==capitalize(k))e[capitalize(k)]=v;}
   else if(k===capitalize(k))e[k.toLowerCase()]=v;
  }
  return Object.assign(e,d);
 }
 const parentTag=tag=>!tag?tag:tag.startsWith('VB')?'VERB':tag.startsWith('NN')?'NOUN':tag.startsWith('RB')?'ADV':tag.startsWith('JJ')?'ADJ':tag;

 function makeLexicon(data){
  const golds=grow(data.gold),silvers=grow(data.silver),capStresses=[.5,2],british=Boolean(data.british);
  const has=(d,k)=>Object.prototype.hasOwnProperty.call(d,k);
  function getNNP(word){
   const ps=[...word].filter(c=>/\p{L}/u.test(c)).map(c=>golds[c.toUpperCase()]);
   if(ps.some(p=>typeof p!=='string'))return [null,null];
   const joined=applyStress(ps.join(''),0),at=joined.lastIndexOf(SECONDARY);
   return [at<0?joined:joined.slice(0,at)+PRIMARY+joined.slice(at+1),3];
  }
  function specialCase(word,tag,stress,ctx){
   if(has(SYMBOLS,word))return lookup(SYMBOLS[word],null,null,ctx);
   if(word.replace(/^\.+|\.+$/g,'').includes('.')&&isAlpha(word.replaceAll('.',''))&&Math.max(...word.split('.').map(x=>x.length))<3)return getNNP(word);
   if(word==='a'||word==='A')return [tag==='DT'?'ɐ':'ˈA',4];
   if(['am','Am','AM'].includes(word)){
    if(ctx.futureVowel==null||word!=='am'||(stress&&stress>0))return [golds.am,4];
    return ['ɐm',4];
   }
   if(['an','An','AN'].includes(word))return ['ɐn',4];
   if(word==='I'&&tag==='PRP')return [SECONDARY+'I',4];
   if(word==='to'||word==='To'||(word==='TO'&&(tag==='TO'||tag==='IN')))return [ctx.futureVowel==null?golds.to:ctx.futureVowel?'tʊ':'tə',4];
   if(word==='in'||word==='In'||(word==='IN'&&tag!=='NNP'))return [(ctx.futureVowel==null||tag!=='IN'?PRIMARY:'')+'ɪn',4];
   if(word==='the'||word==='The'||(word==='THE'&&tag==='DT'))return [ctx.futureVowel===true?'ði':'ðə',4];
   if(tag==='IN'&&/^vs\.?$/i.test(word))return lookup('versus',null,null,ctx);
   if(['used','Used','USED'].includes(word))return [(tag==='VBD'||tag==='JJ')&&ctx.futureTo?golds.used.VBD:golds.used.DEFAULT,4];
   return [null,null];
  }
  function isKnown(word){
   if(has(golds,word)||has(SYMBOLS,word)||has(silvers,word))return true;
   if(!isAlpha(word)||!isLexiconChars(word))return false;
   if(word.length===1)return true;
   if(word===word.toUpperCase()&&has(golds,word.toLowerCase()))return true;
   return word.slice(1)===word.slice(1).toUpperCase();
  }
  function lookup(word,tag,stress,ctx){
   let isNNP=null;
   if(word===word.toUpperCase()&&!has(golds,word)){word=word.toLowerCase();isNNP=tag==='NNP';}
   let ps=has(golds,word)?golds[word]:null,rating=4;
   if(ps==null&&!isNNP){ps=has(silvers,word)?silvers[word]:null;rating=3;}
   if(ps&&typeof ps==='object'){
    if(ctx&&ctx.futureVowel==null&&'None' in ps)tag='None';
    else if(!(tag in ps))tag=parentTag(tag);
    ps=tag in ps?ps[tag]:ps.DEFAULT;
   }
   if(ps==null||(isNNP&&!ps.includes(PRIMARY))){const nnp=getNNP(word);if(nnp[0]!=null)return nnp;}
   return [ps==null?null:applyStress(ps,stress),rating];
  }
  const weak=british?'ɪ':'ᵻ';
  const suffixS=stem=>!stem?null:'ptkfθ'.includes(stem.at(-1))?stem+'s':'szʃʒʧʤ'.includes(stem.at(-1))?stem+weak+'z':stem+'z';
  function stemS(word,tag,stress,ctx){
   if(word.length<3||!word.endsWith('s'))return [null,null];
   let stem;
   if(!word.endsWith('ss')&&isKnown(word.slice(0,-1)))stem=word.slice(0,-1);
   else if((word.endsWith("'s")||(word.length>4&&word.endsWith('es')&&!word.endsWith('ies')))&&isKnown(word.slice(0,-2)))stem=word.slice(0,-2);
   else if(word.length>4&&word.endsWith('ies')&&isKnown(word.slice(0,-3)+'y'))stem=word.slice(0,-3)+'y';
   else return [null,null];
   const [ps,rating]=lookup(stem,tag,stress,ctx);return [suffixS(ps),rating];
  }
  function suffixEd(stem){
   if(!stem)return null;
   const last=stem.at(-1);
   if('pkfθʃsʧ'.includes(last))return stem+'t';
   if(last==='d')return stem+weak+'d';
   if(last!=='t')return stem+'d';
   if(british||stem.length<2)return stem+'ɪd';
   if(US_TAUS.has(stem.at(-2)))return stem.slice(0,-1)+'ɾᵻd';
   return stem+'ᵻd';
  }
  function stemEd(word,tag,stress,ctx){
   if(word.length<4||!word.endsWith('d'))return [null,null];
   let stem;
   if(!word.endsWith('dd')&&isKnown(word.slice(0,-1)))stem=word.slice(0,-1);
   else if(word.length>4&&word.endsWith('ed')&&!word.endsWith('eed')&&isKnown(word.slice(0,-2)))stem=word.slice(0,-2);
   else return [null,null];
   const [ps,rating]=lookup(stem,tag,stress,ctx);return [suffixEd(ps),rating];
  }
  const suffixIng=stem=>!stem?null:british?('əː'.includes(stem.at(-1))?null:stem+'ɪŋ'):
   stem.length>1&&stem.at(-1)==='t'&&US_TAUS.has(stem.at(-2))?stem.slice(0,-1)+'ɾɪŋ':stem+'ɪŋ';
  function stemIng(word,tag,stress,ctx){
   if(word.length<5||!word.endsWith('ing'))return [null,null];
   let stem;
   if(word.length>5&&isKnown(word.slice(0,-3)))stem=word.slice(0,-3);
   else if(isKnown(word.slice(0,-3)+'e'))stem=word.slice(0,-3)+'e';
   else if(word.length>5&&/([bcdgklmnprstvxz])\1ing$|cking$/.test(word)&&isKnown(word.slice(0,-4)))stem=word.slice(0,-4);
   else return [null,null];
   const [ps,rating]=lookup(stem,tag,stress,ctx);return [suffixIng(ps),rating];
  }
  function getWord(word,tag,stress,ctx){
   const special=specialCase(word,tag,stress,ctx);
   if(special[0]!=null)return special;
   const wl=word.toLowerCase();
   if(word.length>1&&isAlpha(word.replaceAll("'",''))&&word!==wl&&(tag!=='NNP'||word.length>7)&&!has(golds,word)&&!has(silvers,word)&&
    (word===word.toUpperCase()||word.slice(1)===word.slice(1).toLowerCase())&&
    (has(golds,wl)||has(silvers,wl)||[stemS,stemEd,stemIng].some(fn=>fn(wl,tag,stress,ctx)[0]!=null)))word=wl;
   if(isKnown(word))return lookup(word,tag,stress,ctx);
   if(word.endsWith("s'")&&isKnown(word.slice(0,-2)+"'s"))return lookup(word.slice(0,-2)+"'s",tag,stress,ctx);
   if(word.endsWith("'")&&isKnown(word.slice(0,-1)))return lookup(word.slice(0,-1),tag,stress,ctx);
   for(const [fn,s] of [[stemS,stress],[stemEd,stress],[stemIng,stress==null?.5:stress]]){const r=fn(word,tag,s,ctx);if(r[0]!=null)return r;}
   return [null,null];
  }
  const isCurrency=w=>!w.includes('.')||(w.split('.').length===2&&w.split('.')[1].length<3);
  function getNumber(word,currency,isHead,flags=''){
   const sm=word.match(/[a-z']+$/),suffix=sm?sm[0]:null;
   if(suffix)word=word.slice(0,-suffix.length);
   const result=[];
   if(word.startsWith('-')){result.push(lookup('minus',null,null,null));word=word.slice(1);}
   const extend=(num,first=true,escape=false)=>{
    const splits=(escape?num:cardinal(Number(num))).split(/[^a-z]+/).filter(Boolean);
    splits.forEach((w,i)=>{
     if(w!=='and'||flags.includes('&')){
      if(first&&i===0&&splits.length>1&&w==='one'&&flags.includes('a'))result.push(['ə',4]);
      else result.push(lookup(w,null,w==='point'?-2:null,null));
     }else if(w==='and'&&flags.includes('n')&&result.length)result[result.length-1]=[result.at(-1)[0]+'ən',result.at(-1)[1]];
    });
   };
   if(isDigits(word)&&ORDINALS.has(suffix))extend(ordinal(Number(word)),true,true);
   else if(!result.length&&word.length===4&&!CURRENCIES[currency]&&isDigits(word))extend(year(Number(word)),true,true);
   else if(!isHead&&!word.includes('.')){
    const num=word.replaceAll(',','');
    if(num[0]==='0'||num.length>3)[...num].forEach(n=>extend(n,false));
    else if(num.length===3&&!num.endsWith('00')){
     extend(num[0]);
     if(num[1]==='0'){result.push(lookup('O',null,-2,null));extend(num[2],false);}else extend(num.slice(1),false);
    }else extend(num);
   }else if(word.split('.').length>2||!isHead){
    let first=true;
    for(const num of word.replaceAll(',','').split('.')){
     if(!num){}else if(num[0]==='0'||(num.length!==2&&[...num.slice(1)].some(n=>n!=='0')))[...num].forEach(n=>extend(n,false));
     else extend(num,first);
     first=false;
    }
   }else if(CURRENCIES[currency]&&isCurrency(word)){
    let pairs=word.replaceAll(',','').split('.').map((n,i)=>[n?Number(n):0,CURRENCIES[currency][i]]).filter(p=>p[1]);
    if(pairs.length>1){if(pairs[1][0]===0)pairs=pairs.slice(0,1);else if(pairs[0][0]===0)pairs=pairs.slice(1);}
    pairs.forEach(([num,unit],i)=>{
     if(i>0)result.push(lookup('and',null,null,null));
     extend(String(num),i===0);
     result.push(Math.abs(num)!==1&&unit!=='pence'?stemS(unit+'s',null,null,null):lookup(unit,null,null,null));
    });
   }else{
    let text;
    if(isDigits(word))text=cardinal(Number(word));
    else if(!word.includes('.')){const n=Number(word.replaceAll(',',''));text=ORDINALS.has(suffix)?ordinal(n):cardinal(n);}
    else{const w=word.replaceAll(',','');text=w[0]==='.'?'point '+[...w.slice(1)].map(n=>ONES[n]).join(' '):decimal(w);}
    extend(text,true,true);
   }
   if(!result.length||result.some(r=>r[0]==null))return [null,null];
   const ps=result.map(r=>r[0]).join(' '),rating=Math.min(...result.map(r=>r[1]));
   if(suffix==='s'||suffix==="'s")return [suffixS(ps),rating];
   if(suffix==='ed'||suffix==="'d")return [suffixEd(ps),rating];
   if(suffix==='ing')return [suffixIng(ps),rating];
   return [ps,rating];
  }
  function appendCurrency(ps,currency){
   if(!currency||!CURRENCIES[currency])return ps;
   const unit=stemS(CURRENCIES[currency][0]+'s',null,null,null)[0];
   return unit?ps+' '+unit:ps;
  }
  function isNumber(word,isHead){
   if(![...word].some(c=>isDigits(c)))return false;
   for(const s of ['ing',"'d",'ed',"'s",...ORDINALS,'s'])if(word.endsWith(s)){word=word.slice(0,-s.length);break;}
   return [...word].every((c,i)=>isDigits(c)||c===','||c==='.'||(isHead&&i===0&&c==='-'));
  }
  function call(tk,ctx){
   let word=(tk.alias??tk.text).replace(/[‘’]/g,"'").normalize('NFKC');
   const stress=word===word.toLowerCase()?null:capStresses[Number(word===word.toUpperCase())];
   const [ps,rating]=getWord(word,tk.tag,stress,ctx);
   if(ps!=null)return [applyStress(appendCurrency(ps,tk.currency),tk.stress),rating];
   if(isNumber(word,tk.isHead)){const [n,r]=getNumber(word,tk.currency,tk.isHead,tk.numFlags||'');return [n==null?null:applyStress(n,tk.stress),r];}
   return [null,null];
  }
  return {call,lookup,isKnown,getNNP,golds,silvers,suffixS,suffixEd,suffixIng,british};
 }

 // --- words the dictionary does not know --------------------------------------------------------
 // First try two or three known words ("frameforge" = frame + forge), then letter-to-sound rules.
 const LTS=[
  [/^tion/,'ʃən'],[/^sion$/,'ʒən'],[/^[ct]ious/,'ʃəs'],[/^ture/,'ʧəɹ'],[/^sure/,'ʒəɹ'],
  [/^eigh/,'A'],[/^igh/,'I'],[/^augh/,'ɔ'],[/^ough/,'O'],[/^tch/,'ʧ'],[/^dge/,'ʤ'],[/^sch/,'sk'],
  [/^ch/,'ʧ'],[/^sh/,'ʃ'],[/^th/,'θ'],[/^ph/,'f'],[/^wh/,'w'],[/^gh/,'ɡ'],[/^ck/,'k'],[/^ng/,'ŋ'],[/^nk/,'ŋk'],[/^qu/,'kw'],
  [/^ee/,'i'],[/^ea/,'i'],[/^oo/,'u'],[/^ou/,'W'],[/^ow/,'O'],[/^o[iy]/,'Y'],[/^a[iy]/,'A'],[/^a[uw]/,'ɔ'],[/^oa/,'O'],
  [/^ie/,'i'],[/^e[iy]/,'A'],[/^(?:ue|ew)/,'u'],[/^ar(?![aeiouy])/,'ɑɹ'],[/^or(?![aeiouy])/,'ɔɹ'],[/^[eiu]r(?![aeiouy])/,'ɜɹ'],
  [/^a(?=[^aeiouy]e(?:s|d)?$)/,'A'],[/^i(?=[^aeiouy]e(?:s|d)?$)/,'I'],[/^o(?=[^aeiouy]e(?:s|d)?$)/,'O'],[/^u(?=[^aeiouy]e(?:s|d)?$)/,'u'],
  [/^e(?=[^aeiouy]e(?:s|d)?$)/,'i'],[/^e(?=s?$)/,''],[/^y(?=[aeiou])/,'j'],[/^c(?=[eiy])/,'s'],[/^g(?=[eiy])/,'ʤ'],
  [/^a$/,'ə'],[/^o$/,'O'],[/^i$/,'i'],[/^u$/,'u'],[/^o(?=[bcdfgklmnprstvz][aeiouy])/,'O'],[/^u(?=[bcdfgklmnprstvz][aeiouy])/,'u'],
  [/^([bcdfgklmnprstvz])\1/,null],[/^x/,'ks'],[/^a/,'æ'],[/^e/,'ɛ'],[/^i/,'ɪ'],[/^o/,'ɑ'],[/^u/,'ʌ'],[/^y$/,'i'],[/^y/,'ɪ'],
  [/^b/,'b'],[/^c/,'k'],[/^d/,'d'],[/^f/,'f'],[/^g/,'ɡ'],[/^h/,'h'],[/^j/,'ʤ'],[/^k/,'k'],[/^l/,'l'],[/^m/,'m'],[/^n/,'n'],
  [/^p/,'p'],[/^q/,'k'],[/^r/,'ɹ'],[/^s/,'s'],[/^t/,'t'],[/^v/,'v'],[/^w/,'w'],[/^z/,'z']
 ];
 function letterToSound(word){
  const w=word.toLowerCase().replace(/[^a-z]/g,'');
  let out='',i=0;
  while(i<w.length){
   const rest=w.slice(i);let hit=false;
   for(const [re,ps] of LTS){const m=rest.match(re);if(!m)continue;
    // A doubled consonant is said once: skip the first letter and let the next rule read the second.
    if(ps===null){i+=1;}else{out+=ps;i+=m[0].length;}
    hit=true;break;}
   if(!hit)i+=1;
  }
  out=out.replace(/(?<=[^aeiouyAIOWYæɑɔəɛɜɪʊʌ])s$/,'s').replace(/(?<=[bdɡvzmnŋlɹAIOWYiuæɑɔəɛɜɪʊʌ])s$/,'z');
  if(/^[^aeiouy]*y$/.test(w))out=out.replace(/i$/,'I');
  // Stress the first vowel; short vowels after it go weak.
  const chars=[...out],first=chars.findIndex(c=>VOWELS.has(c));
  if(first<0)return out;
  return chars.slice(0,first).join('')+PRIMARY+chars[first]+chars.slice(first+1).map((c,i,a)=>'æʌɑɛɜ'.includes(c)&&i<a.length-1?'ə':c).join('');
 }
 function makeGuesser(lex){
  const known=w=>w.length>=3&&(Object.prototype.hasOwnProperty.call(lex.golds,w)||Object.prototype.hasOwnProperty.call(lex.silvers,w));
  function split(w,depth){
   if(known(w))return [w];
   if(depth===0)return null;
   for(let i=w.length-3;i>=3;i--){
    const head=w.slice(0,i);if(!known(head))continue;
    const tail=split(w.slice(i),depth-1);if(tail)return [head,...tail];
   }
   return null;
  }
  function stem(w){
   const parts=split(w,2);
   if(parts&&parts.length>1){
    const ps=parts.map(p=>lex.lookup(p,null,null,null)[0]);
    if(ps.every(Boolean))return ps.map((p,i)=>i?applyStress(p,-1):p).join('');
   }
   return letterToSound(w);
  }
  // Our letter-to-sound rules are American; British guesses drop the r after vowels and use British vowels.
  const dialect=ps=>!lex.british?ps:ps.replace(/ɑɹ/g,'ɑː').replace(/ɔɹ/g,'ɔː').replace(/[ɜə]ɹ(?![AIOQWYaiuæɑɒɔəɛɜɪʊʌᵻ])/g,m=>m[0]==='ɜ'?'ɜː':'ə')
   .replace(/ɪɹ(?![AIOQWYaiuæɑɒɔəɛɜɪʊʌᵻ])/g,'ɪə').replace(/ɛɹ(?![AIOQWYaiuæɑɒɔəɛɜɪʊʌᵻ])/g,'ɛː').replace(/ʊɹ(?![AIOQWYaiuæɑɒɔəɛɜɪʊʌᵻ])/g,'ʊə')
   .replace(/O/g,'Q').replace(/ɑ(?!ː)/g,'ɒ').replace(/ᵻ/g,'ɪ').replace(/ɾ/g,'t');
  const guess=word=>dialect(guessAmerican(word));
  guess.dialect=dialect;
  return guess;
  function guessAmerican(word){
   const letters=word.replace(/[^A-Za-z]/g,'');
   if(!letters)return '';
   // Acronyms and words with no vowel letters ("npm") are spelled out.
   if((isUpper(letters)&&letters.length<=5)||!/[aeiouy]/i.test(letters)){const [ps]=lex.getNNP(letters);if(ps)return ps;}
   const w=letters.toLowerCase();
   if(w.length>5&&w.endsWith('ing')){const base=stem(w.slice(0,-3));return lex.suffixIng(base)??base+'ɪŋ';}
   if(w.length>4&&w.endsWith('ed'))return lex.suffixEd(stem(w.slice(0,-2)));
   if(w.length>3&&w.endsWith('s')&&!/(ss|us|is)$/.test(w))return lex.suffixS(stem(w.slice(0,-1)));
   return stem(w);
  };
 }

 // Respelling, as dictionaries write how to say a word: "koh", "KOR", "ree", "ah", "shun". Longest match first.
 const RESPELL=[['eer','ɪɹ'],['air','ɛɹ'],['ear','ɪɹ'],['ure','ʊɹ'],['igh','I'],['eye','I'],['oh','O'],['oe','O'],['ow','W'],['oy','Y'],
  ['oi','Y'],['aw','ɔ'],['ah','ɑ'],['ay','A'],['ai','A'],['ee','i'],['ea','i'],['oo','u'],['ew','ju'],['uh','ʌ'],['ur','ɜɹ'],['er','ɜɹ'],
  ['ir','ɜɹ'],['ar','ɑɹ'],['or','ɔɹ'],['ih','ɪ'],['eh','ɛ'],['ch','ʧ'],['sh','ʃ'],['zh','ʒ'],['th','θ'],['dh','ð'],['ng','ŋ'],['ck','k'],
  ['ph','f'],['kh','k'],['a','æ'],['e','ɛ'],['i','ɪ'],['o','ɑ'],['u','ʌ'],['j','ʤ'],['g','ɡ'],['c','k'],['q','k'],['x','ks'],['r','ɹ']];
 function respell(syllable){
  let out='',i=0;
  while(i<syllable.length){
   const hit=RESPELL.find(([from])=>syllable.startsWith(from,i));
   // A final y after a consonant is "ee" (as in "mee-ny"); elsewhere y is the consonant.
   if(!hit&&syllable[i]==='y'){out+=i===syllable.length-1&&i>0?'i':'j';i++;continue;}
   if(hit){out+=hit[1];i+=hit[0].length;}else{out+=syllable[i];i++;}
  }
  return out;
 }

 // --- tokens (standing in for spaCy) ------------------------------------------------------------
 const SUBTOKEN=/^['‘’]+|\p{Lu}(?=\p{Lu}\p{Ll})|(?:^-)?(?:\d?[,.]?\d)+|[-_]+|['‘’]{2,}|\p{L}*?(?:['‘’]\p{L})*?\p{Ll}(?=\p{Lu})|\p{L}+(?:['‘’]\p{L})*|[^-_\p{L}'‘’\d]|['‘’]+$/gu;
 const subtokenize=word=>word.match(SUBTOKEN)||[];
 const OPENERS=new Set('"“(«[{¿¡'),CLOSERS=new Set(';:,.!?—…"”)»]}'),TITLES=new Set(['Mr.','Mrs.','Ms.','Dr.']);
 const BRACKETS={'(':'(',')':')','[':'(',']':')','{':'(','}':')','«':'“','»':'”'};
 const MODALS=new Set(['to','will','would','can','could','should','must','might','may','shall',"don't","doesn't","didn't","won't","can't",
  "couldn't","wouldn't","shouldn't",'please',"let's",'lets','gonna','wanna']);
 const SUBJECTS=new Set(['i','we','you','they','he','she','it','who','people','users']);
 const DETERMINERS=new Set(['the','a','an','my','your','his','her','its','our','their','this','that','these','those','some','any','no',
  'every','each','another','one','new','old','big','small','first','last','next']);
 function normalize(text){
  return text.replace(/[‘’]/g,"'").normalize('NFKC')
   .replace(/\b(\d{1,2}):(\d{2})\b/g,(_,h,m)=>m==='00'?h+" o'clock":m[0]==='0'?h+' oh '+m[1]:h+' '+m)
   .replace(/\s+-{1,2}\s+/g,' — ').replace(/\s+/g,' ').trim();
 }
 // Straight quotes become curly ones, as spaCy's quote tags give misaki.
 function punctToken(ch,side){
  const ps=ch==='"'?(side==='open'?'“':'”'):BRACKETS[ch]??(PUNCTS.has(ch)?ch:'');
  return {text:ch,whitespace:'',phonemes:ps,isHead:true,punct:true};
 }
 // Splits text into words, word groups (parts written together: "9:30", "co-op", "$5") and punctuation.
 function tokenize(text,lex,custom={}){
  const out=[];
  for(const m of normalize(text).matchAll(/(\S+)(\s*)/g)){
   let chunk=m[1];const ws=m[2]?' ':'';const pieces=[];
   while(chunk&&OPENERS.has(chunk[0])){pieces.push(punctToken(chunk[0],'open'));chunk=chunk.slice(1);}
   const tail=[];
   const keepDot=/^(?:[A-Za-z]\.){2,}$/.test(chunk)||TITLES.has(chunk);
   while(chunk&&CLOSERS.has(chunk.at(-1))&&!(keepDot&&chunk.at(-1)==='.')){tail.unshift(punctToken(chunk.at(-1)));chunk=chunk.slice(0,-1);}
   let group=[];
   const flush=()=>{if(group.length)pieces.push(group.length===1?group[0]:group);group=[];};
   // The episode's own pronunciations win, also with 's ("Kokoro's").
   const own=custom[chunk.toLowerCase()]??(/'s$/i.test(chunk)&&custom[chunk.slice(0,-2).toLowerCase()]?lex.suffixS(custom[chunk.slice(0,-2).toLowerCase()]):null);
   if(chunk&&own!=null)group.push({text:chunk,whitespace:'',isHead:true,phonemes:own,custom:true});
   else if(chunk&&(lex.isKnown(chunk)||keepDot))group.push({text:chunk,whitespace:'',isHead:true});
   else for(const sub of subtokenize(chunk)){
    if(sub.length===1&&PUNCTS.has(sub)&&sub!=='.'){flush();pieces.push(punctToken(sub));continue;}
    const prev=group.at(-1);
    // A sign such as "#" is silent; the number after a sign or a currency starts its own word.
    const tk={text:sub,whitespace:'',isHead:!prev||Boolean(CURRENCIES[prev.text])||prev.phonemes===''};
    if(sub.length===1&&!/[\p{L}\d]/u.test(sub)&&!SUBTOKEN_JUNKS.has(sub)&&!SYMBOLS[sub]&&!CURRENCIES[sub])tk.phonemes='';
    group.push(tk);
   }
   flush();pieces.push(...tail);
   if(!pieces.length)continue;
   const last=pieces.at(-1);(Array.isArray(last)?last.at(-1):last).whitespace=ws;
   out.push(...pieces);
  }
  // Currency signs pass their unit to the number after them.
  for(const w of out)if(Array.isArray(w))for(let i=0;i<w.length-1;i++)if(CURRENCIES[w[i].text]&&/\d/.test(w[i+1].text)){w[i].phonemes='';w[i+1].currency=w[i].text;}
  // Rough part-of-speech tags from the word before: enough for "to read" vs "I read", "the record" vs "to record".
  const flat=out.flatMap(w=>Array.isArray(w)?[w[0]]:[w]);
  const word=i=>flat[i]&&!flat[i].punct?flat[i].text.toLowerCase():'';
  flat.forEach((tk,i)=>{
   if(tk.punct)return;
   const prev=word(i-1),next=word(i+1),t=tk.text;
   if(/\d/.test(t))tk.tag='CD';
   else if(/^(a|the)$/i.test(t))tk.tag=next?'DT':'NN';
   else if(/^that('s)?$/i.test(t))tk.tag=prev&&(SUBJECTS.has(next)||DETERMINERS.has(next))?'IN':'DT';
   else if(t==='I')tk.tag='PRP';
   else if(/^in$/i.test(t))tk.tag=next?'IN':'RP';
   else if(/^to$/i.test(t))tk.tag='TO';
   else if(/^used$/i.test(t))tk.tag=next==='to'?'VBD':'VBN';
   else if(MODALS.has(prev)||(SUBJECTS.has(prev)&&MODALS.has(word(i-2))))tk.tag='VB';
   else if(SUBJECTS.has(prev))tk.tag='VBP';
   else if(DETERMINERS.has(prev))tk.tag='NN';
  });
  return out;
 }

 function tokenContext(ctx,ps,tk){
  let vowel=ctx.futureVowel;
  if(ps)for(const c of ps)if(VOWELS.has(c)||CONSONANTS.has(c)||NON_QUOTE_PUNCTS.has(c)){vowel=NON_QUOTE_PUNCTS.has(c)?null:VOWELS.has(c);break;}
  return {futureVowel:vowel,futureTo:/^(to|To)$/.test(tk.text)||(tk.text==='TO'&&(tk.tag==='TO'||tk.tag==='IN'))};
 }
 function resolveGroup(tokens){
  const text=tokens.map((t,i)=>t.text+(i<tokens.length-1?t.whitespace:'')).join('');
  const classes=new Set([...text].filter(c=>!SUBTOKEN_JUNKS.has(c)).map(c=>/\p{L}/u.test(c)?0:/\d/.test(c)?1:2));
  const prespace=text.includes(' ')||text.includes('/')||classes.size>1;
  tokens.forEach((tk,i)=>{
   if(tk.phonemes==null){
    if(i===tokens.length-1&&NON_QUOTE_PUNCTS.has(tk.text))tk.phonemes=tk.text;
    else if([...tk.text].every(c=>SUBTOKEN_JUNKS.has(c)))tk.phonemes='';
   }else if(i>0)tk.prespace=prespace;
  });
  if(prespace)return;
  let idx=tokens.map((tk,i)=>tk.phonemes?[tk.phonemes.includes(PRIMARY)?1:0,stressWeight(tk.phonemes),i]:null).filter(Boolean);
  if(idx.length===2&&tokens[idx[0][2]].text.length===1){const i=idx[1][2];tokens[i].phonemes=applyStress(tokens[i].phonemes,-.5);return;}
  if(idx.length<2||idx.reduce((a,x)=>a+x[0],0)<=Math.floor((idx.length+1)/2))return;
  idx=idx.sort((a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2]).slice(0,Math.floor(idx.length/2));
  for(const [,,i] of idx)tokens[i].phonemes=applyStress(tokens[i].phonemes,-.5);
 }
 function mergeText(tokens){return tokens.map((t,i)=>t.text+(i<tokens.length-1?t.whitespace:'')).join('');}

 function createG2P(lexiconData){
  const lex=makeLexicon(lexiconData),guess=makeGuesser(lex);
  // How a word sounds, written by a person: "koh-KOR-oh" (syllables, the stressed one in capitals) or plain
  // words ("co core oh"), or Kokoro phonemes between slashes ("/kəkˈɔɹO/").
  function sayAs(text){
   const t=String(text).trim();
   if(/^\/.+\/$/.test(t))return t.slice(1,-1).trim();
   const parts=t.split(/[\s-]+/).filter(Boolean),caps=p=>p.length>1&&p===p.toUpperCase()&&/[A-Z]/.test(p);
   const marked=parts.some(caps);
   return parts.map((p,i)=>{
    const w=p.toLowerCase().replace(/[^a-z']/g,'');if(!w)return '';
    // A real word reads as the dictionary has it; a made-up syllable ("koh") is read as a respelling.
    const known=Object.prototype.hasOwnProperty.call(lex.golds,w)||Object.prototype.hasOwnProperty.call(lex.silvers,w);
    let ps=(known?lex.lookup(w,null,null,null)[0]:null)??guess.dialect(respell(w));
    // No capitals: the first syllable carries the stress.
    if(!marked)return applyStress(known?ps:applyStress(ps,2),i?-1:null);
    ps=ps.replaceAll(PRIMARY,'').replaceAll(SECONDARY,'');
    return caps(p)?applyStress(ps,2):applyStress(ps.replace(/ʌ/g,'ə'),-2);
   }).join('');
  }
  // [{word, sayAs}] -> {word (lower case): phonemes}
  function pronunciations(list){
   const out={};
   for(const {word,sayAs:as} of list??[]){const k=String(word||'').trim().toLowerCase();if(k&&as&&String(as).trim())out[k]=sayAs(as);}
   return out;
  }
  // Returns the phoneme string Kokoro reads, plus each word and where its sound came from. `custom` is the
  // result of pronunciations(): words the episode says its own way.
  function phonemize(text,custom={}){
   const words=tokenize(text,lex,custom),guessed=[];
   let ctx={futureVowel:null,futureTo:false};
   for(let wi=words.length-1;wi>=0;wi--){
    const w=words[wi];
    if(!Array.isArray(w)){
     if(w.phonemes==null){[w.phonemes]=lex.call(w,ctx);if(w.phonemes==null){w.phonemes=guess(w.text);guessed.push(w.text);}}
     ctx=tokenContext(ctx,w.phonemes,w);continue;
    }
    let left=0,right=w.length,fallback=false;
    while(left<right){
     const span=w.slice(left,right),blocked=span.some(t=>t.phonemes!=null);
     const tk=blocked?null:{...span[0],text:mergeText(span),whitespace:span.at(-1).whitespace,currency:span.find(t=>t.currency)?.currency};
     const ps=tk?lex.call(tk,ctx)[0]:null;
     if(ps!=null){w[left].phonemes=ps;for(const x of w.slice(left+1,right))x.phonemes='';ctx=tokenContext(ctx,ps,tk);right=left;left=0;}
     else if(left+1<right)left++;
     else{right--;const t=w[right];if(t.phonemes==null){if([...t.text].every(c=>SUBTOKEN_JUNKS.has(c)))t.phonemes='';else{fallback=true;break;}}left=0;}
    }
    if(fallback){const text=mergeText(w);w[0].phonemes=guess(text);guessed.push(text);for(const x of w.slice(1))x.phonemes='';ctx=tokenContext(ctx,w[0].phonemes,w[0]);}
    else resolveGroup(w);
   }
   const merged=words.map(w=>{
    if(!Array.isArray(w))return w;
    let ps='';for(const tk of w){if(tk.prespace&&ps&&!/\s$/.test(ps)&&tk.phonemes)ps+=' ';ps+=tk.phonemes??'';}
    return {text:mergeText(w),whitespace:w.at(-1).whitespace,phonemes:ps};
   });
   const phonemes=merged.map(t=>(t.phonemes??'').replaceAll('ɾ','T').replaceAll('ʔ','t')+t.whitespace).join('').replace(/\s+/g,' ').trim();
   return {phonemes,words:merged.filter(t=>!t.punct).map(t=>({text:t.text,phonemes:t.phonemes})),guessed:guessed.reverse()};
  }
  return {phonemize,pronunciations,sayAs,british:lex.british,version:VERSION};
 }

 // Kokoro reads at most 510 phonemes at once: longer text is cut at the last sentence, clause or comma break.
 function splitPhonemes(ps,max=510){
  const out=[];
  while(ps.length>max){
   let cut=-1;
   for(const marks of ['!.?…',':;',',—']){for(let i=max-1;i>0;i--)if(marks.includes(ps[i])){cut=i+1;break;}if(cut>0)break;}
   if(cut<0)cut=ps.lastIndexOf(' ',max)>0?ps.lastIndexOf(' ',max):max;
   out.push(ps.slice(0,cut).trim());ps=ps.slice(cut).trim();
  }
  if(ps)out.push(ps);
  return out;
 }
 // Kokoro's vocabulary: phoneme -> id, with "$" (0) as the pad at both ends.
 function encode(ps,vocab){
  const ids=[0];for(const c of ps)if(vocab[c]!==undefined)ids.push(vocab[c]);ids.push(0);
  return ids;
 }
 // Kokoro's British voices are named b*_ (bf_emma, bm_george); the rest read American English.
 const dialectOf=voice=>/^b[fm]_/.test(String(voice))?'gb':'us';
 // The episode pronunciations a line actually uses (whole words, any case, also with 's), in list order.
 function pronunciationsIn(text,list){
  const words=new Set((String(text).normalize('NFKC').replace(/[‘’]/g,"'").match(/[\p{L}\d'-]+/gu)||[]).map(w=>w.toLowerCase().replace(/'s$/,'')));
  return (list??[]).filter(p=>p&&words.has(String(p.word||'').trim().toLowerCase()));
 }
 return Object.freeze({version:VERSION,createG2P,splitPhonemes,encode,applyStress,cardinal,ordinal,year,letterToSound,dialectOf,pronunciationsIn});
});
