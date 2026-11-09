// FrameForge Ultimate P0 regression guard.
// Protects the checked-in ORIGINAL FrameForge V6 projects and media from accidental
// modification during the Ember integration. Future film render parity requires separate
// pinned-browser frame/audio tests; these blob hashes are only immutable input evidence.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'spec/hybrid-v6-baseline.json'), 'utf8'));
const core = require('../src/project-core.js');

function fileAt(rel) {
  assert.ok(!path.isAbsolute(rel) && !rel.split('/').includes('..'), 'unsafe baseline path: ' + rel);
  const abs = path.join(root, rel);
  assert.ok(fs.statSync(abs).isFile(), 'missing protected fixture: ' + rel);
  return abs;
}
function gitBlobSha1(file) {
  const bytes = fs.readFileSync(file);
  const hash = crypto.createHash('sha1');
  hash.update(Buffer.from('blob ' + bytes.length + '\0'));
  hash.update(bytes);
  return hash.digest('hex');
}
function checkBlob(rel, expected) {
  assert.match(expected, /^[0-9a-f]{40}$/);
  assert.equal(gitBlobSha1(fileAt(rel)), expected, 'protected V6 release asset changed: ' + rel +
    '. This requires an explicit compatibility review, NOT an automatic baseline update.');
}
assert.equal(manifest.baseline_commit, '2b78e60fd484f6590276f041bfafc977aa4ef479');
for (const asset of manifest.assets) checkBlob(asset[0], asset[1]);
for (const fixture of manifest.projects) {
  checkBlob(fixture.path, fixture.git_blob_sha1);
  const p = JSON.parse(fs.readFileSync(fileAt(fixture.path), 'utf8'));
  assert.equal(p.schema, 'frameforge.project/1', fixture.id + ' keeps v1 schema');
  assert.equal(p.id, fixture.id);
  assert.deepEqual(p.output, {width:1080,height:1920,fps:30});
  assert.equal(p.shots.length, fixture.shots);
  assert.deepEqual(p.characters.map(c => c.id), fixture.actors);
  assert.ok(Math.abs(p.shots.reduce((a,s)=>a+s.duration,0)-fixture.seconds)<0.000001);
  assert.equal(p.audio.state, 'mastered');
  assert.ok(core.validateProject(p).valid, fixture.id + ' v1 schema still valid');
  assert.doesNotThrow(()=>core.assertRendererCompatible(p), fixture.id + ' legacy renderer still accepts project');
  const shots=core.toTimelineShots(p);
  assert.equal(shots.length,fixture.shots);
  assert.deepEqual(shots.map(s=>s.id),p.shots.map(s=>s.id));
  assert.ok(fs.existsSync(fileAt(p.audio.masterUrl)) && fs.existsSync(fileAt(p.audio.voiceUrl)));
}
console.log('HYBRID_P0_BASELINE_PASS: 2 original projects, 13 media assets, project schema and legacy compatibility');

// Optional media validation runs only in CI jobs that install ffprobe and ffmpeg.
// Do NOT mark media verified if media checks were not actually executed.
if (process.argv.includes('--media')) {
  const probe = file => JSON.parse(cp.execFileSync('ffprobe',
    ['-v','error','-show_entries','format=duration:stream=codec_name,codec_type,width,height,r_frame_rate',
      '-of','json',file], {encoding:'utf8',timeout:120000}));
  for (const expected of manifest.media_expectations) {
    const file=fileAt(expected.path),info=probe(file);
    const video=info.streams.find(s=>s.codec_type==='video');
    const audio=info.streams.find(s=>s.codec_type==='audio');
    assert.ok(video && audio, expected.path + ' has video and audio');
    assert.equal(video.codec_name,expected.video);
    assert.equal(audio.codec_name,expected.audio);
    assert.equal(video.width,expected.width);
    assert.equal(video.height,expected.height);
    assert.ok(Math.abs(Number(video.r_frame_rate.split('/')[0]) /
      Number(video.r_frame_rate.split('/')[1])-expected.fps) < .01);
    assert.ok(Math.abs(Number(info.format.duration)-expected.seconds)<.5,
      expected.path+' duration is still within 0.5 s of the approved episode');
    // Decode H.264 MP4s in full; WebM VP9+Opus assets are codec/duration probed.
    if (expected.video==='h264') cp.execFileSync('ffmpeg',
      ['-v','error','-xerror','-i',file,'-f','null','-'],
      {encoding:'utf8',timeout:180000,stdio:['ignore','pipe','pipe']});
    console.log('HYBRID_P0_MEDIA_VERIFIED '+expected.path+' '+expected.video+'/'+expected.audio);
  }
  console.log('HYBRID_P0_MEDIA_PASS: 4 container probes, 2 complete MP4 decodes');
} else {
  console.log('HYBRID_P0_MEDIA_NOT_RUN: use --media in CI job with ffprobe and ffmpeg');
}
