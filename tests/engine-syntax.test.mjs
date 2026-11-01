// The inline engine module and the start-up guard must parse; behaviour is covered by the browser tests.
import {readFileSync,writeFileSync,rmSync,mkdtempSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const html=readFileSync('studio.html','utf8');
const script=html.match(/<script type="module">([\s\S]+?)<\/script>/)?.[1];
assert.ok(script,'inline engine module exists');
// Checked as an ES module (it uses top-level await to load its libraries with a fallback).
const dir=mkdtempSync(join(tmpdir(),'frameforge-engine-')),file=join(dir,'engine.mjs');
writeFileSync(file,script);
try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'});}
catch(e){throw new Error('engine module does not parse:\n'+e.stderr)}
finally{rmSync(dir,{recursive:true,force:true})}
const guard=html.match(/<script>\s*\/\/ Start-up guard[\s\S]+?<\/script>/)?.[0].replace(/^<script>|<\/script>$/g,'');
assert.ok(guard,'start-up guard exists');new Function(guard);
console.log('ENGINE_SYNTAX_PASS');
