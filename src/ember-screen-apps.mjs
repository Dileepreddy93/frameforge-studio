// Ember source screen-apps.js @ 22c745ffdc2d6411707f3a9bbe5bd70b10f9d9db, MIT.
// Only called by FrameForge hybrid screen adapter; one authoritative FrameForge timeline.
// Script-authored applications on the set monitor, performed over time (no external assets).
// Rows are plain text, or interactions a person performs while the line plays:
//   > text      typed in (a chat message, a terminal command, a form field)
//   [x] label   a checkbox or tile the cursor ticks ([ ] label: one left alone)
//   (Label)     a button the cursor clicks
//   !! text     an error popup        ** text   a success overlay        ~ text   a spinner while something loads
// Kinds: terminal, chat, code, inbox, browser (a web form or dialog), grid (a picker of tiles, like a captcha).
const W=1600,H=900,PI=Math.PI,COL={x:350,w:900};
const ACCENT={alert:'#e5534b',success:'#3fb950',calm:'#2f9e8f',info:'#2f6fd6'};
const CURSOR_KINDS=new Set(['browser','grid','inbox']);
const ease=k=>k<=0?0:k>=1?1:k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function parseRow(r){
  let m;
  if(r.startsWith('> '))return {type:'type',text:r.slice(2)};
  if((m=r.match(/^\[(x| )\]\s*(.*)$/i)))return {type:'check',on:m[1].toLowerCase()==='x',text:m[2]};
  if((m=r.match(/^\((.+)\)$/)))return {type:'button',text:m[1]};
  if(r.startsWith('!! '))return {type:'error',text:r.slice(3)};
  if(r.startsWith('** '))return {type:'success',text:r.slice(3)};
  if(r.startsWith('~ '))return {type:'wait',text:r.slice(2)};
  return {type:'text',text:r};
}
// Forms show their whole layout at once and then get used; feeds (chat, terminal, inbox, code) grow row by row.
const isForm=kind=>kind==='browser'||kind==='grid';
const natural=(row,kind)=>row.type==='type'?.25+row.text.length*.055:row.type==='check'?(row.on?.75:0):row.type==='button'?.85:
  row.type==='error'||row.type==='success'?1.1:row.type==='wait'?1.3:isForm(kind)?0:kind==='chat'?.9:.45;

// When each row happens within the screen's time on the monitor (`span` seconds): natural durations, with even
// breathing room between actions when there is time, compressed when there is not. Pure, so sound and picture agree.
export function screenPlan(s,span=6){
  const kind=s.kind,rows=(s.lines||[]).map(parseRow),durs=rows.map(r=>natural(r,kind)),acts=durs.filter(d=>d>0).length;
  const avail=Math.max(.6,span-.6),total=durs.reduce((a,b)=>a+b,0),k=total>avail?avail/total:1,gap=total<avail&&acts?Math.min(1.1,(avail-total)/acts)*.7:0;
  let t=.35;return {kind,rows,beats:rows.map((r,i)=>{const d=durs[i]*k,b={...r,i,start:t,dur:d};if(d>0)t+=d+gap;return b;}),end:t};
}
// Sound cues relative to the screen's start: a key per typed character, a click per press, popups.
export function screenSounds(s,span){
  const out=[];for(const b of screenPlan(s,span).beats){
    if(b.type==='type'){const per=(b.dur-.2)/Math.max(1,b.text.length);for(let j=0;j<b.text.length;j++)if(b.text[j]!==' ')out.push({t:b.start+.2+j*per,type:'key',n:j});}
    else if((b.type==='check'&&b.on)||b.type==='button')out.push({t:b.start+b.dur*.72,type:'click'});
    else if(b.type==='error'||b.type==='success')out.push({t:b.start,type:b.type});
  }
  return out;
}

