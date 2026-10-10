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
test('service worker precaches every real asset and serves navigation/modules when offline',async()=>{
 const handlers={},scope='https://example.test/walf/',store=new Map();let offline=false;
 const key=r=>typeof r==='string'?r:r.url||String(r);
 const fetchModes=[];const network=async(r,options)=>{if(options)fetchModes.push(options.cache);if(offline)throw new Error('Offline');const url=new URL(key(r)),name=url.pathname.slice('/walf/'.length)||'index.html';return new Response(await readFile(new URL(name,dir)));};
 const cache={addAll:async requests=>{for(const r of requests)store.set(key(r),await network(r));},put:async(r,response)=>store.set(key(r),response),match:async r=>store.get(key(r))?.clone()};
 const deleted=[];const caches={open:async()=>cache,match:cache.match,keys:async()=>['eclipse-walf-old','eclipse-walf-v3','unrelated-cache'],delete:async name=>{deleted.push(name);return true;}};
 const self={registration:{scope},addEventListener:(name,cb)=>handlers[name]=cb,skipWaiting:async()=>{},clients:{claim:async()=>{}}};
 vm.runInNewContext(await readFile(new URL('sw.js',dir),'utf8'),{self,caches,fetch:network,Request,Response,URL});
 let work;handlers.install({waitUntil:p=>work=p});await work;handlers.activate({waitUntil:p=>work=p});await work;
 assert.deepEqual(deleted,['eclipse-walf-old','eclipse-walf-v3']);offline=true;
 let response;handlers.fetch({request:{method:'GET',url:scope+'another-route',mode:'navigate'},respondWith:p=>response=p,waitUntil:()=>{}});assert.match(await (await response).text(),/<!doctype html>/);
 handlers.fetch({request:new Request(scope+'engine.js'),respondWith:p=>response=p,waitUntil:()=>{}});assert.match(await (await response).text(),/export function createGame/);
 assert.ok(fetchModes.length>0&&fetchModes.every(mode=>mode==='no-cache'));
 let intercepted=false;handlers.fetch({request:new Request('https://different.test/'),respondWith:()=>intercepted=true});assert.equal(intercepted,false);
});
