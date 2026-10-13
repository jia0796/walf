export const clampSeconds=value=>Math.min(659,Math.max(0,Math.round(Number(value)||0)));
export const remainingSeconds=(deadline,now=Date.now())=>clampSeconds(Math.ceil((deadline-now)/1000));
export const wheelSeconds=(minutes,seconds)=>clampSeconds(Number(minutes)*60+Number(seconds));
export const restoresSession=(navigationType,previousScreen,savedVersion=6)=>navigationType==='reload'&&(['host','finished'].includes(previousScreen)||(previousScreen==null&&savedVersion<6));

// One deadline, independent of display transitions and repeated button presses.
export function createSpeechTimer(){
 let seconds=60,original=null,deadline=null,mode='setup';
 const tick=(now=Date.now())=>{if(deadline!==null){seconds=remainingSeconds(deadline,now);if(seconds===0)deadline=null;}return view();};
 const view=()=>({seconds,original,mode,running:deadline!==null});
 return {view,tick,
  set(value){if(mode==='setup'){seconds=clampSeconds(value);}return view();},
  start(now=Date.now()){if(mode!=='setup'||seconds===0)return view();original=seconds;mode='countdown';deadline=now+seconds*1000;return view();},
  pause(now=Date.now()){tick(now);deadline=null;return view();},
  resume(now=Date.now()){if(mode==='countdown'&&deadline===null&&seconds>0)deadline=now+seconds*1000;return view();},
  reset(now=Date.now()){tick(now);deadline=null;seconds=original??seconds;mode='setup';return view();},
  defaults(){deadline=null;seconds=60;original=null;mode='setup';return view();}
 };
}

export function timerProgress({seconds,original}){return {ratio:Math.min(1,Math.max(0,seconds/(original||seconds||1))),tone:seconds<=10?'urgent':seconds<=30?'warm':'normal'};}
