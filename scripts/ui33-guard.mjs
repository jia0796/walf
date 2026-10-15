// Read-only audit against the immutable pre-UI branch. Not part of the App.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const baseline='359a66b66f61ba5dfdb56b1c3a1992de6150073b',root=new URL('..',import.meta.url);
const paths=execFileSync('git',['ls-tree','-r','--name-only',baseline,'public'],{cwd:root,encoding:'utf8'}).trim().split('\n');
const allowed=new Set(['public/app.js','public/index.html','public/style.css','public/recap.js']);
const digest=b=>createHash('sha256').update(b).digest('hex');
const result=paths.filter(p=>!allowed.has(p)).map(path=>{const original=execFileSync('git',['show',baseline+':'+path],{cwd:root,maxBuffer:32*1024*1024}),current=readFileSync(new URL(path,root));const normalize=b=>!path.startsWith('public/skills/')&&/\.(js|html|css|json|webmanifest|svg)$/.test(path)?Buffer.from(b.toString('utf8').replace(/\r\n/g,'\n')):b;const hash=digest(normalize(current));assert.equal(hash,digest(normalize(original)),path+' changed');return {path,sha256:hash};});
const audit={baseline,protectedFiles:result.length,unchanged:result};if(process.env.UI33_GUARD_OUTPUT)writeFileSync(process.env.UI33_GUARD_OUTPUT,JSON.stringify(audit,null,2));console.log(JSON.stringify({baseline,protectedFiles:result.length,passed:true}));
