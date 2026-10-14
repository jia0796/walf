import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createGame,selectSeat,choose,next,previous,upgradeGame,subtitle,eligibleVoters} from '../public/engine.js';
import {BOARDS,ROLE_DATA} from '../public/data.js';
import {timerProgress,createSpeechTimer} from '../public/timer.js';
import {outcomeLabel} from '../public/recap.js';
const ready=()=>{const s=createGame('12');let i=0;for(const [r,n] of Object.entries(BOARDS['12'].roles))for(let j=0;j<n;j++)s.players[i++].role=r;s.rolesConfirmed=true;return s;};
test('UI54 all nominees are eligible only, no auto advance, manual cancellation and snapshot restore',()=>{
 const s=ready();s.step='candidates';s.players[11].alive=false;s.players[7].role='idiot';s.idiot.revealed=true;s.idiot.voteLost=true;
 choose(s,'all');assert.equal(s.step,'candidates');assert.deepEqual(s.candidates,eligibleVoters(s).map(p=>p.id));assert.equal(s.candidates.includes(8),false);assert.equal(s.candidates.includes(12),false);
 selectSeat(s,1);assert.equal(s.candidates.includes(1),false);choose(s,'all');assert.ok(next(s));assert.equal(s.noSheriffReason,'all');assert.ok(previous(s));assert.deepEqual(s.candidates,eligibleVoters(s).map(p=>p.id));
});
test('UI54 withdrawal retains original nominees while refresh and previous restore live candidates',()=>{
 const s=ready();s.step='withdraw';s.nominees=[1,2,3];s.candidates=[1,2,3];selectSeat(s,2);assert.deepEqual(s.nominees,[1,2,3]);assert.deepEqual(s.candidates,[1,3]);
 const restored=upgradeGame(JSON.parse(JSON.stringify(s)));assert.deepEqual(restored,s);selectSeat(s,2);assert.deepEqual(s.candidates,[1,2,3]);selectSeat(s,2);next(s);assert.equal(s.step,'sheriffVote');previous(s);assert.deepEqual(s.candidates,[1,3]);
});
test('UI54 one exile vote screen, exact captions, legacy vote-intro migration includes history',()=>{
 const s=ready();s.step='discussion';s.electionStatus='none';next(s);assert.equal(s.step,'exileVote');assert.equal(subtitle(s),'現在進行投票，3、2、1請投票');assert.equal(s.votePool.length,12);previous(s);assert.equal(s.step,'discussion');
 const old=ready();old.version=17;old.step='voteIntro';old.history=[{...structuredClone(old),history:undefined}];const migrated=upgradeGame(JSON.parse(JSON.stringify(old)));assert.equal(migrated.version,22);assert.equal(migrated.step,'exileVote');assert.equal(migrated.history[0].step,'exileVote');assert.equal(migrated.votePool.length,12);
 for(const step of ['sheriffVote','exileVote','sheriffRevote','exileRevote']){s.step=step;assert.equal(subtitle(s),step.endsWith('Revote')?'再次進行投票，3、2、1請投票':'現在進行投票，3、2、1請投票');}
});
test('UI53 progress follows one timer deadline, pauses, thresholds, zero and latest duration reset',()=>{
 const t=createSpeechTimer();t.set(90);assert.deepEqual(timerProgress(t.start(0)),{ratio:1,tone:'normal'});assert.equal(timerProgress(t.pause(45000)).ratio,.5);assert.equal(timerProgress(t.tick(90000)).ratio,.5);
 t.resume(100000);assert.deepEqual(timerProgress(t.tick(115000)),{ratio:1/3,tone:'warm'});assert.deepEqual(timerProgress(t.tick(135000)),{ratio:1/9,tone:'urgent'});assert.deepEqual(timerProgress(t.tick(145000)),{ratio:0,tone:'urgent'});assert.equal(t.reset(145000).seconds,90);assert.equal(timerProgress(t.start(150000)).ratio,1);
});
test('UI54 recap removes redundant learning and destruction words only; data and medium result remain',()=>{
 const e={key:'learn',skill:'learn',result:'學習結果：女巫',rawTargets:[3]},before=structuredClone(e);assert.equal(outcomeLabel(e),'');assert.deepEqual(e,before);
 assert.equal(outcomeLabel({type:'badge',rawTargets:[],result:'撕毀警徽'}),'');assert.equal(outcomeLabel({type:'badge',rawTargets:[3],result:'移交警徽'}),'移交警徽');assert.equal(outcomeLabel({skill:'inspect',result:'女巫'}),'女巫');
});
test('UI54 all 28 thumbnail derivatives and unchanged approved originals match recorded hashes',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../docs/ui54-thumbnails.json',import.meta.url),'utf8'));assert.equal(manifest.length,Object.keys(ROLE_DATA).filter(id=>!['fragrance','awakenedSeer'].includes(id)).length);
 for(const a of manifest){assert.equal(ROLE_DATA[a.id].thumbnail,a.thumbnail);for(const [path,hash] of [[a.image,a.originalSha256],[a.thumbnail,a.thumbnailSha256]])assert.equal(createHash('sha256').update(await readFile(new URL('../public/'+path,import.meta.url))).digest('hex'),hash);}
});
