// 主持字幕只取自使用者原句；法官操作提示不屬於字幕。
import {ROLE_DATA,BOARDS} from './data.js';
import {settleNight,trueWinner,basicActor,mechanicalAbility,ordinaryWolves} from './night.js';
export {mechanicalAbility} from './night.js';
export const ROLES=Object.fromEntries(Object.entries(ROLE_DATA).map(([id,r])=>[id,r.name]));
export const boardOf=s=>BOARDS[s.boardId || '12'];
export const SCRIPT = {
  confirm: '請確認角色身分', dark: '天黑請閉眼', magician: '魔術師請睜眼',
  exchange: '選擇你今晚要交換的對象', magicianClose: '魔術師請閉眼',
  wolves: '狼人請睜眼 確認彼此角色身分', attack: '選擇你們今晚要襲擊的對象',
  witch: '女巫請睜眼', antidote: '今晚他死了，你要使用解藥嗎？',
  poison: '你要使用毒藥嗎?你要毒誰呢?', witchClose: '女巫請閉眼',
  seer: '預言家請睜眼', inspect: '選擇你今晚要查驗的對象', seerClose: '預言家請閉眼',
  hunter: '獵人請睜眼', gesture: '今晚的開槍手勢', hunterClose: '獵人請閉眼',
  dawn: '天亮請睜眼', candidates: '現在開始競選警長，候選人請起立', draw: '請抽發言順序',
  withdraw: '要退水的玩家請坐下', sheriffVote: '現在進行投票 3 2 1請投票',
  sheriffPK: '請平手玩家依序再次發表政見', sheriffRevote: '再次準備投票',
  direction: '警長決定警左警右', badgeTransfer: '請警長移交警徽',
  voteIntro: '現在進行投票', exileVote: '3 2 1請投票', exileRevote:'3 2 1請投票', noExile:'無人出局，進入下一晚',
  mediumIdentify:'通靈師請舉手', mediumIdentified:'通靈師手放下', guard:'守衛請睜眼', guardTarget:'今晚你要守護的對象是？', guardClose:'守衛請閉眼', mechanical:'機械狼請睜眼', mechanicalAction:'-', mechanicalClose:'機械狼請閉眼', medium:'通靈師請睜眼', mediumInspect:'選擇你今晚要查驗的對象', mediumClose:'通靈師請閉眼'
};
const blankNight = () => ({ exchange: [], noExchange: false, attack: null, emptyAttack: false, antidote: null, poison: null, poisonTarget: null, inspect: null, guard:null,guardSkip:false,learnTarget:null,learnSkip:false,extraAttack:null,extraAttackSkip:false,mechanicalInspect:null,mechanicalPoison:null,mechanicalPoisonSkip:false,shield:null,shieldSkip:false,mediumInspect:null });
export function createGame(boardId='12',rules={}) {
  const b=BOARDS[boardId];if(!b)throw new Error('Unknown board');const config={...b.defaults,...rules};
  if(!['edge','city'].includes(config.victory)||!['sheriff','selfRescue','swallow'].every(k=>typeof config[k]==='boolean'))throw new Error('Invalid rules');
  if(b.roles.mechanical&&(!['next','allDead'].includes(config.mechanicalKnife)||typeof config.reflectPoison!=='boolean'))throw new Error('Invalid mechanical rules');
  return { version: 4,boardId,rules:config, step: 'confirm', night: 1, players: Array.from({length:12}, (_,i) => ({ id:i+1, role:null,active:i<b.playerCount, alive:i<b.playerCount })),
    mechanical:{role:null,target:null,night:null,poison:true,shield:true},lastGuard:null,operation:null,nightResolution:null,rolesConfirmed:false, action:[], choice:null, nightAction:blankNight(), potions:{antidote:true,poison:true},
    candidates:[], nominees:[], sheriff:null, draw:null, drawCache:{}, pendingBadge:null, deathsCommitted:false,
    deaths:[], queue:[], continuation:null,
    votePool:[], winner:null, log:[], history:[],speaker:null,usedExchanges:[],electionStatus:config.sheriff?'pending':'none',preSheriffExplosions:0,badgeSwallowed:false,resumeElection:false,announcementContinuation:'direction',electionTie:false };
}
const clone = x => structuredClone(x);
const player = (s,id) => s.players.find(p=>p.id===id);
const wolves = p => ROLE_DATA[p.role]?.kind==='wolf';
const gods = p => ROLE_DATA[p.role]?.kind==='god';
const livingRole = (s,role) => s.players.some(p=>p.alive && (role==='wolves' ? wolves(p) : p.role===role));
export function upgradeGame(saved) {
  if (![1,2,3,4].includes(saved?.version) || saved.players?.length!==12 || !Array.isArray(saved.history)) throw new Error('Invalid saved game');
  const migrate = old => {
    const s={...createGame(old.boardId || '12'),...old,version:4}; delete s.direction;
    s.players=s.players.map(p=>({...p,active:p.active ?? true}));
    if(old.version<3){
      s.rules={...boardOf(s).defaults,selfRescue:true,...old.rules};
      s.electionStatus=s.sheriff?'elected':(s.night===1 && !['sheriffResult','announcement','direction','dayDraw','discussion','voteIntro','exileVote','exilePK','exileRevote','lastWords','eliminated','skill','badgeTransfer','nextNight','finished'].includes(s.step)?'pending':'none');
      const past=new Map();for(const h of old.history || [])if(h.night<s.night)past.set(h.night,h.nightAction?.exchange || []);
      s.usedExchanges=[...new Set([...past.values()].flat().concat(s.step==='exchange'?[]:s.nightAction.exchange))];
    }
    s.nightAction={...blankNight(),...old.nightAction};
    s.mechanical={...createGame(s.boardId).mechanical,...old.mechanical};
    s.drawCache=old.drawCache || {};
    s.nominees=old.nominees || [...s.candidates];
    s.queue=(old.queue || []).map(d=>({...d,noticeDone:d.noticeDone ?? d.wordsDone ?? false}));
    if (old.version===1 && old.draw) {
      const pool=s.candidates.filter(id=>player(s,id)?.alive);
      if(pool.length) {
        const order=orderedSeats(pool,old.draw.seat,old.draw.clockwise);
        s.draw={...old.draw,seat:order[0],order,signature:drawSignature(s,'draw'),revealed:true};
        s.drawCache[`election:${s.night}`]=clone(s.draw);
      } else s.draw=null;
    }
    if(s.step==='direction' && !s.sheriff) {s.step='dayDraw';s.draw=null;}
    return s;
  };
  const s=migrate(saved);s.history=saved.history.map(migrate);return s;
}
// 座位環以號碼遞增為順時針，左側為逆時針、右側為順時針。
export function orderedSeats(pool,seat,clockwise,count=12) {
  return [...pool].sort((a,b)=> {
    const distance=id=>clockwise?(id-seat+count)%count:(seat-id+count)%count;
    return distance(a)-distance(b);
  });
}
export function drawPool(s,step=s.step) {
  return s.players.filter(p=>p.alive && (step==='draw'?s.candidates.includes(p.id):true)).map(p=>p.id);
}
const drawKey=(s,step=s.step)=>`${step==='draw'?'election':'day'}:${s.night}`;
function drawSignature(s,step=s.step) {
  return JSON.stringify([drawPool(s,step),step==='dayDraw'?s.deaths.map(d=>d.id):[]]);
}
function restoreDraw(s) {
  const cached=s.drawCache?.[drawKey(s)];
  s.draw=cached?.signature===drawSignature(s)?clone(cached):null;
}
export function drawResult(s,random=Math.random) {
  const pool=drawPool(s);if(!pool.length)return null;
  const pick=items=>items[Math.floor(random()*items.length)];
  const reference=s.step==='dayDraw' && s.deaths.length ? pick(s.deaths).id : null;
  const clockwise=random()<0.5;
  const count=boardOf(s).playerCount;
  const order=reference ? orderedSeats(pool,(reference+(clockwise?1:count-1)-1)%count+1,clockwise,count) : orderedSeats(pool,pick(pool),clockwise,count);
  return {seat:order[0],clockwise,reference,order,signature:drawSignature(s),revealed:false};
}
export const winner=trueWinner;
export function mapTarget(s,id) {
  const [a,b] = s.nightAction.exchange;
  return id === a ? b : id === b ? a : id;
}
export function potionBlocked(s,type) {
  if (!livingRole(s,'witch')) return '女巫已出局';
  if (!s.potions[type] && s.nightAction[type] !== true) return type==='antidote' ? '解藥已使用' : '毒藥已使用';
  if (type==='poison' && s.nightAction.antidote===true) return '本晚已使用解藥，毒藥不可使用';
  if (type==='antidote' && s.nightAction.poison===true) return '本晚已使用毒藥，解藥不可使用';
  if (type==='antidote' && !s.nightAction.attack) return '本晚空刀，解藥不可使用';
  if(type==='antidote' && !s.rules.selfRescue && player(s,s.nightAction.attack)?.role==='witch')return '本局不允許女巫自救';
  return '';
}
function roleForStep(s) {
  if (s.step==='wolves') return boardOf(s).roles.king?(s.action.length?'wolf':'king'):'wolf';
  if(s.step==='mediumIdentify')return 'medium';
  return ['magician','witch','seer','hunter','guard','mechanical'].includes(s.step) ? s.step : null;
}
export function selectable(s,id) {
  const p=player(s,id); if (!p?.active || !p.alive || s.winner) return false;
  if (!s.rolesConfirmed && roleForStep(s)) return s.action.includes(id) || !p.role;
  if(s.step==='guardTarget')return livingRole(s,'guard')&&id!==s.lastGuard;
  if(s.step==='mediumInspect')return livingRole(s,'medium');
  if(s.step==='mechanicalAction')return livingRole(s,'mechanical')&&(s.operation==='learnTarget'?!s.mechanical.role&&p.role!=='mechanical':s.operation===mechanicalAbility(s));
  if (['exchange','attack','inspect'].includes(s.step)) return (s.step==='attack'?!!basicActor(s):livingRole(s, {exchange:'magician',inspect:'seer'}[s.step])) && (s.step!=='exchange'||!s.usedExchanges.includes(id));
  if (s.step==='poison') return s.nightAction.poison===true && !potionBlocked(s,'poison');
  if (s.step==='skill') return id !== s.queue[0]?.id && !!player(s,skillTarget(s,id))?.alive;
  if(s.step==='selfDestruct')return ['wolf','king'].includes(p.role);
  if(s.step==='discussion')return true;
  if (s.step==='badgeTransfer') return true;
  if (s.step==='candidates') return true;
  if (['speeches','withdraw'].includes(s.step)) return (s.nominees.length?s.nominees:s.candidates).includes(id);
  if (['sheriffVote','sheriffRevote','exileVote','exileRevote'].includes(s.step)) return s.votePool.includes(id);
  return false;
}
export function selectSeat(s,id) {
  if (!selectable(s,id)) return false;
  const role=roleForStep(s);
  if (!s.rolesConfirmed && role) {
    if (s.action.includes(id)) {
      // 移除狼身分後以剩下的點選順序重標黑狼王、三狼。
      s.action=s.action.filter(n=>n!==id); player(s,id).role=null;
    } else if (s.action.length < (s.step==='wolves'?boardOf(s).roles.wolf+(boardOf(s).roles.king||0):1)) s.action.push(id);
    else if(s.step!=='wolves') {player(s,s.action[0]).role=null;s.action=[id];}
    else return false;
    s.action.forEach((n,i)=>player(s,n).role=s.step==='wolves' ? (boardOf(s).roles.king&&!i?'king':'wolf') : role);
  } else if(s.step==='discussion'){s.speaker=s.speaker===id?null:id;
  } else if (s.step==='candidates') {
    s.candidates=s.candidates.includes(id)?s.candidates.filter(n=>n!==id):[...s.candidates,id]; s.choice='confirmed';
  } else if (['speeches','withdraw'].includes(s.step)) {
    s.candidates=s.candidates.includes(id)?s.candidates.filter(n=>n!==id):[...s.candidates,id].sort((a,b)=>a-b);
  } else if (s.step==='exchange' || s.choice==='tie') {
    if (s.step==='exchange') {s.nightAction.noExchange=false; s.choice=null;}
    const max=s.step==='exchange'?2:12;
    s.action=s.action.includes(id)?s.action.filter(n=>n!==id):s.action.length<max?[...s.action,id]:s.action;
    if (s.step==='exchange') s.nightAction.exchange=[...s.action];
  } else {
    s.action=s.action.includes(id)?[]:[id]; s.choice=s.action.length?'target':null;
    const target=s.action[0] || null;
    if (s.step==='attack') { s.nightAction.attack=target; s.nightAction.emptyAttack=false; }
    if (s.step==='inspect') s.nightAction.inspect=target;
    if (s.step==='poison') s.nightAction.poisonTarget=target;
    if(s.step==='guardTarget'){s.nightAction.guard=target;s.nightAction.guardSkip=false;}
    if(s.step==='mediumInspect')s.nightAction.mediumInspect=target;
    if(s.step==='mechanicalAction'){s.nightAction[s.operation]=target;s.nightAction[s.operation==='learnTarget'?'learnSkip':s.operation+'Skip']=false;}
  }
  return true;
}
export function choose(s,value) {
  if (s.winner) return false;
  const n=s.nightAction;
  if(s.step==='mechanicalAction'){
    const modes=mechanicalModes(s);
    if(value.startsWith('mode:')){const mode=value.slice(5);if(!modes.includes(mode))return false;s.operation=mode;s.action=n[mode]?[n[mode]]:[];s.choice=null;return true;}
    if(value!=='skip'||!s.operation||s.operation==='mechanicalInspect')return false;
    const key=s.operation==='learnTarget'?'learnSkip':s.operation+'Skip';n[key]=!n[key];n[s.operation]=null;s.action=[];s.choice=n[key]?'skip':null;return true;
  }
  if(s.step==='guardTarget'&&value==='skip'){n.guard=null;n.guardSkip=!n.guardSkip;s.action=[];s.choice=n.guardSkip?'skip':null;return true;}
  if (s.step==='exchange' && value==='skip') {s.action=[]; n.exchange=[]; n.noExchange=!n.noExchange;value=n.noExchange?'skip':null;}
  else if (s.step==='attack' && value==='skip') {s.action=[]; n.attack=null; n.emptyAttack=!n.emptyAttack;value=n.emptyAttack?'skip':null;}
  else if (['antidote','poison'].includes(s.step) && ['use','skip'].includes(value)) {
    const type=s.step; if (potionBlocked(s,type)) return false;
    const requested=value==='use';
    if(n[type]===true)s.potions[type]=true;
    n[type]=n[type]===requested?null:requested;
    if(n[type]===true)s.potions[type]=false;
    if(n[type]===null)value=null;
    if (type==='poison') {s.action=[];n.poisonTarget=null;}
  } else if (['skill','badgeTransfer'].includes(s.step) && value==='skip') {s.action=[];value=s.choice==='skip'?null:'skip';}
  else if (s.step==='candidates' && value==='none') {s.candidates=[];value=s.choice==='none'?null:'none';}
  else if (['sheriffVote','sheriffRevote','exileVote','exileRevote'].includes(s.step) && value==='tie') {s.action=[];value=s.choice==='tie'?null:'tie';}
  else if (['draw','dayDraw'].includes(s.step) && value==='draw') {
    restoreDraw(s);
    if(!s.draw)s.draw=drawResult(s);
    if(!s.draw)return false;
    s.drawCache[drawKey(s)]=clone(s.draw);
  } else if (['draw','dayDraw'].includes(s.step) && value==='revealDraw' && s.draw) {
    s.draw.revealed=true;s.drawCache[drawKey(s)]=clone(s.draw);
  }
  else return false;
  s.choice=value; return true;
}
export function canNext(s) {
  if(s.winner) return false;
  if (!s.rolesConfirmed && roleForStep(s)) return s.action.length===(s.step==='wolves'?boardOf(s).roles.wolf+(boardOf(s).roles.king||0):1);
  if (s.step==='exchange') return !livingRole(s,'magician') || s.nightAction.noExchange || s.action.length===2;
  if(s.step==='guardTarget')return !livingRole(s,'guard')||s.nightAction.guardSkip||!!s.nightAction.guard;
  if(s.step==='mediumInspect')return !livingRole(s,'medium')||!!s.nightAction.mediumInspect;
  if(s.step==='mechanicalAction')return mechanicalModes(s).every(mode=>!!s.nightAction[mode]||s.nightAction[mode==='learnTarget'?'learnSkip':mode+'Skip']);
  if (s.step==='attack') return !basicActor(s) || s.nightAction.emptyAttack || s.action.length===1;
  if (s.step==='inspect') return !livingRole(s,'seer') || s.action.length===1;
  if (s.step==='antidote') return !!potionBlocked(s,'antidote') || s.nightAction.antidote!==null;
  if (s.step==='poison') return !!potionBlocked(s,'poison') || s.nightAction.poison===false || (s.nightAction.poison===true && s.action.length===1);
  if (['skill','badgeTransfer'].includes(s.step)) return s.choice==='skip' || (s.action.length===1 && selectable(s,s.action[0]));
  if(s.step==='selfDestruct')return s.action.length===1 && selectable(s,s.action[0]);
  if (s.step==='candidates') return s.choice!==null;
  if (['draw','dayDraw'].includes(s.step)) return !!s.draw?.revealed;
  if (['sheriffVote','exileVote','sheriffRevote','exileRevote'].includes(s.step)) {
    return s.choice==='tie' ? (s.step.endsWith('Revote') || s.action.length>=2) : s.action.length===1;
  }
  return true;
}
function snapshot(s) { const {history,...rest}=s; return clone(rest); }
function enter(s,step) {s.step=step;s.action=[];s.choice=null;s.operation=step==='mechanicalAction'?mechanicalModes(s)[0]||null:null;if(['draw','dayDraw'].includes(step))restoreDraw(s);if(step==='discussion')s.speaker=!s.sheriff&&s.draw?.revealed?s.draw.seat:null;}
export function previous(s) {
  const old=s.history.pop(); if(!old)return false;
  const history=s.history,drawCache=s.drawCache; Object.assign(s,old);s.history=history;s.drawCache=drawCache;
  if(['draw','dayDraw'].includes(s.step))restoreDraw(s);
  return true;
}
export function nightDeaths(s) {return settleNight(s).deaths.map(({id,cause})=>({id,cause}));}
export function mechanicalModes(s){if(!livingRole(s,'mechanical'))return [];return s.mechanical.role?[mechanicalAbility(s)].filter(Boolean):['learnTarget'];}
export function roleName(s,p){const short={witch:'巫',medium:'通',hunter:'獵',guard:'守',wolf:'狼',villager:'民'};const role=s.mechanical.role||(s.nightAction.learnTarget?player(s,s.nightAction.learnTarget)?.role||'villager':null);return p.role==='mechanical'&&role?'機械狼（'+short[role]+'）':ROLES[p.role]||'未辨識';}
export function roleResult(s,id,trueRole=false){const p=player(s,id);if(!p?.active)return null;return p.role==='mechanical'&&!trueRole?(s.mechanical.role||p.role):p.role||'villager';}
function kill(s,deaths) {
  deaths.forEach(d=>{d.day??=s.night;d.context??=['attack','poison'].includes(d.cause)?'night':'day';d.sourceActor??=d.cause==='poison'?s.players.find(p=>p.role==='witch')?.id:null;d.sourceRole??=d.cause==='attack'?'wolves':d.sourceActor?player(s,d.sourceActor)?.role:null;player(s,d.id).alive=false;player(s,d.id).cause=d.cause;});
  if(s.sheriff && !player(s,s.sheriff).alive) {s.pendingBadge=s.sheriff;}
  s.candidates=s.candidates.filter(id=>player(s,id).alive);
  s.winner=winner(s);deaths.forEach(d=>{d.winChecked=true;d.winner=s.winner;});s.log.push({night:s.night,exchange:[...s.nightAction.exchange],deaths:clone(deaths)});
}
export function hasLastWords(s,d) {return (d.day??s.night)===1 || ['exile','selfDestruct'].includes(d.cause);}
function continueAfterDeaths(s) {
  if(s.winner)enter(s,'finished');
  else if(s.pendingBadge)enter(s,'badgeTransfer');
  else if(s.continuation==='pendingAnnouncement'){s.announcementContinuation='nextNight';enter(s,'announcement');}
  else if(s.continuation==='direction')enter(s,s.sheriff?'direction':'dayDraw');
  else enter(s,s.continuation);
}
function deathSteps(s) {
  if(s.winner){enter(s,'finished');return;}
  if(!s.queue.length){continueAfterDeaths(s);return;}
  const d=s.queue[0];
  if(!d.noticeDone) {enter(s,hasLastWords(s,d)?'lastWords':'eliminated');return;}
  if((ROLE_DATA[player(s,d.id).role]?.canShoot || (player(s,d.id).role==='mechanical'&&s.mechanical.role==='hunter')) && !['poison','selfDestruct'].includes(d.cause)) {enter(s,'skill');return;}
  s.queue.shift();deathSteps(s);
}
function startNight(s) {
  s.lastGuard=s.nightAction.guard;s.nightResolution=null;s.night++; s.nightAction=blankNight();s.draw=null;s.deaths=[];s.deathsCommitted=false;s.announcementContinuation='direction';enter(s,'dark');
}
function finishElection(s,tie=false) {s.electionStatus=s.sheriff?'elected':'none';s.resumeElection=false;s.electionTie=tie;enter(s,'sheriffResult');}
function electionAfterDawn(s){if(s.resumeElection)enter(s,'withdraw');else if(s.candidates.length<2){s.sheriff=s.candidates[0]||null;finishElection(s);}else enter(s,'draw');}
function prepareDawn(s){
  if(!s.rolesConfirmed){if(!Object.entries(boardOf(s).roles).filter(([r])=>r!=='villager').every(([r,c])=>s.players.filter(p=>p.role===r).length===c))return false;s.players.filter(p=>p.active&&!p.role).forEach(p=>p.role='villager');s.rolesConfirmed=true;}
  s.nightResolution=settleNight(s);s.deaths=s.nightResolution.deaths.sort((a,b)=>a.id-b.id);return true;
}
export function nightSteps(s){const parts={magician:['magician','exchange','magicianClose'],wolves:['wolves','attack'],witch:['witch','antidote','poison','witchClose'],seer:['seer','inspect','inspectResult','seerClose'],hunter:['hunter','gesture','hunterClose'],mediumIdentify:['mediumIdentify','mediumIdentified'],guard:['guard','guardTarget','guardClose'],mechanical:['mechanical','mechanicalAction','mechanicalClose'],medium:['medium','mediumInspect','mediumResult','mediumClose']};const b=boardOf(s);return ['dark',...(s.night===1&&b.firstNightOrder?b.firstNightOrder:b.nightOrder).flatMap(r=>parts[r]),'dawn'];}
export function phaseOf(s){return s.step==='confirm'||s.step==='candidates'||nightSteps(s).includes(s.step)&&s.step!=='dawn'?'夜晚':'白天';}
const INTERRUPTIBLE=['draw','speeches','withdraw','sheriffVote','sheriffPK','sheriffRevote','discussion','voteIntro','exileVote','exilePK','exilePKStart','exileRevote'];
export function canSelfDestruct(s){return !s.winner && INTERRUPTIBLE.includes(s.step) && ordinaryWolves(s).length>0;}
export function beginSelfDestruct(s){if(!canSelfDestruct(s))return false;s.history.push(snapshot(s));enter(s,'selfDestruct');return true;}
export function skillTarget(s,id){const actor=s.queue[0];return player(s,actor?.id)?.role==='hunter' && actor.cause==='attack'?mapTarget(s,id):id;}
export function next(s) {
  if(!canNext(s))return false;
  s.history.push(snapshot(s));
  const step=s.step;
  if(step==='confirm') enter(s,'dark');
  else if(nightSteps(s).includes(step) && step!=='dawn') {
    if(step==='mechanicalAction'){
      const n=s.nightAction;
      if(!s.mechanical.role&&n.learnTarget){s.mechanical.role=player(s,n.learnTarget).role||'villager';s.mechanical.target=n.learnTarget;s.mechanical.night=s.night;}
      if(n.shield)s.mechanical.shield=false;if(n.mechanicalPoison)s.mechanical.poison=false;
    }
    if(step==='exchange')s.usedExchanges=[...new Set([...s.usedExchanges,...s.nightAction.exchange])];
    const steps=nightSteps(s);let upcoming=steps[steps.indexOf(step)+1];
    if(upcoming==='dawn') {
      if(!prepareDawn(s)){previous(s);return false;}
      if(s.night===1 && s.rules.sheriff)upcoming='candidates';
    }
    enter(s,upcoming);
  } else if(step==='dawn') {
    if(s.electionStatus==='pending' && (s.night===1 || s.resumeElection))electionAfterDawn(s);else enter(s,'announcement');
  } else if(step==='candidates') {
    s.nominees=[...s.candidates];
    enter(s,'dawn');
  } else if(step==='draw') enter(s,'speeches');
  else if(step==='speeches') enter(s,'withdraw');
  else if(step==='withdraw') {
    if(s.candidates.length<2){s.sheriff=s.candidates[0]||null;finishElection(s);}
    else {s.votePool=[...s.candidates];enter(s,'sheriffVote');}
  } else if(['sheriffVote','sheriffRevote'].includes(step)) {
    if(s.choice==='tie' && step==='sheriffVote') {s.votePool=[...s.action];enter(s,'sheriffPK');}
    else {s.sheriff=s.choice==='tie'?null:s.action[0];finishElection(s,s.choice==='tie');}
  } else if(step==='sheriffPK') enter(s,'sheriffRevote');
  else if(step==='sheriffResult') enter(s,'announcement');
  else if(step==='announcement') {
    if(!s.deathsCommitted) {
      s.deaths=s.deaths.filter(d=>player(s,d.id).alive).sort((a,b)=>a.id-b.id);
      kill(s,s.deaths);if(s.nightResolution?.winner)s.winner=s.nightResolution.winner;s.queue=s.deaths.map(d=>({...d,multi:s.deaths.length>1,day:s.night,context:'night'}));s.continuation=s.announcementContinuation;s.deathsCommitted=true;
    }
    deathSteps(s);
  } else if(['lastWords','eliminated'].includes(step)) {s.queue[0].noticeDone=true;deathSteps(s);}
  else if(step==='skill') {
    const actor=s.queue[0],target=s.choice==='skip'?null:skillTarget(s,s.action[0]);s.queue.shift();
    if(target) {const d={id:target,cause:'shot',day:s.night,context:'day',sourceActor:actor.id};kill(s,[d]);s.queue.unshift(d);}
    deathSteps(s);
  } else if(step==='selfDestruct') {
    const id=s.action[0];if(s.electionStatus==='pending'){s.preSheriffExplosions++;s.resumeElection=true;if(s.rules.swallow && s.preSheriffExplosions>=boardOf(s).swallowThreshold){s.badgeSwallowed=true;s.electionStatus='none';s.resumeElection=false;}}
    const d={id,cause:'selfDestruct',day:s.night,context:'day',sourceActor:id};kill(s,[d]);s.queue=[d];s.continuation=!s.deathsCommitted?'pendingAnnouncement':'nextNight';deathSteps(s);
  } else if(step==='badgeTransfer') {
    s.sheriff=s.choice==='skip'?null:s.action[0];s.pendingBadge=null;continueAfterDeaths(s);
  } else if(step==='direction' || step==='dayDraw') enter(s,'discussion');
  else if(step==='discussion') enter(s,'voteIntro');
  else if(step==='voteIntro') {s.votePool=s.players.filter(p=>p.alive).map(p=>p.id);enter(s,'exileVote');}
  else if(['exileVote','exileRevote'].includes(step)) {
    if(s.choice==='tie') {
      if(step==='exileVote'){s.votePool=[...s.action].sort((a,b)=>a-b);enter(s,'exilePK');}
      else enter(s,'noExile');
    } else {
      const d={id:s.action[0],cause:'exile',day:s.night,context:'day'};kill(s,[d]);s.queue=[d];s.continuation='nextNight';deathSteps(s);
    }
  } else if(step==='exilePK') enter(s,'exilePKStart');
  else if(step==='exilePKStart') enter(s,'exileRevote');
  else if(step==='noExile')startNight(s);
  else if(step==='nextNight') startNight(s);
  return true;
}
export function subtitle(s) {
  if(s.step==='exilePK')return '請'+s.votePool.map(id=>id+'號').join('、')+'PK 發言';
  if(s.step==='exilePKStart')return '由'+s.votePool[0]+'號開始發言';
  if(s.step==='wolves' && s.night>1)return '狼人請睜眼';
  if(s.step==='speeches') return `${s.draw.seat}號${s.draw.clockwise?'順':'逆'}時針發表政見`;
  if(s.step==='sheriffResult') return s.sheriff?`${s.sheriff}號當選警長`:s.electionTie?'雙方再次平票，本局將沒有警長':'';
  if(s.step==='announcement') return s.deaths.length?s.deaths.length>1?`${s.deaths.map(d=>d.id+'號').join('、')}玩家被殺死`:`昨晚${s.deaths[0].id}號被殺死`: '昨晚是平安夜';
  if(s.step==='lastWords') return s.queue[0].cause==='selfDestruct'?`${s.queue[0].id}號玩家選擇自爆，請發表遺言`:s.queue[0].multi?`請${s.queue[0].id}號玩家發表遺言`:`${s.queue[0].id}號玩家出局，請發表遺言`;
  if(s.step==='eliminated') return `${s.queue[0].id}號玩家淘汰，沒有遺言。`;
  if(s.step==='skill') return `${s.queue[0].id}號玩家，啟動角色技能`;
  // 沒有定稿台詞的頁面不新增主持字幕。
  return SCRIPT[s.step] || '';
}
export function inspection(s) {
  return s.nightAction.inspect ? (wolves(player(s,mapTarget(s,s.nightAction.inspect)))?'down':'up') : '';
}
