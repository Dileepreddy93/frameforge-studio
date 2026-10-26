const assert=require('node:assert/strict'),crypto=require('node:crypto');
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
 if(actor!=='dev'){await page.locator('#actor').selectOption(actor);await page.waitForFunction(a=>document.getElementById('status').textContent.includes(a.toUpperCase()+' · 11 true 3D'),actor,{timeout:20000});}
 const samples=await page.evaluate(()=>[...document.querySelectorAll('#turnaround img,#emotions img')].map(x=>x.src));
 // Four views and seven expressions, each a different frame (the robots' faces come from their M3.2 model sheet).
 assert.equal(samples.length,11);
 const unique=new Set(samples.map(x=>crypto.createHash('sha256').update(x).digest('hex')));
 assert.ok(unique.size>=11,'poses must differ across views and expressions');
 await page.waitForFunction(()=>!document.querySelector('#save').disabled&&document.querySelector('#status').textContent.includes('export ready'),null,{timeout:50000});
 const saved=page.waitForEvent('download',{timeout:30000});await page.locator('#save').click();
 const result=await saved;assert.match(result.suggestedFilename(),/turnaround-expression-unapproved.png$/);
 assert.deepEqual(errors,[]);
 console.log('ART_LAB_BROWSER_PASS '+JSON.stringify({actor,frames:samples.length,unique:unique.size,errors:0}));
 await browser.close();
})().catch(e=>{console.error('ART_LAB_BROWSER_FAIL '+e.stack);process.exit(1)});
