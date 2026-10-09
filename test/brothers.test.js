import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,selectSeat,selectable,choose,next,previous,canNext,nightSteps,subtitle,inspection,potionBlocked,upgradeGame,restartGame,gunSources,canSelfDestruct,beginSelfDestruct} from '../public/engine.js';
import {BOARDS} from '../public/data.js';
import {ordinaryWolves,basicActor,revengeAvailable,settleNight,trueWinner,luckyAbility} from '../public/night.js';
import {recapNights} from '../public/records.js';
const go=s=>assert.equal(next(s),true,'cannot leave '+s.step);
function ready(rules={}){const s=createGame('brothers12',rules);let i=0;for(const [role,n]of Object.entries(BOARDS.brothers12.roles))for(let j=0;j<n;j++)s.players[i++].role=role;s.rolesConfirmed=true;return s;}
const seat=(s,r)=>s.players.find(p=>p.role===r).id;
function trade(s,target,ability){s.step='trade';choose(s,'gift:'+ability);selectSeat(s,target);go(s);}
function elderDeath(s,cause){s.step=cause==='exile'?'exileVote':'announcement';if(cause==='exile'){s.votePool=[1];selectSeat(s,1);}else s.deaths=[{id:1,cause,context:cause==='shot'?'day':'night'}];go(s);}
function drain(s){for(let i=0;i<40&&!['nextNight','dayDraw','finished'].includes(s.step);i++){if(s.step==='skill'||s.step==='badgeTransfer')choose(s,'skip');go(s);}}
test('new board exact counts, required identities once, exact first/later captions',()=>{
 const s=createGame('brothers12',{sheriff:false});go(s);go(s);assert.equal(s.step,'brothers');assert.equal(subtitle(s),'狼兄狼弟請睜眼，請確認彼此身分');assert.equal(canNext(s),false);selectSeat(s,1);assert.equal(canNext(s),false);selectSeat(s,2);assert.equal(canNext(s),true);go(s);go(s);[3,4].forEach(id=>selectSeat(s,id));go(s);choose(s,'skip');go(s);selectSeat(s,6);go(s);go(s);choose(s,'skip');go(s);go(s);selectSeat(s,5);go(s);selectSeat(s,9);go(s);go(s);go(s);selectSeat(s,7);go(s);go(s);go(s);selectSeat(s,8);go(s);choose(s,'skip');go(s);go(s);assert.equal(s.step,'lucky');go(s);go(s);assert.equal(s.step,'dawn');assert.equal(s.rolesConfirmed,true);assert.equal(s.players.filter(p=>p.role==='villager').length,4);
 assert.ok(!nightSteps(s).includes('luckyAction'));s.night=2;assert.deepEqual(nightSteps(s).slice(0,6),['dark','younger','revenge','youngerClose','wolves','attack']);
 s.step='revenge';assert.equal(subtitle(s),'選擇你要復仇的對象');assert.equal(canNext(s),true);assert.equal(selectSeat(s,9),false);go(s);assert.equal(subtitle(s),'狼弟請閉眼');
});
for(const cause of ['poison','exile','shot'])test('elder '+cause+' triggers immediately following night, rollback and formal inspection',()=>{
 const s=ready();s.nightAction.inspect=2;assert.equal(inspection(s),'up');s.nightAction.poison=true;s.nightAction.poisonTarget=1;assert.equal(inspection(s),'up');elderDeath(s,cause);assert.equal(s.brothers.revengeNight,2);assert.equal(s.brothers.joinNight,3);assert.equal(inspection(s),'down');previous(s);assert.equal(s.brothers.revengeNight,null);assert.equal(inspection(s),'up');go(s);drain(s);s.step='nextNight';go(s);assert.equal(revengeAvailable(s),true);assert.ok(!ordinaryWolves(s).some(p=>p.role==='younger'));s.step='revenge';assert.equal(canNext(s),false);selectSeat(s,2);go(s);assert.equal(s.players[1].alive,true);assert.equal(s.brothers.revengeUsed,true);previous(s);assert.equal(s.brothers.revengeUsed,false);choose(s,'skip');go(s);s.step='nextNight';go(s);assert.equal(revengeAvailable(s),false);assert.ok(ordinaryWolves(s).some(p=>p.role==='younger'));
});
test('only younger survives: no false victory, revenge night basic empty, next night joins',()=>{
 const s=ready();elderDeath(s,'poison');s.players.filter(p=>p.role==='wolf').forEach(p=>p.alive=false);s.night=2;assert.equal(trueWinner(s),null);assert.equal(basicActor(s),undefined);s.step='attack';assert.equal(canNext(s),true);assert.equal(selectSeat(s,9),false);s.step='revenge';selectSeat(s,3);assert.equal(s.nightAction.revenge,null);selectSeat(s,2);assert.equal(s.nightAction.revenge,2);s.night=3;assert.equal(basicActor(s).role,'younger');
});
test('elder cannot explode or be basic knife; younger can explode before and after revenge',()=>{
 for(const night of [1,2,3]){const s=ready();s.night=night;s.step='attack';assert.equal(selectSeat(s,1),false);assert.equal(selectSeat(s,2),true);s.step='discussion';assert.equal(canSelfDestruct(s),true);beginSelfDestruct(s);assert.equal(selectSeat(s,1),false);assert.equal(selectSeat(s,2),true);go(s);assert.equal(s.players[1].alive,false);}
});
test('basic and revenge independent on same target; one antidote blocks one; witch sees only basic',()=>{
 const s=ready();elderDeath(s,'poison');s.night=2;s.nightAction.poison=null;s.nightAction.poisonTarget=null;s.step='revenge';selectSeat(s,9);go(s);s.step='attack';selectSeat(s,9);go(s);s.step='antidote';assert.equal(s.nightAction.attack,9);choose(s,'use');const result=settleNight(s);assert.deepEqual(result.events.filter(e=>e.cause==='attack').map(e=>[e.source,e.blocked]),[['basic','antidote'],['revenge',null]]);assert.equal(result.deaths[0].id,9);
 s.nightAction.attack=null;s.nightAction.antidote=null;s.potions.antidote=true;assert.match(potionBlocked(s,'antidote'),/空刀/);assert.equal(s.nightAction.revenge,9);
});
test('merchant requires both inputs, cannot self trade, can defer, true younger camp fails privately',()=>{
 const s=ready();s.step='trade';assert.equal(selectSeat(s,8),false);assert.equal(next(s),false);selectSeat(s,2);assert.equal(next(s),false);choose(s,'gift:poison');assert.equal(canNext(s),true);go(s);assert.equal(s.merchant.success,false);assert.equal(s.merchant.used,true);assert.equal(s.lucky,null);assert.equal(s.players[7].alive,true);const r=settleNight(s);assert.equal(r.deaths.find(d=>d.id===8).cause,'tradeFailure');s.deaths=r.deaths;s.step='announcement';assert.equal(subtitle(s),'昨晚8號被殺死');go(s);assert.equal(recapNights(s)[0].deaths[0].id,8);
 const deferred=ready();deferred.step='trade';choose(deferred,'skip');go(deferred);assert.equal(deferred.merchant.used,false);
});
test('successful gift survives merchant death, first-night notification has no skill event, next-night inspect stacks',()=>{
 const s=ready();trade(s,5,'inspect');s.nightAction.attack=8;assert.equal(settleNight(s).deaths[0].id,8);s.step='lucky';go(s);assert.equal(s.lucky.remaining,1);assert.equal(luckyAbility(s),null);assert.equal(recapNights(s)[0].events.length,1);s.step='nextNight';go(s);s.step='inspect';selectSeat(s,2);go(s);s.step='luckyAction';assert.equal(canNext(s),false);selectSeat(s,3);go(s);assert.equal(s.lucky.remaining,0);assert.equal(recapNights(s).at(-1).events.filter(e=>e.skill==='inspect').length,2);previous(s);assert.equal(s.lucky.remaining,1);assert.equal(s.nightRecords.at(-1).events.filter(e=>e.displayRole==='lucky').length,0);go(s);assert.equal(upgradeGame(JSON.parse(JSON.stringify(s))).lucky.remaining,0);
});
test('lucky poison deferred and independent of witch restriction, two poison sources separate',()=>{
 const s=ready();trade(s,6,'poison');s.step='nextNight';go(s);s.step='luckyAction';choose(s,'skip');go(s);assert.equal(s.lucky.remaining,1);s.step='nextNight';go(s);s.step='antidote';s.nightAction.attack=9;choose(s,'skip');go(s);choose(s,'use');selectSeat(s,3);go(s);s.step='luckyAction';selectSeat(s,4);go(s);assert.deepEqual(settleNight(s).events.filter(e=>e.cause==='poison').map(e=>e.source),['witch','luckyPoison']);assert.equal(s.potions.poison,false);assert.equal(s.lucky.remaining,0);
 const a=ready();trade(a,6,'poison');a.step='nextNight';go(a);a.step='antidote';a.nightAction.attack=9;choose(a,'use');go(a);assert.match(potionBlocked(a,'poison'),/解藥/);a.step='luckyAction';selectSeat(a,3);go(a);assert.equal(settleNight(a).events.filter(e=>e.cause==='poison').length,1);
});
test('lucky gun unlocks day1, native/gift two independent shots, poisoned suppresses both, day shots absent from recap',()=>{
 const s=ready();trade(s,7,'gun');assert.equal(gunSources(s,{id:7,cause:'attack',context:'night'}).length,1);s.deaths=[{id:7,cause:'attack'}];s.step='announcement';go(s);go(s);assert.equal(s.step,'skill');assert.deepEqual(gunSources(s,s.queue[0]),['native','lucky']);selectSeat(s,3);go(s);assert.equal(s.step,'lastWords');go(s);assert.equal(s.step,'skill');assert.equal(s.operation,'lucky');selectSeat(s,4);go(s);go(s);assert.equal(s.lucky.remaining,0);assert.equal(s.dayEvents.length,2);assert.deepEqual(s.nightRecords[0].deaths.map(d=>d.id),[7]);assert.equal(s.nightRecords[0].events.some(e=>e.skill==='gun'),false);
 const poisoned=ready();trade(poisoned,7,'gun');poisoned.deathsCommitted=true;assert.deepEqual(gunSources(poisoned,{id:7,cause:'poison'}),[]);
});
test('each gun checks victory before remaining gun; wolf attacks terminate poison and failure',()=>{
 const s=ready();trade(s,7,'gun');s.players.filter(p=>['elder','younger','wolf'].includes(p.role)&&p.id!==3).forEach(p=>p.alive=false);s.step='announcement';s.deaths=[{id:7,cause:'attack'}];go(s);go(s);selectSeat(s,3);go(s);assert.equal(s.step,'finished');assert.equal(s.lucky.remaining,1);assert.equal(s.winner,'好人陣營');
 const k=ready();trade(k,2,'poison');k.players.filter(p=>p.role==='villager'&&p.id!==9).forEach(p=>p.alive=false);k.nightAction.attack=9;k.nightAction.poison=true;k.nightAction.poisonTarget=3;const r=settleNight(k);assert.equal(r.winner,'狼人陣營');assert.equal(r.poisonSkipped,true);assert.deepEqual(r.deaths.map(d=>d.id),[9]);
});
test('restart preserves all room rules, purges identities/inventory/records/history; refresh stable recap expansion',()=>{
 const s=ready({sheriff:false,selfRescue:true,victory:'city',swallow:false});trade(s,9,'poison');s.recapExpanded=[1,2];const loaded=upgradeGame(JSON.parse(JSON.stringify(s)));assert.deepEqual(loaded,s);const fresh=restartGame(s);assert.deepEqual(fresh.rules,s.rules);assert.equal(fresh.boardId,s.boardId);assert.equal(fresh.step,'confirm');assert.equal(fresh.lucky,null);assert.deepEqual(fresh.nightRecords,[]);assert.deepEqual(fresh.history,[]);assert.ok(fresh.players.every(p=>!p.role));
});
test('revenge can hit another wolf independently while basic antidote saves its own victim',()=>{
 const s=ready();elderDeath(s,'poison');s.step='nextNight';go(s);s.step='revenge';assert.equal(selectSeat(s,3),true);go(s);assert.equal(s.players[2].alive,true);s.step='attack';selectSeat(s,9);go(s);s.step='antidote';choose(s,'use');const r=settleNight(s);assert.deepEqual(r.deaths.map(d=>d.id),[3]);assert.deepEqual(r.events.filter(e=>e.cause==='attack').map(e=>e.source),['basic','revenge']);
});
test('civilian lucky gun waits for daytime, deceased inspection recipient cannot act next night',()=>{
 const s=ready();trade(s,9,'gun');assert.deepEqual(gunSources(s,{id:9,cause:'attack',context:'night'}),[]);s.deaths=[{id:9,cause:'attack'}];s.step='announcement';go(s);go(s);assert.equal(s.step,'skill');assert.deepEqual(gunSources(s,s.queue[0]),['lucky']);choose(s,'skip');go(s);assert.equal(s.lucky.remaining,0);
 const gone=ready();trade(gone,9,'inspect');gone.deaths=[{id:9,cause:'attack'}];gone.step='announcement';go(gone);gone.step='nextNight';go(gone);gone.step='luckyAction';assert.equal(luckyAbility(gone),null);assert.equal(selectSeat(gone,2),false);assert.equal(canNext(gone),true);
});
test('badge transfer waits for both native and lucky guns and their child deaths',()=>{
 const s=ready();trade(s,7,'gun');s.sheriff=7;s.deaths=[{id:7,cause:'attack'}];s.step='announcement';go(s);go(s);selectSeat(s,3);go(s);assert.equal(s.pendingBadge,7);assert.equal(s.step,'lastWords');go(s);assert.equal(s.step,'skill');choose(s,'skip');go(s);assert.equal(s.step,'badgeTransfer');assert.equal(s.pendingBadge,7);selectSeat(s,5);go(s);assert.equal(s.sheriff,5);assert.equal(s.pendingBadge,null);
});
