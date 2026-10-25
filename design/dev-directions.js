/* FrameForge DEV design directions (M1.1): the three specs and the expression channels, shared by the sheet page
   and by the three.js build of the chosen direction. Units: head height = 1, head centre at the origin, x toward the
   character's left, y up, z toward the viewer. */
(function(root,factory){
 const lib=factory();
 if(typeof module==='object'&&module.exports)module.exports=lib;
 else root.FrameForgeDevDirections=lib;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 // Hair chunks: {at:[t,phi]} is the root on the skull (t: 0 crown .. 1 chin; phi: 0 front, + toward the character's
 // left); via bends the blade and to is its tip, both offsets from the root. Every quiff sweeps to the character's right.
 // Arrays are the older skull-point form [t,phi,lift x3, half-width, thickness], used for short side and nape tufts.
 const DIRS=[
  {id:'A',name:'Round & soft',seed:7,heads:'2.1 heads tall: big cranium, small body',
   notes:['Wide round cranium, soft short jaw, small features set low (eye line 60%)','A smooth side-swept wave quiff with a lifted front lip','Ink-oval eyes; skin lids cut them (a crescent when happy); rounded brows; thick round glasses'],
   head:{w:[[0,.5],[.3,.55],[.55,.55],[.75,.5],[.9,.43],[1,.38]],f:[[0,.46],[.4,.49],[.6,.5],[.8,.48],[1,.43]],b:[[0,.48],[.35,.53],[.6,.48],[.8,.35],[1,.22]],
    zc:[[0,-.02],[.5,0],[1,.05]],n:2.1,nyTop:2.05,nyBot:2.1,bumps:[{t:.7,phi:.75,st:.09,sp:.4,a:.05}],detail:2,jitter:[.02,.08,.018]},
   face:{eyes:{style:'ink',x:.16,y:-.1,rx:.043,ry:.06},brows:{x:.16,y:.045,len:.11,th:.032,arch:.012},
    glasses:{x:.16,y:-.1,r:.1,w:.028,d:.02,gap:.034,wrap:.3,segs:12},
    nose:{y:-.2,size:[.056,.04,.05],detail:1,out:.45},mouth:{y:-.29,w:.072,th:.02},ear:{y:-.13,size:[.045,.1,.075]}},
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
    hood:{y:-.585,ax:.22,az:.185,r:[.095,.08],from:62,drop:.04},pocket:{top:-.86,bot:-1.0,tw:.15,bw:.19},strings:{x:.055,top:-.6,bot:-.78},
    arm:{shoulder:[.3,-.65,0],elbow:[.37,-.83,0],wrist:[.39,-.98,.03],r:[.085,.078,.07],cuff:.045,hand:[.062,.072,.058]},
    leg:{x:.125,top:-1.0,bot:-1.42,r:.1,shoe:[.085,.06,.135]},ground:-1.5}},
  {id:'B',name:'Lean & sharp',seed:11,heads:'2.8 heads tall: older, longer limbs',
   notes:['Narrow head with cheekbones and a pointed chin; eye line 54%','A tall, spiky crest quiff over tight sides','Eyes with whites, small pupils and a lash line; thin angled brows; thin round glasses'],
   head:{w:[[0,.42],[.3,.44],[.55,.44],[.7,.41],[.85,.32],[1,.2]],f:[[0,.44],[.4,.46],[.6,.47],[.85,.47],[1,.46]],b:[[0,.46],[.35,.5],[.6,.44],[.8,.3],[1,.18]],
    zc:[[0,-.03],[.5,0],[1,.1]],n:[[0,2.1],[.5,2.5],[1,2.6]],nyTop:2,nyBot:1.85,bumps:[{t:.6,phi:.9,st:.06,sp:.3,a:.06},{t:.94,phi:0,st:.05,sp:.35,a:.1}],detail:2,jitter:[.02,.08,.018]},
   face:{eyes:{style:'white',x:.145,y:-.04,hw:.055,hu:.034,hl:.022,pr:.024,lash:.014,tilt:.006},brows:{x:.15,y:.065,len:.14,th:.02,arch:.004,kink:-.014,taper:1},
    glasses:{x:.145,y:-.04,r:.088,w:.015,d:.016,gap:.036,wrap:.3,segs:14},
    nose:{y:-.15,size:[.04,.085,.065],detail:1,tip:.25,out:.4},mouth:{y:-.275,w:.08,th:.016,teeth:1},ear:{y:-.08,size:[.042,.1,.07]}},
   hair:{line:[[0,.29],[.9,.33],[1.57,.44],[2.3,.5],[3.14,.72]],part:0,thick:.03,volume:[],chunks:[
    {at:[.29,.55],via:[0,.4,.12],to:[-.2,.5,-.04],w:.09,th:.05},
    {at:[.29,.28],via:[-.04,.44,.12],to:[-.32,.5,-.08],w:.1,th:.05},
    {at:[.3,0],via:[-.07,.4,.1],to:[-.42,.42,-.1],w:.1,th:.05},
    {at:[.31,-.3],via:[-.08,.32,.08],to:[-.46,.3,-.12],w:.09,th:.045},
    {at:[.33,-.6],via:[-.06,.22,.05],to:[-.42,.14,-.12],w:.08,th:.04},
    {at:[.16,.9],via:[-.06,.3,-.08],to:[-.3,.36,-.26],w:.1,th:.05},
    {at:[.1,-1.3],via:[-.1,.2,-.1],to:[-.36,.18,-.3],w:.1,th:.045},
    {at:[.22,2.6],via:[-.06,.12,-.12],to:[-.2,.1,-.3],w:.1,th:.04},
    {at:[.38,1.35],via:[.03,.03,-.08],to:[.02,.02,-.2],w:.06,th:.025},
    {at:[.38,-1.35],via:[-.03,.03,-.08],to:[-.02,.02,-.2],w:.06,th:.025}]},
   body:{neck:{r:.095,z:-.02,bot:-.64},trunk:[[-.58,.17,.12,.12,2.4],[-.62,.29,.17,.17,2.6],[-.69,.36,.2,.19,2.6],[-1.0,.33,.2,.18,2.6],[-1.24,.34,.2,.18,2.5],[-1.3,.32,.19,.17,2.4]],
    hood:{y:-.6,ax:.2,az:.165,r:[.095,.08],from:62,drop:.04},pocket:{top:-1.06,bot:-1.22,tw:.14,bw:.18},strings:{x:.05,top:-.64,bot:-.86},
    arm:{shoulder:[.32,-.7,0],elbow:[.38,-1.0,-.01],wrist:[.4,-1.26,.04],r:[.078,.07,.062],cuff:.045,hand:[.058,.068,.052]},
    leg:{x:.125,top:-1.22,bot:-2.0,r:.095,shoe:[.08,.058,.135]},ground:-2.08}},
  {id:'C',name:'Chunky & bold',seed:5,heads:'2.4 heads tall: broad, sturdy',
   notes:['Broad soft-square head, jaw as wide as the cranium; eye line 58%','A fluffy quiff of fat tufts that flops to the side','Big glossy pupils with two glints; heavy upper lids carry the mood; chunky wedge brows; big round glasses'],
   head:{w:[[0,.54],[.3,.56],[.6,.57],[.8,.57],[.92,.54],[1,.5]],f:[[0,.46],[.5,.5],[.85,.5],[1,.48]],b:[[0,.48],[.4,.5],[.7,.46],[.85,.34],[1,.24]],
    zc:[[0,-.02],[1,.04]],n:[[0,2.6],[.5,3.2],[1,3.4]],nyTop:2.5,nyBot:3,bumps:[{t:.72,phi:.7,st:.09,sp:.4,a:.04}],detail:2,jitter:[.02,.08,.018]},
   face:{eyes:{style:'glossy',x:.17,y:-.085,rx:.052,ry:.064,lid:.014},brows:{x:.172,y:.075,len:.12,th:.044,arch:.006,taper:1},
    glasses:{x:.17,y:-.085,r:.12,w:.025,d:.02,gap:.034,wrap:.25,segs:12},
    nose:{y:-.19,size:[.07,.052,.055],detail:1,out:.45},mouth:{y:-.3,w:.095,th:.022},ear:{y:-.12,size:[.048,.1,.076]}},
   hair:{line:[[0,.31],[.9,.35],[1.57,.48],[2.3,.52],[3.14,.75]],part:.03,thick:.07,volume:[{t:.1,phi:0,st:.18,sp:1.4,a:.03}],chunks:[
    {at:[.3,.5],via:[-.03,.17,.13],to:[-.13,.2,.1],w:.13,th:.085},
    {at:[.3,.2],via:[-.05,.18,.14],to:[-.2,.14,.13],w:.13,th:.085},
    {at:[.31,-.1],via:[-.06,.14,.13],to:[-.23,0,.14],w:.125,th:.08},
    {at:[.34,-.42],via:[-.05,.06,.11],to:[-.17,-.13,.1],w:.11,th:.075},
    {at:[.08,-.45],via:[-.05,.17,0],to:[-.15,.25,-.07],w:.13,th:.085},
    {at:[.14,.35],via:[-.02,.12,.04],to:[-.08,.15,-.02],w:.12,th:.075},
    {at:[.06,1.2],via:[.05,.09,-.03],to:[.11,.1,-.13],w:.1,th:.065},
    {at:[.14,1.6],via:[.08,.1,-.04],to:[.2,.12,-.14],w:.11,th:.07},
    {at:[.18,2.7],via:[0,.1,-.1],to:[.04,.1,-.24],w:.12,th:.075},
    {at:[.4,1.25],via:[.07,.02,0],to:[.15,-.04,-.02],w:.08,th:.05},
    {at:[.42,-1.3],via:[-.08,.01,0],to:[-.16,-.05,-.03],w:.08,th:.05},
    {at:[.55,2.5],via:[.02,-.06,-.06],to:[.04,-.14,-.08],w:.09,th:.05},
    {at:[.55,-2.5],via:[-.02,-.06,-.06],to:[-.04,-.14,-.08],w:.09,th:.05}]},
   body:{neck:{r:.12,z:-.03,bot:-.6},trunk:[[-.55,.2,.15,.15,2.4],[-.59,.33,.2,.2,2.8],[-.66,.41,.24,.23,2.9],[-.9,.41,.25,.23,2.9],[-1.1,.42,.25,.23,2.8],[-1.17,.39,.23,.22,2.6]],
    hood:{y:-.585,ax:.25,az:.2,r:[.1,.085],from:62,drop:.04},pocket:{top:-.93,bot:-1.09,tw:.17,bw:.21},strings:{x:.06,top:-.6,bot:-.8},
    arm:{shoulder:[.37,-.67,0],elbow:[.44,-.87,0],wrist:[.46,-1.06,.03],r:[.1,.092,.082],cuff:.045,hand:[.075,.085,.068]},
    leg:{x:.15,top:-1.1,bot:-1.62,r:.115,shoe:[.095,.065,.145]},ground:-1.7}}
 ];
 // Expressions use the face channels the engine already has: brow lift/tilt, lids, gaze, smile, mouth open, round.
 const EXPR={
  neutral:{face:{browArch:0,lidU:.06,mouth:{s:.012}},pose:{}},
  happy:{face:{browLift:.016,browArch:.012,lidL:.62,lidArc:.75,mouth:{s:.032,o:.052,u:-.004,teeth:1}},pose:{roll:7,pitch:-4}},
  worried:{face:{browLift:.01,browTilt:.05,browArch:-.006,lidU:.2,lidSlope:-.45,lidL:.08,gaze:[-.012,-.012],mouth:{s:-.016,o:.013,asym:.005}},pose:{roll:-5,pitch:5}},
  surprised:{face:{browLift:.045,browTilt:.01,browArch:.02,lidU:-.02,eyeScale:1.17,pupil:.75,mouth:{s:0,o:.05,u:.022,round:1}},pose:{pitch:-6}}
 };
 // Mouth width follows the expression: wide smile, small worry, round O.
 const MOUTH_W={happy:1.2,worried:.8,surprised:.55,neutral:1};
 return{DIRS,EXPR,MOUTH_W};
});
