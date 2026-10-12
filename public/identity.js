import {ROLE_DATA,BOARDS} from './data.js';
export const converted=(s,p)=>!!p&&s.gargoyle?.target===p.id;
export const infected=(s,p)=>!!p&&s.infection?.success===true&&s.infection.target===p.id;
export const infectionName=(s,p)=>ROLE_DATA[p.role].name+'（已感染）';
export const realWolf=(s,p)=>ROLE_DATA[p?.role]?.kind==='wolf'||converted(s,p)||infected(s,p);
export const nativeAllowed=(s,p)=>!infected(s,p);
export const convertedName=(s,p)=>p.role==null?'轉化者':'轉化者（'+({seer:'預',witch:'巫',guard:'守',hunter:'獵',villager:'民',gravekeeper:'墓'}[p.role]||'民')+'）';
export const displayConvertedName=(s,p)=>s.rolesConfirmed?convertedName(s,p):'轉化者';
export function transformCandidates(s){const count=BOARDS[s.boardId].playerCount,orig=s.players.filter(p=>p.active&&ROLE_DATA[p.role]?.kind==='wolf');return s.players.filter(p=>p.active&&p.alive&&!realWolf(s,p)&&orig.some(w=>((p.id-w.id+count)%count===1)||((w.id-p.id+count)%count===1))).map(p=>p.id);}
export function updateTakeover(s){if(!s.gargoyle?.target)return;const g=s.gargoyle;const original=s.players.filter(p=>p.active&&ROLE_DATA[p.role]?.kind==='wolf');g.originalWolves=original.map(p=>p.id);g.originalRole=s.players.find(p=>p.id===g.target)?.role||g.originalRole;if(!original.some(p=>p.alive)&&s.players.find(p=>p.id===g.target)?.alive&&g.joinNight==null)g.joinNight=s.night+1;}
export function graveResult(s){return s.night>1?s.exiles?.findLast(e=>e.day===s.night-1)||null:null;}
