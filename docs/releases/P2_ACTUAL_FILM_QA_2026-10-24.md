# P2 five-second muted acting — complete technical verification and artistic rejection
Review date 2026-10-24 | Experimental PR #16, NO production/develop merge at time of review.
Sources: `src/acting-study-core.mjs`, `asset-lab.html`, `tests/acting-study-core.test.mjs`, `tests/acting-study-browser.cjs`.

## Actual 150-frame film evidence
- GH Actions clean-run `40102526756` ALL FOUR jobs SUCCESS: `source-and-project-tests`, `rigged-character-import`, `real-character-render-tests` and `portable-video-export`.
- Artifact `frameforge-p2-actual-silent-5sec-30fps-film` (ID `12562899629`): valid native 330x590 center-cropped output from 617x590 Three.js WebGL source frames, 9:16 aspect within tolerance, H.264 `yuv420p`, 30 FPS, exactly 150 decoded video frames / 5.000s and **no audio stream**. Source is NOT native 1080x1920 or a fully authored animated movie.
- Full FFmpeg `-xerror` decode succeeds; output bytes **193,200** and SHA256 `d628a3dd85e62bdfb0d5e83594a43122b6c1bbb38d5af5db7fea225650eba806`. Independently reverified from downloaded zip/manifest in runtime.
- All 150 rendered PNG frames have individual deterministic frame times; 14 chosen PNGs in artifact. Additional full MP4 analysis extracted 15 video frames at every 1/3 sec and visually reviewed face/head/shoulders.
- This is one original silent reaction study, not a user-directed reference-recreation or voice model integration.

## Human visual QA at the actual MP4 frame size
- Listening/suspicion frames: eye/brow direction and frown visible, but largely static neck/torso and missing eye-accommodation microacting.
- ~1.33–1.67s surprised frames: after reducing jawOpen from .86 to .45, teeth no longer grotesquely overexposed, but gasp still artificial and lacks shoulder/body response.
- ~2s silent blink is evident, but blink transition is abrupt and remains unmotivated by secondary body performance.
- ~2.5–4.5s downcast→relief/smile does emerge through mouth and slight head movement, but shoulder/hand posing and environmental stakes are absent.
- The actor's semi-realistic look differs from the target Git Blame stylized low-poly original art bible. A technically valid human GLB does not automatically improve story aesthetics.

**Decision: technical vertical slice PASS; ARTISTIC PHASE 2 GATE NOT APPROVED. Keep PR #16 DRAFT and unmerged while cinematic acting defects remain.**

## Implementation failures we actually fixed during this PR
1. Separate five-runner environment failed `spawnSync ffmpeg ENOENT`: source stills were valid, video not encoded.
2. Installed dependency re-attempt stalled due redundant apt/browser setup; moved film renderer into proven `portable-video-export` job, eliminating duplicate CI runner.
3. Initial `libx264` failed because real WebGL source canvas was **617x590** (odd width for YUV420). Fixed with real native-pixel center crop to even **330x590**, confirming FFmpeg acceptability and 9:16 ratio.
4. First real model output had too-open toothy jaw. Visually reduced jaw/mouth stretch and inspected the revised video, not just code changes.

## Next step priority
GitHub Issue #17: physically directed 5–10s micro-performance using real `Spine`, `Spine1`, `Spine2`, shoulders, arms, hands and reference-lighting story-specific prop/screen. Coordinate facial acting with anticipation/reaction/settle and maintain exact deterministic seeking. P1 character art acceptance Issue #13 remains independently open. Do not treat this as 9-phase full completion, arbitrary character authoring, multilingual speech/lipsync, or native final rendering.
