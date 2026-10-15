import {createGame} from '../test-support/legacy-flow.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {next,previous,choose,selectSeat,upgradeGame,restartGame} from '../public/engine.js';
import {BOARDS,PAGE_BACKGROUNDS} from '../public/data.js';
import {recordDay,recordStage,nightRecord,personSnapshot,recapNights} from '../public/records.js';
import {recapTimeline,finalIdentityModel,outcomeLabel,cardModel,eventCard} from '../public/recap.js';
import {ordinaryWolves,basicActor} from '../public/night.js';
function ready(board='12',rules={}){const s=createGame(board,{sheriff:false,...rules});let i=0;for(const [r,n]of Object.entries(BOARDS[board].roles))for(let j=0;j<n;j++)s.players[i++].role=r;s.rolesConfirmed=true;return s;}
const id=(s,r)=>s.players.find(p=>p.role===r).id;
const go=s=>assert.equal(next(s),true,s.step);
function exile(s,target,stage='exileVote'){s.step=stage;s.action=[];s.choice=null;s.votePool=s.players.filter(p=>p.active&&p.alive).map(p=>p.id);selectSeat(s,target);go(s);}

test('single background covers every current page and only one original is cached',async()=>{assert.equal(new Set(Object.values(PAGE_BACKGROUNDS)).size,1);for(const page of ['home','counts','boards','setup','host','encyclopedia','finished'])assert.equal(PAGE_BACKGROUNDS[page],'art/backgrounds/shared.png');const sw=await readFile(new URL('../public/sw.js',import.meta.url),'utf8');assert.ok(sw.includes('council-v22-2'));for(const name of ['home','counts','boards','setup','host'])assert.equal(sw.includes('backgrounds/'+name+'.'),false);for(const skill of ['vote','sheriff-badge'])assert.ok(sw.includes('skills/icon-'+skill+'.svg'));});
test('five formal new assets match original Drive bytes and SVG contains vector paths',async()=>{const assets=JSON.parse(await readFile(new URL('../docs/complete-recap-assets.json',import.meta.url)));for(const a of assets){const b=await readFile(new URL('../'+a.path,import.meta.url));assert.equal(b.length,a.size);assert.equal(createHash('sha256').update(b).digest('hex'),a.sha256);if(a.path.endsWith('.svg')){assert.match(b.toString(),/<path/);assert.equal(b.toString().includes('<image'),false);}}});
for(const stage of ['exileVote','exileRevote'])test('one actual exile event, no duplicate eliminated card '+stage,()=>{const s=ready();exile(s,9,stage);assert.deepEqual(s.dayEvents.map(e=>e.type),['exile']);assert.equal(s.dayEvents[0].targetSnapshots[0].id,9);assert.equal(s.dayEvents[0].targetSnapshots[0].role,'villager');assert.equal(s.players[8].alive,false);previous(s);assert.equal(s.dayEvents.length,0);assert.equal(s.players[8].alive,true);go(s);assert.equal(s.dayEvents.length,1);});
test('actual exile PK list followed by final tie without nonexistent target',()=>{const s=ready();s.step='exileVote';s.votePool=[9,10,11];choose(s,'tie');selectSeat(s,9);selectSeat(s,10);go(s);assert.equal(s.step,'exilePK');assert.equal(s.dayEvents[0].type,'exilePK');assert.deepEqual(s.dayEvents[0].rawTargets,[9,10]);go(s);go(s);choose(s,'tie');go(s);assert.equal(s.step,'noExile');assert.deepEqual(s.dayEvents.map(e=>e.type),['exilePK','exile']);assert.equal(s.dayEvents[1].rawTargets.length,0);assert.ok(s.players[8].alive&&s.players[9].alive);});
for(const chase of [false,true])test('idiot flip remains alive and records flip only chase='+chase,()=>{const s=ready('classic12',{idiotChase:chase});exile(s,id(s,'idiot'));assert.deepEqual(s.dayEvents.map(e=>e.type),['idiot']);assert.equal(s.dayEvents[0].skill,null);assert.equal(s.players[id(s,'idiot')-1].alive,true);assert.equal(s.exiles.length,0);});
for(const tie of [false,true])test('sheriff final vote result only tie='+tie,()=>{const s=ready('12',{sheriff:true});s.step='sheriffRevote';s.votePool=[9,10];choose(s,tie?'tie':null);if(!tie)selectSeat(s,9);go(s);assert.equal(s.dayEvents.length,1);assert.equal(s.dayEvents[0].type,'sheriff');assert.deepEqual(s.dayEvents[0].rawTargets,tie?[]:[9]);assert.equal(Object.hasOwn(s.dayEvents[0],'votes'),false);});
test('no candidate sheriff outcome and single-candidate outcome stored',()=>{const s=ready('12',{sheriff:true});s.step='noSheriffNotice';go(s);assert.equal(s.dayEvents[0].result,'無警長');const one=ready('12',{sheriff:true});one.step='withdraw';one.candidates=[9];go(one);assert.deepEqual(one.dayEvents[0].rawTargets,[9]);});
for(const tear of [false,true])test('badge '+(tear?'tear':'transfer')+' snapshot and rollback',()=>{const s=ready();s.step='badgeTransfer';s.pendingBadge=1;s.sheriff=1;s.continuation='nextNight';if(tear)choose(s,'skip');else selectSeat(s,9);go(s);assert.equal(s.dayEvents[0].type,'badge');assert.deepEqual(s.dayEvents[0].rawTargets,tear?[]:[9]);assert.equal(s.dayEvents[0].actorSnapshots[0].role,'king');previous(s);assert.equal(s.dayEvents.length,0);assert.equal(s.sheriff,1);});
test('self explosion records death before badge flow but not swallowed badge card',()=>{const s=ready('12',{sheriff:true,swallow:true});s.step='selfDestruct';selectSeat(s,3);go(s);assert.equal(s.dayEvents[0].type,'selfDestruct');assert.equal(s.dayEvents[0].label,'自爆出局');assert.equal(s.dayEvents.some(e=>e.type==='badgeSwallowed'),false);});
for(const source of ['native','lucky'])test('day gun actual action snapshots survive shooter death source='+source,()=>{const s=ready();const hunter=id(s,'hunter');s.players[hunter-1].alive=false;s.step='skill';s.queue=[{id:hunter,cause:'exile',context:'day',day:1,noticeDone:true}];s.continuation='nextNight';if(source==='lucky')s.lucky={seat:hunter,ability:'gun',remaining:1,unlockDay:1};s.operation=source;selectSeat(s,9);go(s);assert.equal(s.dayEvents[0].type,'shot');assert.equal(s.dayEvents[0].actorSnapshots[0].alive,false);assert.equal(s.dayEvents[0].targetSnapshots[0].role,'villager');assert.equal(recapNights(s).some(r=>r.events.some(e=>e.skill==='gun')),false);});
test('unfired gun creates no card',()=>{const s=ready();s.step='skill';s.queue=[{id:id(s,'hunter'),cause:'exile',context:'day',noticeDone:true}];s.continuation='nextNight';choose(s,'skip');go(s);assert.deepEqual(s.dayEvents,[]);});
test('terminal exile stops badge and later gun while retaining actual final action',()=>{const s=ready();s.players.filter(p=>['king','wolf'].includes(p.role)&&p.id!==2).forEach(p=>p.alive=false);s.sheriff=2;exile(s,2);assert.equal(s.winner,'好人陣營');assert.equal(s.step,'finished');assert.deepEqual(s.dayEvents.map(e=>e.type),['exile']);});
test('timeline interleaves saved night/day events and keeps same-target independent knives',()=>{const s=ready();s.nightRecords=[{night:1,events:[{key:'basic',skill:'wolf-attack',executed:true,order:1},{key:'revenge',skill:'wolf-attack',executed:true,order:2}],deaths:[{id:9}],settled:true},{night:2,events:[],deaths:[],settled:true}];recordDay(s,'exile',{targets:[3],skill:'vote'});s.night=2;recordDay(s,'shot',{actors:[8],targets:[4],skill:'gun'});const t=recapTimeline(s);assert.deepEqual(t.map(x=>x.kind+x.number),['night1','day1','night2','day2']);assert.equal(t[0].events.length,2);assert.equal(t[1].events.some(e=>e.cause==='attack'),false);});
for(const change of ['infection','gargoyle'])test(change+' original appearance that night and wolf next night',()=>{const s=ready();const target=id(s,'witch');if(change==='infection')Object.assign(s.infection,{success:true,target,usedNight:1});else Object.assign(s.gargoyle,{target,transformedNight:1});assert.equal(personSnapshot(s,target).tone,'god');assert.equal(personSnapshot(s,target).name,'女巫');s.night=2;const p=personSnapshot(s,target);assert.equal(p.tone,'wolf');assert.match(p.name,change==='infection'?/感染者/:/轉化者\(巫\)/);assert.equal(p.image,s.players[target-1].role==='witch'?'art/catalog/witch.png':null);});
test('event snapshot is immutable after subsequent real camp change and restore',()=>{const s=ready(),target=id(s,'witch');recordDay(s,'exile',{targets:[target],skill:'vote'});Object.assign(s.infection,{success:true,target,usedNight:1});assert.equal(s.dayEvents[0].targetSnapshots[0].camp,'god');const loaded=upgradeGame(JSON.parse(JSON.stringify(s)));assert.deepEqual(loaded,s);assert.deepEqual(restartGame(s).dayEvents,[]);});
test('final groups use real camp, mixed never follows model into wolves and two groups sorted',()=>{const s=ready('classicMixed12');s.mixed={...s.mixed,chosen:true,camp:'狼人陣營'};const mixed=id(s,'mixed'),witch=id(s,'witch');Object.assign(s.infection,{success:true,target:witch,usedNight:1});const groups=finalIdentityModel(s);assert.equal(groups[0].camp,'wolf');assert.ok(groups[0].players.some(p=>p.id===witch&&p.original==='女巫'));assert.ok(groups[1].players.some(p=>p.id===mixed));for(const g of groups)assert.deepEqual(g.players.map(p=>p.id),g.players.map(p=>p.id).sort((a,b)=>a-b));});
test('precise outcome wording excludes fictitious normal success and failed trade gift',()=>{assert.equal(outcomeLabel({skill:'trade',tradeSuccess:false,tradeAbility:'gun'}),'失敗');assert.equal(outcomeLabel({skill:'trade',tradeSuccess:true,tradeAbility:'gun'}),'贈送槍');assert.equal(outcomeLabel({skill:'transform'}),'');assert.equal(outcomeLabel({skill:'sleep',outcome:'連帶'}),'連帶');assert.equal(outcomeLabel({skill:'infect',infection:{success:false,reason:'antidote'}}),'失敗 · 解藥救回');assert.equal(outcomeLabel({skill:'wolf-attack',damage:[{blocked:'sleep'}]}),'夢遊免疫');assert.equal(outcomeLabel({skill:'gun',blocked:'immuneNightGun'}),'免疫');});
test('demon hunt recap only displays concise outcome for both new and saved games',()=>{assert.equal(outcomeLabel({skill:'hunt',result:'狩獵成功：2號死亡'}),'狩獵成功');assert.equal(outcomeLabel({skill:'hunt',result:'狩獵失敗：1號獵魔人死亡'}),'狩獵失敗');assert.equal(outcomeLabel({skill:'hunt',result:'狩獵成功'}),'狩獵成功');assert.equal(outcomeLabel({skill:'hunt',result:'狩獵失敗'}),'狩獵失敗');assert.equal(outcomeLabel({skill:'hunt',result:null}),'');assert.equal(outcomeLabel({skill:'inspect',result:'狼人'}),'狼人');});
test('legacy save does not backfill sheriff, PK or badge history',()=>{const s=ready();delete s.recapVersion;s.night=5;s.sheriff=9;const restored=upgradeGame(JSON.parse(JSON.stringify(s)));assert.deepEqual(restored.dayEvents,[]);assert.deepEqual(recapTimeline(restored),[]);});
test('night terminal final identities use formal deaths even before public seat announcement',()=>{const s=ready();s.winner='狼人陣營';s.nightState.deaths=[{id:9,cause:'attack'}];assert.equal(s.players[8].alive,true);assert.equal(finalIdentityModel(s).flatMap(g=>g.players).find(p=>p.id===9).alive,false);assert.equal(s.players[8].alive,true);});

