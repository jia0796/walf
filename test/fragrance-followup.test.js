import {createGame} from '../test-support/legacy-flow.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {next,previous,selectSeat,choose,subtitle,markersForSeat,upgradeGame,gunSources,beginSelfDestruct} from '../public/engine.js';
import {BOARDS} from '../public/data.js';
const ready=count=>{const s=createGame('fragrance'+count,{sheriff:false});let i=0;for(const [r,n] of Object.entries(BOARDS[s.boardId].roles))for(let j=0;j<n;j++)s.players[i++].role=r;s.rolesConfirmed=true;return s;};
const ids=(s,r)=>s.players.filter(p=>p.active&&p.role===r).map(p=>p.id);
const go=s=>assert.equal(next(s),true,s.step);
function bind(s,a,b){s.step='bond';selectSeat(s,a);selectSeat(s,b);go(s);}
function exile(s,id){s.step='exileVote';s.votePool=s.players.filter(p=>p.active&&p.alive).map(p=>p.id);selectSeat(s,id);go(s);}
const bonds=s=>s.marks.filter(m=>m.type==='bond');
for(const count of [10,12]){
 test('fragrance '+count+' exile announces original then linked player, with badge and undo',()=>{
  const s=ready(count),[a,b]=ids(s,'villager');bind(s,a,b);s.sheriff=b;exile(s,a);
  assert.equal(s.step,'lastWords');assert.equal(subtitle(s),a+'號玩家出局，請發表遺言');assert.ok(!s.players[a-1].alive&&!s.players[b-1].alive);assert.equal(s.fragrance.used,true);
  go(s);assert.equal(subtitle(s),b+'號玩家殉情出局，沒有遺言');assert.equal(s.step,'fragranceAnnouncement');
  previous(s);assert.equal(s.step,'lastWords');previous(s);assert.equal(s.step,'exileVote');assert.ok(s.players[a-1].alive&&s.players[b-1].alive);assert.equal(s.fragrance.used,false);assert.equal(bonds(s).length,2);
  go(s);go(s);const restored=upgradeGame(JSON.parse(JSON.stringify(s)));assert.equal(subtitle(restored),b+'號玩家殉情出局，沒有遺言');go(restored);assert.equal(restored.step,'badgeTransfer');assert.equal(restored.dayEvents.filter(e=>e.type==='fragranceHeartbreak').length,1);
 });
 test('fragrance '+count+' confirmed knife retains marks through night until public announcement',()=>{
  const s=ready(count);s.night=2;const [a,b]=ids(s,'villager');bind(s,a,b);const before=bonds(s);s.potions.antidote=false;s.step='attack';selectSeat(s,a);go(s);
  assert.equal(s.step,'wolvesClose');assert.equal(s.fragrance.used,true);assert.ok(s.players[a-1].alive&&s.players[b-1].alive);assert.deepEqual(bonds(s),before);
  const legacy=JSON.parse(JSON.stringify(s));legacy.marks=legacy.marks.filter(m=>m.type!=='bond');const loaded=upgradeGame(legacy);assert.deepEqual(bonds(loaded),before);assert.deepEqual(markersForSeat(loaded,a).map(m=>m.type),['bond','wolf-attack']);
  previous(loaded);assert.equal(loaded.fragrance.used,false);assert.equal(bonds(loaded).length,2);go(loaded);assert.deepEqual(bonds(loaded),before);
  loaded.step='announcement';go(loaded);assert.equal(loaded.deathsCommitted,true);assert.equal(bonds(loaded).length,0);assert.ok(!loaded.players[a-1].alive&&!loaded.players[b-1].alive);
  previous(loaded);assert.equal(loaded.step,'announcement');assert.deepEqual(bonds(loaded),before);assert.ok(loaded.players[a-1].alive);assert.deepEqual(bonds(upgradeGame(JSON.parse(JSON.stringify(loaded)))),before);
 });
 test('fragrance '+count+' saved pending poison keeps marks, next night expires them',()=>{
  const s=ready(count);s.night=2;const [a,b]=ids(s,'villager');bind(s,a,b);s.step='attack';choose(s,'skip');go(s);s.step='antidote';go(s);s.step='poison';choose(s,'use');selectSeat(s,a);go(s);
  assert.equal(s.fragrance.used,true);assert.equal(bonds(s).length,2);assert.equal(bonds(upgradeGame(JSON.parse(JSON.stringify(s)))).length,2);
  s.step='announcement';go(s);assert.equal(bonds(s).length,0);s.step='nextNight';go(s);assert.equal(s.fragrance.binding,null);assert.equal(bonds(s).length,0);assert.equal(s.fragrance.used,true);
 });
 test('fragrance '+count+' self explosion announcement precedes heartbreak',()=>{
  const s=ready(count),w=ids(s,'wolf')[0],v=ids(s,'villager')[0];bind(s,w,v);s.step='discussion';assert.equal(beginSelfDestruct(s),true);selectSeat(s,w);go(s);
  assert.equal(subtitle(s),w+'號玩家選擇自爆，請發表遺言');go(s);assert.equal(subtitle(s),v+'號玩家殉情出局，沒有遺言');
 });
}
test('fragrance 12 original exiled hunter announces before heartbreak and then can shoot',()=>{
 const s=ready(12),h=ids(s,'hunter')[0],v=ids(s,'villager')[0];bind(s,h,v);exile(s,h);assert.equal(s.step,'lastWords');assert.deepEqual(gunSources(s,s.queue[0]),['native']);go(s);assert.equal(s.step,'fragranceAnnouncement');go(s);assert.equal(s.step,'skill');assert.equal(s.queue[0].id,h);
});
