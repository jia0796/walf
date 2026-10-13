import {eligibleVoters,eligibleExileTarget} from './night.js';

// A submitted tally selects an outcome; the existing next step alone settles it.
export const VOTE_STEPS=['sheriffVote','sheriffRevote','exileVote','exileRevote'];
export const voteKind=stage=>stage.startsWith('sheriff')?'sheriff':'exile';
export const voteKey=s=>s.night+':'+s.step;
export function voteEligibility(s){
 const kind=voteKind(s.step),nominees=s.nominees?.length?s.nominees:s.candidates||[],excluded=s.step.endsWith('Revote')?s.votePool:kind==='sheriff'?nominees:[];
 return {voters:eligibleVoters(s).filter(p=>!excluded.includes(p.id)).map(p=>p.id).sort((a,b)=>a-b),
  targets:(s.votePool||[]).filter(id=>{const p=s.players.find(p=>p.id===id);return kind==='exile'?eligibleExileTarget(s,p):p?.active&&p.alive;}).sort((a,b)=>a-b)};
}
export function createVoteDraft(s){
 if(!VOTE_STEPS.includes(s.step))return null;
 const kind=voteKind(s.step),formal=voteRound(s);
 return formal?.submitted?structuredClone(formal):{key:voteKey(s),day:s.night,stage:s.step,kind,label:s.step.endsWith('Revote')?'PK 重新投票':'第一輪投票',...voteEligibility(s),sheriff:kind==='exile'?s.sheriff:null,ballots:{},confirmed:false};
}
export function voteRound(s,create=false){
 if(!VOTE_STEPS.includes(s.step))return null;
 let round=s.votePatterns?.find(r=>r.key===voteKey(s));
 if(!round&&create){round=createVoteDraft(s);(s.votePatterns??=[]).push(round);}
 return round||null;
}
export const voteLocked=s=>!!voteRound(s)?.locked&&!!voteRound(s)?.submitted;
const highest=round=>{const groups=tallyVotes(round).groups;return groups.filter(g=>g.votes===groups[0]?.votes).map(g=>g.target).sort((a,b)=>a-b);};
export function voteResultMatches(s){
 if(!voteLocked(s))return true;
 const ids=highest(voteRound(s));return JSON.stringify([...s.action].sort((a,b)=>a-b))===JSON.stringify(ids)&&s.choice===(ids.length>1?'tie':'target');
}
export function submitVote(s,draft){
 if(!draft||!VOTE_STEPS.includes(s.step)||draft.key!==voteKey(s))return {ok:false,reason:'stage'};
 const eligibility=voteEligibility(s),kind=voteKind(s.step),sheriff=kind==='exile'?s.sheriff:null;
 if(JSON.stringify(draft.voters)!==JSON.stringify(eligibility.voters)||JSON.stringify(draft.targets)!==JSON.stringify(eligibility.targets)||draft.sheriff!==sheriff)return {ok:false,reason:'eligibility'};
 const round={...structuredClone(draft),submitted:true,locked:true,confirmed:false,ballots:{}};delete round.legacy;
 for(const voter of round.voters)setBallot(round,voter,draft.ballots[voter]??null);
 const ids=highest(round);if(!ids.length)return {ok:false,reason:'empty'};
 s.votePatterns=(s.votePatterns||[]).filter(r=>r.key!==round.key);s.votePatterns.push(round);s.action=ids;s.choice=ids.length>1?'tie':'target';
 return {ok:true};
}
export function abandonVote(s){s.votePatterns=(s.votePatterns||[]).filter(r=>r.key!==voteKey(s));}
export function migrateVoteNotes(s){
 // Old drafts were saved automatically and must not become submitted results.
 s.votePatterns=(s.votePatterns||[]).filter(r=>r.confirmed).map(r=>({...r,submitted:true,locked:false,legacy:true}));
 for(const event of s.dayEvents||[])if(event.voteRounds)event.voteRounds=event.voteRounds.filter(r=>r.confirmed).map(r=>({...r,submitted:true,locked:false,legacy:true}));
 return s;
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
export function confirmVoteNotes(s){const round=voteRound(s);if(round?.submitted&&voteResultMatches(s))round.confirmed=true;}
export function savedVoteNotes(s,kind){return (s.votePatterns||[]).filter(r=>r.day===s.night&&r.kind===kind&&r.submitted&&r.confirmed&&tallyVotes(r).recorded>0).map(r=>structuredClone(r));}
export function voteGroups(round,{showTies=true}={}){
 const {groups,abstainers}=tallyVotes(round),list=document.createElement('div');list.className='vote-groups';
 const people=ids=>{const p=document.createElement('p');p.className='vote-people';for(const id of ids){const person=document.createElement('span');person.textContent=id+'號';if(round.sheriff===id){const badge=document.createElement('img');badge.src='art/moon-eclipse-sheriff-badge.svg';badge.alt='警徽';person.append(badge);}p.append(person);}return p;};
 for(const group of groups){const box=document.createElement('div'),title=document.createElement('strong');title.textContent=group.target+'號：'+group.votes+'票'+(showTies&&group.tied?' · 同票':'');box.append(title,people(group.voters));list.append(box);}
 if(abstainers.length){const box=document.createElement('div'),title=document.createElement('strong');title.textContent='棄票：'+abstainers.length+'人';box.append(title,people(abstainers));list.append(box);}
 return list;
}
export function voteDetails(rounds){
 const actual=(rounds||[]).filter(r=>tallyVotes(r).recorded>0);if(!actual.length)return null;
 const details=document.createElement('details');details.className='vote-records';const summary=document.createElement('summary');summary.textContent='查看投票紀錄';details.append(summary);
 for(const round of actual){if(actual.length===1){const label=document.createElement('h4');label.textContent=round.label;details.append(label,voteGroups(round,{showTies:false}));}else{const section=document.createElement('details'),heading=document.createElement('summary');heading.textContent=round.label;section.append(heading,voteGroups(round,{showTies:false}));details.append(section);}}
 return details;
}
