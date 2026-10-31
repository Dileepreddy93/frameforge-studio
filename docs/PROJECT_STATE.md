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
| Look | matte flat-shaded low-poly, one warm key and one blue rim, a character-only key and a black lift (M5.3), STYLE.md palette, white captions at 31%, screen inserts in the screen palette | `STYLE.md`, `docs/releases/M4_3_*` |
| Voices | Kokoro-82M in the browser (WebGPU or WASM), emotion, British English for `b*_` voices, pronunciations, timing | `docs/releases/M2_*` |
| Sound | synthesised music and effects, ducking, mastered to −14 LUFS in the browser and offline | `docs/releases/M2_5_*`, `M4_1_*` |
| Episodes | Zero Latency (36.97 s) and Dark Mode (32.50 s), re-voiced and rendered at 1080×1920 | `docs/releases/M4_1_*`, `M4_2_*` |
| Export | frame-exact MP4 in the browser: H.264, with AAC or Opus audio | `docs/releases/M4_4_*` |
| Offline | the whole studio after one visit, including voicing new lines | `docs/releases/M2_6_*`, `M4_5_*` |
| Licences | no GPL or LGPL in what buyers run; credits page; research rigs and undocumented V3 audio aren't deployed | `docs/releases/M4_4_*`, `credits.html` |

## Known gaps (honest)
- **Not reference parity.** Cutting pace and camera life now measure close to the reference (M5.4: 1.85 / 1.91 s
  per shot against 1.93; 0.2% / 2.0% near-still frames against 1%), but our close-ups move more than its close-ups,
  and DEV's face is still darker (M5.3). Ranked in
  `docs/releases/M4_3_REFERENCE_COMPARISON.md`. Not parity. The set was rebuilt as the screen arena (M5.1) and the
  screen shots moved onto its story window (M5.2); its screens are still brighter and sharper than the reference's. Light (M5.3): a character key and a black lift
  bring the blacks and the robots' highlights to the reference's numbers; DEV's face stays darker than its pale face
  (`docs/releases/M5_3_LIGHT.md`).
- The user still has to judge the M4.1 voices by ear (DEV's "worried" may sound neutral).
- The Opus fallback (no AAC encoder, e.g. Chrome on Linux) narrows the music's faint stereo.
- Tested only in Chrome on Linux and phone emulation; Safari, Firefox and real phones are untested.
- The phone layout (M5.5) was checked only in Chromium emulation, not on a real phone or in Safari.
- Hindi and Telugu voices aren't connected.
