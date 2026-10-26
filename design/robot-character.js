/* FrameForge BLUE and ORANGE, the design for the model sheet (M3.2) and the three.js build (M3.3). Direction A
   (capsule & visor) from design/robot-directions.js, picked provisionally to keep M3 moving: the user has not
   approved it yet, so the sheet says so. Units: DEV's (his head is 1 tall); ground at y = 0. Forms: design/robot-forms.js. */
(function(root,factory){
 const lib=factory();
 if(typeof module==='object'&&module.exports)module.exports=lib;
 else root.FrameForgeRobots=lib;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const STATUS='provisional: direction A picked to continue M3, awaiting the user\'s approval';
 const ROBOTS={
  // BLUE: eager and quick. Round capsule head, pill eyes and a line mouth on a big visor, ball antenna, floating hands.
  blue:{id:'blue',name:'BLUE',mat:'blueShell',deep:'blueDeep',accent:'violet',
   head:{c:[0,1.0,0],r:[.36,.29,.3],n:[2.6,2.8],seg:[14,9]},
   face:{screen:{w:.5,h:.31,r:.11,y:-.01},color:'blueFace',dim:'blueFaceDim',
    eyes:{style:'pill',x:.1,y:.01,rx:.034,ry:.066},mouth:{style:'line',y:-.095,w:.05,th:.016,s:.008}},
   antennae:[{base:[0,.27,0],tip:[.05,.17,0],r:.012,ball:.036}],
   neck:{top:[0,.74,0],bot:[0,.62,0],r:.055},
   body:{c:[0,.42,0],r:[.22,.21,.19],n:[2.2,2.2],seg:[12,8],top:.92},
   chest:[{shape:'circle',x:0,y:.03,r:.045,fill:'blueFace'}],
   arms:{style:'float',hand:[.31,.42,.04],size:[.062,.076,.056]},
   base:{type:'hover',top:.24,bot:.11,r:.1,z:1}},
  // ORANGE: deadpan. Taller, a flat-topped box head, heavy-lidded round eyes and an LED mouth, ear discs, jointed arms.
  orange:{id:'orange',name:'ORANGE',mat:'orangeShell',deep:'orangeDeep',accent:'violet',
   head:{c:[0,1.3,0],r:[.4,.28,.3],n:[3.4,4],seg:[12,8]},
   face:{screen:{w:.6,h:.27,r:.07,y:-.01},color:'orangeFace',dim:'orangeFaceDim',
    eyes:{style:'round',x:.13,y:.02,rx:.047,ry:.047},mouth:{style:'segments',y:-.08,w:.1,th:.022,n:5}},
   ears:[{x:.4,y:0,r:.075,len:.06,cap:'violet'}],
   neck:{top:[0,1.04,0],bot:[0,.84,0],r:.06},
   body:{c:[0,.56,0],r:[.26,.29,.2],n:[3,3],seg:[12,8]},
   chest:[{x:0,y:.06,w:.16,h:.05,r:.012,fill:'orangeFace'}],
   arms:{style:'tube',shoulder:[.27,.72,0],elbow:[.33,.55,.02],wrist:[.34,.4,.04],r:.034,hand:[.35,.33,.05],size:[.066,.08,.06]},
   base:{type:'hover',top:.27,bot:.12,r:.12,z:1}}
 };
 // The seven emotions as face channels (robot-forms.js faceShapes) and the head pose that goes with each.
 const EMOTIONS={
  neutral:{face:{},pose:{}},
  happy:{face:{lidL:1,browLift:.02,mouth:{s:.03,w:1.15}},pose:{roll:7,pitch:-4}},
  worried:{face:{lidU:.14,lidSlope:-.5,browLift:.016,browTilt:.07,gaze:[-.012,-.006],mouth:{s:-.02,w:.8}},pose:{roll:-5,pitch:3}},
  surprised:{face:{scale:1.25,browLift:.04,mouth:{round:1,o:.05,w:.6}},pose:{pitch:-6}},
  angry:{face:{lidU:.36,lidSlope:.6,browLift:-.012,browTilt:-.07,mouth:{s:-.022,w:.95}},pose:{pitch:7}},
  sad:{face:{lidU:.46,lidSlope:-.6,browTilt:.06,gaze:[0,-.02],mouth:{s:-.035,w:.85}},pose:{pitch:12,roll:5}},
  thinking:{face:{lidUL:.36,lidUR:.06,gaze:[-.022,.024],browUp:[.03,-.004],mouth:{s:0,w:.6,shift:-.02}},pose:{roll:-8,yaw:-8}}
 };
 // ORANGE is deadpan: heavy upper lids unless something really surprises him.
 const DEADPAN={neutral:{lidU:.34},worried:{lidU:.3},angry:{lidU:.48},thinking:{lidUL:.5,lidUR:.3},sad:{lidU:.55}};
 // Eyes and mouths for the sheet's charts; the mouth chart is also how the robots speak (one shape per viseme).
 const EYE_CHART={open:{},half:{lidU:.5},closed:{lidU:1},'happy arc':{lidL:1},'look left':{gaze:[-.03,0]},'look right':{gaze:[.03,0]},'look up':{gaze:[0,.03]}};
 const MOUTH_CHART={rest:{},'M B P':{s:0,w:.8},A:{o:.05,w:1},E:{o:.022,w:1.3},O:{round:1,o:.045,w:.55},'F V':{o:.014,w:.9},smile:{s:.03,w:1.15},frown:{s:-.03,w:.9}};
 const VISEME_MOUTH={closed:'M B P',round:'O',wide:'E',teeth:'F V',open:'A'};
 // Face channels at a moment: the emotion's face, plus the shape of the sound being spoken (scaled by how loud it
 // is), a blink and where the robot looks (gaze x -1..1 toward screen left/right).
 function face(who,emotion,{viseme=null,open=0,blink=false,look=0}={}){
  const e=EMOTIONS[emotion]||EMOTIONS.neutral,out={...e.face};
  if(who==='orange')Object.assign(out,DEADPAN[emotion]||{});
  const g=out.gaze||[0,0];out.gaze=[g[0]+look*.022,g[1]];
  if(viseme&&open>.02){
   const m=MOUTH_CHART[VISEME_MOUTH[viseme]]||MOUTH_CHART.A,k=Math.min(1,open*1.4);
   out.mouth={...(out.mouth||{}),...m,o:(m.o??0)*k+(m.round?0:.006*k),w:(m.w??1)};
  }
  if(blink){out.lidU=.9;out.lidSlope=0;delete out.lidUL;delete out.lidUR;delete out.lidL;}
  return out;
 }
 const pose=emotion=>(EMOTIONS[emotion]||EMOTIONS.neutral).pose;
 return{STATUS,ROBOTS,EMOTIONS,DEADPAN,EYE_CHART,MOUTH_CHART,VISEME_MOUTH,face,pose,ORDER:['neutral','happy','worried','surprised','angry','sad','thinking']};
});
