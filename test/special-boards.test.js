import test from 'node:test';
import assert from 'node:assert/strict';
import {BOARDS,availableBoards} from '../public/data.js';
import {createGame,upgradeGame,restartGame} from '../public/engine.js';
test('special classification includes existing approved boards with no duplicate or omitted configuration',()=>{
 assert.deepEqual(availableBoards(10,'special').map(b=>b.id),['gargoyle10','seedHidden10','fragrance10']);
 assert.deepEqual(availableBoards(12,'special').map(b=>b.id),['gargoyle12','seedHidden12','brothers12','masquerade12','fragrance12']);
 for(const count of [10,12]){const all=['normal','special'].flatMap(c=>availableBoards(count,c).map(b=>b.id));assert.equal(new Set(all).size,all.length);assert.deepEqual(all.sort(),Object.values(BOARDS).filter(b=>b.enabled&&b.playerCount===count).map(b=>b.id).sort());}
});
test('moving a board preserves saved identity, room settings, restart and upgrade',()=>{
 for(const id of ['gargoyle10','gargoyle12','seedHidden10','seedHidden12','brothers12']){const s=createGame(id,{sheriff:false,selfRescue:true,victory:'city'}),restored=upgradeGame(JSON.parse(JSON.stringify(s))),restarted=restartGame(restored);assert.equal(restored.boardId,id);assert.equal(restarted.boardId,id);assert.equal(restored.rules.victory,'city');assert.equal(restarted.rules.victory,'edge');assert.equal(restarted.rules.selfRescue,true);assert.equal(restarted.players.filter(p=>p.active).length,BOARDS[id].playerCount);}
});
