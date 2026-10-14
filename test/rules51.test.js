import {createGame} from '../test-support/legacy-flow.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('user decision removes detailed-rules entry and its setup initialization',()=>{
 const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8'),app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 assert.doesNotMatch(html,/boardDetails|boardRulesText/);assert.doesNotMatch(app,/boardRulesText|import.*boardRules/);
 assert.match(html,/class="rules-form"/);assert.match(html,/class="night-order"/);
});
