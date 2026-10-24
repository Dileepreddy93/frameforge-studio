const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const actor=process.argv[2]||'dev';
assert.ok(['dev','blue','orange'].includes(actor));
(async()=>{
 const browser=await chromium.launch({args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1030,height:850},acceptDownloads:true});page.setDefaultTimeout(85000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const r=await page.goto((process.env.FRAMEFORGE_URL||'http://127.0.0.1:8959/')+'character-lab.html',{waitUntil:'domcontentloaded',timeout:30000});
 assert.equal(r.status(),200);
 await page.waitForFunction(()=>document.querySelectorAll('#turnaround img').length===4 && document.querySelector('#environment').src.startsWith('data:image/png') && document.querySelector('#save').disabled===false && document.querySelector('#status').textContent.includes('export ready'),null,{timeout:95000});
 if(actor!=='dev'){await page.locator('#actor').selectOption(actor);await page.waitForFunction(a=>document.getElementById('status').textContent.includes(a.toUpperCase()+' · 8 true 3D'),actor,{timeout:20000});}
 const samples=await page.evaluate(()=>[...document.querySelectorAll('#turnaround img,#emotions img')].map(x=>x.src));
 assert.equal(samples.length,8);
 // Real PNG frames are saved to CI evidence, not accepted from URL differences alone.
 const artifactFolder=process.env.FRAMEFORGE_ART_OUT;
 if(artifactFolder){
  const folder=path.join(artifactFolder,actor);
  fs.mkdirSync(folder,{recursive:true});
  const labels=['front','three-quarter','side','back','neutral','happy','worried','surprised'];
  for(let i=0;i<samples.length;i++){
   assert.match(samples[i],/^data:image\/png;base64,/);
   const payload=Buffer.from(samples[i].split(',')[1],'base64');
   assert.ok(payload.byteLength>5000,'Invalid or extremely small actual render '+i);
   assert.equal(payload.subarray(0,8).toString('hex'),'89504e470d0a1a0a','PNG magic');
   fs.writeFileSync(path.join(folder,String(i).padStart(2,'0')+'-'+labels[i]+'.png'),payload);
  }
  console.log('ART_EVIDENCE_SAVED '+JSON.stringify({actor,frames:8,folder}));
 }

 const unique=new Set(samples.map(x=>crypto.createHash('sha256').update(x).digest('hex')));
 assert.ok(unique.size>=7,'poses must differ across views and expressions');
 await page.waitForFunction(()=>!document.querySelector('#save').disabled&&document.querySelector('#status').textContent.includes('export ready'),null,{timeout:50000});
 const saved=page.waitForEvent('download',{timeout:30000});await page.locator('#save').click();
 const result=await saved;assert.match(result.suggestedFilename(),/turnaround-expression-unapproved.png$/);
 assert.deepEqual(errors,[]);
 console.log('ART_LAB_BROWSER_PASS '+JSON.stringify({actor,frames:8,unique:unique.size,errors:0}));
 await browser.close();
})().catch(e=>{console.error('ART_LAB_BROWSER_FAIL '+e.stack);process.exit(1)});
