import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createGame,selectSeat,selectable,choose,next,canNext,previous,upgradeGame,restartGame,nightSteps,subtitle,roleName,inspection,markersForSeat,eligibleVoters,mixedResult,canSelfDestruct} from '../public/engine.js';
import {BOARDS,ROLE_DATA} from '../public/data.js';
import {trueWinner,ordinaryWolves,winnerReason} from '../public/night.js';
import {recapNights} from '../public/records.js';
import {cardModel} from '../public/recap.js';
const go=s=>assert.equal(next(s),true,'blocked '+s.step);
function ready(board='classicMixed12',rules={}){const s=createGame(board,{sheriff:false,...rules});let id=1;for(const [role,count]of Object.entries(BOARDS[board].roles))for(let i=0;i<count;i++)s.players[id++-1].role=role;s.rolesConfirmed=true;return s;}
const seat=(s,role)=>s.players.find(p=>p.role===role).id;
function vote(s,id,stage='exileVote'){s.step=stage;s.votePool=s.players.filter(p=>p.alive).map(p=>p.id);assert.equal(selectSeat(s,id),true);go(s);}
function model(s,id){s.step='roleModel';assert.equal(selectSeat(s,id),true);go(s);}
function knife(s,id){s.step='attack';if(id)selectSeat(s,id);else choose(s,'skip');go(s);s.step='antidote';if(canNext(s))go(s);else{choose(s,'skip');go(s);}}
function poison(s,id){s.step='poison';choose(s,id?'use':'skip');if(id)selectSeat(s,id);go(s);}
for(const board of ['classic12','classicMixed12']){
 test(board+' complete first-night registration, role counts, defaults and second-night order',()=>{
  const b=BOARDS[board],s=createGame(board);assert.equal(b.playerCount,12);assert.equal(b.defaults.idiotChase,false);assert.equal(b.defaults.swallow,true);assert.equal(Object.values(b.roles).reduce((a,n)=>a+n,0),12);assert.equal(b.roles.wolf,4);assert.equal(b.roles.villager,board==='classic12'?4:3);
  const assigned={};let id=1;for(const [r,c]of Object.entries(b.roles))assigned[r]=Array.from({length:c},()=>id++);
  go(s);go(s);assert.equal(subtitle(s),'狼人請睜眼，確認彼此身分');assert.equal(next(s),false);assigned.wolf.forEach(id=>selectSeat(s,id));go(s);choose(s,'skip');go(s);
  selectSeat(s,assigned.witch[0]);go(s);assert.equal(subtitle(s),'今晚他死了，你要使用解藥嗎？');go(s);choose(s,'skip');go(s);go(s);
  selectSeat(s,assigned.seer[0]);go(s);selectSeat(s,1);go(s);assert.equal(inspection(s),'down');go(s);go(s);selectSeat(s,assigned.hunter[0]);go(s);go(s);go(s);
  assert.equal(subtitle(s),'白痴請睜眼');assert.equal(next(s),false);selectSeat(s,assigned.idiot[0]);assert.equal(selectSeat(s,1),false);go(s);assert.equal(subtitle(s),'白痴請閉眼');go(s);
  if(b.roles.mixed){assert.equal(subtitle(s),'混血兒請睜眼');assert.equal(next(s),false);selectSeat(s,assigned.mixed[0]);go(s);assert.equal(s.players.filter(p=>p.role==='villager').length,3);assert.equal(subtitle(s),'選擇你要跟隨的榜樣');assert.equal(next(s),false);selectSeat(s,1);go(s);assert.equal(subtitle(s),'混血兒請閉眼');go(s);}
  assert.equal(s.step,'candidates');choose(s,'none');go(s);assert.equal(s.step,'dawn');assert.equal(s.players.filter(p=>p.role==='villager').length,b.roles.villager);
  assert.equal(recapNights(s)[0].events.some(e=>e.actorRole==='idiot'),false);assert.equal(recapNights(s)[0].events.filter(e=>e.skill==='role-model').length,b.roles.mixed?1:0);
  s.night=2;assert.deepEqual(nightSteps(s),['dark','wolves','attack','witch','antidote','poison','witchClose','seer','inspect','inspectResult','seerClose','hunter','gesture','hunterClose','dawn']);
 });
 for(const stage of ['exileVote','exileRevote'])test(board+' '+stage+' flips without death, words or re-vote; forbids all later exile targets',()=>{
  const s=ready(board),id=seat(s,'idiot');vote(s,id,stage);assert.equal(s.step,'idiotReveal');assert.equal(subtitle(s),id+'號玩家翻牌，身分為白痴，本次放逐無效');assert.equal(s.players[id-1].alive,true);assert.equal(s.idiot.voteLost,true);assert.equal(s.idiot.exileBanned,true);assert.equal(s.idiot.countsEliminatedForVictory,true);assert.deepEqual(s.queue,[]);assert.deepEqual(s.deaths,[]);assert.deepEqual(s.log,[]);assert.equal(eligibleVoters(s).some(p=>p.id===id),false);assert.equal(roleName(s,s.players[id-1]),'白痴・已翻牌');
  go(s);assert.equal(s.step,'nextNight');go(s);assert.equal(s.night,2);
  for(const step of ['exileVote','exileRevote']){s.step=step;s.votePool=s.players.filter(p=>p.alive).map(p=>p.id);assert.equal(selectSeat(s,id),false);s.action=[id];assert.equal(canNext(s),false);s.action=[];}
  s.step='discussion';assert.equal(selectable(s,id),true);s.step='attack';assert.equal(selectable(s,id),true);s.step='poison';choose(s,'use');assert.equal(selectable(s,id),true);
 });
 for(const victory of ['edge','city'])for(const idiotChase of [false,true])test(board+' last idiot '+victory+' chase='+idiotChase+' victory uses counting without changing alive',()=>{
  const s=ready(board,{victory,idiotChase}),id=seat(s,'idiot');s.players.filter(p=>victory==='city'?ROLE_DATA[p.role].kind!=='wolf'&&p.id!==id:ROLE_DATA[p.role].kind==='god'&&p.id!==id).forEach(p=>p.alive=false);s.sheriff=id;vote(s,id);assert.equal(s.players[id-1].alive,true);assert.equal(s.idiot.countsEliminatedForVictory,!idiotChase);
  if(!idiotChase){assert.equal(s.winner,'狼人陣營');assert.equal(s.step,'finished');assert.equal(s.pendingBadge,null);assert.equal(s.sheriff,id);assert.equal(s.winnerReason,victory==='city'?'屠城：所有好人已出局':'屠邊：所有神職已出局');}
  else{assert.equal(s.winner,null);assert.equal(s.step,'idiotReveal');go(s);assert.equal(s.step,'badgeTransfer');}
 });
}
for(const transfer of ['give','tear'])test('revealed alive sheriff immediately transfers or tears badge without death queue '+transfer,()=>{
 const s=ready(),id=seat(s,'idiot');s.sheriff=id;vote(s,id);assert.equal(s.sheriff,id);go(s);assert.equal(s.step,'badgeTransfer');assert.equal(subtitle(s),'請警長移交警徽');assert.equal(selectSeat(s,id),false);s.players[3].alive=false;assert.equal(selectSeat(s,4),false);
 if(transfer==='give')selectSeat(s,5);else choose(s,'skip');go(s);assert.equal(s.sheriff,transfer==='give'?5:null);assert.equal(s.step,'nextNight');assert.deepEqual(s.queue,[]);assert.equal(s.players[id-1].alive,true);
 assert.equal(previous(s),true);assert.equal(s.sheriff,id);assert.equal(s.pendingBadge,id);assert.equal(previous(s),true);assert.equal(s.step,'idiotReveal');assert.equal(previous(s),true);assert.equal(s.idiot.revealed,false);assert.equal(s.idiot.voteLost,false);assert.equal(s.sheriff,id);
});
for(const revealed of [false,true])for(const cause of ['attack','poison'])test('idiot '+cause+' truly dies independently from reveal='+revealed,()=>{
 const s=ready('classic12'),id=seat(s,'idiot');if(revealed){vote(s,id);go(s);go(s);}knife(s,cause==='attack'?id:null);poison(s,cause==='poison'?id:null);assert.ok(s.deaths.some(d=>d.id===id));assert.equal(s.players[id-1].alive,true);s.step='announcement';go(s);assert.equal(s.players[id-1].alive,false);assert.equal(s.idiot.countsEliminatedForVictory,true);assert.equal(s.idiot.revealed,revealed);assert.equal(recapNights(s).at(-1).deaths.filter(d=>d.id===id).length,1);
});
test('mixed mandatory model excludes self and empty; immutable commitment, dead model and individual victory',()=>{
 const s=ready(),id=seat(s,'mixed');s.step='roleModel';assert.equal(selectSeat(s,id),false);assert.equal(choose(s,'skip'),false);assert.equal(next(s),false);model(s,1);assert.equal(s.mixed.chosen,true);assert.equal(s.mixed.camp,'狼人陣營');assert.equal(roleName(s,s.players[id-1]),'混血兒（狼）');assert.equal(ROLE_DATA.mixed.kind,'villager');assert.equal(ordinaryWolves(s).length,4);s.step='roleModel';assert.equal(selectSeat(s,5),false);assert.equal(s.mixed.target,1);s.players[0].alive=false;s.players[id-1].alive=false;s.winner='狼人陣營';assert.equal(mixedResult(s).won,true);s.winner='好人陣營';assert.equal(mixedResult(s).won,false);assert.equal(mixedResult(s).targetRole,'wolf');
 s.winner=null;s.step='inspect';assert.equal(selectSeat(s,id),false);s.players[id-1].alive=true;selectSeat(s,id);assert.equal(inspection(s),'up');s.step='selfDestruct';assert.equal(selectable(s,id),false);s.players.filter(p=>p.role==='wolf').forEach(p=>p.alive=false);s.step='discussion';assert.equal(canSelfDestruct(s),false);
});
for(const victim of ['mixed','model'])for(const cause of ['attack','poison'])test('first-night '+victim+' '+cause+' death still permits model selection without saving victim',()=>{
 const s=ready(),id=seat(s,'mixed'),target=5,victimId=victim==='mixed'?id:target;knife(s,cause==='attack'?victimId:null);poison(s,cause==='poison'?victimId:null);assert.equal(s.winner,null);assert.ok(s.nightState.deaths.some(d=>d.id===victimId));s.step='roleModel';assert.equal(selectSeat(s,target),true);go(s);assert.equal(s.mixed.target,target);assert.equal(s.mixed.camp,'好人陣營');assert.equal(roleName(s,s.players[id-1]),'混血兒（好）');s.step='announcement';go(s);assert.equal(s.players[victimId-1].alive,false);assert.equal(s.mixed.target,target);
});
test('early terminal does not require model or fabricate a skill event',()=>{
 const s=ready(),id=seat(s,'mixed');s.players.filter(p=>ROLE_DATA[p.role].kind==='villager'&&p.id!==id).forEach(p=>p.alive=false);s.potions.antidote=false;s.step='attack';selectSeat(s,id);go(s);assert.equal(s.winner,'狼人陣營');assert.equal(s.step,'dawn');assert.equal(s.mixed.chosen,false);assert.equal(recapNights(s)[0].events.some(e=>e.skill==='role-model'),false);go(s);assert.equal(s.step,'finished');
});
for(const target of [1,5])test('mixed model snapshot, mark lifecycle, one green first-night recap target='+target,()=>{
 const s=ready();s.step='roleModel';selectSeat(s,target);assert.equal(markersForSeat(s,target)[0].type,'role-model');assert.equal(selectSeat(s,target),true);assert.deepEqual(markersForSeat(s,target),[]);selectSeat(s,target);go(s);const event=recapNights(s)[0].events.find(e=>e.skill==='role-model');assert.equal(cardModel(event).tone,'villager');assert.equal(cardModel(event).image,'art/mixed-blood-dual-approved.jpeg');
 const restored=upgradeGame(JSON.parse(JSON.stringify(s)));assert.deepEqual(restored,s);assert.equal(previous(restored),true);assert.equal(restored.mixed.chosen,false);assert.equal(recapNights(restored).flatMap(r=>r.events).length,0);selectSeat(restored,target);assert.deepEqual(markersForSeat(restored,target),[]);
 s.step='nextNight';go(s);assert.equal(s.mixed.target,target);assert.equal(markersForSeat(s,target).length,0);assert.equal(nightSteps(s).includes('roleModel'),false);assert.equal(recapNights(s).flatMap(r=>r.events).filter(e=>e.skill==='role-model').length,1);
 const fresh=restartGame(s);assert.deepEqual(fresh.rules,s.rules);assert.equal(fresh.mixed.chosen,false);assert.equal(fresh.idiot.revealed,false);assert.equal(fresh.lucky,null);assert.deepEqual(fresh.nightRecords,[]);
});
for(const mode of ['edge','city'])test('wolf mixed counts as civilian and never as a fifth wolf '+mode,()=>{
 const s=ready('classicMixed12',{victory:mode});model(s,1);s.players.filter(p=>mode==='city'?ROLE_DATA[p.role].kind!=='wolf'&&p.role!=='mixed':p.role==='villager').forEach(p=>p.alive=false);assert.equal(trueWinner(s),null);s.players.find(p=>p.role==='mixed').alive=false;assert.equal(trueWinner(s),'狼人陣營');
 const good=ready('classicMixed12',{victory:mode});model(good,1);good.players.filter(p=>p.role==='wolf').forEach(p=>p.alive=false);good.winner=trueWinner(good);assert.equal(good.winner,'好人陣營');assert.equal(mixedResult(good).won,false);
});
test('god-side wipe ignores still-alive wolf mixed; model death never changes camp',()=>{
 const s=ready();model(s,1);s.players.filter(p=>ROLE_DATA[p.role].kind==='god').forEach(p=>p.alive=false);s.winner=trueWinner(s);assert.equal(s.winner,'狼人陣營');assert.equal(s.players.find(p=>p.role==='mixed').alive,true);assert.equal(mixedResult(s).won,true);assert.equal(winnerReason(s),'屠邊：所有神職已出局');
});
for(const original of ['villager','seer','witch','hunter'])test('lucky name and original-role recap color '+original,()=>{
 const s=ready('brothers12'),id=seat(s,original);s.step='trade';choose(s,'gift:inspect');selectSeat(s,id);go(s);assert.equal(roleName(s,s.players[id-1]),ROLE_DATA[original].name+'（幸）');assert.equal(s.players[id-1].role,original);s.step='nextNight';go(s);s.step='luckyAction';selectSeat(s,1);go(s);const event=recapNights(s).at(-1).events.find(e=>e.displayRole==='lucky'),c=cardModel(event);assert.equal(c.name,'幸運兒');assert.equal(c.tone,original==='villager'?'villager':'god');assert.equal(c.image,ROLE_DATA[original].image);s.players[id-1].alive=false;assert.equal(roleName(s,s.players[id-1]),ROLE_DATA[original].name+'（幸）');
});
test('v7 unfinished save and history migrate without losing original games, records or potions',()=>{
 const s=ready('12');s.version=7;delete s.idiot;delete s.mixed;delete s.nightAction.roleModel;s.potions.poison=false;const h=structuredClone(s);delete h.history;h.step='poison';s.history=[h];const upgraded=upgradeGame(JSON.parse(JSON.stringify(s)));assert.equal(upgraded.version,9);assert.deepEqual(upgraded.potions,s.potions);assert.deepEqual(upgraded.nightRecords,s.nightRecords);assert.equal(upgraded.mixed.chosen,false);assert.equal(previous(upgraded),true);assert.equal(upgraded.step,'poison');assert.equal(upgraded.idiot.revealed,false);
});
test('formal assets and script/skill metadata are wired without host portraits',async()=>{
 for(const role of ['idiot','mixed']){const b=await readFile(new URL('../public/'+ROLE_DATA[role].image,import.meta.url));assert.ok(b.length>500000);}
 const svg=await readFile(new URL('../public/skills/icon-role-model.svg',import.meta.url),'utf8');assert.match(svg,/<svg/);
 const app=await readFile(new URL('../public/app.js',import.meta.url),'utf8'),html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');assert.ok(html.includes('ruleIdiotChase'));assert.ok(html.includes('mixedOutcome'));assert.ok(app.includes("if(s==='idiot')return '確認身分'"));assert.ok(app.includes('mixedResult(game)'));assert.equal(app.includes('eventCard('),false);
});
