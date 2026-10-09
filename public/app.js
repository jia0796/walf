import {createGame,upgradeGame,ROLES,boardOf,phaseOf,subtitle,canNext,selectable,selectSeat,choose,next,previous,potionBlocked,inspection,mapTarget,canSelfDestruct,beginSelfDestruct,mechanicalAbility,mechanicalModes,roleName,roleResult} from './engine.js';
import {ROLE_DATA,BOARDS} from './data.js';
import {gestureAsset} from './gestures.js';
import {settleNight} from './night.js';
const $=id=>document.getElementById(id),KEY='eclipse-host-v1',PURE='照字幕主持，完成後按下一步';
let game=null,storageOK=true,screen='home',selectedBoard='12';
try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved){game=upgradeGame(saved);screen='host';}}catch{storageOK=false;}
function persist(){if(!game)return;try{localStorage.setItem(KEY,JSON.stringify(game));storageOK=true;}catch{storageOK=false;}}
function show(name){screen=name;for(const id of ['home','boards','setup','encyclopedia','host'])$(id).hidden=id!==name;$('resume').hidden=!game;}
function rulesText(b,r){return b.name+'\n警長：'+(r.sheriff?'開':'關')+'\n女巫自救：'+(r.selfRescue?'允許':'不允許')+'\n狼人勝利條件：'+(r.victory==='edge'?'屠邊':'屠城')+'\n'+(b.swallowThreshold===2?'雙爆':'單爆')+'吞警徽：'+(r.swallow?'啟用':'不啟用')+(b.roles.mechanical?'\n學狼人：'+(r.mechanicalKnife==='next'?'下一晚可刀':'狼全死才有雙刀')+'\n機械守衛反彈毒藥：'+(r.reflectPoison?'開':'關'):'');}
const OP_LABEL={learnTarget:'學習身分',extraAttack:'額外狼刀',mechanicalInspect:'查驗',mechanicalPoison:'一次性毒藥',shield:'一次性無敵盾'};
function setupBoard(id){
 selectedBoard=id;const b=BOARDS[id];$('setupTitle').textContent=b.name;$('setupRoles').replaceChildren();
 for(const [role,count] of Object.entries(b.roles)){const li=document.createElement('li');li.textContent=ROLES[role]+' ×'+count;li.className=ROLE_DATA[role].kind;$('setupRoles').append(li);}
 $('setupOrder').textContent=(b.firstNightOrder?'第一晚：'+b.firstNightOrder.map(r=>r==='mediumIdentify'?'通靈師舉手':r==='wolves'?'狼人':ROLES[r]).join(' → ')+'\n第二晚起：':'')+b.nightOrder.map(r=>r==='wolves'?'狼人':ROLES[r]).join(' → ');
 $('swallowLabel').textContent=(b.swallowThreshold===2?'雙爆':'單爆')+'吞警徽';
 $('ruleSheriff').value=String(b.defaults.sheriff);$('ruleSelfRescue').value=String(b.defaults.selfRescue);$('ruleVictory').value=b.defaults.victory;$('ruleSwallow').value=String(b.defaults.swallow);$('mechanicalRules').hidden=!b.roles.mechanical;$('ruleMechanicalKnife').value=b.defaults.mechanicalKnife||'next';$('ruleReflectPoison').value=String(b.defaults.reflectPoison||false);show('setup');
}
function library(){
 $('roleLibrary').replaceChildren();
 for(const r of Object.values(ROLE_DATA)){const card=document.createElement('article');card.className='role-card '+r.kind;
 const flip=document.createElement('button');flip.className='role-front';flip.setAttribute('aria-label','翻牌：'+r.name);flip.setAttribute('aria-expanded','false');
 const title=document.createElement('h2');title.textContent=r.name;flip.append(title);
 if(r.image){const img=document.createElement('img');img.src=r.image;img.alt=r.name;img.loading='lazy';flip.append(img);}
 const back=document.createElement('div');back.hidden=true;
 for(const text of ['［'+r.camp+'］','［技能］ '+r.skill,'［目標］ '+r.goal]){const p=document.createElement('p');p.textContent=text;back.append(p);}
 flip.onclick=()=>{back.hidden=!back.hidden;flip.classList.toggle('flipped',!back.hidden);flip.setAttribute('aria-expanded',String(!back.hidden));};card.append(flip,back);
 $('roleLibrary').append(card);}show('encyclopedia');
}
function action(label,value,disabled=false){const b=document.createElement('button');b.textContent=label;b.disabled=disabled;b.onclick=()=>{if(value==='draw')startDraw();else{choose(game,value);render();}};$('actions').append(b);}
function hintText(){
 const s=game.step,n=game.nightAction;
 if(s==='finished')return game.winner+'獲勝';
 if(['magician','witch','seer','hunter','wolves','guard','mechanical','mediumIdentify'].includes(s)){if(game.rolesConfirmed)return PURE;if(s==='wolves')return (boardOf(game).roles.king?'依序點黑狼王，再點':'點選')+boardOf(game).roles.wolf+'名狼人';return '點選角色本人；再次點選可取消';}
 if(s==='guardTarget')return game.players.some(p=>p.alive&&p.role==='guard')?'點選守護對象，或空守；不能連續兩晚守同一人':'守衛已出局';
 if(s==='mediumInspect')return '點選存活玩家查驗具體職業';
 if(s==='mediumResult')return '查驗結果';
 if(s==='mechanicalAction')return mechanicalModes(game).length?OP_LABEL[game.operation]+'：點選合法對象，或選擇本晚不使用':'本晚沒有可使用的主動技能';
 if(s==='exilePKStart')return 'PK 順序：'+game.votePool.map(id=>id+'號').join(' → ');
 if(s==='exchange')return '點選兩名合法玩家，或選擇不交換';
 if(s==='attack')return '點選狼刀目標，或選擇空刀';
 if(s==='inspect')return '點選查驗目標';
 if(s==='inspectResult')return inspection(game)?'查驗手勢':'預言家已出局';
 if(s==='antidote')return '原始狼刀：'+(n.attack?n.attack+'號':'空刀')+'。'+(potionBlocked(game,'antidote')||'選擇使用或不使用解藥。');
 if(s==='poison')return potionBlocked(game,'poison')||'選擇不用毒藥，或使用毒藥後點選目標';
 if(s==='gesture')return '獵人手勢：'+(settleNight(game).deaths.some(d=>d.id===game.players.find(p=>p.role==='hunter')?.id&&d.cause==='poison')?'不可開槍（被毒）':'未被毒')+'。';
 if(s==='candidates')return '點選上警玩家，或選擇無人上警';
 if(['draw','dayDraw'].includes(s))return '按抽籤決定發言順序';
 if(['speeches','withdraw'].includes(s))return '點警上玩家退水；再次點可恢復警上';
 if(['sheriffVote','sheriffRevote','exileVote','exileRevote'].includes(s)){if(game.choice==='tie')return s==='sheriffRevote'?'雙方再次平票，本局將沒有警長':s==='exileRevote'?'無人出局，進入黑夜':'點選平票玩家；可按取消平票更正';return '點選最終結果，或選擇平票';}
 if(s==='badgeTransfer')return '點選存活玩家移交警徽，或撕掉／不移交';
 if(s==='skill')return '點選一名存活玩家，或選擇不發動技能';
 if(s==='selfDestruct')return '點選一名存活狼人，再按下一步確認';
 if(s==='discussion')return '可使用計時器；點座位標記目前發言者';
 return PURE;
}
function renderGesture(){
 $('gestureResult').replaceChildren();
 let role=null,label='';
 if(game.step==='mediumResult'&&game.nightAction.mediumInspect){role=roleResult(game,game.nightAction.mediumInspect);label=ROLES[role];}
 if(game.step==='mechanicalAction'){
  const n=game.nightAction;
  if(game.operation==='learnTarget'&&n.learnTarget){role=roleResult(game,n.learnTarget,true)||'villager';label=n.learnTarget+'號・'+ROLES[role];}
  else if(game.operation==='mechanicalInspect'&&n.mechanicalInspect){role=roleResult(game,n.mechanicalInspect);label=ROLES[role];}
 }
 if(role){const title=document.createElement('p');title.textContent=label;const img=document.createElement('img');img.src=gestureAsset(role);img.alt=ROLES[role]+'手勢';img.className='role-gesture';$('gestureResult').append(title,img);return;}
 const result=game.step==='inspectResult'?inspection(game):'';if(!result)return;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 32 32');svg.setAttribute('role','img');svg.setAttribute('aria-label',result==='up'?'好人手勢：讚':'狼人手勢：倒讚');svg.classList.add('thumb-icon',result);
 const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','M5 14h5v14H5z M10 15l6-7V4c4 0 5 3 4 7l-1 3h6c2 0 3 2 2 4l-2 8c0 1-1 2-3 2H10z');svg.append(path);$('gestureResult').append(svg);
}
function render(){
 if(!game){show('home');return;}persist();show('host');const s=game.step;
 $('phase').textContent='第'+game.night+'天・'+phaseOf(game);$('boardName').textContent=boardOf(game).name;
 $('stepLabel').hidden=true;$('subtitle').textContent=subtitle(game);$('hint').textContent=hintText();renderGesture();
 $('selection').textContent=game.action.length?'已選：'+game.action.map(id=>id+'號').join('、'):game.draw?.revealed&&['draw','dayDraw','speeches'].includes(s)?game.draw.seat+'號開始，'+(game.draw.clockwise?'順':'逆')+'時針發言':'';
 if(s==='discussion'&&!game.sheriff&&game.draw?.revealed)$('selection').textContent='發言順序：'+game.draw.order.map(id=>id+'號').join(' → ');
 $('actions').replaceChildren();
 if(s==='guardTarget')action('空守','skip',!game.players.some(p=>p.alive&&p.role==='guard'));
 if(s==='mechanicalAction'){for(const mode of mechanicalModes(game))action(OP_LABEL[mode],'mode:'+mode);if(game.operation&&game.operation!=='mechanicalInspect')action(game.operation==='learnTarget'?'暫不學習':game.operation==='extraAttack'?'空刀':'本晚不使用','skip');}
 if(s==='exchange')action('不交換','skip');if(s==='attack')action('空刀','skip');if(s==='skill')action('不發動技能','skip');
 if(['antidote','poison'].includes(s)){const blocked=!!potionBlocked(game,s);action(s==='antidote'?'不使用解藥':'不用毒藥','skip',blocked);action(s==='antidote'?'使用解藥':'使用毒藥','use',blocked);}
 if(s==='candidates')action('無人上警','none');if(['draw','dayDraw'].includes(s))action(game.draw?.revealed?'查看抽籤結果':'抽籤','draw');
 if(s==='badgeTransfer')action('撕掉／不移交','skip');
 if(['sheriffVote','sheriffRevote','exileVote','exileRevote'].includes(s))action(game.choice==='tie'?'取消平票':'平票','tie');
 for(const [container,offset] of [['left',0],['right',6]]){
  $(container).replaceChildren();for(const p of game.players.slice(offset,offset+6)){
   const b=document.createElement('button'),r=ROLE_DATA[p.role],selected=game.action.includes(p.id),candidate=['candidates','draw','speeches','withdraw','sheriffVote','sheriffPK','sheriffRevote'].includes(s)&&game.candidates.includes(p.id);
   const target=selected&&['exchange','attack','poison','inspect','skill','guardTarget','mediumInspect','mechanicalAction'].includes(s),speaking=s==='discussion'&&game.speaker===p.id;
   b.className='seat '+(r?.kind||'unknown')+(selected?(target?' target':' selected'):'')+(p.alive?'':' dead')+(p.active?'':' inactive')+(candidate?' candidate':'')+(speaking?' speaking':'');
   b.disabled=!selectable(game,p.id);b.setAttribute('aria-pressed',String(selected));
   b.setAttribute('aria-label',p.id+'號 '+(!p.active?'未使用':roleName(game,p)+' '+(p.alive?'存活':'死亡'))+(candidate?' 警上':'')+(game.sheriff===p.id?' 警長':''));
   for(const [cls,text] of [['seat-number',p.id+'號'],['role-name',p.active?roleName(game,p):'未使用']]){const el=document.createElement('span');el.className=cls;el.textContent=text;b.append(el);}
   const tags=document.createElement('span');tags.className='seat-tags';
   for(const text of [candidate?'警上':'',p.active&&!p.alive?'死亡':'',speaking?'發言':''])if(text){const tag=document.createElement('span');tag.textContent=text;tags.append(tag);}b.append(tags);if(game.sheriff===p.id){const badge=document.createElement('img');badge.src='art/moon-eclipse-sheriff-badge.svg';badge.alt='警徽';badge.className='sheriff-badge';b.append(badge);}
   b.onclick=()=>{selectSeat(game,p.id);render();};$(container).append(b);
  }
 }
 $('next').disabled=!canNext(game);$('back').disabled=game.history.length===0;$('specialOpen').hidden=!canSelfDestruct(game);
 $('saveStatus').textContent=storageOK?'':'無法保存本局，關閉頁面後資料可能遺失';
}
let drawTimeout=null,drawAnimating=false;
function displayDraw(){const d=game.draw;if(!d)return;$('drawPhase').textContent='抽籤結果';$('drawSpinner').hidden=true;$('drawSkip').hidden=true;$('drawClose').hidden=false;$('drawResult').textContent=d.seat+'號開始，'+(d.clockwise?'順':'逆')+'時針發言';$('drawOrder').textContent=(d.reference?'以'+d.reference+'號為基準。':'')+d.order.map(id=>id+'號').join(' → ');}
function finishDraw(){if(!drawAnimating)return;drawAnimating=false;clearTimeout(drawTimeout);drawTimeout=null;choose(game,'revealDraw');render();displayDraw();}
function startDraw(){if(!choose(game,'draw'))return;render();if(!$('drawDialog').open)$('drawDialog').showModal();if(game.draw.revealed){displayDraw();return;}drawAnimating=true;$('drawPhase').textContent='抽籤中…';$('drawResult').textContent='';$('drawOrder').textContent='';$('drawSpinner').hidden=false;$('drawSkip').hidden=false;$('drawClose').hidden=true;clearTimeout(drawTimeout);drawTimeout=setTimeout(finishDraw,1300);}
document.addEventListener('pointerdown',()=>{if(drawAnimating)finishDraw();});
$('drawSkip').onclick=finishDraw;$('drawClose').onclick=()=>$('drawDialog').close();$('drawDialog').addEventListener('cancel',e=>{if(drawAnimating){e.preventDefault();finishDraw();}});
let timerSeconds=60,deadline=null,interval=null;
function timerPaint(){if(deadline!==null)timerSeconds=Math.max(0,Math.ceil((deadline-Date.now())/1000));$('countdown').textContent=String(Math.floor(timerSeconds/60)).padStart(2,'0')+':'+String(timerSeconds%60).padStart(2,'0');if(timerSeconds===0&&deadline!==null){timerStop();$('timerNotice').textContent='時間到';}}
function timerStop(){deadline=null;clearInterval(interval);interval=null;}
function setSeconds(value){timerStop();timerSeconds=Math.min(3600,Math.max(10,Number(value)||60));$('duration').value=timerSeconds;$('timerNotice').textContent='';timerPaint();}
$('timerOpen').onclick=()=>{$('timerDialog').showModal();timerPaint();};$('timerClose').onclick=()=>$('timerDialog').close();
$('timerStart').onclick=()=>{if(deadline!==null)return;if(!timerSeconds)timerSeconds=Number($('duration').value)||60;deadline=Date.now()+timerSeconds*1000;interval=setInterval(timerPaint,250);$('timerNotice').textContent='';timerPaint();};
$('timerPause').onclick=()=>{timerPaint();timerStop();};$('timerReset').onclick=()=>setSeconds($('duration').value);
$('duration').onchange=() => setSeconds($('duration').value);$('duration').oninput=()=>{timerStop();timerSeconds=Math.min(3600,Math.max(10,Number($('duration').value)||60));timerPaint();};
function adjustSeconds(delta){const running=deadline!==null;timerPaint();setSeconds(timerSeconds+delta);if(running)$('timerStart').click();}
$('timerMinus').onclick=()=>adjustSeconds(-10);$('timerPlus').onclick=()=>adjustSeconds(10);
$('next').onclick=()=>{const before=game.step;if(next(game)){render();if(['speeches','discussion','sheriffPK','exilePKStart'].includes(game.step)&&before!==game.step)$('timerOpen').click();}};
$('back').onclick=()=>{previous(game);render();};
$('reset').onclick=()=>$('resetDialog').showModal();$('resetCancel').onclick=()=>$('resetDialog').close();$('resetConfirm').onclick=()=>{$('resetDialog').close();show('boards');};
$('start').onclick=()=>show('boards');$('resume').onclick=()=>render();$('encyclopediaOpen').onclick=library;
document.querySelectorAll('[data-home]').forEach(b=>b.onclick=()=>show('home'));for(const b of Object.values(BOARDS)){const button=document.createElement('button');button.textContent=b.name;button.dataset.board=b.id;button.onclick=()=>setupBoard(b.id);$('boardChoices').append(button);}
$('setupBack').onclick=()=>show('boards');$('setupStart').onclick=()=>{game=createGame(selectedBoard,{sheriff:$('ruleSheriff').value==='true',selfRescue:$('ruleSelfRescue').value==='true',victory:$('ruleVictory').value,swallow:$('ruleSwallow').value==='true',...(BOARDS[selectedBoard].roles.mechanical?{mechanicalKnife:$('ruleMechanicalKnife').value,reflectPoison:$('ruleReflectPoison').value==='true'}:{})});timerStop();setSeconds(60);render();};
$('rulesOpen').onclick=()=>{$('gameRules').textContent=rulesText(boardOf(game),game.rules);$('rulesDialog').showModal();};$('rulesClose').onclick=()=>$('rulesDialog').close();
$('specialOpen').onclick=()=>$('eventDialog').showModal();$('eventClose').onclick=()=>$('eventDialog').close();$('explodeOpen').onclick=()=>{if(beginSelfDestruct(game)){timerPaint();timerStop();$('eventDialog').close();render();}};
if(game&&game.step!=='finished')render();else show('home');
if(game&&['draw','dayDraw'].includes(game.step)&&game.draw&&!game.draw.revealed)startDraw();
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
