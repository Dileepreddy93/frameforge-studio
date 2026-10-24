const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
(async()=>{
const filepath=path.resolve('assets/rigged-samples/AraAthleticMan.glb');
const actual=crypto.createHash('sha256').update(fs.readFileSync(filepath)).digest('hex');
assert.equal(actual,'3faf7629bd6f62f70e916d665b4051de35b0b27832e8da3b19b8a4dd93c4be22');
const dest=process.env.FRAMEFORGE_ARA_ART_DIR||'artifacts/p1-real-human-preview';fs.mkdirSync(dest,{recursive:true});
const browser=await chromium.launch({args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
try{
const page=await browser.newPage({viewport:{width:1240,height:900}});page.setDefaultTimeout(150000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const response=await page.goto((process.env.FRAMEFORGE_URL||'http://127.0.0.1:8959/')+'asset-lab.html',{waitUntil:'domcontentloaded',timeout:40000});
assert.equal(response.status(),200);
await page.waitForFunction(()=>Boolean(window.FrameForgeRigLabQA),null,{timeout:70000});
await page.locator('#human').click();
await page.waitForFunction(()=>window.FrameForgeRigLabQA.getStatus().startsWith('READY'),null,{timeout:150000});
const stats=await page.evaluate(()=>window.FrameForgeRigLabQA.getSummary());
assert.ok(stats.scene.skinnedMeshes>0,'No real skinned mesh');
assert.ok(stats.scene.bones>10,'No functioning humanoid skeleton');
assert.ok(stats.scene.animations>0,'Animation clips missing');
assert.ok(stats.scene.morphChannels>=5,'Actual facial blendshape channel support required');
const capture=async(name)=>{
 const uri=await page.evaluate(()=>window.FrameForgeRigLabQA.capture());
 assert.ok(uri.startsWith('data:image/png;base64,'));
 const bytes=Buffer.from(uri.split(',')[1],'base64');
 assert.ok(bytes.length>22000,'Rendered screenshot unexpectedly empty');
 const file=path.join(dest,name+'.png');fs.writeFileSync(file,bytes);
 return {file:path.basename(file),sha256:crypto.createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length};
};
const frames=[];
for(const angle of ['front','threequarter','side','back']) {
 await page.evaluate(v=>window.FrameForgeRigLabQA.setView(v),angle);
 frames.push(await capture('turn-'+angle));
}
await page.evaluate(()=>window.FrameForgeRigLabQA.setView('front'));
await page.locator('#framing').selectOption('portrait');
for(const expression of ['neutral','happy','worried','surprised']){
 await page.evaluate(e=>window.FrameForgeRigLabQA.setExpression(e),expression);
 frames.push(await capture('expression-'+expression));
}
await page.locator('#framing').selectOption('full');
await page.evaluate(()=>window.FrameForgeRigLabQA.setTime(1));
frames.push(await capture('action-at-1s'));
assert.ok(new Set(frames.map(f=>f.sha256)).size>=6,'Actual GLB camera/expression changes must be present');
const m={schema:'frameforge.ara-browser-frames/1',stats,frames,errors,artApproval:'NOT_APPROVED'};
fs.writeFileSync(path.join(dest,'manifest.json'),JSON.stringify(m,null,2)+'\n');
assert.deepEqual(errors,[]);
console.log('ARA_GLB_SKIN_MORPH_BROWSER_PASS '+JSON.stringify({bones:stats.scene.bones,morphs:stats.scene.morphChannels,animations:stats.scene.animations,frames:frames.length}));
}finally{await browser.close()}
})().catch(e=>{console.error('ARA_GLB_SKIN_MORPH_BROWSER_FAIL',e.stack||e);process.exitCode=1});
