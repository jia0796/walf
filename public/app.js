import {originalKnifeActors,specialFlow,knifeEntry,knifeSelection,knifeKinds,statusSteps,switchSteps,knifeSummary,knifeStatus,closeRole} from './takeover.js';
import {bondAvailable} from './fragrance.js';
import {voteLocked} from './votes.js';
import {createVoteDialog} from './vote-ui.js';
import {dancerAvailable,danceCandidates,maskInspectCandidates,maskAvailable} from './masquerade.js';
import {realWolf,converted,convertedName,nativeAllowed,graveResult,infected} from './identity.js';
import {canDuel,beginDuel,confirmDuel,createGame,upgradeGame,ROLES,boardOf,phaseOf,subtitle,canNext,selectable,selectSeat,choose,next,previous,potionBlocked,inspection,mapTarget,canSelfDestruct,beginSelfDestruct,mechanicalAbility,mechanicalModes,roleName,roleResult,markersForSeat,restartGame,gunSources,mixedResult,canInfect,needsInfectionDecision} from './engine.js';
import {ROLE_DATA,BOARDS,BRANDING,HOME_ACTIONS,PLAYER_COUNTS,PAGE_BACKGROUNDS,availableBoards,REPORT_URL} from './data.js';
import {settleNight,basicActor,ordinaryWolves,revengeAvailable,canTrade,tradeOutcome,luckyAbility,inspectedWolf,winnerReason,fearedRole,forcedEmpty,bloodSealed,skillBlocked} from './night.js';
import {skillIcon,renderRecap,SKILL_LABELS} from './recap.js';
import {clampSeconds,remainingSeconds,wheelSeconds,restoresSession,createSpeechTimer,timerProgress} from './timer.js';
document.addEventListener('pointerdown',()=>{document.body.dataset.input='pointer';},true);document.addEventListener('keydown',e=>{if(e.key==='Tab')document.body.dataset.input='keyboard';},true);
const $=id=>document.getElementById(id),KEY='eclipse-host-v1',PURE='照字幕主持，完成後按下一步';
let game=null,storageOK=true,screen='home',selectedBoard='12',selectedCount=12,libraryOrigin='home',libraryRoles=Object.keys(ROLE_DATA),libraryCamp='wolf',selectedCategory='normal';
let previousScreen=null;try{previousScreen=sessionStorage.getItem(KEY+'-screen');}catch{}
try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved){game=upgradeGame(saved);if(restoresSession(performance.getEntriesByType('navigation')[0]?.type,previousScreen,saved.version))screen=saved.step==='finished'?'finished':'host';}}catch{storageOK=false;}
function persist(){if(!game)return false;try{localStorage.setItem(KEY,JSON.stringify(game));storageOK=true;}catch{storageOK=false;}$('saveStatus').textContent=storageOK?'':'儲存失敗，重新整理可能遺失目前進度';return storageOK;}
function cacheForeground(){navigator.serviceWorker?.controller?.postMessage({type:'SET_FOREGROUND',busy:['host','encyclopedia','finished'].includes(screen)});}
function show(name){const entering=screen!==name;screen=name;for(const id of ['home','counts','boards','setup','encyclopedia','host','finished'])$(id).hidden=id!==name;document.body.dataset.screen=name;document.body.style.setProperty('--page-background',PAGE_BACKGROUNDS[name]?`url('${PAGE_BACKGROUNDS[name]}')`:'none');if(entering){cacheForeground();for(const e of [$(name),...$(name).querySelectorAll('.board-window,.setup-content,.library,.preview-back,#nightRecap')])e.scrollTop=0;}try{sessionStorage.setItem(KEY+'-screen',name==='encyclopedia'&&libraryOrigin==='host'?'host':name);}catch{}}
function rulesText(b,r){return b.name+'\n警長：'+(r.sheriff?'開':'關')+'\n女巫自救：'+(r.selfRescue?'允許':'不允許')+'\n狼人勝利條件：'+(r.victory==='edge'?'屠邊':'屠城')+'\n'+(b.swallowThreshold===2?'雙爆':'單爆')+'吞警徽：'+(r.swallow?'啟用':'不啟用')+(b.roles.beauty?'\n女巫毒殺觸發殉情：'+(r.poisonRomance?'開':'關')+'\n最後一狼可殉情：'+(r.lastWolfRomance?'開':'關'):'')+(b.roles.mechanical?'\n學狼人：'+(r.mechanicalKnife==='next'?'下一晚可刀':'狼全死才有雙刀')+'\n機械守衛守護規則：'+((r.shieldMode||'once')==='once'?'只能使用一次':'成功守護一次後失效')+'\n機械守衛反彈毒藥：'+(r.reflectPoison?'開':'關'):'')+(b.roles.idiot?'\n白痴追刀：'+(r.idiotChase?'開啟':'關閉'):'')+(b.id==='evilKnight12'?'\n免疫獵人夜槍：'+(r.immuneNightGun?'開啟':'關閉'):'');}
const voteDialog=createVoteDialog({getGame:()=>game,save:persist,render});
const OP_LABEL={learnTarget:'學習身分',extraAttack:'額外狼刀',mechanicalInspect:'查驗',mechanicalPoison:'一次性毒藥',shield:'無敵盾'};
function setupBoard(id){
 selectedBoard=id;const b=BOARDS[id];$('beautyRules').hidden=!b.roles.beauty;$('rulePoisonRomance').value=String(b.defaults.poisonRomance??true);$('ruleLastWolfRomance').value=String(b.defaults.lastWolfRomance??true);$('ruleShieldMode').value=b.defaults.shieldMode||'once';$('setupTitle').textContent=b.name;$('setupWolves').replaceChildren();$('setupGood').replaceChildren();document.querySelectorAll('#setup details').forEach(d=>d.open=false);
 for(const [role,count] of Object.entries(b.roles)){const li=document.createElement('li');li.textContent=ROLES[role]+' ×'+count;li.className=ROLE_DATA[role].kind;$(ROLE_DATA[role].kind==='wolf'?'setupWolves':'setupGood').append(li);}
 $('knightRules').hidden=b.id!=='evilKnight12';$('ruleImmuneNightGun').value=String(b.defaults.immuneNightGun||false);
 $('setupOrder').textContent=(b.firstNightOrder?'第一晚：'+b.firstNightOrder.map(r=>r==='mediumIdentify'?'通靈師舉手':r==='wolves'?'狼人':r==='brothers'?'狼兄狼弟':r==='lucky'?'幸運兒':(r==='converted'?'轉化者':ROLES[r])).join(' → ')+'\n第二晚起：':'')+b.nightOrder.map(r=>r==='infectionNotice'?'感染者身分確認':r==='wolves'?'狼人':r==='lucky'?'幸運兒':r==='converted'?'轉化者':ROLES[r]).join(' → ');
 $('swallowLabel').textContent=(b.swallowThreshold===2?'雙爆':'單爆')+'吞警徽';
 $('ruleSheriff').value=String(b.defaults.sheriff);$('ruleSelfRescue').value=String(b.defaults.selfRescue);$('ruleSwallow').value=String(b.defaults.swallow);$('idiotRules').hidden=!b.roles.idiot;$('ruleIdiotChase').value=String(b.defaults.idiotChase||false);$('mechanicalRules').hidden=!b.roles.mechanical;$('ruleMechanicalKnife').value=b.defaults.mechanicalKnife||'next';$('ruleReflectPoison').value=String(b.defaults.reflectPoison||false);show('setup');
}
function drawBoards(){const available=Object.values(BOARDS).filter(b=>b.enabled&&b.playerCount===selectedCount);$('boardTabs').hidden=!available.some(b=>b.category==='special');for(const [id,category]of [['boardsNormal','normal'],['boardsSpecial','special']])$(id).setAttribute('aria-pressed',String(category===selectedCategory));$('boardChoices').replaceChildren();for(const b of availableBoards(selectedCount,selectedCategory)){const button=document.createElement('button');button.textContent=b.shortLabel;button.dataset.board=b.id;button.onclick=()=>setupBoard(b.id);$('boardChoices').append(button);}document.querySelector('.board-window').scrollTop=0;}
function chooseCount(count){selectedCount=count;selectedCategory='normal';$('boardCount').textContent=count+' 人局';drawBoards();show('boards');}
function library(origin='home'){
 libraryOrigin=origin;libraryRoles=origin==='host'?Object.keys(boardOf(game).roles):Object.keys(ROLE_DATA);$('libraryReturn').textContent=origin==='host'?'返回主持':'返回首頁';drawLibrary();show('encyclopedia');
}
let libraryImages=null;
function drawLibrary(){
 libraryImages?.disconnect();libraryImages=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){e.target.src=e.target.dataset.src;libraryImages.unobserve(e.target);}},{root:$('encyclopedia'),rootMargin:'120px 0px'});let imageIndex=0;
 $('roleLibrary').replaceChildren();$('libraryWolves').setAttribute('aria-pressed',String(libraryCamp==='wolf'));$('libraryGood').setAttribute('aria-pressed',String(libraryCamp==='good'));
 const groups=libraryCamp==='wolf'?['wolf']:['god','villager'];
 for(const group of groups){if(group==='villager'){const line=document.createElement('hr');line.className='library-divider';$('roleLibrary').append(line);}if(libraryCamp==='good'){const heading=document.createElement('h2');heading.textContent=group==='god'?'神職':'平民';heading.className='library-heading '+group;$('roleLibrary').append(heading);}
 for(const role of libraryRoles.filter(id=>ROLE_DATA[id].kind===group)){const r=ROLE_DATA[role],card=document.createElement('button');card.className='role-card '+r.kind;card.setAttribute('aria-label','查看'+r.name);const image=document.createElement('img');image.dataset.src=r.thumbnail||r.image;image.alt=r.name;image.width=420;image.height=588;image.loading='eager';image.decoding='async';if(imageIndex++<3){image.fetchPriority='high';image.src=image.dataset.src;}else libraryImages.observe(image);const title=document.createElement('span');title.textContent=r.name;card.append(image,title);card.onclick=()=>previewRole(role);$('roleLibrary').append(card);}}
}
function previewRole(role){const r=ROLE_DATA[role];$('previewCard').classList.remove('flipped');$('previewCard').setAttribute('aria-pressed','false');$('previewFront').setAttribute('aria-hidden','false');$('previewBack').setAttribute('aria-hidden','true');$('previewFront').inert=false;$('previewBack').inert=true;$('previewFront').replaceChildren();$('previewBack').replaceChildren();
 const image=document.createElement('img');image.src=r.image;image.alt=r.name;$('previewFront').append(image);
 const title=document.createElement('h2');title.textContent=r.name;$('previewBack').append(title);$('previewBack').className='preview-back '+r.kind;
 const camp=document.createElement('p');camp.textContent='［'+r.camp+'］';$('previewBack').append(camp);for(const [label,text]of [['［技能］',r.skill],['［目標］',r.goal]]){const row=document.createElement('p');row.className='description-row';const key=document.createElement('span'),content=document.createElement('span');key.textContent=label;content.textContent=text;row.append(key,content);$('previewBack').append(row);} $('rolePreview').showModal();$('rolePreview').scrollTop=0;document.querySelector('.preview-back').scrollTop=0;
}
function action(label,value,disabled=false){const b=document.createElement('button');b.textContent=label;b.disabled=disabled;
 const n=game.nightAction,step=game.step;let pressed=false;
 if(value.startsWith('knifeKind:'))pressed=game.takeover.kind===value.slice(10);
 if(value==='skip'&&knifeSelection(game))pressed=!!n[game.takeover.kind==='extra'?'extraAttackSkip':'emptyAttack'];
 if(value==='use')pressed=n[step]===true;
 if(value==='skip')pressed=step==='mechanicalAction'?!!n[game.operation==='learnTarget'?'learnSkip':game.operation+'Skip']:step==='guardTarget'?n.guardSkip:step==='attack'?n.emptyAttack:step==='exchange'?n.noExchange:['antidote','poison'].includes(step)?n[step]===false:game.choice==='skip';
 if(value==='none'||value==='tie')pressed=game.choice===value;if(value.startsWith('mode:'))pressed=game.operation===value.slice(5);
 if(value.startsWith('attackMode:'))pressed=n.attackMode===value.slice(11);
 if(value.startsWith('gift:'))pressed=n.tradeAbility===value.slice(5);
 if(value.startsWith('gun:'))pressed=game.operation===value.slice(4);
 if(value==='skip'&&step==='fear')pressed=n.fearSkip;
 if(value==='skip'&&step==='charm')pressed=n.charmSkip;
 if(value==='skip'&&step==='revenge')pressed=n.revengeSkip;
 if(value==='skip'&&step==='trade')pressed=n.tradeSkip;
 if(value==='skip'&&step==='luckyAction')pressed=n.luckySkip;
 if(value!=='draw')b.setAttribute('aria-pressed',String(!!pressed));b.onclick=()=>{if(value==='draw')startDraw();else{choose(game,value);render();}};$('actions').append(b);}
