import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,next,previous,selectSeat,choose,upgradeGame,restartGame,canNext} from '../public/engine.js';
import {BOARDS} from '../public/data.js';
import {voteEligibility,voteRound,createVoteDraft,submitVote,abandonVote,voteLocked,setBallot,tallyVotes,savedVoteNotes} from '../public/votes.js';
const ready=(board='12',step='exileVote')=>{const s=createGame(board);let i=0;for(const [role,n]of Object.entries(BOARDS[board].roles))for(let j=0;j<n;j++)s.players[i++].role=role;s.rolesConfirmed=true;s.step=step;s.candidates=[7,8];s.nominees=[4,5,7,8,9,10,11,12];s.votePool=step.startsWith('sheriff')?[7,8]:s.players.filter(p=>p.active).map(p=>p.id);return s;};
const submit=(s,ballots)=>{const d=createVoteDraft(s);for(const [v,t]of ballots)assert.equal(setBallot(d,v,t),true);assert.equal(submitVote(s,d).ok,true);return voteRound(s);};
test('UI56-01 first sheriff excludes all nominees; PK only excludes PK targets',()=>{
 const s=ready('12','sheriffVote');assert.deepEqual(voteEligibility(s),{voters:[1,2,3,6],targets:[7,8]});s.step='sheriffRevote';assert.deepEqual(voteEligibility(s).voters,[1,2,3,4,5,6,9,10,11,12]);assert.equal(setBallot(createVoteDraft(s),7,7),false);
});
test('UI56-02 exile PK voter exclusion and sheriff 1.5 outside PK only',()=>{
 const s=ready('12','exileRevote');s.votePool=[5,6];s.sheriff=2;let d=createVoteDraft(s);assert.equal(d.voters.length,10);setBallot(d,2,5);setBallot(d,1,6);assert.equal(tallyVotes(d).groups[0].votes,1.5);assert.equal(setBallot(d,5,5),false);s.sheriff=5;d=createVoteDraft(s);setBallot(d,2,5);assert.equal(tallyVotes(d).groups[0].votes,1);
});
test('UI56 eligibility retains dead, inactive and revealed idiot exclusions',()=>{
 const s=ready('classic12');s.players[0].alive=false;const id=s.players.find(p=>p.role==='idiot').id;s.idiot.revealed=true;s.idiot.voteLost=true;s.idiot.exileBanned=true;assert.ok(!voteEligibility(s).voters.includes(id));assert.ok(!voteEligibility(s).targets.includes(id));assert.ok(!voteEligibility(s).voters.includes(1));assert.equal(createVoteDraft(ready('10')).voters.length,10);
});
test('UI56-04 drafts and discarded edits never mutate or persist formal game',()=>{
 const s=ready(),before=structuredClone(s),d=createVoteDraft(s);setBallot(d,5,5);assert.deepEqual(s,before);assert.deepEqual(createVoteDraft(s).ballots,{});selectSeat(s,9);next(s);assert.equal(Object.hasOwn(s.dayEvents[0],'voteRounds'),false);
});
test('UI56-05 partial tally selects highest, locks, waits for next and blocks tampering',()=>{
 const s=ready();submit(s,[[1,8],[2,5],[3,8],[4,5],[6,10]]);assert.deepEqual(s.action,[5,8]);assert.equal(s.choice,'tie');assert.equal(s.step,'exileVote');assert.equal(s.players.every(p=>p.alive),true);assert.equal(voteLocked(s),true);assert.equal(selectSeat(s,10),false);assert.equal(choose(s,'tie'),false);assert.equal(canNext(s),true);s.action=[10];assert.equal(canNext(s),false);
});
test('UI56-06 reedit clones prior submission, cancellation preserves lock, resubmit updates it',()=>{
 const s=ready();submit(s,[[1,8]]);const before=structuredClone(s),edit=createVoteDraft(s);setBallot(edit,1,5);assert.deepEqual(s,before);assert.equal(submitVote(s,edit).ok,true);assert.deepEqual(s.action,[5]);assert.equal(voteRound(s).ballots[1],5);
});
test('UI56-06 abandoning only current round preserves historical rounds and restores manual',()=>{
 const s=ready();submit(s,[[1,8]]);s.votePatterns.push({...structuredClone(voteRound(s)),key:'0:exileVote',day:0});abandonVote(s);assert.equal(s.votePatterns.length,1);assert.equal(voteLocked(s),false);assert.equal(selectSeat(s,9),true);assert.deepEqual(s.action,[9]);next(s);assert.equal(Object.hasOwn(s.dayEvents[0],'voteRounds'),false);
});
test('UI56-08 zero votes or abstentions never submit or choose a zero-vote target',()=>{
 const s=ready(),before=structuredClone(s),d=createVoteDraft(s);assert.equal(submitVote(s,d).reason,'empty');setBallot(d,1,'abstain');assert.equal(submitVote(s,d).reason,'empty');assert.deepEqual(s,before);
});
test('UI56 single ballot replacement, self vote, abstain, missing and toggle semantics',()=>{
 const d=createVoteDraft(ready());setBallot(d,5,5);setBallot(d,5,6);assert.equal(tallyVotes(d).groups[0].target,6);setBallot(d,5,'abstain');assert.deepEqual(tallyVotes(d).abstainers,[5]);setBallot(d,5,null);assert.equal(tallyVotes(d).recorded,0);setBallot(d,5,5,true);setBallot(d,5,5,true);assert.equal(tallyVotes(d).recorded,0);assert.equal(setBallot(d,99,5),false);assert.equal(setBallot(d,5,99),false);
});
test('UI56 rejects stale eligibility, sanitizes extra ballots and snapshots sheriff weight',()=>{
 const s=ready();s.sheriff=6;const d=createVoteDraft(s);setBallot(d,6,5);setBallot(d,1,5);d.ballots[99]=9;s.sheriff=2;assert.equal(submitVote(s,d).reason,'eligibility');s.sheriff=6;assert.equal(submitVote(s,d).ok,true);assert.equal(tallyVotes(voteRound(s)).groups[0].votes,2.5);assert.equal(voteRound(s).ballots[99],undefined);
});
test('UI56-07 first vote and PK independent, previous and reload restore result and lock together',()=>{
 const s=ready();submit(s,[[1,5],[2,9]]);next(s);next(s);next(s);assert.equal(s.step,'exileRevote');assert.deepEqual(createVoteDraft(s).ballots,{});assert.deepEqual(createVoteDraft(s).voters,[1,2,3,4,6,7,8,10,11,12]);submit(s,[[1,9]]);next(s);const e=s.dayEvents.find(e=>e.type==='exile');assert.deepEqual(e.voteRounds.map(r=>r.ballots[1]),[5,9]);previous(s);assert.equal(s.step,'exileRevote');assert.deepEqual(s.action,[9]);assert.equal(voteLocked(s),true);assert.equal(voteRound(s).confirmed,false);assert.deepEqual(upgradeGame(JSON.parse(JSON.stringify(s))),s);previous(s);previous(s);previous(s);assert.equal(s.step,'exileVote');assert.deepEqual(s.action,[5,9]);assert.equal(voteLocked(s),true);assert.equal(s.votePatterns.length,1);
});
test('UI56 sheriff first tie and PK use original next-stage election settlement',()=>{
 const s=ready('12','sheriffVote');submit(s,[[1,7],[2,8]]);next(s);next(s);assert.equal(s.step,'sheriffRevote');submit(s,[[4,8],[9,8]]);assert.equal(s.sheriff,null);next(s);assert.equal(s.sheriff,8);assert.deepEqual(s.dayEvents[0].voteRounds.map(r=>r.ballots),[{1:7,2:8},{4:8,9:8}]);
});
test('UI56-10 restart clears votes; submitted confirmed rounds alone enter recap',()=>{
 const s=ready();submit(s,[[1,9]]);assert.deepEqual(savedVoteNotes(s,'exile'),[]);next(s);assert.equal(savedVoteNotes(s,'exile').length,1);const fresh=restartGame(s);assert.deepEqual(fresh.votePatterns,[]);assert.deepEqual(fresh.dayEvents,[]);
});
test('UI56-10 v19 drafts discarded, historical completed notes retained without retrospective locks',()=>{
 const s=ready();s.version=19;const pending={...createVoteDraft(s),ballots:{1:9},confirmed:false};s.votePatterns=[pending,{...pending,key:'0:exileVote',day:0,confirmed:true}];s.dayEvents=[{voteRounds:[s.votePatterns[1]]}];s.action=[5];s.choice='target';s.history=[{...structuredClone(s),history:undefined}];const loaded=upgradeGame(s);assert.equal(loaded.version,22);assert.equal(loaded.votePatterns.length,1);assert.equal(loaded.votePatterns[0].legacy,true);assert.equal(loaded.dayEvents[0].voteRounds[0].submitted,true);assert.equal(loaded.history[0].votePatterns.length,1);assert.deepEqual(loaded.action,[5]);assert.equal(voteLocked(loaded),false);
});
test('UI56 older saves migrate without invented ballots',()=>{
 for(const version of [17,18]){const s=ready();s.version=version;delete s.votePatterns;s.history=[{...structuredClone(s),history:undefined}];const loaded=upgradeGame(s);assert.equal(loaded.version,22);assert.deepEqual(loaded.votePatterns,[]);assert.deepEqual(loaded.history[0].votePatterns,[]);}
});
test('UI56 all current boards retain rules and manual route; optional tally does not settle skills',()=>{
 for(const board of Object.keys(BOARDS)){const s=ready(board),rules=structuredClone(s.rules);submit(s,[[1,1]]);assert.deepEqual(s.rules,rules);assert.equal(s.winner,null);assert.equal(s.step,'exileVote');assert.equal(s.players[0].alive,true);}
});
