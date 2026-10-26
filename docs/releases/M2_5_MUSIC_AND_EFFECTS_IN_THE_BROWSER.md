# M2.5 · Music and sound effects in the browser

Browser-voiced episodes now have their music and sound effects. When a line in a finished episode is edited, the
episode is re-voiced in the browser and keeps its score and cues; before this, the edit dropped them. Playback, the
WebM recording and the MP4 export all use the new stereo master.

## How
- `src/sound-kit.mjs` (moved from `tools/`) synthesises the music and effects. `tools/build-audio.mjs` and the studio
  share it, so both make the same notes.
- `src/episode-mix.mjs` mixes and masters the soundtrack the way `build-audio.mjs` does. Effects play at −9 dB, at
  their cue times. The music plays at −15 dB from the episode's `audio.music` cues and ducks under speech
  (8:1 above 0.02, 15 ms attack, 350 ms release). The master goes to −14 LUFS through a linked limiter at −2 dBFS
  (peak) for a true peak under −1 dB. It runs in `src/mix-worker.js` and takes about 0.35 s for a 9 s cut.
- Lip sync still follows the voice track alone. Neutral-voice output from M2.1 and M2.2 is unchanged.

## Measured
- Zero Latency's own `voice.mp3`, mixed by the browser code, against its ffmpeg-made `mix.mp3`: correlation 0.971
  (2 ms apart, the offset between the two MP3 encodes), −14.05 vs −14.04 LUFS.
- An edited four-shot cut of Zero Latency in the studio: music and both sound cues kept. The MP4 is stereo AAC at
  −14.1 LUFS with a −1.9 dBTP true peak.

## Tests
- `node tests/episode-mix.test.mjs`: no model, runs in CI. Checks loudness, ceiling, ducking, cue timing, determinism
  and parity with the offline master.
- `tests/episode-mix-browser.cjs`: real model. Set `FRAMEFORGE_MIX_OUT=dir` to keep the MP4.

## Export libraries (logged for M2.5; your decision)
Both are loaded by the buyer's browser from jsDelivr at pinned versions. This repository doesn't copy or modify them.
- **mediabunny 1.62.1** (MP4 muxing): MPL-2.0. This is file-level copyleft: using it unmodified needs only its
  licence notice. Modified files of it would have to be published under MPL-2.0.
- **@mediabunny/aac-encoder 1.62.1**: declared MPL-2.0. Its README says it's a WASM build of FFmpeg's AAC encoder.
  FFmpeg's native AAC encoder is LGPL-2.1-or-later code. The npm package ships no FFmpeg licence text or build
  configuration, so I couldn't confirm the build options from the package. It loads only in browsers whose WebCodecs
  can't encode AAC; Chrome encodes AAC natively. If LGPL isn't acceptable on your licence list, the options are to
  export Opus audio in the MP4 on those browsers, or to refuse the export there.

## Rollback
Revert this commit. Browser-voiced episodes go back to a voice-only track. `tools/build-audio.mjs` only changes its
import path.
