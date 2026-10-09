export const ROLE_DATA = {
 king:{name:'黑狼王',kind:'wolf',category:'狼',camp:'狼隊陣營',image:null,canShoot:true,skill:'出局時可槍殺一名玩家，被毒則無法發動技能。可以自爆，自爆不能使用技能。',goal:'欺騙好人，帶領狼人陣營取得勝利。'},
 wolf:{name:'狼人',kind:'wolf',category:'狼',camp:'狼隊陣營',image:null,canShoot:false,skill:'每天晚上狼人討論並擊殺一名玩家。白天時可選擇翻牌自爆，自身出局並進入黑夜。',goal:'欺騙好人，帶領狼人陣營取得勝利。'},
 seer:{name:'預言家',kind:'god',category:'神',camp:'好人陣營',image:null,canShoot:false,skill:'每天晚上查驗一名玩家，法官告知其玩家身分為好人或狼人。',goal:'找出並解決所有狼人。'},
 witch:{name:'女巫',kind:'god',category:'神',camp:'好人陣營',image:null,canShoot:false,skill:'有一瓶解藥與一瓶毒藥可在夜晚使用。解藥可以拯救當天晚上被殺的一名玩家；毒藥可以毒死任意一名玩家。一晚只能使用一瓶藥。',goal:'找出並解決所有狼人。'},
 hunter:{name:'獵人',kind:'god',category:'神',camp:'好人陣營',image:null,canShoot:true,skill:'可在出局時槍殺一名玩家，被毒則不能發動技能。',goal:'找出並解決所有狼人。'},
 magician:{name:'魔術師',kind:'god',category:'神',camp:'好人陣營',image:null,canShoot:false,skill:'每晚可以選擇兩名玩家交換，也可以不交換。整局遊戲中，被交換過的玩家不能再次交換，且不能交換已出局的玩家。當晚兩個玩家受到的所有操作都會交換。',goal:'找出並解決所有狼人。'},
 villager:{name:'平民',kind:'villager',category:'民',camp:'好人陣營',image:null,canShoot:false,skill:'無',goal:'找出並解決所有狼人。'},
 mechanical:{name:'機械狼',kind:'wolf',camp:'狼隊陣營',image:null,canShoot:false,skill:'每局可選擇一名玩家，學習該玩家的身分與技能。被查驗時，顯示為所學習玩家的身分。機械狼不與其他狼人見面，且不能自爆。當其他狼人全部出局後，機械狼才可進行夜間襲擊。',goal:'欺騙好人，帶領狼人陣營取得勝利。'},
 medium:{name:'通靈師',kind:'god',camp:'好人陣營',image:null,canShoot:false,skill:'每晚可以查驗一名存活玩家，得知該玩家的具體身分。',goal:'找出並解決所有狼人。'},
 guard:{name:'守衛',kind:'god',camp:'好人陣營',image:null,canShoot:false,skill:'每晚可以選擇守護一名玩家，也可以不守。可以守護自己，但不能連續兩晚守護同一名玩家。被守護的玩家可抵擋一次狼人襲擊。若同晚被女巫使用解藥救治，該玩家仍會死亡。',goal:'找出並解決所有狼人。'}
};
for(const [id,name] of Object.entries({king:'black-wolf-king',wolf:'werewolf',seer:'seer',witch:'witch',hunter:'hunter',magician:'magician',villager:'villager',mechanical:'mechanical-wolf',medium:'medium',guard:'guard'}))ROLE_DATA[id].image='art/'+name+'-minimal-approved.png';
const defaults={sheriff:true,selfRescue:false,victory:'edge',swallow:false};
export const BOARDS={
 '12':{id:'12',name:'12人黑狼王魔術師局',playerCount:12,roles:{king:1,wolf:3,seer:1,witch:1,magician:1,hunter:1,villager:4},nightOrder:['magician','wolves','witch','seer','hunter'],defaults:{...defaults},swallowThreshold:2,adjustable:['sheriff','selfRescue','victory','swallow']},
 '10':{id:'10',name:'10人黑狼王魔術師局',playerCount:10,roles:{king:1,wolf:2,seer:1,witch:1,magician:1,villager:4},nightOrder:['magician','wolves','witch','seer'],defaults:{...defaults},swallowThreshold:1,adjustable:['sheriff','selfRescue','victory','swallow']}
};
for(const count of [10,12])BOARDS['mechanical'+count]={id:'mechanical'+count,name:count+'人機械狼通靈師局',playerCount:count,roles:{mechanical:1,wolf:count===12?3:2,medium:1,witch:1,...(count===12?{hunter:1}:{}),guard:1,villager:4},nightOrder:['guard','mechanical','wolves','witch','medium',...(count===12?['hunter']:[])],firstNightOrder:['mediumIdentify','guard','wolves','witch',...(count===12?['hunter']:[]),'mechanical','medium'],defaults:{...defaults,mechanicalKnife:'next',reflectPoison:false},swallowThreshold:count===12?2:1,adjustable:['sheriff','selfRescue','victory','swallow','mechanicalKnife','reflectPoison']};
