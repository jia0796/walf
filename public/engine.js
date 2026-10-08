// 主持字幕只取自使用者原句；法官操作提示不屬於字幕。
export const ROLES = { magician: '魔術師', king: '黑狼王', wolf: '狼人', witch: '女巫', seer: '預言家', hunter: '獵人', villager: '平民' };
export const SCRIPT = {
  confirm: '請確認角色身分', dark: '天黑請閉眼', magician: '魔術師請睜眼',
  exchange: '選擇你今晚要交換的對象', magicianClose: '魔術師請閉眼',
  wolves: '狼人請睜眼 確人彼此角色身分', attack: '選擇你們今晚要襲擊的對象',
  witch: '女巫請睜眼', antidote: '今晚他死了，你要使用解藥嗎？',
  poison: '你要使用毒藥嗎？你要毒誰呢？', witchClose: '女巫請閉眼',
  seer: '預言家請睜眼', inspect: '選擇你今晚要查驗的對象', seerClose: '預言家請閉眼',
  hunter: '獵人請睜眼', gesture: '今晚的開槍手勢', hunterClose: '獵人請閉眼',
  dawn: '天亮請睜眼', candidates: '現在開始競選警長，候選人請起立', draw: '抽發言順序',
  withdraw: '要退水的玩家請坐下', sheriffVote: '現在進行投票 3 2 1請投票',
  sheriffPK: '請平手玩家依序再次發表政見', sheriffRevote: '再次準備投票',
  direction: '警長決定警左警右', voteIntro: '現在進行投票', exileVote: '3 2 1請投票'
};
const NIGHT = ['dark','magician','exchange','magicianClose','wolves','attack','witch','antidote','poison','witchClose','seer','inspect','seerClose','hunter','gesture','hunterClose','dawn'];
const blankNight = () => ({ exchange: [], noExchange: false, attack: null, emptyAttack: false, antidote: null, poison: null, poisonTarget: null, inspect: null });
export function createGame() {
  return { version: 1, step: 'confirm', night: 1, players: Array.from({length:12}, (_,i) => ({ id:i+1, role:null, alive:true })),
    rolesConfirmed:false, action:[], choice:null, nightAction:blankNight(), potions:{antidote:true,poison:true},
    candidates:[], sheriff:null, draw:null, direction:null, deaths:[], queue:[], continuation:null,
    votePool:[], winner:null, log:[], history:[] };
}
const clone = x => structuredClone(x);
const player = (s,id) => s.players.find(p=>p.id===id);
const wolves = p => ['king','wolf'].includes(p.role);
const gods = p => ['magician','witch','seer','hunter'].includes(p.role);
const livingRole = (s,role) => s.players.some(p=>p.alive && (role==='wolves' ? wolves(p) : p.role===role));
export function winner(s) {
  if (!s.rolesConfirmed) return null;
  const live = s.players.filter(p=>p.alive);
  if (!live.some(wolves)) return '好人陣營';
  if (!live.some(gods) || !live.some(p=>p.role==='villager')) return '狼人陣營';
  return null;
}
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
  return '';
}
function roleForStep(s) {
  if (s.step==='wolves') return ['king','wolf','wolf','wolf'][s.action.length] || 'wolf';
  return ['magician','witch','seer','hunter'].includes(s.step) ? s.step : null;
}
export function selectable(s,id) {
  const p=player(s,id); if (!p?.alive || s.winner) return false;
  if (!s.rolesConfirmed && roleForStep(s)) return s.action.includes(id) || !p.role;
  if (['exchange','attack','inspect'].includes(s.step)) return livingRole(s, {exchange:'magician',attack:'wolves',inspect:'seer'}[s.step]);
  if (s.step==='poison') return s.nightAction.poison===true && !potionBlocked(s,'poison');
  if (s.step==='skill') return id !== s.queue[0]?.id;
  if (s.step==='candidates') return true;
  if (['speeches','withdraw'].includes(s.step)) return s.candidates.includes(id);
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
    } else if (s.action.length < (s.step==='wolves'?4:1)) s.action.push(id);
    s.action.forEach((n,i)=>player(s,n).role=s.step==='wolves' ? ['king','wolf','wolf','wolf'][i] : role);
  } else if (s.step==='candidates') {
    s.candidates=s.candidates.includes(id)?s.candidates.filter(n=>n!==id):[...s.candidates,id]; s.choice='confirmed';
  } else if (['speeches','withdraw'].includes(s.step)) {
    s.candidates=s.candidates.filter(n=>n!==id);
  } else if (s.step==='exchange' || s.choice==='tie') {
    if (s.step==='exchange') {s.nightAction.noExchange=false; s.choice=null;}
    const max=s.step==='exchange'?2:12;
    s.action=s.action.includes(id)?s.action.filter(n=>n!==id):s.action.length<max?[...s.action,id]:s.action;
    if (s.step==='exchange') s.nightAction.exchange=[...s.action];
  } else {
    s.action=[id]; s.choice='target';
    if (s.step==='attack') { s.nightAction.attack=id; s.nightAction.emptyAttack=false; }
    if (s.step==='inspect') s.nightAction.inspect=id;
    if (s.step==='poison') s.nightAction.poisonTarget=id;
  }
  return true;
}
export function choose(s,value) {
  if (s.winner) return false;
  const n=s.nightAction;
  if (s.step==='exchange' && value==='skip') {s.action=[]; n.exchange=[]; n.noExchange=true;}
  else if (s.step==='attack' && value==='skip') {s.action=[]; n.attack=null; n.emptyAttack=true;}
  else if (['antidote','poison'].includes(s.step) && ['use','skip'].includes(value)) {
    const type=s.step; if (potionBlocked(s,type)) return false;
    if (value==='use') { n[type]=true; s.potions[type]=false; }
    else { if(n[type]===true) s.potions[type]=true; n[type]=false; }
    if (type==='poison') {s.action=[];n.poisonTarget=null;}
  } else if (s.step==='skill' && value==='skip') s.action=[];
  else if (s.step==='candidates' && value==='none') s.candidates=[];
  else if (['sheriffVote','sheriffRevote','exileVote','exileRevote'].includes(s.step) && value==='tie') s.action=[];
  else if (s.step==='direction' && ['left','right'].includes(value)) s.direction=value;
  else if (s.step==='draw' && value==='draw') s.draw={seat:Math.floor(Math.random()*12)+1,clockwise:Math.random()<0.5};
  else return false;
  s.choice=value; return true;
}
export function canNext(s) {
  if(s.winner) return false;
  if (!s.rolesConfirmed && roleForStep(s)) return s.action.length===(s.step==='wolves'?4:1);
  if (s.step==='exchange') return !livingRole(s,'magician') || s.nightAction.noExchange || s.action.length===2;
  if (s.step==='attack') return !livingRole(s,'wolves') || s.nightAction.emptyAttack || s.action.length===1;
  if (s.step==='inspect') return !livingRole(s,'seer') || s.action.length===1;
  if (s.step==='antidote') return !!potionBlocked(s,'antidote') || s.nightAction.antidote!==null;
  if (s.step==='poison') return !!potionBlocked(s,'poison') || s.nightAction.poison===false || (s.nightAction.poison===true && s.action.length===1);
  if (s.step==='skill') return s.choice==='skip' || s.action.length===1;
  if (s.step==='candidates') return s.choice!==null;
  if (s.step==='draw') return !!s.draw;
  if (s.step==='direction') return !!s.direction;
  if (['sheriffVote','exileVote','sheriffRevote','exileRevote'].includes(s.step)) {
    return s.choice==='tie' ? (s.step.endsWith('Revote') || s.action.length>=2) : s.action.length===1;
  }
  return true;
}
function snapshot(s) { const {history,...rest}=s; return clone(rest); }
function enter(s,step) {s.step=step;s.action=[];s.choice=null;}
export function previous(s) {
  const old=s.history.pop(); if(!old)return false;
  const history=s.history; Object.assign(s,old);s.history=history;return true;
}
export function nightDeaths(s) {
  const n=s.nightAction, deaths=new Map();
  if(n.attack && !n.antidote) deaths.set(mapTarget(s,n.attack),'attack');
  if(n.poison && n.poisonTarget) deaths.set(mapTarget(s,n.poisonTarget),'poison');
  return [...deaths].filter(([id])=>player(s,id).alive).map(([id,cause])=>({id,cause}));
}
function kill(s,deaths) {
  deaths.forEach(d=>{player(s,d.id).alive=false;player(s,d.id).cause=d.cause;});
  if(s.sheriff && !player(s,s.sheriff).alive) s.sheriff=null;
  s.log.push({night:s.night,deaths:clone(deaths)});s.winner=winner(s);
}
function deathSteps(s) {
  if(s.winner){enter(s,'finished');return;}
  if(!s.queue.length){enter(s,s.continuation);return;}
  const d=s.queue[0];
  if(!d.wordsDone && (d.cause==='exile' || (['attack','poison'].includes(d.cause) && s.night===1))) {enter(s,'lastWords');return;}
  if(['hunter','king'].includes(player(s,d.id).role) && d.cause!=='poison') {enter(s,'skill');return;}
  s.queue.shift();deathSteps(s);
}
function startNight(s) {
  s.night++; s.nightAction=blankNight();s.draw=null;s.direction=null;s.deaths=[];enter(s,'dark');
}
function finishElection(s) {enter(s,'sheriffResult');}
export function next(s) {
  if(!canNext(s))return false;
  s.history.push(snapshot(s));
  const step=s.step;
  if(step==='confirm') enter(s,'dark');
  else if(NIGHT.includes(step) && step!=='dawn') {
    const upcoming=NIGHT[NIGHT.indexOf(step)+1];
    if(upcoming==='dawn') {
      if(!s.rolesConfirmed) {
        const counts={magician:1,king:1,wolf:3,witch:1,seer:1,hunter:1};
        if(!Object.entries(counts).every(([r,c])=>s.players.filter(p=>p.role===r).length===c)) {previous(s);return false;}
        s.players.filter(p=>!p.role).forEach(p=>p.role='villager');s.rolesConfirmed=true;
      }
      s.deaths=nightDeaths(s);
    }
    enter(s,upcoming);
  } else if(step==='dawn') {
    if(s.night===1) enter(s,'candidates'); else enter(s,'announcement');
  } else if(step==='candidates') {
    if(s.candidates.length===0) {s.sheriff=null;finishElection(s);}
    else if(s.candidates.length===1) {s.sheriff=s.candidates[0];finishElection(s);}
    else enter(s,'draw');
  } else if(step==='draw') enter(s,'speeches');
  else if(step==='speeches') enter(s,'withdraw');
  else if(step==='withdraw') {
    if(s.candidates.length<2){s.sheriff=s.candidates[0]||null;finishElection(s);}
    else {s.votePool=[...s.candidates];enter(s,'sheriffVote');}
  } else if(['sheriffVote','sheriffRevote'].includes(step)) {
    if(s.choice==='tie' && step==='sheriffVote') {s.votePool=[...s.action];enter(s,'sheriffPK');}
    else {s.sheriff=s.choice==='tie'?null:s.action[0];finishElection(s);}
  } else if(step==='sheriffPK') enter(s,'sheriffRevote');
  else if(step==='sheriffResult') enter(s,'announcement');
  else if(step==='announcement') {
    kill(s,s.deaths);s.queue=clone(s.deaths);s.continuation='direction';deathSteps(s);s.history=[];
  } else if(step==='lastWords') {s.queue[0].wordsDone=true;deathSteps(s);}
  else if(step==='skill') {
    const target=s.choice==='skip'?null:s.action[0];s.queue.shift();
    if(target) {const d={id:target,cause:'shot'};kill(s,[d]);s.queue.unshift(d);}
    deathSteps(s);if(target)s.history=[];
  } else if(step==='direction') enter(s,'discussion');
  else if(step==='discussion') enter(s,'voteIntro');
  else if(step==='voteIntro') {s.votePool=s.players.filter(p=>p.alive).map(p=>p.id);enter(s,'exileVote');}
  else if(['exileVote','exileRevote'].includes(step)) {
    if(s.choice==='tie') {
      if(step==='exileVote'){s.votePool=[...s.action];enter(s,'exilePK');}
      else startNight(s);
    } else {
      const d={id:s.action[0],cause:'exile'};kill(s,[d]);s.queue=[d];s.continuation='nextNight';deathSteps(s);s.history=[];
    }
  } else if(step==='exilePK') enter(s,'exileRevote');
  else if(step==='nextNight') startNight(s);
  return true;
}
export function subtitle(s) {
  if(s.step==='speeches') return `${s.draw.seat}號${s.draw.clockwise?'順':'逆'}時針發表政見`;
  if(s.step==='sheriffResult') return s.sheriff?`${s.sheriff}號當選警長`:'';
  if(s.step==='announcement') return s.deaths.length?`昨晚${s.deaths.map(d=>d.id+'號').join('和')}被殺死`: '昨晚是平安夜';
  if(s.step==='lastWords') return `${s.queue[0].id}號玩家出局，請發表遺言`;
  if(s.step==='skill') return `${s.queue[0].id}號玩家，啟動角色技能`;
  // 未定稿的白天發言、放逐 PK、勝負及無警長分支只有操作標題，不新增主持台詞。
  return SCRIPT[s.step] || '';
}
export function inspection(s) {
  return s.nightAction.inspect ? (wolves(player(s,mapTarget(s,s.nightAction.inspect)))?'🐺':'👍') : '';
}