test('single takeover wolf keeps night-specific identity, original portrait and no seat number in recap',()=>{
 const cases=[
  {title:'infected villager',board:'seedHidden12',expected:'感染者',owner:'villager',setup:s=>{Object.assign(s.infection,{success:true,target:id(s,'villager'),usedNight:2,joinNight:3});s.players.filter(p=>['wolf','seedWolf'].includes(p.role)).forEach(p=>p.alive=false);}},
  {title:'converted seer',board:'gargoyle12',expected:'轉化者（預）',owner:'seer',setup:s=>{Object.assign(s.gargoyle,{target:id(s,'seer'),transformedNight:1,joinNight:3});s.players.filter(p=>['wolf','gargoyle'].includes(p.role)).forEach(p=>p.alive=false);}},
  {title:'mechanical learning medium',board:'mechanical12',expected:'機械狼(通)',owner:'mechanical',setup:s=>{Object.assign(s.mechanical,{role:'medium',night:1});s.players.filter(p=>p.role==='wolf').forEach(p=>p.alive=false);}},
  {title:'younger wolf joins',board:'brothers12',expected:'狼弟',owner:'younger',setup:s=>{s.brothers.joinNight=3;s.players.filter(p=>['wolf','elder'].includes(p.role)).forEach(p=>p.alive=false);}}
 ];
 const previousDocument=globalThis.document;
 const domNode=tag=>({tag,children:[],attributes:{},dataset:{},classList:{add(){}},append(...nodes){this.children.push(...nodes);},setAttribute(key,val){this.attributes[key]=val;},textContent:null});
 try{
  globalThis.document={createElement:domNode,createElementNS:(_ns,tag)=>domNode(tag)};
  for(const c of cases){
   const s=ready(c.board);s.night=3;c.setup(s);
   assert.equal(ordinaryWolves(s).length,c.owner==='mechanical'?0:1,c.title);
   assert.equal(basicActor(s).id,id(s,c.owner),c.title);
   s.nightAction.attack=s.players.find(p=>p.role==='villager'&&p.id!==basicActor(s).id).id;
   recordStage(s,'attack',1);
   const e=nightRecord(s).events.at(-1);
   assert.equal(e.key,'basic',c.title);assert.deepEqual(e.actors,[id(s,c.owner)],c.title);
   e.executed=true;
   for(const item of [e,recapNights(upgradeGame(JSON.parse(JSON.stringify(s))))[0].events[0]]){
    assert.equal(cardModel(item).name,c.expected,c.title);
    assert.equal(cardModel(item).image,s.players.find(p=>p.role===c.owner).role==='mechanical'?'art/catalog/mechanical.png':item.actorSnapshots[0].image,c.title);
    assert.equal(cardModel(item).tone,'wolf',c.title);
    const card=eventCard(item);
    assert.equal(card.children[1].children[0].textContent,c.expected,c.title);
    assert.equal(card.children[1].children.length,1,c.title+' basic wolf knife has no actor number');
   }
   if(c.title==='infected villager'){
    const old=structuredClone(e);delete old.actorSnapshots;
    assert.equal(cardModel(old).name,'感染者','older saved event uses stored infection flag');
    assert.equal(eventCard(old).children[1].children[0].textContent,'感染者');
   }
  }
 }finally{if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;}
});
test('joint wolf attack and original wolf keep generic label; other skills preserve names',()=>{
 const infected=ready('seedHidden12');infected.night=3;Object.assign(infected.infection,{success:true,target:id(infected,'villager'),usedNight:2,joinNight:3});
 infected.players.find(p=>p.role==='seedWolf').alive=false;
 const w=infected.players.filter(p=>p.role==='wolf');w.slice(1).forEach(p=>p.alive=false);
 infected.nightAction.attack=id(infected,'seer');
 recordStage(infected,'attack',1);
 let e=nightRecord(infected).events.at(-1);
 assert.equal(e.actors.length,2);
 assert.equal(cardModel(e).name,'狼人');
 const original=ready('seedHidden12');original.night=3;original.players.filter(p=>p.role==='wolf').forEach(p=>p.alive=false);
 original.nightAction.attack=id(original,'seer');recordStage(original,'attack',1);
 e=nightRecord(original).events.at(-1);assert.equal(e.actors.length,1);assert.equal(e.actorRole,'seedWolf');assert.equal(cardModel(e).name,'狼人');
 const ordinary=ready('12');ordinary.players.filter(p=>p.role==='king'||p.role==='wolf'&&p.id!==id(ordinary,'wolf')).forEach(p=>p.alive=false);
 ordinary.nightAction.attack=id(ordinary,'villager');recordStage(ordinary,'attack',1);
 assert.equal(cardModel(nightRecord(ordinary).events.at(-1)).name,'狼人');
 assert.equal(cardModel({key:'revenge',skill:'wolf-attack',displayRole:'younger',actorRole:'younger',rawTargets:[9],effectiveTargets:[9],actors:[4]}).name,'狼弟');
});
