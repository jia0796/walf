import {knifeKinds,statusSteps} from '../public/takeover.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,selectable,selectSeat,choose,next,canNext,previous,upgradeGame,mechanicalModes,beginSelfDestruct,canSelfDestruct,restartGame,canInfect,needsInfectionDecision,canDuel,beginDuel,confirmDuel} from '../public/engine.js';
import {BOARDS} from '../public/data.js';
// Seeded API black-box games: only public commands mutate game state.
function rng(seed){let x=seed;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
const identities={fragrance:'fragrance',awakenedSeer:'awakenedSeer',dancer:'dancer',mask:'mask',magician:'magician',wolves:'wolf',witch:'witch',seer:'seer',hunter:'hunter',guard:'guard',mechanical:'mechanical',mediumIdentify:'medium',merchant:'merchant',brothers:'elder',nightmare:'nightmare',dream:'dream',idiot:'idiot',mixed:'mixed',demon:'demon',gravekeeper:'gravekeeper',duelist:'duelist'};
for(const board of Object.keys(BOARDS))test('seeded complete-game stress '+board,()=>{
 let actions=0,finished=0,maxBytes=0;
 for(let seed=1;seed<=Number(process.env.STRESS_SEEDS||18);seed++){
  const random=rng((seed+Number(process.env.STRESS_OFFSET||0))*479),pick=items=>items[Math.floor(random()*items.length)];
  let s=createGame(board,{sheriff:seed%2===0,victory:seed%3===0?'city':'edge',...(BOARDS[board].roles.mechanical?{shieldMode:seed%2?'success':'once',reflectPoison:seed%2===0,mechanicalKnife:seed%3?'next':'allDead'}:{}),...(BOARDS[board].roles.idiot?{idiotChase:seed%2===1}:{})}),assigned={};let seat=1;
  // Plan role seats once, then identify them through the same API as the UI.
  for(const [role,n]of Object.entries(BOARDS[board].roles)){assigned[role]=[];for(let j=0;j<n;j++)assigned[role].push(seat++);}
  for(let i=0;i<1200&&s.step!=='finished';i++){
   if(canDuel(s)&&random()<.12){assert.equal(beginDuel(s),true);const pool=s.players.filter(p=>selectable(s,p.id)).map(p=>p.id);assert.equal(selectSeat(s,pick(pool)),true);assert.equal(confirmDuel(s),true);actions+=3;continue;}
   const step=s.step,legal=()=>s.players.filter(p=>selectable(s,p.id)).map(p=>p.id);
   if(step==='hiddenWolf'&&!s.rolesConfirmed){assert.equal(selectSeat(s,assigned.hiddenWolf[0]),true);}
   else if(!s.rolesConfirmed&&identities[step]){
    const targets=step==='wolves'?[...(assigned.king||[]),...(assigned.blood||[]),...(assigned.gargoyle||[]),...(assigned.evilKnight||[]),...(assigned.seedWolf||[]),...(assigned.beauty||[]),...assigned.wolf]:step==='brothers'?[...assigned.elder,...assigned.younger]:assigned[identities[step]];
    for(const id of targets)assert.equal(selectSeat(s,id),true);
   }else if(step==='bond'){if(!canNext(s)){if(random()<.3)choose(s,'skip');else{const pool=legal();const a=pick(pool);selectSeat(s,a);selectSeat(s,pick(pool.filter(id=>id!==a)));}}
   }else if(step==='awakenedInspect'){if(!canNext(s)){const pool=legal(),a=pick(pool);selectSeat(s,a);selectSeat(s,pick(pool.filter(id=>id!==a)));}
   }else if(step==='dance'){for(const id of legal().slice(0,3))selectSeat(s,id);
   }else if(step==='maskInspect'){if(legal().length)selectSeat(s,pick(legal()));
   }else if(step==='maskAssign'){if(legal().length&&random()>.3)selectSeat(s,pick(legal()));else choose(s,'skip');
   }else if(step==='charm'){if(random()<.4)choose(s,'skip');else{const pool=legal();if(pool.length)selectSeat(s,pick(pool));else choose(s,'skip');}
   }else if(statusSteps.includes(step)){
    for(const kind of knifeKinds(s)){choose(s,'knifeKind:'+kind);const pool=legal();if(pool.length&&random()>.3)selectSeat(s,pick(pool));else choose(s,'skip');}
   }else if(['mechanicalLearn','mechanicalSkill'].includes(step)){
    if(!canNext(s)||step==='mechanicalSkill'&&s.operation==='extraAttack'){const pool=legal();if(pool.length&& (s.operation==='mechanicalInspect'||random()>.3))selectSeat(s,pick(pool));else choose(s,'skip');}
   }else if(step==='mechanicalAction'){
    for(const mode of mechanicalModes(s)){choose(s,'mode:'+mode);const pool=legal();if(mode==='mechanicalInspect'||random()>.3){if(pool.length)selectSeat(s,pick(pool));}else choose(s,'skip');}
   }else if(step==='trade'){
    if(!canNext(s)){if(random()<.3)choose(s,'skip');else{choose(s,'gift:'+pick(['inspect','poison','gun']));selectSeat(s,pick(legal()));}}
   }else if(step==='candidates'){if(random()<.3)choose(s,'none');else{for(const id of legal().filter(()=>random()<.4))selectSeat(s,id);if(!s.candidates.length)choose(s,'none');}}
   else if(['draw','dayDraw'].includes(step)){choose(s,'draw');choose(s,'revealDraw');}
   else if(['antidote','poison'].includes(step)){if(!canNext(s)){choose(s,random()<.35?'use':'skip');if(step==='poison'&&legal().length)selectSeat(s,pick(legal()));}}
   else if(step==='exchange'){if(random()<.3||legal().length<2)choose(s,'skip');else{const a=pick(legal());selectSeat(s,a);selectSeat(s,pick(legal().filter(id=>id!==a)));}}
   else if(['hunt','fear','attack','revenge','luckyAction','guardTarget','skill','badgeTransfer'].includes(step)){
    if(!canNext(s)){if(!legal().length||random()<.2)choose(s,'skip');else if(legal().length)selectSeat(s,pick(legal()));}
   }else if(['transform','lastBlade','roleModel','sleep','inspect','mediumInspect','sheriffVote','sheriffRevote','exileVote','exileRevote','selfDestruct'].includes(step)){if(!canNext(s)&&legal().length)selectSeat(s,pick(legal()));}
   if(canSelfDestruct(s)&&random()<.04){assert.equal(beginSelfDestruct(s),true);continue;}
   assert.equal(canNext(s),true,board+' seed '+seed+' blocked '+s.step+' '+JSON.stringify({night:s.night,legal:legal(),action:s.action,nightAction:s.nightAction,lastFear:s.lastFear,alive:s.players.filter(p=>p.alive).map(p=>[p.id,p.role])}));
   if(step==='attack'&&s.nightAction.attack&&canInfect(s)&&random()<.4){assert.equal(choose(s,'attackMode:infect'),true);assert.equal(next(s),false);assert.equal(choose(s,'confirmInfection'),true);}
   if(needsInfectionDecision(s))assert.equal(choose(s,'declineInfection'),true);
   assert.equal(next(s),true);actions++;
   if(i%37===15){const before=JSON.stringify(s);s=upgradeGame(JSON.parse(before));assert.deepEqual(s,JSON.parse(before),'refresh changed state');assert.ok(previous(s));if(s.step==='attack'&&s.nightAction.attackMode==='infect')choose(s,'confirmInfection');if(needsInfectionDecision(s))choose(s,'declineInfection');assert.equal(next(s),true,'rollback could not replay');}
  }
  assert.ok(s.winner,board+' seed '+seed+' did not finish');finished++;maxBytes=Math.max(maxBytes,Buffer.byteLength(JSON.stringify(s)));
  const fresh=restartGame(s);assert.deepEqual(fresh.rules,{...s.rules,victory:'edge'});assert.equal(fresh.boardId,s.boardId);assert.ok(fresh.players.every(p=>p.role===null));assert.deepEqual(fresh.nightRecords,[]);assert.equal(fresh.blood.lastEvent,null);assert.equal(fresh.infection.remaining,1);assert.equal(fresh.infection.target,null);assert.equal(fresh.mixed.chosen,false);assert.equal(fresh.idiot.revealed,false);
  assert.equal(s.step,'finished');assert.ok(s.nightRecords.every(r=>new Set(r.events.map(e=>e.key)).size===r.events.length));
 }
 console.log(JSON.stringify({board,seeds:Number(process.env.STRESS_SEEDS||18),finished,actions,maxSaveBytes:maxBytes}));
});
