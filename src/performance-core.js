/*
 * FrameForge V5.2 — seekable facial-performance system.
 * Pure evaluation, no randomness, browser/Node compatible.
 * Mouth opening follows an external signal when available; this is not phoneme alignment.
 */
(function(root,build) {
  const api = build();
  if(typeof module === 'object' && module.exports) module.exports = api;
  else root.FrameForgePerformanceCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const clamp = (n,min=0,max=1) => Math.min(max, Math.max(min, n));
  const smooth = x => {const t=clamp(x);return t*t*(3-2*t);};
  const mix = (a,b,t) => a+(b-a)*t;
  const EMOTIONS=Object.freeze({
    neutral:{lid:.95,brow:0,slope:0,cheek:.05,smile:0,round:0,jaw:.10,headPitch:0,headRoll:0},
    happy:{lid:.76,brow:.12,slope:-.24,cheek:.74,smile:.82,round:0,jaw:.12,headPitch:.035,headRoll:.012},
    worried:{lid:.99,brow:.34,slope:.41,cheek:.10,smile:-.70,round:.04,jaw:.08,headPitch:-.08,headRoll:-.035},
    surprised:{lid:1,brow:.83,slope:.03,cheek:0,smile:0,round:.90,jaw:.85,headPitch:-.045,headRoll:.02},
    angry:{lid:.53,brow:-.51,slope:-.45,cheek:.24,smile:-.5,round:0,jaw:.16,headPitch:.04,headRoll:-.02}
  });
  const FIELDS=['lid','brow','slope','cheek','smile','round','jaw','headPitch','headRoll'];
  const EMOTION_NAMES=Object.freeze(Object.keys(EMOTIONS));
  function evaluate(input={}){
    const t=input.time??0,local=input.local??0,duration=input.duration??3;
    if(!Number.isFinite(t)||t<0||!Number.isFinite(local)||local<0||
       !Number.isFinite(duration)||duration<=0)throw new Error('Invalid facial timeline');
    const from=input.fromEmotion??'neutral',to=input.emotion??'neutral';
    if(!EMOTIONS[from]||!EMOTIONS[to])throw new Error('Unknown facial emotion');
    const energy=clamp(input.energy??0),speaking=!!input.speaking;
    const blend=smooth(local/.25);
    const pose={};
    for(const key of FIELDS)pose[key]=mix(EMOTIONS[from][key],EMOTIONS[to][key],blend);
    // A pair of brief, deterministic blinks: no frame history and no random flicker.
    const blinkPulse=(center,width)=>{
      const dist=Math.abs(t-center)/width;
      return dist<1?Math.pow(1-dist,2):0;
    };
    const periodic=(period,phase,width)=>{
      // +2.41 puts the first blinks at 1.16 s and 1.96 s, so an episode never opens mid-blink.
      const center=Math.floor((t+phase)/period)*period-phase+2.41;
      return Math.max(blinkPulse(center,width),blinkPulse(center+period,width));
    };
    const blink=Math.max(periodic(3.6,.45,.17),periodic(6.3,1.25,.13));
    pose.blink=blink;
    pose.lid=clamp(pose.lid*(1-blink*.96),.025,1);
    pose.gazeX=clamp(input.gazeX??Math.sin(t*.57)*.06,-1,1);
    pose.gazeY=clamp(input.gazeY??Math.sin(t*.31)*.035,-1,1);
    pose.mouthOpen=clamp((speaking?.075+energy*.83:.03)+pose.jaw*(speaking?.22:.17));
    pose.mouthWidth=clamp(.95+pose.smile*.25-pose.round*.39,.48,1.35);
    pose.breath=Math.sin(t*1.9)*.024;
    pose.headPitch+=Math.sin(t*.83)*.009;
    pose.headRoll+=Math.sin(t*.61)*.009;
    // Motion envelope for shoulder/torso follow-through, independent of frame rate.
    pose.anticipation=smooth(clamp(local/.22));
    pose.recovery=smooth(clamp((duration-local)/.28));
    pose.shoulder=pose.breath+(.035*energy)*(speaking?1:0);
    return Object.freeze(pose);
  }
  return Object.freeze({version:'v5.2-pose1',emotions:EMOTION_NAMES,evaluate});
});
