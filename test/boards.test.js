import test from 'node:test';
import assert from 'node:assert/strict';
import {BOARDS,ROLE_DATA} from '../public/data.js';
import {createGame,selectSeat,selectable,choose,next,previous,winner,subtitle,potionBlocked,nightDeaths,beginSelfDestruct,canSelfDestruct,skillTarget,canNext,drawResult} from '../public/engine.js';
const go=s=>assert.equal(next(s),true,'cannot leave '+s.step);
function ready(board='12',rules={}){const s=createGame(board,rules);let id=0;for(const [role,count] of Object.entries(BOARDS[board].roles))for(let i=0;i<count;i++)s.players[id++].role=role;s.rolesConfirmed=true;return s;}
const seat=(s,r)=>s.players.find(p=>p.role===r).id;
function drain(s,stop){for(let i=0;i<80&&!stop.includes(s.step);i++){if(s.step==='skill'||s.step==='badgeTransfer')choose(s,'skip');go(s);}assert.ok(stop.includes(s.step));}
test('boards share role data and exactly count 10/12 players',()=>{for(const b of Object.values(BOARDS)){assert.equal(Object.values(b.roles).reduce((a,c)=>a+c,0),b.playerCount);for(const r of Object.keys(b.roles))assert.ok(ROLE_DATA[r]);}});
test('10-player first night has no hunter, correct wolf count, inactive seats locked, election before dawn',()=>{
 const s=createGame('10');go(s);go(s);selectSeat(s,1);go(s);choose(s,'skip');go(s);go(s);[2,3,4].forEach(id=>selectSeat(s,id));go(s);choose(s,'skip');go(s);selectSeat(s,5);go(s);go(s);choose(s,'skip');go(s);go(s);selectSeat(s,6);go(s);selectSeat(s,7);go(s);go(s);go(s);
 assert.equal(s.step,'candidates');assert.equal(s.players.filter(p=>p.role==='villager').length,4);assert.ok(!s.players.some(p=>p.role==='hunter'));for(const id of [11,12])assert.equal(selectable(s,id),false);
 choose(s,'none');go(s);assert.equal(s.step,'dawn');go(s);assert.equal(s.step,'noSheriffNotice');
});
test('sheriff off bypasses first-night election and second-night wolves omit identity phrase',()=>{
 const s=ready('10',{sheriff:false});s.step='seerClose';go(s);assert.equal(s.step,'dawn');go(s);assert.equal(s.step,'announcement');s.night=2;s.step='wolves';assert.equal(subtitle(s),'狼人請睜眼');
});
test('edge and city victories control last-god shooting differently',()=>{
 for(const victory of ['edge','city']){const s=ready('12',{victory});const hunter=seat(s,'hunter');s.players.filter(p=>ROLE_DATA[p.role]?.kind==='god'&&p.role!=='hunter').forEach(p=>p.alive=false);s.night=2;s.step='announcement';s.deaths=[{id:hunter,cause:'attack'}];go(s);assert.equal(s.step,victory==='edge'?'finished':'eliminated');if(victory==='city'){go(s);assert.equal(s.step,'skill');}}
 const s=ready('10',{victory:'city'});s.players.filter(p=>ROLE_DATA[p.role]?.kind==='god').forEach(p=>p.alive=false);assert.equal(winner(s),null);s.players.filter(p=>p.role==='villager').forEach(p=>p.alive=false);assert.equal(winner(s),'狼人陣營');
});
test('self-rescue uses original knife even when witch is exchanged',()=>{
 const s=ready('12',{selfRescue:false}),witch=seat(s,'witch'),civil=seat(s,'villager');s.step='antidote';s.nightAction.exchange=[witch,civil];s.nightAction.attack=witch;assert.match(potionBlocked(s,'antidote'),/自救/);assert.equal(choose(s,'use'),false);assert.equal(nightDeaths(s)[0].id,civil);
 s.nightAction.attack=civil;assert.equal(potionBlocked(s,'antidote'),'');choose(s,'use');assert.deepEqual(nightDeaths(s),[]);
 const allow=ready('12',{selfRescue:true});allow.step='antidote';allow.nightAction.attack=seat(allow,'witch');assert.equal(choose(allow,'use'),true);
});
test('used exchange seats persist across nights; back restores exchange eligibility',()=>{
 const s=ready();s.step='exchange';const a=seat(s,'villager'),b=a+1;selectSeat(s,a);selectSeat(s,b);go(s);assert.deepEqual(s.usedExchanges,[a,b]);previous(s);assert.deepEqual(s.usedExchanges,[]);go(s);s.step='nextNight';go(s);s.step='exchange';assert.equal(selectable(s,a),false);assert.equal(selectable(s,b),false);choose(s,'skip');assert.equal(canNext(s),true);
});
test('night hunter shot maps through exchange; exile shot does not; mapped dead target is illegal',()=>{
 const s=ready();const hunter=seat(s,'hunter'),a=seat(s,'villager'),b=a+1;s.players[hunter-1].alive=false;s.step='skill';s.queue=[{id:hunter,cause:'attack',noticeDone:true}];s.continuation='direction';s.nightAction.exchange=[a,b];assert.equal(skillTarget(s,a),b);selectSeat(s,a);go(s);assert.equal(s.players[b-1].alive,false);assert.equal(s.players[a-1].alive,true);previous(s);assert.equal(s.players[b-1].alive,true);s.queue[0].cause='exile';assert.equal(skillTarget(s,a),a);s.queue[0].cause='attack';s.players[b-1].alive=false;assert.equal(selectable(s,a),false);
});
test('simultaneous first-day deaths are sorted and chains are depth-first',()=>{
 const s=ready(),king=seat(s,'king'),hunter=seat(s,'hunter'),civil=seat(s,'villager');s.step='announcement';s.deaths=[{id:hunter,cause:'attack'},{id:king,cause:'attack'}];assert.equal(subtitle(s),hunter+'號、'+king+'號玩家被殺死');go(s);assert.equal(subtitle(s),'請'+king+'號玩家發表遺言');go(s);selectSeat(s,civil);go(s);assert.equal(s.queue[0].id,civil);go(s);assert.equal(s.queue[0].id,hunter);assert.equal(s.step,'lastWords');
});
test('self-destruct selects wolves only, is undoable, suppresses king skill and counts only pending election',()=>{
 const s=ready();s.step='speeches';s.candidates=[2,3];s.nominees=[2,3];assert.equal(canSelfDestruct(s),true);beginSelfDestruct(s);assert.equal(selectSeat(s,seat(s,'villager')),false);const king=seat(s,'king');selectSeat(s,king);go(s);assert.equal(s.preSheriffExplosions,1);assert.equal(subtitle(s),king+'號玩家選擇自爆，請發表遺言');go(s);assert.equal(s.step,'announcement');assert.notEqual(s.step,'skill');previous(s);previous(s);assert.equal(s.players[king-1].alive,true);assert.equal(s.preSheriffExplosions,0);
 for(const status of ['elected','none']){const g=ready();g.electionStatus=status;g.step='discussion';g.deathsCommitted=true;beginSelfDestruct(g);selectSeat(g,seat(g,'wolf'));go(g);assert.equal(g.preSheriffExplosions,0);}
});
test('self-destruct winning death ends immediately without words',()=>{const s=ready();s.players.filter(p=>p.role==='wolf').forEach(p=>p.alive=false);s.step='discussion';beginSelfDestruct(s);selectSeat(s,seat(s,'king'));go(s);assert.equal(s.step,'finished');assert.equal(s.winner,'好人陣營');});
test('first election explosion processes pending night deaths before black night, resumes at withdrawal',()=>{
 const s=ready(),civil=seat(s,'villager');s.step='speeches';s.candidates=[2,3,civil];s.nominees=[...s.candidates];s.deaths=[{id:civil,cause:'attack'}];beginSelfDestruct(s);selectSeat(s,seat(s,'wolf'));go(s);go(s);assert.equal(s.step,'announcement');go(s);assert.equal(s.players[civil-1].alive,false);drain(s,['nextNight']);go(s);assert.equal(s.night,2);s.step='dawn';go(s);assert.equal(s.step,'withdraw');assert.ok(!s.candidates.includes(civil));
});
test('10 single/12 double pre-election explosions swallow badge at the board threshold',()=>{
 for(const board of ['10','12']){const s=ready(board,{swallow:true});s.deathsCommitted=true;s.step='speeches';s.candidates=[seat(s,'villager'),seat(s,'villager')+1];s.nominees=[...s.candidates];const ids=s.players.filter(p=>p.role==='wolf').map(p=>p.id);
  for(let i=0;i<BOARDS[board].swallowThreshold;i++){s.step=i?'sheriffVote':'speeches';beginSelfDestruct(s);selectSeat(s,ids[i]);go(s);assert.equal(s.badgeSwallowed,i+1===BOARDS[board].swallowThreshold);drain(s,['nextNight']);go(s);s.deathsCommitted=true;}
  assert.equal(s.electionStatus,'none');assert.equal(s.resumeElection,false);s.step='dawn';go(s);assert.equal(s.step,'swallowNotice');assert.match(subtitle(s),/吞警徽，沒有警長/);go(s);assert.equal(s.step,'announcement');
 }
});
test('self-destruct cancels regular daytime flow and sheriff badge is handled before next night',()=>{
 for(const step of ['discussion','exileVote','exilePK','exileRevote']){const s=ready();s.step=step;s.deathsCommitted=true;s.electionStatus='elected';s.sheriff=seat(s,'king');beginSelfDestruct(s);selectSeat(s,s.sheriff);go(s);go(s);assert.equal(s.step,'badgeTransfer');choose(s,'skip');go(s);assert.equal(s.step,'nextNight');}
});
test('10-player lottery wraps within 1..10 and skips inactive slots',()=>{const s=ready('10');s.step='dayDraw';s.deaths=[{id:10,cause:'attack'}];s.players[9].alive=false;const d=drawResult(s,()=>0);assert.equal(d.seat,1);assert.ok(d.order.every(id=>id<=10));});
test('death events record day/context/source actor and completed win check',()=>{const s=ready();s.night=2;s.step='announcement';s.deaths=[{id:seat(s,'villager'),cause:'poison'}];go(s);const d=s.queue[0];assert.equal(d.day,2);assert.equal(d.context,'night');assert.equal(d.sourceActor,seat(s,'witch'));assert.equal(d.sourceRole,'witch');assert.equal(d.winChecked,true);assert.equal(d.winner,null);assert.equal(s.log[0].deaths[0].sourceActor,d.sourceActor);});
test('inspection result is a separate page before seer closes eyes and supports back',()=>{const s=ready();s.step='inspect';selectSeat(s,seat(s,'wolf'));go(s);assert.equal(s.step,'inspectResult');assert.equal(subtitle(s),'');go(s);assert.equal(subtitle(s),'預言家請閉眼');previous(s);assert.equal(s.step,'inspectResult');assert.equal(s.nightAction.inspect,seat(s,'wolf'));});
