import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createGame,next,previous,selectSeat,choose,restartGame,upgradeGame} from '../public/engine.js';
import {BOARDS} from '../public/data.js';
import {recapNights} from '../public/records.js';
import {cardModel} from '../public/recap.js';
import {clampSeconds,remainingSeconds,wheelSeconds,restoresSession} from '../public/timer.js';
function ready(board){const s=createGame(board);let i=0;for(const [role,n]of Object.entries(BOARDS[board].roles))for(let j=0;j<n;j++)s.players[i++].role=role;s.rolesConfirmed=true;return s;}
const go=s=>assert.equal(next(s),true,s.step);
test('recap snapshots raw/effective targets, includes only executed skills, order and undo are stable',()=>{
 const s=ready('12');s.step='exchange';selectSeat(s,9);selectSeat(s,10);go(s);s.step='attack';selectSeat(s,9);go(s);s.step='antidote';choose(s,'use');go(s);s.step='poison';go(s);s.step='inspect';selectSeat(s,9);go(s);
 const events=recapNights(s)[0].events;assert.deepEqual(events.map(e=>e.skill),['swap','wolf-attack','antidote','inspect']);assert.equal(cardModel(events[1]).target,'9號 → 10號');previous(s);assert.equal(recapNights(s)[0].events.length,3);go(s);
 assert.deepEqual(upgradeGame(JSON.parse(JSON.stringify(s))).nightRecords,s.nightRecords);
});
test('mechanical first-night order, learned use image and independent basic/extra events',()=>{
 const s=ready('mechanical12');s.step='attack';selectSeat(s,9);go(s);s.step='antidote';choose(s,'skip');go(s);s.step='mechanical';go(s);selectSeat(s,2);go(s);s.step='mediumInspect';selectSeat(s,1);go(s);
 assert.deepEqual(recapNights(s)[0].events.map(e=>e.key),['basic','learn','medium']);
 s.step='nextNight';go(s);s.step='mechanical';go(s);selectSeat(s,9);go(s);s.players.filter(p=>p.role==='wolf').forEach(p=>p.alive=false);s.step='attack';selectSeat(s,10);go(s);s.step='antidote';choose(s,'skip');go(s);
 const events=recapNights(s)[1].events;assert.deepEqual(events.map(e=>e.key),['extraAttack','basic']);assert.ok(events.every(e=>cardModel(e).image==='art/catalog/mechanical.png'));assert.equal(cardModel(events[1]).name,'狼人');
});
test('trade/lucky cards preserve original profession; failed trade never shows proposed gift',()=>{
 const s=ready('brothers12');s.step='trade';selectSeat(s,9);choose(s,'gift:inspect');go(s);s.step='nextNight';go(s);s.step='luckyAction';selectSeat(s,2);go(s);const model=cardModel(recapNights(s)[1].events[0]);assert.equal(model.name,'幸運兒');assert.equal(model.tone,'villager');assert.equal(model.image,'art/catalog/villager.png');
 const failed=ready('brothers12');failed.step='trade';selectSeat(failed,2);choose(failed,'gift:gun');go(failed);assert.equal(recapNights(failed)[0].events[0].tradeSuccess,false);
});
test('old saves do not fabricate historical recap, restart clears legacy marker',()=>{
 const s=ready('12');s.version=5;delete s.nightRecords;const migrated=upgradeGame(JSON.parse(JSON.stringify(s)));assert.equal(migrated.legacyRecap,true);assert.deepEqual(migrated.nightRecords,[]);assert.equal(restartGame(migrated).legacyRecap,false);
});
test('timer wheel boundaries, defaults, elapsed deadline and startup distinction',()=>{
 assert.equal(wheelSeconds(10,59),659);assert.equal(clampSeconds(-10),0);assert.equal(clampSeconds(900),659);assert.equal(remainingSeconds(1500,1001),1);assert.equal(remainingSeconds(1500,1600),0);assert.equal(wheelSeconds(1,0),60);assert.equal(restoresSession('reload','host'),true);assert.equal(restoresSession('reload','home'),false);assert.equal(restoresSession('reload',null,5),true);assert.equal(restoresSession('navigate',null,5),false);assert.equal(restoresSession('reload','finished'),true);assert.equal(restoresSession('navigate','host'),false);assert.equal(restoresSession('back_forward','host'),false);
});
test('all nine formal SVGs, new approved PNG signatures and PWA assets exist; no old gun filename',async()=>{
 const skills=['wolf-attack','antidote','poison','shield','inspect','swap','gun','learn','trade'];
 const sw=await readFile(new URL('../public/sw.js',import.meta.url),'utf8');
 for(const skill of skills){const name='skills/icon-'+skill+'.svg',svg=await readFile(new URL('../public/'+name,import.meta.url),'utf8');assert.match(svg,/<svg/);assert.ok(sw.includes(name));}
 for(const name of ['wolf-brother-scar-approved','wolf-younger-brother-approved','black-market-merchant-approved']){const b=await readFile(new URL('../public/art/'+name+'.png',import.meta.url));assert.equal(b.subarray(1,4).toString(),'PNG');}
 assert.equal(sw.includes('icon-hunter-gun'),false);const home=await readFile(new URL('../public/art/home-background.svg',import.meta.url),'utf8');assert.equal(home.includes('開始主持'),false);assert.equal(home.includes('角色圖鑑'),false);
});
test('wolf-phase victory stops unconfirmed poison and subsequent recap events',()=>{
 const s=ready('brothers12');s.players.filter(p=>p.role==='villager'&&p.id!==9).forEach(p=>p.alive=false);
 s.step='attack';selectSeat(s,9);go(s);assert.equal(s.step,'witch');go(s);choose(s,'skip');go(s);
 assert.equal(s.step,'dawn');assert.equal(s.nightResolution.poisonSkipped,true);assert.equal(recapNights(s)[0].events.some(e=>e.skill==='poison'),false);
 assert.equal(s.players[2].alive,true);previous(s);assert.equal(s.winner,null);choose(s,'use');go(s);assert.equal(s.step,'poison');assert.deepEqual(s.nightResolution.deaths,[]);
});
test('approved original assets match the documented Drive SHA256 and size',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../docs/assets.json',import.meta.url),'utf8'));
 for(const asset of manifest.originals){const bytes=await readFile(new URL('../'+asset.path,import.meta.url));assert.equal(bytes.length,asset.size,asset.path+' size');assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256,asset.path+' SHA256');}
});
