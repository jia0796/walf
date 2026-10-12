import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {availableBoards} from '../public/data.js';
const {chromium}=await import(process.env.COUNCIL_PLAYWRIGHT_MODULE||'playwright');
const output=new URL('../../qa-rules51-stress/',import.meta.url);await mkdir(output,{recursive:true});
const server=spawn(process.execPath,['server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:'5351'},stdio:['ignore','pipe','pipe']});
await new Promise((r,j)=>{server.stdout.once('data',r);server.once('error',j);});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],results=[];
try{
for(const viewport of [{width:320,height:568},{width:390,height:844},{width:844,height:390},{width:768,height:1024},{width:1024,height:768}]){
 const c=await browser.newContext({viewport}),p=await c.newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto('http://127.0.0.1:5351/');await p.locator('#start').click();await p.locator('[data-count="12"]').click();
 assert.deepEqual(await p.locator('#boardChoices button').evaluateAll(es=>es.map(e=>e.dataset.board)),availableBoards(12,'normal').map(b=>b.id));
 for(let i=0;i<40;i++){
  await p.locator('[data-board="'+availableBoards(12,'normal')[i%availableBoards(12,'normal').length].id+'"]').click();
  assert.equal(await p.locator('#boardDetails,#boardRulesText').count(),0);
  assert.deepEqual(await p.locator('#setup details > summary').allTextContents(),['特殊房規','夜間順序']);
  await p.locator('#setup .rules-form > summary').click();await p.locator('#ruleSheriff').selectOption(i%2?'true':'false');await p.locator('#setup .night-order > summary').click();
  await p.locator('.setup-content').evaluate(e=>{e.style.fontSize='150%';e.scrollTop=e.scrollHeight;});
  const geometry=await p.evaluate(()=>{const a=document.querySelector('#setup .actions'),b=document.querySelector('#setupStart').getBoundingClientRect();return {width:document.documentElement.scrollWidth,top:b.top,bottom:b.bottom,height:innerHeight,background:getComputedStyle(a).backgroundImage,color:getComputedStyle(a).backgroundColor,border:getComputedStyle(a).borderTopWidth};});
  assert.ok(geometry.width<=viewport.width+1);assert.ok(geometry.top>=0&&geometry.bottom<=geometry.height+1);assert.equal(geometry.background,'none');assert.equal(geometry.color,'rgba(0, 0, 0, 0)');assert.equal(geometry.border,'0px');
  assert.equal(await p.evaluate(()=>localStorage.getItem('eclipse-host-v1')),null);
  if(i===39)await p.screenshot({path:new URL('preview-'+viewport.width+'x'+viewport.height+'.png',output).pathname.slice(1)});
  await p.locator('#setupBack').click();
 }
 results.push({viewport,cycles:40,fontScale:1.5,detailsRemoved:true,settings:true,footerVisible:true,noGameCreated:true});await c.close();
}
assert.deepEqual(errors,[]);await writeFile(new URL('results.json',output),JSON.stringify({cycles:200,results,errors},null,2));console.log(JSON.stringify({cycles:200,viewports:results.length,errors}));
}finally{await browser.close();server.kill();}
