import {realWolf,nativeAllowed,converted} from './identity.js';
import {ROLE_DATA} from './data.js';
export function mapTarget(s,id){const [a,b]=s.nightAction.exchange;return id===a?b:id===b?a:id;}
export const aliveForVictory=(s,p)=>p.alive&&!(p.role==='idiot'&&s.idiot?.revealed&&s.idiot.countsEliminatedForVictory);
export const eligibleVoters=s=>s.players.filter(p=>p.active&&p.alive&&!(p.role==='idiot'&&s.idiot?.voteLost));
export const eligibleExileTarget=(s,p)=>!!p?.active&&p.alive&&!(p.role==='idiot'&&s.idiot?.exileBanned);
export function mixedResult(s){const m=s.mixed;if(!m?.chosen||!s.winner)return null;return {seat:m.seat,target:m.target,targetRole:m.targetRole,camp:m.camp,won:m.camp===s.winner};}
const liveRole=(s,role)=>s.players.find(p=>p.alive&&p.role===role&&nativeAllowed(s,p));
export const ordinaryWolves=s=>s.players.filter(p=>p.alive&&(['wolf','king','elder','nightmare','blood','gargoyle'].includes(p.role)||(converted(s,p)&&!nativeAllowed(s,p)||(p.role==='younger'&&s.brothers?.joinNight!=null&&s.night>=s.brothers.joinNight))));
export const revengeAvailable=s=>!!liveRole(s,'younger')&&s.brothers?.revengeNight===s.night&&!s.brothers.revengeUsed;
export const revengeRecorded=s=>!!liveRole(s,'younger')&&s.brothers?.revengeNight===s.night&&(revengeAvailable(s)||s.brothers.revengeUsedNight===s.night);
export const canTrade=s=>!!liveRole(s,'merchant')&&!s.merchant?.used;
export function tradeOutcome(s,id){return ROLE_DATA[s.players.find(p=>p.id===id)?.role]?.kind!=='wolf';}
export const feared=(s,id)=>!!id&&s.nightAction.fearApplied&&s.nightAction.fear===id;
export const fearedRole=(s,role)=>s.players.some(p=>p.alive&&p.role===role&&feared(s,p.id));
export const bloodSealed=s=>s.blood?.sealNight===s.night;
export const skillBlocked=(s,role)=>s.players.some(p=>p.role===role&&!nativeAllowed(s,p))||fearedRole(s,role)||(bloodSealed(s)&&ROLE_DATA[role]?.kind==='god');
export const forcedEmpty=s=>s.nightAction.fearApplied&&s.players.find(p=>p.id===s.nightAction.fear)?.role==='wolf';
export function inspectedWolf(s,id){if(s.gargoyle?.target===id)return s.night>1;const p=s.players.find(p=>p.id===id);return p?.role==='younger'&&liveRole(s,'elder')&&!s.nightState?.deaths?.some(d=>s.players.find(p=>p.id===d.id)?.role==='elder')?false:ROLE_DATA[p?.role]?.kind==='wolf';}
export function luckyAbility(s){const l=s.lucky;if(!l||!s.players.find(p=>p.id===l.seat)?.alive||s.night<l.unlockNight||!['inspect','poison'].includes(l.ability))return null;return l.remaining>0||l.usedNight===s.night?l.ability:null;}
export function winnerReason(s,win=trueWinner(s)){if(!win)return '';if(win==='好人陣營')return '所有狼人已出局';const live=s.players.filter(p=>aliveForVictory(s,p));if(s.rules.victory==='city')return '屠城：所有好人已出局';return !live.some(p=>!realWolf(s,p)&&ROLE_DATA[p.role]?.kind==='god')?'屠邊：所有神職已出局':'屠邊：所有平民已出局';}
export const basicActor=s=>ordinaryWolves(s)[0]||liveRole(s,'mechanical');
export function mechanicalAbility(s){
 const m=s.mechanical,actor=liveRole(s,'mechanical');
 if(!actor||!m?.role)return null;
 if(m.role==='wolf')return (!m.extraUsed||(m.extraUsedNight===s.night&&!!s.nightAction.extraAttack))&&(m.extraUnlocked||extraKnifeUnlocked(s))?'extraAttack':null;
 if(s.night<=m.night)return null;
 if(m.role==='medium')return 'mechanicalInspect';
 if(m.role==='witch'&&(m.poison||s.nightAction.mechanicalPoison))return 'mechanicalPoison';
 if(m.role==='guard'&&(m.shield||s.nightAction.shield))return 'shield';
 return null;
}
export function extraKnifeUnlocked(s){const m=s.mechanical;return m?.role==='wolf'&&(s.rules.mechanicalKnife==='allDead'?ordinaryWolves(s).length===0:s.night>m.night);}
export function trueWinner(s){
 if(!s.rolesConfirmed)return null;
 const live=s.players.filter(p=>aliveForVictory(s,p)),wolf=p=>realWolf(s,p);
 if(s.rules.victory==='city'?!live.some(p=>!wolf(p)):!live.some(p=>!realWolf(s,p)&&ROLE_DATA[p.role]?.kind==='god')||!live.some(p=>!realWolf(s,p)&&ROLE_DATA[p.role]?.kind==='villager'))return '狼人陣營';
 if(!live.some(wolf)&&!s.blood?.lastPending)return '好人陣營';
 return null;
}
// Preserve independent attacks; defenses are spent per hit, never per target.
export function settleNight(s,{phase='all'}={}){
 const n=s.nightAction,map=id=>mapTarget(s,id);
 const ability=mechanicalAbility(s),mechanical=liveRole(s,'mechanical'),actor=basicActor(s);
 const attacks=[];
 if(actor&&n.attack&&!forcedEmpty(s))attacks.push({id:map(n.attack),cause:'attack',sourceActor:actor.id,sourceRole:actor.role,source:'basic'});
 if(ability==='extraAttack'&&n.extraAttack)attacks.push({id:n.extraAttack,cause:'attack',sourceActor:mechanical.id,sourceRole:'mechanical',source:'extra'});
 if(revengeRecorded(s)&&n.revenge)attacks.push({id:n.revenge,cause:'attack',sourceActor:liveRole(s,'younger').id,sourceRole:'younger',source:'revenge'});
 const sleep=n.sleepApplied?n.sleep:null;
 const shield=ability==='shield'?n.shield:null,guard=liveRole(s,'guard')?n.guard:null,cure=n.antidote===true?map(n.attack):null;
 let guardUsed=false,cureUsed=false;const events=[],dead=new Map();
 for(const attack of attacks){
  let blocked=null;
  if(sleep===attack.id)blocked='sleep';
  else if(shield===attack.id)blocked='shield';
  else if(guard===attack.id&&cure===attack.id)blocked=null;
  else if(guard===attack.id&&!guardUsed){guardUsed=true;blocked='guard';}
  else if(cure===attack.id&&!cureUsed){cureUsed=true;blocked='antidote';}
  events.push({...attack,blocked});
  if(!blocked&&s.players.find(p=>p.id===attack.id)?.alive&&!dead.has(attack.id))dead.set(attack.id,{...attack});
 }
 const projected={...s,players:structuredClone(s.players)};
 for(const id of dead.keys())projected.players.find(p=>p.id===id).alive=false;
 const attackWinner=trueWinner(projected);
 if(attackWinner||phase==='wolf')return {deaths:[...dead.values()],events,winner:attackWinner,poisonSkipped:!!attackWinner,batch:'wolf'};
 const poisons=[];
 const witch=s.players.find(p=>p.role==='witch');
 if(n.poison===true&&n.poisonTarget&&witch&&!feared(s,witch.id)&&nativeAllowed(s,witch))poisons.push({id:map(n.poisonTarget),cause:'poison',sourceActor:witch.id,sourceRole:'witch',source:'witch'});
 if(ability==='mechanicalPoison'&&n.mechanicalPoison)poisons.push({id:n.mechanicalPoison,cause:'poison',sourceActor:mechanical.id,sourceRole:'mechanical',source:'learnedPoison'});
 if(luckyAbility(s)==='poison'&&n.luckyPoison)poisons.push({id:map(n.luckyPoison),cause:'poison',sourceActor:s.lucky.seat,sourceRole:s.players.find(p=>p.id===s.lucky.seat).role,source:'luckyPoison'});
 for(const poison of poisons){
  if(s.players.find(p=>p.id===poison.id)?.role==='demon'){events.push({...poison,blocked:'demonImmunity'});}
  else if(sleep===poison.id){events.push({...poison,blocked:'sleep'});}
  else if(shield===poison.id){
   events.push({...poison,blocked:'shield'});
   if(s.rules.reflectPoison){const reflected={...poison,id:poison.sourceActor,source:'reflection'};events.push(reflected);if(s.players.find(p=>p.id===reflected.id)?.alive)dead.set(reflected.id,reflected);}
  }else {events.push({...poison,blocked:null});if(s.players.find(p=>p.id===poison.id)?.alive)dead.set(poison.id,{...poison});}
 }
 if(s.merchant?.usedNight===s.night&&s.merchant.success===false){const merchant=liveRole(s,'merchant');if(merchant){const failure={id:merchant.id,cause:'tradeFailure',sourceActor:merchant.id,sourceRole:'merchant',source:'trade'};events.push(failure);if(!dead.has(merchant.id))dead.set(merchant.id,failure);}}
 if(n.sleepApplied&&n.repeatPending){const repeat={id:n.sleep,cause:'dreamRepeat',sourceActor:s.players.find(p=>p.role==='dream')?.id,sourceRole:'dream',source:'dreamRepeat'};events.push({...repeat,blocked:null});dead.set(repeat.id,repeat);}
 const dream=s.players.find(p=>p.role==='dream');
 if(n.sleepApplied&&dream&&dead.has(dream.id)){const link={id:n.sleep,cause:'dreamLink',sourceActor:dream.id,sourceRole:'dream',source:'dreamLink'};events.push({...link,blocked:null});if(!dead.has(link.id))dead.set(link.id,link);}
 if(phase==='dawn'&&n.huntApplied&&n.huntDeath){const hunt={id:n.huntDeath,cause:'hunt',sourceActor:s.players.find(p=>p.role==='demon')?.id,sourceRole:'demon',source:'hunt'};events.push({...hunt,blocked:null});if(!dead.has(hunt.id))dead.set(hunt.id,hunt);}
 for(const id of dead.keys())projected.players.find(p=>p.id===id).alive=false;
 return {deaths:[...dead.values()],events,winner:trueWinner(projected),poisonSkipped:false,batch:'nonWolf'};
}
