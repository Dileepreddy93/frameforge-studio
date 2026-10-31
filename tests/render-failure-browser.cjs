// M5.6: tools/render-episode.mjs fails loudly. When ffmpeg fails it exits non-zero, says so, and leaves no file at
// --out (not even an empty one). A short real render still succeeds and replaces the file in one step.
//   node tests/render-failure-browser.cjs        (needs ffmpeg and Playwright's Chromium; FRAMEFORGE_CDN_MIRROR in sandboxes)
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');

const ROOT=path.resolve(__dirname,'..');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'frameforge-render-'));
const render=(out,env={})=>spawnSync(process.execPath,[path.join(ROOT,'tools/render-episode.mjs'),path.join(ROOT,'projects/zero-latency.frameforge.json'),
 '--from','0','--to','0.4','--width','180','--height','320','--out',out],{encoding:'utf8',env:{...process.env,...env},timeout:180000});
try{
 // 1. ffmpeg starts and fails at once (bad codec, full disk, killed): a fake ffmpeg that writes an empty file and exits 1.
 const bin=path.join(dir,'bin');fs.mkdirSync(bin);
 // It answers -version like a real one, so the failure comes mid-render.
 fs.writeFileSync(path.join(bin,'ffmpeg'),'#!/bin/sh\nif [ "$1" = "-version" ]; then echo "ffmpeg version fake"; exit 0; fi\n'+
  'for a; do last="$a"; done\ncase "$last" in *.mp4) : > "$last";; esac\necho "fake ffmpeg: encoder failed" >&2\nexit 1\n',{mode:0o755});
 const bad=path.join(dir,'bad.mp4');
 const r1=render(bad,{PATH:bin+path.delimiter+process.env.PATH});
 assert.notEqual(r1.status,0,'a failed ffmpeg must fail the render\n'+r1.stdout+r1.stderr);
 assert.match(r1.stderr,/ffmpeg/i,'the error names ffmpeg');
 assert.equal(fs.existsSync(bad),false,'no file is left at --out');
 assert.deepEqual(fs.readdirSync(dir).filter(f=>f.startsWith('bad')),[],'no partial file is left beside it either');

 // 2. ffmpeg missing altogether.
 const none=path.join(dir,'none.mp4');
 const r2=render(none,{PATH:path.join(dir,'empty-path')});
 assert.notEqual(r2.status,0);assert.match(r2.stderr,/ffmpeg/i);assert.equal(fs.existsSync(none),false);

 // 3. A real render of 12 frames: exit 0, and the file holds them. An old file at --out is replaced, not appended to.
 const good=path.join(dir,'good.mp4');fs.writeFileSync(good,'old');
 const r3=render(good);
 assert.equal(r3.status,0,r3.stdout+r3.stderr);
 const frames=spawnSync('ffprobe',['-v','error','-count_frames','-select_streams','v','-show_entries','stream=nb_read_frames','-of','csv=p=0',good],{encoding:'utf8'}).stdout.trim();
 assert.equal(frames,'12');
 console.log('RENDER_FAILURE_BROWSER_PASS: failed and missing ffmpeg exit non-zero with no file; a real render writes 12 frames');
}finally{fs.rmSync(dir,{recursive:true,force:true})}
