import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const baseline='70d8364bd6fc9a6c18f1f1359e034ca5382e5586';
const git=(...args)=>execFileSync('git',args,{cwd:new URL('..',import.meta.url),maxBuffer:8*1024*1024});
const permitted=new Set(['public/app.js','public/index.html','public/style.css']);
const changed=git('diff',baseline,'--name-only','--','public').toString().trim().split(/\r?\n/).filter(Boolean);
assert.deepEqual(changed.filter(p=>!permitted.has(p)&&!p.startsWith('public/art/ui610/')),[],'No game, timer, save, existing art or cache changes');
assert.equal(git('rev-parse','backup/eclipse-before-ui-6-10').toString().trim(),baseline);
const manifest=JSON.parse(await readFile(new URL('../docs/ui610-assets.json',import.meta.url),'utf8'));
for(const f of manifest.files){
 const bytes=await readFile(new URL('../'+f.path,import.meta.url));assert.equal(bytes.length,f.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256,f.path);
 const blob=git('show','HEAD:'+f.path);assert.equal(createHash('sha256').update(blob).digest('hex'),f.sha256,'Original asset Git bytes: '+f.path);
}
console.log(JSON.stringify({baseline,backupIntact:true,protectedGameTimerSaveCacheAndExistingArtUnchanged:true,approvedOriginalAssets:manifest.files.length,changedPublic:changed}));

