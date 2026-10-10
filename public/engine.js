// 主持字幕只取自使用者原句；法官操作提示不屬於字幕。
import {ROLE_DATA,BOARDS} from './data.js';
import {settleNight,trueWinner,basicActor,mechanicalAbility,ordinaryWolves,extraKnifeUnlocked,revengeAvailable,canTrade,tradeOutcome,luckyAbility,inspectedWolf,winnerReason,mapTarget,feared,fearedRole,forcedEmpty,eligibleVoters,eligibleExileTarget,bloodSealed,skillBlocked} from './night.js';
import {recordStage,recordDeaths,nightRecord} from './records.js';
export {mechanicalAbility,mapTarget,eligibleVoters,mixedResult} from './night.js';
export const ROLES=Object.fromEntries(Object.entries(ROLE_DATA).map(([id,r])=>[id,r.name]));
export const boardOf=s=>BOARDS[s.boardId || '12'];
export const SCRIPT = {
  demon:'獵魔人請睜眼',hunt:'請選擇今晚要狩獵的玩家',demonClose:'獵魔人請閉眼',
  idiot:'白痴請睜眼',idiotClose:'白痴請閉眼',mixed:'混血兒請睜眼',roleModel:'選擇你要跟隨的榜樣',mixedClose:'混血兒請閉眼',
  brothers:'狼兄狼弟請睜眼，請確認彼此身分',brothersClose:'狼兄狼弟請閉眼',younger:'狼弟請睜眼',revenge:'選擇你要復仇的對象',youngerClose:'狼弟請閉眼',merchant:'黑市商人請睜眼',trade:'選擇你要交易的對象',merchantClose:'黑市商人請閉眼',lucky:'幸運兒請睜眼',luckyAction:'你要使用技能嗎',luckyClose:'幸運兒請閉眼',
  nightmare:'夢魘請睜眼',fear:'選擇你今晚要恐懼的對象',nightmareClose:'夢魘請閉眼',dream:'攝夢人請睜眼',sleep:'選擇你今晚要夢遊的對象',dreamClose:'攝夢人請閉眼',
  confirm: '請確認角色身分', dark: '天黑請閉眼', magician: '魔術師請睜眼',
  exchange: '選擇你今晚要交換的對象', magicianClose: '魔術師請閉眼',
  wolves: '狼人請睜眼，確認彼此身分', attack: '選擇你們今晚要襲擊的對象',
  witch: '女巫請睜眼', antidote: '今晚他死了，你要使用解藥嗎？',
  poison: '你要使用毒藥嗎?你要毒誰呢?', witchClose: '女巫請閉眼',
  seer: '預言家請睜眼', inspect: '選擇你今晚要查驗的對象', seerClose: '預言家請閉眼',
  hunter: '獵人請睜眼', gesture: '今晚的開槍手勢', hunterClose: '獵人請閉眼',
  dawn: '天亮請睜眼', candidates: '現在開始競選警長，候選人請起立', draw: '請抽發言順序',
  withdraw: '要退水的玩家請坐下', sheriffVote: '現在進行投票，3、2、1  請投票',
  sheriffPK: '請平手玩家依序再次發表政見', sheriffRevote: '再次進行投票，3、2、1  請投票',
  direction: '警長決定警左警右', badgeTransfer: '請警長移交警徽',
  voteIntro: '現在進行投票', exileVote: '3、2、1  請投票', exileRevote:'3、2、1  請投票', noExile:'無人出局，進入下一晚',
  mediumIdentify:'通靈師請舉手', mediumIdentified:'通靈師手放下', guard:'守衛請睜眼', guardTarget:'今晚你要守護的對象是？', guardClose:'守衛請閉眼', mechanical:'機械狼請睜眼', mechanicalAction:'-', mechanicalClose:'機械狼請閉眼', medium:'通靈師請睜眼', mediumInspect:'選擇你今晚要查驗的對象', mediumClose:'通靈師請閉眼'
};
const blankNight = () => ({ exchange: [], noExchange: false, attack: null, emptyAttack: false, antidote: null, poison: null, poisonTarget: null, inspect: null, guard:null,guardSkip:false,learnTarget:null,learnSkip:false,extraAttack:null,extraAttackSkip:false,mechanicalInspect:null,mechanicalPoison:null,mechanicalPoisonSkip:false,shield:null,shieldSkip:false,mediumInspect:null,revenge:null,revengeSkip:false,tradeTarget:null,tradeAbility:null,tradeSkip:false,luckyInspect:null,luckyPoison:null,luckySkip:false,fear:null,fearSkip:false,fearApplied:false,sleep:null,sleepApplied:false,repeatPending:null,repeatExecuted:false,forcedAttackReason:null,roleModel:null,hunt:null,huntSkip:false,huntApplied:false,huntSuccess:null,huntDeath:null,huntResolved:false });
export function createGame(boardId='12',rules={}) {
  const b=BOARDS[boardId];if(!b)throw new Error('Unknown board');const config={...b.defaults,...rules};
  if(!['edge','city'].includes(config.victory)||!['sheriff','selfRescue','swallow'].every(k=>typeof config[k]==='boolean'))throw new Error('Invalid rules');
  if(b.roles.idiot&&typeof config.idiotChase!=='boolean')throw new Error('Invalid idiot rule');
  if(b.roles.mechanical&&(!['next','allDead'].includes(config.mechanicalKnife)||typeof config.reflectPoison!=='boolean'))throw new Error('Invalid mechanical rules');
  return { version: 9,
    blood:{actor:null,selfDestructDay:null,sealNight:null,lastPending:false,lastActor:null,lastTarget:null,lastEvent:null},
    idiot:{seat:null,revealed:false,revealedDay:null,revealedStage:null,voteLost:false,exileBanned:false,countsEliminatedForVictory:false},mixed:{seat:null,target:null,targetRole:null,camp:null,chosen:false,night:null},boardId,rules:config, step: 'confirm', night: 1, players: Array.from({length:12}, (_,i) => ({ id:i+1, role:null,active:i<b.playerCount, alive:i<b.playerCount })),
    lastFear:null,lastSleep:null,nightState:{wolfDone:false,postDone:false,deaths:[],batches:[],winningStage:null},
    brothers:{elderDeath:null,revengeNight:null,revengeUsed:false,revengeUsedNight:null,joinNight:null},merchant:{used:false,usedNight:null,target:null,ability:null,success:null},lucky:null,nightRecords:[],recapExpanded:[1],dayEvents:[],winnerReason:null,legacyRecap:false,
    mechanical:{role:null,target:null,night:null,poison:true,shield:true,extraUnlocked:false,extraUsed:false,extraUsedNight:null,extraTarget:null},marks:[],markSequence:0,noSheriffReason:null,noSheriffNoticeShown:false,swallowNoticeNight:null,swallowNoticeShown:false,lastGuard:null,operation:null,nightResolution:null,rolesConfirmed:false, action:[], choice:null, nightAction:blankNight(), potions:{antidote:true,poison:true},
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
  if (![1,2,3,4,5,6,7,8,9].includes(saved?.version) || saved.players?.length!==12 || !Array.isArray(saved.history)) throw new Error('Invalid saved game');
  if(saved.version===9)return clone(saved);
  const migrate = (old,past=[]) => {
    const s={...createGame(old.boardId || '12'),...old,version:9}; delete s.direction;
    s.blood={...createGame(s.boardId).blood,...old.blood};
    s.idiot={...createGame(s.boardId).idiot,...old.idiot};s.mixed={...createGame(s.boardId).mixed,...old.mixed};
    s.brothers={...createGame(s.boardId).brothers,...old.brothers};s.merchant={...createGame(s.boardId).merchant,...old.merchant};
    if(old.version<6){s.legacyRecap=true;s.nightRecords=old.nightRecords||[];} // Old saves have no complete operation snapshots; do not fabricate a recap.
    s.players=s.players.map(p=>({...p,active:p.active ?? true}));
    if(old.version<3){
      s.rules={...boardOf(s).defaults,selfRescue:true,...old.rules};
      s.electionStatus=s.sheriff?'elected':(s.night===1 && !['sheriffResult','announcement','direction','dayDraw','discussion','voteIntro','exileVote','exilePK','exileRevote','lastWords','eliminated','skill','badgeTransfer','nextNight','finished'].includes(s.step)?'pending':'none');
      const past=new Map();for(const h of old.history || [])if(h.night<s.night)past.set(h.night,h.nightAction?.exchange || []);
      s.usedExchanges=[...new Set([...past.values()].flat().concat(s.step==='exchange'?[]:s.nightAction.exchange))];
    }
    s.nightAction={...blankNight(),...old.nightAction};
    s.mechanical={...createGame(s.boardId).mechanical,...old.mechanical};
    if(old.version<5){
      const spent=[...past,...(old.history||[]),old].filter(h=>h.nightAction?.extraAttack&&h.step!=='mechanicalAction'&&h.step!=='mechanical'&&h.step!=='dark'&&h.night>=s.mechanical.night);
      if(spent.length){const used=spent[0];Object.assign(s.mechanical,{extraUsed:true,extraUsedNight:used.night,extraTarget:used.nightAction.extraAttack});}
      if(s.badgeSwallowed&&!s.swallowNoticeShown)s.swallowNoticeNight=s.night+(s.step==='nextNight'?1:0);
    }
    if(old.version<5){const rebuilt={nightAction:blankNight(),marks:[],markSequence:0};for(const h of [...past,...(old.history||[])].filter(h=>h.night===s.night)){rebuilt.nightAction={...blankNight(),...h.nightAction};syncMarks(rebuilt);}s.marks=rebuilt.marks;s.markSequence=rebuilt.markSequence;}
    syncMarks(s);
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
    if(!Object.hasOwn(old,'history'))delete s.history;
    if(s.step==='direction' && !s.sheriff) {s.step='dayDraw';s.draw=null;}
    return s;
  };
  const s=migrate(saved);s.history=saved.history.map((h,i)=>migrate(h,h.version<5?saved.history.slice(0,i):[]));return s;
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
export function potionBlocked(s,type) {
  if(fearedRole(s,'witch'))return '當晚受到恐懼，無法使用技能';
  if(bloodSealed(s))return '當晚神職技能封鎖';
  if (!livingRole(s,'witch')) return '女巫已出局';
  if (!s.potions[type] && s.nightAction[type] !== true) return type==='antidote' ? '解藥已使用' : '毒藥已使用';
  if (type==='poison' && s.nightAction.antidote===true) return '本晚已使用解藥，毒藥不可使用';
  if (type==='antidote' && s.nightAction.poison===true) return '本晚已使用毒藥，解藥不可使用';
  if (type==='antidote' && !s.nightAction.attack) return '今晚沒有狼刀目標';
  if(type==='antidote' && !s.rules.selfRescue && player(s,s.nightAction.attack)?.role==='witch')return '本局不允許女巫自救';
  return '';
}
function roleForStep(s) {
  if (s.step==='wolves') return (boardOf(s).roles.king||boardOf(s).roles.blood)?(s.action.length?'wolf':boardOf(s).roles.king?'king':'blood'):'wolf';
  if(s.step==='brothers')return s.action.length?'younger':'elder';
  if(s.step==='merchant')return 'merchant';
  if(s.step==='mediumIdentify')return 'medium';
  return ['magician','witch','seer','hunter','guard','mechanical','nightmare','dream','idiot','mixed','demon'].includes(s.step) ? s.step : null;
}
export function selectable(s,id) {
  const p=player(s,id); if (!p?.active || !p.alive || s.winner) return false;
  if (!s.rolesConfirmed && roleForStep(s)) return s.action.includes(id) || !p.role;
  if(s.step==='lastBlade')return s.blood.lastPending&&id!==s.blood.lastActor;
  if(s.step==='hunt')return s.night>1&&livingRole(s,'demon')&&!skillBlocked(s,'demon')&&p.role!=='demon';
  if(s.step==='roleModel')return s.night===1&&!s.mixed.chosen&&livingRole(s,'mixed')&&p.role!=='mixed';
  if(s.step==='fear')return livingRole(s,'nightmare')&&p.role!=='nightmare'&&id!==s.lastFear;
  if(s.step==='sleep')return livingRole(s,'dream')&&!fearedRole(s,'dream')&&p.role!=='dream';
  if(s.step==='revenge')return revengeAvailable(s);
  if(s.step==='trade')return canTrade(s)&&p.role!=='merchant';
  if(s.step==='luckyAction')return !!luckyAbility(s)&&s.lucky.remaining>0;
  if(s.step==='guardTarget')return livingRole(s,'guard')&&id!==s.lastGuard;
  if(s.step==='mediumInspect')return livingRole(s,'medium');
  if(s.step==='mechanicalAction')return livingRole(s,'mechanical')&&(s.operation==='learnTarget'?!s.mechanical.role&&p.role!=='mechanical':s.operation===mechanicalAbility(s));
  if (['exchange','attack','inspect'].includes(s.step)) return (s.step==='attack'?!!basicActor(s)&&!forcedEmpty(s):livingRole(s, {exchange:'magician',inspect:'seer'}[s.step])) && (s.step!=='exchange'||!s.usedExchanges.includes(id))&&(s.step!=='attack'||p.role!=='elder')&&(s.step!=='inspect'||!skillBlocked(s,'seer'));
  if (s.step==='poison') return s.nightAction.poison===true && !potionBlocked(s,'poison');
  if (s.step==='skill') return id !== s.queue[0]?.id && !!player(s,skillTarget(s,id))?.alive;
  if(s.step==='selfDestruct')return ['wolf','king','younger','nightmare','blood'].includes(p.role);
  if(s.step==='discussion')return true;
  if (s.step==='badgeTransfer') return id!==s.pendingBadge&&eligibleExileTarget(s,p);
  if (s.step==='candidates') return eligibleVoters(s).some(v=>v.id===id);
  if (['speeches','withdraw'].includes(s.step)) return (s.nominees.length?s.nominees:s.candidates).includes(id);
  if (['sheriffVote','sheriffRevote','exileVote','exileRevote'].includes(s.step)) return s.votePool.includes(id)&&(!s.step.startsWith('exile')||eligibleExileTarget(s,p));
  return false;
}
export function selectSeat(s,id) {
  if (!selectable(s,id)) return false;
  const role=roleForStep(s);
  if (!s.rolesConfirmed && role) {
    if (s.action.includes(id)) {
      // 移除狼身分後以剩下的點選順序重標黑狼王、三狼。
      s.action=s.action.filter(n=>n!==id); player(s,id).role=null;
    } else if (s.action.length < identityCount(s)) s.action.push(id);
    else if(!['wolves','brothers'].includes(s.step)) {player(s,s.action[0]).role=null;s.action=[id];}
    else return false;
    s.action.forEach((n,i)=>player(s,n).role=s.step==='wolves' ? ((boardOf(s).roles.king||boardOf(s).roles.blood)&&!i?(boardOf(s).roles.king?'king':'blood'):'wolf') : s.step==='brothers'?(i?'younger':'elder'):role);
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
    if(s.step==='hunt'){s.nightAction.hunt=target;s.nightAction.huntSkip=false;}
    if(s.step==='roleModel')s.nightAction.roleModel=target;
    if(s.step==='fear'){s.nightAction.fear=target;s.nightAction.fearSkip=false;}
    if(s.step==='sleep'){s.nightAction.sleep=target;s.nightAction.repeatPending=target&&target===s.lastSleep?target:null;}
    if(s.step==='revenge'){s.nightAction.revenge=target;s.nightAction.revengeSkip=false;}
    if(s.step==='trade'){s.nightAction.tradeTarget=target;s.nightAction.tradeSkip=false;}
    if(s.step==='luckyAction'){s.nightAction[s.lucky.ability==='inspect'?'luckyInspect':'luckyPoison']=target;s.nightAction.luckySkip=false;}
    if (s.step==='attack') { s.nightAction.attack=target; s.nightAction.emptyAttack=false; }
    if (s.step==='inspect') s.nightAction.inspect=target;
    if (s.step==='poison') s.nightAction.poisonTarget=target;
    if(s.step==='guardTarget'){s.nightAction.guard=target;s.nightAction.guardSkip=false;}
    if(s.step==='mediumInspect')s.nightAction.mediumInspect=target;
    if(s.step==='mechanicalAction'){s.nightAction[s.operation]=target;s.nightAction[s.operation==='learnTarget'?'learnSkip':s.operation+'Skip']=false;}
  }
  syncMarks(s);return true;
}
export function choose(s,value) {
  if (s.winner) return false;
  const n=s.nightAction;
  if(s.step==='hunt'){if(value!=='skip'||s.night<2||!livingRole(s,'demon')||skillBlocked(s,'demon'))return false;n.hunt=null;n.huntSkip=!n.huntSkip;s.action=[];s.choice=n.huntSkip?'skip':null;syncMarks(s);return true;}
  if(s.step==='attack'&&forcedEmpty(s))return false;
  if(s.step==='fear'&&value==='skip'&&livingRole(s,'nightmare')){n.fear=null;n.fearSkip=!n.fearSkip;s.action=[];s.choice=n.fearSkip?'skip':null;syncMarks(s);return true;}
  if(s.step==='trade'){
    if(!canTrade(s))return false;
    if(value.startsWith('gift:')&&['inspect','poison','gun'].includes(value.slice(5))){n.tradeAbility=value.slice(5);n.tradeSkip=false;return true;}
    if(value!=='skip')return false;n.tradeTarget=null;n.tradeAbility=null;n.tradeSkip=!n.tradeSkip;s.action=[];s.choice=n.tradeSkip?'skip':null;syncMarks(s);return true;
  }
  if(s.step==='revenge'||s.step==='luckyAction'){
    if(value!=='skip'||(s.step==='revenge'?!revengeAvailable(s):!luckyAbility(s)||s.lucky.remaining<1))return false;
    const key=s.step==='revenge'?'revengeSkip':'luckySkip';n[key]=!n[key];if(s.step==='revenge')n.revenge=null;else {n.luckyInspect=null;n.luckyPoison=null;}s.action=[];s.choice=n[key]?'skip':null;syncMarks(s);return true;
  }
  if(s.step==='skill'&&value.startsWith('gun:')){const source=value.slice(4);if(!gunSources(s,s.queue[0]).includes(source))return false;s.operation=source;s.action=[];s.choice=null;return true;}
  if(s.step==='mechanicalAction'){
    const modes=mechanicalModes(s);
    if(value.startsWith('mode:')){const mode=value.slice(5);if(!modes.includes(mode))return false;s.operation=mode;s.action=n[mode]?[n[mode]]:[];s.choice=null;return true;}
    if(value!=='skip'||!s.operation||s.operation==='mechanicalInspect')return false;
    const key=s.operation==='learnTarget'?'learnSkip':s.operation+'Skip';n[key]=!n[key];n[s.operation]=null;s.action=[];s.choice=n[key]?'skip':null;syncMarks(s);return true;
  }
  if(s.step==='guardTarget'&&value==='skip'){n.guard=null;n.guardSkip=!n.guardSkip;s.action=[];s.choice=n.guardSkip?'skip':null;syncMarks(s);return true;}
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
  s.choice=value;syncMarks(s); return true;
}
function identityCount(s){return s.step==='wolves'?boardOf(s).roles.wolf+(boardOf(s).roles.king||0)+(boardOf(s).roles.blood||0):s.step==='brothers'?2:1;}
export function canNext(s) {
  if(s.step==='lastBlade')return !s.winner&&s.action.length===1&&selectable(s,s.action[0]);
  if(s.step==='hunt')return !s.winner&&s.night>1&&(!livingRole(s,'demon')||skillBlocked(s,'demon')||s.nightAction.huntSkip||!!s.nightAction.hunt);
  if(s.winner) return s.step==='dawn';
  if (!s.rolesConfirmed && roleForStep(s)) return s.action.length===identityCount(s);
  if(s.step==='roleModel')return s.night===1&&(s.mixed.chosen||!!s.nightAction.roleModel&&selectable(s,s.nightAction.roleModel));
  if(s.step==='fear')return !livingRole(s,'nightmare')||s.nightAction.fearSkip||!!s.nightAction.fear;
  if(s.step==='sleep')return !livingRole(s,'dream')||fearedRole(s,'dream')||!!s.nightAction.sleep;
  if(s.step==='revenge')return !revengeAvailable(s)||s.nightAction.revengeSkip||!!s.nightAction.revenge;
  if(s.step==='trade')return !canTrade(s)||s.nightAction.tradeSkip||!!s.nightAction.tradeTarget&&!!s.nightAction.tradeAbility;
  if(s.step==='luckyAction')return !luckyAbility(s)||s.lucky.remaining<1||s.nightAction.luckySkip||!!s.nightAction[s.lucky.ability==='inspect'?'luckyInspect':'luckyPoison'];
  if (s.step==='exchange') return !livingRole(s,'magician') || s.nightAction.noExchange || s.action.length===2;
  if(s.step==='guardTarget')return !livingRole(s,'guard')||s.nightAction.guardSkip||!!s.nightAction.guard;
  if(s.step==='mediumInspect')return !livingRole(s,'medium')||!!s.nightAction.mediumInspect;
  if(s.step==='mechanicalAction')return mechanicalModes(s).every(mode=>!!s.nightAction[mode]||s.nightAction[mode==='learnTarget'?'learnSkip':mode+'Skip']);
  if (s.step==='attack') return forcedEmpty(s)||!basicActor(s) || s.nightAction.emptyAttack || s.action.length===1;
  if (s.step==='inspect') return skillBlocked(s,'seer')||!livingRole(s,'seer') || s.action.length===1;
  if (s.step==='antidote') return !!potionBlocked(s,'antidote') || s.nightAction.antidote!==null;
  if (s.step==='poison') return !!potionBlocked(s,'poison') || s.nightAction.poison===false || (s.nightAction.poison===true && s.action.length===1);
  if (['skill','badgeTransfer'].includes(s.step)) return s.choice==='skip' || (s.action.length===1 && selectable(s,s.action[0]));
  if(s.step==='selfDestruct')return s.action.length===1 && selectable(s,s.action[0]);
  if (s.step==='candidates') return s.choice!==null;
  if (['draw','dayDraw'].includes(s.step)) return !!s.draw?.revealed;
  if (['sheriffVote','exileVote','sheriffRevote','exileRevote'].includes(s.step)) {
    return s.action.every(id=>selectable(s,id))&&(s.choice==='tie' ? (s.step.endsWith('Revote') || s.action.length>=2) : s.action.length===1);
  }
  return true;
}
// Marks follow original judge inputs; source keys keep independent attacks.
export function syncMarks(s){
 const n=s.nightAction,desired=[];
 const add=(key,type,id,partner=null)=>{if(id)desired.push({key,type,id,partner});};
 if(n.exchange.length===2){add('swapA','swap',n.exchange[0],n.exchange[1]);add('swapB','swap',n.exchange[1],n.exchange[0]);}
 add('hunt','hunt',n.hunt);
 add('roleModel','role-model',n.roleModel);
 add('fear','fear',n.fear);add('sleep','sleep',n.sleep);
 add('basic','wolf-attack',n.attack);
 if(n.antidote===true)add('antidote','antidote',n.attack);
 if(n.poison===true)add('poison','poison',n.poisonTarget);
 add('guard','shield',n.guard);add('shield','shield',n.shield);
 add('extra','wolf-attack',n.extraAttack);add('mechanicalPoison','poison',n.mechanicalPoison);
 add('inspect','inspect',n.inspect);add('revenge','wolf-attack',n.revenge);add('learn','learn',n.learnTarget);add('trade','trade',n.tradeTarget);
 add('luckyInspect','inspect',n.luckyInspect);add('luckyPoison','poison',n.luckyPoison);
 add('mediumInspect','inspect',n.mediumInspect);add('mechanicalInspect','inspect',n.mechanicalInspect);
 s.marks=(s.marks||[]).filter(m=>desired.some(d=>d.key===m.key&&d.id===m.id&&d.partner===m.partner));
 for(const d of desired)if(!s.marks.some(m=>m.key===d.key)){s.markSequence=(s.markSequence||0)+1;s.marks.push({...d,sequence:s.markSequence});}
}
export function markersForSeat(s,id){return (s.marks||[]).filter(m=>m.id===id).sort((a,b)=>a.sequence-b.sequence);}
function snapshot(s) { const {history,...rest}=s; return clone(rest); }
function enter(s,step) {if(step==='attack'&&forcedEmpty(s)){s.nightAction.attack=null;s.nightAction.emptyAttack=true;s.nightAction.forcedAttackReason='fear';syncMarks(s);}if(step==='mechanicalAction')s.mechanical.extraUnlocked ||= extraKnifeUnlocked(s);s.step=step;s.action=[];s.choice=null;s.operation=step==='mechanicalAction'?mechanicalModes(s)[0]||null:step==='skill'?gunSources(s,s.queue[0])[0]||null:null;if(['draw','dayDraw'].includes(step))restoreDraw(s);if(step==='discussion')s.speaker=!s.sheriff&&s.draw?.revealed?s.draw.seat:null;}
export function previous(s) {
  const old=s.history.pop(); if(!old)return false;
  const history=s.history,drawCache=s.drawCache; Object.assign(s,old);s.history=history;s.drawCache=drawCache;
  if(['draw','dayDraw'].includes(s.step))restoreDraw(s);
  return true;
}
export function nightDeaths(s) {return settleNight(s).deaths.map(({id,cause})=>({id,cause}));}
export function mechanicalModes(s){if(!livingRole(s,'mechanical'))return [];return s.mechanical.role?[mechanicalAbility(s)].filter(Boolean):['learnTarget'];}
export function roleName(s,p){const short={witch:'巫',medium:'通',hunter:'獵',guard:'守',wolf:'狼',villager:'民'};const role=s.mechanical.role||(s.nightAction.learnTarget?player(s,s.nightAction.learnTarget)?.role||'villager':null);
 let name=p.role==='mechanical'&&role?'機械狼（'+short[role]+'）':ROLES[p.role]||'未辨識';
 if(p.role==='idiot'&&s.idiot?.revealed)name='白痴・已翻牌';
 if(p.role==='mixed'){const target=s.mixed?.target||(s.night===1?s.nightAction.roleModel:null);if(target)name='混血兒（'+((s.mixed?.camp|| (ROLE_DATA[player(s,target)?.role]?.kind==='wolf'?'狼人陣營':'好人陣營'))==='狼人陣營'?'狼':'好')+'）';}
 if(s.lucky?.seat===p.id)name+='（幸）';return name;
}
export function roleResult(s,id,trueRole=false){const p=player(s,id);if(!p?.active)return null;return p.role==='mechanical'&&!trueRole?(s.mechanical.role||p.role):p.role||'villager';}
export function restartGame(s){return createGame(s.boardId,{...s.rules});}
export function gunSources(s,d){
 if(s.winner||!d||['poison','selfDestruct','dreamRepeat','dreamLink'].includes(d.cause)||d.context==='night'&&(d.day??s.night)===s.night&&feared(s,d.id))return [];
 const p=player(s,d.id),sources=[];
 if((ROLE_DATA[p?.role]?.canShoot||(p?.role==='mechanical'&&s.mechanical.role==='hunter'))&&!d.nativeGunDone)sources.push('native');
 if(s.lucky?.seat===d.id&&s.lucky.ability==='gun'&&s.lucky.remaining>0&&(d.context==='day'||s.deathsCommitted)&&s.night>=s.lucky.unlockDay)sources.push('lucky');
 return sources;
}
function kill(s,deaths) {
  deaths.forEach(d=>{d.day??=s.night;d.context??=['attack','poison','tradeFailure','dreamRepeat','dreamLink','hunt'].includes(d.cause)?'night':'day';d.sourceActor??=d.cause==='poison'?s.players.find(p=>p.role==='witch')?.id:null;d.sourceRole??=d.cause==='attack'?'wolves':d.sourceActor?player(s,d.sourceActor)?.role:null;if(player(s,d.id).role==='elder'&&s.brothers.elderDeath===null)Object.assign(s.brothers,{elderDeath:{night:s.night,context:d.context,cause:d.cause},revengeNight:s.night+1,joinNight:s.night+2});
    if(player(s,d.id).role==='idiot')Object.assign(s.idiot,{seat:d.id,countsEliminatedForVictory:true});
    player(s,d.id).alive=false;player(s,d.id).cause=d.cause;});
  if(s.sheriff && !player(s,s.sheriff).alive) {s.pendingBadge=s.sheriff;}
  s.candidates=s.candidates.filter(id=>player(s,id).alive);
  s.winner=winner(s);s.winnerReason=winnerReason(s);recordDeaths(s,deaths);deaths.forEach(d=>{d.winChecked=true;d.winner=s.winner;});s.log.push({night:s.night,exchange:[...s.nightAction.exchange],deaths:clone(deaths)});
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
  if(gunSources(s,d).length) {enter(s,'skill');return;}
  s.queue.shift();deathSteps(s);
}
function startNight(s) {
  s.lastFear=s.nightAction.fearApplied?s.nightAction.fear:null;s.lastSleep=s.nightAction.sleepApplied?s.nightAction.sleep:null;s.nightState={wolfDone:false,postDone:false,deaths:[],batches:[],winningStage:null};
  s.marks=[];s.lastGuard=s.nightAction.guard;s.nightResolution=null;s.night++; s.nightAction=blankNight();s.draw=null;s.deaths=[];s.deathsCommitted=false;s.announcementContinuation='direction';enter(s,'dark');
  if(bloodSealed(s)){const r=nightRecord(s);if(!r.events.some(e=>e.key==='bloodSeal'))r.events.push({key:'bloodSeal',night:s.night,stage:'dark',order:-1,actors:[s.blood.actor],actorRole:'blood',displayRole:'blood',skill:null,rawTargets:[],effectiveTargets:[],result:'當晚神職技能封鎖',executed:true});}
}
function finishElection(s,tie=false) {s.electionStatus=s.sheriff?'elected':'none';s.resumeElection=false;s.electionTie=tie;enter(s,'sheriffResult');}
function afterDawn(s){if(s.noSheriffReason&&!s.noSheriffNoticeShown)enter(s,'noSheriffNotice');else if(s.electionStatus==='pending'&&(s.night===1||s.resumeElection))electionAfterDawn(s);else enter(s,'announcement');}
function electionAfterDawn(s){if(s.resumeElection)enter(s,'withdraw');else if(s.candidates.length<2){s.sheriff=s.candidates[0]||null;finishElection(s);}else enter(s,'draw');}
function confirmRoles(s){
 if(s.rolesConfirmed)return true;
 if(!Object.entries(boardOf(s).roles).filter(([r])=>r!=='villager').every(([r,c])=>s.players.filter(p=>p.role===r).length===c))return false;
 s.players.filter(p=>p.active&&!p.role).forEach(p=>p.role='villager');s.rolesConfirmed=true;return true;
}
function nightProjection(s,resolution){const projected={...s,players:clone(s.players)};for(const d of resolution.deaths)player(projected,d.id).alive=false;return projected;}
function commitNightPhase(s,phase,stage){
 const r=settleNight(s,{phase}),state=s.nightState;
 state.wolfDone=true;if(phase==='all'||phase==='dawn')state.postDone=true;
 const previousIds=new Set(state.deaths.map(d=>d.id));
 r.events=r.events.map(e=>({...e,executed:true,applied:!e.blocked}));
 state.deaths=clone(r.deaths);state.batches.push({stage,batch:r.batch,deaths:clone(r.deaths.filter(d=>!previousIds.has(d.id))),events:clone(r.events.filter(e=>phase==='wolf'||e.cause!=='attack')),winner:r.winner});
 s.nightResolution=r;s.deaths=clone(r.deaths).sort((a,b)=>a.id-b.id);
 const record=nightRecord(s);record.deaths=s.deaths.map(d=>({...clone(d),context:'night',day:s.night}));
 for(const event of record.events){
  if(['wolf-attack','antidote'].includes(event.skill))event.executed=true;
  if(event.skill==='poison')event.executed=(phase==='all'||phase==='dawn')&&!r.poisonSkipped;
  if(event.skill==='hunt'){event.executed=phase==='dawn'&&!r.poisonSkipped;event.result=event.executed?(s.nightAction.huntSuccess?'狩獵成功：'+s.nightAction.hunt+'號死亡':'狩獵失敗：'+s.nightAction.huntDeath+'號獵魔人死亡'):null;}
  if(event.key==='sleep')event.result=r.events.some(e=>e.source==='dreamRepeat'&&e.id===event.rawTargets[0])?'連續攝夢致死':null;
 }
 s.nightAction.huntResolved=r.events.some(e=>e.source==='hunt');
 s.nightAction.repeatExecuted=r.events.some(e=>e.source==='dreamRepeat');
 if(r.winner){s.winner=r.winner;s.winnerReason=winnerReason(nightProjection(s,r),r.winner);state.winningStage=stage;record.settled=true;return true;}
 return false;
}
function resolveAtStage(s,step){
 // Freeze confirmed damage at the earliest point its defenses are known.
 const attackIndex=nightSteps(s).indexOf('attack'),index=nightSteps(s).indexOf(step);
 if(!s.nightState.wolfDone&&index>=attackIndex&&(step==='antidote'||s.nightAction.antidote!==null||!!potionBlocked(s,'antidote'))){
  if(commitNightPhase(s,'wolf',step))return true;
 }
 if(s.nightState.wolfDone&&['poison','trade','luckyAction'].includes(step)){
  if(commitNightPhase(s,'all',step))return true;
 }
 // First-night role registration may complete after an earlier damage batch.
 if(s.rolesConfirmed&&s.nightResolution){const projected=nightProjection(s,s.nightResolution),win=trueWinner(projected);if(win){s.winner=win;s.winnerReason=winnerReason(projected,win);s.nightState.winningStage=step;nightRecord(s).settled=true;return true;}}
 return false;
}
function prepareDawn(s){
 if(!confirmRoles(s))return false;
 if(!s.nightState.wolfDone)commitNightPhase(s,'wolf','dawn');
 if(!s.winner)commitNightPhase(s,'dawn','dawn');
 nightRecord(s).settled=true;return true;
}
export function nightSteps(s){const parts={demon:s.night===1?['demon','demonClose']:['demon','hunt','demonClose'],idiot:['idiot','idiotClose'],mixed:['mixed','roleModel','mixedClose'],nightmare:['nightmare','fear','nightmareClose'],dream:['dream','sleep','dreamClose'],brothers:['brothers','brothersClose'],younger:['younger','revenge','youngerClose'],merchant:['merchant','trade','merchantClose'],lucky:s.night===1?['lucky','luckyClose']:['lucky','luckyAction','luckyClose'],magician:['magician','exchange','magicianClose'],wolves:['wolves','attack'],witch:['witch','antidote','poison','witchClose'],seer:['seer','inspect','inspectResult','seerClose'],hunter:['hunter','gesture','hunterClose'],mediumIdentify:['mediumIdentify','mediumIdentified'],guard:['guard','guardTarget','guardClose'],mechanical:['mechanical','mechanicalAction','mechanicalClose'],medium:['medium','mediumInspect','mediumResult','mediumClose']};const b=boardOf(s);return ['dark',...(s.night===1&&b.firstNightOrder?b.firstNightOrder:b.nightOrder).flatMap(r=>parts[r]),'dawn'];}
export function phaseOf(s){return s.step==='confirm'||s.step==='candidates'||nightSteps(s).includes(s.step)&&s.step!=='dawn'?'夜晚':'白天';}
const INTERRUPTIBLE=['draw','dayDraw','direction','sheriffResult','speeches','withdraw','sheriffVote','sheriffPK','sheriffRevote','discussion','voteIntro','exileVote','exilePK','exilePKStart','exileRevote'];
export function canSelfDestruct(s){return !s.winner && INTERRUPTIBLE.includes(s.step) && s.players.some(p=>p.alive&&['wolf','king','younger','nightmare','blood'].includes(p.role));}
export function beginSelfDestruct(s){if(!canSelfDestruct(s))return false;s.history.push(snapshot(s));enter(s,'selfDestruct');return true;}
export function skillTarget(s,id){const actor=s.queue[0];return player(s,actor?.id)?.role==='hunter' && actor.cause==='attack'?mapTarget(s,id):id;}
export function next(s) {
  if(!canNext(s))return false;
  s.history.push(snapshot(s));
  const step=s.step;
  if(step==='confirm') enter(s,'dark');
  else if(nightSteps(s).includes(step) && step!=='dawn') {
    recordStage(s,step,nightSteps(s).indexOf(step));
    if(step==='hunt'){const n=s.nightAction;n.huntApplied=!!n.hunt&&!skillBlocked(s,'demon');n.huntSuccess=n.huntApplied?ROLE_DATA[player(s,n.hunt).role].kind==='wolf':null;n.huntDeath=n.huntApplied?(n.huntSuccess?n.hunt:s.players.find(p=>p.role==='demon').id):null;}
    if(step==='fear')s.nightAction.fearApplied=!!s.nightAction.fear;
    if(step==='sleep')s.nightAction.sleepApplied=!!s.nightAction.sleep&&!fearedRole(s,'dream');
    if(roleForStep(s))confirmRoles(s);
    if(step==='idiot')s.idiot.seat=s.players.find(p=>p.role==='idiot')?.id||null;
    if(step==='mixed')s.mixed.seat=s.players.find(p=>p.role==='mixed')?.id||null;
    if(step==='roleModel'&&!s.mixed.chosen){const target=player(s,s.nightAction.roleModel);Object.assign(s.mixed,{seat:s.players.find(p=>p.role==='mixed').id,target:target.id,targetRole:target.role,camp:ROLE_DATA[target.role].kind==='wolf'?'狼人陣營':'好人陣營',chosen:true,night:s.night});}
    if(step==='revenge'&&revengeAvailable(s)){s.brothers.revengeUsed=true;s.brothers.revengeUsedNight=s.night;}
    if(step==='trade'&&canTrade(s)&&s.nightAction.tradeTarget){
      const n=s.nightAction,success=tradeOutcome(s,n.tradeTarget);Object.assign(s.merchant,{used:true,usedNight:s.night,target:n.tradeTarget,ability:n.tradeAbility,success});
      if(success)s.lucky={seat:n.tradeTarget,sourceActor:s.players.find(p=>p.role==='merchant').id,originalRole:player(s,n.tradeTarget).role||'villager',ability:n.tradeAbility,grantedNight:s.night,unlockNight:s.night+1,unlockDay:s.night,remaining:1,usedNight:null,target:null};
    }
    if(step==='luckyAction'&&luckyAbility(s)&&s.lucky.remaining>0){const target=s.nightAction[s.lucky.ability==='inspect'?'luckyInspect':'luckyPoison'];if(target)Object.assign(s.lucky,{remaining:0,usedNight:s.night,target});}
    if(step==='mechanicalAction'){
      const n=s.nightAction;
      if(!s.mechanical.role&&n.learnTarget){s.mechanical.role=player(s,n.learnTarget).role||'villager';s.mechanical.target=n.learnTarget;s.mechanical.night=s.night;}
      if(n.extraAttack){s.mechanical.extraUsed=true;s.mechanical.extraUsedNight=s.night;s.mechanical.extraTarget=n.extraAttack;}
      if(n.shield)s.mechanical.shield=false;if(n.mechanicalPoison)s.mechanical.poison=false;
    }
    if(step==='exchange')s.usedExchanges=[...new Set([...s.usedExchanges,...s.nightAction.exchange])];
    if(resolveAtStage(s,step)){enter(s,'dawn');return true;}
    const steps=nightSteps(s);let upcoming=steps[steps.indexOf(step)+1];
    if(upcoming==='dawn') {
      if(!prepareDawn(s)){previous(s);return false;}
      if(!s.winner&&s.night===1 && s.rules.sheriff)upcoming='candidates';
    }
    enter(s,upcoming);
  } else if(step==='dawn') {
    if(s.winner){kill(s,s.deaths);s.deathsCommitted=true;enter(s,'finished');return true;}
    if(s.badgeSwallowed&&!s.swallowNoticeShown&&s.night===s.swallowNoticeNight)enter(s,'swallowNotice');else afterDawn(s);
  } else if(step==='candidates') {
    s.nominees=[...s.candidates];
    if(!s.candidates.length||s.candidates.length===s.players.filter(p=>p.active&&p.alive).length){s.noSheriffReason=s.candidates.length?'all':'none';s.electionStatus='none';s.resumeElection=false;s.sheriff=null;}
    enter(s,'dawn');
  } else if(step==='noSheriffNotice'){s.noSheriffNoticeShown=true;enter(s,'announcement');}
  else if(step==='swallowNotice'){s.swallowNoticeShown=true;afterDawn(s);}
  else if(step==='draw') enter(s,'speeches');
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
      kill(s,s.deaths);if(s.nightResolution?.winner)s.winner=s.nightResolution.winner;s.winnerReason=winnerReason(s,s.winner);nightRecord(s).settled=true;s.queue=s.deaths.map(d=>({...d,multi:s.deaths.length>1,day:s.night,context:'night',noticeDone:s.night>1}));s.continuation=s.announcementContinuation;s.deathsCommitted=true;
    }
    deathSteps(s);
  } else if(['lastWords','eliminated'].includes(step)) {s.queue[0].noticeDone=true;deathSteps(s);}
  else if(step==='skill') {
    const actor=s.queue[0],source=s.operation||gunSources(s,actor)[0],target=s.choice==='skip'?null:skillTarget(s,s.action[0]);
    if(source==='lucky')Object.assign(s.lucky,{remaining:0,usedNight:s.night,target});else actor.nativeGunDone=true;
    if(!gunSources(s,actor).length)s.queue.shift();
    if(target) {const d={id:target,cause:'shot',day:s.night,context:'day',sourceActor:actor.id};kill(s,[d]);s.dayEvents.push({...d,skill:'gun',skillSource:source});s.queue.unshift(d);}
    deathSteps(s);
  } else if(step==='selfDestruct') {
    const id=s.action[0];if(player(s,id).role==='blood'&&s.players.filter(p=>p.alive&&wolves(p)).length>1)Object.assign(s.blood,{actor:id,selfDestructDay:s.night,sealNight:s.night+1});
    if(s.electionStatus==='pending'){s.preSheriffExplosions++;s.resumeElection=true;if(s.rules.swallow && s.preSheriffExplosions>=boardOf(s).swallowThreshold){s.badgeSwallowed=true;s.swallowNoticeNight=s.night+1;s.swallowNoticeShown=false;s.electionStatus='none';s.resumeElection=false;}}
    const d={id,cause:'selfDestruct',day:s.night,context:'day',sourceActor:id};kill(s,[d]);s.queue=[d];s.continuation=!s.deathsCommitted?'pendingAnnouncement':'nextNight';deathSteps(s);
  } else if(step==='badgeTransfer') {
    s.sheriff=s.choice==='skip'?null:s.action[0];s.pendingBadge=null;continueAfterDeaths(s);
  } else if(step==='lastBlade'){
    const id=s.action[0];s.blood.lastTarget=id;kill(s,[{id,cause:'lastBlade',context:'day',day:s.night,sourceActor:s.blood.lastActor,sourceRole:'blood'}]);s.blood.lastPending=false;s.winner=winner(s);s.winnerReason=winnerReason(s);
    s.blood.lastEvent={key:'lastBlade',stage:'lastBlade',actors:[s.blood.lastActor],actorRole:'blood',displayRole:'blood',skill:'wolf-attack',rawTargets:[id],effectiveTargets:[id],executed:true,result:s.winner==='狼人陣營'?(s.rules.victory==='city'?'屠城成功：狼人獲勝':'屠邊成功：狼人獲勝'):'未達本局條件：好人獲勝'};enter(s,'finished');
  }
  else if(step==='idiotReveal') {if(s.sheriff===s.idiot.seat){s.pendingBadge=s.idiot.seat;s.continuation='nextNight';enter(s,'badgeTransfer');}else enter(s,'nextNight');}
  else if(step==='direction' || step==='dayDraw') enter(s,'discussion');
  else if(step==='discussion') enter(s,'voteIntro');
  else if(step==='voteIntro') {s.votePool=s.players.filter(p=>eligibleExileTarget(s,p)).map(p=>p.id);enter(s,'exileVote');}
  else if(['exileVote','exileRevote'].includes(step)) {
    if(s.choice==='tie') {
      if(step==='exileVote'){s.votePool=[...s.action].sort((a,b)=>a-b);enter(s,'exilePK');}
      else enter(s,'noExile');
    } else {
      const target=player(s,s.action[0]);
      if(target.role==='blood'&&s.players.filter(p=>p.alive&&wolves(p)).length===1){
        Object.assign(s.blood,{lastPending:true,lastActor:target.id});kill(s,[{id:target.id,cause:'exile',context:'day',day:s.night}]);s.queue=[];enter(s,'lastBlade');return true;
      }
      if(boardOf(s).roles.idiot&&target.role==='idiot'&&!s.idiot.revealed){
        Object.assign(s.idiot,{seat:target.id,revealed:true,revealedDay:s.night,revealedStage:step,voteLost:true,exileBanned:true,countsEliminatedForVictory:!s.rules.idiotChase});s.queue=[];s.continuation='nextNight';
        s.winner=winner(s);s.winnerReason=winnerReason(s);enter(s,s.winner?'finished':'idiotReveal');return true;
      }
      const d={id:s.action[0],cause:'exile',day:s.night,context:'day'};kill(s,[d]);s.queue=[d];s.continuation='nextNight';deathSteps(s);
    }
  } else if(step==='exilePK') enter(s,'exilePKStart');
  else if(step==='exilePKStart') enter(s,'exileRevote');
  else if(step==='noExile')startNight(s);
  else if(step==='nextNight') startNight(s);
  return true;
}
export function subtitle(s) {
  if(s.step==='idiotReveal')return s.idiot.seat+'號玩家翻牌，身分為白痴，本次放逐無效';
  if(s.step==='noSheriffNotice')return s.noSheriffReason==='all'?'本局全員上警，沒有警長':'本局全員不上警，沒有警長';
  if(s.step==='swallowNotice')return boardOf(s).playerCount===12?'本局雙爆吞警徽，沒有警長':'本局單爆吞警徽，沒有警長';
  if(s.step==='exilePK')return '請'+s.votePool.map(id=>id+'號').join('、')+'PK 發言';
  if(s.step==='exilePKStart')return '由'+s.votePool[0]+'號開始發言';
  if(s.step==='wolves' && s.night>1)return '狼人請睜眼';
  if(s.step==='speeches') return `${s.draw.seat}號${s.draw.clockwise?'順':'逆'}時針發表政見`;
  if(s.step==='sheriffResult') return s.sheriff?`恭喜${s.sheriff}號當選警長`:s.electionTie?'雙方再次平票，本局將沒有警長':'';
  if(s.step==='announcement'){if(!s.deaths.length)return '昨晚是平安夜';const ids=[...s.deaths].sort((a,b)=>a.id-b.id).map(d=>d.id+'號').join('、');return s.night>1?'昨晚'+ids+'玩家被殺死，沒有遺言':s.deaths.length>1?'昨晚'+ids+'玩家被殺死':'昨晚'+s.deaths[0].id+'號被殺死';}
  if(s.step==='lastWords') return s.queue[0].cause==='selfDestruct'?`${s.queue[0].id}號玩家選擇自爆，請發表遺言`:s.queue[0].multi?`請${s.queue[0].id}號玩家發表遺言`:`${s.queue[0].id}號玩家出局，請發表遺言`;
  if(s.step==='eliminated') return `${s.queue[0].id}號玩家淘汰，沒有遺言。`;
  if(s.step==='skill') return `${s.queue[0].id}號玩家，啟動角色技能`;
  // 沒有定稿台詞的頁面不新增主持字幕。
  return SCRIPT[s.step] || '';
}
export function inspection(s) {
  return !fearedRole(s,'seer')&&s.nightAction.inspect ? (inspectedWolf(s,mapTarget(s,s.nightAction.inspect))?'down':'up') : '';
}
