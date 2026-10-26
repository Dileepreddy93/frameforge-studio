/*
 * FrameForge M3.4: BLUE and ORANGE's acting. Pure and seekable, like DEV's (src/dev-acting-core.js): each of the 13
 * project actions is a few key poses laid out around the line's accent, each channel follows them as a damped spring
 * (so it overshoots and settles), and the pose releases to rest before the shot ends. The robots hover, so the body
 * moves as one piece: it rises and dips, leans, tilts and turns; the head adds its own pitch, yaw and roll to the
 * emotion's pose; each arm swings forward and out from its shoulder.
 * Personality is in the springs and the size of the moves: BLUE is eager (bigger, snappier, a little bouncy); ORANGE
 * is deadpan (smaller, slower, well damped, and he rarely leaves the ground).
 * Channels (radians unless noted): hover (sheet units, + up), lean (+ top to the robot's left), tilt (+ forward),
 * turn (+ to the robot's left), headP (+ down), headY (+ to its left), headR, L.swing/R.swing (+ forward),
 * L.out/R.out (+ away from the body).
 */
(function(root,build){
  const api=build();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.FrameForgeRobotActing=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const BODY=['hover','lean','tilt','turn','headP','headY','headR'],ARM=['swing','out'];
  const CHANNELS=Object.freeze([...BODY,...ARM.map(k=>'L.'+k),...ARM.map(k=>'R.'+k)]);
  // Spring per channel group: delay (s), natural frequency (rad/s), damping. The body leads, the head and hands trail.
  const SPRING={hover:[0,12,.6],lean:[0,12,.6],tilt:[0,12,.62],turn:[.02,11,.7],head:[.05,14,.5],swing:[.04,15,.5],out:[.04,15,.5]};
  const springOf=c=>{const k=c.includes('.')?c.split('.')[1]:c;return SPRING[k]||SPRING[k.replace(/[PYR]$/,'')]||SPRING.lean;};
  const PERSONALITY={blue:{size:1.15,speed:1.15,damp:.85},orange:{size:.6,speed:.8,damp:1.35}};
  function step(tau,w,z){
    if(tau<=0)return 0;
    if(z>=.999)return 1-Math.exp(-w*tau)*(1+w*tau);
    const wd=w*Math.sqrt(1-z*z),e=Math.exp(-z*w*tau);
    return 1-e*(Math.cos(wd*tau)+z/Math.sqrt(1-z*z)*Math.sin(wd*tau));
  }
  const both=a=>({L:a,R:a});
  const flat=p=>{const o={};for(const k of BODY)if(p[k]!=null)o[k]=p[k];for(const s of['L','R'])if(p[s])for(const k of ARM)if(p[s][k]!=null)o[s+'.'+k]=p[s][k];return o;};
  // Key poses, `at` seconds from the accent. Anticipation goes the other way first.
  const ACTIONS={
    listen:{keys:[{at:-.5,pose:{headR:.06,headP:.03,...both({out:.08})}},{at:0,pose:{headR:.08,headP:.08,tilt:.02,...both({out:.08})}}]},
    typing:{keys:[{at:-.6,pose:{tilt:.08,headP:.14,...both({swing:.7,out:-.05})}}],
      loop:(l,o)=>{o['L.swing']+=.08*Math.sin(l*16);o['R.swing']+=.08*Math.sin(l*16+2);}},
    react:{keys:[{at:-.12,pose:{hover:-.02,tilt:-.08,headP:-.12,...both({swing:.25,out:.3})}},{at:.18,pose:{tilt:-.03,headP:-.04,...both({swing:.1,out:.15})}}]},
    question:{keys:[{at:-.4,pose:{headR:-.04,R:{swing:.15}}},{at:-.15,pose:{headR:.16,headP:-.06,lean:-.05,R:{swing:.85,out:.35},L:{out:.12}}}],beat:{arm:'R',swing:.12}},
    plead:{keys:[{at:-.45,pose:{tilt:-.04,...both({swing:.2})}},{at:-.18,pose:{tilt:.1,headP:-.08,headR:.1,...both({swing:1.1,out:-.08})}}],
      loop:(l,o,k)=>{const s=.05*Math.sin(l*9)*k;o['L.swing']+=s;o['R.swing']+=s;}},
    alarm:{keys:[{at:-.4,pose:{hover:-.03,tilt:.05,...both({swing:.1})}},{at:-.15,pose:{hover:.04,tilt:-.12,headP:-.12,...both({swing:1.2,out:.8})}}],
      loop:(l,o,k)=>{const s=.06*Math.sin(l*13)*k;o['L.out']+=s;o['R.out']-=s;}},
    surprise:{keys:[{at:-.35,pose:{hover:-.04,tilt:.06,headP:.06}},{at:-.12,pose:{hover:.07,tilt:-.14,headP:-.14,...both({swing:.6,out:.75})}},{at:.35,pose:{hover:.02,tilt:-.05,...both({swing:.35,out:.45})}}]},
    defeat:{slow:1.6,keys:[{at:-.6,pose:{headP:-.06}},{at:-.25,pose:{hover:-.06,tilt:.14,headP:.18,lean:.04,...both({swing:-.05,out:-.06})}}]},
    announce:{keys:[{at:-.4,pose:{hover:-.03,R:{swing:.4,out:.2}}},{at:-.12,pose:{hover:.05,tilt:-.06,lean:-.05,headP:-.1,R:{swing:1.5,out:1.1},L:{out:.15}}}]},
    explain:{keys:[{at:-.4,pose:{R:{swing:.2}}},{at:-.16,pose:{turn:-.08,headR:.05,R:{swing:.7,out:.25},L:{out:.1}}}],beat:{arm:'R',swing:.15}},
    celebrate:{keys:[{at:-.4,pose:{hover:-.05,...both({swing:.3})}},{at:-.12,pose:{hover:.1,tilt:-.06,headP:-.14,...both({swing:.4,out:1.6})}},{at:.3,pose:{hover:.04}}],
      loop:(l,o,k)=>{const s=Math.sin(l*7.5)*k;o.hover+=.03*s;o.lean+=.05*s;o['L.out']-=.12*Math.abs(s);o['R.out']-=.12*Math.abs(s);}},
    shrug:{keys:[{at:-.35,pose:{headP:.04}},{at:-.12,pose:{hover:.02,headR:.17,headP:-.03,...both({swing:.35,out:.7})}}]},
    anticipate:{keys:[{at:-.55,pose:{tilt:.08,hover:-.02,...both({swing:.6,out:-.04})}}],
      loop:(l,o,k)=>{const s=.06*Math.sin(l*10)*k;o['L.swing']+=s;o['R.swing']-=s;}}
  };
  function evaluate(input={}){
    const who=input.robot==='orange'?'orange':'blue',P=PERSONALITY[who];
    const action=ACTIONS[input.action]?input.action:'listen',def=ACTIONS[action];
    const local=input.local??0,duration=input.duration??2,time=input.time??local;
    if(![local,duration,time].every(Number.isFinite)||local<0||duration<=0)throw new Error('Invalid acting timeline');
    const accent=Math.max(.45,Math.min(duration-.5,(input.accentAt??.5)*duration)),slow=(def.slow||1)/P.speed;
    const keys=def.keys.map(k=>({t:Math.max(0,accent+k.at*slow),pose:flat(k.pose)}));
    const release=duration-.42;
    // Release to rest before the cut whenever there is a little room (ORANGE's slower keys land later than BLUE's).
    if(release>keys.at(-1).t+.2)keys.push({t:release,pose:{},rest:true});
    const out=Object.fromEntries(CHANNELS.map(c=>[c,0]));
    let prev={};
    for(const k of keys){
      const target=k.rest?{}:{...prev,...k.pose};
      for(const c of CHANNELS){
        const d=(target[c]||0)-(prev[c]||0);if(!d)continue;
        const[delay,w,z]=springOf(c);
        out[c]+=d*P.size*step(local-k.t-delay*slow,w/slow,Math.min(1,k.rest?Math.max(z,.9):z*P.damp));
      }
      prev=target;
    }
    const strike=keys[Math.min(1,keys.length-1)].t,hold=Math.max(0,Math.min(1,(local-strike)/.3))*(local<release?1:Math.max(0,1-(local-release)/.3));
    if(def.loop)def.loop(local,out,(keys.length>1?hold:Math.min(1,local/.5)*(local<release?1:Math.max(0,1-(local-release)/.3)))*P.size);
    // Speech beats: the speaker's gesturing hand and head pulse with the voice's loudness.
    if(input.speaking){
      const e=Math.max(0,Math.min(1,input.energy||0))*P.size;
      if(def.beat)out[def.beat.arm+'.swing']+=def.beat.swing*e*hold;
      out.headP+=.05*e;out.hover+=.006*e;
    }
    // Hovering: a slow bob that never stops (BLUE quicker and higher than ORANGE), and the head turned toward whoever
    // speaks (look: -1 screen left .. 1 screen right).
    const bob=who==='blue'?[2.2,.022]:[1.6,.012];
    out.hover+=bob[1]*Math.sin(time*bob[0]+(who==='blue'?0:1.3));
    out.lean+=.012*Math.sin(time*1.1+(who==='blue'?.4:2));
    out.headY+=(input.look||0)*.28*(who==='orange'?.7:1);
    return{robot:who,action,channels:out};
  }
  return Object.freeze({version:'m3.4',actions:Object.keys(ACTIONS),channels:CHANNELS,evaluate});
});
