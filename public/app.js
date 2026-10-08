import { createGame, ROLES, subtitle, canNext, selectable, selectSeat, choose, next, previous, potionBlocked, inspection, mapTarget } from './engine.js';
const $=id=>document.getElementById(id);
const KEY='eclipse-host-v1';
let game=createGame(), storageOK=true;
try {const saved=JSON.parse(localStorage.getItem(KEY));if(saved?.version===1 && saved.players?.length===12 && Array.isArray(saved.history))game=saved;} catch {storageOK=false;}
const labels={confirm:'開局確認',dark:'夜晚開始',magician:'魔術師身分',exchange:'魔術師交換',magicianClose:'魔術師閉眼',wolves:'狼人身分',attack:'狼人襲擊',witch:'女巫身分',antidote:'女巫解藥',poison:'女巫毒藥',witchClose:'女巫閉眼',seer:'預言家身分',inspect:'預言家查驗',seerClose:'查驗結果',hunter:'獵人身分',gesture:'獵人手勢',hunterClose:'獵人閉眼',dawn:'夜間紀錄',candidates:'警長競選',draw:'發言抽籤',speeches:'政見發言 / 點座位退水',withdraw:'退水確認',sheriffVote:'警長投票',sheriffPK:'警長平票發言',sheriffRevote:'警長再次投票',sheriffResult:'警長結果',announcement:'夜間死亡公布',direction:'白天發言方向',discussion:'白天發言 / 計時器',voteIntro:'放逐投票準備',exileVote:'放逐投票',exilePK:'放逐平票發言 / 計時器',exileRevote:'放逐再次投票',lastWords:'遺言',skill:'角色技能',nextNight:'進入下一晚',finished:'對局結束'};
function persist(){try{localStorage.setItem(KEY,JSON.stringify(game));storageOK=true;}catch{storageOK=false;}}
function action(label,value,disabled=false){const b=document.createElement('button');b.textContent=label;b.disabled=disabled;b.onclick=()=>{choose(game,value);render();};$('actions').append(b);}
function hintText(){
 const s=game.step,n=game.nightAction;
 if(game.winner)return `${game.winner}獲勝。死亡後先判勝負，已結束則不再發動技能。`;
 if(['magician','witch','seer','hunter','wolves'].includes(s)){
   if(game.rolesConfirmed)return '身分已記錄；本晚不再認角色。已出局角色的操作會鎖定。';
   if(s==='wolves')return `依序點黑狼王 → 三位狼人（${game.action.length}/4），可點已選座位取消。`;
   return '點選角色本人；再次點選可取消。已標記其他身分的座位不可重複使用。';
 }
 if(s==='exchange')return '點選兩名不同存活玩家（可包含自己），或按「不交換」。';
 if(s==='attack')return '點選一名存活玩家（可自刀），或按「空刀」。';
 if(s==='inspect')return '點選一名存活玩家，結果僅以手勢圖示顯示。';
 if(s==='seerClose')return `查驗手勢：${inspection(game) || '預言家已出局'}（僅法官看）`;
 if(s==='antidote')return `原始狼刀：${n.attack?n.attack+'號':'空刀'}。${potionBlocked(game,'antidote') || '選擇使用或不使用解藥。'} 台詞仍完整照念。`;
 if(s==='poison')return potionBlocked(game,'poison') || '選擇不用毒藥，或使用毒藥後點選一名存活目標。';
 if(s==='gesture')return `獵人手勢：${n.poison && mapTarget(game,n.poisonTarget)===game.players.find(p=>p.role==='hunter')?.id?'不可開槍（被毒）':'未被毒；死亡時仍須先檢查勝負'}。`;
 if(s==='dawn')return '未標記座位已補為平民。首夜先進警長競選；死亡在公布頁按下一步時成立。';
 if(s==='candidates')return '點選所有上警玩家，再按下一步；無人上警請明確按「無人上警」。';
 if(s==='draw')return '抽出1～12號與順／逆時針；按下一步進入整段政見發言。';
 if(['speeches','withdraw'].includes(s))return '點選候選座位退水；剩0人無警長、1人直接當選，其餘進投票。';
 if(['sheriffVote','exileVote','sheriffRevote','exileRevote'].includes(s))return game.choice==='tie'?(s.endsWith('Revote')?'再次平票：警長流警徽／放逐無人出局。':'點選至少兩名平票玩家，再按下一步。'):'直接點選結果，不記個別票型；平票請按「平票」。';
 if(s==='sheriffResult')return game.sheriff?`警長：${game.sheriff}號`:'無警長；此分支尚無定稿字幕。';
 if(s==='announcement')return '按下一步確認死亡公布，此後不能用上一步取消死亡。首夜有遺言；次夜起無遺言。';
 if(s==='direction')return game.sheriff?`警長：${game.sheriff}號。選擇警左或警右。`:'目前無警長，法官選擇發言方向。';
 if(s==='skill')return '點選一名存活玩家，或按「不發動技能」。尚未選擇不能前進。';
 if(['discussion','exilePK','nextNight'].includes(s))return '此頁沒有新增主持台詞。法官可使用計時器，完成後按下一步。';
 return '照字幕主持，完成後按下一步。';
}
function render(){
 persist(); const s=game.step,n=game.nightAction;
 $('phase').textContent=`第 ${game.night} 晚 · ${labels[s]}`;
 $('potions').textContent=`解藥 ${game.potions.antidote?'●':'○'} / 毒藥 ${game.potions.poison?'●':'○'}`;
 $('stepLabel').textContent=labels[s];$('subtitle').textContent=subtitle(game);$('hint').textContent=hintText();
 $('selection').textContent=game.action.length?'已選：'+game.action.map(id=>id+'號').join('、'):game.choice==='skip'?'已選擇不使用／不發動':game.draw && ['draw','speeches'].includes(s)?`抽籤：${game.draw.seat}號 · ${game.draw.clockwise?'順':'逆'}時針`:'';
 $('actions').replaceChildren();
 if(s==='exchange')action('不交換','skip');if(s==='attack')action('空刀','skip');if(s==='skill')action('不發動技能','skip');
 if(['antidote','poison'].includes(s)){const blocked=!!potionBlocked(game,s);action(s==='antidote'?'使用解藥':'使用毒藥','use',blocked);action(s==='antidote'?'不使用解藥':'不用毒藥','skip',blocked);}
 if(s==='candidates')action('無人上警','none');if(s==='draw')action('抽籤','draw');
 if(s==='direction'){action('警左','left');action('警右','right');$('selection').textContent=game.direction?`已選：${game.direction==='left'?'警左':'警右'}`:'';}
 if(['sheriffVote','sheriffRevote','exileVote','exileRevote'].includes(s))action('平票','tie');
 for(const [container,offset] of [['left',0],['right',6]]){
   $(container).replaceChildren();
   game.players.slice(offset,offset+6).forEach(p=>{
     const b=document.createElement('button');
     const selected=game.action.includes(p.id) || (s==='candidates' && game.candidates.includes(p.id));
     b.className=`seat${selected?' selected':''}${p.role?' known':''}${p.alive?'':' dead'}`;
     b.disabled=!selectable(game,p.id);b.setAttribute('aria-pressed',String(selected));
     b.setAttribute('aria-label',`${p.id}號 ${ROLES[p.role]||'未標記'} ${p.alive?'存活':'出局'}${game.sheriff===p.id?' 警長':''}`);
     const avatar=document.createElement('span');avatar.className='avatar';avatar.textContent=p.id;
     const info=document.createElement('span'),number=document.createElement('strong'),role=document.createElement('small');
     number.textContent=p.id+'號';role.textContent=(ROLES[p.role]||'未標記')+(game.sheriff===p.id?' ♛':'')+(!p.alive?' †':'');info.append(number,role);b.append(avatar,info);
     b.onclick=()=>{selectSeat(game,p.id);render();};$(container).append(b);
   });
 }
 $('next').disabled=!canNext(game);$('back').disabled=game.history.length===0;
 $('saveStatus').textContent=storageOK?'本機自動保存 · 上一步可修正尚未公布的操作':'無法保存本機紀錄，關閉頁面後資料可能遺失';
 $('records').textContent=JSON.stringify({night:game.night,actions:game.nightAction,candidates:game.candidates,sheriff:game.sheriff,deaths:game.log},null,2);
}
let timerSeconds=60,deadline=null,interval=null;
function timerPaint(){
 if(deadline!==null)timerSeconds=Math.max(0,Math.ceil((deadline-Date.now())/1000));
 $('countdown').textContent=`${String(Math.floor(timerSeconds/60)).padStart(2,'0')}:${String(timerSeconds%60).padStart(2,'0')}`;
 if(timerSeconds===0 && deadline!==null){timerStop();$('timerNotice').textContent='時間到';}
}
function timerStop(){deadline=null;clearInterval(interval);interval=null;}
$('timerOpen').onclick=()=>{$('timerDialog').showModal();timerPaint();};$('timerClose').onclick=()=>{$('timerDialog').close();};
$('timerStart').onclick=()=>{if(deadline!==null)return;if(!timerSeconds)timerSeconds=Number($('duration').value)||60;deadline=Date.now()+timerSeconds*1000;interval=setInterval(timerPaint,250);$('timerNotice').textContent='';timerPaint();};
$('timerPause').onclick=()=>{timerPaint();timerStop();};
$('timerReset').onclick=()=>{timerStop();timerSeconds=Math.min(3600,Math.max(10,Number($('duration').value)||60));$('duration').value=timerSeconds;$('timerNotice').textContent='';timerPaint();};
$('duration').onchange=()=>$('timerReset').click();
$('duration').oninput=()=>{timerStop();timerSeconds=Math.min(3600,Math.max(10,Number($('duration').value)||60));$('timerNotice').textContent='';timerPaint();};
$('next').onclick=()=>{const before=game.step;if(next(game)){render();if(['speeches','discussion','sheriffPK','exilePK'].includes(game.step) && before!==game.step)$('timerOpen').click();}};
$('back').onclick=()=>{previous(game);render();};$('reset').onclick=()=>$('resetDialog').showModal();$('resetCancel').onclick=()=>$('resetDialog').close();
$('resetConfirm').onclick=()=>{game=createGame();timerStop();timerSeconds=60;$('duration').value=60;timerPaint();$('resetDialog').close();render();};
render();
