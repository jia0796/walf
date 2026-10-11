import {realWolf} from './identity.js';
export function heartbreakBatch(s,deaths){
 const beauty=s.players.find(p=>p.role==='beauty'),target=s.players.find(p=>p.id===s.charm?.target);
 const trigger=beauty&&deaths.find(d=>d.id===beauty.id&&(['exile','shot'].includes(d.cause)||d.cause==='poison'&&s.rules.poisonRomance));
 if(!trigger||!target?.alive||s.charm.night!==s.night)return {deaths,linked:[],blocked:[]};
 const ids=new Set(deaths.map(d=>d.id));const other=s.players.some(p=>p.alive&&realWolf(s,p)&&p.id!==beauty.id&&!ids.has(p.id));
 if(!other&&!s.rules.lastWolfRomance)return {deaths,linked:[],blocked:[]};
 const blocked=target.role==='hunter'?[target.id]:[];
 if(ids.has(target.id))return {deaths,linked:[],blocked};
 const d={id:target.id,cause:'heartbreak',source:'heartbreak',sourceActor:beauty.id,sourceRole:'beauty',context:trigger.context||'night',day:s.night};
 return {deaths:[...deaths,d],linked:[d],blocked};
}
