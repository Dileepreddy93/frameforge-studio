// The inline engine module must parse; behaviour is covered by the browser tests.
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const html=readFileSync('studio.html','utf8');
const script=html.match(/<script type="module">([\s\S]+?)<\/script>/)?.[1];
assert.ok(script,'inline engine module exists');
new Function(script.replace(/^import\s+\*\s+as\s+T\s+from\s+['"][^'"]+['"];\s*/m,''));
console.log('ENGINE_SYNTAX_PASS');
