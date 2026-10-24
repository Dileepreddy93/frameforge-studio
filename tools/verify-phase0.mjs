#!/usr/bin/env node
// Verify actual V4 archive bytes and metadata, not repository statements.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ourFilm=path.join(repo,'media/v4-review/frameforge-v4-complete-director-41s.mp4');
const expected='7aa90314e91208ad14254b70f2e5b8738c3333544789a46ea167b9e41daf4590';
function command(name,args) {
 return execFileSync(name,args,{encoding:'utf8',timeout:150000,maxBuffer:20*1024*1024});
}
function measure(filepath) {
 assert.ok(fs.existsSync(filepath),'Missing actual video file '+filepath);
 const st=fs.statSync(filepath);
 assert.ok(st.isFile()&&st.size>10000,'Unexpected video file size');
 const sha256=crypto.createHash('sha256').update(fs.readFileSync(filepath)).digest('hex');
 const probe=JSON.parse(command('ffprobe',['-v','error','-count_frames','-show_entries',
 'format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,nb_read_frames,channels',
 '-of','json',filepath]));
 const video=probe.streams?.find(x=>x.codec_type==='video');
 const audio=probe.streams?.find(x=>x.codec_type==='audio');
 assert.ok(video&&audio,'Actual H264 video and AAC audio streams required');
 return {basename:path.basename(filepath),bytes:st.size,sha256,duration:+probe.format.duration,
  video:{codec:video.codec_name,width:video.width,height:video.height,fps:video.r_frame_rate,frames:+video.nb_read_frames},
  audio:{codec:audio.codec_name,channels:audio.channels}};
}
const v4=measure(ourFilm);
assert.equal(v4.sha256,expected);
assert.equal(v4.bytes,11682636);
assert.equal(v4.video.codec,'h264');
assert.equal(v4.video.width,480);assert.equal(v4.video.height,854);
assert.equal(v4.video.fps,'30/1');assert.equal(v4.video.frames,1254);
assert.equal(v4.audio.codec,'aac');assert.equal(v4.audio.channels,2);
assert.ok(Math.abs(v4.duration-41.842358)<0.05);
command('ffmpeg',['-hide_banner','-v','error','-xerror','-i',ourFilm,'-f','null','-']);
console.log('PHASE0_V4_SHA_FFPROBE_DECODE_PASS',JSON.stringify(v4));

const at=process.argv.indexOf('--reference');
if(at>=0) {
 const provided=process.argv[at+1];
 assert.ok(provided,'--reference requires a real local file path');
 const real=path.resolve(provided);
 assert.equal(path.basename(real).toLowerCase(),'git-blame.mp4','Exact named reference file required. Do not silently relabel other uploads.');
 const ref=measure(real);
 // Having a file called git-blame.mp4 does NOT prove it is an authenticated source original.
 console.log('PHASE0_REFERENCE_CANDIDATE_MEASURED_IDENTITY_NOT_YET_APPROVED',JSON.stringify(ref));
}
