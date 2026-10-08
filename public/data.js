export const ROLE_DATA = {
 king:{name:'黑狼王',kind:'wolf',category:'狼',camp:'狼隊陣營',image:null,canShoot:true,skill:'出局時可槍殺一名玩家，被毒則無法發動技能。可以自爆，自爆不能使用技能。',goal:'欺騙好人，帶領狼人陣營取得勝利。'},
 wolf:{name:'狼人',kind:'wolf',category:'狼',camp:'狼隊陣營',image:null,canShoot:false,skill:'每天晚上狼人討論並擊殺一名玩家。白天時可選擇翻牌自爆，自身出局並進入黑夜。',goal:'欺騙好人，帶領狼人陣營取得勝利。'},
 seer:{name:'預言家',kind:'god',category:'神',camp:'好人陣營',image:null,canShoot:false,skill:'每天晚上查驗一名玩家，法官告知其玩家身分為好人或狼人。',goal:'找出並解決所有狼人。'},
 witch:{name:'女巫',kind:'god',category:'神',camp:'好人陣營',image:null,canShoot:false,skill:'有一瓶解藥與一瓶毒藥可在夜晚使用。解藥可以拯救當天晚上被殺的一名玩家；毒藥可以毒死任意一名玩家。一晚只能使用一瓶藥。',goal:'找出並解決所有狼人。'},
 hunter:{name:'獵人',kind:'god',category:'神',camp:'好人陣營',image:null,canShoot:true,skill:'可在出局時槍殺一名玩家，被毒則不能發動技能。',goal:'找出並解決所有狼人。'},
 magician:{name:'魔術師',kind:'god',category:'神',camp:'好人陣營',image:null,canShoot:false,skill:'每晚可以選擇兩名玩家交換，也可以不交換。整局遊戲中，被交換過的玩家不能再次交換，且不能交換已出局的玩家。當晚兩個玩家受到的所有操作都會交換。',goal:'找出並解決所有狼人。'},
 villager:{name:'平民',kind:'villager',category:'民',camp:'好人陣營',image:null,canShoot:false,skill:'無',goal:'找出並解決所有狼人。'}
};
const defaults={sheriff:true,selfRescue:false,victory:'edge',swallow:false};
export const BOARDS={
 '12':{id:'12',name:'12人黑狼王魔術師局',playerCount:12,roles:{king:1,wolf:3,seer:1,witch:1,magician:1,hunter:1,villager:4},nightOrder:['magician','wolves','witch','seer','hunter'],defaults:{...defaults},swallowThreshold:2,adjustable:['sheriff','selfRescue','victory','swallow']},
 '10':{id:'10',name:'10人黑狼王魔術師局',playerCount:10,roles:{king:1,wolf:2,seer:1,witch:1,magician:1,villager:4},nightOrder:['magician','wolves','witch','seer'],defaults:{...defaults},swallowThreshold:1,adjustable:['sheriff','selfRescue','victory','swallow']}
};
