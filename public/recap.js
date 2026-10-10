import {ROLE_DATA} from './data.js';
import {recapNights} from './records.js';
export const SKILL_LABELS={'wolf-attack':'狼刀',antidote:'解藥',poison:'毒藥',shield:'守護',inspect:'查驗',swap:'交換',gun:'槍',learn:'學習',trade:'交易',fear:'恐懼',sleep:'夢遊','role-model':'榜樣',hunt:'狩獵',transform:'轉化',gravekeeper:'守墓查驗'};
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!=null)node.textContent=text;return node;};
export function skillIcon(skill){const icon=el('img','skill-icon');icon.src='skills/icon-'+skill+'.svg';icon.alt=SKILL_LABELS[skill];return icon;}
export function cardModel(event){
 const lucky=event.displayRole==='lucky',r=ROLE_DATA[event.actorRole];
 const target=event.skill==='swap'?event.rawTargets.map(id=>id+'號').join(' ↔ '):event.rawTargets.map((id,i)=>id===event.effectiveTargets[i]?id+'號':id+'號 → '+event.effectiveTargets[i]+'號').join('、');
 return {name:event.displayName|| (lucky?'幸運兒':ROLE_DATA[event.displayRole]?.name||r?.name||''),tone:event.tone|| (r?.kind==='wolf'?'wolf':r?.kind==='villager'?'villager':'god'),image:r?.image,crop:r?.recapCrop||null,artSize:r?.artSize||[1060,1484],target,actors:event.actors.map(id=>id+'號').join('、')};
}
export function eventCard(event,{operation=false}={}){
 const model=cardModel(event),card=el('article','event-card '+model.tone+(operation?' operation-card':''));
 if(model.image){if(model.crop){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('event-art');svg.setAttribute('viewBox',model.crop.join(' '));svg.setAttribute('preserveAspectRatio','xMidYMid slice');svg.setAttribute('aria-hidden','true');const image=document.createElementNS('http://www.w3.org/2000/svg','image');image.setAttribute('href',model.image);image.setAttribute('width',String(model.artSize[0]));image.setAttribute('height',String(model.artSize[1]));svg.append(image);card.append(svg);}else{const image=el('img','event-art');image.src=model.image;image.alt='';image.loading='lazy';card.append(image);}}
 const content=el('div','event-content'),title=el('h3',null,model.name),line=el('div','event-line');
 line.append(el('span',null,model.actors));if(event.skill)line.append(skillIcon(event.skill),el('span',null,model.target||'選擇目標'));
 content.append(title,line);
 if(event.result)content.append(el('p','event-result',event.result));
 if(event.tradeSuccess===false)content.append(el('p','event-result','交易失敗'));
 if(event.tradeSuccess===true){const gift=el('p','event-result','能力：');gift.append(skillIcon(event.tradeAbility));content.append(gift);}
 card.append(content);return card;
}
export function renderRecap(container,s,persist){
 container.replaceChildren();
 if(s.legacyRecap)container.append(el('p','small','舊版存檔未保存完整技能快照；只顯示更新後實際記錄的事件。'));
 for(const r of recapNights(s)){
  const details=el('details','recap-night'),label=el('summary',null,'第'+(['零','一','二','三','四','五','六','七','八','九','十'][r.night]||r.night)+'晚');
  details.open=s.recapExpanded.includes(r.night);details.append(label);
  for(const event of r.events)details.append(eventCard(event));
  const result=el('article','night-result');result.append(el('h3',null,'當晚結果'),el('p',null,r.settled?(r.deaths.length?'死亡：'+[...r.deaths].sort((a,b)=>a.id-b.id).map(d=>d.id+'號').join('、'):'平安夜'):'本晚尚未公布死訊'));
  details.append(result);
  details.addEventListener('toggle',()=>{s.recapExpanded=s.recapExpanded.filter(n=>n!==r.night);if(details.open)s.recapExpanded.push(r.night);persist();});
  container.append(details);
 }
 if(s.blood?.lastEvent?.executed)container.append(eventCard(s.blood.lastEvent));
}
