import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../public/',import.meta.url),sw=await readFile(new URL('sw.js',root),'utf8');
const assets=vm.runInNewContext(sw.slice(0,sw.indexOf('importScripts'))+'\nASSETS');
const revisions={};for(const path of assets.filter(p=>p.startsWith('art/')||p.startsWith('skills/')))revisions[path]=createHash('sha256').update(await readFile(new URL(path,root))).digest('hex');
if(process.argv.includes('--check')){const text=await readFile(new URL('cache-manifest.js',root),'utf8');const current=JSON.parse(text.replace(/^self.CACHE_REVISIONS=/,'').replace(/;\s*$/,''));assert.deepEqual(current,revisions);console.log('Cache revisions verified:',Object.keys(revisions).length);}
else{await writeFile(new URL('cache-manifest.js',root),'self.CACHE_REVISIONS='+JSON.stringify(revisions)+';\n');console.log('Cache revisions updated:',Object.keys(revisions).length);}
