/* FrameForge robot design directions (M3.1): three ways to draw BLUE and ORANGE as a matched pair, and the face
   channels for the seven emotions, shared by the sheet page and by the three.js build of the chosen direction.
   BLUE is the eager one ("I can make it instant"): small, round, quick, one antenna. ORANGE is the deadpan one
   ("Backup created. Emotionally."): taller, squarer, heavy-lidded, ears instead of an antenna.
   Units: DEV's (his head is 1 tall, he stands about 2 tall); ground at y = 0. Forms: design/robot-forms.js. */
(function(root,factory){
 const lib=factory();
 if(typeof module==='object'&&module.exports)module.exports=lib;
 else root.FrameForgeRobotDirections=lib;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const DIRS=[
  {id:'A',name:'Capsule & visor',
   notes:['Smooth capsule heads with one big dark visor; the face is light on glass','Hover on a small thruster: no legs, quick and floaty','BLUE: round with a ball antenna and pill eyes; ORANGE: a flat-topped box head, ear discs, round eyes and an LED mouth'],
   blue:{mat:'blueShell',deep:'blueDeep',accent:'violet',
    head:{c:[0,1.0,0],r:[.36,.29,.3],n:[2.6,2.8],seg:[14,9]},
    face:{screen:{w:.5,h:.31,r:.11,y:-.01},color:'blueFace',dim:'blueFaceDim',
     eyes:{style:'pill',x:.1,y:.01,rx:.034,ry:.066},mouth:{style:'line',y:-.095,w:.05,th:.016,s:.008}},
    antennae:[{base:[0,.27,0],tip:[.05,.17,0],r:.012,ball:.036}],
    neck:{top:[0,.74,0],bot:[0,.62,0],r:.055},
    body:{c:[0,.42,0],r:[.22,.21,.19],n:[2.2,2.2],seg:[12,8],top:.92},
    chest:[{shape:'circle',x:0,y:.03,r:.045,fill:'blueFace'}],
    arms:{style:'float',hand:[.31,.42,.04],size:[.062,.076,.056]},
    base:{type:'hover',top:.24,bot:.11,r:.1,z:1}},
   orange:{mat:'orangeShell',deep:'orangeDeep',accent:'violet',
    head:{c:[0,1.2,0],r:[.4,.28,.3],n:[3.4,4],seg:[12,8]},
    face:{screen:{w:.6,h:.27,r:.07,y:-.01},color:'orangeFace',dim:'orangeFaceDim',
     eyes:{style:'round',x:.13,y:.02,rx:.047,ry:.047},mouth:{style:'segments',y:-.08,w:.1,th:.022,n:5}},
    ears:[{x:.4,y:0,r:.075,len:.06,cap:'violet'}],
    neck:{top:[0,.94,0],bot:[0,.78,0],r:.06},
    body:{c:[0,.52,0],r:[.26,.26,.2],n:[3,3],seg:[12,8]},
    chest:[{x:0,y:.05,w:.16,h:.05,r:.012,fill:'orangeFace'}],
    arms:{style:'tube',shoulder:[.27,.66,0],elbow:[.33,.5,.02],wrist:[.34,.36,.04],r:.034,hand:[.35,.29,.05],size:[.066,.08,.06]},
    base:{type:'hover',top:.27,bot:.12,r:.12,z:1}}},
  {id:'B',name:'Retro box',
   notes:['Boxy CRT heads in a dark bezel, with scan lines; square pixel eyes and bar brows','Two short legs and boxy feet: they walk, and stand on the desk','BLUE: a square screen and a straight antenna; ORANGE: a wide TV, ring eyes, two bolt ears'],
   blue:{mat:'blueShell',deep:'blueDeep',accent:'violet',
    head:{c:[0,1.0,0],r:[.34,.3,.28],n:[6,6],seg:[8,6]},
    face:{screen:{w:.46,h:.34,r:.05,y:-.01,bezel:.028,lines:3},color:'blueFace',dim:'blueFaceDim',
     eyes:{style:'square',x:.1,y:.0,rx:.048,ry:.058},brows:{x:.1,y:.1,len:.075,th:.018},mouth:{style:'segments',y:-.1,w:.09,th:.02,n:5}},
    antennae:[{base:[.12,.29,0],tip:[0,.2,0],r:.012,ball:.032}],
    neck:{top:[0,.71,0],bot:[0,.66,0],r:.07},
    body:{c:[0,.5,0],r:[.22,.18,.17],n:[5,5],seg:[8,6]},
    chest:[{x:-.08,y:.05,w:.05,h:.05,r:.008,fill:'blueFace'},{x:.04,y:.05,w:.11,h:.03,r:.008,fill:'blueFaceDim'}],
    arms:{style:'tube',shoulder:[.24,.6,0],elbow:[.3,.48,.02],wrist:[.31,.37,.04],r:.03,hand:[.32,.31,.05],size:[.058,.07,.052]},
    base:{type:'legs',x:.1,top:.34,r:.036,foot:[.075,.05,.1]}},
   orange:{mat:'orangeShell',deep:'orangeDeep',accent:'violet',
    head:{c:[0,1.2,0],r:[.43,.28,.28],n:[6,6],seg:[8,6]},
    face:{screen:{w:.64,h:.32,r:.05,y:-.01,bezel:.03,lines:3},color:'orangeFace',dim:'orangeFaceDim',
     eyes:{style:'ring',x:.15,y:.01,rx:.055,ry:.055},brows:{x:.15,y:.1,len:.09,th:.018},mouth:{style:'line',y:-.09,w:.07,th:.016,s:0}},
    ears:[{x:.43,y:.02,r:.05,len:.05,cap:'violet'}],
    antennae:[{base:[-.2,.27,0],tip:[-.08,.13,0],r:.01,ball:.026},{base:[.2,.27,0],tip:[.08,.13,0],r:.01,ball:.026}],
    neck:{top:[0,.93,0],bot:[0,.82,0],r:.075},
    body:{c:[0,.6,0],r:[.27,.22,.2],n:[5,5],seg:[8,6]},
    chest:[{x:0,y:.06,w:.18,h:.04,r:.01,fill:'orangeFaceDim'},{shape:'circle',x:.12,y:-.06,r:.025,fill:'orangeFace'}],
    arms:{style:'tube',shoulder:[.29,.72,0],elbow:[.36,.57,.02],wrist:[.37,.44,.04],r:.034,hand:[.38,.37,.05],size:[.066,.08,.06]},
    base:{type:'legs',x:.13,top:.4,r:.042,foot:[.09,.055,.12]}}},
  {id:'C',name:'Round & ink',
   notes:['Round metal heads with the face drawn on the shell in ink, like DEV: big pupils, two glints, lids that carry the mood','One wheel each: they roll and lean','BLUE: a ball head with a curled antenna; ORANGE: a wider dome with a ridge and flat ear discs'],
   blue:{mat:'blueShell',deep:'blueDeep',accent:'violet',
    head:{c:[0,1.0,0],r:[.33,.31,.31],n:[2,2],seg:[14,10]},
    face:{ink:true,glints:true,color:'ink',eyes:{style:'round',x:.12,y:-.01,rx:.05,ry:.062},
     brows:{x:.12,y:.1,len:.085,th:.022},mouth:{style:'line',y:-.13,w:.055,th:.016,s:.01}},
    antennae:[{base:[0,.3,0],tip:[-.05,.16,0],bend:[.06,.04,0],r:.011,ball:.03}],
    neck:{top:[0,.72,0],bot:[0,.62,0],r:.05},
    body:{c:[0,.43,0],r:[.21,.2,.2],n:[2,2],seg:[12,8]},
    chest:[{shape:'circle',x:0,y:.04,r:.04,fill:'violetFlat'}],
    arms:{style:'float',hand:[.29,.42,.05],size:[.06,.072,.055]},
    base:{type:'wheel',top:.25,r:.1,w:.08}},
   orange:{mat:'orangeShell',deep:'orangeDeep',accent:'violet',
    head:{c:[0,1.2,0],r:[.4,.3,.31],n:[2.4,2.6],seg:[14,10],top:.92,
     crest:{c:[0,.27,-.02],r:[.07,.06,.24],n:[2.6,2.6]}},
    face:{ink:true,glints:true,color:'ink',eyes:{style:'round',x:.14,y:-.01,rx:.052,ry:.058},
     brows:{x:.14,y:.1,len:.1,th:.024},mouth:{style:'line',y:-.13,w:.06,th:.016,s:0}},
    ears:[{x:.4,y:-.02,r:.08,len:.04,mat:'orangeDeep'}],
    neck:{top:[0,.92,0],bot:[0,.78,0],r:.055},
    body:{c:[0,.52,0],r:[.25,.24,.22],n:[2.3,2.3],seg:[12,8]},
    chest:[{x:0,y:.04,w:.12,h:.035,r:.012,fill:'violetFlat'}],
    arms:{style:'tube',shoulder:[.26,.62,0],elbow:[.32,.48,.02],wrist:[.33,.36,.04],r:.032,hand:[.34,.3,.05],size:[.064,.078,.058]},
    base:{type:'wheel',top:.28,r:.12,w:.1}}}
 ];
 // The seven emotions as face channels (see faceShapes in robot-forms.js) and the head pose that goes with each.
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
 function expression(robot,emotion){
  const e=EMOTIONS[emotion]||EMOTIONS.neutral,face={...e.face};
  if(robot==='orange')Object.assign(face,DEADPAN[emotion]||{});
  return{face,pose:e.pose};
 }
 return{DIRS,EMOTIONS,expression,ORDER:['neutral','happy','worried','surprised','angry','sad','thinking']};
});
