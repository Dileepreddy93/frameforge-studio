import fs from 'node:fs';
import assert from 'node:assert/strict';
const src=fs.readFileSync('index.html','utf8');
const required=[
  /const reactionCutMap=\{/,
  /function cinematicReaction\(/,
  /cam\.position\.set\(\.\.\.listenerCut\.camera\)/,
  /\[0,2\.13,\.57\]/,
  /const orangeGaze=shot\.speaker/,
  /LIVE TELEMETRY/,
  /NO CUSTOMERS DETECTED/,
  /estimatedWordViseme|function estimateViseme/,
  /function renderFilmFrame\(/,
  /zero-latency-acting-v3-with-foley\.mp4/
];
for(const expression of required)assert.match(src,expression,String(expression));
const module=src.match(/<script type="module">([\s\S]+?)<\/script>/)?.[1];assert.ok(module);
new Function(module.replace(/^import\s+\*\s+as\s+T\s+from\s+['"][^'"]+['"];\s*/m,''));
console.log('Cinematic V4 source/JS PASS');
assert.match(src,/startTime=0/,'segment export starts at an explicit frame');
assert.match(src,/startSample=Math.round\(startTime\*decoded.sampleRate\)/,'audio and video have the same segment origin');
assert.match(src,/renderFilmFrame\(startTime\+i\/fps/,'video starts at the selected timeline position');
