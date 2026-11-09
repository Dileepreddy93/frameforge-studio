// P3 diagnostics: real model bone conventions, limited to existing repository test assets.
import fs from 'node:fs';
import {readGlb,mapHumanoid,validateCharacter} from '../src/ember-import-validator.mjs';
for (const filename of ['CesiumMan.glb','AraAthleticMan.glb']){
 const bytes=new Uint8Array(fs.readFileSync('assets/rigged-samples/'+filename));
 const doc=readGlb(bytes);
 const mapped=mapHumanoid(doc);
 const validation=validateCharacter(bytes,filename);
 console.log('P34_MODEL_DIAGNOSTIC',JSON.stringify({filename,bytes:bytes.length,
   skins:doc.skins?.length||0,skinJointCount:doc.skins?.map(s=>s.joints?.length||0),
   jointNames:(doc.skins||[]).flatMap(s=>s.joints||[]).map(i=>doc.nodes?.[i]?.name||'(unnamed)').slice(0,90),
   maps:Object.keys(mapped),report:{ok:validation.ok,errors:validation.errors,warnings:validation.warnings.slice(0,4)}}));
}
