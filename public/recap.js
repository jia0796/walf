import {voteDetails} from './votes.js';
import {ROLE_DATA} from './data.js';
import {recapNights,personSnapshot} from './records.js';
import {realWolf,infected,converted} from './identity.js';
export const SKILL_LABELS={bond:'綁定','wolf-inspect':'狼人查驗',dance:'共舞',mask:'面具',charm:'魅惑',heartbreak:'殉情',duel:'決鬥',vote:'放逐投票','sheriff-badge':'警徽',infect:'感染','wolf-attack':'狼刀',antidote:'解藥',poison:'毒藥',shield:'守護',inspect:'查驗',swap:'交換',gun:'槍',learn:'學習',trade:'交易',fear:'恐懼',sleep:'夢遊','role-model':'榜樣',hunt:'狩獵',transform:'轉化',gravekeeper:'守墓查驗','evil-knight-reflect':'反傷'};
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!=null)node.textContent=text;return node;};
export function skillIcon(skill){const icon=el('img','skill-icon');icon.src='skills/icon-'+skill+'.svg';icon.alt=SKILL_LABELS[skill];return icon;}
export function cardModel(event){
 const lucky=event.displayRole==='lucky',r=ROLE_DATA[event.portraitRole||event.actorRole];
 const target=event.skill==='swap'?event.rawTargets.map(id=>id+'號').join(' ↔ '):event.rawTargets.map((id,i)=>id===event.effectiveTargets[i]?id+'號':id+'號 → '+event.effectiveTargets[i]+'號').join('、');
 return {name:event.key==='basic'?basicKnifeName(event):event.displayName|| (lucky?'幸運兒':ROLE_DATA[event.displayRole]?.name||r?.name||''),tone:event.tone|| (r?.kind==='wolf'?'wolf':r?.kind==='villager'?'villager':'god'),image:r?.image,crop:r?.recapCrop||null,facePriority:!!r?.facePriority,align:r?.recapAlign||'xMidYMid slice',artSize:r?.artSize||[1060,1484],target,actors:event.actors.map(id=>id+'號').join('、')};
}

// The joint wolf attack keeps its generic label. A lone takeover wolf uses
// the identity stored with that specific night, never a later final identity.
const conversionLabel=name=>name.replace(/^轉化者\(([^)]+)\)$/,'轉化者（$1）');
function basicKnifeName(e){
 if(e.actors?.length!==1)return '狼人';
 const snapshot=e.actorSnapshots?.[0],name=snapshot?.name||'';
 if(name==='感染者'||e.displayName?.includes('（已感染）'))return '感染者';
 if(name.startsWith('轉化者'))return conversionLabel(name);
 if(e.displayName?.startsWith('轉化者'))return conversionLabel(e.displayName);
 if(e.actorRole==='mechanical')return name.startsWith('機械狼')?name:'機械狼';
 if(e.actorRole==='fragrance')return '尋香魅影';if(e.actorRole==='younger')return '狼弟';if(e.actorRole==='mask')return '假面';
 return '狼人';
}

