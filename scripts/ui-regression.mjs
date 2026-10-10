import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {BOARDS,ROLE_DATA,CATALOG_ART} from '../public/data.js';
const {chromium}=await import(process.env.COUNCIL_PLAYWRIGHT_MODULE||'playwright');
const output=new URL('../../qa-artifacts/',import.meta.url);await mkdir(output,{recursive:true});
const port=5294,base='http://127.0.0.1:'+port+'/';
const server=spawn(process.execPath,['server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error('Server exit '+code)));});
const browser=await chromium.launch({channel:'msedge',headless:true});
const results=[],errors=[];
async function begin(board,viewport={width:390,height:844},sheriff=false){
 const context=await browser.newContext({viewport}),page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(base);await page.getByRole('button',{name:'開始主持',exact:true}).click();await page.locator('[data-count="'+BOARDS[board].playerCount+'"]').click();if(BOARDS[board].category==='awakened')await page.locator('#boardsAwakened').click();await page.locator('[data-board="'+board+'"]').click();
 await page.locator('#setupBack').click();assert.equal(await page.locator(BOARDS[board].category==='awakened'?'#boardsAwakened':'#boardsNormal').getAttribute('aria-pressed'),'true');await page.locator('[data-board="'+board+'"]').click();
 await page.locator('#setup .rules-form summary').click();await page.locator('#ruleSheriff').selectOption(String(sheriff));await page.locator('#setupStart').click();
 const assigned={};let id=1;for(const [r,n]of Object.entries(BOARDS[board].roles)){assigned[r]=Array.from({length:n},()=>id++);}
 return {context,page,assigned};
}
const identity={'魔術師請睜眼':'magician','女巫請睜眼':'witch','預言家請睜眼':'seer','獵人請睜眼':'hunter','守衛請睜眼':'guard','機械狼請睜眼':'mechanical','通靈師請舉手':'medium','黑市商人請睜眼':'merchant','夢魘請睜眼':'nightmare','攝夢人請睜眼':'dream','獵魔人請睜眼':'demon','白痴請睜眼':'idiot','混血兒請睜眼':'mixed','守墓人請睜眼':'gravekeeper'};
const seat=(p,id)=>p.locator('.seat[aria-label^="'+id+'號 "]');
async function runBoard(board,{flip=false}={}){
 const {context,page,assigned}=await begin(board);let actions=0,refresh=false,flipped=false;
 try{
  for(let i=0;i<330;i++){
   if(await page.locator('#finished').isVisible())break;
   const sub=await page.locator('#subtitle').textContent(),next=page.locator('#next'),dayText=await page.locator('#phase').textContent(),day=Number(dayText.match(/第(\d+)/)?.[1]||1);
   if(!await next.isEnabled()){
    if(sub==='狼人請睜眼，確認彼此身分'){for(const id of [...(assigned.king||[]),...(assigned.blood||[]),...(assigned.gargoyle||[]),...(assigned.nightmare||[]),...assigned.wolf]){if(await seat(page,id).isEnabled())await seat(page,id).click();}}
    else if(sub==='狼兄狼弟請睜眼，請確認彼此身分'){for(const id of [...assigned.elder,...assigned.younger])await seat(page,id).click();}
    else if(identity[sub]){await seat(page,assigned[identity[sub]][0]).click();}
    else if(sub==='請選擇你要轉化的玩家'){await seat(page,assigned.villager.at(-1)).click();}
    else if(sub==='選擇你今晚要交換的對象')await page.getByRole('button',{name:'不交換',exact:true}).click();
    else if(sub==='選擇你今晚要夢遊的對象'){await seat(page,assigned.villager[(day-1)%assigned.villager.length]).click();}
    else if(sub==='選擇你要跟隨的榜樣'){await seat(page,assigned.wolf[0]).click();}
    else if(sub==='請選擇今晚要擊殺的玩家'||sub==='選擇你們今晚要襲擊的對象'||sub==='選擇你要復仇的對象'){await page.getByRole('button',{name:'空刀',exact:true}).click();}
    else if(sub==='今晚你要守護的對象是？')await page.getByRole('button',{name:'空守',exact:true}).click();
    else if(sub==='選擇你今晚要恐懼的對象')await page.getByRole('button',{name:'空恐',exact:true}).click();
    else if(sub==='請選擇今晚要狩獵的玩家')await page.getByRole('button',{name:'不使用',exact:true}).click();
    else if(sub==='今晚他死了，你要使用解藥嗎？')await page.getByRole('button',{name:'不使用解藥',exact:true}).click();
    else if(sub==='你要使用毒藥嗎?你要毒誰呢?')await page.getByRole('button',{name:'不用毒藥',exact:true}).click();
    else if(sub==='選擇你今晚要查驗的對象'){const ids=assigned.villager||[];for(const id of ids)if(await seat(page,id).isEnabled()){await seat(page,id).click();break;}}
    else if(sub==='選擇你要交易的對象')await page.getByRole('button',{name:'延後交易',exact:true}).click();
    else if(await page.getByRole('button',{name:'暫不學習',exact:true}).isVisible())await page.getByRole('button',{name:'暫不學習',exact:true}).click();
    else if(await page.getByRole('button',{name:'抽籤',exact:true}).isVisible()){await page.getByRole('button',{name:'抽籤',exact:true}).click();if(await page.locator('#drawSkip').isVisible())await page.locator('#drawSkip').click();await page.locator('#drawClose').click();}
    else if(sub==='3、2、1  請投票'){
     let target=null;if(flip&&!flipped){target=assigned.idiot[0];flipped=true;}else{
      for(const id of [...assigned.wolf,...(assigned.elder||[]),...(assigned.younger||[]),...(assigned.king||[]),...(assigned.nightmare||[]),...(assigned.mechanical||[]),...(assigned.blood||[]),...(assigned.gargoyle||[]),...(assigned.gargoyle?[assigned.villager.at(-1)]:[])])if(await seat(page,id).isEnabled()){target=id;break;}}
     assert.ok(target,'no legal exile target '+board);await seat(page,target).click();
    }else if((await page.locator('#hint').textContent()).startsWith('最後一刀')){await seat(page,assigned.villager[0]).click();}
    else if(await page.getByRole('button',{name:'不發動技能',exact:true}).isVisible())await page.getByRole('button',{name:'不發動技能',exact:true}).click();
    else throw Error(board+' blocked UI: '+sub+' / '+await page.locator('#hint').textContent());
   }
   assert.equal(await next.isEnabled(),true,board+' next disabled '+sub);await next.click();actions++;
   if(actions===18){const before=await page.locator('#subtitle').textContent();await page.reload();assert.equal(await page.locator('#subtitle').textContent(),before);refresh=true;}
   if(actions===22){const after=await page.locator('#subtitle').textContent();await page.locator('#back').click();await page.locator('#next').click();assert.equal(await page.locator('#subtitle').textContent(),after);}
  }
  assert.equal(await page.locator('#finished').isVisible(),true,'UI did not finish '+board);assert.ok(refresh);
  assert.match(await page.locator('#winnerTitle').textContent(),/獲勝/);
  if(board.startsWith('gargoyle')){await page.locator('#identityReview summary').click();assert.equal(await page.locator('.identity-card').count(),BOARDS[board].playerCount);assert.ok((await page.locator('#identityCards').innerText()).includes('轉化者（民）'));assert.ok(!(await page.locator('#identityCards').innerText()).includes('已接刀'));await page.locator('#identityReview summary').click();}
  if(board.startsWith('blood'))assert.equal(await page.locator('#nightRecap > .event-card').count(),1);
  await page.screenshot({path:new URL('council-'+board+'-finished.png',output).pathname.slice(1)});
  const measures=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,buttons:document.querySelector('.finish-actions').getBoundingClientRect().top,recap:document.querySelector('#nightRecap').getBoundingClientRect().bottom}));
  assert.ok(measures.scrollWidth<=measures.width+1);assert.ok(measures.recap<=measures.buttons);
  await page.getByRole('button',{name:'重新一局',exact:true}).click();await page.locator('#finishConfirm').click();assert.equal(await page.locator('#subtitle').textContent(),'請確認角色身分');assert.equal(await page.locator('.role-name').allTextContents().then(a=>a.every(t=>t==='未辨識'||t==='未使用')),true);
  const result={board,passed:true,actions,refresh,rollback:true,restart:true,measures};results.push(result);console.log(JSON.stringify(result));
 }finally{await context.close();}
}
async function auditLibrary(){
 const ctx=await browser.newContext({viewport:{width:320,height:568},hasTouch:true}),p=await ctx.newPage();await p.goto(base);await p.locator('#encyclopediaOpen').tap();
 let checked=0;for(const camp of ['#libraryWolves','#libraryGood']){await p.locator(camp).tap();const buttons=p.locator('#roleLibrary .role-card'),n=await buttons.count();for(let i=0;i<n;i++){
  const b=buttons.nth(i);assert.ok((await b.locator('span').textContent()).trim());const first=await b.evaluate(e=>({border:getComputedStyle(e).borderStyle,grid:getComputedStyle(e.parentElement).gridTemplateColumns}));assert.equal(first.border,'solid');assert.equal(first.grid.split(' ').length,3);await b.tap();
  assert.equal(await p.locator('#previewCard').getAttribute('aria-pressed'),'false');if(i===0){for(let k=0;k<3;k++){await p.keyboard.press('Tab');if(await p.evaluate(()=>document.activeElement.id)==='previewCard')break;}assert.equal(await p.evaluate(()=>document.activeElement.id),'previewCard');assert.notEqual(await p.locator('#previewCard').evaluate(e=>getComputedStyle(e).outlineStyle),'none');}if(i===0){await p.locator('#previewCard').tap();await p.waitForTimeout(500);await p.locator('#previewCard').tap();await p.waitForTimeout(500);}assert.equal(await p.locator('#previewCard').evaluate(e=>getComputedStyle(e).outlineStyle),'none');await p.locator('#previewCard').tap();await p.waitForTimeout(500);assert.equal(await p.locator('#previewCard').getAttribute('aria-pressed'),'true');const layout=await p.locator('.description-row').first().evaluate(e=>({display:getComputedStyle(e).display,left:e.children[1].getBoundingClientRect().left,label:e.children[0].getBoundingClientRect().left,width:e.scrollWidth,client:e.clientWidth}));assert.equal(layout.display,'grid');assert.ok(layout.left>layout.label&&layout.width<=layout.client+1);
  await p.locator('#previewCard').tap();await p.waitForTimeout(500);await p.mouse.click(3,3);await b.tap();assert.equal(await p.locator('#previewCard').getAttribute('aria-pressed'),'false');await p.mouse.click(3,3);checked++;
 }}results.push({library:checked,glass:true,descriptionGrid:true,touchOutline:true});await ctx.close();
 const {context,page}=await begin('brothers12');const before=await page.locator('#subtitle').textContent();await page.locator('#hostLibrary').click();for(const camp of ['#libraryWolves','#libraryGood']){await page.locator(camp).click();const cards=page.locator('.role-card');for(let i=0;i<await cards.count();i++){await cards.nth(i).click();assert.equal(await page.locator('#previewCard').evaluate(e=>getComputedStyle(e).outlineStyle),'none');await page.locator('#previewCard').click();await page.locator('#previewCard').click();await page.mouse.click(3,3);}}await page.locator('#libraryReturn').click();assert.equal(await page.locator('#subtitle').textContent(),before);results.push({hostLibrary:true,preserved:true});await context.close();
}
async function auditCandidates(){
 const {context,page,assigned}=await begin('12',{width:390,height:844},true);
 for(let i=0;i<45;i++){const sub=await page.locator('#subtitle').textContent();if(sub==='現在開始競選警長，候選人請起立')break;if(!await page.locator('#next').isEnabled()){if(sub==='狼人請睜眼，確認彼此身分'){for(const id of [...assigned.king,...assigned.wolf])await seat(page,id).click();}else if(identity[sub])await seat(page,assigned[identity[sub]][0]).click();else if(sub==='選擇你今晚要交換的對象')await page.getByRole('button',{name:'不交換',exact:true}).click();else if(sub==='選擇你們今晚要襲擊的對象')await page.getByRole('button',{name:'空刀',exact:true}).click();else if(sub==='今晚他死了，你要使用解藥嗎？')await page.getByRole('button',{name:'不使用解藥',exact:true}).click();else if(sub==='你要使用毒藥嗎?你要毒誰呢?')await page.getByRole('button',{name:'不用毒藥',exact:true}).click();else if(sub==='選擇你今晚要查驗的對象')await seat(page,assigned.villager[0]).click();else throw Error('candidate setup '+sub);}await page.locator('#next').click();}
 await seat(page,1).click();await seat(page,2).click();assert.equal(await page.locator('.seat.candidate').count(),2);assert.equal(await seat(page,1).evaluate(e=>getComputedStyle(e).borderTopColor),'rgb(67, 157, 255)');await seat(page,1).click();assert.equal(await page.locator('.seat.candidate').count(),1);await page.reload();assert.equal(await page.locator('.seat.candidate').count(),1);await page.locator('#next').click();await page.locator('#back').click();assert.equal(await page.locator('.seat.candidate').count(),1);await page.locator('#next').click();for(let i=0;i<8&&await page.locator('.seat.candidate').count();i++)await page.locator('#next').click();assert.equal(await page.locator('.seat.candidate').count(),0);results.push({candidateBlue:true,cancel:true,refresh:true,rollback:true,electionClear:true});await context.close();
}

