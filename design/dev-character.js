/* FrameForge DEV, the approved design (M1.1 pick: direction A with C's eyes) and its model-sheet charts (M1.2).
   This is the reference the three.js build matches (M1.3 head and face, M1.4 body). Units: head height = 1, head centre
   at the origin, x toward the character's left, y up, z toward the viewer. Forms are drawn by design/dev-forms.js. */
(function(root,factory){
 const lib=factory();
 if(typeof module==='object'&&module.exports)module.exports=lib;
 else root.FrameForgeDev=lib;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const DEV={id:'DEV',name:'DEV',seed:7,
  head:{w:[[0,.5],[.3,.55],[.55,.55],[.75,.5],[.9,.43],[1,.38]],f:[[0,.46],[.4,.49],[.6,.5],[.8,.48],[1,.43]],b:[[0,.48],[.35,.53],[.6,.48],[.8,.35],[1,.22]],
   zc:[[0,-.02],[.5,0],[1,.05]],n:2.1,nyTop:2.05,nyBot:2.1,bumps:[{t:.7,phi:.75,st:.09,sp:.4,a:.05}],detail:2,jitter:[.02,.08,.018]},
  face:{
   // C's eyes: big ink pupils with two glints; the upper-lid line carries the mood.
   eyes:{style:'glossy',x:.16,y:-.1,rx:.05,ry:.062,lid:.014},
   brows:{x:.16,y:.05,len:.11,th:.032,arch:.012},
   glasses:{x:.16,y:-.1,r:.1,w:.028,d:.02,gap:.034,wrap:.3,segs:12},
   nose:{y:-.2,size:[.056,.04,.05],detail:1,out:.45},mouth:{y:-.29,w:.072,th:.02,teeth:1},ear:{y:-.13,size:[.045,.1,.075]}},
  hair:{line:[[0,.3],[.9,.34],[1.57,.5],[2.3,.52],[3.14,.74]],part:-.03,thick:.05,volume:[{t:.15,phi:-.2,st:.15,sp:.9,a:.025}],chunks:[
   {at:[.3,.55],via:[0,.36,.16],to:[-.18,.42,.02],w:.17,th:.07},
   {at:[.3,.25],via:[-.04,.4,.17],to:[-.3,.4,-.02],w:.18,th:.07},
   {at:[.31,-.05],via:[-.06,.36,.15],to:[-.38,.3,-.06],w:.17,th:.065},
   {at:[.32,-.35],via:[-.08,.28,.12],to:[-.36,.12,-.08],w:.15,th:.06},
   {at:[.34,-.65],via:[-.06,.14,.08],to:[-.2,-.06,-.04],w:.12,th:.05},
   {at:[.12,.8],via:[-.12,.18,-.04],to:[-.42,.14,-.22],w:.2,th:.065},
   {at:[.2,2.4],via:[-.08,.1,-.1],to:[-.26,.02,-.26],w:.17,th:.055},
   {at:[.22,-2.3],via:[-.06,.08,-.1],to:[-.18,-.02,-.24],w:.16,th:.05},
   [.42,1.2,.02, .47,1.38,.05, .53,1.55,.05, .08,.03],
   [.55,2.65,.02, .65,2.7,.05, .76,2.78,.04, .12,.035],
   [.55,3.14,.02, .66,3.14,.05, .77,3.14,.04, .12,.035],
   [.55,-2.65,.02, .65,-2.7,.05, .76,-2.78,.04, .12,.035]]},
  body:{neck:{r:.1,z:-.03,bot:-.6},trunk:[[-.55,.18,.13,.13,2.4],[-.59,.29,.18,.18,2.6],[-.65,.34,.21,.2,2.6],[-.86,.345,.22,.2,2.6],[-1.02,.35,.22,.2,2.5],[-1.08,.32,.2,.19,2.4]],
   hood:{y:-.585,ax:.22,az:.185,r:[.095,.08],from:62,drop:.04,pouch:[.16,.12,.05]},pocket:{top:-.86,bot:-1.0,tw:.15,bw:.19},strings:{x:.055,top:-.6,bot:-.78},
   arm:{shoulder:[.3,-.65,0],elbow:[.37,-.83,0],wrist:[.39,-.98,.03],r:[.085,.078,.07],cuff:.045,hand:[.062,.072,.058],pose:'relaxed'},
   leg:{x:.125,top:-1.0,bot:-1.42,r:.1,shoe:[.085,.06,.135]},ground:-1.5}};
 // The 7 emotions on the engine's face channels: brow lift/tilt/arch (+ per-side browUp), lids (upper close and slope,
 // lower rise and arc), gaze, eye scale, mouth (smile s, open o, top bulge u, round, width w, teeth, asym, shift),
 // and the head pose that goes with each.
 const EMOTIONS={
  neutral:{face:{lidU:.1,mouth:{s:.012}},pose:{}},
  happy:{face:{browLift:.016,browArch:.012,lidL:.62,lidArc:.75,mouth:{s:.032,o:.052,u:-.004,teeth:1,w:1.2}},pose:{roll:7,pitch:-4}},
  worried:{face:{browLift:.018,browTilt:.06,browArch:-.006,lidU:.1,lidSlope:-.35,lidL:.04,gaze:[-.014,-.008],mouth:{s:-.014,o:.02,asym:.008,w:.85}},pose:{roll:-5,pitch:3}},
  surprised:{face:{browLift:.045,browTilt:.01,browArch:.02,lidU:-.02,eyeScale:1.17,mouth:{s:0,o:.05,u:.022,round:1,w:.55}},pose:{pitch:-6}},
  angry:{face:{browLift:-.018,browTilt:-.06,browArch:-.004,lidU:.32,lidSlope:.55,lidL:.16,gaze:[0,.006],mouth:{s:-.014,o:.02,u:-.004,teeth:1,teethH:.55,w:.95}},pose:{pitch:7}},
  sad:{face:{browLift:-.008,browTilt:.05,browArch:-.012,lidU:.5,lidSlope:-.6,lidL:.06,gaze:[.008,-.024],mouth:{s:-.03,w:.95}},pose:{pitch:14,roll:5}},
  thinking:{face:{browUp:[.032,-.01],lidU:.18,gaze:[-.018,.02],mouth:{s:.004,asym:-.01,w:.75,shift:-.025}},pose:{roll:-8,yaw:-8}}
 };
 const EYE_CHART={open:{lidU:0},half:{lidU:.5},closed:{lidU:1},'happy arc':{lidL:.62,lidArc:.75},'look left':{gaze:[-.024,0],lidU:.08},'look right':{gaze:[.024,0],lidU:.08},'look up':{gaze:[0,.024],browLift:.012}};
 const MOUTH_CHART={rest:{s:.006},'M B P':{s:0,th:1.5,w:.78},A:{s:.008,o:.065,u:.01},E:{s:.014,o:.024,w:1.2,teeth:1},O:{o:.048,u:.022,round:1,w:.55},'F V':{s:0,o:.016,w:.85,teeth:1,teethH:.7},smile:{s:.032,w:1.1},frown:{s:-.026,w:.9}};
 const HAND_POSES=['open','point','fist'];
 return{DEV,EMOTIONS,EYE_CHART,MOUTH_CHART,HAND_POSES};
});
