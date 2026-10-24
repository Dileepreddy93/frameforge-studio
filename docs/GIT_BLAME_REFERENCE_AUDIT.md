# FrameForge P0 — actual user-supplied Git Blame reference audit
Measured 2026-10-24 from **/mnt/data/git-blame.mp4** — not the different 65469.mp4.
Machine-readable manifest: `spec/git-blame-reference.json`; 27 candidate intervals: `docs/GIT_BLAME_SHOT_MATRIX.csv`.

## Source identity and reproducibility
- User-designated `git-blame.mp4` SHA-256 **560ca0dd7fc3b8f0e762dd818423a15e2192029f40383765a5db52b49029247e** (3365415 bytes). This is a VERIFIED HASH of accessible bytes, not a claim that publisher provenance was independently authenticated.
- Actual `ffprobe`: 52.181 s, 720x1280, 30/1 FPS, 1,564 video frames, H.264 video, 48-kHz stereo AAC. FFmpeg full decode with `-xerror` returned success.
- Measured audio first-pass FFmpeg loudnorm: **-14.38 LUFS** integrated, **-0.79 dBTP**, LRA 4.60 LU. These signal metrics do NOT prove voice acting quality or lip-sync.
- 24 native 720x1280 PNGs extracted by existing `tools/capture_reference.py`, with per-frame timestamps and SHA256 in the manifest. Raw third-party film and PNGs **not added to Git**. To regenerate, supply the exact source video locally.
- FFmpeg scene-cut threshold 0.22 produced **26 transition candidates / 27 intervals**; intervals are approximations that include possible cuts from changes in content/motion. Each was sampled visually, but cut boundaries have not been hand-tuned.

## Observed creative characteristics (not inferred private engine internals)
- Low-poly / faceted purple-clad human with irregular spiky brown hair and a red cube robot with deliberately sparse eyes and mouth. Silhouettes and model scale stay recognizably consistent across repeated angles.
- Large, continuous desk/keyboard world, towering code/conversation dashboards and warm glowing elements make the same small environment feel story-specific rather than generic.
- Blue/violet ambient scene contrasted with warm amber-orange side/rim illumination and saturated red on the robot. Lighting helps separate the face and hair planes.
- Frequent dialogue alternation among tight human closeups, red-robot closeups, canted responses and a handful of establishing/wide shots. Important panels remain visually relevant to the joke.
- Human brows, gaze, head turns, arm poses, camera cuts and reactions communicate more intention than idle head bobbing. The robots achieve readable expressions with simplified shapes.
- Short white subtitle-like dialogue overlays are visible in sampled frames, including when the backdrop is dark. Some sampled captions crowd heads/faces; DO NOT treat them as a universally approved safe-zone design.
- The final wide shot restores scene geography with both actors and multiple background software panels.
- This is **stylized cinematic appeal**, not physically photorealistic anatomy; the target is coherent design/acting/direction and sound, not just more polygons.

## FrameForge gap diagnosis linked to implementation
1. `index.html` and `character-lab.html`: existing DEV / BLUE / ORANGE have art tests, but no approved character-specific identity and rig expression quality. Need P1 closeups/turnarounds and proven repaired seams/face performance.
2. `src/performance-core.js`: five procedural emotions and blink/brow parameters are a foundation. Need authored anticipations, reactions, body-weight and gesture timing before parity.
3. `src/speech-performance-core.js`: V5.3 approximate acoustic mapping cannot replace phoneme-aligned multilingual speech; verify on native Telugu/Hindi and English actual vocals.
4. `projects/zero-latency.frameforge.json`: our 14 scripted shots in 41.8 s are not one-to-one with ~27 reference cut candidates in 52.181 s. Compare purposeful reaction frequency, not raw cut count alone.
5. `index.html` sets and camera: reproduce environmental story depth, eyeline/face framing, physically linked shadows and readable meaningful software panels rather than copying proprietary scenes.
6. `docs/VISUAL_QUALITY_RUBRIC.md`: actual P8 pass requires matched-sized decoded *output* frames, full media playback/listen-through and explicit blocker-free acceptance, NOT a successful source test.

## Open acceptance work
- Exact shot transition times need manual review, and frame-by-frame expression progression remains unmeasured; do not call these hand-verified edits.
- No audible voice/listening QA or word/phoneme-caption alignment was carried out here; loudness numbers cannot substitute.
- No matched FrameForge V4/V5 side-by-side stills generated in this commit, and no new competitive video has been rendered.
- User has permitted source research; this audit deliberately commits only factual metadata/shot descriptions, **not** redistributed original film.
