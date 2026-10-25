// Build the pronunciation dictionary the in-browser voices use (assets/voice/en-us-lexicon.json).
//   node tools/build-voice-lexicon.mjs
// Source: misaki's US English gold and silver dictionaries (hexgrad/misaki, Apache-2.0), pinned to one
// commit so every build gives the same file. Silver entries that only repeat gold are dropped.
import fs from 'node:fs';

const REPO='hexgrad/misaki',COMMIT='fba1236595f2d2bf21d414ba6e57d25256afada3';
const OUT='assets/voice/en-us-lexicon.json';
const get=async name=>{
 const url=`https://raw.githubusercontent.com/${REPO}/${COMMIT}/misaki/data/${name}`;
 const response=await fetch(url);
 if(!response.ok)throw new Error(url+' HTTP '+response.status);
 return response.json();
};
const gold=await get('us_gold.json'),silver=await get('us_silver.json');
for(const k of Object.keys(silver))if(gold[k]===silver[k])delete silver[k];
const lexicon={source:{repo:REPO,commit:COMMIT,files:['misaki/data/us_gold.json','misaki/data/us_silver.json'],license:'Apache-2.0'},gold,silver};
fs.mkdirSync('assets/voice',{recursive:true});
fs.writeFileSync(OUT,JSON.stringify(lexicon));
console.log(`${OUT}: ${Object.keys(gold).length} gold + ${Object.keys(silver).length} silver words, ${(fs.statSync(OUT).size/1e6).toFixed(2)} MB`);
