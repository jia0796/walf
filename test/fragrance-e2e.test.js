import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,selectSeat,choose,next,canNext,upgradeGame,previous,inspection} from '../public/engine.js';
import {recapNights} from '../public/records.js';
const go=s=>assert.equal(next(s),true,'blocked '+s.step);
const plans={10:{guard:[1],wolf:[2,7],fragrance:[5],witch:[4],awakenedSeer:[9]},12:{guard:[1],wolf:[2,7,11],fragrance:[5],witch:[4],awakenedSeer:[9],hunter:[6]}};
function toDiscussion(s,count){const plan=plans[count];let steps=0;while(s.step!=='discussion'&&s.step!=='finished'){
 assert.ok(steps++<150,'navigation loop '+s.step);
 if(!s.rolesConfirmed&&(plan[s.step]||s.step==='wolves'))for(const id of plan[s.step==='wolves'?'wolf':s.step])selectSeat(s,id);
 if(s.step==='guardTarget')selectSeat(s,s.night%2?1:4);
 if(s.step==='bond'&&!s.fragrance.used){selectSeat(s,3);selectSeat(s,count===10?8:10);}
 if(s.step==='fragranceKnifeState'&&s.takeover.actor)selectSeat(s,s.night===3?(count===10?10:6):8);
 if(s.step==='attack'){const target=s.night===1?(count===10?6:12):s.night===2?3:s.night===3?(count===10?10:6):8;selectSeat(s,target);}
 if(s.step==='antidote'&&!canNext(s))choose(s,s.night===1?'use':'skip');
 if(s.step==='poison'&&!canNext(s))choose(s,'skip');
 if(s.step==='awakenedInspect'){for(const id of s.night===1?[2,4]:[9,4])selectSeat(s,id);assert.equal(inspection(s),s.night===1?'down':'up');}
 if(s.step==='candidates')selectSeat(s,count===10?9:10);
 if(['draw','dayDraw'].includes(s.step)){choose(s,'draw');choose(s,'revealDraw');}
 if(s.step==='badgeTransfer')selectSeat(s,9);
 if(s.step==='skill')selectSeat(s,11);
 const before=JSON.stringify(s);const loaded=upgradeGame(JSON.parse(before));assert.deepEqual(loaded,JSON.parse(before));
 go(s);
 }return steps;
}
function dayExile(s,target){go(s);assert.equal(s.step,'exileVote');selectSeat(s,target);go(s);while(!['nextNight','finished'].includes(s.step)){assert.ok(['lastWords','eliminated','fragranceAnnouncement','badgeTransfer'].includes(s.step));if(s.step==='badgeTransfer')selectSeat(s,9);go(s);}if(s.step==='nextNight')go(s);}
for(const count of [10,12])test('FV57-'+(count===10?'22':'23')+' complete public-command game '+count,()=>{
 const s=createGame('fragrance'+count);let actions=toDiscussion(s,count);assert.equal(s.rolesConfirmed,true);assert.equal(s.players.filter(p=>p.active&&p.alive).length,count);assert.ok(plans[count].wolf.includes(s.fragrance.knownWolf));assert.equal(s.sheriff,count===10?9:10);dayExile(s,count===10?7:2);actions+=toDiscussion(s,count);assert.equal(s.fragrance.used,true);assert.equal(s.players[2].cause,'attack');assert.equal(s.players[(count===10?8:10)-1].cause,'heartbreak');if(count===12)assert.equal(s.sheriff,9);dayExile(s,count===10?2:7);actions+=toDiscussion(s,count);
 if(count===10){assert.equal(s.players[9].alive,false);dayExile(s,5);assert.equal(s.winner,'好人陣營');}else{assert.equal(s.players[5].alive,false);assert.equal(s.players[10].alive,false);assert.ok(s.dayEvents.some(e=>e.type==='shot'&&e.rawTargets[0]===11));dayExile(s,12);actions+=toDiscussion(s,count);assert.equal(s.winner,'狼人陣營');}
 assert.equal(s.step,'finished');const events=recapNights(s).flatMap(r=>r.events);assert.equal(events.filter(e=>e.key==='bond').length,2);assert.equal(events.filter(e=>e.key==='fragranceHeartbreak').length,1);assert.ok(events.some(e=>e.key==='basic'&&e.actorRole==='fragrance'));assert.ok(!events.some(e=>['fragranceKnown','bondUsed'].includes(e.key)));assert.equal(s.players[4].role,'fragrance');assert.deepEqual(upgradeGame(JSON.parse(JSON.stringify(s))),s);assert.equal(previous(s),true);assert.equal(s.winner,null);assert.equal(next(s),true);assert.equal(s.winner,count===10?'好人陣營':'狼人陣營');console.log(JSON.stringify({fragranceE2E:count,nightActions:actions,night:s.night,winner:s.winner}));
});
