import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {BOARDS} from '../public/data.js';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.COUNCIL_PLAYWRIGHT_MODULE||'playwright');
const server=spawn(process.execPath,['server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:'5309'},stdio:['ignore','pipe','pipe']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
const browser=await chromium.launch({channel:'msedge',headless:true}),results=[],errors=[];
try{for(const board of ['seedHidden10','seedHidden12']){
 const context=await browser.newContext({viewport:{width:390,height:844}}),p=await context.newPage();p.on('pageerror',e=>errors.push(String(e)));
 const a={};let n=1;for(const [r,count]of Object.entries(BOARDS[board].roles))a[r]=Array.from({length:count},()=>n++);
 const seat=id=>p.locator('.seat[aria-label^="'+id+'號 "]');await p.goto('http://127.0.0.1:5309/');await p.locator('#start').click();await p.locator('[data-count="'+BOARDS[board].playerCount+'"]').click();await p.locator('#boardsSpecial').click();await p.locator('[data-board="'+board+'"]').click();await p.locator('#setupStart').click();
 assert.equal(await p.locator('#next').isEnabled(),true);assert.equal(await seat(a.hiddenWolf[0]).isEnabled(),false);await p.locator('#next').click();
 for(let i=0;i<12;i++){const sub=await p.locator('#subtitle').textContent();if(sub==='隱狼請睜眼')break;if(sub==='守衛請睜眼')await seat(a.guard[0]).click();if(sub==='今晚你要守護的對象是？')await p.getByRole('button',{name:'空守',exact:true}).click();if(sub==='狼人請睜眼，確認彼此身分')for(const id of [...a.seedWolf,...a.wolf])await seat(id).click();if(sub==='選擇你們今晚要襲擊的對象')await seat(a.hiddenWolf[0]).click();await p.locator('#next').click();}
 assert.equal(await p.locator('#subtitle').textContent(),'隱狼請睜眼');assert.equal(await p.locator('#next').isEnabled(),false);assert.equal(await seat(a.hiddenWolf[0]).locator('.role-name').textContent(),'未辨識');assert.equal(await seat(a.guard[0]).isEnabled(),false);
 await seat(a.hiddenWolf[0]).click();await p.reload();assert.equal(await seat(a.hiddenWolf[0]).locator('.role-name').textContent(),'隱狼');assert.equal(await p.locator('#next').isEnabled(),true);await p.locator('#next').click();assert.equal(await p.locator('#subtitle').textContent(),'隱狼請閉眼');await p.locator('#back').click();await seat(a.villager[0]).click();assert.equal(await seat(a.hiddenWolf[0]).locator('.role-name').textContent(),'未辨識');assert.equal(await seat(a.villager[0]).locator('.role-name').textContent(),'隱狼');await p.locator('#back').click();assert.equal(await p.locator('#subtitle').textContent(),'狼人請閉眼');assert.equal(await p.locator('.role-name').allTextContents().then(es=>es.filter(x=>x==='隱狼').length),0);await p.locator('#next').click();assert.equal(await p.locator('#next').isEnabled(),false);
 results.push({board,noSetupRegistration:true,pendingWolfTarget:true,mandatoryChoice:true,refresh:true,reselect:true,rollback:true});await context.close();
}assert.deepEqual(errors,[]);await mkdir(new URL('../../qa-artifacts/hidden-registration/',import.meta.url),{recursive:true});await writeFile(new URL('../../qa-artifacts/hidden-registration/targeted.json',import.meta.url),JSON.stringify({results,errors},null,2));console.log(JSON.stringify({results,errors}));}finally{await browser.close();server.kill();}
