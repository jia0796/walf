import {voteRound,createVoteDraft,submitVote,abandonVote,setBallot,tallyVotes,voteGroups} from './votes.js';
export function createVoteDialog({getGame,save,render}){
 const $=id=>document.getElementById(id),dialog=$('voteDialog');let mode='batch',target=null,key=null,draft=null,notice='';
 const value=raw=>raw==='abstain'?'abstain':raw===''?null:Number(raw);
 function choices(select,round,unrecorded=false){if(unrecorded)select.add(new Option('未紀錄',''));for(const id of round.targets)select.add(new Option(id+'號',String(id)));select.add(new Option('棄票','abstain'));}
 function badge(node,id,round){if(id===round.sheriff){const img=document.createElement('img');img.src='art/moon-eclipse-sheriff-badge.svg';img.alt='警徽';node.append(img);}}
 function changed(){notice='';paint();}
 function paint(){
  const round=draft;if(!round||createVoteDraft(getGame())?.key!==key){dialog.close();return;}
  const focused=document.activeElement,focusVoter=focused?.closest('[data-voter]')?.dataset.voter,focusTag=focused?.tagName;
  const scroll=$('voteScroll').scrollTop,statsOpen=$('voteStats').open,optionsOpen=$('voteOptions').open;
  $('voteEligibilityHint').textContent=round.stage.endsWith('Revote')?'PK玩家不參與本輪投票':round.kind==='sheriff'?'上警與退水玩家不參與本輪投票':'';$('voteEligibilityHint').hidden=!$('voteEligibilityHint').textContent;
  $('voteBatch').setAttribute('aria-pressed',String(mode==='batch'));$('voteIndividual').setAttribute('aria-pressed',String(mode==='individual'));$('voteTargetRow').hidden=mode!=='batch';
  const select=$('voteTarget');select.replaceChildren();choices(select,round);if(!round.targets.includes(target)&&target!=='abstain')target=round.targets[0]??'abstain';select.value=String(target);
  const voters=$('voteVoters');voters.replaceChildren();voters.className=mode==='batch'?'vote-voter-grid':'vote-voter-list';
  for(const id of round.voters){const current=round.ballots[id];if(mode==='batch'){
   const button=document.createElement('button'),name=document.createElement('span');button.dataset.voter=String(id);name.textContent=id+'號';badge(name,id,round);button.append(name);button.setAttribute('aria-label',id+'號投票者');button.setAttribute('aria-pressed',String(current===target));button.classList.toggle('ballot-selected',current===target);
   if(current!=null){const note=document.createElement('small');note.textContent=current==='abstain'?'棄票':'投'+current+'號';button.append(note);}button.onclick=()=>{setBallot(round,id,target,true);changed();};voters.append(button);
  }else{const row=document.createElement('label'),name=document.createElement('span'),choice=document.createElement('select');row.dataset.voter=String(id);name.textContent=id+'號';badge(name,id,round);choice.setAttribute('aria-label',id+'號投票');choices(choice,round,true);choice.value=current==null?'':String(current);row.classList.toggle('ballot-recorded',current!=null);choice.onchange=()=>{setBallot(round,id,value(choice.value));changed();};row.append(name,choice);voters.append(row);}}
  const tally=tallyVotes(round);$('voteProgress').textContent='已紀錄 '+tally.recorded+'／'+tally.total+' 人';$('voteStatsContent').replaceChildren(voteGroups(round));$('voteStats').open=statsOpen;$('voteOptions').open=optionsOpen;$('voteAbandon').hidden=!voteRound(getGame())?.submitted;
  $('voteSubmissionHint').textContent=notice||(!tally.groups.length?'尚無有效得票，請紀錄得票或關閉後手動選擇':tally.recorded<tally.total?'尚有 '+(tally.total-tally.recorded)+' 人未紀錄，將依目前票數完成統計':'');
  if(focusVoter){const row=voters.querySelector('[data-voter="'+focusVoter+'"]'),node=focusTag==='SELECT'?row?.querySelector('select'):row;node?.focus({preventScroll:true});}
  $('voteScroll').scrollTop=scroll;
 }
 $('voteTarget').onchange=()=>{target=value($('voteTarget').value);paint();};$('voteBatch').onclick=()=>{mode='batch';paint();};$('voteIndividual').onclick=()=>{mode='individual';paint();};
 function commit(operation){
  const game=getGame(),before={votePatterns:structuredClone(game.votePatterns||[]),action:[...game.action],choice:game.choice},result=operation(game);
  if(result?.ok===false){notice=result.reason==='empty'?'尚無有效得票，請紀錄得票或關閉後手動選擇':'本輪投票資格已改變，請重新開啟紀錄';paint();return false;}
  if(!save()){Object.assign(game,before);notice='儲存失敗，統計尚未提交；請釋放儲存空間後再試';paint();return false;}
  dialog.close();render();return true;
 }
 $('voteClose').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{draft=null;});
 $('voteDone').onclick=()=>commit(game=>submitVote(game,draft));
 $('voteClear').onclick=()=>$('voteClearDialog').showModal();$('voteClearCancel').onclick=()=>$('voteClearDialog').close();$('voteClearConfirm').onclick=()=>{draft.ballots={};$('voteClearDialog').close();changed();};
 $('voteAbandon').onclick=()=>$('voteAbandonDialog').showModal();$('voteAbandonCancel').onclick=()=>$('voteAbandonDialog').close();$('voteAbandonConfirm').onclick=()=>{$('voteAbandonDialog').close();commit(game=>abandonVote(game));};
 return {open(){draft=createVoteDraft(getGame());if(!draft)return;key=draft.key;notice='';mode='batch';target=draft.targets[0]??'abstain';$('voteStats').open=false;$('voteOptions').open=false;paint();dialog.showModal();$('voteScroll').scrollTop=0;}};
}
