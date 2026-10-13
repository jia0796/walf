import {voteRound,setBallot,tallyVotes,voteGroups} from './votes.js';
export function createVoteDialog({getGame,save}){
 const $=id=>document.getElementById(id),dialog=$('voteDialog');let mode='batch',target=null,key=null;
 const value=raw=>raw==='abstain'?'abstain':raw===''?null:Number(raw);
 function choices(select,round,unrecorded=false){if(unrecorded)select.add(new Option('未紀錄',''));for(const id of round.targets)select.add(new Option(id+'號',String(id)));select.add(new Option('棄票','abstain'));}
 function badge(node,id,round){if(id===round.sheriff){const img=document.createElement('img');img.src='art/moon-eclipse-sheriff-badge.svg';img.alt='警徽';node.append(img);}}
 function changed(){save();paint();}
 function paint(){
  const round=voteRound(getGame());if(!round||round.key!==key){dialog.close();return;}
  const scroll=$('voteScroll').scrollTop,statsOpen=$('voteStats').open,optionsOpen=$('voteOptions').open;
  $('voteEligibilityHint').hidden=round.kind!=='sheriff';$('voteEligibilityHint').textContent=round.kind==='sheriff'?'上警與退水玩家不參與本輪投票':'';
  $('voteBatch').setAttribute('aria-pressed',String(mode==='batch'));$('voteIndividual').setAttribute('aria-pressed',String(mode==='individual'));$('voteTargetRow').hidden=mode!=='batch';
  const select=$('voteTarget');select.replaceChildren();choices(select,round);if(!round.targets.includes(target)&&target!=='abstain')target=round.targets[0]??'abstain';select.value=String(target);
  const voters=$('voteVoters');voters.replaceChildren();voters.className=mode==='batch'?'vote-voter-grid':'vote-voter-list';
  for(const id of round.voters){const current=round.ballots[id];if(mode==='batch'){
   const button=document.createElement('button'),name=document.createElement('span');button.dataset.voter=String(id);name.textContent=id+'號';badge(name,id,round);button.append(name);button.setAttribute('aria-label',id+'號投票者');button.setAttribute('aria-pressed',String(current===target));button.classList.toggle('ballot-selected',current===target);
   if(current!=null){const note=document.createElement('small');note.textContent=current==='abstain'?'棄票':'投'+current+'號';button.append(note);}button.onclick=()=>{setBallot(round,id,target,true);changed();};voters.append(button);
  }else{const row=document.createElement('label'),name=document.createElement('span'),choice=document.createElement('select');row.dataset.voter=String(id);name.textContent=id+'號';badge(name,id,round);choice.setAttribute('aria-label',id+'號投票');choices(choice,round,true);choice.value=current==null?'':String(current);row.classList.toggle('ballot-recorded',current!=null);choice.onchange=()=>{setBallot(round,id,value(choice.value));changed();};row.append(name,choice);voters.append(row);}}
  const tally=tallyVotes(round);$('voteProgress').textContent='已紀錄 '+tally.recorded+'／'+tally.total+' 人';$('voteStatsContent').replaceChildren(voteGroups(round));$('voteStats').open=statsOpen;$('voteOptions').open=optionsOpen;$('voteScroll').scrollTop=scroll;
 }
 $('voteTarget').onchange=()=>{target=value($('voteTarget').value);paint();};$('voteBatch').onclick=()=>{mode='batch';paint();};$('voteIndividual').onclick=()=>{mode='individual';paint();};
 $('voteClose').onclick=$('voteDone').onclick=()=>dialog.close();$('voteClear').onclick=()=>$('voteClearDialog').showModal();$('voteClearCancel').onclick=()=>$('voteClearDialog').close();$('voteClearConfirm').onclick=()=>{const round=voteRound(getGame());if(round?.key===key)round.ballots={};$('voteClearDialog').close();changed();};
 return {open(){const round=voteRound(getGame(),true);if(!round)return;key=round.key;mode='batch';target=round.targets[0]??'abstain';$('voteStats').open=false;$('voteOptions').open=false;paint();save();dialog.showModal();$('voteScroll').scrollTop=0;}};
}
