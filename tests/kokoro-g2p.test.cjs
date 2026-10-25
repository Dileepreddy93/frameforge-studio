// The in-browser voices read text with our port of misaki's dictionary G2P (no eSpeak, no GPL).
// The expected phonemes are misaki 0.9.4's own output for each line (flaps written as Kokoro reads them).
const assert=require('node:assert/strict');
const G2P=require('../src/kokoro-g2p.js');
const g2p=G2P.createG2P(require('../assets/voice/en-us-lexicon.json'));
const say=text=>g2p.phonemize(text).phonemes;

const MISAKI=[
 ["Users keep asking for dark mode.","jˈuzəɹz kˈip ˈæskɪŋ fɔɹ dˈɑɹk mˈOd."],
 ["Hello world, this is a test.","həlˈO wˈɜɹld, ðɪs ɪz ɐ tˈɛst."],
 ["We shipped 3 fixes in 2024, and saved $1,250.50 on servers.","wˌi ʃˈɪpt θɹˈi fˈɪksᵻz ɪn twˈɛnti twˈɛnti fˈɔɹ, ænd sˈAvd wˈʌn θˈWzᵊnd tˈu hˈʌndɹəd fˈɪfti dˈɑləɹz ænd fˈɪfti sˈɛnts ˌɔn sˈɜɹvəɹz."],
 ["Is it 50% faster? Yes... about 1.5 times.","ˌɪz ɪt fˈɪfti pəɹsˈɛnt fˈæstəɹ? jˈɛs... əbˈWt wˈʌn pYnt fˈIv tˈImz."],
 ["The 21st release beat the 3rd one.","ðə twˈɛnti fˈɜɹst ɹəlˈis bˈit ðə θˈɜɹd wˈʌn."],
 ["Wait—what did you just delete?","wˈAt—wˌʌt dˈɪd ju ʤˈʌst dəlˈit?"],
 ["GitHub and JSON and SQL, oh my!","ɡˌɪthˈʌb ænd ʤˌAˌɛsˌOˈɛn ænd sˈikwəl, ˈO mˈI!"],
 ["She can't, he won't, they'd love to.","ʃˌi kˈænt, hi wˈOnt, ðAd lˈʌv tu."],
 ["FrameForge renders a reel in minutes.","fɹˌAmfˈɔɹʤ ɹˈɛndəɹz ɐ ɹˈil ɪn mˈɪnəts."],
 ["The users' sessions expired at 5pm.","ðə jˈuzəɹz sˈɛʃənz ɪkspˈIəɹd æt fˈIv pˌiˈɛm."],
 ["Re-index the database, then re-run the tests.","ɹˌiˈɪndˌɛks ðə dˈæTəbˌAs, ðˈɛn ɹˌiɹˈʌn ðə tˈɛsts."],
 ["Ninety-nine problems, but the cache isn't one.","nˈIndinˌIn pɹˈɑbləmz, bˌʌt ðə kˈæʃ ˈɪzᵊnt wˈʌn."],
 ["Read it, then I read it.","ɹˈid ɪt, ðˈɛn ˌI ɹˈɛd ɪt."],
 ["I want to live, we live here.","ˌI wˈɑnt tə lˈɪv, wi lˈɪv hˈɪɹ."],
 ["an apple and an hour","ɐn ˈæpᵊl ænd ɐn ˈWəɹ"],
 ["U.S.A.","jˌuˌɛsˈA"],
 ["Mr. Smith","mˈɪstəɹ smˈɪθ"],
 ["#1","wˈʌn"],
 ["007","sˈɛvən"],
 ["That's the third time this week.","ðˈæts ðə θˈɜɹd tˈIm ðɪs wˈik."],
 ["Who wrote this code? Oh. I did.","hˌu ɹˈOt ðɪs kˈOd? ˈO. ˌI dˈɪd."],
 ["Let's refactor everything... tomorrow.","lˈɛts ɹifˈæktəɹ ˈɛvəɹiθˌɪŋ... təmˈɑɹO."],
 ["He's the 1st to arrive and the last to leave.","hˌiz ðə fˈɜɹst tʊ əɹˈIv ænd ðə lˈæst tə lˈiv."],
 ["DEV, can you read the logs I read yesterday?","dˌiˌivˈi, kæn ju ɹˈid ðə lˈɔɡz ˌI ɹˈɛd jˈɛstəɹdˌA?"],
 ["She said, \"Never deploy on Friday.\"","ʃˌi sˈɛd, “nˈɛvəɹ dəplˈY ˌɔn fɹˈIdˌA.”"]
];
for(const [text,expected] of MISAKI)assert.equal(say(text),expected,text);

