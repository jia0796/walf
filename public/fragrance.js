// Independent binding state; no imports from the host or wolf-beauty module.
export const fragranceState=()=>({knownWolf:null,binding:null,used:false,consumedNight:null,consumedContext:null,announcements:[],announcementIndex:0});
export const fragranceActor=s=>s.players.find(p=>p.active&&p.alive&&p.role==='fragrance');
export const bondAvailable=s=>!!fragranceActor(s)&&!s.fragrance.used&&!s.winner;
export function ensureKnownWolf(s,random=Math.random){
 if(s.fragrance.knownWolf!=null)return s.fragrance.knownWolf;
 const wolves=s.players.filter(p=>p.active&&p.role==='wolf');if(!wolves.length)return null;
 return s.fragrance.knownWolf=wolves[Math.floor(random()*wolves.length)].id;
}
export function bindingBatch(s,deaths,{enabled=!s.fragrance?.used,binding=s.fragrance?.binding}={}){
 if(!enabled||!binding||binding.night!==s.night||binding.targets.length!==2)return {deaths,linked:[],consumed:false};
 deaths=deaths.filter((d,i)=>deaths.findIndex(x=>x.id===d.id)===i);
 const ids=new Set(deaths.map(d=>d.id)),trigger=deaths.find(d=>binding.targets.includes(d.id));if(!trigger)return {deaths,linked:[],consumed:false};
 const other=binding.targets.find(id=>id!==trigger.id),alive=s.players.find(p=>p.id===other)?.alive;
 if(ids.has(other)||!alive)return {deaths,linked:[],consumed:true};
 const linked={id:other,cause:'heartbreak',source:'fragranceBond',sourceActor:trigger.id,sourceRole:s.players.find(p=>p.id===trigger.id)?.role,context:trigger.context||'night',day:s.night};
 return {deaths:[...deaths,linked],linked:[linked],consumed:true};
}
export function consumeBinding(s,context){s.fragrance.used=true;s.fragrance.consumedNight=s.night;s.fragrance.consumedContext=context;}
