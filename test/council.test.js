import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,next,selectSeat,selectable,choose,canNext,previous,upgradeGame,restartGame,nightSteps,subtitle,potionBlocked,inspection,beginSelfDestruct,gunSources} from '../public/engine.js';
import {BOARDS,ROLE_DATA} from '../public/data.js';
import {settleNight,trueWinner,skillBlocked,ordinaryWolves} from '../public/night.js';
import {recapNights} from '../public/records.js';
const go=s=>assert.equal(next(s),true,'blocked '+s.step);
function ready(board='blood12',rules={}){const s=createGame(board,{sheriff:false,...rules});let id=1;for(const [r,n]of Object.entries(BOARDS[board].roles))for(let i=0;i<n;i++)s.players[id++-1].role=r;s.rolesConfirmed=true;s.deathsCommitted=true;return s;}
const seat=(s,r)=>s.players.find(p=>p.role===r).id;
test('dawn confirmation preserves actually used poison in recap on old and new boards',()=>{
 for(const board of ['12','mechanical12','brothers12','nightmare12','classicMixed12','blood12','kingGuard12','kingDream12']){
  const s=ready(board),target=seat(s,'villager');s.step='attack';choose(s,'skip');go(s);s.step='antidote';choose(s,'skip');go(s);s.step='poison';choose(s,'use');selectSeat(s,target);go(s);
  s.step=nightSteps(s).at(-2);go(s);assert.equal(s.step,'dawn');assert.equal(s.potions.poison,false);
  assert.ok(recapNights(s).flatMap(r=>r.events).some(e=>e.skill==='poison'&&e.executed&&e.rawTargets.includes(target)),board);
 }
});
function knife(s,id,cure='skip'){s.step='attack';if(id)selectSeat(s,id);else choose(s,'skip');go(s);if(s.step==='dawn')return;s.step='antidote';if(!canNext(s))choose(s,cure);go(s);}
function noPoison(s){s.step='poison';if(!canNext(s))choose(s,'skip');go(s);}
function hunt(s,id){s.step='hunt';if(id)assert.equal(selectSeat(s,id),true);else choose(s,'skip');go(s);}
function exile(s,id){s.step='exileVote';s.votePool=s.players.filter(p=>p.alive).map(p=>p.id);selectSeat(s,id);go(s);}
for(const id of ['blood10','blood12','kingGuard10','kingGuard12','kingDream10','kingDream12'])test(id+' full public first-night identity, fixed sequence and defaults',()=>{
 const b=BOARDS[id],s=createGame(id,{sheriff:false}),assigned={};let number=1;
 assert.equal(Object.values(b.roles).reduce((a,n)=>a+n,0),b.playerCount);assert.equal(b.defaults.swallow,b.playerCount===12);
 for(const [r,n]of Object.entries(b.roles)){assigned[r]=[];for(let i=0;i<n;i++)assigned[r].push(number++);}
 go(s);for(let i=0;i<36&&s.step!=='dawn';i++){
  const step=s.step;
  if(['wolves','guard','dream','witch','seer','hunter','demon','idiot'].includes(step)&&!s.rolesConfirmed){const targets=step==='wolves'?[...(assigned.king||[]),...(assigned.blood||[]),...assigned.wolf]:assigned[step];assert.equal(canNext(s),false);for(const target of targets)assert.equal(selectSeat(s,target),true);}
  if(step==='guardTarget')choose(s,'skip');if(step==='sleep')selectSeat(s,assigned.villager[0]);if(step==='attack')choose(s,'skip');if(step==='poison')choose(s,'skip');if(step==='inspect')selectSeat(s,assigned.wolf[0]);go(s);
 }
 assert.equal(s.step,'dawn');assert.equal(s.rolesConfirmed,true);assert.equal(s.players.filter(p=>p.role==='villager').length,4);
 const later=structuredClone(s);later.night=2;const steps=nightSteps(later);assert.equal(steps.includes('idiot'),false);assert.equal(steps.includes('hunt'),id.startsWith('blood'));assert.equal(steps.includes('hunter'),!id.startsWith('blood')&&b.playerCount===12);assert.equal(steps.includes('fear'),false);
 if(id.startsWith('blood')){assert.equal(b.roles.hunter,undefined);assert.equal(s.nightAction.huntApplied,false);assert.equal(recapNights(s)[0].events.some(e=>e.skill==='hunt'),false);assert.equal(b.roles.idiot||0,b.playerCount===12?1:0);}
});
test('blood explosion seals only the next night; confirms identities but blocks all active god operations',()=>{
 const s=ready();s.step='discussion';beginSelfDestruct(s);selectSeat(s,1);go(s);assert.equal(s.step,'lastWords');go(s);assert.equal(s.step,'nextNight');go(s);assert.equal(s.blood.sealNight,2);assert.equal(ordinaryWolves(s).length,3);assert.equal(potionBlocked(s,'antidote'),'當晚神職技能封鎖');s.step='antidote';s.nightAction.attack=9;assert.equal(choose(s,'use'),false);assert.deepEqual(s.potions,{antidote:true,poison:true});
 s.step='inspect';assert.equal(selectSeat(s,2),false);assert.equal(canNext(s),true);assert.equal(inspection(s),'');s.step='hunt';assert.equal(selectSeat(s,2),false);assert.equal(choose(s,'skip'),false);assert.equal(canNext(s),true);
 const cards=recapNights(s).at(-1).events;assert.equal(cards.filter(e=>e.key==='bloodSeal').length,1);assert.equal(cards[0].actorRole,'blood');
 s.step='nextNight';go(s);assert.equal(skillBlocked(s,'seer'),false);s.step='hunt';assert.equal(selectable(s,2),true);
});
test('last blood self-explosion ends immediately without seal or blade',()=>{
 const s=ready();s.players.filter(p=>p.role==='wolf').forEach(p=>p.alive=false);s.step='discussion';beginSelfDestruct(s);selectSeat(s,1);go(s);assert.equal(s.winner,'好人陣營');assert.equal(s.step,'finished');assert.equal(s.blood.lastPending,false);assert.equal(s.blood.sealNight,null);assert.equal(s.blood.lastEvent,null);
});
for(const victory of ['edge','city'])for(const success of [false,true])test('blood last exile mandatory blade '+victory+' success='+success,()=>{
 const s=ready('blood12',{victory}),target=seat(s,'seer');s.players.filter(p=>p.role==='wolf').forEach(p=>p.alive=false);
 if(success)s.players.filter(p=>p.id!==target&&(victory==='city'?ROLE_DATA[p.role]?.kind!=='wolf':ROLE_DATA[p.role]?.kind==='god')).forEach(p=>p.alive=false);
 exile(s,1);assert.equal(s.step,'bloodExile');assert.equal(subtitle(s),'1號玩家出局');go(s);assert.equal(s.step,'lastBlade');assert.equal(s.winner,null);assert.equal(s.players[0].alive,false);assert.equal(next(s),false);assert.equal(choose(s,'skip'),false);assert.equal(selectSeat(s,1),false);selectSeat(s,target);go(s);assert.equal(s.step,'finished');assert.equal(s.winner,success?'狼人陣營':'好人陣營');assert.ok(s.blood.lastEvent);assert.equal(s.blood.lastEvent.skill,'wolf-attack');assert.equal(s.nightRecords.flatMap(r=>r.deaths).some(d=>d.id===target),false);
 const restored=upgradeGame(JSON.parse(JSON.stringify(s)));assert.deepEqual(restored,s);previous(restored);assert.equal(restored.step,'lastBlade');assert.equal(restored.winner,null);assert.equal(restored.players[target-1].alive,true);assert.equal(restored.blood.lastEvent,null);const fresh=restartGame(s);assert.equal(fresh.blood.lastPending,false);assert.equal(fresh.blood.sealNight,null);
});
test('ordinary exile of blood with teammates grants no blade or seal',()=>{
 const s=ready();exile(s,1);assert.equal(s.step,'lastWords');assert.equal(s.winner,null);assert.equal(s.blood.lastPending,false);assert.equal(s.blood.sealNight,null);
});
for(const targetRole of ['blood','seer'])test('hunt '+targetRole+' waits for dawn then keeps correct source and neutral victims',()=>{
 const s=ready();s.night=2;s.deathsCommitted=false;knife(s,null);noPoison(s);const target=seat(s,targetRole),demon=seat(s,'demon');hunt(s,target);assert.equal(s.step,'demonClose');assert.equal(s.players[target-1].alive,true);assert.equal(s.nightAction.huntResolved,false);assert.equal(recapNights(s).at(-1).events.some(e=>e.skill==='hunt'),false);go(s);assert.equal(s.step,'dawn');const id=targetRole==='blood'?target:demon;assert.ok(s.deaths.some(d=>d.id===id&&d.cause==='hunt'));assert.equal(s.nightAction.huntResolved,true);assert.match(recapNights(s).at(-1).events.find(e=>e.skill==='hunt').result,targetRole==='blood'?/狩獵成功/:/狩獵失敗/);assert.equal(s.players[id-1].alive,true);go(s);assert.equal(s.step,'announcement');assert.equal(subtitle(s),'昨晚'+id+'號玩家被殺死，沒有遺言');go(s);assert.equal(s.players[id-1].alive,false);assert.equal(s.blood.lastPending,false);
});
test('demon poison immunity consumes medicine and records blocked event',()=>{
 const s=ready();s.night=2;knife(s,null);s.step='poison';choose(s,'use');selectSeat(s,seat(s,'demon'));go(s);assert.equal(s.potions.poison,false);assert.equal(s.deaths.length,0);assert.equal(s.nightResolution.events.find(e=>e.cause==='poison').blocked,'demonImmunity');assert.equal(recapNights(s).at(-1).events.some(e=>e.skill==='poison'),true);
});
for(const victory of ['edge','city'])test('knife dead demon retains hunt only if '+victory+' not terminal',()=>{
 const s=ready('blood12',{victory});s.night=2;knife(s,seat(s,'demon'));noPoison(s);assert.equal(s.winner,null);hunt(s,2);go(s);assert.deepEqual(s.deaths.map(d=>d.id).sort((a,b)=>a-b),[2,seat(s,'demon')].sort((a,b)=>a-b));
 const a=ready('blood12',{victory});a.night=2;a.potions.antidote=false;a.players.filter(p=>p.role!=='demon'&&(victory==='city'?ROLE_DATA[p.role]?.kind!=='wolf':ROLE_DATA[p.role]?.kind==='god')).forEach(p=>p.alive=false);knife(a,seat(a,'demon'));assert.equal(a.winner,'狼人陣營');assert.equal(a.step,'dawn');assert.equal(selectSeat(a,2),false);assert.equal(a.nightAction.huntApplied,false);
});
for(const id of ['kingGuard10','kingGuard12'])test(id+' guard self/other wolves/empty breaks repeat and same guard cure kills',()=>{
 const s=ready(id),guard=seat(s,'guard');s.step='guardTarget';assert.equal(selectSeat(s,guard),true);s.nightAction.guard=null;s.action=[];assert.equal(selectSeat(s,1),true);go(s);s.step='nextNight';go(s);s.step='guardTarget';assert.equal(selectSeat(s,1),false);choose(s,'skip');go(s);s.step='nextNight';go(s);s.step='guardTarget';assert.equal(selectSeat(s,1),true);go(s);s.nightAction.attack=1;s.nightAction.antidote=true;assert.ok(settleNight(s).deaths.some(d=>d.id===1));
});
for(const id of ['kingDream10','kingDream12'])test(id+' dream repeat or link kills king without gun and retains original dream marks',()=>{
 const s=ready(id);s.night=2;s.lastSleep=1;s.step='sleep';assert.equal(selectSeat(s,seat(s,'dream')),false);assert.equal(choose(s,'skip'),false);selectSeat(s,1);go(s);assert.equal(s.nightAction.repeatPending,1);assert.equal(s.players[0].alive,true);knife(s,null);noPoison(s);assert.equal(s.players[0].alive,true);assert.ok(s.deaths.some(d=>d.id===1&&d.cause==='dreamRepeat'));assert.deepEqual(gunSources(s,{id:1,cause:'dreamRepeat',context:'night',day:2}),[]);assert.equal(s.nightAction.fear,null);
});
for(const board of ['kingGuard10','kingGuard12','kingDream10','kingDream12'])for(const victory of ['edge','city'])test(board+' '+victory+' death priority and no post-win guns',()=>{
 const s=ready(board,{victory});s.night=2;const target=seat(s,board.startsWith('kingGuard')?'guard':'dream');s.players.filter(p=>ROLE_DATA[p.role]?.kind==='god'&&p.id!==target).forEach(p=>p.alive=false);s.potions.antidote=false;knife(s,target);
 assert.equal(s.winner,victory==='edge'?'狼人陣營':null);
 if(victory==='edge'){assert.equal(s.step,'dawn');assert.equal(choose(s,'use'),false);assert.deepEqual(gunSources(s,{id:1,cause:'attack',context:'night',day:2}),[]);}
 else{assert.equal(s.step,'poison');assert.ok(s.deaths.some(d=>d.id===target));}
 const a=ready(board,{victory});a.night=2;a.potions.antidote=false;const protectedId=9;
 if(board.startsWith('kingGuard')){a.step='guardTarget';selectSeat(a,protectedId);go(a);}else{a.step='sleep';selectSeat(a,protectedId);go(a);}
 a.players.filter(p=>p.role==='villager'&&p.id!==protectedId).forEach(p=>p.alive=false);knife(a,protectedId);assert.equal(a.winner,null);assert.equal(a.deaths.length,0);
});
test('hunt keeps separate source when its wolf target already took poison; actual victim only once',()=>{
 const s=ready();s.night=2;knife(s,null);s.step='poison';choose(s,'use');selectSeat(s,2);go(s);hunt(s,2);go(s);assert.equal(s.deaths.filter(d=>d.id===2).length,1);assert.ok(s.nightResolution.events.some(e=>e.source==='hunt'));assert.ok(s.nightResolution.events.some(e=>e.source==='witch'));assert.ok(recapNights(s).at(-1).events.some(e=>e.skill==='hunt'));
});
test('demon killed by knife and failed hunt is counted once with both legal events',()=>{
 const s=ready();s.night=2;const d=seat(s,'demon');knife(s,d);noPoison(s);hunt(s,9);go(s);assert.equal(s.deaths.filter(x=>x.id===d).length,1);assert.equal(s.nightResolution.events.filter(e=>e.id===d).length,2);
});
test('last blood hunted or poisoned is ordinary good win, never last blade',()=>{
 for(const cause of ['hunt','poison']){const s=ready();s.night=2;s.players.filter(p=>p.role==='wolf').forEach(p=>p.alive=false);knife(s,null);if(cause==='poison'){s.step='poison';choose(s,'use');selectSeat(s,1);go(s);}else{noPoison(s);hunt(s,1);go(s);}assert.equal(s.winner,'好人陣營');assert.equal(s.step,'dawn');assert.equal(s.blood.lastPending,false);assert.equal(s.blood.lastEvent,null);}
});
test('blood last blade can hit a living revealed idiot; victory never double-counts',()=>{
 const s=ready('blood12',{victory:'city'}),id=seat(s,'idiot');s.idiot={...s.idiot,seat:id,revealed:true,voteLost:true,exileBanned:true,countsEliminatedForVictory:true};s.players.filter(p=>p.role==='wolf').forEach(p=>p.alive=false);exile(s,1);go(s);assert.equal(selectSeat(s,id),true);go(s);assert.equal(s.players[id-1].alive,false);assert.equal(s.winner,'好人陣營');assert.equal(s.idiot.countsEliminatedForVictory,true);
});
test('catalog assets: 18 exact source IDs, full PNG canvas, shared role image and safe source crop',async()=>{
 const {CATALOG_ART}=await import('../public/data.js');const {cardModel}=await import('../public/recap.js');const {readFile}=await import('node:fs/promises');
 assert.equal(Object.keys(CATALOG_ART).length,18);assert.equal(new Set(Object.values(CATALOG_ART).map(x=>x.driveId)).size,18);
 for(const [role,art]of Object.entries(CATALOG_ART)){const file=await readFile(new URL('../public/'+art.image,import.meta.url));assert.equal(file.subarray(1,4).toString(),'PNG');assert.equal(file.readUInt32BE(16),1060);assert.equal(file.readUInt32BE(20),1484);if(ROLE_DATA[role]){assert.equal(ROLE_DATA[role].image,art.image);const c=cardModel({actorRole:role,displayRole:role,actors:[1],skill:'inspect',rawTargets:[2],effectiveTargets:[2]});assert.equal(c.image,art.image);assert.deepEqual(c.crop,[90,200,880,950]);}}
 assert.equal(ROLE_DATA.blood.image,'art/blood-moon-messenger-approved.png');assert.equal(ROLE_DATA.demon.image,'art/demon-hunter-approved.png');assert.equal(ROLE_DATA.mixed.image,'art/mixed-blood-dual-approved.jpeg');assert.equal(ROLE_DATA.seedWolf,undefined);assert.equal(ROLE_DATA.hiddenWolf,undefined);
});
