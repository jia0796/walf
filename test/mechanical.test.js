import test from 'node:test';
import assert from 'node:assert/strict';
import {BOARDS,ROLE_DATA} from '../public/data.js';
import {createGame,canNext,choose,selectSeat,selectable,next,previous,nightSteps,subtitle,winner,roleResult,roleName,canSelfDestruct,beginSelfDestruct,upgradeGame} from '../public/engine.js';
import {settleNight,mechanicalAbility,basicActor} from '../public/night.js';
const go=s=>assert.equal(next(s),true,'Cannot leave '+s.step);
function ready(board='mechanical12',rules={}){const s=createGame(board,rules);let id=0;for(const [role,count]of Object.entries(BOARDS[board].roles))for(let i=0;i<count;i++)s.players[id++].role=role;s.rolesConfirmed=true;return s;}
const seat=(s,role)=>s.players.find(p=>p.role===role).id;
const learn=(s,role,night=1)=>{s.mechanical.role=role;s.mechanical.night=night;s.mechanical.target=seat(s,role);};
for(const board of ['mechanical10','mechanical12']){
 test(board+' first night identity gates and full ordered flow',()=>{
  const s=createGame(board,{sheriff:false}),seen=[];
  for(let i=0;i<50&&s.step!=='dawn';i++){
   seen.push(s.step);
   const role={mediumIdentify:'medium',guard:'guard',witch:'witch',hunter:'hunter',mechanical:'mechanical'}[s.step];
   if(role){assert.equal(canNext(s),false);selectSeat(s,s.players.find(p=>p.active&&!p.role).id);}
   if(s.step==='wolves'){assert.equal(canNext(s),false);for(let j=0;j<BOARDS[board].roles.wolf;j++)selectSeat(s,s.players.find(p=>p.active&&!p.role).id);assert.equal(s.players.filter(p=>p.role==='king').length,0);}
   if(['guardTarget','attack','antidote','poison','mechanicalAction'].includes(s.step))choose(s,'skip');
   if(s.step==='mediumInspect')selectSeat(s,1);
   go(s);
  }
  assert.equal(s.step,'dawn');assert.equal(s.rolesConfirmed,true);assert.equal(s.players.filter(p=>p.role==='villager').length,4);
  assert.deepEqual(seen.slice(1),nightSteps(s).slice(0,-1));
  s.night=2;const later=nightSteps(s);assert.ok(later.indexOf('mechanical')<later.indexOf('wolves'));assert.ok(!later.includes('mediumIdentify'));assert.equal(later.includes('hunter'),board==='mechanical12');
 });
 test(board+' shares ordered exile PK, cancel tie and second tie notice',()=>{
  const s=ready(board);s.step='voteIntro';go(s);choose(s,'tie');[8,3,10].forEach(id=>selectSeat(s,id));go(s);assert.equal(subtitle(s),'請3號、8號、10號PK 發言');go(s);assert.equal(subtitle(s),'由3號開始發言');go(s);assert.equal(subtitle(s),'3 2 1請投票');assert.equal(selectable(s,9),false);
  choose(s,'tie');choose(s,'tie');assert.equal(canNext(s),false);choose(s,'tie');go(s);assert.equal(s.step,'noExile');previous(s);assert.equal(s.step,'exileRevote');go(s);go(s);assert.equal(s.night,2);
 });
}
test('learning legal targets, defer, one total learning, same-night disguise and true camp',()=>{
 const s=ready();s.step='mechanical';go(s);assert.equal(subtitle(s),'-');assert.equal(canNext(s),false);assert.equal(selectSeat(s,1),false);s.players[11].alive=false;assert.equal(selectSeat(s,12),false);choose(s,'skip');assert.equal(canNext(s),true);choose(s,'skip');assert.equal(canNext(s),false);
 const witch=seat(s,'witch');selectSeat(s,witch);go(s);assert.equal(roleResult(s,1),'witch');assert.equal(roleResult(s,1,true),'mechanical');assert.equal(roleName(s,s.players[0]),'機械狼（巫）');assert.equal(s.players[0].role,'mechanical');assert.equal(ROLE_DATA[s.players[0].role].kind,'wolf');assert.equal(mechanicalAbility(s),null);
 previous(s);selectSeat(s,witch);assert.equal(canNext(s),false);selectSeat(s,seat(s,'guard'));go(s);assert.equal(s.mechanical.role,'guard');s.step='mechanical';s.night=2;go(s);assert.equal(s.operation,'shield');assert.equal(choose(s,'mode:learnTarget'),false);
 s.players.filter(p=>p.role==='wolf').forEach(p=>p.alive=false);assert.equal(winner(s),null);
});
test('unlearned mechanical inspection returns true role, learned medium resolves disguise',()=>{
 const s=ready();assert.equal(roleResult(s,1),'mechanical');learn(s,'medium');assert.equal(roleResult(s,1),'medium');s.night=2;s.step='mechanical';go(s);assert.equal(s.operation,'mechanicalInspect');assert.equal(choose(s,'skip'),false);assert.equal(canNext(s),false);selectSeat(s,seat(s,'witch'));assert.equal(canNext(s),true);
});
test('mechanical cannot self destruct even after learning wolf',()=>{
 const s=ready();learn(s,'wolf');s.step='discussion';beginSelfDestruct(s);assert.equal(selectable(s,1),false);assert.equal(selectable(s,2),true);s.players.filter(p=>p.role==='wolf').forEach(p=>p.alive=false);s.step='discussion';assert.equal(canSelfDestruct(s),false);
});
test('basic takeover and extra modes obey timing every night',()=>{
 const s=ready();assert.equal(basicActor(s).role,'wolf');learn(s,'wolf');assert.equal(mechanicalAbility(s),null);s.night=2;assert.equal(mechanicalAbility(s),'extraAttack');s.rules.mechanicalKnife='allDead';assert.equal(mechanicalAbility(s),null);s.players.filter(p=>p.role==='wolf').forEach(p=>p.alive=false);assert.equal(basicActor(s).role,'mechanical');assert.equal(mechanicalAbility(s),'extraAttack');s.night=3;assert.equal(mechanicalAbility(s),'extraAttack');
 s.mechanical.role=null;assert.equal(mechanicalAbility(s),null);assert.equal(basicActor(s).role,'mechanical');s.mechanical.role='villager';assert.equal(mechanicalAbility(s),null);
});
for(const defense of ['guard','antidote']){
 test('double knife same target keeps events; '+defense+' blocks only one',()=>{
  const s=ready();learn(s,'wolf');s.night=2;const id=seat(s,'villager');s.nightAction.attack=id;s.nightAction.extraAttack=id;s.nightAction[defense]=defense==='guard'?id:true;const r=settleNight(s);assert.equal(r.events.length,2);assert.equal(r.events.filter(e=>e.blocked).length,1);assert.equal(r.deaths.length,1);assert.equal(r.deaths[0].id,id);
 });
}
test('guard and antidote same target kills for single and double knife',()=>{
 for(const double of [false,true]){const s=ready();learn(s,'wolf');s.night=2;const id=seat(s,'villager');Object.assign(s.nightAction,{attack:id,guard:id,antidote:true,extraAttack:double?id:null});assert.equal(settleNight(s).deaths[0].id,id);}
});
test('guard legal self, consecutive restriction, empty guard interrupts and rollback restores',()=>{
 const s=ready();s.step='guardTarget';const id=seat(s,'guard');assert.equal(selectSeat(s,id),true);go(s);s.step='nextNight';go(s);assert.equal(s.lastGuard,id);s.step='guardTarget';assert.equal(selectSeat(s,id),false);choose(s,'skip');go(s);s.step='nextNight';go(s);assert.equal(s.lastGuard,null);s.step='guardTarget';assert.equal(selectSeat(s,id),true);
 previous(s);assert.equal(s.lastGuard,id);
});
test('guard does not block poison; invincible shield blocks attack and poison together',()=>{
 const s=ready();learn(s,'guard');s.night=2;const id=seat(s,'villager');Object.assign(s.nightAction,{attack:id,poison:true,poisonTarget:id,guard:id});assert.equal(settleNight(s).deaths[0].cause,'poison');
 s.nightAction.shield=id;assert.deepEqual(settleNight(s).deaths,[]);assert.equal(settleNight(s).events.filter(e=>e.blocked==='shield').length,2);assert.equal(mechanicalAbility(s),'shield');assert.equal(s.nightAction.extraAttack,null);
});
for(const enabled of [false,true]){
 test('shield reflection '+enabled+' goes to casting witch only',()=>{
  const s=ready('mechanical12',{reflectPoison:enabled});learn(s,'guard');s.night=2;Object.assign(s.nightAction,{attack:1,poison:true,poisonTarget:1,shield:1});const r=settleNight(s);assert.deepEqual(r.deaths.map(d=>d.id),enabled?[seat(s,'witch')]:[]);
 });
}
test('shield consumes even without hit, can defer, and full back restores inventory',()=>{
 const s=ready();learn(s,'guard');s.night=2;s.step='mechanical';go(s);choose(s,'skip');go(s);assert.equal(s.mechanical.shield,true);previous(s);selectSeat(s,1);go(s);assert.equal(s.mechanical.shield,false);previous(s);assert.equal(s.mechanical.shield,true);go(s);s.step='nextNight';go(s);s.step='mechanical';go(s);assert.equal(s.operation,null);
});
test('learned poison is next-night, one use with reversible inventory; medium repeats',()=>{
 const s=ready();learn(s,'witch');assert.equal(mechanicalAbility(s),null);s.night=2;s.step='mechanical';go(s);selectSeat(s,seat(s,'villager'));go(s);assert.equal(s.mechanical.poison,false);assert.equal(settleNight(s).deaths[0].cause,'poison');previous(s);assert.equal(s.mechanical.poison,true);go(s);s.step='nextNight';go(s);assert.equal(mechanicalAbility(s),null);
 const m=ready();learn(m,'medium');m.night=2;assert.equal(mechanicalAbility(m),'mechanicalInspect');m.night=3;assert.equal(mechanicalAbility(m),'mechanicalInspect');
});
for(const board of ['12','10','mechanical12','mechanical10']){
 test(board+' wolf attack terminal stops poison and death abilities',()=>{
  const s=ready(board),target=seat(s,BOARDS[board].roles.hunter?'hunter':BOARDS[board].roles.medium?'medium':'seer');
  s.players.filter(p=>ROLE_DATA[p.role]?.kind==='god'&&p.id!==target).forEach(p=>p.alive=false);
  s.players.filter(p=>ROLE_DATA[p.role]?.kind==='wolf').slice(1).forEach(p=>p.alive=false);
  s.nightAction.attack=target;s.nightAction.poison=true;s.nightAction.poisonTarget=s.players.find(p=>p.alive&&ROLE_DATA[p.role]?.kind==='wolf').id;
  const result=settleNight(s);assert.equal(result.winner,'狼人陣營');assert.equal(result.poisonSkipped,true);assert.equal(result.events.length,1);assert.equal(result.deaths.length,1);
  s.step=nightSteps(s).at(-2);go(s);if(s.step==='candidates'){choose(s,'none');go(s);}go(s);if(['sheriffResult','noSheriffNotice'].includes(s.step))go(s);go(s);assert.equal(s.step,'finished');assert.equal(s.winner,'狼人陣營');assert.equal(s.players.find(p=>p.id===s.nightAction.poisonTarget).alive,true);previous(s);assert.equal(s.winner,null);assert.equal(s.players[target-1].alive,true);
 });
}
test('nonterminal wolf death then poison can end for good; no forced wolf priority over defense',()=>{
 const s=ready();s.players.filter(p=>p.role==='wolf').forEach(p=>p.alive=false);s.nightAction.attack=seat(s,'villager');s.nightAction.guard=s.nightAction.attack;s.nightAction.poison=true;s.nightAction.poisonTarget=1;const r=settleNight(s);assert.equal(r.winner,'好人陣營');assert.equal(r.poisonSkipped,false);assert.deepEqual(r.deaths.map(d=>d.id),[1]);
});
test('learned hunter shoots same learning night, poison/terminal block, depth-first chain and badge waits',()=>{
 const s=ready();learn(s,'hunter');s.step='announcement';s.deaths=[{id:1,cause:'attack'}];s.sheriff=1;go(s);assert.equal(s.sheriff,1);go(s);assert.equal(s.step,'skill');selectSeat(s,seat(s,'hunter'));go(s);assert.equal(s.step,'lastWords');go(s);assert.equal(s.step,'skill');choose(s,'skip');go(s);assert.equal(s.step,'badgeTransfer');assert.equal(s.sheriff,1);selectSeat(s,seat(s,'villager'));go(s);assert.equal(s.pendingBadge,null);previous(s);assert.equal(s.sheriff,1);assert.equal(s.pendingBadge,1);
 const poison=ready();learn(poison,'hunter');poison.step='announcement';poison.deaths=[{id:1,cause:'poison'}];go(poison);go(poison);assert.notEqual(poison.step,'skill');
});
test('v4 refresh and back retain learned role, defense inventory, and true identity',()=>{
 const s=ready();s.step='mechanical';go(s);selectSeat(s,seat(s,'guard'));go(s);const restored=upgradeGame(JSON.parse(JSON.stringify(s)));assert.equal(restored.mechanical.role,'guard');previous(restored);assert.equal(restored.mechanical.role,null);assert.equal(restored.players[0].role,'mechanical');
});
test('first-night unmarked villagers can be learned and inspected without losing true role',()=>{
 const s=ready();const id=seat(s,'villager');s.players[id-1].role=null;s.rolesConfirmed=false;
 assert.equal(roleResult(s,id),'villager');s.step='mechanicalAction';s.operation='learnTarget';selectSeat(s,id);assert.equal(roleName(s,s.players[0]),'機械狼（民）');go(s);assert.equal(s.mechanical.role,'villager');
});
test('invincible shield never protects exile or hunter shots',()=>{
 const s=ready();learn(s,'guard');s.night=2;s.nightAction.shield=1;s.step='exileVote';s.votePool=s.players.filter(p=>p.alive).map(p=>p.id);selectSeat(s,1);go(s);assert.equal(s.players[0].alive,false);assert.equal(s.step,'lastWords');previous(s);assert.equal(s.players[0].alive,true);
 s.step='skill';s.action=[];s.choice=null;s.queue=[{id:seat(s,'hunter'),cause:'attack',noticeDone:true}];s.continuation='direction';selectSeat(s,1);go(s);assert.equal(s.players[0].alive,false);
});
test('wolf terminal prevents reflected poison; city mode continues past last god',()=>{
 for(const victory of ['edge','city']){
  const s=ready('mechanical12',{reflectPoison:true,victory});learn(s,'guard');s.night=2;const witch=seat(s,'witch');s.players.filter(p=>ROLE_DATA[p.role]?.kind==='god'&&p.id!==witch).forEach(p=>p.alive=false);
  Object.assign(s.nightAction,{shield:1,attack:witch,poison:true,poisonTarget:1});const r=settleNight(s);
  assert.equal(r.poisonSkipped,victory==='edge');assert.equal(r.events.some(e=>e.source==='reflection'),victory==='city');assert.equal(r.winner,victory==='edge'?'狼人陣營':null);
 }
});
test('all wolf attacks and defenses settle before deciding victory',()=>{
 const s=ready();learn(s,'wolf');s.night=2;const god=seat(s,'medium');s.players.filter(p=>ROLE_DATA[p.role]?.kind==='god'&&p.id!==god).forEach(p=>p.alive=false);s.players.filter(p=>p.role==='wolf').forEach(p=>p.alive=false);Object.assign(s.nightAction,{attack:god,extraAttack:1});const r=settleNight(s);assert.equal(r.events.length,2);assert.equal(r.winner,'好人陣營');assert.equal(r.poisonSkipped,true);
});
