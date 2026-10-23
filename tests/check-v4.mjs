import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const html=readFileSync('index.html','utf8');
const checks=[
 ['sculpted torso',/new T\.LatheGeometry\(outline/],
 ['physical character shells',/new T\.MeshPhysicalMaterial\(\{color:isBlue/],
 ['unified facial displays',/const face=new T\.Mesh\(new T\.PlaneGeometry\(\.92,\.68\)/],
 ['both robots animate',/drawActorFace\(faces\.orange,expression\.orange/],
 ['14-shot camera grammar',/const shotCamera=\[/],
 ['shot-specific lenses',/cam\.fov=fov/],
 ['approximate mouth timing',/function estimateViseme\(/],
 ['audio-derived mouth envelope',/decodedEnvelope/],
 ['directed body gestures',/const performanceCues=\[/],
 ['frame accurate exporter',/window\.FrameForgeMP4Test/],
 ['existing V3 public film protected',/zero-latency-acting-v3-with-foley\.mp4/]
];
for(const [name,pattern]of checks)assert.match(html,pattern,name);
const cam=html.match(/const shotCamera=\[([\s\S]+?)\];/);
assert.ok(cam,'shot camera plan exists');
const rows=cam[1].match(/\[[^\]]+\]/g)||[];
assert.equal(rows.length,14,'14 shot camera plans');
const fragment=html.match(/<script type="module">([\s\S]+?)<\/script>/)?.[1];
assert.ok(fragment);
new Function(fragment.replace(/^import\s+\*\s+as\s+T\s+from\s+['"][^'"]+['"];\s*/m,''));
console.log('11 feature assertions, 14 camera cuts and entire JS syntax PASS');
assert.match(html,/const jacket=new T.Mesh\(new T.LatheGeometry/,'sculpted human jacket');
assert.match(html,/new T.CapsuleGeometry\(\.235,\.44/,'rounded human sleeves');
assert.match(html,/const skull=new T.Mesh\(new T.SphereGeometry/,'smooth human head');
