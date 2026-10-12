import {realWolf} from './identity.js';
export const masqueradeState=()=>({used:[],lastInspect:null,lastMask:null,takeoverNight:null});
export const danceCandidates=s=>s.players.filter(p=>p.active&&p.alive&&!s.masquerade.used.includes(p.id)).map(p=>p.id);
export const dancerAvailable=s=>s.night>1&&s.players.some(p=>p.alive&&p.role==='dancer')&&danceCandidates(s).length>=3;
export const maskAvailable=s=>s.night>1&&s.players.some(p=>p.alive&&p.role==='mask');
export const maskInspectCandidates=s=>maskAvailable(s)?s.players.filter(p=>p.active&&p.alive&&p.id!==s.masquerade.lastInspect).map(p=>p.id):[];
export function updateMaskTakeover(s){if(s.rolesConfirmed&&s.players.some(p=>p.alive&&p.role==='mask')&&!s.players.some(p=>p.alive&&p.role==='wolf')&&s.masquerade.takeoverNight==null)s.masquerade.takeoverNight=s.night+1;}
export const maskActor=s=>s.masquerade?.takeoverNight!=null&&s.night>=s.masquerade.takeoverNight&&!s.players.some(p=>p.alive&&p.role==='wolf')?s.players.find(p=>p.alive&&p.role==='mask'):undefined;
export function danceInfo(s){
 const n=s.nightAction,targets=n.danceConfirmed?n.danceTargets:[],dancer=s.players.find(p=>p.role==='dancer');
 const people=targets.map(id=>{const p=s.players.find(p=>p.id===id),trueCamp=realWolf(s,p)?'wolf':'good';return {id,trueCamp,judgedCamp:n.maskConfirmed&&n.maskTarget===id?(trueCamp==='wolf'?'good':'wolf'):trueCamp};});
 const wolves=people.filter(p=>p.judgedCamp==='wolf').length,minority=wolves===1?'wolf':wolves===2?'good':null;
 return {people,protected:targets.includes(dancer?.id),deaths:people.filter(p=>p.judgedCamp===minority).map(p=>p.id)};
}
