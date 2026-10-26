/*
 * FrameForge M1.4 — DEV's body acting. Pure and seekable: the same action and time always give the same pose.
 * Each action is a few key poses (anticipation, strike, hold) laid out around the line's accent, then a release.
 * Every joint follows them as a spring (the step response of a damped oscillator), so it overshoots and settles;
 * joints further from the spine start later and wobble more, so a move breaks down the chain (overlapping action).
 * Output channels, in radians unless noted (sheet units are head heights):
 *   bob, hop (sheet units, whole body up), crouch (0..1, knees bend with the feet planted)
 *   spineP/Y/R, chestP/Y/R, neckP, headP/Y/R: pitch + = forward/down, yaw + = to DEV's left, roll + = top to DEV's right
 *   L / R arms: lift (shoulder up, sheet units), raise (forward), out (to the side), twist (+ swings a bent forearm out),
 *   bend (elbow), wflex (hand toward the palm), wtwist (+ turns the palm up), hand (relaxed, open, fist, point)
 */
(function(root,build){
  const api=build();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.FrameForgeDevActing=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const BODY=['bob','hop','crouch','spineP','spineY','spineR','chestP','chestY','chestR','neckP','headP','headY','headR'];
  const ARM=['lift','raise','out','twist','bend','wflex','wtwist'];
  const CHANNELS=Object.freeze([...BODY,...ARM.map(k=>'L.'+k),...ARM.map(k=>'R.'+k)]);
  // Spring per joint group: delay (s), natural frequency (rad/s) and damping. The spine leads; hands trail and overshoot.
  const SPRING={
    bob:[0,13,.75],hop:[0,13,.75],crouch:[0,16,.7],spine:[0,13,.62],chest:[.025,14,.58],neck:[.05,14,.55],head:[.06,15,.5],
    lift:[.02,16,.55],raise:[.03,15,.6],out:[.03,15,.6],twist:[.05,16,.55],bend:[.06,17,.48],wflex:[.09,19,.42],wtwist:[.08,19,.45]
  };
  const springOf=ch=>{const k=ch.includes('.')?ch.split('.')[1]:ch;return SPRING[k]||SPRING[k.replace(/[PYR]$/,'')]||SPRING.spine;};
  function step(tau,w,z){
    if(tau<=0)return 0;
    const wd=w*Math.sqrt(1-z*z),e=Math.exp(-z*w*tau);
    return 1-e*(Math.cos(wd*tau)+z/Math.sqrt(1-z*z)*Math.sin(wd*tau));
  }
  const flat=pose=>{
    const out={};
    for(const k of BODY)if(pose[k]!=null)out[k]=pose[k];
    for(const s of['L','R'])if(pose[s])for(const k of ARM)if(pose[s][k]!=null)out[s+'.'+k]=pose[s][k];
    return out;
  };
  const both=arm=>({L:arm,R:arm});
  // Key poses. `at` places a key relative to the accent (s, negative = before); `slow` stretches the springs.
  // Anticipation goes the other way first; the strike pose is what the spring overshoots toward; the hold is where it settles.
  const ACTIONS={
    listen:{keys:[{at:-.6,pose:{spineP:-.015,headR:.05,headP:.02,...both({out:.04,bend:.14})}},{at:-.05,pose:{spineP:-.015,headR:.06,headP:.09,...both({out:.04,bend:.16})}},
      {at:.22,pose:{spineP:-.015,headR:.06,headP:.025,...both({out:.04,bend:.14})}}]},
    typing:{keys:[{at:-.7,pose:{spineP:.07,chestP:.03,headP:.1,...both({raise:.3,out:.2,twist:-.32,bend:1.3,wtwist:-1.3,wflex:-.1})}}],
      loop:(l,t,o)=>{o['L.wflex']+=.16*Math.sin(l*17);o['R.wflex']+=.16*Math.sin(l*17+1.9);o['L.bend']+=.03*Math.sin(l*8.5+.4);o['R.bend']+=.03*Math.sin(l*8.5+2.2);o.headY+=.02*Math.sin(l*1.3);}},
    react:{keys:[{at:-.12,pose:{spineP:-.08,chestP:-.05,headP:-.12,...both({raise:.28,out:.18,bend:.75,wtwist:-.2,hand:'open'})}},
      {at:.16,pose:{spineP:-.03,headP:-.04,headR:.04,...both({raise:.1,out:.1,bend:.38,hand:'relaxed'})}}]},
    question:{keys:[{at:-.45,pose:{headP:.04,R:{raise:.04,out:.02,bend:.25}}},
      {at:-.18,pose:{headR:.13,headP:-.05,chestR:-.03,chestY:.05,R:{lift:.02,raise:.32,out:.28,twist:.7,bend:1.35,wtwist:1.35,hand:'open'},L:{out:.1,bend:.35}}}],
      beat:{arm:'R',bend:.14,raise:.06}},
    plead:{keys:[{at:-.5,pose:{spineP:-.03,headP:-.03,...both({raise:.12,out:.05,bend:.45})}},
      {at:-.2,pose:{spineP:.07,chestP:.04,headR:.1,headP:-.07,...both({raise:.85,out:-.05,twist:-.9,bend:1.35,wtwist:.2,hand:'open'})}}],
      loop:(l,t,o,k)=>{const s=.035*Math.sin(l*9)*k;o['L.bend']+=s;o['R.bend']+=s;}},
    alarm:{keys:[{at:-.42,pose:{crouch:.2,spineP:.05,headP:.04,...both({raise:.08,bend:.3})}},
      {at:-.16,pose:{crouch:0,spineP:-.1,chestP:-.06,headP:-.09,...both({lift:.025,raise:.95,out:.75,twist:.3,bend:1.45,wtwist:.6,hand:'open'})}}],
      loop:(l,t,o,k)=>{const s=.03*Math.sin(l*13)*k;o['L.raise']+=s;o['R.raise']-=s;}},
    surprise:{hop:{at:-.12,height:.055,air:.32},keys:[{at:-.4,pose:{crouch:.45,spineP:.07,headP:.06,...both({raise:.06,bend:.3})}},
      {at:-.14,pose:{crouch:0,spineP:-.12,chestP:-.04,headP:-.12,...both({raise:.72,out:.52,twist:.5,bend:1.5,wtwist:.9,hand:'open'})}},
      {at:.2,pose:{crouch:.28}},{at:.38,pose:{crouch:0,spineP:-.05,headP:-.05,...both({raise:.45,out:.36,twist:.4,bend:1.3,wtwist:.8,hand:'open'})}}]},
    defeat:{slow:1.6,keys:[{at:-.65,pose:{spineP:-.05,headP:-.08,...both({lift:.025,bend:.18})}},
      {at:-.25,pose:{crouch:.15,spineP:.12,chestP:.1,neckP:.02,headP:-.04,...both({lift:-.025,raise:.04,out:.02,bend:.1})}}]},
    announce:{hop:{at:-.1,height:.03,air:.24},keys:[{at:-.42,pose:{crouch:.3,spineP:.04,R:{raise:.25,out:.3,bend:.9,hand:'fist'}}},
      {at:-.14,pose:{crouch:0,spineP:-.06,spineR:-.04,chestP:-.04,chestR:-.05,headP:-.09,headR:-.04,R:{raise:.62,out:2.4,bend:.1,hand:'point'},L:{out:.12,bend:.32}}}]},
    explain:{keys:[{at:-.45,pose:{R:{raise:.14,bend:.6}}},
      {at:-.18,pose:{chestY:-.06,headR:.04,R:{raise:.48,out:.16,twist:.38,bend:1.12,wtwist:.85,hand:'open'},L:{out:.06,bend:.25}}}],
      beat:{arm:'R',bend:.16,raise:.08}},
    celebrate:{hop:{at:-.1,height:.09,air:.4},keys:[{at:-.42,pose:{crouch:.5,spineP:.05,...both({raise:.22,out:.12,bend:1.25,hand:'fist'})}},
      {at:-.14,pose:{crouch:0,spineP:-.06,headP:-.13,...both({raise:.3,out:2.2,bend:.15,hand:'fist'})}},{at:.24,pose:{crouch:.3}},{at:.42,pose:{crouch:0}}],
      loop:(l,t,o,k)=>{const s=.12*Math.sin(l*7.5)*k;o['L.out']-=Math.abs(s);o['R.out']-=Math.abs(s);o['L.bend']+=Math.abs(s);o['R.bend']+=Math.abs(s);o.spineR+=.03*Math.sin(l*7.5)*k;}},
    shrug:{keys:[{at:-.4,pose:{headP:.04,...both({lift:-.01,bend:.2})}},
      {at:-.15,pose:{headR:.15,headP:-.03,...both({lift:.045,raise:.16,out:.26,twist:.95,bend:1.45,wtwist:1.4,hand:'open'})}}]},
    anticipate:{keys:[{at:-.6,pose:{spineP:.08,chestP:.03,crouch:.14,...both({raise:.48,out:.04,twist:-.55,bend:1.55})}}],
      loop:(l,t,o,k)=>{const s=.07*Math.sin(l*10)*k;o['L.twist']+=s;o['R.twist']-=s;}}
  };
  const ACTION_NAMES=Object.freeze(Object.keys(ACTIONS));
  function evaluate(input={}){
    const action=ACTIONS[input.action]?input.action:'listen',def=ACTIONS[action];
    const local=input.local??0,duration=input.duration??2,time=input.time??local;
    if(![local,duration,time].every(Number.isFinite)||local<0||duration<=0)throw new Error('Invalid acting timeline');
    const accent=Math.max(.45,Math.min(duration-.5,(input.accentAt??.5)*duration)),slow=def.slow||1;
    // The keys, then a release back to rest before the shot ends (when there is time for one).
    const keys=def.keys.map(k=>({t:Math.max(0,accent+k.at*slow),pose:flat(k.pose),hand:handsOf(k.pose)}));
    const release=duration-.42;
    if(release>keys.at(-1).t+.35)keys.push({t:release,pose:{},hand:{L:'relaxed',R:'relaxed'},rest:true});
    const out=Object.fromEntries(CHANNELS.map(c=>[c,0]));
    let prev={};
    for(const k of keys){
      const target=k.rest?{}:{...prev,...k.pose};
      for(const c of CHANNELS){
        const d=(target[c]||0)-(prev[c]||0);if(!d)continue;
        // Going back to rest settles without overshoot, so arms never swing on past it into the body.
        const[delay,w,z]=springOf(c);out[c]+=d*step(local-k.t-delay*slow,w/slow,k.rest?Math.max(z,.9):z);
      }
      prev=target;
    }
    // How far into the hold we are (0 before the strike, 1 while holding, back to 0 on release): loops and beats scale by it.
    const strike=keys[Math.min(1,keys.length-1)].t,hold=Math.max(0,Math.min(1,(local-strike)/.3))*(local<release?1:Math.max(0,1-(local-release)/.3));
    if(def.loop)def.loop(local,time,out,keys.length>1?hold:Math.min(1,local/.5)*(local<release?1:Math.max(0,1-(local-release)/.3)));
    // Speech beats: the gesturing hand pulses with the voice's loudness.
    if(def.beat&&input.speaking){const e=Math.max(0,Math.min(1,input.energy||0))*hold,a=def.beat.arm;out[a+'.bend']+=def.beat.bend*e;out[a+'.raise']+=def.beat.raise*e;out.headP+=.03*e;}
    if(def.hop){const h=def.hop,u=(local-(accent+h.at))/h.air;if(u>0&&u<1)out.hop+=h.height*4*u*(1-u);}
    // Life: breathing and a slow weight shift that never stops.
    out.chestP+=.012*Math.sin(time*1.75);out['L.lift']+=.004*Math.sin(time*1.75-.6);out['R.lift']+=.004*Math.sin(time*1.75-.6);
    out.spineR+=.012*Math.sin(time*.62);out.headR-=.008*Math.sin(time*.62);
    out.crouch=Math.max(0,out.crouch);
    for(const s of['L','R'])out[s+'.bend']=Math.max(0,out[s+'.bend']);
    // The hands change shape on the frame each key's strike lands (with the wrist's delay).
    let hands={L:'relaxed',R:'relaxed'};
    for(const k of keys)if(local>=k.t+springOf('wflex')[0]*slow)hands={...hands,...k.hand};
    return{action,channels:out,hands};
  }
  function handsOf(pose){const h={};for(const s of['L','R'])if(pose[s]?.hand)h[s]=pose[s].hand;return h;}
  return Object.freeze({version:'m1.4',actions:ACTION_NAMES,channels:CHANNELS,evaluate});
});