function wrap(x,text,max){const words=String(text).split(' '),lines=[];let row='';for(const w of words){const test=row?row+' '+w:w;if(x.measureText(test).width>max&&row){lines.push(row);row=w;}else row=test;}if(row)lines.push(row);return lines;}
function box(x,X,Y,w,h,r,fill,stroke){x.beginPath();x.roundRect(X,Y,w,h,r);if(fill){x.fillStyle=fill;x.fill();}if(stroke){x.strokeStyle=stroke;x.lineWidth=3;x.stroke();}}
function check(x,cx,cy,r,col='#2f6fd6'){x.fillStyle=col;x.beginPath();x.arc(cx,cy,r,0,PI*2);x.fill();x.strokeStyle='#fff';x.lineWidth=r*.28;x.lineCap='round';x.lineJoin='round';x.beginPath();x.moveTo(cx-r*.45,cy+r*.02);x.lineTo(cx-r*.1,cy+r*.38);x.lineTo(cx+r*.5,cy-r*.35);x.stroke();}
const tileColor=label=>{let h=0;for(const c of label)h=(h*31+c.charCodeAt(0))%360;return [`hsl(${h},28%,46%)`,`hsl(${(h+20)%360},30%,34%)`];};

// Where each row sits (for drawing and for the cursor to aim at).
function layout(kind,rows){
  const rects=[];
  if(kind==='grid'){
    // Tiles are sized so header, grid and buttons always fit on the screen (never cut off by the monitor's edge).
    const tiles=rows.map((r,i)=>r.type==='check'?i:-1).filter(i=>i>=0).slice(0,12),cols=tiles.length>9?4:3,nrows=Math.max(1,Math.ceil(tiles.length/cols)),texts0=rows.filter(r=>r.type==='text').length,headH=texts0>1?150:texts0?120:0,footH=rows.some(r=>r.type==='button'||r.type==='type')?96:20;
    const size=Math.min((740-40-(cols-1)*12)/cols,(H-118-headH-footH-34)/nrows-12),cw=cols*size+(cols-1)*12+40,X=(W-cw)/2;
    // The header is the first text row, with a second one under it in bold ("Select all squares with" / "traffic lights").
    let y=118;const texts=rows.map((r,i)=>r.type==='text'?i:-1).filter(i=>i>=0);
    if(texts.length){const big=texts[1]===texts[0]+1?rows[texts[1]].text:null;rects[texts[0]]={x:X,y,w:cw,h:big?150:120,role:'head',big};y+=big?150:120;}
    const gy=y+20;tiles.forEach((i,n)=>{rects[i]={x:X+20+(n%cols)*(size+12),y:gy+Math.floor(n/cols)*(size+12),w:size,h:size,role:'tile'};});
    y=gy+nrows*(size+12)+8;
    rows.forEach((r,i)=>{if(r.type==='button'){rects[i]={x:X+cw-230,y,w:210,h:74,role:'button'};}else if(r.type==='type'){rects[i]={x:X+20,y,w:cw-280,h:74,role:'field'};}});
    return {rects,card:{x:X,y:118,w:cw,h:y+footH-118}};
  }
  if(kind==='browser'){
    const X=380,cw=840;let y=0;const items=rows.map((r,i)=>{const h=r.type==='text'?(i===0?110:62):r.type==='check'?66:r.type==='type'?80:r.type==='button'?84:0;const it={i,h};y+=h;return it;});
    let top=Math.max(150,(H+112-y-40)/2);const card={x:X,y:top-20,w:cw,h:y+40};
    for(const it of items){const r=rows[it.i];if(it.h)rects[it.i]=r.type==='button'?{x:X+cw-300,y:top+8,w:270,h:66,role:'button'}:{x:X+20,y:top,w:cw-40,h:it.h,role:r.type==='text'&&it.i===0?'head':r.type};top+=it.h;}
    return {rects,card};
  }
  if(kind==='inbox'){let y=120;rows.forEach((r,i)=>{if(r.type==='button')rects[i]={x:COL.x+COL.w-250,y:36,w:230,h:50,role:'button'};else if(r.type!=='error'&&r.type!=='success'){rects[i]={x:COL.x+20,y,w:COL.w-40,h:92,role:'mail'};y+=100;}});return {rects};}
  return {rects};
}

