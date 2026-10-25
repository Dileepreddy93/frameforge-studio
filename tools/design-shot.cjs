// Screenshot a design page (e.g. design/dev-directions.html) to PNG once it sets window.FF_READY.
// usage: node tools/design-shot.cjs <page.html> <out.png> [width=2400]
const path=require('path');
const{chromium}=require('playwright');
(async()=>{
 const[page,out,width='2400']=process.argv.slice(2);
 if(!page||!out){console.error('usage: node tools/design-shot.cjs <page.html> <out.png> [width]');process.exit(2);}
 const browser=await chromium.launch({headless:true});
 const tab=await browser.newPage({viewport:{width:+width,height:1200},deviceScaleFactor:1});
 const errors=[];tab.on('pageerror',e=>errors.push(e.message));tab.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await tab.goto('file://'+path.resolve(page));
 await tab.waitForFunction(()=>window.FF_READY===true,null,{timeout:60000});
 await tab.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
 await tab.waitForTimeout(300);
 await tab.screenshot({path:out,fullPage:true});
 await browser.close();
 if(errors.length){console.error('page errors:\n'+errors.join('\n'));process.exit(1);}
 console.log('wrote',out);
})().catch(e=>{console.error(e);process.exit(1);});
