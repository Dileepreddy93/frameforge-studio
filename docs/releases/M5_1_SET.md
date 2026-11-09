# M5.1 · The set: density and scale, designed first

Part 1 drew three set directions in 2D. **You picked C, the screen arena (2026-10-26).** Part 2 built it in three.js,
re-framed the wides and two-shots for it, re-rendered both films and re-made the landing media.

## What the reference does (measured)
Every shot of `git-blame.mp4` was found by scene detection (27 shots, cuts at a 0.22 scene score), and the middle frame
of each was read against a 5% grid (frames in `~/Desktop/Animate/proof/v6/M5.1/ref/`, outside the repo):
| | reference | V6 before M5.1 | V6 after M5.1 |
|---|---|---|---|
| cast height in wides | 9–11% (shot 27), 17–21% (shot 3) | DEV 58% (the `duo` shot; there was no wide) | DEV 18% (shot 06 / 05) |
| two-shot / medium | medium wide, cast ~30% | — | DEV 38% (shot 14 / 12) |
| key width / character height | ~0.27–0.3 | no keyboard | 0.34 |
| app windows | 6–8 in a wide, 2–4 behind a close-up | 1 dashboard + 1 side screen | 6–10 in a wide, 3–4 behind a close-up |

Our heights are from the camera geometry (DEV 2.88 world units against the frame height at his distance) and match
the rendered frames.

## Part 1: three directions in 2D (`design/set-directions.html`)
Flat-shaded SVG in perspective (`design/set-forms.js`, new), lit like the characters, with the approved cast drawn
at true scale by their own sheet code: A (laptop landscape), B (desk canyon), C (screen arena), and A′ (A with
soft focus and glow, for the open STYLE.md question). Each as a wide, a two-shot, a close-up at the studio's own
framing, and a plan. Proof: `directions-vs-ref.jpg`.

## Part 2: the screen arena in three.js
- `design/set-arena.js` (new) holds the approved numbers: a 16-sided violet plaza (r 3.2), a field of keycaps
  (pitch 0.8, kept between r 3.5 and 9.2), 15 windows in three tiers on a half-ring (R 10.5 / 12 / 13.5) facing the
  plaza, 4 windows behind the camera (R 17) for reverse angles, and the big story window in the middle. The sheet and
  the build both read it.
- `src/arena-set.js` (new) builds it into the studio's world: DEV units × `DEV_S`, the plaza top at DEV's feet.
  Flat Lambert facets in the studio's key and rim; keycaps as two `InstancedMesh`es (violet tops for 8%); each window
  a bezel, an unlit canvas screen drawn from the shared app layouts (`FrameForgeSet.drawCanvas`, new) and a post; an
  additive pink-violet pool on the plaza. The story window shows each shot's `wall`, as the old wall screen did.
- `studio.html`: the old floor, back wall, stage box, desk, the hidden V5 set (`artGroup`, ~100 lines) and the two
  wall monitors are gone; the plaza is the new `stageBox` (the art lab still keeps it under posed characters).
- Cameras (`src/project-core.js`): the `wide` preset is now a real wide (distance 21, up 4.34, lookUp 3.5, fov 40)
  and `duo` a two-shot that shows the set (9.4, 1.5, 0.6, 40). Presets now carry `lookUp`. Framing ranges widen to
  distance 1–30, up −1..10, lookUp −1..6 (`docs/PROJECT_FORMAT.md`); older projects stay valid.
- Episodes: the first two-shot of each film is now the arena's wide (Zero Latency shot-06 "Okay. One tiny change.",
  Dark Mode shot-05 "Easy on the eyes. Nothing fancy."); the closing two-shots (shot-14 / shot-12) are re-framed.
  Only camera and framing values changed; audio, timing and acting are untouched.
- STYLE.md: the set, the wide and two-shot framing, and the pool now describe the arena.

Found on the way: the 2D sheet painted all windows behind the cast, which hid that the wide camera looked through the
backs of the reverse-angle windows. In 3D that blacked out half the wide. The reverse ring moved from R 10.5 to 17
(with a gap behind the wide camera), and the sheet now depth-sorts those windows with the cast.

## Measured and checked
- Renders (`render-episode.mjs --gpu`): Zero Latency 1,109 frames in 51 s, Dark Mode 975 in 45 s (M4.2: 86 and
  77 s; the hidden V5 set is gone).
- Every shot of both films, one frame each at 60%: `zero-latency-sheet.jpg`, `dark-mode-sheet.jpg`.
- Next to the reference by shot type (wide, wide, medium, DEV close-up, robot close-up): `world-vs-ref.jpg`; in
  motion, 15 s of the reference next to ours around our wide: `side-by-side-15s-ref-vs-ours.mp4`.

**Still behind the reference (not parity):** our screens are brighter, more saturated and sharp where the
reference's are dim and soft (the A′ question is still open); in wides the cast stand on a large plain violet plaza
where the reference's stand right on the keys; DEV's close-ups still show him almost to his feet (framing, not set);
the key light (M5.3) and the flat screen inserts (M5.2) are unchanged.

## Landing media (`media/v5/`)
Re-made from the new renders the M4.2 way: 720×1280 H.264 + AAC (0.70 Mb/s) and VP9 + Opus (0.66–0.73 Mb/s) reels,
posters at 0.8 s, caption-free cast cards (480×600) at the same moments (DEV 5.61 s, BLUE 25.38 s, ORANGE 30.70 s;
robot crops lowered to keep the head in the top half). Before and after: `landing-media.jpg`; the old files are in
`proof/v6/M5.1/landing/before/`.

## Proof (`~/Desktop/Animate/proof/v6/M5.1/`)
`directions-vs-ref.jpg`, `world-vs-ref.jpg`, `side-by-side-15s-ref-vs-ours.mp4`, `zero-latency-1080x1920.mp4`,
`dark-mode-1080x1920.mp4`, `*-sheet.jpg`, `frames/`, `landing-media.jpg`. Tools (outside the repo):
`~/Desktop/Animate/tools/look/m51_sheet.py`, `m51_contact.py`, `m51_pairs.py`.

## Tests
Unit tests (12). Browser: `phase0-video-playback`, `character-art` (dev, blue, orange), `robot-build`, `performance`,
`speech-performance`, `determinism`, `episode-data`, `studio-editor`, `landing`, `export-codec`, `offline-episode`,
`project`, `project-import-export`, `episode-mix`. `project-core.test` now expects the new wide preset and records
shot-06's deliberate camera change against the V3 source.

## Rollback
Revert the part 2 commit: the old set, cameras, episode framings and landing media come back (the old media are also
in `proof/v6/M5.1/landing/before/`). Part 1 (the design files) can stay; nothing in the studio loads the sheet.
