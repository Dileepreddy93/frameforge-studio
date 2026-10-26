// The studio's episode catalog: every listed episode exists, validates and opens in the current renderer.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const core=createRequire(import.meta.url)('../src/project-core.js');
const html=fs.readFileSync('studio.html','utf8');
assert.ok(html.includes("'./projects/index.json'"),'the studio reads its episode list from projects/index.json');
const index=JSON.parse(fs.readFileSync('projects/index.json','utf8'));
assert.ok(Array.isArray(index.episodes)&&index.episodes.length>=2);
assert.equal(new Set(index.episodes.map(e=>e.key)).size,index.episodes.length,'episode keys are unique');
for(const {key,file,label} of index.episodes){
 assert.ok(/^[a-z][a-z0-9-]*$/.test(key)&&label,'key and label for '+file);
 const project=JSON.parse(fs.readFileSync('projects/'+file,'utf8'));
 core.assertRendererCompatible(project);
 if(project.audio.state==='mastered')for(const url of [project.audio.masterUrl,project.audio.voiceUrl])assert.ok(fs.existsSync(url),key+' audio file '+url+' is in the repo');
}
console.log('PROJECT_CATALOG_PASS: '+index.episodes.length+' episodes listed, all valid and renderable');
