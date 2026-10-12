const CACHE='council-v15-1';
const ASSETS=["skills/icon-infect.svg","art/catalog/gargoyle-v04.png","art/catalog/evilKnight.png","skills/icon-evil-knight-reflect.svg","identity.js","beauty.js","board-rules.js","art/catalog/beauty.png","art/catalog/duelist.png","skills/icon-charm.svg","skills/icon-heartbreak.svg","skills/icon-duel.svg","art/catalog/gravekeeper.png","skills/icon-transform.svg","skills/icon-gravekeeper.svg","art/backgrounds/shared.png","art/recap-vote.png","art/recap-sheriff.png","skills/icon-vote.svg","skills/icon-sheriff-badge.svg","./","index.html","style.css","app.js","engine.js","data.js","night.js","records.js","recap.js","timer.js","manifest.webmanifest","icon.svg","icon-192.png","icon-512.png","art/council-background.svg","art/moon-eclipse-sheriff-badge.svg","art/mixed-blood-dual-approved.jpeg","art/blood-moon-messenger-approved.png","art/demon-hunter-approved.png","skills/icon-wolf-attack.svg","skills/icon-antidote.svg","skills/icon-poison.svg","skills/icon-shield.svg","skills/icon-inspect.svg","skills/icon-swap.svg","skills/icon-gun.svg","skills/icon-learn.svg","skills/icon-trade.svg","skills/icon-fear.svg","skills/icon-sleep.svg","skills/icon-role-model.svg","skills/icon-hunt.svg","art/catalog/idiot.png","art/catalog/merchant.png","art/catalog/seer.png","art/catalog/witch.png","art/catalog/magician.png","art/catalog/medium.png","art/catalog/guard.png","art/catalog/villager.png","art/catalog/elder.png","art/catalog/younger.png","art/catalog/king.png","art/catalog/wolf.png","art/catalog/mechanical.png","art/catalog/seedWolf.png","art/catalog/hiddenWolf.png","art/catalog/dream.png","art/catalog/nightmare.png","art/catalog/hunter.png"];

importScripts('./cache-manifest.js');
const CORE=['cache-manifest.js','./','index.html','style.css','app.js','engine.js','data.js','identity.js','beauty.js','board-rules.js','night.js','records.js','recap.js','timer.js','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','art/backgrounds/shared.png'];
const OPTIONAL=ASSETS.filter(p=>!CORE.includes(p));
const inFlight=new Map();let warming=null;
const owned=k=>k.startsWith('council-')||k.startsWith('eclipse-walf-')||k==='eclipse-boards-v3';
const assetURL=p=>new URL(p,self.registration.scope).href;
async function digest(response){const bytes=await response.arrayBuffer();return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');}
async function ensureAsset(path){
 const url=assetURL(path);if(inFlight.has(url))return (await inFlight.get(url)).clone();
 const job=(async()=>{const cache=await caches.open(CACHE),current=await cache.match(url);if(current)return current;
  const revision=self.CACHE_REVISIONS[path];
  if(revision)for(const key of await caches.keys()){if(key===CACHE||!owned(key))continue;const prior=await (await caches.open(key)).match(url);if(prior&&await digest(prior.clone())===revision){await cache.put(url,prior.clone());return prior;}}
  const response=await fetch(new Request(url,{cache:'no-cache'}));if(!response.ok)throw Error('Asset '+response.status);await cache.put(url,response.clone());return response;
 })();inFlight.set(url,job);try{return (await job).clone();}finally{inFlight.delete(url);}
}
function warmAssets(){
 if(warming)return warming;
 warming=(async()=>{for(let i=0;i<OPTIONAL.length;i+=2)await Promise.allSettled(OPTIONAL.slice(i,i+2).map(ensureAsset));
  const cache=await caches.open(CACHE),missing=await Promise.all(OPTIONAL.map(async p=>!(await cache.match(assetURL(p)))));if(!missing.some(Boolean))await Promise.all((await caches.keys()).filter(k=>owned(k)&&k!==CACHE).map(k=>caches.delete(k)));
 })().finally(()=>{warming=null;});return warming;
}
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE.map(p=>new Request(assetURL(p),{cache:'reload'})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim());});
self.addEventListener('message',event=>{if(event.data?.type==='RESUME_PRECACHE')event.waitUntil(warmAssets());});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||!event.request.url.startsWith(self.registration.scope))return;
 const path=Object.keys(self.CACHE_REVISIONS).find(p=>assetURL(p)===event.request.url);
 if(path){event.respondWith(ensureAsset(path).catch(()=>Response.error()));return;}
 event.respondWith(fetch(event.request,{cache:'no-cache'}).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}return response;}).catch(async()=>await (await caches.open(CACHE)).match(event.request)||(event.request.mode==='navigate'?await (await caches.open(CACHE)).match(assetURL('index.html')):Response.error())));
});
