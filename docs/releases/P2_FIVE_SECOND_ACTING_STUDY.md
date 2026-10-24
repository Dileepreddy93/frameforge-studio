# P2 vertical slice — five-second directed silent original acting study
Date 2026-10-24. Original MakeHuman/Ara GLB research actor, 69-bone skeleton, 20 named morph shapes, 63 available clips (unrelated imported motion library).

## Artistic intent
A single character listens, grows suspicious, suddenly realizes an error, gasps, BLINKS IN SILENCE, processes the consequence, and gradually smiles in relief. Story must read with absolutely no soundtrack or written dialogue. Six recognizable beats, no generic dialogue head-bob. Camera is true eye-level close-up from revised P1 viewport.

## Implementation
- `src/acting-study-core.mjs` is pure deterministic time→facial weights and Head/Neck/LeftEye/RightEye bone parameters; keyframe path uses smooth cubic interpolation, tiny independently-timed breathing and asymmetric gaze. No per-frame cumulative motion, no network/model AI inference.
- `asset-lab.html` adds separate playback, timeline scrub, pause/exit and intentionally disables the study on models without actual face morphs and appropriate bones. Produces actual rig mesh changes, restores original rig and manual controls on exit; original 63 motions remain accessible.
- Automated source test checks 151 exact 30 FPS poses for deterministic seeking, no silent mouth-on-blink, rig restoration and pose range.
- Actual browser export must create a H.264 30fps FIVE SECOND SILENT MP4, count 150 true rendered frames, review selected native frames and compare emotional readability. Cine acceptance remains open unless somebody reviews FULL mp4 with reference quality rubric.

## Why this is NOT P2 completion
No word or phoneme-aligned Telugu/Hindi/English acting, fully skinned hand gestures, authored body weight, cinematic lighting or props. This is one isolated emotional shot, not arbitrary-length directing and not quality parity. Do not merge if browser frames are corrupted; do not call it reference competitive based on 150 frames alone.

## Actual video acceptance procedure
Dedicated `muted-acting-film` CI renders 150 browser frames at absolute time `frame/30`, encodes H264/yuv420p using libx264/CRF20 (no audio), asserts 150 decoded frames and exactly 5s at 30fps, runs full FFmpeg decode, and saves 14 representative original PNG stills plus MP4 and SHA manifest in Actions artifact `frameforge-p2-actual-silent-5sec-30fps-film`.
No score on film/emotion quality until actual native MP4 played and visually inspected. Source tests pass alone are insufficient. Robust against random seeking and accidental injected voice track.

## Initial real-frame review / rejected surprise mouth — 2026-10-24
First independent CI run 40101322110 actually rendered all 150 WebGL frames in ~65 seconds and preserved 14 original PNGs in artifact 12563346810. The film job failed ONLY at actual encoding because its runner lacked `ffmpeg` (spawnSync ENOENT); rig importer and pure P2 source tests PASSED. Visually inspected real 14-frame contact sheet (stored in chat at `frameforge-p2-acting-study-first-review.jpg`): progression suspicion/surprise/recovery recognizable in stills, but jaw .86 produced exaggerated fully exposed teeth and uncannily static shoulders. This is NOT APPROVED art. Corrected surprise jaw to .45/.36, reduced mouthStretch, and added explicit apt FFmpeg installation + encoder availability check. Rerun and inspect whole video before saying the export works.

## CI optimization after first export failure
Instead of a fifth independent Ubuntu runner (which repeated slow Ubuntu apt update / Playwright install and stalled), the 150-frame P2 test now runs **inside the pre-existing proven `portable-video-export` job** after the V4 full decode and native short V5 performance MP4. This shares pinned Playwright Chromium 1.56.1 and working ffmpeg/libx264, so no redundant network setup. The exact same 5sec film validator still tests each of 150 native WebGL frames, H264 encode, 30fps, 5s, mute and complete decode; separate artifact retained. Tradeoff: portable-video-export CI job will run ~1–2min longer. No art acceptance claimed from CI.

## Second real-frame QA / correct video pixel format
Run 40102200391 via verified shared exporter generated all 150 actual WebGL frame PNGs, but `libx264` correctly rejected **617×590** RGBA canvas because `yuv420p` requires an EVEN luma width. This was a real stream-format bug; not an artistic/frame generation failure. Solution: FFmpeg **center-crops** the real 617×590 source to even 9:16 portrait ~332×590 using expression `crop=trunc(ih*9/16/2)*2:trunc(ih/2)*2:(iw-ow)/2:(ih-oh)/2`. Explicitly assert decoded output even dimensions, ratio within ±.008 of 9/16, 150 frames at 30fps, full 5.0s and no audio. The output is cropped *native source pixels*; it is NOT upscaled to claim professional 1080×1920. Full film QA remains open until new run passes and MP4 visually watched.

## FINAL first vertical slice verdict
Full actual MP4 PASS technically as described in `docs/releases/P2_ACTUAL_FILM_QA_2026-10-24.md`, but fails artistic/physical performance quality: weak shoulders/arms/torso, artificial gasp and not reference-compelling. New Issue #17 tracks targeted correction. Keep this PR as experimental and unmerged until visual gate met.
