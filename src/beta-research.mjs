// P10 consented, local-only creator usability and willingness-to-pay research.
// Never sends data anywhere and never converts hypothetical interest into sales.
export const TASKS=Object.freeze(['preview','scrub','save-still','export','reopen']);
export const FUNNEL=Object.freeze(['session-start','preview-ready','scrub-success','still-saved',
 'export-attempt','export-success','reopen-success','error','session-end']);
export const PRICE_CHOICES=Object.freeze(['none','3','7','12','20','unsure']);
const MAX_EVENTS=300;
export function createResearchSession({clock=()=>performance.now(),consent=false}={}){
 let enabled=consent,opened=clock(),events=[],responses=null;
 const record=(type,details={})=>{
   if(!enabled)return false;
   if(!FUNNEL.includes(type))throw Error('Unknown consented user-study event');
   if(events.length>=MAX_EVENTS)return false;
   if(details&&Object.keys(details).some(k=>!['task','reason','stage'].includes(k)))
     throw Error('User study only accepts allowlisted nonidentifying fields');
   if(details.task&&!TASKS.includes(details.task))throw Error('Unknown study task');
   if(details.reason&&(typeof details.reason!=='string'||details.reason.length>80))
     throw Error('Invalid error description');
   events.push({type,ms:Math.max(0,Math.round(clock()-opened)),...details});
   return true;
 };
 return Object.freeze({
   consent:(next)=>{if(next!==true&&next!==false)throw TypeError('Consent must be explicit');
     if(!next){enabled=false;events=[];responses=null;}else{enabled=true;opened=clock()}},
   record,
   respond:(r)=>{
     if(!enabled)throw Error('Opt in before saving feedback');
     if(!r||!['complete','partial','blocked','not-tried'].includes(r.outcome)||
       !PRICE_CHOICES.includes(r.monthlyPrice)||
       !Number.isInteger(r.ease)||r.ease<1||r.ease>5||
       !Number.isInteger(r.quality)||r.quality<1||r.quality>5)
       throw Error('Incomplete research response');
     if(r.blocker!==undefined&&(typeof r.blocker!=='string'||r.blocker.length>360))
       throw Error('Feedback must be <=360 characters');
     responses={outcome:r.outcome,monthlyPrice:r.monthlyPrice,ease:r.ease,
       quality:r.quality,blocker:r.blocker||''};
   },
   export:()=>{
     if(!enabled)throw Error('Feedback export requires opt-in');
     return {schema:'frameforge.beta-study/1',consent:true,generatedBy:'local session',
       events:events.map(x=>({...x})),responses:responses?{...responses}:null,
       disclaimer:'No network collection. This is a participant-authored artifact, not a real conversion or purchase.'};
   },
   get enabled(){return enabled}
 });
}
export function summarizeResearch(exports){
 if(!Array.isArray(exports))throw TypeError('Participants must be actual, separately provided opt-in exports');
 const participants=exports.filter(x=>x?.schema==='frameforge.beta-study/1'&&x.consent===true&&x.responses);
 const n=participants.length;
 const outcome=Object.fromEntries(['complete','partial','blocked','not-tried'].map(k=>[k,participants.filter(x=>x.responses.outcome===k).length]));
 const willingness=Object.fromEntries(PRICE_CHOICES.map(p=>[p,participants.filter(x=>x.responses.monthlyPrice===p).length]));
 const completed=participants.filter(x=>x.responses.outcome==='complete');
 return {participants:n,taskCompletionRate:n?completed.length/n:null,
   outcome,willingness,averageEase:n?participants.reduce((a,x)=>a+x.responses.ease,0)/n:null,
   averageQuality:n?participants.reduce((a,x)=>a+x.responses.quality,0)/n:null,
   actualPaidCustomers:0,
   confidence:'Exploratory self-selected usability interviews, not statistically representative demand',
   recommendation:n<5?'Not enough interview data: interview 5 creators without leading them':
     completed.length/n<.7?'Prioritize basic usability and first-export success before monetization':
       'Continue larger, independently sampled cohort tests; willingness to pay is not proven revenue'};
}