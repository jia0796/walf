import {ROLE_DATA} from './data.js';
import {ordinaryWolves,basicActor,inspectedWolf,tradeOutcome,mapTarget} from './night.js';
export function nightRecord(s){
 let record=s.nightRecords.find(r=>r.night===s.night);
 if(!record){record={night:s.night,events:[],deaths:[],settled:false};s.nightRecords.push(record);}
 return record;
}
// Snapshot actions when confirmed, before leaving the stage. Never infer from victims.
export function recordStage(s,stage,order){
 const n=s.nightAction,record=nightRecord(s),role=id=>s.players.find(p=>p.id===id)?.role||'villager';
 const actor=r=>s.players.find(p=>p.alive&&p.role===r)?.id;
 const map=id=>mapTarget(s,id);
 const apparent=id=>role(id)==='mechanical'?(s.mechanical.role||'mechanical'):role(id);
 const add=(key,actorRole,skill,targets,opts={})=>{
  if(!targets.length||!targets.every(Boolean))return;
  const actors=opts.actors||[actor(actorRole)];if(!actors[0])return;
  const effectiveTargets=opts.unmapped?targets:targets.map(map);
  record.events.push({key,night:s.night,stage,order,actors,actorRole:role(actors[0]),displayRole:actorRole,skill,rawTargets:[...targets],effectiveTargets,result:null,executed:!['wolf-attack','poison','antidote'].includes(skill),...opts});
 };
 if(stage==='fear'&&n.fear)add('fear','nightmare','fear',[n.fear],{unmapped:true});
 if(stage==='sleep'&&n.sleep)add('sleep','dream','sleep',[n.sleep],{unmapped:true});
 if(stage==='exchange'&&n.exchange.length===2)add('swap','magician','swap',n.exchange,{unmapped:true});
 if(stage==='attack'&&n.attack){const actors=ordinaryWolves(s).map(p=>p.id);if(!actors.length&&basicActor(s))actors.push(basicActor(s).id);add('basic','wolf','wolf-attack',[n.attack],{actors});}
 if(stage==='revenge'&&n.revenge)add('revenge','younger','wolf-attack',[n.revenge],{unmapped:true});
 if(stage==='antidote'&&n.antidote===true)add('antidote','witch','antidote',[n.attack]);
 if(stage==='poison'&&n.poison===true&&n.poisonTarget)add('poison','witch','poison',[n.poisonTarget]);
 if(stage==='inspect'&&n.inspect)add('inspect','seer','inspect',[n.inspect],{result:inspectedWolf(s,map(n.inspect))?'狼人':'好人'});
 if(stage==='guardTarget'&&n.guard)add('guard','guard','shield',[n.guard],{unmapped:true});
 if(stage==='mediumInspect'&&n.mediumInspect)add('medium','medium','inspect',[n.mediumInspect],{unmapped:true,result:ROLE_DATA[apparent(n.mediumInspect)]?.name});
 if(stage==='mechanicalAction'){
  if(n.learnTarget)add('learn','mechanical','learn',[n.learnTarget],{unmapped:true,result:'學習結果：'+ROLE_DATA[role(n.learnTarget)].name});
  for(const [field,skill] of Object.entries({extraAttack:'wolf-attack',mechanicalInspect:'inspect',mechanicalPoison:'poison',shield:'shield'}))if(n[field])add(field,'mechanical',skill,[n[field]],{unmapped:true,result:field==='mechanicalInspect'?ROLE_DATA[apparent(n[field])]?.name:null});
 }
 if(stage==='trade'&&n.tradeTarget&&n.tradeAbility)add('trade','merchant','trade',[n.tradeTarget],{unmapped:true,tradeSuccess:tradeOutcome(s,n.tradeTarget),tradeAbility:n.tradeAbility});
 if(stage==='luckyAction'&&s.lucky){
  const skill=s.lucky.ability,target=n[skill==='inspect'?'luckyInspect':'luckyPoison'];
  if(target)add('lucky','lucky',skill,[target],{actors:[s.lucky.seat],actorRole:role(s.lucky.seat),result:skill==='inspect'?(inspectedWolf(s,map(target))?'狼人':'好人'):null});
 }
}
export function recordDeaths(s,deaths){
 const r=nightRecord(s);
 for(const d of deaths)if(d.context==='night'&&!r.deaths.some(x=>x.id===d.id))r.deaths.push(structuredClone(d));
}
export function recapNights(s){return [...s.nightRecords].sort((a,b)=>a.night-b.night).map(r=>({...r,events:[...r.events].filter(e=>e.executed).sort((a,b)=>a.order-b.order)}));}