function cursorAt(plan,lay,elapsed){
  let from={x:1260,y:840},pos=from,press=0;
  for(const b of plan.beats){
    const target=(b.type==='check'&&b.on)||b.type==='button'||(b.type==='type'&&lay.rects[b.i])?lay.rects[b.i]:null;if(!target||b.dur<=0)continue;
    const to={x:target.x+target.w*(b.type==='type'?.15:.55),y:target.y+target.h*.6},travel=b.type==='type'?.2:b.dur*.68;
    if(elapsed<b.start){pos=from;break;}
    const k=ease((elapsed-b.start)/travel);pos={x:from.x+(to.x-from.x)*k,y:from.y+(to.y-from.y)*k-Math.sin(PI*k)*30};
    const at=b.type==='type'?b.start+.2:b.start+b.dur*.72;press=Math.max(press,clamp(1-Math.abs(elapsed-at)/.12,0,1));from=to;
  }
  const idle=elapsed*.7;return {x:pos.x+Math.sin(idle)*3,y:pos.y+Math.cos(idle*1.3)*2,press};
}
function drawCursor(x,c){
  x.save();x.translate(c.x,c.y);const s=1.6*(1-.12*c.press);x.scale(s,s);
  x.shadowColor='rgba(0,0,0,.5)';x.shadowBlur=10;x.shadowOffsetY=4;
  x.beginPath();x.moveTo(0,0);x.lineTo(0,34);x.lineTo(8,26);x.lineTo(14,40);x.lineTo(20,37);x.lineTo(14,24);x.lineTo(25,24);x.closePath();
  x.fillStyle='#fff';x.fill();x.shadowColor='transparent';x.strokeStyle='#111';x.lineWidth=2;x.stroke();x.restore();
  if(c.press>0){x.strokeStyle=`rgba(255,255,255,${.6*c.press})`;x.lineWidth=4;x.beginPath();x.arc(c.x,c.y,18+30*(1-c.press),0,PI*2);x.stroke();}
}

