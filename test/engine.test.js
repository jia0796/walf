import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,upgradeGame,selectSeat,choose,next,previous,canNext,subtitle,potionBlocked,nightDeaths,winner,inspection,drawResult,drawPool,hasLastWords} from '../public/engine.js';
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
 selectSeat(s,1);assert.equal(selectSeat(s,2),true);assert.deepEqual(s.action,[2]);assert.equal(s.players[0].role,null);selectSeat(s,1);
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
 const s=ready();s.nightAction.exchange=[9,2];s.nightAction.attack=9;s.nightAction.inspect=9;assert.equal(inspection(s),'down');assert.deepEqual(nightDeaths(s),[{id:2,cause:'attack'}]);
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
 const b=ready();b.step='candidates';[9,10,11].forEach(id=>selectSeat(b,id));advance(b);choose(b,'draw');choose(b,'revealDraw');advance(b);selectSeat(b,11);advance(b);advance(b);
 choose(b,'tie');assert.equal(canNext(b),false);selectSeat(b,9);selectSeat(b,10);advance(b);assert.equal(b.step,'sheriffPK');advance(b);assert.equal(selectSeat(b,11),false);choose(b,'tie');advance(b);assert.equal(b.sheriff,null);
});
test('exile PK restricts second ballot and second tie goes to next night',()=>{
 const s=ready();s.step='voteIntro';advance(s);choose(s,'tie');selectSeat(s,9);selectSeat(s,10);advance(s);assert.equal(s.step,'exilePK');advance(s);
 assert.equal(selectSeat(s,11),false);choose(s,'tie');advance(s);assert.equal(s.step,'dark');assert.equal(s.night,2);assert.ok(s.players.every(p=>p.alive));
});
test('first-day last words include shots, poison blocks skill, second-day deaths show elimination first',()=>{
 const s=ready();s.step='announcement';s.deaths=[{id:8,cause:'attack'}];advance(s);assert.equal(s.step,'lastWords');advance(s);assert.equal(s.step,'skill');
 assert.equal(next(s),false);selectSeat(s,2);advance(s);assert.equal(s.step,'lastWords');advance(s);assert.equal(s.step,'skill');assert.match(subtitle(s),/^2號玩家，啟動角色技能$/);choose(s,'skip');advance(s);assert.equal(s.step,'dayDraw');
 const p=ready();p.step='announcement';p.deaths=[{id:8,cause:'poison'}];advance(p);advance(p);assert.equal(p.step,'dayDraw');
 const n=ready();n.night=2;n.step='announcement';n.deaths=[{id:8,cause:'attack'}];advance(n);assert.equal(n.step,'eliminated');advance(n);assert.equal(n.step,'skill');
});
test('last god hunter and last wolf king end game before skill',()=>{
 for(const id of [8,2]){const s=ready();s.step='announcement';if(id===8)[1,6,7].forEach(n=>s.players[n-1].alive=false);else [3,4,5].forEach(n=>s.players[n-1].alive=false);
 s.deaths=[{id,cause:'attack'}];advance(s);assert.equal(s.step,'lastWords');assert.equal(s.winner,id===8?'狼人陣營':'好人陣營');advance(s);assert.equal(s.step,'finished');assert.equal(canNext(s),false);}
 const s=ready();s.players.filter(p=>p.role==='villager').forEach(p=>p.alive=false);assert.equal(winner(s),'狼人陣營');
});
test('all required single targets and explicit opt-outs can be cancelled',()=>{
 for(const step of ['attack','inspect','poison','skill','badgeTransfer']){
  const s=ready();s.step=step;if(step==='poison'){s.nightAction.poison=true;s.potions.poison=false;}
  if(step==='skill'){s.queue=[{id:8,cause:'shot',noticeDone:true}];s.continuation='direction';}
  selectSeat(s,9);assert.equal(canNext(s),true);selectSeat(s,9);assert.equal(canNext(s),false,step);assert.deepEqual(s.action,[]);
 }
 for(const step of ['exchange','attack','skill','badgeTransfer']){const s=ready();s.step=step;choose(s,'skip');assert.equal(canNext(s),true);choose(s,'skip');assert.equal(canNext(s),false);}
 const s=firstNight();choose(s,'use');choose(s,'use');assert.equal(s.potions.antidote,true);assert.equal(canNext(s),false);
});
test('tie can be cancelled in both ballots, then corrected to a direct target',()=>{
 for(const step of ['sheriffVote','sheriffRevote','exileVote','exileRevote']){const s=ready();s.step=step;s.votePool=[9,10,11];
  selectSeat(s,9);choose(s,'tie');selectSeat(s,9);selectSeat(s,10);choose(s,'tie');assert.equal(s.choice,null);assert.deepEqual(s.action,[]);assert.equal(canNext(s),false);
  selectSeat(s,11);assert.equal(s.choice,'target');assert.equal(canNext(s),true);
 }
});
test('withdrawing and restoring a candidate changes the eligible draw pool',()=>{
 const s=ready();s.step='candidates';[9,10,11].forEach(id=>selectSeat(s,id));advance(s);choose(s,'draw');choose(s,'revealDraw');advance(s);
 selectSeat(s,10);assert.deepEqual(drawPool(s,'draw'),[9,11]);selectSeat(s,10);assert.deepEqual(drawPool(s,'draw'),[9,10,11]);
});
test('election lottery selects only living candidates and animation reveal never resamples',()=>{
 const s=ready();s.step='draw';s.candidates=[2,7,9];s.players[6].alive=false;
 for(let i=0;i<100;i++){const d=drawResult(s);assert.ok([2,9].includes(d.seat));assert.deepEqual(new Set(d.order),new Set([2,9]));}
 choose(s,'draw');assert.equal(canNext(s),false);const picked=structuredClone(s.draw);
 choose(s,'draw');assert.deepEqual(s.draw,picked);choose(s,'revealDraw');assert.equal(canNext(s),true);assert.equal(s.draw.seat,picked.seat);assert.equal(s.draw.clockwise,picked.clockwise);
 choose(s,'revealDraw');assert.equal(s.draw.seat,picked.seat);
});
test('back before and after the draw retains the published result; changed roster invalidates it',()=>{
 const s=ready();s.step='candidates';[9,10].forEach(id=>selectSeat(s,id));advance(s);choose(s,'draw');choose(s,'revealDraw');const d=structuredClone(s.draw);advance(s);
 previous(s);assert.deepEqual(s.draw,d);previous(s);advance(s);assert.deepEqual(s.draw,d);previous(s);selectSeat(s,11);advance(s);assert.equal(s.draw,null);
});
test('no-badge peaceful day draws from survivors; one/two night deaths use nearest survivor',()=>{
 const peaceful=ready();peaceful.step='dayDraw';peaceful.players[8].alive=false;
 const d=drawResult(peaceful,()=>0.5);assert.notEqual(d.seat,9);assert.equal(d.reference,null);assert.equal(d.order.length,11);
 const s=ready();s.step='dayDraw';s.deaths=[{id:9,cause:'attack'}];[9,10,11].forEach(id=>s.players[id-1].alive=false);
 const right=drawResult(s,()=>0);assert.equal(right.reference,9);assert.equal(right.clockwise,true);assert.equal(right.seat,12);assert.deepEqual(right.order,[12,1,2,3,4,5,6,7,8]);
 const left=drawResult(s,()=>0.9);assert.equal(left.clockwise,false);assert.equal(left.seat,8);
 s.deaths=[{id:9,cause:'attack'},{id:6,cause:'poison'}];s.players[5].alive=false;
 const sequence=[0.9,0];const two=drawResult(s,()=>sequence.shift());assert.equal(two.reference,6);assert.equal(two.seat,7);assert.ok(two.order.every(id=>s.players[id-1].alive));
 choose(s,'draw');choose(s,'revealDraw');const selected=structuredClone(s.draw);advance(s);previous(s);assert.deepEqual(s.draw,selected);
});
test('sheriff direction is a pure subtitle and can return without reviving announced deaths',()=>{
 const s=ready();s.sheriff=2;s.step='announcement';s.deaths=[{id:9,cause:'attack'}];advance(s);advance(s);assert.equal(s.step,'direction');
 assert.equal(canNext(s),true);assert.equal(choose(s,'left'),false);assert.equal(previous(s),true);assert.equal(s.step,'lastWords');assert.equal(s.players[8].alive,false);advance(s);assert.equal(s.step,'direction');
 previous(s);previous(s);assert.equal(s.step,'announcement');assert.equal(s.players[8].alive,false);const count=s.log.length;advance(s);assert.equal(s.log.length,count);
});
test('second-night hunter shot creates its own no-last-words subtitle before continuing',()=>{
 const s=ready();s.night=2;s.sheriff=2;s.step='announcement';s.deaths=[{id:8,cause:'attack'}];advance(s);
 assert.equal(subtitle(s),'8號玩家淘汰，沒有遺言。');advance(s);assert.equal(s.step,'skill');selectSeat(s,9);advance(s);
 assert.equal(s.step,'eliminated');assert.equal(subtitle(s),'9號玩家淘汰，沒有遺言。');assert.equal(s.players[8].alive,false);
 advance(s);assert.equal(s.step,'direction');assert.equal(s.log.length,2);previous(s);assert.equal(s.step,'eliminated');advance(s);assert.equal(s.log.length,2);
});
test('last-words priority covers first-day all causes, later exile, later shots and nights',()=>{
 const s=ready();for(const cause of ['attack','poison','shot','exile','other'])assert.equal(hasLastWords(s,{cause}),true);
 s.night=2;assert.equal(hasLastWords(s,{cause:'exile'}),true);for(const cause of ['attack','poison','shot','other'])assert.equal(hasLastWords(s,{cause}),false);
});
test('badge transfer waits for the entire hunter/king chain and only accepts final survivors',()=>{
 const s=ready();s.night=2;s.sheriff=8;s.step='announcement';s.deaths=[{id:8,cause:'attack'}];advance(s);advance(s);selectSeat(s,2);advance(s);
 assert.equal(s.step,'eliminated');assert.equal(s.pendingBadge,8);advance(s);assert.equal(s.step,'skill');selectSeat(s,9);advance(s);assert.equal(s.step,'eliminated');advance(s);
 assert.equal(s.step,'badgeTransfer');assert.equal(subtitle(s),'請警長移交警徽');assert.equal(canNext(s),false);assert.equal(selectSeat(s,9),false);assert.equal(selectSeat(s,8),false);
 selectSeat(s,10);advance(s);assert.equal(s.sheriff,10);assert.equal(s.step,'direction');previous(s);assert.equal(s.step,'badgeTransfer');assert.equal(s.players[8].alive,false);
 choose(s,'skip');advance(s);assert.equal(s.sheriff,null);assert.equal(s.step,'dayDraw');
});
test('night sheriff with no skill transfers after notice; exile badge loss returns to next night',()=>{
 const s=ready();s.night=2;s.sheriff=9;s.step='announcement';s.deaths=[{id:9,cause:'attack'}];advance(s);assert.equal(s.step,'eliminated');advance(s);assert.equal(s.step,'badgeTransfer');
 choose(s,'skip');advance(s);assert.equal(s.step,'dayDraw');
 const e=ready();e.night=2;e.sheriff=9;e.step='voteIntro';advance(e);selectSeat(e,9);advance(e);assert.equal(e.step,'lastWords');advance(e);assert.equal(e.step,'badgeTransfer');selectSeat(e,10);advance(e);assert.equal(e.step,'nextNight');assert.equal(e.sheriff,10);
});
test('winning deaths still get their notices but skip skill and badge transfer',()=>{
 const s=ready();s.night=2;s.sheriff=8;[1,6,7].forEach(id=>s.players[id-1].alive=false);s.step='announcement';s.deaths=[{id:8,cause:'attack'}];advance(s);
 assert.equal(s.winner,'狼人陣營');assert.equal(subtitle(s),'8號玩家淘汰，沒有遺言。');advance(s);assert.equal(s.step,'finished');
});
test('simultaneous deaths each receive exactly one notice and poison suppresses the relevant skill',()=>{
 const s=ready();s.night=2;s.sheriff=2;s.step='announcement';s.deaths=[{id:9,cause:'attack'},{id:8,cause:'poison'}];advance(s);
 const notices=[];while(s.step==='eliminated'){notices.push(subtitle(s));advance(s);}assert.deepEqual(notices,['9號玩家淘汰，沒有遺言。','8號玩家淘汰，沒有遺言。']);assert.equal(s.step,'direction');assert.equal(s.log.length,1);
});
test('saved v1 game migrates without changing identities/potions and published lotteries survive refresh',()=>{
 const old=ready();old.version=1;old.step='direction';old.potions.antidote=false;const migrated=upgradeGame(JSON.parse(JSON.stringify(old)));
 assert.equal(migrated.step,'dayDraw');assert.deepEqual(migrated.players,old.players);assert.equal(migrated.potions.antidote,false);assert.equal(migrated.version,2);
 const s=ready();s.step='draw';s.candidates=[9,10];choose(s,'draw');choose(s,'revealDraw');const loaded=upgradeGame(JSON.parse(JSON.stringify(s)));assert.deepEqual(loaded.draw,s.draw);choose(loaded,'draw');assert.deepEqual(loaded.draw,s.draw);
});
