import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const dir=new URL('../public/',import.meta.url);
test('PWA manifest uses scoped relative URLs and real correctly sized PNG icons',async()=>{
 const manifest=JSON.parse(await readFile(new URL('manifest.webmanifest',dir),'utf8'));
 assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');assert.equal(manifest.display,'standalone');
 for(const icon of manifest.icons){const bytes=await readFile(new URL(icon.src,dir));if(icon.type==='image/png'){const size=Number(icon.sizes.split('x')[0]);assert.equal(bytes.readUInt32BE(16),size);assert.equal(bytes.readUInt32BE(20),size);}}
});

async function worker(){
 const {webcrypto}=await import('node:crypto'),context=vm.createContext({});const buckets=new Map(),requests=[],handlers={};let offline=false,failure=null,active=0,maxActive=0;
 const scope='https://example.test/walf/',key=r=>typeof r==='string'?new URL(r,scope).href:r.url;
 const open=async name=>{if(!buckets.has(name))buckets.set(name,new Map());const store=buckets.get(name);return {addAll:async rs=>{for(const r of rs)store.set(key(r),await network(r));},put:async(r,v)=>store.set(key(r),v.clone()),match:async r=>store.get(key(r))?.clone()};};
 const network=async r=>{const path=new URL(key(r)).pathname.replace('/walf/','')||'index.html';requests.push(path);if(offline||path===failure)throw Error('network unavailable');active++;maxActive=Math.max(maxActive,active);await new Promise(r=>setTimeout(r,1));try{return new Response(await readFile(new URL(path,dir)));}finally{active--;}};
 const caches={open,keys:async()=>[...buckets.keys()],delete:async k=>buckets.delete(k)};
 const self={registration:{scope},addEventListener:(n,cb)=>handlers[n]=cb,skipWaiting:async()=>{},clients:{claim:async()=>{}}};
 Object.assign(context,{self,caches,fetch:network,Request,Response,URL,crypto:webcrypto,importScripts:()=>vm.runInContext(manifest,context)});
 const manifest=await readFile(new URL('cache-manifest.js',dir),'utf8');vm.runInContext(await readFile(new URL('sw.js',dir),'utf8'),context);
 const event=async (type,data={})=>{let job;handlers[type]({...data,waitUntil:p=>job=p});await job;};
 const get=async path=>{let job;handlers.fetch({request:new Request(scope+path),respondWith:p=>job=p,waitUntil:()=>{}});return job;};
 return {context,buckets,requests,event,get,open,offline:v=>offline=v,failure:v=>failure=v,maxActive:()=>maxActive};
}
test('staged PWA core installs before portraits; batches finish all optional assets and preserve unrelated cache',async()=>{
 const w=await worker();await w.open('unrelated');await w.event('install');assert.equal(w.requests.some(p=>p.includes('/catalog/')),false);assert.ok(w.requests.includes('engine.js'));assert.ok(w.requests.includes('art/backgrounds/shared.png'));
 await w.event('activate');await w.event('message',{data:{type:'RESUME_PRECACHE'}});
 assert.ok(w.maxActive()<=2);assert.ok(w.buckets.has('unrelated'));const optional=vm.runInContext('OPTIONAL',w.context);for(const p of optional)assert.ok(await (await w.open('council-v22-2')).match('https://example.test/walf/'+p),p);
 w.offline(true);assert.match(await (await w.get('engine.js')).text(),/export function createGame/);let response;const handlers=vm.runInContext('self',w.context);assert.ok(handlers);
});
test('interrupted optional download retries missing only, foreground deduplicates, valid old bytes reuse',async()=>{
 const w=await worker();const old=await w.open('council-v12-1'),url='https://example.test/walf/art/catalog/wolf.png';await old.put(url,new Response(await readFile(new URL('art/catalog/wolf.png',dir))));
 await w.event('install');w.failure('art/catalog/guard.png');await w.event('message',{data:{type:'RESUME_PRECACHE'}});assert.ok(w.buckets.has('council-v12-1'));assert.equal(w.requests.includes('art/catalog/wolf.png'),false);
 const before=w.requests.length;w.failure(null);await w.event('message',{data:{type:'RESUME_PRECACHE'}});assert.equal(w.requests.length-before,1);assert.equal(w.buckets.has('council-v12-1'),false);
 const a=await w.get('art/catalog/guard.png'),b=await w.get('art/catalog/guard.png');assert.equal((await a.arrayBuffer()).byteLength,(await b.arrayBuffer()).byteLength);
});
test('foreground uncached asset loads immediately and simultaneous callers get independent bodies',async()=>{
 const w=await worker();await w.event('install');const [a,b]=await Promise.all([w.get('art/catalog/seedWolf.png'),w.get('art/catalog/seedWolf.png')]);assert.equal(w.requests.filter(p=>p==='art/catalog/seedWolf.png').length,1);assert.equal((await a.arrayBuffer()).byteLength,(await b.arrayBuffer()).byteLength);
});
test('UI54 busy foreground pauses optional warmup but foreground thumbnails work, idle resumes and cache reuses',async()=>{
 const w=await worker();await w.event('install');await w.event('message',{data:{type:'SET_FOREGROUND',busy:true}});const before=w.requests.length;
 await w.event('message',{data:{type:'RESUME_PRECACHE'}});assert.equal(w.requests.length,before);
 const a=await w.get('art/thumbs/wolf.webp');assert.ok((await a.arrayBuffer()).byteLength>0);assert.equal(w.requests.length,before+1);
 await w.event('message',{data:{type:'SET_FOREGROUND',busy:false}});const total=w.requests.length;await w.get('art/thumbs/wolf.webp');assert.equal(w.requests.length,total);
 const optional=vm.runInContext('OPTIONAL',w.context);for(const p of optional)assert.ok(await(await w.open('council-v22-2')).match('https://example.test/walf/'+p),p);
});
