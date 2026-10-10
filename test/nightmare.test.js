import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createGame,next,choose,selectSeat,selectable,canNext,previous,nightSteps,subtitle,upgradeGame,restartGame,potionBlocked,inspection,gunSources,beginSelfDestruct} from '../public/engine.js';
import {BOARDS,ROLE_DATA} from '../public/data.js';
import {settleNight,trueWinner,ordinaryWolves,forcedEmpty} from '../public/night.js';
import {recapNights} from '../public/records.js';
import {cardModel} from '../public/recap.js';
const go=s=>assert.equal(next(s),true,'cannot leave '+s.step);
test('v6 refresh migrates current decisions and every back snapshot without inventing recap',()=>{
 const s=createGame('12',{sheriff:false});s.version=6;s.step='antidote';s.nightAction.attack=9;s.nightAction.antidote=true;s.potions.antidote=false;
 delete s.lastFear;delete s.lastSleep;delete s.nightState;
 for(const k of ['fear','fearSkip','fearApplied','sleep','sleepApplied','repeatPending','repeatExecuted','forcedAttackReason'])delete s.nightAction[k];
 const h=structuredClone(s);delete h.history;h.step='attack';h.nightAction.antidote=null;h.potions.antidote=true;s.history.push(h);
 const restored=upgradeGame(JSON.parse(JSON.stringify(s)));assert.equal(restored.version,7);assert.equal(restored.nightAction.attack,9);assert.equal(restored.potions.antidote,false);assert.equal(restored.nightAction.fearApplied,false);assert.deepEqual(restored.nightState.deaths,[]);assert.equal(restored.legacyRecap,false);
 assert.equal(previous(restored),true);assert.equal(restored.step,'attack');assert.equal(restored.potions.antidote,true);assert.equal(restored.version,7);assert.deepEqual(restored.nightState.deaths,[]);
});
function ready(board='nightmare12',rules={}){const s=createGame(board,rules);let i=0;for(const [role,n]of Object.entries(BOARDS[board].roles))for(let k=0;k<n;k++)s.players[i++].role=role;s.rolesConfirmed=true;s.night=2;return s;}
const seat=(s,r)=>s.players.find(p=>p.role===r).id;
function fear(s,id){s.step='fear';if(id)assert.equal(selectSeat(s,id),true);else choose(s,'skip');go(s);}
function sleep(s,id){s.step='sleep';assert.equal(selectSeat(s,id),true);go(s);}
function attack(s,id){s.step='attack';if(id)selectSeat(s,id);else choose(s,'skip');go(s);}
function cure(s,value='skip'){s.step='antidote';choose(s,value);go(s);}
function poison(s,id){s.step='poison';if(id){choose(s,'use');selectSeat(s,id);}else if(!potionBlocked(s,'poison'))choose(s,'skip');go(s);}
function nextNight(s){s.step='nextNight';go(s);}
test('confirmed same-night eligibility: knife-killed witch may poison before announcement',()=>{
 const s=ready('nightmare12',{sheriff:false}),witch=seat(s,'witch');attack(s,witch);cure(s,'skip');assert.equal(s.winner,null);assert.ok(s.nightState.deaths.some(d=>d.id===witch));assert.equal(s.players.find(p=>p.id===witch).alive,true);assert.equal(potionBlocked(s,'poison'),'');poison(s,9);assert.equal(s.potions.poison,false);assert.ok(s.nightState.deaths.some(d=>d.id===9));
 s.step='announcement';go(s);assert.equal(s.players.find(p=>p.id===witch).alive,false);assert.equal(s.players.find(p=>p.id===9).alive,false);s.step='poison';assert.equal(choose(s,'use'),false);
});
test('confirmed same-night eligibility: knife-killed seer may inspect until announcement',()=>{
 const s=ready('nightmare12',{sheriff:false}),seer=seat(s,'seer');attack(s,seer);cure(s,'skip');poison(s,null);assert.ok(s.nightState.deaths.some(d=>d.id===seer));assert.equal(s.players.find(p=>p.id===seer).alive,true);s.step='inspect';assert.equal(selectSeat(s,1),true);go(s);assert.equal(inspection(s),'down');
 s.step='announcement';go(s);assert.equal(s.players.find(p=>p.id===seer).alive,false);s.step='inspect';assert.equal(selectSeat(s,1),false);
});
for(const board of ['nightmare10','nightmare12']){
 test(board+' fixed counts, room defaults and exact first/later night registration',()=>{
  const b=BOARDS[board],s=createGame(board,{sheriff:false});assert.equal(Object.values(b.roles).reduce((a,n)=>a+n,0),b.playerCount);assert.equal(b.defaults.swallow,b.playerCount===12);
  const roles={};let id=1;for(const [r,n]of Object.entries(b.roles)){roles[r]=[];for(let k=0;k<n;k++)roles[r].push(id++);}
  go(s);go(s);assert.equal(subtitle(s),'夢魘請睜眼');assert.equal(next(s),false);selectSeat(s,roles.nightmare[0]);go(s);assert.equal(subtitle(s),'選擇你今晚要恐懼的對象');choose(s,'skip');go(s);assert.equal(subtitle(s),'夢魘請閉眼');go(s);
  selectSeat(s,roles.dream[0]);go(s);assert.equal(subtitle(s),'選擇你今晚要夢遊的對象');assert.equal(choose(s,'skip'),false);assert.equal(next(s),false);selectSeat(s,roles.villager[0]);go(s);go(s);
  roles.wolf.forEach(id=>selectSeat(s,id));assert.equal(subtitle(s),'狼人請睜眼，確認彼此身分');go(s);choose(s,'skip');go(s);selectSeat(s,roles.witch[0]);go(s);assert.equal(subtitle(s),'今晚他死了，你要使用解藥嗎？');go(s);choose(s,'skip');go(s);go(s);selectSeat(s,roles.seer[0]);go(s);selectSeat(s,roles.nightmare[0]);go(s);assert.equal(inspection(s),'down');go(s);go(s);
  if(b.roles.hunter){selectSeat(s,roles.hunter[0]);go(s);go(s);go(s);}
  assert.equal(s.step,'dawn');assert.equal(s.rolesConfirmed,true);assert.equal(s.players.filter(p=>p.role==='villager').length,4);
  assert.equal(nightSteps(s).includes('hunter'),b.playerCount===12);nextNight(s);s.step='wolves';assert.equal(subtitle(s),'狼人請睜眼');assert.ok(s.players.every(p=>p.id<=b.playerCount||!selectable(s,p.id)));
 });
}
test('fear self/dead/previous target prohibited; empty fear resets; sleep has no voluntary skip',()=>{
 const s=ready();s.step='fear';assert.equal(selectSeat(s,seat(s,'nightmare')),false);s.players[9].alive=false;assert.equal(selectSeat(s,10),false);fear(s,seat(s,'seer'));nextNight(s);s.step='fear';assert.equal(selectSeat(s,seat(s,'seer')),false);choose(s,'skip');go(s);nextNight(s);assert.equal(s.lastFear,null);s.step='fear';assert.equal(selectSeat(s,seat(s,'seer')),true);
 s.step='sleep';s.action=[];assert.equal(selectSeat(s,seat(s,'dream')),false);assert.equal(selectSeat(s,10),false);assert.equal(choose(s,'skip'),false);assert.equal(canNext(s),false);
});
test('fear any ordinary wolf forces the whole team empty and leaves all captions',()=>{
 const s=ready();fear(s,seat(s,'wolf'));assert.equal(forcedEmpty(s),true);s.step='wolves';go(s);assert.equal(s.nightAction.emptyAttack,true);assert.equal(s.nightAction.forcedAttackReason,'fear');assert.equal(selectSeat(s,9),false);assert.equal(choose(s,'skip'),false);go(s);assert.equal(s.step,'witch');assert.equal(s.nightAction.attack,null);assert.equal(recapNights(s)[0].events.some(e=>e.skill==='wolf-attack'),false);go(s);assert.equal(potionBlocked(s,'antidote'),'今晚沒有狼刀目標');assert.equal(subtitle(s),'今晚他死了，你要使用解藥嗎？');
});
for(const role of ['dream','witch','seer','hunter'])test('fear '+role+' disables skills without omitting its stage',()=>{
 const s=ready();fear(s,seat(s,role));s.step={dream:'sleep',witch:'antidote',seer:'inspect',hunter:'gesture'}[role];
 if(role==='dream'){assert.equal(selectSeat(s,9),false);assert.equal(canNext(s),true);go(s);assert.equal(s.step,'dreamClose');assert.equal(s.nightAction.sleepApplied,false);}
 if(role==='witch'){s.nightAction.attack=9;assert.equal(potionBlocked(s,'antidote'),'當晚受到恐懼，無法使用技能');assert.equal(choose(s,'use'),false);go(s);assert.equal(s.step,'poison');assert.equal(choose(s,'use'),false);go(s);assert.deepEqual(s.potions,{antidote:true,poison:true});}
 if(role==='seer'){assert.equal(selectSeat(s,1),false);go(s);assert.equal(s.step,'inspectResult');assert.equal(inspection(s),'');go(s);assert.equal(s.step,'seerClose');}
 if(role==='hunter'){go(s);assert.equal(s.step,'hunterClose');assert.deepEqual(gunSources(s,{id:seat(s,role),cause:'attack',day:s.night,context:'night'}),[]);assert.deepEqual(gunSources(s,{id:seat(s,role),cause:'exile',day:s.night,context:'day'}),['native']);}
});
test('dead nightmare keeps already applied fear; last nightmare retains basic attack and self explode',()=>{
 const s=ready();s.players.filter(p=>p.role==='wolf').forEach(p=>p.alive=false);assert.equal(trueWinner(s),null);assert.deepEqual(ordinaryWolves(s).map(p=>p.role),['nightmare']);fear(s,seat(s,'witch'));sleep(s,9);attack(s,1);assert.equal(s.step,'dawn');assert.equal(s.winner,'好人陣營');assert.equal(potionBlocked(s,'poison'),'當晚受到恐懼，無法使用技能');assert.ok(s.nightAction.fearApplied);assert.equal(s.nightAction.fear,seat(s,'witch'));
 const boom=ready();boom.players.filter(p=>p.role==='wolf').forEach(p=>p.alive=false);boom.step='discussion';assert.equal(beginSelfDestruct(boom),true);selectSeat(boom,1);go(boom);assert.equal(boom.preSheriffExplosions,1);assert.equal(boom.players[0].alive,false);
});
test('sleep blocks knife and poison; successful use still spends medicine and persists event',()=>{
 const s=ready();sleep(s,9);attack(s,9);cure(s,'skip');poison(s,9);assert.deepEqual(s.nightResolution.deaths,[]);assert.deepEqual(s.nightResolution.events.map(e=>e.blocked),['sleep','sleep']);assert.equal(s.potions.poison,false);assert.ok(recapNights(s)[0].events.some(e=>e.skill==='poison'));
 const a=ready();sleep(a,9);attack(a,9);cure(a,'use');assert.equal(a.potions.antidote,false);assert.deepEqual(a.nightResolution.deaths,[]);assert.ok(recapNights(a)[0].events.some(e=>e.skill==='antidote'));assert.equal(choose(a,'use'),false);
});
test('pending repeat is alive/targetable; same-batch last wolf and last civilian deaths favor wolves even with empty knife',()=>{
 const s=ready('nightmare10');s.players.filter(p=>p.role==='wolf'||p.role==='villager'&&p.id!==7).forEach(p=>p.alive=false);s.lastSleep=1;sleep(s,1);assert.equal(s.nightAction.repeatPending,1);assert.equal(s.players[0].alive,true);s.step='inspect';assert.equal(selectSeat(s,1),true);s.nightAction.inspect=null;attack(s,null);assert.equal(s.winner,null);poison(s,7);assert.equal(s.winner,'狼人陣營');assert.equal(s.step,'dawn');assert.deepEqual(s.deaths.map(d=>d.id),[1,7]);assert.equal(s.nightAction.repeatExecuted,true);assert.equal(recapNights(s)[0].events.find(e=>e.key==='sleep').result,'連續攝夢致死');go(s);assert.equal(s.step,'finished');
});
test('wolf victory precedes pending repeat, link and poison; no later role/candidate page',()=>{
 const s=ready();s.players.filter(p=>p.role==='wolf'||ROLE_DATA[p.role]?.kind==='god'&&p.role!=='dream').forEach(p=>p.alive=false);s.lastSleep=1;sleep(s,1);attack(s,seat(s,'dream'));assert.equal(s.winner,'狼人陣營');assert.equal(s.step,'dawn');assert.equal(s.nightAction.repeatExecuted,false);assert.deepEqual(s.deaths.map(d=>d.id),[seat(s,'dream')]);assert.equal(recapNights(s)[0].events.find(e=>e.key==='sleep').result,null);assert.equal(choose(s,'use'),false);assert.equal(selectSeat(s,9),false);go(s);assert.equal(s.step,'finished');assert.equal(s.players[0].alive,true);previous(s);previous(s);assert.equal(s.winner,null);
});
for(const targetRole of ['dream','villager'])test('last '+targetRole+' sleep or optional antidote prevents premature defeat',()=>{
 const s=ready();const target=targetRole==='dream'?seat(s,'seer'):9;
 s.players.filter(p=>targetRole==='dream'?ROLE_DATA[p.role]?.kind==='god'&&p.id!==target&&p.role!=='dream':p.role==='villager'&&p.id!==target).forEach(p=>p.alive=false);sleep(s,target);attack(s,target);assert.equal(s.winner,null);cure(s,'skip');assert.equal(s.winner,null);assert.deepEqual(s.nightResolution.deaths,[]);
 const a=ready();a.players.filter(p=>p.role==='villager'&&p.id!==9).forEach(p=>p.alive=false);attack(a,9);assert.equal(a.winner,null);assert.equal(a.nightState.wolfDone,false);cure(a,'use');assert.equal(a.winner,null);assert.deepEqual(a.nightResolution.deaths,[]);
});
test('repeat kills last wolf only after wolf barrier; protected wolf knife remains recorded',()=>{
 const s=ready();s.players.filter(p=>p.role==='wolf').forEach(p=>p.alive=false);s.lastSleep=1;sleep(s,1);attack(s,9);cure(s,'use');assert.equal(s.winner,null);poison(s,null);assert.equal(s.winner,'好人陣營');assert.equal(s.step,'dawn');assert.deepEqual(s.deaths.map(d=>d.id),[1]);assert.ok(s.nightResolution.events.some(e=>e.source==='basic'));
});
test('night dream death links current target; cure prevents link; daytime death does not retroactively link',()=>{
 const s=ready();sleep(s,9);attack(s,seat(s,'dream'));cure(s,'skip');assert.deepEqual(s.deaths.map(d=>d.id),[seat(s,'dream')]);poison(s,null);assert.deepEqual(s.deaths.map(d=>d.id),[seat(s,'dream'),9]);assert.equal(s.deaths.find(d=>d.id===9).cause,'dreamLink');
 const healed=ready();sleep(healed,9);attack(healed,seat(healed,'dream'));cure(healed,'use');poison(healed,null);assert.deepEqual(healed.deaths,[]);
 const daytime=ready();sleep(daytime,9);daytime.step='exileVote';daytime.votePool=[seat(daytime,'dream')];selectSeat(daytime,seat(daytime,'dream'));go(daytime);assert.equal(daytime.players[8].alive,true);
 const toxic=ready();sleep(toxic,9);attack(toxic,null);poison(toxic,seat(toxic,'dream'));assert.deepEqual(toxic.deaths.map(d=>d.id),[seat(toxic,'dream'),9]);
});
test('fear breaks consecutive sleep history and sleep does not cancel fear on beneficiary',()=>{
 const s=ready();s.lastSleep=9;fear(s,seat(s,'dream'));s.step='sleep';go(s);nextNight(s);assert.equal(s.lastSleep,null);sleep(s,9);assert.equal(s.nightAction.repeatPending,null);
 const a=ready();fear(a,seat(a,'seer'));sleep(a,seat(a,'seer'));a.step='inspect';assert.equal(selectSeat(a,1),false);assert.equal(canNext(a),true);
});
test('dream-caused hunter death blocks gun; ordinary unfeared night knife permits gun',()=>{
 for(const cause of ['dreamRepeat','dreamLink','poison']){const s=ready();assert.deepEqual(gunSources(s,{id:seat(s,'hunter'),cause,context:'night',day:s.night}),[]);}
 const s=ready();assert.deepEqual(gunSources(s,{id:seat(s,'hunter'),cause:'attack',context:'night',day:s.night}),['native']);
});
test('night markers, snapshots, limits, ledger and recap roll back fully and reload identically',()=>{
 const s=ready();fear(s,seat(s,'seer'));sleep(s,9);assert.deepEqual(s.marks.map(m=>m.type),['fear','sleep']);attack(s,9);cure(s,'skip');poison(s,10);
 const saved=JSON.parse(JSON.stringify(s));assert.deepEqual(upgradeGame(saved),s);previous(s);assert.equal(s.step,'poison');assert.equal(s.nightState.postDone,false);assert.equal(s.nightResolution.events.some(e=>e.cause==='poison'),false);choose(s,'skip');go(s);assert.equal(s.potions.poison,true);assert.equal(recapNights(s)[0].events.some(e=>e.skill==='poison'),false);
 assert.ok(s.marks.some(m=>m.type==='fear'));assert.ok(s.marks.some(m=>m.type==='sleep'));const fresh=restartGame(s);assert.equal(fresh.boardId,s.boardId);assert.deepEqual(fresh.rules,s.rules);assert.equal(fresh.lastFear,null);assert.equal(fresh.lastSleep,null);assert.deepEqual(fresh.nightRecords,[]);assert.deepEqual(fresh.nightState.deaths,[]);
});
test('recap fear has no blockade explanation, sleep only marks actual repeat death and uses approved art',()=>{
 const s=ready();fear(s,2);sleep(s,9);const cards=recapNights(s)[0].events;assert.deepEqual(cards.map(e=>e.skill),['fear','sleep']);assert.equal(cards[0].result,null);assert.equal(cards[1].result,null);assert.equal(cardModel(cards[0]).image,'art/nightmare-minimal-approved.png');assert.equal(cardModel(cards[1]).image,'art/dream-catcher-minimal-approved.png');assert.equal(cardModel(cards[0]).tone,'wolf');assert.equal(cardModel(cards[1]).tone,'god');
});
test('chapter 6 skill text and all four approved new assets are exact, host has no portrait card',async()=>{
 const spec=await readFile(new URL('../README.md',import.meta.url),'utf8');
 for(const [id,name] of [['nightmare','夢魘'],['dream','攝夢人']]){const section=spec.replaceAll('\r','').split('## '+name+'\n')[1];assert.ok(section.includes('**［技能］** '+ROLE_DATA[id].skill));const png=await readFile(new URL('../public/'+ROLE_DATA[id].image,import.meta.url));assert.equal(png.subarray(1,4).toString(),'PNG');}
 for(const skill of ['fear','sleep'])assert.match(await readFile(new URL('../public/skills/icon-'+skill+'.svg',import.meta.url),'utf8'),/<svg/);
 const app=await readFile(new URL('../public/app.js',import.meta.url),'utf8');assert.equal(app.includes('eventCard('),false);assert.ok(app.includes('skillIcon(skill)'));
});
test('sleep keeps the remaining god alive in the wolf phase; later direct link is a separate batch',()=>{
 const s=ready();s.players.filter(p=>['witch','hunter'].includes(p.role)).forEach(p=>p.alive=false);sleep(s,seat(s,'seer'));attack(s,seat(s,'dream'));assert.equal(s.winner,null);assert.deepEqual(s.deaths.map(d=>d.id),[seat(s,'dream')]);poison(s,null);assert.equal(s.winner,'狼人陣營');assert.deepEqual(s.deaths.map(d=>d.id),[seat(s,'dream'),seat(s,'seer')]);assert.equal(s.nightState.batches.length,2);assert.deepEqual(s.nightState.batches[1].deaths.map(d=>d.id),[seat(s,'seer')]);
});
