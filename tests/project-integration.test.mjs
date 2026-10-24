import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync('index.html','utf8');
assert.match(html,/src="\.\/src\/project-core\.js"/);
assert.match(html,/FrameForgeProjectCore\.assertProject\(document\)/);
assert.match(html,/FrameForgeProjectCore\.toTimelineShots\(project\)/);
assert.match(html,/FrameForgeCurrentProject=project/);
assert.match(html,/projectReady\.then/);
assert.doesNotMatch(html,/const templates=\{/,'script and dialogue should no longer be hardcoded');
for(const name of ['zero-latency','mountain-mystery']){
 const pathname='projects/'+name+'.frameforge.json';
 assert.ok(fs.existsSync(pathname),'project file exists');
 assert.ok(html.includes(pathname),'browser loads project file');
}
console.log('PROJECT_BROWSER_INTEGRATION_STATIC_PASS');