function hintText(){
 if(specialFlow(game)){if(statusSteps.includes(game.step))return knifeStatus(game);if(closeRole(game)&&knifeSummary(game))return knifeSummary(game);if(knifeSelection(game))return '狼刀選擇';if(game.step==='mechanicalLearn')return game.mechanical.role?'已完成學習，不能重複學習':game.players.some(p=>p.alive&&p.role==='mechanical')?'點選其他存活玩家學習身分，或暫不學習':'機械狼已出局';if(game.step==='mechanicalSkill')return game.operation?OP_LABEL[game.operation]+(game.operation==='extraAttack'?'：點選合法對象，或空刀；閉眼後提交':'：點選合法對象'):'本晚無可使用技能';}
 if(game.step==='bond')return game.fragrance.used?'綁定能力已使用':bondAvailable(game)?'選擇兩名不同存活玩家，可選自己，或不綁定':'尋香魅影已出局';
 if(game.step==='fragranceKnown')return PURE;
 if(['fragrance','awakenedSeer'].includes(game.step))return game.rolesConfirmed?PURE:'點選角色本人；再次點選可取消';
 if(game.step==='awakenedInspect')return game.players.some(p=>p.alive&&p.role==='awakenedSeer')?'選擇兩名不同存活玩家，可選自己':'覺醒預言家已出局';
 if(game.step==='awakenedResult')return inspection(game)?'查驗手勢':'覺醒預言家已出局';
 if(!game.rolesConfirmed&&['dancer','mask'].includes(game.step))return '點選'+ROLES[game.step]+'本人；再次點選可取消';
 if(game.step==='dance'&&!game.players.some(p=>p.alive&&p.role==='dancer'))return '舞者已出局';
 if(game.step==='dance')return dancerAvailable(game)?'點選三名整局未共舞的存活玩家，可選自己':'目前沒有足夠的合法對象，今晚不能使用技能';
 if(game.step==='maskResult')return game.nightAction.maskResult||'沒有合法查驗結果';
 if(game.step==='maskInspect')return maskInspectCandidates(game).length?'點選存活玩家，可選自己，不可連續查驗同一人':'沒有合法查驗對象';
 if(game.step==='maskAssign')return maskAvailable(game)?'可選任意合法存活玩家（不必共舞），或空過':'假面已出局';
 const s=game.step,n=game.nightAction;
 if(s==='beauty'||s==='beautyClose')return '照字幕主持，完成後按下一步';
 if(s==='charm')return game.players.some(p=>p.role==='beauty'&&p.alive)?'選擇其他存活玩家，或空魅惑；不可連續兩晚選同一人':'狼美人已出局';
 if(s==='duelist')return game.rolesConfirmed?'確認身分':'點選騎士本人';
 if(s==='duel')return '選擇其他存活玩家；下一步確認，取消不消耗';
 if(s==='duelResult')return '已結算，按下一步繼續；不公開目標職業';
 if(s==='hiddenWolf')return game.rolesConfirmed?'確認身分':'點選隱狼本人；再次點選可取消';
 if(s==='hiddenWolfClose')return '確認身分';
 if(s==='mixedResult')return '跟隨結果';
 if(s==='mechanicalResult')return '查驗結果';
 if(s==='confirm'&&boardOf(game).roles.hiddenWolf)return '隱狼於第一晚單獨睜眼時登記；不與狼隊相認';
 if(['witch','antidote','poison','witchClose','guard','guardTarget','guardClose','seer','inspect','inspectResult','seerClose','hunter','gesture','hunterClose'].includes(s)&&game.players.some(p=>infected(game,p)&&p.role===({guardTarget:'guard',guardClose:'guard',inspect:'seer',inspectResult:'seer',seerClose:'seer',gesture:'hunter',hunterClose:'hunter',antidote:'witch',poison:'witch',witchClose:'witch'}[s]||s)))return '已被感染，無法使用技能';
 if(s==='infectionNotice'||s==='infectionOpen'||s==='infectionClose')return game.infection.success&&game.infection.usedNight===game.night?'僅輕觸 '+game.infection.target+'號肩膀通知；原狼隊當晚不通知':PURE;
 if(s==='finished')return game.winner+'獲勝';
 if((['dream','sleep'].includes(s)&&fearedRole(game,'dream'))||(['witch','antidote','poison','witchClose'].includes(s)&&fearedRole(game,'witch'))||(['seer','inspect','inspectResult','seerClose'].includes(s)&&fearedRole(game,'seer'))||(['hunter','gesture','hunterClose'].includes(s)&&fearedRole(game,'hunter'))||(['wolves','attack'].includes(s)&&game.rolesConfirmed&&forcedEmpty(game)))return '當晚受到恐懼，無法使用技能';
 if(bloodSealed(game)&&game.rolesConfirmed&&['witch','antidote','poison','witchClose','seer','inspect','inspectResult','seerClose','demon','hunt','demonClose'].includes(s))return '當晚神職技能封鎖';
 if(s==='transform')return '選擇原始狼人相鄰的合法好人；必須選擇';
 if(s==='gravekeeper'&&!game.rolesConfirmed)return '點選守墓人本人';
 if(['witch','antidote','poison','witchClose','guard','guardTarget','guardClose','seer','inspect','inspectResult','seerClose','hunter','gesture','hunterClose','gravekeeper','graveResult'].includes(s)&&game.rolesConfirmed&&game.players.some(p=>p.role===({guardTarget:'guard',guardClose:'guard',inspect:'seer',inspectResult:'seer',seerClose:'seer',gesture:'hunter',hunterClose:'hunter',antidote:'witch',poison:'witch',witchClose:'witch',graveResult:'gravekeeper'}[s]||s)&&!nativeAllowed(game,p)))return '原職技能已停用';
 if(s==='demon')return game.night===1&&!game.rolesConfirmed?'確認身分':PURE;
 if(s==='hunt')return skillBlocked(game,'demon')?'當晚神職技能封鎖':game.players.some(p=>p.alive&&p.role==='demon')?'點選一名其他存活玩家，或不使用':'獵魔人已出局';
 if(s==='lastBlade')return '最後一刀：必須選擇一名其他存活玩家';
 if(s==='idiot')return '確認身分';
 if(s==='mixed')return game.rolesConfirmed?PURE:'點選混血兒本人；再次點選可取消';
 if(s==='roleModel')return '點選一名其他玩家作為榜樣';
 if(s==='fear')return game.players.some(p=>p.alive&&p.role==='nightmare')?'點選其他存活玩家，或空恐':'夢魘已出局';
 if(s==='sleep')return fearedRole(game,'dream')?'當晚受到恐懼，無法使用技能':game.players.some(p=>p.alive&&p.role==='dream')?'點選一名其他存活玩家':'攝夢人已出局';
 if(s==='brothers')return game.rolesConfirmed?PURE:'依序點選狼兄，再點選狼弟；再次點選可取消';
 if(s==='merchant')return game.rolesConfirmed?PURE:'點選黑市商人本人；再次點選可取消';
 if(s==='revenge')return revengeAvailable(game)?'點選任一存活玩家，或空刀；本晚機會不能保留':'本晚無可用復仇刀，照字幕主持';
 if(s==='trade'){if(!canTrade(game))return game.merchant.used?'交易機會已使用':'商人已出局';return game.nightAction.tradeTarget&&game.nightAction.tradeAbility?(tradeOutcome(game,n.tradeTarget)?'交易成功':'交易失敗，商人將列入夜間死亡'):'選擇其他存活玩家與一項能力，或延後交易';}
 if(s==='merchantClose'&&game.merchant.usedNight===game.night)return game.merchant.success?'交易成功':'交易失敗；死訊不公布原因';
 if(s==='lucky')return game.lucky?.grantedNight===game.night?'通知 '+game.lucky.seat+'號獲得額外'+SKILL_LABELS[game.lucky.ability]+'；查驗／毒藥下一晚起，槍下一個白天起生效':PURE;
 if(s==='luckyAction')return luckyAbility(game)&&game.lucky.remaining>0?'額外'+SKILL_LABELS[game.lucky.ability]+'（獨立一次），選擇目標或保留':'本晚沒有可使用的夜間額外技能';
 if(['magician','witch','seer','hunter','wolves','guard','mechanical','mediumIdentify','nightmare','dream'].includes(s)){if(game.rolesConfirmed)return PURE;if(s==='wolves')return (boardOf(game).roles.king?'依序點黑狼王，再點':boardOf(game).roles.blood?'依序點血月使者，再點':boardOf(game).roles.gargoyle?'依序點覺醒石像鬼，再點':boardOf(game).roles.evilKnight?'依序點惡靈騎士，再點':boardOf(game).roles.seedWolf?'依序點種狼，再點':boardOf(game).roles.beauty?'依序點狼美人，再點':'點選')+boardOf(game).roles.wolf+'名狼人';return '點選角色本人；再次點選可取消';}
 if(s==='guardTarget')return game.players.some(p=>p.alive&&p.role==='guard')?'點選守護對象，或空守；不能連續兩晚守同一人':'守衛已出局';
 if(s==='mediumInspect')return '點選存活玩家查驗具體職業';
 if(s==='mediumResult')return '查驗結果';
 if(s==='mechanicalAction')return mechanicalModes(game).length?OP_LABEL[game.operation]+(game.operation==='mechanicalInspect'?'：點選查驗對象':'：點選合法對象，或選擇本晚不使用'):'本晚沒有可使用的主動技能';
 if(s==='exilePKStart')return 'PK 順序：'+game.votePool.map(id=>id+'號').join(' → ');
 if(s==='exchange')return '點選兩名合法玩家，或選擇不交換';
 if(s==='attack'&&forcedEmpty(game))return '當晚受到恐懼，無法使用技能';
 if(s==='attack'&&specialFlow(game)&&!originalKnifeActors(game).length)return '原狼人已全部出局，僅保留主持字幕；狼刀於專屬階段操作';
 if(s==='attack')return basicActor(game)?(boardOf(game).roles.seedWolf&&game.night>1?'點選共同目標；下一步詢問是否感染，或選擇空刀':'點選狼刀目標，或選擇空刀'):'本晚沒有可參與普通狼刀的狼人，普通狼刀自動空刀';
 if(s==='inspect')return '點選查驗目標';
 if(s==='inspectResult')return inspection(game)?'查驗手勢':'預言家已出局';
 if(s==='antidote'){if(!game.potions.antidote&&n.antidote!==true)return '解藥已使用';if(!n.attack)return '今晚沒有狼刀目標';return '原始狼刀：'+n.attack+'號。'+(potionBlocked(game,'antidote')||'選擇使用或不使用解藥。');}
 if(s==='poison')return potionBlocked(game,'poison')||'選擇不用毒藥，或使用毒藥後點選目標';
 if(s==='gesture'&&settleNight(game).deaths.some(d=>d.id===game.players.find(p=>p.role==='hunter')?.id&&['dreamRepeat','dreamLink'].includes(d.cause)))return '獵人手勢：不可開槍';
 if(s==='gesture')return '獵人手勢：'+(settleNight(game).deaths.some(d=>d.id===game.players.find(p=>p.role==='hunter')?.id&&d.cause==='poison')?'不可開槍（被毒）':'未被毒')+'。';
 if(s==='candidates')return '點選上警玩家，或選擇無人上警';
 if(['draw','dayDraw'].includes(s))return '按抽籤決定發言順序';
 if(['speeches','withdraw'].includes(s))return '點警上玩家退水；再次點可恢復警上';
 if(['sheriffVote','sheriffRevote','exileVote','exileRevote'].includes(s)){if(voteLocked(game))return '已套用票型統計；修改請重新編輯票型，或放棄票型紀錄';if(game.choice==='tie')return s==='sheriffRevote'?'雙方再次平票，本局將沒有警長':s==='exileRevote'?'無人出局，進入黑夜':'點選平票玩家；可按取消平票更正';return '點選最終結果，或選擇平票';}
 if(s==='badgeTransfer')return '點選存活玩家移交警徽，或撕掉／不移交';
 if(s==='skill')return (game.operation==='lucky'?'幸運兒額外槍':'原有角色槍')+'：點選一名存活玩家，或選擇不發動技能';
 if(s==='selfDestruct')return '點選一名存活狼人，再按下一步確認';
 if(s==='discussion')return '可使用計時器；點座位標記目前發言者';
 return PURE;
}
function renderGesture(){
 $('gestureResult').replaceChildren();if(knifeSelection(game))return;
 let role=null,label='';
 if(game.step==='mechanicalResult'&&game.nightAction.mechanicalResult){const result=game.nightAction.mechanicalResult;role=result.role;label=result.target+'號玩家・'+ROLES[role];}
 if(game.step==='mediumResult'&&game.nightAction.mediumInspect){role=roleResult(game,game.nightAction.mediumInspect);label=game.nightAction.mediumInspect+'號玩家・'+ROLES[role];}
 if(['mechanicalAction','mechanicalLearn','mechanicalSkill'].includes(game.step)){
  const n=game.nightAction;
  if(game.operation==='learnTarget'&&n.learnTarget){role=roleResult(game,n.learnTarget,true)||'villager';label=n.learnTarget+'號玩家・'+ROLES[role];}
  else if(game.operation==='mechanicalInspect'&&n.mechanicalInspect){role=roleResult(game,n.mechanicalInspect);label=n.mechanicalInspect+'號玩家・'+ROLES[role];}
 }
 if(role){const title=document.createElement('p');title.textContent=label;$('gestureResult').append(title);return;}
 const grave=graveResult(game);const result=game.step==='mixedResult'?(game.mixed.camp==='狼人陣營'?'down':'up'):game.step==='graveResult'&&grave?(grave.wolf?'down':'up'):(game.step==='awakenedResult'||game.step==='inspectResult'||game.step==='inspect'&&game.players.find(p=>p.id===game.nightAction.inspect)?.role==='evilKnight')?inspection(game):game.step==='luckyAction'&&game.nightAction.luckyInspect?(inspectedWolf(game,mapTarget(game,game.nightAction.luckyInspect))?'down':'up'):'';if(!result)return;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 32 32');svg.setAttribute('role','img');svg.setAttribute('aria-label',result==='up'?'好人手勢：讚':'狼人手勢：倒讚');svg.classList.add('thumb-icon',result);
 const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','M5 14h5v14H5z M10 15l6-7V4c4 0 5 3 4 7l-1 3h6c2 0 3 2 2 4l-2 8c0 1-1 2-3 2H10z');svg.append(path);$('gestureResult').append(svg);
}
function renderOperation(){
 const step=game.step;
 const skill=knifeSelection(game)?'wolf-attack':{mechanicalLearn:'learn',mechanicalSkill:{extraAttack:'wolf-attack',mechanicalInspect:'inspect',mechanicalPoison:'poison',shield:'shield'}[game.operation],bond:'bond',awakenedInspect:'inspect',dance:'dance',maskInspect:'wolf-inspect',maskAssign:'mask',charm:'charm',duel:'duel',transform:'transform',graveResult:'gravekeeper',hunt:'hunt',lastBlade:'wolf-attack',roleModel:'role-model',fear:'fear',sleep:'sleep',exchange:'swap',attack:game.nightAction.attackMode==='infect'?'infect':'wolf-attack',revenge:'wolf-attack',antidote:'antidote',poison:'poison',inspect:'inspect',guardTarget:'shield',mediumInspect:'inspect',trade:'trade',skill:'gun',luckyAction:game.lucky?.ability,mechanicalAction:{learnTarget:'learn',extraAttack:'wolf-attack',mechanicalInspect:'inspect',mechanicalPoison:'poison',shield:'shield'}[game.operation]}[step];
 $('operationCard').replaceChildren();if(!skill&&specialFlow(game)&&switchSteps.includes(step)&&knifeKinds(game).length){const toggle=document.createElement('button');toggle.id='knifeToggle';toggle.textContent='狼刀';toggle.onclick=()=>{choose(game,'knife');render();};toggle.style.float='right';$('operationCard').append(toggle);}if(!skill||['當晚受到恐懼，無法使用技能','當晚神職技能封鎖','原職技能已停用','已被感染，無法使用技能'].includes(hintText()))return;
 const control=document.createElement('div');control.className='operation-control';control.append(skillIcon(skill));const label=document.createElement('span');label.textContent=SKILL_LABELS[skill];control.append(label);if(specialFlow(game)&&switchSteps.includes(step)&&knifeKinds(game).length){const toggle=document.createElement('button');toggle.type='button';toggle.id='knifeToggle';toggle.textContent=knifeSelection(game)?'技能':'狼刀';toggle.style.marginLeft='auto';toggle.onclick=()=>{choose(game,knifeSelection(game)?'skill':'knife');render();};control.append(toggle);}$('operationCard').append(control);
}
function renderFinished(){
 const wasFinished=screen==='finished';
 $('identityCards').replaceChildren();for(const p of game.players.filter(p=>p.active)){const card=document.createElement('article');card.className='identity-card '+(realWolf(game,p)?'wolf':ROLE_DATA[p.role]?.kind);const img=document.createElement('img');img.src=ROLE_DATA[p.role].image;img.alt='';const text=document.createElement('p');text.textContent=p.id+'號｜'+roleName(game,p)+(infected(game,p)?'｜第'+game.infection.usedNight+'晚感染成功｜狼人陣營｜'+(game.winner==='狼人陣營'?'勝利':'失敗'):game.infection.target===p.id&&game.infection.result?'｜第'+game.infection.usedNight+'晚感染失敗':'');card.append(img,text);$('identityCards').append(card);}
 persist();show('finished');$('finished').className='finished-screen '+(game.winner==='狼人陣營'?'wolves-win':'good-win');$('winnerTitle').textContent=game.winner+'獲勝';$('winnerReason').textContent='勝利原因：'+(game.winnerReason||winnerReason(game));const result=mixedResult(game),mixed=game.players.find(p=>p.role==='mixed');$('mixedOutcome').hidden=!boardOf(game).roles.mixed;
 $('mixedOutcome').hidden=true;$('mixedOutcome').textContent='';$('identityOpen').hidden=true;document.querySelector('#finished > .victory').hidden=true;
 const recap=$('nightRecap');renderRecap(recap,game,persist);if(!wasFinished)recap.scrollTop=0;
}
function render(){
 if(!game){show('home');return;}if(game.step==='finished'){timerStop();renderFinished();return;}persist();show('host');const s=game.step;
 $('phase').textContent='第'+game.night+'天・'+phaseOf(game);$('boardName').textContent=boardOf(game).name;
 $('stepLabel').hidden=true;$('subtitle').textContent=subtitle(game);$('hint').textContent=hintText();$('hint').style.whiteSpace=specialFlow(game)&&statusSteps.includes(s)?'pre-line':'';renderGesture();renderOperation();
 $('selection').textContent=game.action.length?'已選：'+game.action.map(id=>id+'號').join('、'):game.draw?.revealed&&['draw','dayDraw','speeches'].includes(s)?game.draw.seat+'號開始，'+(game.draw.clockwise?'順':'逆')+'時針發言':'';
 if(s==='discussion'&&!game.sheriff&&game.draw?.revealed)$('selection').textContent='發言順序：'+game.draw.order.map(id=>id+'號').join(' → ');
 $('actions').replaceChildren();
 $('duelOpen').hidden=!boardOf(game).roles.duelist;$('duelOpen').disabled=!canDuel(game);
 if(specialFlow(game)&&knifeSelection(game)){if(knifeKinds(game).length>1)for(const kind of knifeKinds(game))action(kind==='basic'?'基本狼刀':'額外狼刀','knifeKind:'+kind);action('空刀','skip');}
 else {
 if(specialFlow(game)&&s==='mechanicalLearn'&&!game.mechanical.role&&game.players.some(p=>p.alive&&p.role==='mechanical'))action('暫不學習','skip');
 if(specialFlow(game)&&s==='mechanicalSkill'&&game.operation&&game.operation!=='mechanicalInspect')action(game.operation==='extraAttack'?'空刀':'本晚不使用','skip');
 if(s==='maskAssign'&&maskAvailable(game))action('空過','skip');
 if(s==='charm'&&game.players.some(p=>p.role==='beauty'&&p.alive))action('空魅惑','skip');
 if(s==='hunt')action('不使用','skip',skillBlocked(game,'demon')||!game.players.some(p=>p.alive&&p.role==='demon'));
 if(s==='fear')action('不恐懼','skip',!game.players.some(p=>p.alive&&p.role==='nightmare'));
 if(s==='guardTarget')action('空守','skip',!game.players.some(p=>p.alive&&p.role==='guard'&&nativeAllowed(game,p)));
 if(s==='mechanicalAction'){for(const mode of mechanicalModes(game))action(OP_LABEL[mode],'mode:'+mode);if(game.operation&&game.operation!=='mechanicalInspect')action(game.operation==='learnTarget'?'暫不學習':game.operation==='extraAttack'?'本晚不使用／保留':'本晚不使用','skip');}
 if(s==='revenge'&&revengeAvailable(game))action('空刀','skip');
 if(s==='trade'&&canTrade(game)){for(const ability of ['inspect','poison','gun'])action('贈送'+SKILL_LABELS[ability],'gift:'+ability);action('延後交易','skip');}
 if(s==='luckyAction'&&luckyAbility(game)&&game.lucky.remaining>0)action('保留技能','skip');
 if(s==='skill'&&gunSources(game,game.queue[0]).length>1){action('原有角色槍','gun:native');action('幸運兒額外槍','gun:lucky');}

 if(s==='bond'&&bondAvailable(game))action('不綁定','skip');
 if(s==='exchange')action('不交換','skip');if(s==='attack'&&basicActor(game)&&!forcedEmpty(game)&&(!specialFlow(game)||originalKnifeActors(game).length))action('空刀','skip');if(s==='skill')action('不發動技能','skip');
 if(['antidote','poison'].includes(s)){const blocked=!!potionBlocked(game,s);action(s==='antidote'?'不使用解藥':'不用毒藥','skip',blocked);action(s==='antidote'?'使用解藥':'使用毒藥','use',blocked);}
 if(s==='candidates'){action('全員上警','all');action('無人上警','none');}if(['draw','dayDraw'].includes(s))action(game.draw?.revealed?'查看抽籤結果':'抽籤','draw');
 if(s==='badgeTransfer')action('撕掉／不移交','skip');
 if(['sheriffVote','sheriffRevote','exileVote','exileRevote'].includes(s)){action(game.choice==='tie'?'取消平票':'平票','tie');$('actions').lastElementChild.disabled=voteLocked(game);const button=document.createElement('button');button.textContent='紀錄票型（選用）';button.className='quiet';button.id='voteNotesOpen';button.onclick=()=>voteDialog.open();$('actions').append(button);}
 }
 for(const [container,offset] of [['left',0],['right',6]]){
  $(container).replaceChildren();for(const p of game.players.slice(offset,offset+6)){
   const b=document.createElement('button'),r=converted(game,p)||infected(game,p)?{...ROLE_DATA[p.role],kind:'wolf'}:ROLE_DATA[p.role],selected=game.action.includes(p.id),candidate=['candidates','draw','speeches','withdraw','sheriffVote','sheriffPK','sheriffRevote'].includes(s)&&game.candidates.includes(p.id),withdrawn=['speeches','withdraw','sheriffVote','sheriffPK','sheriffRevote'].includes(s)&&game.nominees.includes(p.id)&&!game.candidates.includes(p.id),voteSelected=selected&&['sheriffVote','sheriffRevote','exileVote','exileRevote'].includes(s);
   const target=selected&&(knifeSelection(game)||['bond','awakenedInspect','dance','maskInspect','maskAssign','exchange','attack','poison','inspect','skill','guardTarget','mediumInspect','mechanicalAction','mechanicalSkill','revenge','trade','luckyAction','fear','sleep','roleModel','hunt','lastBlade','transform','charm','duel'].includes(s)),speaking=s==='discussion'&&game.speaker===p.id;
   b.className='seat '+(roleName(game,p).length>4?'long-name ':'')+(r?.kind||'unknown')+(selected?(target?' target':' selected'):'')+(p.alive?'':' dead')+(p.active?'':' inactive')+(candidate?' candidate':'')+(withdrawn?' withdrawn':'')+(voteSelected?' vote-selected':'')+(speaking?' speaking':'')+(p.role==='idiot'&&game.idiot.revealed&&p.alive?' idiot-revealed':'');
   b.disabled=!selectable(game,p.id);b.setAttribute('aria-pressed',String(selected));const count=markersForSeat(game,p.id).length;b.style.setProperty('--mark-space',(count?22+17*(count-1):0)+'px');
   b.setAttribute('aria-label',p.id+'號 '+(!p.active?'未使用':roleName(game,p)+' '+(p.alive?'存活':'死亡'))+(candidate?' 警上':'')+(game.sheriff===p.id?' 警長':''));
   for(const [cls,text] of [['seat-number',p.id+'號'],['role-name',p.active?roleName(game,p):'未使用']]){const el=document.createElement('span');el.className=cls;el.textContent=text;b.append(el);}
   const tags=document.createElement('span');tags.className='seat-tags';
   for(const text of [candidate?'警上':withdrawn?'退水':'',p.active&&!p.alive?'死亡':'',speaking?'發言':''])if(text){const tag=document.createElement('span');tag.textContent=text;tags.append(tag);}b.append(tags);if(game.sheriff===p.id){const badge=document.createElement('img');badge.src='art/moon-eclipse-sheriff-badge.svg';badge.alt='警徽';badge.className='sheriff-badge';b.append(badge);}
   const marks=document.createElement('span');marks.className='skill-marks';for(const m of markersForSeat(game,p.id)){const wrap=document.createElement('span');wrap.className='skill-mark';wrap.style.zIndex=String(m.sequence);wrap.dataset.sequence=m.sequence;wrap.dataset.source=m.key;const icon=document.createElement('img');icon.src='skills/icon-'+m.type+'.svg';icon.alt=SKILL_LABELS[m.type];wrap.append(icon);const badge=m.type==='sleep'&&game.nightAction.repeatPending===m.id?'x2':m.partner;if(badge){const partner=document.createElement('span');partner.className='swap-partner'+(m.type==='sleep'?' sleep-repeat':'');partner.textContent=badge;if(m.type==='sleep')partner.setAttribute('aria-label','連續攝夢兩晚');wrap.append(partner);}marks.append(wrap);}b.append(marks);
   b.onclick=()=>{selectSeat(game,p.id);render();};$(container).append(b);
  }
 }
 $('next').disabled=!canNext(game);$('back').disabled=game.history.length===0;$('explodeOpen').disabled=!canSelfDestruct(game);
 $('saveStatus').textContent=storageOK?'':'無法保存本局，關閉頁面後資料可能遺失';
}
let drawTimeout=null,drawAnimating=false;
function displayDraw(){const d=game.draw;if(!d)return;$('drawPhase').textContent='抽籤結果';$('drawSpinner').hidden=true;$('drawSkip').hidden=true;$('drawClose').hidden=false;$('drawResult').textContent=d.seat+'號開始，'+(d.clockwise?'順':'逆')+'時針發言';$('drawOrder').textContent=(d.reference?'以'+d.reference+'號為基準。':'')+d.order.map(id=>id+'號').join(' → ');}
function finishDraw(){if(!drawAnimating)return;drawAnimating=false;clearTimeout(drawTimeout);drawTimeout=null;choose(game,'revealDraw');render();displayDraw();}
function startDraw(){if(!choose(game,'draw'))return;render();if(!$('drawDialog').open)$('drawDialog').showModal();if(game.draw.revealed){displayDraw();return;}drawAnimating=true;$('drawPhase').textContent='抽籤中…';$('drawResult').textContent='';$('drawOrder').textContent='';$('drawSpinner').hidden=false;$('drawSkip').hidden=false;$('drawClose').hidden=true;clearTimeout(drawTimeout);drawTimeout=setTimeout(finishDraw,1300);}
document.addEventListener('pointerdown',()=>{if(drawAnimating)finishDraw();});
$('drawSkip').onclick=finishDraw;$('drawClose').onclick=()=>$('drawDialog').close();$('drawDialog').addEventListener('cancel',e=>{if(drawAnimating){e.preventDefault();finishDraw();}});
const speechTimer=createSpeechTimer();let interval=null,paintingWheels=false,timerMode='setup',timerAnimation=null,timerGhost=null,timerGhostAnimation=null;
const wheels=[$('minuteWheel'),$('secondWheel')];
function paintWheels(force=false){
 paintingWheels=true;const state=speechTimer.view(),values=[Math.floor(state.seconds/60),state.seconds%60];
 wheels.forEach((wheel,i)=>{const locked=state.mode!=='setup';wheel.setAttribute('aria-disabled',String(locked));wheel.classList.toggle('locked',locked);wheel.querySelectorAll('button').forEach((option,index)=>{option.disabled=locked;option.setAttribute('aria-selected',String(index===values[i]));});if(force||!wheel.matches(':hover'))wheel.scrollTop=values[i]*40;});paintingWheels=false;
}
function timerPaint(){
 const state=speechTimer.tick();const changed=timerMode!==state.mode;
 if(changed){timerAnimation?.cancel();timerGhostAnimation?.cancel();timerGhost?.remove();timerGhost=null;
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&$('timerDialog').open){
   const old=$(timerMode==='setup'?'timerSetup':'timerCountdown'),rect=old.getBoundingClientRect(),dialogRect=$('timerDialog').getBoundingClientRect(),ghost=old.cloneNode(true);ghost.removeAttribute('id');ghost.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));ghost.setAttribute('aria-hidden','true');ghost.inert=true;Object.assign(ghost.style,{position:'absolute',left:(rect.left-dialogRect.left-$('timerDialog').clientLeft)+'px',top:(rect.top-dialogRect.top-$('timerDialog').clientTop)+'px',width:rect.width+'px',height:rect.height+'px',pointerEvents:'none',zIndex:'2'});$('timerDialog').append(ghost);ghost.querySelectorAll('.time-wheel').forEach((e,i)=>e.scrollTop=wheels[i].scrollTop);timerGhost=ghost;timerGhostAnimation=ghost.animate([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.96)'}],{duration:300,easing:'ease-out'});timerGhostAnimation.onfinish=()=>{ghost.remove();if(timerGhost===ghost)timerGhost=null;};
  }
 }
 timerMode=state.mode;
 $('timerSetup').hidden=state.mode!=='setup';$('timerCountdown').hidden=state.mode!=='countdown';$('timerStart').hidden=state.mode!=='setup';$('timerPause').hidden=state.mode!=='countdown';
 $('timerPause').textContent=state.running?'暫停':'繼續';$('timerPause').disabled=state.seconds===0;
 $('timerDigits').textContent=String(Math.floor(state.seconds/60)).padStart(2,'0')+':'+String(state.seconds%60).padStart(2,'0');
 if(state.mode==='setup')paintWheels(changed);
 const progress=timerProgress(state);$('timerCountdown').dataset.tone=progress.tone;$('timerRingProgress').style.strokeDashoffset=String(1-progress.ratio);
 if(changed){timerAnimation?.cancel();if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&$('timerDialog').open)timerAnimation=$(state.mode==='setup'?'timerSetup':'timerCountdown').animate([{opacity:0,transform:'scale(.96)'},{opacity:1,transform:'scale(1)'}],{duration:300,easing:'ease-out'});}
 if(state.mode==='countdown'&&state.seconds===0){clearInterval(interval);interval=null;$('timerNotice').textContent='時間到';}
}
function timerStop(){speechTimer.pause();clearInterval(interval);interval=null;timerPaint();}
function setSeconds(value){speechTimer.defaults();speechTimer.set(value);$('timerNotice').textContent='';timerPaint();paintWheels(true);}
function ensureTimerInterval(){clearInterval(interval);interval=speechTimer.view().running?setInterval(timerPaint,250):null;}
wheels.forEach((wheel,i)=>{
 const update=value=>{const state=speechTimer.view();if(state.mode!=='setup')return;speechTimer.set(i===0?wheelSeconds(value,state.seconds%60):wheelSeconds(Math.floor(state.seconds/60),value));};
 for(let value=0;value<=(i===0?10:59);value++){const option=document.createElement('button');option.type='button';option.id='timer-'+i+'-'+value;option.setAttribute('role','option');option.tabIndex=-1;option.textContent=String(value).padStart(2,'0');option.onclick=()=>{update(value);paintWheels(true);};wheel.append(option);}
 wheel.addEventListener('scroll',()=>{if(speechTimer.view().mode!=='setup'||paintingWheels||!$('timerDialog').open||$('timerSetup').hidden)return;const value=Math.min(i===0?10:59,Math.max(0,Math.round(wheel.scrollTop/40)));update(value);wheel.querySelectorAll('button').forEach((option,index)=>option.setAttribute('aria-selected',String(index===value)));});
 wheel.addEventListener('keydown',event=>{if(speechTimer.view().mode!=='setup'||!['ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();const seconds=speechTimer.view().seconds,value=(i===0?Math.floor(seconds/60):seconds%60)+(event.key==='ArrowDown'?1:-1);if(value<0||value>(i===0?10:59))return;update(value);paintWheels(true);});
});
$('timerOpen').onclick=()=>{$('timerDialog').showModal();timerPaint();if(speechTimer.view().mode==='setup')paintWheels(true);};$('timerClose').onclick=()=>$('timerDialog').close();
$('timerStart').onclick=()=>{speechTimer.start();ensureTimerInterval();$('timerNotice').textContent='';timerPaint();};
$('timerPause').onclick=()=>{if(speechTimer.view().running)speechTimer.pause();else speechTimer.resume();ensureTimerInterval();timerPaint();};
$('timerRestore').onclick=()=>{speechTimer.reset();ensureTimerInterval();$('timerNotice').textContent='';timerPaint();paintWheels(true);};
$('timerReset').onclick=()=>{speechTimer.defaults();ensureTimerInterval();$('timerNotice').textContent='';timerPaint();paintWheels(true);};
function adjustSeconds(delta){if(speechTimer.view().mode!=='setup')return;speechTimer.set(speechTimer.view().seconds+delta);$('timerNotice').textContent='';paintWheels(true);}
$('timerMinus').onclick=()=>adjustSeconds(-10);$('timerPlus').onclick=()=>adjustSeconds(10);
let finishIntent=null;
function confirmFinish(intent){finishIntent=intent;$('finishDialogTitle').textContent=intent==='restart'?'重新一局':'回首頁';$('finishDialogText').textContent=intent==='restart'?'保留本局板子與房規，清除全部前局紀錄並重新開始？':'清除本局全部紀錄並返回首頁？';$('finishDialog').showModal();}
$('playAgain').onclick=()=>confirmFinish('restart');$('finishHome').onclick=()=>confirmFinish('home');$('finishCancel').onclick=()=>$('finishDialog').close();
$('finishConfirm').onclick=()=>{$('finishDialog').close();timerStop();setSeconds(60);$('nightRecap').replaceChildren();$('winnerTitle').textContent='';$('winnerReason').textContent='';if(finishIntent==='restart'){game=restartGame(game);render();}else{game=null;try{localStorage.removeItem(KEY);}catch{}show('home');}};
$('duelOpen').onclick=()=>{if(beginDuel(game))render();};$('duelCancel').onclick=()=>$('duelDialog').close();$('duelConfirm').onclick=()=>{if(confirmDuel(game)){$('duelDialog').close();render();}};
$('next').onclick=()=>{if(game.step==='duel'){if(canNext(game))$('duelDialog').showModal();return;}if(needsInfectionDecision(game)){$('infectionDialog').showModal();return;}if(next(game))render();};
$('infectionCancel').onclick=()=>$('infectionDialog').close();
$('infectionDecline').onclick=()=>{if(choose(game,'declineInfection')&&next(game)){$('infectionDialog').close();render();}};
$('infectionConfirm').onclick=()=>{if(choose(game,'confirmInfection')&&next(game)){ $('infectionDialog').close();render();}};
$('back').onclick=()=>{previous(game);render();};
$('reset').onclick=()=>$('resetDialog').showModal();$('resetCancel').onclick=()=>$('resetDialog').close();$('resetConfirm').onclick=()=>{$('resetDialog').close();timerStop();clearTimeout(drawTimeout);drawAnimating=false;game=null;try{localStorage.removeItem(KEY);}catch{}show('home');};
$('boardsNormal').onclick=()=>{selectedCategory='normal';drawBoards();};$('boardsSpecial').onclick=()=>{selectedCategory='special';drawBoards();};
$('identityOpen').onclick=()=>{$('identityReview').showModal();$('identityReview').scrollTop=0;};$('identityReview').onclick=e=>{const r=$('identityReview').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('identityReview').close();};
$('start').onclick=()=>show('counts');$('encyclopediaOpen').onclick=()=>library('home');$('hostLibrary').onclick=()=>library('host');
document.title=BRANDING.name+'｜'+BRANDING.subtitle;document.querySelector('.home-brand h1').textContent=BRANDING.name;document.querySelector('.home-brand p').textContent=BRANDING.subtitle;
for(const a of HOME_ACTIONS)$(a.id).textContent=a.label;
for(const count of PLAYER_COUNTS){const button=document.createElement('button');button.dataset.count=count;button.textContent=count+'人局';$('countChoices').append(button);}
document.querySelectorAll('[data-home]').forEach(b=>b.onclick=()=>show('home'));document.querySelectorAll('[data-count]').forEach(b=>b.onclick=()=>chooseCount(Number(b.dataset.count)));$('boardBack').onclick=()=>show('counts');
$('setupBack').onclick=()=>{drawBoards();show('boards');};$('setupStart').onclick=()=>{game=createGame(selectedBoard,{...(BOARDS[selectedBoard].roles.beauty?{poisonRomance:$('rulePoisonRomance').value==='true',lastWolfRomance:$('ruleLastWolfRomance').value==='true'}:{}),sheriff:$('ruleSheriff').value==='true',selfRescue:$('ruleSelfRescue').value==='true',victory:'edge',swallow:$('ruleSwallow').value==='true',...(selectedBoard==='evilKnight12'?{immuneNightGun:$('ruleImmuneNightGun').value==='true'}:{}),...(BOARDS[selectedBoard].roles.idiot?{idiotChase:$('ruleIdiotChase').value==='true'}:{}),...(BOARDS[selectedBoard].roles.mechanical?{mechanicalKnife:$('ruleMechanicalKnife').value,reflectPoison:$('ruleReflectPoison').value==='true',shieldMode:$('ruleShieldMode').value}:{})});timerStop();setSeconds(60);render();};
$('rulesOpen').onclick=()=>{$('gameRules').textContent=rulesText(boardOf(game),game.rules);$('rulesDialog').showModal();};$('rulesClose').onclick=()=>$('rulesDialog').close();
$('explodeOpen').onclick=()=>{if(beginSelfDestruct(game)){timerPaint();timerStop();render();}};
$('libraryWolves').onclick=()=>{libraryCamp='wolf';drawLibrary();};$('libraryGood').onclick=()=>{libraryCamp='good';drawLibrary();};$('libraryReturn').onclick=()=>libraryOrigin==='host'?render():show('home');
$('previewCard').onclick=()=>{const flipped=$('previewCard').classList.toggle('flipped');$('previewCard').setAttribute('aria-pressed',String(flipped));$('previewFront').setAttribute('aria-hidden',String(flipped));$('previewBack').setAttribute('aria-hidden',String(!flipped));$('previewFront').inert=flipped;$('previewBack').inert=!flipped;};
$('rolePreview').onclick=e=>{if(e.target===$('rolePreview')||e.target.classList.contains('preview-returnhint'))$('rolePreview').close();};
if(game&&screen!=='home')render();else show('home');
if(screen==='host'&&game&&['draw','dayDraw'].includes(game.step)&&game.draw&&!game.draw.revealed)startDraw();
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(()=>{});
$('problemReport').href=REPORT_URL;
const updateViewport=()=>{const viewport=window.visualViewport;document.documentElement.style.setProperty('--app-height',(viewport&&viewport.scale===1?viewport.height:window.innerHeight)+'px');};
updateViewport();window.addEventListener('resize',updateViewport);window.visualViewport?.addEventListener('resize',updateViewport);
if('serviceWorker' in navigator){const resumePrecache=()=>{cacheForeground();navigator.serviceWorker.controller?.postMessage({type:'RESUME_PRECACHE'});};navigator.serviceWorker.addEventListener('controllerchange',resumePrecache);navigator.serviceWorker.ready.then(resumePrecache);window.addEventListener('online',resumePrecache);document.addEventListener('visibilitychange',()=>{if(!document.hidden)resumePrecache();});}
