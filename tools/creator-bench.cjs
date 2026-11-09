#!/usr/bin/env node
// Measure what a Creator frame costs on this machine (plan phase 3). Renders the same frames of a project with one
// cost switched off at a time and prints p50/p95 per variant.
//   node tools/creator-bench.cjs <project.json | episode> [--size 1080x1920] [--frames 40]
const fs=require('fs'),path=require('path'),http=require('http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),args=process.argv.slice(2);
const opt=n=>{const i=args.indexOf(n);return i<0?null:args[i+1]};
const [W,H]=(opt('--size')||'1080x1920').split('x').map(Number),N=Number(opt('--frames')||40);
let p=JSON.parse(fs.readFileSync(args[0],'utf8'));p=p.format==='frameforge.creator/1'?p.project:p;
if(p.schema==='frameforge.project/1')p=require(path.join(root,'src/hybrid-editor-core.js')).fromEpisode(p);
const server=http.createServer((req,res)=>{const f=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));
 if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end()}
 res.writeHead(200,{'content-type':/\.m?js$/.test(f)?'text/javascript':/\.html$/.test(f)?'text/html':'application/octet-stream'});fs.createReadStream(f).pipe(res)});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage();
 await page.goto(`http://127.0.0.1:${server.address().port}/hybrid-preview.html`);
 await page.waitForFunction(()=>window.HybridP56Ready);
 const dur=await page.evaluate(([p,w,h])=>{const r=window.HybridP56QA.loadEditable(p);window.HybridP56QA.setOutputResolution(w,h);return r.duration},[p,W,H]);
 const times=[...Array(N)].map((_,i)=>+(dur*(i+.5)/N).toFixed(3));
 const stat=a=>{const s=[...a].sort((x,y)=>x-y);return {p50:+s[Math.floor(s.length*.5)].toFixed(1),p95:+s[Math.min(s.length-1,Math.floor(s.length*.95))].toFixed(1)}};
 const out={size:`${W}x${H}`,frames:N,variants:{}};
 for(const [name,v] of [['full',{}],['no shadows',{shadows:false}],['no sheen/clearcoat',{physical:false}],['neither',{shadows:false,physical:false}],['full again',{}]]){
  const ms=await page.evaluate(([v,times])=>{window.HybridP56QA.perfProbe(v);window.HybridP56QA.frameAt(times[0],false);
    return times.map(t=>{const a=performance.now();window.HybridP56QA.frameAt(t,false);
      window.HybridP56QA.getSurface().getContext('2d').getImageData(0,0,1,1);return performance.now()-a})},[v,times]);
  out.variants[name]=stat(ms);console.log(name.padEnd(20),JSON.stringify(out.variants[name]));
 }
 console.log(JSON.stringify(out));await browser.close();server.close();
})().catch(e=>{console.error('CREATOR_BENCH_FAILURE',e.message);process.exit(1)});