// Where we differ from misaki on purpose: a context rule picks the verb, a final period still ends the sentence,
// and an unknown word is guessed instead of dropped.
assert.equal(say('Use the record button to record.'),'jˈuz ðə ɹˈɛkəɹd bˈʌtn tə ɹəkˈɔɹd.');
assert.equal(say('Our p95 dropped from 12.0 s to 0.8 s.'),'ˌWəɹ pˈi nˈIndi fˈIv dɹˈɑpt fɹʌm twˈɛlv ˈɛs tə zˈɪɹO pYnt ˈAt ˈɛs.');
const npm=g2p.phonemize('Run npm install.');
assert.deepEqual(npm.guessed,['npm']);assert.equal(npm.phonemes,'ɹˈʌn ˌɛnpˌiˈɛm ɪnstˈɔl.');
assert.equal(say('The build failed at 3:15.'),say('The build failed at 3 15.'),'times read as numbers');
assert.equal(say('Meet Kokoro.'),'mˈit kˈOkOɹO.','unknown names get a letter-to-sound guess');

// Numbers (the num2words parts misaki uses).
assert.equal(G2P.cardinal(1250),'one thousand, two hundred and fifty');
assert.equal(G2P.ordinal(21),'twenty-first');assert.equal(G2P.ordinal(12),'twelfth');
assert.deepEqual([2024,2000,2005,1905,1100].map(G2P.year),['twenty twenty-four','two thousand','two thousand and five','nineteen oh-five','eleven hundred']);

// Kokoro reads at most 510 phonemes at a time: long text is cut at sentence breaks.
const long=say('This is a long sentence about voices. '.repeat(30));
const parts=G2P.splitPhonemes(long);
assert.ok(parts.length>1&&parts.every(p=>p.length<=510&&/[.!?]$/.test(p)),'cut at full stops');
assert.equal(parts.join(' '),long);

