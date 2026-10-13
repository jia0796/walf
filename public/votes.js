import {eligibleVoters,eligibleExileTarget} from './night.js';

// Optional notes only. These functions never select an outcome or settle a vote.
export const VOTE_STEPS=['sheriffVote','sheriffRevote','exileVote','exileRevote'];
export const voteKind=stage=>stage.startsWith('sheriff')?'sheriff':'exile';
export const voteKey=s=>s.night+':'+s.step;
export function voteEligibility(s){
 const kind=voteKind(s.step),nominees=s.nominees?.length?s.nominees:s.candidates||[];
 return {voters:eligibleVoters(s).filter(p=>kind!=='sheriff'||!nominees.includes(p.id)).map(p=>p.id).sort((a,b)=>a-b),
  targets:(s.votePool||[]).filter(id=>{const p=s.players.find(p=>p.id===id);return kind==='exile'?eligibleExileTarget(s,p):p?.active&&p.alive;}).sort((a,b)=>a-b)};
}
export function voteRound(s,create=false){
 if(!VOTE_STEPS.includes(s.step))return null;
 let round=s.votePatterns?.find(r=>r.key===voteKey(s));
 if(!round&&create){const kind=voteKind(s.step);round={key:voteKey(s),day:s.night,stage:s.step,kind,label:s.step.endsWith('Revote')?'PK 重新投票':'第一輪投票',...voteEligibility(s),sheriff:kind==='exile'?s.sheriff:null,ballots:{},confirmed:false};(s.votePatterns??=[]).push(round);}
 return round||null;
}
export function setBallot(round,voter,target,toggle=false){
 if(!round||!round.voters.includes(voter)||target!==null&&target!=='abstain'&&!round.targets.includes(target))return false;
 if(target===null||toggle&&round.ballots[voter]===target)delete round.ballots[voter];else round.ballots[voter]=target;
 return true;
}
export function tallyVotes(round){
 const groups=new Map(),abstainers=[];let recorded=0;
 for(const voter of round.voters){const target=round.ballots[voter];if(target==='abstain'){recorded++;abstainers.push(voter);continue;}if(!round.targets.includes(target))continue;
  recorded++;if(!groups.has(target))groups.set(target,{target,votes:0,voters:[]});const group=groups.get(target);group.votes+=round.kind==='exile'&&round.sheriff===voter?1.5:1;group.voters.push(voter);
 }
 const ranked=[...groups.values()].sort((a,b)=>b.votes-a.votes||a.target-b.target);
 for(const group of ranked)group.tied=ranked.some(other=>other!==group&&other.votes===group.votes);
 return {recorded,total:round.voters.length,groups:ranked,abstainers};
}
export function confirmVoteNotes(s){const round=voteRound(s);if(round)round.confirmed=true;}
export function savedVoteNotes(s,kind){return (s.votePatterns||[]).filter(r=>r.day===s.night&&r.kind===kind&&r.confirmed&&tallyVotes(r).recorded>0).map(r=>structuredClone(r));}
export function voteGroups(round){
 const {groups,abstainers}=tallyVotes(round),list=document.createElement('div');list.className='vote-groups';
 const people=ids=>{const p=document.createElement('p');p.className='vote-people';for(const id of ids){const person=document.createElement('span');person.textContent=id+'號';if(round.sheriff===id){const badge=document.createElement('img');badge.src='art/moon-eclipse-sheriff-badge.svg';badge.alt='警徽';person.append(badge);}p.append(person);}return p;};
 for(const group of groups){const box=document.createElement('div'),title=document.createElement('strong');title.textContent=group.target+'號：'+group.votes+'票'+(group.tied?' · 同票':'');box.append(title,people(group.voters));list.append(box);}
 if(abstainers.length){const box=document.createElement('div'),title=document.createElement('strong');title.textContent='棄票：'+abstainers.length+'人';box.append(title,people(abstainers));list.append(box);}
 return list;
}
export function voteDetails(rounds){
 const actual=(rounds||[]).filter(r=>tallyVotes(r).recorded>0);if(!actual.length)return null;
 const details=document.createElement('details');details.className='vote-records';const summary=document.createElement('summary');summary.textContent='查看投票紀錄';details.append(summary);
 for(const round of actual){if(actual.length===1){const label=document.createElement('h4');label.textContent=round.label;details.append(label,voteGroups(round));}else{const section=document.createElement('details'),heading=document.createElement('summary');heading.textContent=round.label;section.append(heading,voteGroups(round));details.append(section);}}
 return details;
}
