const CACHE='eclipse-walf-v3';
const ASSETS=['./','index.html','style.css','app.js','engine.js','data.js','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS.map(p=>new Request(new URL(p,self.registration.scope),{cache:'reload'})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>(k.startsWith('eclipse-walf-')||k==='eclipse-boards-v3')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||!event.request.url.startsWith(self.registration.scope))return;
 event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}return response;}).catch(async()=>await caches.match(event.request)||(event.request.mode==='navigate'?await caches.match(new URL('index.html',self.registration.scope)):Response.error())));
});
