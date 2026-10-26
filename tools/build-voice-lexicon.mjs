// Build the pronunciation dictionaries the voices use: assets/voice/en-us-lexicon.json (American voices) and
// en-gb-lexicon.json (British voices, b*_).
//   node tools/build-voice-lexicon.mjs
// Source: misaki's US and GB English gold and silver dictionaries (hexgrad/misaki, Apache-2.0), pinned to one
// commit so every build gives the same file. Silver entries that only repeat gold are dropped.
import fs from 'node:fs';

const REPO='hexgrad/misaki',COMMIT='fba1236595f2d2bf21d414ba6e57d25256afada3';
const get=async name=>{
 const url=`https://raw.githubusercontent.com/${REPO}/${COMMIT}/misaki/data/${name}`;
 const response=await fetch(url);
 if(!response.ok)throw new Error(url+' HTTP '+response.status);
 return response.json();
};
fs.mkdirSync('assets/voice',{recursive:true});
for(const dialect of ['us','gb']){
 const out=`assets/voice/en-${dialect}-lexicon.json`,gold=await get(dialect+'_gold.json'),silver=await get(dialect+'_silver.json');
 for(const k of Object.keys(silver))if(gold[k]===silver[k])delete silver[k];
 const files=[`misaki/data/${dialect}_gold.json`,`misaki/data/${dialect}_silver.json`];
 const lexicon={source:{repo:REPO,commit:COMMIT,files,license:'Apache-2.0'},...(dialect==='gb'?{british:true}:{}),gold,silver};
 fs.writeFileSync(out,JSON.stringify(lexicon));
 console.log(`${out}: ${Object.keys(gold).length} gold + ${Object.keys(silver).length} silver words, ${(fs.statSync(out).size/1e6).toFixed(2)} MB`);
}