try{
 await auditLibrary();await auditCandidates();
 const ctx=await browser.newContext({viewport:{width:390,height:844}}),p=await ctx.newPage();await p.goto(base);await p.screenshot({path:new URL('council-home-phone.png',output).pathname.slice(1)});
 await p.getByRole('button',{name:'開始主持',exact:true}).click();await p.locator('[data-count="12"]').click();assert.equal(await p.locator('#boardChoices button').count(),9);assert.equal(await p.locator('#boardChoices button').allTextContents().then(a=>a.every(t=>!t.includes('12人'))),true);
 await p.screenshot({path:new URL('council-board-list.png',output).pathname.slice(1)});await ctx.close();
 for(const board of (process.env.UI_BOARDS?process.env.UI_BOARDS.split(','):Object.keys(BOARDS)))await runBoard(board,{flip:board==='classicMixed12'});

 for(const viewport of [{width:320,height:568},{width:768,height:1024},{width:1024,height:768},{width:1180,height:600}]){
  const {context,page,assigned}=await begin('kingGuard12',viewport);
  await page.locator('#next').click();await page.locator('#next').click();await seat(page,assigned.guard[0]).click();await seat(page,assigned.guard[0]).click();assert.equal(await page.locator('#next').isEnabled(),false);assert.equal(await seat(page,assigned.guard[0]).getAttribute('aria-pressed'),'false');
  await seat(page,assigned.guard[0]).click();await page.locator('#next').click();await seat(page,assigned.guard[0]).click();await page.locator('#next').click();await page.locator('#next').click();
  for(const id of [...assigned.king,...assigned.wolf])await seat(page,id).click();await page.locator('#next').click();await seat(page,assigned.seer[0]).click();await page.locator('#next').click();await seat(page,assigned.witch[0]).click();await page.locator('#next').click();await page.getByRole('button',{name:'使用解藥',exact:true}).click();await page.locator('#next').click();assert.equal(await page.getByRole('button',{name:'使用毒藥',exact:true}).isEnabled(),false);
  const geometry=await page.evaluate(()=>({viewport:[innerWidth,innerHeight],pageWidth:document.documentElement.scrollWidth,footer:document.querySelector('#host footer').getBoundingClientRect().top,seats:Array.from(document.querySelectorAll('.seat')).map(e=>e.getBoundingClientRect().bottom),portraits:document.querySelectorAll('#host img[src*="/catalog/"]').length}));
  assert.ok(geometry.pageWidth<=viewport.width+1);assert.ok(Math.max(...geometry.seats)<=geometry.footer+1);assert.equal(geometry.portraits,0);await page.screenshot({path:new URL('council-host-'+viewport.width+'x'+viewport.height+'.png',output).pathname.slice(1)});results.push({responsive:viewport,medicine:true,cancel:true,geometry});await context.close();
 }
 const assetCtx=await browser.newContext({viewport:{width:1400,height:1600}}),a=await assetCtx.newPage();await a.goto(base);await a.setContent('<body style="background:#142132;display:grid;grid-template-columns:repeat(6,1fr);gap:8px">'+Object.entries(CATALOG_ART).map(([id,art])=>'<figure style="margin:0;color:white"><img style="width:100%" src="'+base+art.image+'"><figcaption>'+id+'</figcaption></figure>').join('')+'</body>');
 await a.waitForFunction(()=>Array.from(document.images).length===18&&Array.from(document.images).every(i=>i.complete&&i.naturalWidth===1060),{timeout:30000});await a.screenshot({path:new URL('council-18-art.png',output).pathname.slice(1)});results.push({assets:18,loaded:true});await assetCtx.close();
 const offline=await browser.newContext({viewport:{width:390,height:844}}),o=await offline.newPage();await o.goto(base);await o.waitForFunction(()=>navigator.serviceWorker.controller!==null);await o.evaluate(()=>navigator.serviceWorker.ready);const assetPaths=['art/catalog/gargoyle.png','art/catalog/gravekeeper.png',...['home','counts','boards','setup','host'].map(k=>'art/backgrounds/'+k+'.webp'),...Object.values(CATALOG_ART).map(a=>a.image),...['wolf-attack','antidote','poison','shield','inspect','swap','gun','learn','trade','fear','sleep','role-model','hunt','transform','gravekeeper'].map(s=>'skills/icon-'+s+'.svg')];
 await offline.setOffline(true);await o.reload();assert.equal(await o.title(),'月下議會｜狼人殺主持工具');await o.getByRole('button',{name:'開始主持',exact:true}).click();await o.locator('[data-count="10"]').click();assert.equal(await o.locator('#boardChoices button').count(),6);const fetched=await o.evaluate(async paths=>Promise.all(paths.map(async path=>({path,status:(await fetch(path)).status}))),assetPaths);assert.ok(fetched.every(x=>x.status===200));results.push({offline:true,assets:fetched.length});await offline.close();
 assert.deepEqual(errors,[]);await writeFile(new URL('council-ui-results.json',output),JSON.stringify({results,errors},null,2));
}catch(e){await writeFile(new URL('council-ui-failure.json',output),JSON.stringify({results,error:String(e),errors},null,2));throw e;}
finally{await browser.close();server.kill();}
