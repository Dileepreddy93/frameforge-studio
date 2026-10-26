# FrameForge Studio: project state (V6, 2026-10-26)

## What it is
A studio in the browser. You write a short script (or open an episode), and it voices every line in your browser,
times the shots to the voices, acts and films three original low-poly characters, scores it, captions it and exports
a 1080×1920 MP4. Buyers use it alone: no keys, no server, nothing paid per video.

## Live
- V6: https://frameforge-v6.vercel.app (project `frameforge-v6`, deployed 2026-10-26 by CLI; see
  `docs/releases/M4_5_DEPLOY_V6.md`).
- `frameforge-3d-director-preview.vercel.app` is the protected older project. It serves V5 since 2026-10-25. Its V3
  code is tag `v3.0-stable`.

## Built and verified
| Area | State | Evidence |
|---|---|---|
| Characters | DEV, BLUE and ORANGE: 2D model sheets approved by the user, built in 3D, acting on springs and key poses | `design/*-model-sheet.html`, `docs/releases/M3_*` |
| Look | matte flat-shaded low-poly, one warm key and one blue rim, STYLE.md palette, white captions at 31%, screen inserts in the screen palette | `STYLE.md`, `docs/releases/M4_3_*` |
| Voices | Kokoro-82M in the browser (WebGPU or WASM), emotion, British English for `b*_` voices, pronunciations, timing | `docs/releases/M2_*` |
| Sound | synthesised music and effects, ducking, mastered to −14 LUFS in the browser and offline | `docs/releases/M2_5_*`, `M4_1_*` |
| Episodes | Zero Latency (36.97 s) and Dark Mode (32.50 s), re-voiced and rendered at 1080×1920 | `docs/releases/M4_1_*`, `M4_2_*` |
| Export | frame-exact MP4 in the browser: H.264, with AAC or Opus audio | `docs/releases/M4_4_*` |
| Offline | the whole studio after one visit, including voicing new lines | `docs/releases/M2_6_*`, `M4_5_*` |
| Licences | no GPL or LGPL in what buyers run; credits page; research rigs and undocumented V3 audio aren't deployed | `docs/releases/M4_4_*`, `credits.html` |

## Known gaps (honest)
- **Below the reference** (`git-blame.mp4`) in set density and scale, in-world screen shots, key light, cutting
  pace and camera life. Ranked in `docs/releases/M4_3_REFERENCE_COMPARISON.md`. Not parity.
- The user still has to judge the M4.1 voices by ear (DEV's "worried" may sound neutral).
- The Opus fallback (no AAC encoder, e.g. Chrome on Linux) narrows the music's faint stereo.
- Tested only in Chrome on Linux and phone emulation; Safari, Firefox and real phones are untested.
- The studio's phone layout puts the controls above the film monitor.
- `tools/render-episode.mjs` exited 0 once with an empty MP4 when ffmpeg failed.
- Hindi and Telugu voices aren't connected.
