import {specialFlow} from './takeover.js';
import {savedVoteNotes} from './votes.js';
import {converted,convertedName,graveResult,nativeAllowed,infected,infectionName,realWolf} from './identity.js';
import {ROLE_DATA} from './data.js';
import {ordinaryWolves,basicActor,inspectedWolf,tradeOutcome,mapTarget} from './night.js';
const short={witch:'巫',medium:'通',hunter:'獵',guard:'守',wolf:'狼',villager:'民',seer:'預',dream:'攝',magician:'魔'};
export function personSnapshot(s,id){
 const p=s.players.find(p=>p.id===id);if(!p)return null;
 const r=ROLE_DATA[p.role],changed=infected(s,p)||converted(s,p),changeNight=infected(s,p)?s.infection.usedNight:s.gargoyle.transformedNight;
 const later=changed&&s.night>changeNight;
 const name=later?(infected(s,p)?'感染者':'轉化者('+ (short[p.role]||r?.name||'未記錄')+')'):p.role==='mechanical'&&s.mechanical.role&&s.night>s.mechanical.night?'機械狼('+(short[s.mechanical.role]||ROLE_DATA[s.mechanical.role]?.name)+')':r?.name||'未記錄';
 return {id,role:p.role,name,kind:r?.kind||null,camp:(realWolf(s,p)?'wolf':r?.kind)||null,tone:(changed&&!later?r?.kind:realWolf(s,p)?'wolf':r?.kind)||null,image:r?.image||null,alive:p.alive};
}
export function eventPeople(s,actors,targets){return {actorSnapshots:actors.map(id=>personSnapshot(s,id)),targetSnapshots:targets.map(id=>personSnapshot(s,id))};}
export function recordDay(s,type,{actors=[],targets=[],...detail}={}){
 const voteRounds=['sheriff','exile','exilePK','idiot'].includes(type)?savedVoteNotes(s,type==='sheriff'?'sheriff':'exile'):[];
 s.dayEvents??=[];s.dayEvents.push({type,day:s.night,context:'day',order:s.dayEvents.length,actors:[...actors],rawTargets:[...targets],effectiveTargets:[...targets],executed:true,...eventPeople(s,actors,targets),...detail,...(voteRounds.length?{voteRounds}:{})});
}
export function completePendingPeople(s){
 for(const r of s.nightRecords)for(const e of r.events)for(const key of ['actorSnapshots','targetSnapshots','rawTargetSnapshots'])if(e[key])e[key]=e[key].map(p=>p&&!p.role?personSnapshot(s,p.id):p);
}
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
  if((!targets.length&&!opts.allowEmpty)||!targets.every(Boolean))return;
  const actors=opts.actors||[actor(actorRole)];if(!actors[0])return;
  const owner=s.players.find(p=>p.id===actors[0]);if(infected(s,owner))opts={...opts,displayName:infectionName(s,owner),tone:'wolf'};
  if(converted(s,owner))opts={...opts,displayName:convertedName(s,owner),tone:'wolf'};
  const effectiveTargets=opts.unmapped?targets:targets.map(map);
  record.events.push({key,night:s.night,stage,order,actors,actorRole:role(actors[0]),displayRole:actorRole,skill,rawTargets:[...targets],effectiveTargets,...eventPeople(s,actors,effectiveTargets),rawTargetSnapshots:targets.map(id=>personSnapshot(s,id)),result:null,executed:!['wolf-attack','poison','antidote'].includes(skill),...opts});
 };
 if(stage==='dance'&&n.danceTargets?.length===3)add('dance','dancer','dance',n.danceTargets,{unmapped:true,executed:false});
 if(stage==='maskInspect'&&n.maskInspect)add('maskInspect','mask','wolf-inspect',[n.maskInspect],{unmapped:true,result:n.maskResult,participated:n.danceTargets.includes(n.maskInspect)});
 if(stage==='maskAssign'&&(n.maskTarget||n.maskSkip))add('maskAssign','mask','mask',n.maskTarget?[n.maskTarget]:[],{unmapped:true,allowEmpty:true,executed:false,participated:n.danceTargets.includes(n.maskTarget)});
 if(stage==='charm'&&n.charm)add('charm','beauty','charm',[n.charm],{unmapped:true});
 if(stage==='transform'&&n.transform)add('transform','gargoyle','transform',[n.transform],{unmapped:true});
 if(stage==='graveResult'&&graveResult(s)&&nativeAllowed(s,s.players.find(p=>p.role==='gravekeeper'))){const e=graveResult(s);add('gravekeeper','gravekeeper','gravekeeper',[e.id],{unmapped:true,result:e.wolf?'狼人':'好人'});}
 if(stage==='hunt'&&s.night>1&&n.hunt)add('hunt','demon','hunt',[n.hunt],{unmapped:true,executed:false});
 if(stage==='roleModel'&&s.night===1&&!s.mixed.chosen&&n.roleModel)add('roleModel','mixed','role-model',[n.roleModel],{unmapped:true});
 if(stage==='fear'&&n.fear)add('fear','nightmare','fear',[n.fear],{unmapped:true});
 if(stage==='sleep'&&n.sleep)add('sleep','dream','sleep',[n.sleep],{unmapped:true});
 if(stage==='bond'&&n.bondTargets.length===2&&!s.fragrance.used)add('bond','fragrance','bond',n.bondTargets,{unmapped:true});
 if(stage==='awakenedInspect'&&n.awakenedTargets.length===2)add('awakenedInspect','awakenedSeer','inspect',n.awakenedTargets,{result:n.awakenedTargets.some(id=>inspectedWolf(s,map(id)))?'壞人':'好人'});
 if(stage==='exchange'&&n.exchange.length===2)add('swap','magician','swap',n.exchange,{unmapped:true});
 if(stage==='attack'&&n.attack&&n.attackMode==='infect'){add('infection','seedWolf','infect',[n.attack],{executed:false,unmapped:true});}
 if(stage==='attack'&&n.attack&&n.attackMode!=='infect'){const actors=specialFlow(s)&&n.basicSubmitted&&n.basicActors.length?[...n.basicActors]:ordinaryWolves(s).map(p=>p.id);if(!actors.length&&basicActor(s))actors.push(basicActor(s).id);add('basic','wolf','wolf-attack',[n.attack],{actors,...(basicActor(s)?.role==='mask'?{takeoverNight:s.masquerade.takeoverNight}:{}),portraitRole:ordinaryWolves(s).some(p=>p.role==='wolf')?'wolf':basicActor(s)?.role,...(converted(s,basicActor(s))?{displayName:convertedName(s,basicActor(s)),tone:'wolf'}:{})});}
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
function orderedNightEvents(events){const sorted=events.sort((a,b)=>a.order-b.order),basic=sorted.findIndex(e=>e.key==='basic'&&e.actorRole==='mechanical'),extra=sorted.findIndex(e=>e.key==='extraAttack');if(basic>=0&&extra>=0&&extra<basic)[sorted[basic],sorted[extra]]=[sorted[extra],sorted[basic]];return sorted;}
export function recapNights(s){return [...s.nightRecords].sort((a,b)=>a.night-b.night).map(r=>{const dance=r.events.find(e=>e.key==='dance'),events=r.events.map(e=>e.key==='maskAssign'&&e.participated==null?{...e,participated:!!dance?.rawTargets.includes(e.rawTargets[0])}:e);const victims=r.deaths.filter(d=>d.cause==='dance').map(d=>d.id);if(dance?.executed&&!dance.unsettled&&victims.length&&!events.some(e=>e.key==='danceDeath'))events.push({...structuredClone(dance),key:'danceDeath',order:Math.max(dance.order,...events.filter(e=>['maskInspect','maskAssign'].includes(e.key)).map(e=>e.order))+.5,rawTargets:victims,effectiveTargets:victims,targetSnapshots:(dance.targetSnapshots||[]).filter(p=>victims.includes(p.id)),result:'共舞死亡'});return {...r,events:orderedNightEvents(events.filter(e=>e.key==='maskAssign'?e.rawTargets.length>0&&(e.executed||e.unsettled):e.unsettled?e.key==='dance':e.executed))};});}
