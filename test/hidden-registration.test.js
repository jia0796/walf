import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,next,previous,selectSeat,selectable,canNext,choose,upgradeGame,inspection,nightSteps,restartGame} from '../public/engine.js';
import {BOARDS} from '../public/data.js';

const go=s=>assert.equal(next(s),true,s.step);
function firstNight(board,{guard=false,cure=false}={}){
 const s=createGame(board,{sheriff:false}),assigned={};let seat=1;
 for(const [role,n] of Object.entries(BOARDS[board].roles))assigned[role]=Array.from({length:n},()=>seat++);
 assert.equal(canNext(s),true);assert.equal(selectSeat(s,assigned.hiddenWolf[0]),false);go(s);
 while(s.step!=='hiddenWolf'){
  if(['guard','wolves'].includes(s.step))for(const id of s.step==='wolves'?[...assigned.seedWolf,...assigned.wolf]:assigned.guard)assert.equal(selectSeat(s,id),true);
  if(s.step==='guardTarget'){if(guard)selectSeat(s,assigned.hiddenWolf[0]);else choose(s,'skip');}
  if(s.step==='attack'){assert.equal(s.players[assigned.hiddenWolf[0]-1].role,null);assert.equal(selectSeat(s,assigned.hiddenWolf[0]),true);}
  go(s);
 }
 return {s,assigned,cure};
}
function finishNight(s,a,cure=false){
 while(s.step!=='dawn'){
  if(['witch','seer','hunter'].includes(s.step))selectSeat(s,a[s.step][0]);
  if(s.step==='antidote')choose(s,cure?'use':'skip');
  if(s.step==='poison')choose(s,'skip');
  if(s.step==='inspect'){selectSeat(s,a.hiddenWolf[0]);assert.equal(inspection(s),'up');}
  go(s);
 }
}
for(const board of ['seedHidden10','seedHidden12']){
 test(board+' N03 pending identity, mandatory choice, cancellation and reassignment',()=>{
  const {s,assigned:a}=firstNight(board);const target=a.hiddenWolf[0];
  assert.equal(s.rolesConfirmed,false);assert.equal(canNext(s),false);assert.equal(next(s),false);
  assert.equal(selectable(s,a.guard[0]),false);assert.equal(selectable(s,a.seedWolf[0]),false);
  assert.equal(s.players.filter(p=>p.role==='hiddenWolf').length,0);
  selectSeat(s,target);assert.equal(canNext(s),true);selectSeat(s,target);assert.equal(canNext(s),false);
  selectSeat(s,a.villager[0]);selectSeat(s,target);
  assert.equal(s.players[a.villager[0]-1].role,null);assert.equal(s.players.filter(p=>p.role==='hiddenWolf').length,1);
  const restored=upgradeGame(JSON.parse(JSON.stringify(s)));assert.deepEqual(restored,s);
  go(restored);assert.equal(restored.step,'hiddenWolfClose');previous(restored);selectSeat(restored,a.villager[0]);
  assert.equal(restored.players[target-1].role,null);assert.equal(restored.players[a.villager[0]-1].role,'hiddenWolf');
  previous(s);assert.equal(s.step,'wolvesClose');assert.equal(s.players.filter(p=>p.role==='hiddenWolf').length,0);
  assert.equal(s.nightAction.attack,target);
 });
 for(const guard of [false,true])for(const cure of [false,true])test(board+' N04 unregistered wolf target defense guard='+guard+' cure='+cure,()=>{
  const {s,assigned:a}=firstNight(board,{guard});selectSeat(s,a.hiddenWolf[0]);go(s);finishNight(s,a,cure);
  assert.equal(s.rolesConfirmed,true);for(const [r,n]of Object.entries(BOARDS[board].roles))assert.equal(s.players.filter(p=>p.role===r).length,n);
  assert.equal(s.nightState.deaths.some(d=>d.id===a.hiddenWolf[0]),guard===cure);
  assert.equal(s.players[a.hiddenWolf[0]-1].alive,true);assert.equal(s.potions.antidote,!cure);
  s.night=2;assert.equal(nightSteps(s).includes('hiddenWolf'),false);
  const fresh=restartGame(s);assert.equal(fresh.players.some(p=>p.role),false);assert.equal(fresh.step,'confirm');
 });
 test(board+' legacy preselected hidden identity survives without duplicate',()=>{
  const {s,assigned:a}=firstNight(board);s.players[a.hiddenWolf[0]-1].role='hiddenWolf';s.step='wolvesClose';go(s);
  assert.equal(canNext(s),true);go(s);assert.equal(s.players.filter(p=>p.role==='hiddenWolf').length,1);
 });
}
