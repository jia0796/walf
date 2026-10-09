import {ROLE_DATA} from './data.js';
const liveRole=(s,role)=>s.players.find(p=>p.alive&&p.role===role);
export const ordinaryWolves=s=>s.players.filter(p=>p.alive&&['wolf','king'].includes(p.role));
export const basicActor=s=>ordinaryWolves(s)[0]||liveRole(s,'mechanical');
export function mechanicalAbility(s){
 const m=s.mechanical,actor=liveRole(s,'mechanical');
 if(!actor||!m?.role)return null;
 if(m.role==='wolf')return (s.rules.mechanicalKnife==='allDead'?ordinaryWolves(s).length===0:s.night>m.night)?'extraAttack':null;
 if(s.night<=m.night)return null;
 if(m.role==='medium')return 'mechanicalInspect';
 if(m.role==='witch'&&(m.poison||s.nightAction.mechanicalPoison))return 'mechanicalPoison';
 if(m.role==='guard'&&(m.shield||s.nightAction.shield))return 'shield';
 return null;
}
export function trueWinner(s){
 if(!s.rolesConfirmed)return null;
 const live=s.players.filter(p=>p.alive),wolf=p=>ROLE_DATA[p.role]?.kind==='wolf';
 if(!live.some(wolf))return '好人陣營';
 if(s.rules.victory==='city'?!live.some(p=>!wolf(p)):!live.some(p=>ROLE_DATA[p.role]?.kind==='god')||!live.some(p=>p.role==='villager'))return '狼人陣營';
 return null;
}
// Preserve independent attacks; defenses are spent per hit, never per target.
export function settleNight(s){
 const n=s.nightAction,exchange=n.exchange||[],map=id=>id===exchange[0]?exchange[1]:id===exchange[1]?exchange[0]:id;
 const ability=mechanicalAbility(s),mechanical=liveRole(s,'mechanical'),actor=basicActor(s);
 const attacks=[];
 if(actor&&n.attack)attacks.push({id:map(n.attack),cause:'attack',sourceActor:actor.id,sourceRole:actor.role,source:'basic'});
 if(ability==='extraAttack'&&n.extraAttack)attacks.push({id:n.extraAttack,cause:'attack',sourceActor:mechanical.id,sourceRole:'mechanical',source:'extra'});
 const shield=ability==='shield'?n.shield:null,guard=liveRole(s,'guard')?n.guard:null,cure=n.antidote===true?map(n.attack):null;
 let guardUsed=false,cureUsed=false;const events=[],dead=new Map();
 for(const attack of attacks){
  let blocked=null;
  if(shield===attack.id)blocked='shield';
  else if(guard===attack.id&&cure===attack.id)blocked=null;
  else if(guard===attack.id&&!guardUsed){guardUsed=true;blocked='guard';}
  else if(cure===attack.id&&!cureUsed){cureUsed=true;blocked='antidote';}
  events.push({...attack,blocked});
  if(!blocked&&s.players.find(p=>p.id===attack.id)?.alive&&!dead.has(attack.id))dead.set(attack.id,{...attack});
 }
 const projected=structuredClone(s);
 for(const id of dead.keys())projected.players.find(p=>p.id===id).alive=false;
 const attackWinner=trueWinner(projected);
 if(attackWinner)return {deaths:[...dead.values()],events,winner:attackWinner,poisonSkipped:true};
 const poisons=[];
 const witch=s.players.find(p=>p.role==='witch');
 if(n.poison===true&&n.poisonTarget&&witch)poisons.push({id:map(n.poisonTarget),cause:'poison',sourceActor:witch.id,sourceRole:'witch',source:'witch'});
 if(ability==='mechanicalPoison'&&n.mechanicalPoison)poisons.push({id:n.mechanicalPoison,cause:'poison',sourceActor:mechanical.id,sourceRole:'mechanical',source:'learnedPoison'});
 for(const poison of poisons){
  if(shield===poison.id){
   events.push({...poison,blocked:'shield'});
   if(s.rules.reflectPoison){const reflected={...poison,id:poison.sourceActor,source:'reflection'};events.push(reflected);if(s.players.find(p=>p.id===reflected.id)?.alive)dead.set(reflected.id,reflected);}
  }else {events.push({...poison,blocked:null});if(s.players.find(p=>p.id===poison.id)?.alive)dead.set(poison.id,{...poison});}
 }
 for(const id of dead.keys())projected.players.find(p=>p.id===id).alive=false;
 return {deaths:[...dead.values()],events,winner:trueWinner(projected),poisonSkipped:false};
}
