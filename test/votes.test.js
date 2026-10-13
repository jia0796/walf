import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,next,previous,selectSeat,choose,upgradeGame,restartGame} from '../public/engine.js';
import {BOARDS} from '../public/data.js';
import {voteEligibility,voteRound,setBallot,tallyVotes,savedVoteNotes} from '../public/votes.js';
const ready=(board='12',step='exileVote')=>{const s=createGame(board);let i=0;for(const [role,n]of Object.entries(BOARDS[board].roles))for(let j=0;j<n;j++)s.players[i++].role=role;s.rolesConfirmed=true;s.step=step;s.candidates=[7,8];s.nominees=[4,5,7,8,9,10,11,12];s.votePool=step.startsWith('sheriff')?[7,8]:s.players.filter(p=>p.active).map(p=>p.id);return s;};
for(const step of ['sheriffVote','sheriffRevote'])test('UI55 '+step+' excludes nominees including withdrawn; PK uses current legal targets',()=>{
 const s=ready('12',step);if(step.endsWith('Revote'))s.votePool=[7];assert.deepEqual(voteEligibility(s),{voters:[1,2,3,6],targets:step.endsWith('Revote')?[7]:[7,8]});const r=voteRound(s,true);assert.equal(setBallot(r,4,7),false);assert.equal(setBallot(r,7,7),false);assert.equal(setBallot(r,1,7),true);assert.equal(tallyVotes(r).groups[0].votes,1);assert.equal(r.sheriff,null);
});
test('UI55 active living vote rights and revealed idiot restrictions apply to notes',()=>{
 const s=ready('classic12');s.players[0].alive=false;const idiot=s.players.find(p=>p.role==='idiot');s.idiot.revealed=true;s.idiot.voteLost=true;s.idiot.exileBanned=true;assert.ok(!voteEligibility(s).voters.includes(idiot.id));assert.ok(!voteEligibility(s).targets.includes(idiot.id));assert.ok(!voteEligibility(s).voters.includes(1));
 const ten=ready('10');assert.equal(voteRound(ten,true).voters.length,10);assert.ok(!voteEligibility(ten).targets.includes(11));
});
test('UI55 self vote, abstention, unrecorded and direct re-vote remain one ballot per voter',()=>{
 const s=ready(),r=voteRound(s,true);assert.equal(setBallot(r,5,5),true);assert.equal(setBallot(r,5,6),true);assert.equal(tallyVotes(r).groups.length,1);assert.equal(tallyVotes(r).groups[0].target,6);
 setBallot(r,5,'abstain');assert.deepEqual(tallyVotes(r).abstainers,[5]);assert.equal(tallyVotes(r).recorded,1);setBallot(r,5,null);assert.equal(tallyVotes(r).recorded,0);setBallot(r,5,5,true);setBallot(r,5,5,true);assert.equal(tallyVotes(r).recorded,0);assert.equal(setBallot(r,99,5),false);assert.equal(setBallot(r,5,99),false);
});
test('UI55 sheriff weight and badge are snapshots; later transfer never changes old weights',()=>{
 const s=ready();s.sheriff=6;const r=voteRound(s,true);setBallot(r,6,5);setBallot(r,1,5);setBallot(r,2,8);assert.equal(tallyVotes(r).groups[0].votes,2.5);s.sheriff=2;assert.equal(tallyVotes(r).groups[0].votes,2.5);assert.equal(r.sheriff,6);setBallot(r,6,'abstain');assert.equal(tallyVotes(r).groups.find(g=>g.target===5).votes,1);assert.deepEqual(tallyVotes(r).abstainers,[6]);
});
test('UI55 sorted equal totals only hint tie, never change manual final outcome',()=>{
 const s=ready(),r=voteRound(s,true);for(const [v,t]of [[1,8],[2,5],[3,8],[4,5],[6,10]])setBallot(r,v,t);assert.deepEqual(tallyVotes(r).groups.map(g=>[g.target,g.votes,g.tied]),[[5,2,true],[8,2,true],[10,1,false]]);
 assert.equal(s.choice,null);assert.deepEqual(s.action,[]);assert.equal(s.step,'exileVote');selectSeat(s,10);next(s);assert.equal(s.players[9].alive,false);assert.equal(s.step,'lastWords');const e=s.dayEvents.find(e=>e.type==='exile');assert.deepEqual(e.rawTargets,[10]);assert.equal(e.voteRounds.length,1);
});
test('UI55 optional skip keeps quick outcome workflow and no empty recap vote data',()=>{
 const s=ready();selectSeat(s,9);assert.equal(next(s),true);assert.equal(s.votePatterns.length,0);assert.equal(Object.hasOwn(s.dayEvents[0],'voteRounds'),false);
});
test('UI55 first vote and PK are independent, replay removes PK data and restores original notes',()=>{
 const s=ready(),first=voteRound(s,true);setBallot(first,1,5);choose(s,'tie');selectSeat(s,5);selectSeat(s,9);next(s);assert.equal(s.step,'exilePK');next(s);next(s);assert.equal(s.step,'exileRevote');const pk=voteRound(s,true);assert.deepEqual(pk.ballots,{});assert.deepEqual(pk.targets,[5,9]);setBallot(pk,1,9);assert.equal(first.ballots[1],5);selectSeat(s,9);next(s);const e=s.dayEvents.find(e=>e.type==='exile');assert.deepEqual(e.voteRounds.map(r=>r.ballots[1]),[5,9]);assert.deepEqual(e.voteRounds.map(r=>r.label),['第一輪投票','PK 重新投票']);
 previous(s);assert.equal(s.step,'exileRevote');assert.equal(voteRound(s).ballots[1],9);assert.equal(voteRound(s).confirmed,false);previous(s);previous(s);previous(s);assert.equal(s.step,'exileVote');assert.equal(s.votePatterns.length,1);assert.equal(voteRound(s).ballots[1],5);assert.equal(s.players[8].alive,true);
});
test('UI55 sheriff first and PK notes stored with manual result, not counted twice or auto selected',()=>{
 const s=ready('12','sheriffVote'),r=voteRound(s,true);setBallot(r,1,7);choose(s,'tie');selectSeat(s,7);selectSeat(s,8);next(s);next(s);const pk=voteRound(s,true);setBallot(pk,1,8);selectSeat(s,7);next(s);assert.equal(s.sheriff,7);assert.deepEqual(s.dayEvents[0].voteRounds.map(r=>r.ballots[1]),[7,8]);assert.equal(s.dayEvents.length,1);
});
test('UI55 clear one round preserves selected manual outcome and other notes',()=>{
 const s=ready(),r=voteRound(s,true);setBallot(r,1,9);s.votePatterns.push({...structuredClone(r),key:'0:exileVote',day:0});selectSeat(s,9);r.ballots={};assert.deepEqual(s.action,[9]);assert.equal(s.votePatterns[1].ballots[1],9);assert.equal(tallyVotes(r).recorded,0);
});
test('UI55 refresh preserves every vote snapshot and restart clears all rounds',()=>{
 const s=ready();s.sheriff=6;setBallot(voteRound(s,true),6,6);choose(s,'tie');selectSeat(s,5);selectSeat(s,9);next(s);const loaded=upgradeGame(JSON.parse(JSON.stringify(s)));assert.deepEqual(loaded,s);assert.equal(savedVoteNotes(loaded,'exile')[0].sheriff,6);const fresh=restartGame(s);assert.deepEqual(fresh.votePatterns,[]);assert.deepEqual(fresh.dayEvents,[]);assert.equal(fresh.mixed.chosen,false);
});
test('UI55 v18 and earlier history migrations add only empty notes, never invent past votes',()=>{
 for(const version of [17,18]){const s=ready();s.version=version;delete s.votePatterns;s.history=[{...structuredClone(s),history:undefined}];const loaded=upgradeGame(JSON.parse(JSON.stringify(s)));assert.equal(loaded.version,19);assert.deepEqual(loaded.votePatterns,[]);assert.deepEqual(loaded.history[0].votePatterns,[]);assert.deepEqual(loaded.action,[]);}
});
test('UI55 all existing boards can use optional notes without altering their base rules',()=>{
 for(const board of Object.keys(BOARDS)){const s=ready(board),before=structuredClone(s.rules),r=voteRound(s,true);setBallot(r,r.voters[0],r.voters[0]);assert.equal(tallyVotes(r).recorded,1);assert.deepEqual(s.rules,before);assert.equal(s.winner,null);}
});
