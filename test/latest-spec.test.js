import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,next,previous,choose,selectSeat,markersForSeat,subtitle,upgradeGame,mechanicalAbility,nightSteps,canSelfDestruct,beginSelfDestruct} from '../public/engine.js';
import {BOARDS} from '../public/data.js';
import {settleNight,basicActor} from '../public/night.js';
const go=s=>assert.equal(next(s),true,'cannot advance '+s.step);
function ready(board='mechanical12'){const s=createGame(board);let i=0;for(const [role,n]of Object.entries(BOARDS[board].roles))for(let k=0;k<n;k++)s.players[i++].role=role;s.rolesConfirmed=true;return s;}
for(const mode of ['next','allDead']){
 test('extra knife '+mode+' can defer, consumes once, basic takeover persists and undo restores',()=>{
  const s=ready();s.rules.mechanicalKnife=mode;Object.assign(s.mechanical,{role:'wolf',night:1});s.night=2;if(mode==='allDead')s.players.filter(p=>p.role==='wolf').forEach(p=>p.alive=false);
  s.step='mechanical';go(s);choose(s,'skip');go(s);assert.equal(s.mechanical.extraUsed,false);
  s.step='nextNight';go(s);s.step='mechanical';go(s);assert.equal(s.operation,'extraAttack');selectSeat(s,9);go(s);assert.equal(s.mechanical.extraUsed,true);assert.equal(s.mechanical.extraUsedNight,3);assert.equal(s.mechanical.extraTarget,9);assert.equal(settleNight(s).events.find(e=>e.source==='extra').id,9);
  previous(s);assert.equal(s.mechanical.extraUsed,false);go(s);s.players.filter(p=>p.role==='wolf').forEach(p=>p.alive=false);s.step='nextNight';go(s);assert.equal(mechanicalAbility(s),null);assert.equal(basicActor(s).role,'mechanical');s.step='attack';selectSeat(s,10);go(s);assert.equal(settleNight(s).events.length,1);assert.equal(settleNight(s).events[0].source,'basic');
 });
}
test('same-target basic and extra knives keep two raw markers and separate damage',()=>{
 const s=ready();s.night=2;Object.assign(s.mechanical,{role:'wolf',night:1});s.step='mechanical';go(s);selectSeat(s,9);go(s);s.step='attack';selectSeat(s,9);assert.deepEqual(markersForSeat(s,9).map(m=>m.key),['extra','basic']);assert.equal(settleNight(s).events.length,2);selectSeat(s,9);assert.deepEqual(markersForSeat(s,9).map(m=>m.key),['extra']);assert.equal(next(s),false);choose(s,'skip');go(s);
});
test('markers remain raw under swap, include partner and preserve operation order through back',()=>{
 const s=ready('12');s.step='exchange';selectSeat(s,1);selectSeat(s,9);go(s);s.step='attack';selectSeat(s,1);go(s);s.step='antidote';choose(s,'skip');go(s);s.step='poison';choose(s,'use');selectSeat(s,1);
 assert.deepEqual(markersForSeat(s,1).map(m=>m.type),['swap','wolf-attack','poison']);assert.equal(markersForSeat(s,1)[0].partner,9);assert.equal(markersForSeat(s,9)[0].partner,1);assert.equal(settleNight(s).deaths[0].id,9);go(s);previous(s);assert.deepEqual(markersForSeat(s,1).map(m=>m.type),['swap','wolf-attack','poison']);selectSeat(s,1);assert.deepEqual(markersForSeat(s,1).map(m=>m.type),['swap','wolf-attack']);
});
for(const board of Object.keys(BOARDS))for(const all of [false,true]){
 test(board+' '+(all?'all':'none')+' candidates permanently skip election, show exact notice once',()=>{
  const s=ready(board);s.step='candidates';if(all)s.players.filter(p=>p.active).forEach(p=>selectSeat(s,p.id));else choose(s,'none');go(s);go(s);assert.equal(s.step,'noSheriffNotice');assert.equal(subtitle(s),all?'本局全員上警，沒有警長':'本局全員不上警，沒有警長');go(s);assert.equal(s.step,'announcement');assert.equal(s.electionStatus,'none');previous(s);assert.equal(s.noSheriffNoticeShown,false);go(s);s.step='nextNight';go(s);s.step='dawn';go(s);assert.equal(s.step,'announcement');
 });
}
test('12 defaults swallow on, 10 off, swallowed notice only next dawn once and back restores',()=>{
 for(const b of Object.values(BOARDS))assert.equal(b.defaults.swallow,b.playerCount===12);
 const s=ready();s.badgeSwallowed=true;s.electionStatus='none';s.swallowNoticeNight=2;s.night=2;s.step='dawn';go(s);assert.equal(subtitle(s),'本局雙爆吞警徽，沒有警長');go(s);assert.equal(s.swallowNoticeShown,true);previous(s);assert.equal(s.swallowNoticeShown,false);go(s);s.step='nextNight';go(s);s.step='dawn';go(s);assert.equal(s.step,'announcement');
});
test('v4 saved knife history migrates to consumed and stays consumed through subsequent back',()=>{
 const s=ready();s.version=4;s.night=2;Object.assign(s.mechanical,{role:'wolf',night:1});s.step='mechanical';go(s);selectSeat(s,9);go(s);s.step='nextNight';go(s);s.step='dark';go(s);
 const old=JSON.parse(JSON.stringify(s));delete old.mechanical.extraUsed;delete old.mechanical.extraUsedNight;delete old.mechanical.extraTarget;for(const h of old.history){h.version=4;delete h.mechanical.extraUsed;delete h.mechanical.extraUsedNight;delete h.mechanical.extraTarget;}
 const loaded=upgradeGame(old);assert.equal(loaded.mechanical.extraUsed,true);previous(loaded);assert.equal(loaded.mechanical.extraUsed,true);assert.equal(mechanicalAbility(loaded),null);
});
test('v4 migration reconstructs raw marker order from nightly operation history',()=>{
 const s=ready();s.night=2;s.step='guardTarget';selectSeat(s,9);go(s);s.step='attack';selectSeat(s,9);go(s);const old=JSON.parse(JSON.stringify(s));old.version=4;delete old.marks;delete old.markSequence;for(const h of old.history){h.version=4;delete h.marks;delete h.markSequence;}const migrated=upgradeGame(old);assert.deepEqual(markersForSeat(migrated,9).map(m=>m.key),['guard','basic']);
});
test('day draw and sheriff direction allow eligible wolf interruption and preserve back',()=>{
 for(const step of ['dayDraw','direction','sheriffResult']){const s=ready();s.step=step;s.deathsCommitted=true;assert.equal(canSelfDestruct(s),true);assert.equal(beginSelfDestruct(s),true);assert.equal(selectSeat(s,1),false);selectSeat(s,2);go(s);assert.equal(s.step,'lastWords');go(s);assert.equal(s.step,'nextNight');previous(s);previous(s);previous(s);assert.equal(s.step,step);assert.equal(s.players[1].alive,true);}
});
