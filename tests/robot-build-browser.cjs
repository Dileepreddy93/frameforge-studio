// BLUE and ORANGE in 3D (M3.3): the studio's robots are their model sheet (design/robot-character.js), built at DEV's
// scale. Each robot draws a different face for every emotion, opens its mouth with speech, blinks and looks around;
// emotions tilt its head; both arms hang on shoulder pivots; in the film, a robot's close-up centres its head, and the
// robots act (M3.4): body and arms move through their shots, the same time always gives the same pose.
// Needs FRAMEFORGE_URL (a server for the repo).
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1100,height:900}});page.setDefaultTimeout(90000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto((process.env.FRAMEFORGE_URL||'http://127.0.0.1:8959/')+'studio.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.FrameForgeProjectsLoaded&&window.FrameForgeQA?.shots().length>0&&window.FrameForgeRobotQA);
 await page.evaluate(()=>FrameForgeQA.setOffline(true));
 const sheet=await page.evaluate(()=>FrameForgeRobotQA.sheet());
 assert.match(sheet.status,/^approved/);
 assert.ok(sheet.headY.orange>sheet.headY.blue,'ORANGE\'s head sits higher');
 const report={};
 for(const who of ['blue','orange']){
  const r=await page.evaluate(w=>{
   const Q=FrameForgeRobotQA,E=['neutral','happy','worried','surprised','angry','sad','thinking'];
   const faces=E.map(e=>Q.draw(w,e)),heads=E.map(e=>{Q.draw(w,e);return Q.state(w).head.map(v=>+v.toFixed(3)).join(',')});
   const speech=['closed','round','wide','teeth','open'].map(v=>Q.draw(w,'neutral',{viseme:v,open:.8}));
   return{faces,heads,speech,rest:Q.draw(w,'neutral'),quiet:Q.draw(w,'neutral',{viseme:'open',open:.25}),loud:Q.draw(w,'neutral',{viseme:'open',open:.9}),
    blink:Q.draw(w,'neutral',{blink:true}),look:Q.draw(w,'neutral',{look:-1}),state:Q.state(w)};
  },who);
  assert.equal(new Set(r.faces).size,7,who+': seven different faces');
  assert.ok(new Set(r.heads).size>=5,who+': emotions tilt the head');
  assert.ok(new Set(r.speech).size>=4&&!r.speech.includes(r.rest),who+': each sound shapes the mouth');
  assert.notEqual(r.quiet,r.loud,who+': louder opens wider');
  assert.notEqual(r.blink,r.rest,who+': blinks');assert.notEqual(r.look,r.rest,who+': looks aside');
  assert.equal(r.state.arms,2,who+': two arms on shoulder pivots');
  assert.ok(r.state.faceVertices>300,who+': the face is drawn');
  report[who]={faceVertices:r.state.faceVertices};
 }
 // In the film: each robot close-up centres that robot's head (within the middle third of the frame).
 const shots=await page.evaluate(()=>{let t=0;return FrameForgeQA.shots().map(s=>{const o={camera:s.camera,mid:t+s.duration*.5};t+=s.duration;return o;}).filter(s=>s.camera==='blue'||s.camera==='orange');});
 assert.ok(shots.length>=3);
 for(const s of shots){
  const st=await page.evaluate(([t,who])=>{FrameForgeQA.setTime(t);return FrameForgeRobotQA.state(who);},[s.mid,s.camera]);
  assert.ok(Math.abs(st.screen[0])<.34&&Math.abs(st.screen[1])<.45&&st.screen[2]<1,s.camera+' close-up at '+s.mid.toFixed(2)+'s centres the head: '+st.screen.map(v=>v.toFixed(2)));
 }
 // Acting: through ORANGE's "Backup created" shot and BLUE's "I can make it instant", body and arms move; seeking back
 // to a time gives exactly the pose it gave before.
 const acting=await page.evaluate(()=>{
  const out={};let t0=0;
  for(const s of FrameForgeQA.shots()){
   if((s.speaker==='blue'||s.speaker==='orange')&&!out[s.speaker]){
    const poses=[];for(let k=0;k<=12;k++){FrameForgeQA.setTime(t0+s.duration*k/12);poses.push(FrameForgeRobotQA.state(s.speaker));}
    FrameForgeQA.setTime(t0+s.duration*.5);const again=FrameForgeRobotQA.state(s.speaker);
    const range=f=>Math.max(...poses.map(f))-Math.min(...poses.map(f));
    out[s.speaker]={body:range(p=>p.body[0])+range(p=>p.body[3]),arms:range(p=>p.armPose[0][0])+range(p=>p.armPose[0][2]),
     head:range(p=>p.head[0])+range(p=>p.head[1]),same:JSON.stringify(again)===JSON.stringify(poses[6])};
   }
   t0+=s.duration;
  }
  return out;
 });
 for(const who of ['blue','orange']){
  assert.ok(acting[who].body>.01&&acting[who].arms>.05&&acting[who].head>.02,who+' acts through its line: '+JSON.stringify(acting[who]));
  assert.ok(acting[who].same,who+': seeking gives the same pose');
 }
 assert.deepEqual(errors,[]);
 console.log('ROBOT_BUILD_BROWSER_PASS',JSON.stringify({...report,closeUps:shots.length,acting}));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
