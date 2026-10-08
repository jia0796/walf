import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,selectSeat,choose,next,previous,canNext,subtitle,potionBlocked,nightDeaths,winner,inspection} from '../public/engine.js';
const advance=s=>assert.equal(next(s),true,`cannot leave ${s.step}`);
function firstNight(){
 const s=createGame();advance(s);advance(s);
 selectSeat(s,1);advance(s);choose(s,'skip');advance(s);advance(s);
 [2,3,4,5].forEach(id=>selectSeat(s,id));advance(s);selectSeat(s,9);advance(s);
 selectSeat(s,6);advance(s);return s;
}
function ready(){const s=createGame();['magician','king','wolf','wolf','wolf','witch','seer','hunter','villager','villager','villager','villager'].forEach((r,i)=>s.players[i].role=r);s.rolesConfirmed=true;return s;}
test('first-night identities are required, unique, and remaining four become villagers',()=>{
 const s=createGame();advance(s);advance(s);const before=structuredClone(s);assert.equal(next(s),false);assert.deepEqual(s,before);
 selectSeat(s,1);assert.equal(selectSeat(s,2),true);assert.deepEqual(s.action,[1]); // only one identity slot
 advance(s);choose(s,'skip');advance(s);advance(s);
 assert.equal(selectSeat(s,1),false);[2,3,4,5].forEach(id=>selectSeat(s,id));
 selectSeat(s,2);assert.equal(s.players[2].role,'king');selectSeat(s,2);assert.equal(s.players[4].role,'wolf');advance(s);
 choose(s,'skip');advance(s);selectSeat(s,6);advance(s);choose(s,'skip');advance(s);choose(s,'skip');advance(s);advance(s);
 selectSeat(s,7);advance(s);selectSeat(s,9);advance(s);advance(s);selectSeat(s,8);advance(s);advance(s);advance(s);
 assert.equal(s.step,'dawn');assert.equal(s.players.filter(p=>p.role==='villager').length,4);assert.equal(s.rolesConfirmed,true);
});
test('skip alternatives gate magician, wolf, skill; duplicate exchange target does not count twice',()=>{
 for(const step of ['exchange','attack','skill']){const s=ready();s.step=step;if(step==='skill'){s.queue=[{id:8,cause:'attack'}];s.continuation='direction';}
 assert.equal(canNext(s),false);choose(s,'skip');assert.equal(canNext(s),true);}
 const s=ready();s.step='exchange';selectSeat(s,9);selectSeat(s,9);assert.equal(canNext(s),false);selectSeat(s,9);selectSeat(s,10);assert.equal(canNext(s),true);
 s.step='inspect';s.action=[];assert.equal(canNext(s),false);assert.equal(selectSeat(s,9),true);assert.equal(canNext(s),true);
});
test('antidote consumes immediately, poison script remains and all its actions lock',()=>{
 const s=firstNight();assert.equal(subtitle(s),'今晚他死了，你要使用解藥嗎？');assert.equal(canNext(s),false);
 choose(s,'use');assert.equal(s.potions.antidote,false);advance(s);
 assert.equal(s.step,'poison');assert.equal(subtitle(s),'你要使用毒藥嗎？你要毒誰呢？');assert.match(potionBlocked(s,'poison'),/本晚已使用解藥/);
 assert.equal(choose(s,'use'),false);assert.equal(selectSeat(s,10),false);assert.equal(s.potions.poison,true);advance(s);assert.equal(s.step,'witchClose');
});
test('spent potions still present both scripts next night; poison needs explicit decision and target',()=>{
 const s=ready();s.night=2;s.potions.antidote=false;s.step='antidote';assert.equal(subtitle(s),'今晚他死了，你要使用解藥嗎？');advance(s);
 assert.equal(s.step,'poison');assert.equal(canNext(s),false);choose(s,'use');assert.equal(s.potions.poison,false);assert.equal(canNext(s),false);
 selectSeat(s,9);assert.equal(canNext(s),true);
 s.potions.poison=false;s.nightAction.poison=null;assert.match(potionBlocked(s,'poison'),/毒藥已使用/);assert.equal(canNext(s),true);
});
test('back restores decision and potion inventory without double consumption',()=>{
 const s=firstNight();choose(s,'skip');advance(s);choose(s,'use');selectSeat(s,10);advance(s);
 previous(s);assert.equal(s.step,'poison');assert.equal(s.nightAction.poison,true);choose(s,'skip');assert.equal(s.potions.poison,true);
 previous(s);assert.equal(s.step,'antidote');assert.equal(s.nightAction.poison,null);assert.equal(s.potions.poison,true);choose(s,'use');advance(s);assert.equal(choose(s,'use'),false);
});
test('back permits correction of wolf target and first-night role marks',()=>{
 const s=firstNight();previous(s);assert.equal(s.step,'witch');previous(s);assert.equal(s.step,'attack');selectSeat(s,10);advance(s);assert.equal(s.nightAction.attack,10);
 const a=createGame();advance(a);advance(a);selectSeat(a,1);advance(a);previous(a);selectSeat(a,1);selectSeat(a,2);assert.equal(a.players[0].role,null);assert.equal(a.players[1].role,'magician');
});
test('swap maps final effects and inspection; poison dominates cause on shared target',()=>{
 const s=ready();s.nightAction.exchange=[9,2];s.nightAction.attack=9;s.nightAction.inspect=9;assert.equal(inspection(s),'🐺');assert.deepEqual(nightDeaths(s),[{id:2,cause:'attack'}]);
 s.nightAction.antidote=true;assert.deepEqual(nightDeaths(s),[]);
 s.nightAction.poison=true;s.nightAction.poisonTarget=9;assert.deepEqual(nightDeaths(s),[{id:2,cause:'poison'}]);
});
test('second night retains role identities and dead actors cannot select targets',()=>{
 const s=ready();s.step='nextNight';advance(s);assert.equal(s.night,2);advance(s);assert.equal(s.step,'magician');assert.equal(canNext(s),true);assert.equal(selectSeat(s,9),false);
 s.players[0].alive=false;advance(s);assert.equal(s.step,'exchange');assert.equal(selectSeat(s,9),false);assert.equal(canNext(s),true);
});
test('election withdrawal handles none/one and two ties abandon sheriff',()=>{
 const s=ready();s.step='candidates';assert.equal(canNext(s),false);choose(s,'none');advance(s);assert.equal(s.step,'sheriffResult');assert.equal(s.sheriff,null);
 const a=ready();a.step='candidates';selectSeat(a,9);advance(a);assert.equal(a.sheriff,9);
 const b=ready();b.step='candidates';[9,10,11].forEach(id=>selectSeat(b,id));advance(b);choose(b,'draw');advance(b);selectSeat(b,11);advance(b);advance(b);
 choose(b,'tie');assert.equal(canNext(b),false);selectSeat(b,9);selectSeat(b,10);advance(b);assert.equal(b.step,'sheriffPK');advance(b);assert.equal(selectSeat(b,11),false);choose(b,'tie');advance(b);assert.equal(b.sheriff,null);
});
test('exile PK restricts second ballot and second tie goes to next night',()=>{
 const s=ready();s.step='voteIntro';advance(s);choose(s,'tie');selectSeat(s,9);selectSeat(s,10);advance(s);assert.equal(s.step,'exilePK');advance(s);
 assert.equal(selectSeat(s,11),false);choose(s,'tie');advance(s);assert.equal(s.step,'dark');assert.equal(s.night,2);assert.ok(s.players.every(p=>p.alive));
});
test('first-night last words precede skill, poison blocks skill, shots chain without last words',()=>{
 const s=ready();s.step='announcement';s.deaths=[{id:8,cause:'attack'}];advance(s);assert.equal(s.step,'lastWords');assert.equal(previous(s),false);advance(s);assert.equal(s.step,'skill');
 assert.equal(next(s),false);selectSeat(s,2);advance(s);assert.equal(s.step,'skill');assert.match(subtitle(s),/^2號玩家，啟動角色技能$/);choose(s,'skip');advance(s);assert.equal(s.step,'direction');
 const p=ready();p.step='announcement';p.deaths=[{id:8,cause:'poison'}];advance(p);advance(p);assert.equal(p.step,'direction');
 const n=ready();n.night=2;n.step='announcement';n.deaths=[{id:8,cause:'attack'}];advance(n);assert.equal(n.step,'skill');
});
test('last god hunter and last wolf king end game before skill',()=>{
 for(const id of [8,2]){const s=ready();s.step='announcement';if(id===8)[1,6,7].forEach(n=>s.players[n-1].alive=false);else [3,4,5].forEach(n=>s.players[n-1].alive=false);
 s.deaths=[{id,cause:'attack'}];advance(s);assert.equal(s.step,'finished');assert.equal(s.winner,id===8?'狼人陣營':'好人陣營');assert.equal(canNext(s),false);}
 const s=ready();s.players.filter(p=>p.role==='villager').forEach(p=>p.alive=false);assert.equal(winner(s),'狼人陣營');
});
