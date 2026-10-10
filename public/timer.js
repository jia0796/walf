export const clampSeconds=value=>Math.min(659,Math.max(0,Math.round(Number(value)||0)));
export const remainingSeconds=(deadline,now=Date.now())=>clampSeconds(Math.ceil((deadline-now)/1000));
export const wheelSeconds=(minutes,seconds)=>clampSeconds(Number(minutes)*60+Number(seconds));
export const restoresSession=(navigationType,previousScreen,savedVersion=6)=>navigationType==='reload'&&(['host','finished'].includes(previousScreen)||(previousScreen==null&&savedVersion<6));
