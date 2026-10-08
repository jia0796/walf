import { createGame, upgradeGame, ROLES, subtitle, canNext, selectable, selectSeat, choose, next, previous, potionBlocked, inspection, mapTarget } from './engine.js';
const $=id=>document.getElementById(id);
const KEY='eclipse-host-v1';
let game=createGame(), storageOK=true;
try {const saved=JSON.parse(localStorage.getItem(KEY));if(saved)game=upgradeGame(saved);} catch {storageOK=false;}
const labels={confirm:'開局確認',dark:'夜晚開始',magician:'魔術師身分',exchange:'魔術師交換',magicianClose:'魔術師閉眼',wolves:'狼人身分',attack:'狼人襲擊',witch:'女巫身分',antidote:'女巫解藥',poison:'女巫毒藥',witchClose:'女巫閉眼',seer:'預言家身分',inspect:'預言家查驗',seerClose:'查驗結果',hunter:'獵人身分',gesture:'獵人手勢',hunterClose:'獵人閉眼',dawn:'夜間紀錄',candidates:'警長競選',draw:'發言抽籤',speeches:'政見發言 / 點座位退水',withdraw:'退水確認',sheriffVote:'警長投票',sheriffPK:'警長平票發言',sheriffRevote:'警長再次投票',sheriffResult:'警長結果',announcement:'夜間死亡公布',direction:'白天發言方向',discussion:'白天發言 / 計時器',voteIntro:'放逐投票準備',exileVote:'放逐投票',exilePK:'放逐平票發言 / 計時器',exileRevote:'放逐再次投票',lastWords:'遺言',skill:'角色技能',nextNight:'進入下一晚',finished:'對局結束'};
Object.assign(labels,{eliminated:'淘汰 / 沒有遺言',badgeTransfer:'警徽落處',dayDraw:'無警徽 / 發言順序抽籤'});
function persist(){try{localStorage.setItem(KEY,JSON.stringify(game));storageOK=true;}catch{storageOK=false;}}
function action(label,value,disabled=false){const b=document.createElement('button');b.textContent=label;b.disabled=disabled;b.onclick=()=>{if(value==='draw'){startDraw();return;}choose(game,value);render();};$('actions').append(b);}
function hintText(){
 const s=game.step,n=game.nightAction;
 if(s==='finished')return `${game.winner}獲勝。`;
 if(['magician','witch','seer','hunter','wolves'].includes(s)){
   if(game.rolesConfirmed)return '身分已記錄；本晚不再認角色。已出局角色的操作會鎖定。';
   if(s==='wolves')return `依序點黑狼王 → 三位狼人（${game.action.length}/4），可點已選座位取消。`;
   return '點選角色本人；再次點選可取消。';
 }
 if(s==='exchange')return '點選兩名不同存活玩家（可包含自己），或按「不交換」。';
 if(s==='attack')return '點選一名存活玩家（可自刀），或按「空刀」。';
 if(s==='inspect')return '點選一名存活玩家，結果僅以手勢圖示顯示。';
 if(s==='seerClose')return inspection(game)?'查驗手勢（僅法官看）':'預言家已出局。';
 if(s==='antidote')return `原始狼刀：${n.attack?n.attack+'號':'空刀'}。${potionBlocked(game,'antidote') || '選擇使用或不使用解藥。'}`;
 if(s==='poison')return potionBlocked(game,'poison') || '選擇不用毒藥，或使用毒藥後點選一名存活目標。';
 if(s==='gesture')return `獵人手勢：${n.poison && mapTarget(game,n.poisonTarget)===game.players.find(p=>p.role==='hunter')?.id?'不可開槍（被毒）':'未被毒'}。`;
 if(s==='dawn')return '未標記座位已補為平民。首夜先進警長競選；死亡在公布頁按下一步時成立。';
 if(s==='candidates')return '點選所有上警玩家，再按下一步；無人上警請明確按「無人上警」。';
 if(s==='draw')return '只從目前仍上警的玩家抽起始號碼與順／逆時針；動畫中點一下可直接看結果。';
 if(s==='dayDraw')return game.deaths.length?'以昨晚死者為基準抽左／右方向，從最近的存活玩家開始；動畫中點一下可直接看結果。':'平安夜：從存活玩家抽起始號碼與順／逆時針；動畫中點一下可直接看結果。';
 if(['speeches','withdraw'].includes(s))return '點上警座位退水；再次點可恢復上警。剩0人無警長、1人直接當選，其餘進投票。';
 if(['sheriffVote','exileVote','sheriffRevote','exileRevote'].includes(s))return game.choice==='tie'?(s.endsWith('Revote')?'再次平票：警長流警徽／放逐無人出局。':'點選至少兩名平票玩家，再按下一步。'):'直接點選結果，不記個別票型；平票請按「平票」。';
 if(s==='sheriffResult')return game.sheriff?`警長：${game.sheriff}號`:'無警長；此分支尚無定稿字幕。';
 if(s==='announcement')return '按下一步確認死亡公布。可回看字幕，但已公布的死亡不會被取消。';
 if(s==='direction')return '照字幕主持，完成後按下一步。';
 if(s==='badgeTransfer')return '點選一名仍存活的玩家，或選擇「撕警徽／不移交」。';
 if(s==='eliminated' || s==='lastWords')return '完成這段主持後按下一步，繼續死亡與角色技能流程。';
 if(s==='skill')return '點選一名存活玩家，或按「不發動技能」。尚未選擇不能前進。';
 if(['discussion','exilePK','nextNight'].includes(s))return '此頁沒有新增主持台詞。法官可使用計時器，完成後按下一步。';
 return '照字幕主持，完成後按下一步。';
}
function renderGesture(){
 $('gestureResult').replaceChildren();
 const result=game.step==='seerClose'?inspection(game):'';if(!result)return;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 32 32');svg.setAttribute('role','img');
 svg.setAttribute('aria-label',result==='up'?'好人手勢：讚':'狼人手勢：倒讚');svg.classList.add('thumb-icon',result);
 const path=document.createElementNS('http://www.w3.org/2000/svg','path');
 path.setAttribute('d','M5 14h5v14H5z M10 15l6-7V4c4 0 5 3 4 7l-1 3h6c2 0 3 2 2 4l-2 8c0 1-1 2-3 2H10z');
 svg.append(path);$('gestureResult').append(svg);
}
function render(){
 persist(); const s=game.step,n=game.nightAction;
 $('phase').textContent=`第 ${game.night} 晚 · ${labels[s]}`;
 $('potions').textContent=`解藥 ${game.potions.antidote?'●':'○'} / 毒藥 ${game.potions.poison?'●':'○'}`;
 $('stepLabel').textContent=labels[s];$('subtitle').textContent=subtitle(game);$('hint').textContent=hintText();
 renderGesture();
 $('selection').textContent=game.action.length?'已選：'+game.action.map(id=>id+'號').join('、'):game.choice==='skip'?'已選擇不使用／不發動':game.draw?.revealed && ['draw','dayDraw','speeches'].includes(s)?`起始玩家：${game.draw.seat}號 · ${game.draw.clockwise?'順':'逆'}時針`:'';
 if(s==='discussion' && !game.sheriff && game.draw?.revealed)$('selection').textContent='發言順序：'+game.draw.order.map(id=>id+'號').join(' → ');
 $('actions').replaceChildren();
 if(s==='exchange')action('不交換','skip');if(s==='attack')action('空刀','skip');if(s==='skill')action('不發動技能','skip');
 if(['antidote','poison'].includes(s)){const blocked=!!potionBlocked(game,s);action(s==='antidote'?'使用解藥':'使用毒藥','use',blocked);action(s==='antidote'?'不使用解藥':'不用毒藥','skip',blocked);}
 if(s==='candidates')action('無人上警','none');if(['draw','dayDraw'].includes(s))action(game.draw?.revealed?'查看抽籤結果':'抽籤','draw');
 if(s==='badgeTransfer')action('撕警徽／不移交','skip');
 if(['sheriffVote','sheriffRevote','exileVote','exileRevote'].includes(s))action(game.choice==='tie'?'取消平票':'平票','tie');
 for(const [container,offset] of [['left',0],['right',6]]){
   $(container).replaceChildren();
   game.players.slice(offset,offset+6).forEach(p=>{
     const b=document.createElement('button');
     const selected=game.action.includes(p.id) || (s==='candidates' && game.candidates.includes(p.id));
     const candidate=['candidates','draw','speeches','withdraw','sheriffVote','sheriffPK','sheriffRevote'].includes(s) && game.candidates.includes(p.id);
     b.className=`seat${selected?' selected':''}${candidate?' candidate':''}${p.role?' known':''}${p.alive?'':' dead'}`;
     b.disabled=!selectable(game,p.id);b.setAttribute('aria-pressed',String(selected));
     b.setAttribute('aria-label',`${p.id}號 ${ROLES[p.role]||'未標記'} ${p.alive?'存活':'出局'}${game.sheriff===p.id?' 警長':''}${candidate?' 上警':''}`);
     const avatar=document.createElement('span');avatar.className='avatar';avatar.textContent=p.id;
     const info=document.createElement('span'),number=document.createElement('strong'),role=document.createElement('small');
     number.textContent=p.id+'號';role.textContent=(ROLES[p.role]||'未標記')+(game.sheriff===p.id?' ♛':'')+(!p.alive?' †':'');info.append(number,role);b.append(avatar,info);
     if(candidate){const tag=document.createElement('span');tag.className='candidate-tag';tag.textContent='上警';b.append(tag);}
     b.onclick=()=>{selectSeat(game,p.id);render();};$(container).append(b);
   });
 }
 $('next').disabled=!canNext(game);$('back').disabled=game.history.length===0;
 $('saveStatus').textContent=storageOK?'本機自動保存 · 上一步可修正尚未公布的操作':'無法保存本機紀錄，關閉頁面後資料可能遺失';
}
let drawTimeout=null,drawAnimating=false;
function displayDraw(){
 const d=game.draw;if(!d)return;
 $('drawPhase').textContent='抽籤結果';$('drawSpinner').hidden=true;$('drawSkip').hidden=true;$('drawClose').hidden=false;
 $('drawResult').textContent=`${d.seat}號 · ${d.clockwise?'順':'逆'}時針`;
 $('drawOrder').textContent=(d.reference?`以${d.reference}號死者為基準・${d.clockwise?'右邊':'左邊'}。`:'')+'發言順序：'+d.order.map(id=>id+'號').join(' → ');
}
function finishDraw(){
 if(!drawAnimating)return;drawAnimating=false;clearTimeout(drawTimeout);drawTimeout=null;
 choose(game,'revealDraw');render();displayDraw();
}
function startDraw(){
 if(!choose(game,'draw'))return;render();
 if(!$('drawDialog').open)$('drawDialog').showModal();
 if(game.draw.revealed){displayDraw();return;}
 drawAnimating=true;$('drawPhase').textContent='抽籤中… 點一下畫面可直接看結果';
 $('drawResult').textContent='';$('drawOrder').textContent='';$('drawSpinner').hidden=false;$('drawSkip').hidden=false;$('drawClose').hidden=true;
 clearTimeout(drawTimeout);drawTimeout=setTimeout(finishDraw,2000);
}
document.addEventListener('pointerdown',()=>{if(drawAnimating)finishDraw();});
$('drawSkip').onclick=finishDraw;$('drawClose').onclick=()=>$('drawDialog').close();
$('drawDialog').addEventListener('cancel',e=>{if(drawAnimating){e.preventDefault();finishDraw();}});
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
if(['draw','dayDraw'].includes(game.step) && game.draw && !game.draw.revealed)startDraw();
