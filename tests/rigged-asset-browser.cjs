const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 try {
  const page=await browser.newPage({viewport:{width:1250,height:900},acceptDownloads:true});
  page.setDefaultTimeout(80000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const r=await page.goto((process.env.FRAMEFORGE_URL||'http://127.0.0.1:8959/')+'asset-lab.html',{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(r.status(),200);
  await page.waitForFunction(()=>window.FrameForgeRigLabQA?.version==='p1-rigged-glb-poc1',null,{timeout:70000});
  await page.locator('#sample').click();
  await page.waitForFunction(()=>window.FrameForgeRigLabQA?.getSummary()?.scene?.meshes>=1 && window.FrameForgeRigLabQA.getStatus().includes('READY'),null,{timeout:80000});
  const s=await page.evaluate(()=>window.FrameForgeRigLabQA.getSummary());
  assert.ok(s.header.skinDefinitions>0,'GLB must contain real skin');
  assert.ok(s.scene.skinnedMeshes>0,'Three.js SkinnedMesh required');
  assert.ok(s.scene.bones>0,'Skeleton bones required');
  assert.ok(s.scene.animations>0,'Animation required');
  assert.ok(s.scene.triangles>300,'Nontrivial mesh required');
  assert.equal(await page.locator('#expression').isDisabled(),s.scene.morphChannels===0);
  const dir=process.env.FRAMEFORGE_RIG_OUT||path.join('artifacts','p1-rigged-asset-lab');
  fs.mkdirSync(dir,{recursive:true});
  const capture=async name=>{
   const encoded=await page.evaluate(()=>window.FrameForgeRigLabQA.capture());
   assert.ok(encoded.startsWith('data:image/png;base64,'));
   const bytes=Buffer.from(encoded.split(',')[1],'base64');
   assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
   assert.ok(bytes.length>15000,'actual WebGL image must not be empty');
   const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
   assert.ok(width>=300&&height>=330);
   fs.writeFileSync(path.join(dir,name+'.png'),bytes);
   return {file:name+'.png',sha256:crypto.createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,width,height};
  };
  const frames=[];
  for(const v of ['front','threequarter','side','back']){
   await page.evaluate(view=>window.FrameForgeRigLabQA.setView(view),v);
   frames.push(await capture('sample-'+v));
  }
  await page.locator('#framing').selectOption('portrait');
  frames.push(await capture('sample-portrait'));
  await page.locator('#framing').selectOption('full');
  await page.evaluate(()=>window.FrameForgeRigLabQA.setTime(.38));
  frames.push(await capture('sample-rig-frame-038'));
  await page.evaluate(()=>window.FrameForgeRigLabQA.setTime(1.24));
  frames.push(await capture('sample-rig-frame-124'));
  assert.ok(new Set(frames.map(f=>f.sha256)).size>=5,'4 angles must produce distinct real renders');
  const log={schema:'frameforge.rig-import-proof/1',source:'Khronos CesiumMan, CC BY 4.0, technical test only',sourceGitBlob:'8586c4e6a59bf8ef585c2a685c50a80d28503216',summary:s,frames,artApproval:'NOT_APPROVED',externalUpload:false,errors};
  fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(log,null,2)+'\n');
  assert.deepEqual(errors,[]);
  console.log('RIGGED_GLB_BROWSER_PASS '+JSON.stringify({skins:s.scene.skinnedMeshes,bones:s.scene.bones,clips:s.scene.animations,morphs:s.scene.morphChannels,frames:frames.length,errors:0}));
 }finally{await browser.close()}
})().catch(e=>{console.error('RIGGED_GLB_BROWSER_FAIL',e.stack||e);process.exitCode=1});
