import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,selectable,selectSeat,choose,next,canNext,previous,upgradeGame,mechanicalModes,beginSelfDestruct,canSelfDestruct} from '../public/engine.js';
import {BOARDS} from '../public/data.js';
// Seeded API black-box games: only public commands mutate game state.
function rng(seed){let x=seed;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
const identities={magician:'magician',wolves:'wolf',witch:'witch',seer:'seer',hunter:'hunter',guard:'guard',mechanical:'mechanical',mediumIdentify:'medium',merchant:'merchant',brothers:'elder',nightmare:'nightmare',dream:'dream',idiot:'idiot',mixed:'mixed'};
for(const board of Object.keys(BOARDS))test('seeded complete-game stress '+board,()=>{
 let actions=0,finished=0,maxBytes=0;
 for(let seed=1;seed<=18;seed++){
  const random=rng(seed*479),pick=items=>items[Math.floor(random()*items.length)];
  let s=createGame(board,{sheriff:seed%2===0,victory:seed%3===0?'city':'edge',...(BOARDS[board].roles.idiot?{idiotChase:seed%2===1}:{})}),assigned={};let seat=1;
  // Plan role seats once, then identify them through the same API as the UI.
  for(const [role,n]of Object.entries(BOARDS[board].roles)){assigned[role]=[];for(let j=0;j<n;j++)assigned[role].push(seat++);}
  for(let i=0;i<1200&&(!s.winner||s.step==='dawn');i++){
   const step=s.step,legal=()=>s.players.filter(p=>selectable(s,p.id)).map(p=>p.id);
   if(!s.rolesConfirmed&&identities[step]){
    const targets=step==='wolves'?[...(assigned.king||[]),...assigned.wolf]:step==='brothers'?[...assigned.elder,...assigned.younger]:assigned[identities[step]];
    for(const id of targets)assert.equal(selectSeat(s,id),true);
   }else if(step==='mechanicalAction'){
    for(const mode of mechanicalModes(s)){choose(s,'mode:'+mode);const pool=legal();if(mode==='mechanicalInspect'||random()>.3){if(pool.length)selectSeat(s,pick(pool));}else choose(s,'skip');}
   }else if(step==='trade'){
    if(!canNext(s)){if(random()<.3)choose(s,'skip');else{choose(s,'gift:'+pick(['inspect','poison','gun']));selectSeat(s,pick(legal()));}}
   }else if(step==='candidates'){if(random()<.3)choose(s,'none');else{for(const id of legal().filter(()=>random()<.4))selectSeat(s,id);if(!s.candidates.length)choose(s,'none');}}
   else if(['draw','dayDraw'].includes(step)){choose(s,'draw');choose(s,'revealDraw');}
   else if(['antidote','poison'].includes(step)){if(!canNext(s)){choose(s,random()<.35?'use':'skip');if(step==='poison'&&legal().length)selectSeat(s,pick(legal()));}}
   else if(step==='exchange'){if(random()<.3||legal().length<2)choose(s,'skip');else{const a=pick(legal());selectSeat(s,a);selectSeat(s,pick(legal().filter(id=>id!==a)));}}
   else if(['fear','attack','revenge','luckyAction','guardTarget','skill','badgeTransfer'].includes(step)){
    if(!canNext(s)){if(random()<.2)choose(s,'skip');else if(legal().length)selectSeat(s,pick(legal()));}
   }else if(['roleModel','sleep','inspect','mediumInspect','sheriffVote','sheriffRevote','exileVote','exileRevote','selfDestruct'].includes(step)){if(!canNext(s)&&legal().length)selectSeat(s,pick(legal()));}
   if(canSelfDestruct(s)&&random()<.04){assert.equal(beginSelfDestruct(s),true);continue;}
   assert.equal(canNext(s),true,board+' seed '+seed+' blocked '+s.step);
   assert.equal(next(s),true);actions++;
   if(i%37===15){const before=JSON.stringify(s);s=upgradeGame(JSON.parse(before));assert.deepEqual(s,JSON.parse(before),'refresh changed state');assert.ok(previous(s));assert.equal(next(s),true,'rollback could not replay');}
  }
  assert.ok(s.winner,board+' seed '+seed+' did not finish');finished++;maxBytes=Math.max(maxBytes,Buffer.byteLength(JSON.stringify(s)));
  assert.equal(s.step,'finished');assert.ok(s.nightRecords.every(r=>new Set(r.events.map(e=>e.key)).size===r.events.length));
 }
 console.log(JSON.stringify({board,seeds:18,finished,actions,maxSaveBytes:maxBytes}));
});
