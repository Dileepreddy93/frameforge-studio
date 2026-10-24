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
