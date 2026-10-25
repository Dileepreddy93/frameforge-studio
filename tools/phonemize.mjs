// Text -> Kokoro phonemes with the studio's own pronouncer (src/kokoro-g2p.js), for tools/voice_lines.py, so our
// offline renders say every word the way the browser voices do: the same dictionaries, British English for the
// b*_ voices, and the episode's own pronunciations.
//   echo '{"text":"...","voice":"bm_george","pronunciations":[{"word":"Kokoro","sayAs":"koh-KOR-oh"}]}' | node tools/phonemize.mjs
// One JSON request per input line, one JSON answer ({phonemes, guessed}) per output line.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import G2P from '../src/kokoro-g2p.js';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),pronouncers={};
const pronouncer=voice=>{
 const dialect=G2P.dialectOf(voice);
 return pronouncers[dialect]??=G2P.createG2P(JSON.parse(fs.readFileSync(path.join(root,'assets/voice/en-'+dialect+'-lexicon.json'),'utf8')));
};
const out=[];
for(const line of fs.readFileSync(0,'utf8').split('\n')){
 if(!line.trim())continue;
 const {text,voice='am_michael',pronunciations=[]}=JSON.parse(line),g2p=pronouncer(voice);
 const {phonemes,guessed}=g2p.phonemize(text,g2p.pronunciations(G2P.pronunciationsIn(text,pronunciations)));
 out.push(JSON.stringify({phonemes,guessed}));
}
process.stdout.write(out.join('\n')+'\n');
