// Only the four approved special boards use this per-night input/ownership state.
import {ROLE_DATA,BOARDS} from './data.js';
export const specialBoard=s=>{const r=BOARDS[s.boardId]?.roles||{};return r.mechanical?'mechanical':r.gargoyle?'converted':r.mask?'mask':r.fragrance?'fragrance':null;};
export const specialFlow=s=>!!s.takeover?.flow&&!!specialBoard(s);
export const takeoverState=(flow=true)=>({flow,night:null,ready:false,actor:null,ordinaryIds:[],pane:'skill',kind:null});
export const originalKnifeActors=s=>s.players.filter(p=>p.active&&p.alive&&ROLE_DATA[p.role]?.kind==='wolf'&&!['mechanical','mask','fragrance'].includes(p.role));
export function initializeTakeover(s){
 if(!specialFlow(s)||s.takeover.ready&&s.takeover.night===s.night)return;
 if(!s.rolesConfirmed||s.night===1)return;
 const role=specialBoard(s),ordinary=originalKnifeActors(s),p=role==='converted'?s.players.find(p=>p.id===s.gargoyle.target):s.players.find(p=>p.role===role);
 const joined=role!=='converted'||s.gargoyle.joinNight!=null&&s.night>=s.gargoyle.joinNight;
 Object.assign(s.takeover,{night:s.night,ready:true,ordinaryIds:ordinary.map(p=>p.id),actor:!ordinary.length&&p?.active&&p.alive&&joined?p.id:null,pane:'skill',kind:null});
}
export const takeoverOwner=s=>specialFlow(s)&&s.night>1&&s.takeover.ready&&s.takeover.night===s.night?s.players.find(p=>p.id===s.takeover.actor):null;
export const basicKnifeAvailable=s=>!!takeoverOwner(s)?.alive&&!s.winner;
export const extraKnifeAvailable=s=>specialFlow(s)&&specialBoard(s)==='mechanical'&&s.night>1&&!s.winner&&s.players.some(p=>p.alive&&p.role==='mechanical')&&s.mechanical.role==='wolf'&&!s.mechanical.extraUsed&&(s.mechanical.extraUnlocked||(s.rules.mechanicalKnife==='allDead'?!originalKnifeActors(s).length:s.night>s.mechanical.night));
// Knife controls handle basic takeover only; learned extra attack is a mechanical skill.
export const knifeKinds=s=>basicKnifeAvailable(s)?['basic']:[];
export const statusSteps=['mechanicalKnifeState','convertedKnifeState','maskKnifeState','fragranceKnifeState'];
export const switchSteps=['mechanicalLearn','mechanicalSkill','maskInspect','maskAssign','bond'];
export const knifeEntry=s=>specialFlow(s)&&(statusSteps.includes(s.step)||switchSteps.includes(s.step)&&!(s.night===1&&s.step==='bond'));
export const knifeSelection=s=>knifeEntry(s)&&s.takeover.pane==='knife'&&knifeKinds(s).includes(s.takeover.kind);
export function skillSelection(s){
 const n=s.nightAction;
 if(s.step==='bond')return [...n.bondTargets];
 const field={mechanicalLearn:'learnTarget',mechanicalSkill:s.operation,maskInspect:'maskInspect',maskAssign:'maskTarget'}[s.step];
 return field&&n[field]?[n[field]]:[];
}
export function restoreTakeoverInput(s){
 if(!knifeEntry(s))return;
 if(knifeSelection(s)){const id=s.nightAction[s.takeover.kind==='extra'?'extraAttack':'attack'];s.action=id?[id]:[];s.choice=id?'target':null;}
 else {s.action=skillSelection(s);s.choice=null;}
}
export function switchKnife(s,value){
 if(!knifeEntry(s))return false;
 if(value==='knife'){const kinds=knifeKinds(s);if(!kinds.length)return false;s.takeover.pane='knife';if(!kinds.includes(s.takeover.kind))s.takeover.kind=kinds[0];}
 else if(value==='skill'){if(statusSteps.includes(s.step))return false;s.takeover.pane='skill';}
 else if(value.startsWith('knifeKind:')){const kind=value.slice(10);if(!knifeKinds(s).includes(kind))return false;s.takeover.kind=kind;s.takeover.pane='knife';}
 else return false;
 restoreTakeoverInput(s);return true;
}
export const closeRole=s=>({mechanicalClose:'mechanical',convertedClose:'converted',maskClose:'mask',fragranceClose:'fragrance'})[s.step];
export function knifeSummary(s){
 const labels={basic:'基本狼刀',extra:'額外狼刀'},kinds=[...knifeKinds(s),...(extraKnifeAvailable(s)?['extra']:[])];
 return kinds.map(k=>labels[k]+'：'+(s.nightAction[k==='basic'?'attack':'extraAttack']?s.nightAction[k==='basic'?'attack':'extraAttack']+'號':'空刀')).join('；');
}
export function knifeStatus(s){
 const basic=basicKnifeAvailable(s)?'可以使用':takeoverOwner(s)&&!takeoverOwner(s).alive?'角色已出局':'本晚不可帶刀';
 return '基本狼刀：'+basic;
}