// Phonemes to model ids: "$" pads both ends and unknown symbols are dropped.
assert.deepEqual(G2P.encode('ab?x',{a:43,b:44,'?':6}),[0,43,44,6,0]);
// British English (the b*_ voices): misaki 0.9.4 with british=True gives exactly these.
const MISAKI_GB=[
 ["Users keep asking for dark mode.","jˈuːzəz kˈiːp ˈaskɪŋ fɔː dˈɑːk mˈQd."],
 ["Hello world, this is a test.","həlˈQ wˈɜːld, ðɪs ɪz ɐ tˈɛst."],
 ["We shipped 3 fixes in 2024, and saved $1,250.50 on servers.","wˌiː ʃˈɪpt θɹˈiː fˈɪksɪz ɪn twˈɛnti twˈɛnti fˈɔː, and sˈAvd wˈʌn θˈWzᵊnd tˈuː hˈʌndɹəd fˈɪfti dˈɒləz and fˈɪfti sˈɛnts ˌɒn sˈɜːvəz."],
 ["Is it 50% faster? Yes... about 1.5 times.","ˌɪz ɪt fˈɪfti pəsˈɛnt fˈɑːstə? jˈɛs... əbˈWt wˈʌn pYnt fˈIv tˈImz."],
 ["She can't, he won't, they'd love to.","ʃˌiː kˈɑːnt, hiː wˈQnt, ðAd lˈʌv tuː."],
 ["Ninety-nine problems, but the cache isn't one.","nˌIntɪnˈIn pɹˈɒbləmz, bˌʌt ðə kˈaʃ ˈɪzᵊnt wˈʌn."],
 ["Read it, then I read it.","ɹˈiːd ɪt, ðˈɛn ˌI ɹˈɛd ɪt."],
 ["Who wrote this code? Oh. I did.","hˌuː ɹˈQt ðɪs kˈQd? ˈQ. ˌI dˈɪd."],
 ["Let's refactor everything... tomorrow.","lˈɛts ɹiːfˈaktə ˈɛvɹɪθɪŋ... tʊmˈɒɹQ."],
 ["The tomato schedule was bothering everyone.","ðə təmˈɑːtQ ʃˈɛdjuːl wɒz bˈɒðəɹɪŋ ˈɛvɹɪwʌn."],
 ["Where are the cars? Our servers are faster, aren't they?","wˌɛː ɑː ðə kˈɑːz? ˌWə sˈɜːvəz ɑː fˈɑːstə, ˌɑːnt ðA?"],
 ["I can't find the water bottle in the garage.","ˌI kˈɑːnt fˈInd ðə wˈɔːtə bˈɒtᵊl ɪn ðə ɡˈaɹɑːʤ."],
 ["ORANGE thinks the theatre was fantastic, but the colour was off.","ˈɒɹɪnʤ θˈɪŋks ðə θˈɪətə wɒz fantˈastɪk, bˌʌt ðə kˈʌlə wɒz ˈɒf."],
 ["Can you fix it before half past four?","kˌan juː fˈɪks ɪt bɪfˈɔː hˈɑːf pˈɑːst fˈɔː?"],
 ["The router was rebooted, and the data looked better.","ðə ɹˈuːtə wɒz ɹˌiːbˈuːtɪd, and ðə dˈAtə lˈʊkt bˈɛtə."]
];
const gb=G2P.createG2P(require('../assets/voice/en-gb-lexicon.json'));
for(const [text,expected] of MISAKI_GB)assert.equal(gb.phonemize(text).phonemes,expected,'GB: '+text);
assert.equal(G2P.dialectOf('bm_george'),'gb');assert.equal(G2P.dialectOf('bf_emma'),'gb');assert.equal(G2P.dialectOf('am_michael'),'us');
// Guessed words follow the dialect: British guesses drop the r after a vowel.
assert.equal(gb.phonemize('Frameforgery').phonemes,'fɹˈAmfˌɔːʤəɹi');
assert.ok(!/ɹ$/.test(gb.phonemize('Zorbinater').phonemes),'non-rhotic guess');

// The episode's own pronunciations: respellings with a capitalised stressed syllable, plain words, or /phonemes/.
assert.equal(g2p.sayAs('koh-KOR-oh'),'kOkˈɔɹO');
assert.equal(gb.sayAs('koh-KOR-oh'),'kQkˈɔːQ');
assert.equal(g2p.sayAs('co core oh'),'kˈOkˌɔɹˌO');
assert.equal(g2p.sayAs('/kəkˈɔɹO/'),'kəkˈɔɹO');
assert.equal(g2p.sayAs('TEL-uh-goo'),'tˈɛləɡu');
const list=[{word:'Kokoro',sayAs:'koh-KOR-oh'},{word:'Telugu',sayAs:'TEL-uh-goo'}];
assert.deepEqual(G2P.pronunciationsIn("Kokoro's voice is ready.",list),[list[0]],'only the words a line uses, also with \'s');
assert.deepEqual(G2P.pronunciationsIn('Nothing here.',list),[]);
const own=g2p.pronunciations(list);
assert.equal(g2p.phonemize("Kokoro's voice speaks Telugu.",own).phonemes,'kOkˈɔɹOz vˈYs spˈiks tˈɛləɡu.');
assert.deepEqual(g2p.phonemize("Kokoro's voice speaks Telugu.",own).guessed,[],'listed words are not guessed');
assert.deepEqual(g2p.phonemize('Kokoro speaks.').guessed,['Kokoro'],'without the list, Kokoro is guessed');
console.log('KOKORO_G2P_PASS',MISAKI.length,'misaki lines,',MISAKI_GB.length,'British lines');