export function drawAppScreen(x,s,elapsed,title,span=6){
  const kind=s.kind,idle=kind==='idle',accent=ACCENT[s.tone]||ACCENT.info;
  // The reel's portrait frame sees the middle of the landscape monitor, so every app lives in a centred column
  // (COL) with large type; the rest is desktop.
  const g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,'#141c2b');g.addColorStop(1,'#0b1018');x.fillStyle=g;x.fillRect(0,0,W,H);
  if(kind!=='browser'&&kind!=='grid'){x.shadowColor='rgba(0,0,0,.5)';x.shadowBlur=36;box(x,COL.x,24,COL.w,H-40,18,kind==='terminal'||kind==='code'||idle?'#0d1117':'#111a24');x.shadowColor='transparent';}
  box(x,COL.x,24,COL.w,74,kind==='browser'||kind==='grid'?18:[18,18,0,0],'#1f2935');
  for(let i=0;i<3;i++){x.fillStyle=['#e0605a','#e2b04e','#55b45f'][i];x.beginPath();x.arc(COL.x+34+i*30,61,9,0,PI*2);x.fill();}
  x.textAlign='left';x.textBaseline='alphabetic';
  if(kind==='browser'||kind==='grid'){box(x,COL.x+140,40,COL.w-170,42,21,'#2b3646');x.font='26px Arial';x.fillStyle='#a9b8c8';x.fillText((s.title||title).slice(0,60),COL.x+164,70,COL.w-220);}
  else{x.font='bold 28px Arial';x.fillStyle='#d2dce4';x.fillText((s.title||title).slice(0,48),COL.x+140,71,COL.w-170);}
  if(idle){
    const content=['// '+title,'','function makeStory(idea) {','  const cast = imagine(idea);','  return bringToLife(cast);','}','','// Your next scene starts here.'];
    x.font='30px monospace';content.forEach((l,i)=>{x.fillStyle='#526574';x.fillText(String(i+1).padStart(2,' '),COL.x+24,170+i*80);x.fillStyle='#708a9a';x.fillText(l,COL.x+84,170+i*80,COL.w-110);});
    if(Math.floor(elapsed*1.6)%2===0){x.fillStyle='#8fb3c8';x.fillRect(COL.x+84+Math.min(COL.w-120,x.measureText(content[7]).width)+8,170+7*80-28,14,34);}
    return;
  }
  const plan=screenPlan(s,span),lay=layout(kind,plan.rows),state=b=>elapsed>=b.start+(b.type==='check'||b.type==='button'?b.dur*.72:0);
  const typed=b=>b.type!=='type'?b.text:b.text.slice(0,clamp(Math.floor((elapsed-b.start-.2)/Math.max(.01,(b.dur-.2)/Math.max(1,b.text.length))),0,b.text.length));
  const caretOn=Math.floor(elapsed*2.4)%2===0;
  x.save();x.beginPath();x.rect(0,98,W,H-98);x.clip();
  if(kind==='grid'||kind==='browser'){
    const c=lay.card;x.shadowColor='rgba(0,0,0,.45)';x.shadowBlur=40;box(x,c.x,c.y,c.w,c.h,22,'#f4f6f9');x.shadowColor='transparent';
    for(const b of plan.beats){const r=lay.rects[b.i];
      if(b.type==='wait'&&elapsed>=b.start&&elapsed<b.start+b.dur+1.5)spinner(x,c.x+c.w/2,c.y+c.h-70,26,elapsed,accent,b.text);
      if(!r)continue;
      if(r.role==='head'){box(x,r.x+(kind==='grid'?16:0),r.y+(kind==='grid'?16:0),r.w-(kind==='grid'?32:0),r.h-(kind==='grid'?16:6),14,accent);x.fillStyle='#fff';
        if(r.big){x.font='30px Arial';x.fillText(b.text,r.x+44,r.y+68,r.w-80);x.font='bold 52px Arial';x.fillText(r.big,r.x+44,r.y+128,r.w-80);}else{x.font='bold 36px Arial';const ls=wrap(x,b.text,r.w-90);ls.slice(0,2).forEach((l,j)=>x.fillText(l,r.x+44,r.y+64+j*42));}}
      else if(r.role==='tile'){const on=b.on&&state(b),[c1,c2]=tileColor(b.text),inset=on?10:0,g=x.createLinearGradient(0,r.y,0,r.y+r.h);g.addColorStop(0,c1);g.addColorStop(1,c2);
        box(x,r.x+inset,r.y+inset,r.w-inset*2,r.h-inset*2,8,g);x.fillStyle='rgba(255,255,255,.9)';x.font='bold 30px Arial';x.textAlign='center';wrap(x,b.text,r.w-30).slice(0,3).forEach((l,j,a)=>x.fillText(l,r.x+r.w/2,r.y+r.h/2+10+(j-(a.length-1)/2)*34));x.textAlign='left';
        if(on){const k=clamp((elapsed-b.start-b.dur*.72)/.15,0,1);check(x,r.x+30,r.y+30,22*(.6+.4*k));}}
      else if(r.role==='check'){const on=b.on&&state(b);box(x,r.x+10,r.y+12,42,42,8,on?accent:'#fff','#9aa6b4');if(on)check(x,r.x+31,r.y+33,17,accent);x.fillStyle='#1d2733';x.font='30px Arial';x.fillText(b.text,r.x+76,r.y+44,r.w-90);}
      else if(r.role==='text'){x.fillStyle='#3a4553';x.font='28px Arial';x.fillText(b.text,r.x+10,r.y+40,r.w-20);}
      else if(r.role==='type'||r.role==='field'){box(x,r.x+6,r.y+8,r.w-12,r.h-18,10,'#fff','#b4bfcc');x.fillStyle='#111a24';x.font='bold 40px Arial';const t=elapsed>=b.start?typed(b):'';x.fillText(t||(elapsed<b.start?b.text.replace(/./g,' '):''),r.x+26,r.y+r.h/2+10,r.w-60);
        if(elapsed>=b.start&&elapsed<b.start+b.dur+.8&&caretOn){x.fillStyle=accent;x.fillRect(r.x+28+x.measureText(t).width,r.y+r.h/2-18,3,36);}}
      else if(r.role==='button'){const down=b.type==='button'&&elapsed>=b.start+b.dur*.6&&elapsed<b.start+b.dur*.85;box(x,r.x,r.y+(down?3:0),r.w,r.h-6,10,down?'#1d4fa3':accent);x.fillStyle='#fff';x.font='bold 30px Arial';x.textAlign='center';x.fillText(b.text.toUpperCase(),r.x+r.w/2,r.y+r.h/2+8,r.w-20);x.textAlign='left';}
    }
  }else if(kind==='chat'){
    const shown=[],L=COL.x+20,R=COL.x+COL.w-20;
    for(const b of plan.beats){if(elapsed<b.start)break;if(b.type==='type'){if(elapsed>=b.start+b.dur)shown.push({me:true,text:b.text});}else if(b.type==='text'){shown.push({me:false,text:b.text,dots:elapsed<b.start+.55});}else if(b.type==='wait')shown.push({me:false,text:'',dots:true});}
    x.font='34px Arial';const bubbles=shown.map(m=>({...m,lines:m.dots?['']:wrap(x,m.text,560)}));const heights=bubbles.map(m=>m.lines.length*44+36);
    const total=heights.reduce((a,h)=>a+h+16,0);let y=Math.min(120,770-total);
    bubbles.forEach((m,i)=>{const h=heights[i],w=m.dots?130:Math.max(...m.lines.map(l=>x.measureText(l).width))+56,X=m.me?R-w:L+70;
      if(!m.me){x.fillStyle='#3d5166';x.beginPath();x.arc(L+28,y+h-28,26,0,PI*2);x.fill();}
      box(x,X,y,w,h,24,m.me?accent:'#263445');x.fillStyle='#eef3f8';
      if(m.dots)for(let d=0;d<3;d++){x.globalAlpha=.4+.6*Math.max(0,Math.sin(elapsed*8-d));x.beginPath();x.arc(X+38+d*28,y+h/2,8,0,PI*2);x.fill();x.globalAlpha=1;}
      else m.lines.forEach((l,j)=>x.fillText(l,X+28,y+50+j*44));y+=h+16;});
    box(x,L,790,COL.w-40,76,38,'#1f2a37');const cur=plan.beats.find(b=>b.type==='type'&&elapsed>=b.start&&elapsed<b.start+b.dur);
    x.font='32px Arial';x.fillStyle=cur?'#eef3f8':'#6d7f92';const t=cur?typed(cur):'Message';const tw=Math.min(x.measureText(t).width,COL.w-170);x.fillText(t,L+34,840,COL.w-170);if(cur&&caretOn){x.fillStyle=accent;x.fillRect(L+36+tw,810,3,38);}
    check(x,R-40,828,26,cur?accent:'#3a4a5c');
  }else{
    // Terminal, code and inbox: rows appear in order (scrolling up when full); typed rows type out.
    const rowsShown=plan.beats.filter(b=>elapsed>=b.start&&b.type!=='error'&&b.type!=='success'&&!(kind==='inbox'&&b.type==='button'));
    const step=kind==='inbox'?100:72,scroll=Math.max(0,rowsShown.length-(kind==='inbox'?7:10))*step;let y=158-scroll;
    for(const b of plan.beats){if(elapsed<b.start)break;if(b.type==='error'||b.type==='success')continue;
      const r=lay.rects[b.i];
      if(kind==='inbox'&&r){if(r.role==='button'){box(x,r.x,r.y,r.w,r.h,10,accent);x.fillStyle='#fff';x.font='bold 26px Arial';x.textAlign='center';x.fillText(b.text.toUpperCase(),r.x+r.w/2,r.y+37,r.w-16);x.textAlign='left';continue;}
        const Y=r.y-scroll,sel=b.type==='check'&&b.on&&state(b),[from,...rest]=b.text.split(/:\s|\s-\s/);box(x,r.x,Y,r.w,r.h,12,sel?'#22415f':b.i===0?'#1c2b3a':'#16212c');if(sel)check(x,r.x+36,Y+r.h/2,18,accent);
        x.font='bold 30px Arial';x.fillStyle='#e3ebf2';x.fillText(from,r.x+70,Y+38,r.w-90);x.font='28px Arial';x.fillStyle='#9fb0c2';x.fillText(rest.join(' - '),r.x+70,Y+74,r.w-90);continue;}
      const t=typed(b),prompt=kind==='terminal'&&b.type==='type'?'$ ':'';x.font='30px monospace';
      if(kind==='code'){x.fillStyle='#526574';x.fillText(String(b.i+1).padStart(2,' '),COL.x+20,y);}
      x.fillStyle=b.type==='error'?'#f08b80':b.type==='success'?'#8fd694':kind==='code'?(b.text.startsWith('+')?'#a8d9ac':b.text.startsWith('-')?'#edaba1':'#b7c7d5'):b.type==='type'?'#e6edf3':kind==='terminal'?'#b6dfb2':'#d8e2eb';
      const X=COL.x+(kind==='code'?78:30),max=COL.w-(kind==='code'?100:60),shown=prompt+(b.type==='wait'?b.text:t);x.fillText(shown,X,y,max);const sw=Math.min(max,x.measureText(shown).width);
      if(b.type==='wait'&&elapsed<b.start+b.dur+1.5)x.fillText(' '+'|/-\\'[Math.floor(elapsed*10)%4],X+sw,y);
      if(b.type==='type'&&caretOn&&elapsed<b.start+b.dur+.6){x.fillStyle='#e6edf3';x.fillRect(X+sw+4,y-26,15,32);}
      y+=step;}
  }
  x.restore();
  // Popups play over any kind, then fade unless they are the last thing that happens.
  const pops=plan.beats.filter(b=>(b.type==='error'||b.type==='success')&&elapsed>=b.start),last=plan.beats.at(-1);
  for(const b of pops){const age=elapsed-b.start,fade=b===last?1:clamp(1-(age-1.8)/.4,0,1),pop=ease(clamp(age/.25,0,1));if(fade<=0)continue;x.globalAlpha=fade;
    if(b.type==='success'){x.fillStyle=`rgba(40,140,70,${.88*pop})`;const c=lay.card||{x:COL.x,y:98,w:COL.w,h:H-114};box(x,c.x,c.y,c.w,c.h,18,x.fillStyle);check(x,c.x+c.w/2,c.y+c.h/2-50,70*pop,'#3fb950');x.fillStyle='#fff';x.font='bold 46px Arial';x.textAlign='center';x.fillText(b.text,c.x+c.w/2,c.y+c.h/2+80,c.w-60);x.textAlign='left';}
    else{x.fillStyle=`rgba(5,10,16,${.55*pop})`;x.fillRect(0,92,W,H-92);const w=720,h=300,X=(W-w)/2,Y=(H-h)/2+40-20*(1-pop);box(x,X,Y,w,h,22,'#f4f6f9');
      x.fillStyle='#e5534b';x.beginPath();x.arc(W/2,Y+70,30,0,PI*2);x.fill();x.fillStyle='#fff';x.font='bold 40px Arial';x.textAlign='center';x.fillText('!',W/2,Y+84);
      x.fillStyle='#1d2733';x.font='bold 40px Arial';x.fillText(b.text,W/2,Y+160,w-60);box(x,W/2-150,Y+200,300,62,10,'#2f6fd6');x.fillStyle='#fff';x.font='bold 26px Arial';x.fillText('TRY AGAIN',W/2,Y+240);x.textAlign='left';}
    x.globalAlpha=1;}
  if(CURSOR_KINDS.has(kind)&&plan.beats.some(b=>(b.type==='check'&&b.on)||b.type==='button'||b.type==='type'))drawCursor(x,cursorAt(plan,lay,elapsed));
}
function spinner(x,cx,cy,r,t,col,label){x.lineWidth=7;x.strokeStyle='rgba(120,140,160,.3)';x.beginPath();x.arc(cx,cy,r,0,PI*2);x.stroke();x.strokeStyle=col;x.lineCap='round';x.beginPath();x.arc(cx,cy,r,t*6,t*6+PI*1.3);x.stroke();
  if(label){x.fillStyle='#5b6878';x.font='26px Arial';x.textAlign='center';x.fillText(label,cx,cy+r+40);x.textAlign='left';}}