const reasonNames={danceProtection:'共舞免刀',masqueradeImmunity:'免疫毒藥',guard:'守護抵擋',antidote:'解藥救回',guardAndAntidote:'同守同救',wolfTarget:'狼人目標',knightImmunity:'免疫',demonImmunity:'免疫',immuneNightGun:'免疫',sleep:'夢遊免疫',shield:'守護抵擋'};
export function outcomeLabel(e){
 if(e.key==='learn'||e.skill==='learn'||e.type==='badge'&&!e.rawTargets.length)return '';
 if(e.key==='dance'||e.key==='bond')return '';
 if(e.key==='danceDeath')return '共舞死亡';
 if(e.key==='maskInspect')return e.participated??e.result==='有參與共舞'?'參與':'未參與';
 if(e.key==='maskAssign')return e.rawTargets.some(id=>e.danceTargets?.includes(id))||e.participated||e.reversed?'陣營反轉':'未參與';
 if(e.unsettled)return '';
 if(e.skill==='transform')return '';
 if(e.skill==='hunt')return e.result?.startsWith('狩獵成功')?'狩獵成功':e.result?.startsWith('狩獵失敗')?'狩獵失敗':'';
 if(e.skill==='infect')return (e.infection?.success?'成功':'失敗')+(reasonNames[e.infection?.reason]?' · '+reasonNames[e.infection.reason]:'');
 if(e.skill==='trade')return e.tradeSuccess?'贈送'+(SKILL_LABELS[e.tradeAbility]||'能力'):'失敗';
 if(e.key==='evilKnightReflect')return e.outcome||'反傷';
 if(e.skill==='sleep')return e.outcome||(e.result==='連續攝夢致死'?'連攝':'');
 if(e.blocked)return reasonNames[e.blocked]||'抵擋';
 const reasons=[...new Set((e.damage||[]).map(d=>reasonNames[d.blocked]).filter(Boolean))];
 if(reasons.length)return reasons.join('、');
 return e.result||'';
}
function knownPerson(e,actor,index=0){
 const p=(actor?e.actorSnapshots:e.targetSnapshots)?.[index];if(p)return {...p};
 // Older records have no target identity snapshot: never infer it from final roles.
 const id=(actor?e.actors:e.effectiveTargets||e.rawTargets)?.[index],role=actor?e.actorRole:null,r=ROLE_DATA[role];
 return {id,role,name:r?.name||'未記錄',tone:r?.kind,image:r?.image};
}
function portrait(p){const box=el('div','recap-image');if(p?.image){const r=ROLE_DATA[p.role],crop=r?.recapCrop||(p.role==='mixed'?[80,120,930,1020]:null),size=r?.artSize||(p.role==='mixed'?[1089,1445]:[1060,1484]);if(crop){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('recap-portrait','recap-fused-art');svg.setAttribute('viewBox',crop.join(' '));svg.setAttribute('preserveAspectRatio',r.recapAlign||'xMidYMid slice');svg.setAttribute('role','img');svg.setAttribute('aria-label',p.name||'');const img=document.createElementNS('http://www.w3.org/2000/svg','image');img.setAttribute('href',p.image);img.setAttribute('width',String(size[0]));img.setAttribute('height',String(size[1]));svg.append(img);box.append(svg);}else{const img=el('img','recap-portrait');img.src=p.image;img.alt=p.name||'';img.loading='lazy';box.append(img);}}return box;}
function personText(p,{noNumber=false}={}){const text=el('div','recap-person '+(p?.tone||'neutral'));text.append(el('strong',null,p?.name||'未記錄'));if(!noNumber&&p?.id)text.append(el('span',null,p.id+'號'));return text;}
function actorModel(e){const p=knownPerson(e,true);if(e.displayRole==='lucky'||e.skillSource==='lucky')p.name='幸運兒';if(e.key==='basic'){p.name=basicKnifeName(e);p.tone='wolf';p.role=e.portraitRole||e.actorRole;p.image=ROLE_DATA[p.role]?.image;}return p;}
export function eventCard(e){
 const card=el('article','event-card recap-event');card.dataset.event=e.type||e.key||e.skill||'';
 if(['selfDestruct','idiot'].includes(e.type)){const p=knownPerson(e,true);card.classList.add('single-event');card.append(portrait(p),personText(p),el('span','recap-arrow','→'),el('strong','recap-event-label',e.label));return card;}
 if(e.type==='exilePK'){card.append(el('p','pk-result',e.result));return card;}
 let left=actorModel(e);const vote=['sheriff','exile'].includes(e.type);
 if(vote)left={name:e.type==='sheriff'?'警長競選':'放逐投票',image:e.type==='sheriff'?'art/recap-sheriff.png':'art/recap-vote.png',tone:'neutral'};
 card.append(portrait(left),personText(left,{noNumber:vote||e.key==='basic'&&e.actorRole!=='fragrance'}));
 const center=el('div','recap-effect'),label=outcomeLabel(e);if(label&&!vote)center.append(el('span','recap-outcome',label));if(e.key==='extraAttack')center.append(el('span','recap-outcome','額外狼刀'));if(e.skill)center.append(skillIcon(e.key==='maskInspect'?'wolf-inspect':e.skill));else center.append(el('span','recap-arrow','→'));card.append(center);
 if(e.key==='maskAssign'&&!e.rawTargets.length){card.append(el('strong','recap-no-target',e.unsettled?'未結算（遊戲已結束）':'空過'));return card;}
 if(e.type==='badge'&&!e.rawTargets.length){card.append(el('strong','badge-destroyed','X'),el('span','recap-event-label','撕毀警徽'));return card;}
 if(vote&&!e.rawTargets.length){card.append(el('strong','recap-no-target',e.result||'無人出局'));return card;}
 const targets=e.targetSnapshots||e.rawTargets||[];
 if(e.skill==='swap'||e.key==='dance'||e.key==='bond'||e.key==='awakenedInspect'){
  const people=el('div','recap-double-targets');targets.forEach((_,i)=>{const p=knownPerson(e,false,i),row=el('div','recap-target-row');row.append(personText(p),portrait(p));people.append(row);});card.append(people);
 }else{const p=knownPerson(e,false);card.append(personText(p),portrait(p));}
 if(e.rawTargets?.some((id,i)=>id!==e.effectiveTargets?.[i])){const raw=e.rawTargets.map((id,i)=>id+'號 → '+e.effectiveTargets[i]+'號').join('、');card.append(el('p','recap-mapping','原始 → 實際：'+raw));}
 return card;
}
export function recapTimeline(s){
 const nights=recapNights(s),days=s.dayEvents||[],numbers=[...new Set([...nights.map(r=>r.night),...days.map(e=>e.day)])].sort((a,b)=>a-b),sections=[];
 for(const n of numbers){const r=nights.find(x=>x.night===n);if(r)sections.push({kind:'night',number:n,record:r,events:r.events.filter(e=>!!e.skill)});const events=days.filter(e=>e.day===n&&e.executed!==false).map(e=>e.type?e:{...e,type:'shot',actors:[e.sourceActor],rawTargets:[e.id],effectiveTargets:[e.id]});if(events.length)sections.push({kind:'day',number:n,events});}
 if(s.blood?.lastEvent?.executed&&!days.some(e=>e.type==='lastBlade')){let day=sections.find(r=>r.kind==='day'&&r.number===s.night);if(!day){day={kind:'day',number:s.night,events:[]};sections.push(day);}day.events.push(s.blood.lastEvent);}
 return sections;
}
export function finalIdentityModel(s){const deaths=s.nightState?.deaths||s.nightResolution?.deaths||[];return ['wolf','good'].map(camp=>({camp,players:s.players.filter(p=>p.active&&(realWolf(s,p)?'wolf':'good')===camp).sort((a,b)=>(camp==='good'?(ROLE_DATA[a.role]?.kind==='god'?0:1)-(ROLE_DATA[b.role]?.kind==='god'?0:1):0)||a.id-b.id).map(p=>{const snap=personSnapshot(s,p.id);snap.alive=p.alive&&!deaths.some(d=>d.id===p.id);if(infected(s,p))snap.name='感染者';if(converted(s,p))snap.name='轉化者';snap.tone=realWolf(s,p)?'wolf':ROLE_DATA[p.role]?.kind;snap.original=infected(s,p)||converted(s,p)?ROLE_DATA[p.role]?.name:null;return snap;})}));}
export function renderRecap(container,s){
 container.replaceChildren();
 const result=el('section','victory recap-victory');result.append(el('h3',null,'遊戲結束'),el('h2',null,s.winner+'獲勝'),el('p',null,'勝利原因：'+(s.winnerReason||'')));container.append(result);
 if(s.legacyRecap||!s.recapVersion)container.append(el('p','small','舊版存檔僅顯示實際保存的事件；缺少的白天與身分快照不補造。'));
 for(const segment of recapTimeline(s)){
  const section=el('section','recap-segment '+segment.kind),title=el('h3','recap-section-title','第'+segment.number+(segment.kind==='night'?'晚':'天'));section.append(title);
  for(const event of segment.events){section.append(eventCard(event));const superseded=event.type==='exilePK'&&segment.events.some(e=>e!==event&&['exile','idiot'].includes(e.type)&&e.voteRounds?.some(r=>event.voteRounds?.some(first=>first.key===r.key)));if(!superseded){const details=voteDetails(event.voteRounds);if(details)section.append(details);}}
  if(segment.kind==='night'){const r=segment.record,result=el('article','night-result');result.append(el('h4',null,'當晚結果'),el('p',null,r.settled?(r.deaths.length?'死亡：'+[...r.deaths].sort((a,b)=>a.id-b.id).map(d=>d.id+'號').join('、'):'平安夜'):'本晚尚未結算'));section.append(result);}
  container.append(section);
 }
 const final=el('section','final-identities');final.append(el('h3','recap-section-title','最終身分回顧'));
 for(const group of finalIdentityModel(s)){final.append(el('h4',null,group.camp==='wolf'?'狼人陣營':'好人陣營'));const grid=el('div','final-identity-grid');for(const p of group.players){const card=el('article','final-identity-card '+p.tone),text=personText(p);text.append(el('span','identity-status',p.alive?'存活':'出局'));if(p.original)text.append(el('span','identity-original','原職：'+p.original));card.append(portrait(p),text);grid.append(card);}final.append(grid);}container.append(final);
}
