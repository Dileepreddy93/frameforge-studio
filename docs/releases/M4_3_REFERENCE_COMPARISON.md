# M4.3 · V6 against the reference (git-blame.mp4)

**This is not parity.** The V6 films are clearly behind the reference in set, light and cutting (ranked below).
They are ahead of it on character faces and voice.

The reference is `~/Desktop/Animate/git-blame.mp4` (SHA-256 `560ca0dd…247e`, matching `spec/git-blame-reference.json`).
Its frames stay outside this public repo. The paired frames are in `~/Desktop/Animate/proof/v6/M4.3/`:
- `pairs/closeup-human.jpg`: reference 1.5 s | Zero Latency shot-01;
- `pairs/closeup-robot.jpg`: reference 14.2 s | shot-05 (ORANGE);
- `pairs/twoshot-wide.jpg`: reference 33.6 s | shot-06;
- `pairs/screen.jpg`: reference 43.5 s | shot-07 (before this step's fix);
- `pairs/medium-human.jpg`: reference 9.8 s | shot-14;
- `side-by-side-15s-our-audio.mp4` and `ab-sequential-ref-then-ours.mp4`: the first 15 s of both, to judge acting
  timing in motion;
- `after-*-sheet.jpg`: every shot after the fixes.

## Measured
| | reference | V6 (Zero Latency / Dark Mode) |
|---|---|---|
| shots, mean length | 27 in 52.2 s, 1.93 s (median 1.97) | 14 in 37.0 s, 2.64 s / 12 in 32.5 s, 2.71 s |
| loudness, LRA | −14.3 LUFS, 4.2 LU, true peak −0.79 dBTP | −14.0 LUFS, 4.8 / 4.5 LU, −1.7 / −1.6 dBTP |
| close-up luma p5 / mean / p95 | ~10 / 48 / 172–194 | ~0 / 29–36 / 94–104 |
| motion inside shots (median frame change) | 1.21 | 1.12 / 1.16 |
| near-still frames | 1% | 16% / 16% |
| caption centre, weight | ~35% of height, semibold | 31%, extra bold (STYLE.md) |
| speech pace | not measured (no transcript) | 139 / 166 words per minute of speech |

Measured with ffmpeg `ebur128`, luma percentiles of the paired frames, and the mean absolute luma change between
frames 1/15 s apart at 90×160 (cuts excluded).

## Gaps, ranked by how much they separate the films
1. **Set density and scale.** The reference's set is walls of in-world app screens (inbox, review, changelog,
   terminal) and a giant keyboard the characters stand on, so its wides read as miniatures in a huge workstation.
   Ours: one dashboard monitor, a dark void, a violet desk. Wides are medium two-shots. → M5 (set build).
2. **The story on in-world screens.** The reference has no overlay cards: its screens are monitors in the set, seen
   in perspective and often cropped. Our `screen` shots are full-frame flat cards (now in the STYLE palette, see
   below). → M5 (in-world insert shots).
3. **Light.** The reference's key is harder and warmer: lit faces reach peach highlights (p95 172–194 against our
   94–104), blacks lift to a purple haze (p5 ~10 against ~0), and the hair has a warm rim. Part of the gap is DEV's
   approved brown skin against a pale reference face. I tried a stronger key (4.4 → 6 → 7.5: p95 only 91 → 117) and
   two side positions. The side key cast hair and glasses shadows across DEV's eyes, which STYLE.md forbids, so
   I reverted it (`proof/v6/M4.3/light/`). → M5: a character key that brightens without face shadows, plus a black
   lift, for you to judge.
4. **Cutting pace.** The reference cuts about 37% faster and uses more reaction cuts (robot, human, robot).
   → M5 (shot planner: reaction cuts and shorter holds).
5. **Camera never rests.** 16% of our frames are near-still (static shots and inserts) against 1% in the reference.
   → M5: a slow drift on every hold, including inserts.
6. **Depth of field and glow.** The reference softens the background text and lets highlights bloom. STYLE.md says
   "no depth of field, no bloom". Your call whether STYLE.md should change.
7. **Captions.** Close enough. The reference sits a little lower (~35%) and lighter (semibold). Not changed.
8. **Audio.** Loudness and range match within 0.3 LUFS and 0.6 LU. The reference's true peak is over −1 dBTP; ours
   isn't. Speech pacing needs your ears: use the sequential A/B.

Where V6 is ahead: the faces. The reference robot is two black squares, and its human has dot eyes. Ours have
designed, readable emotions (worried brows behind glasses, ORANGE's deadpan lids, BLUE's arcs), voiced with
emotion.

## Fixed in this step (the cheap ones)
- **Caption over screen inserts:** on `screen` shots the caption now sits above the card (11.5% of height), clear of
  its text. Before, it printed over the card's context line.
- **Insert palette:** the card now uses STYLE.md's screen colours (void `#100C1B`, glass `#151029`, bezel `#0B0A12`,
  mono title `#A7A1C7`, state `#FC5757`/`#44E082` with a 3 px rule, code `#79C5FF`, tinted status band) instead
  of the old V5 blue.
- **BLUE's close-ups:** the camera's sideways offset went from +0.15/+0.2 to −0.8, in both episodes and in BLUE's
  default framing (`src/project-core.js`). That removes the cropped slice of DEV's head at the frame's left edge
  (`proof/v6/M4.3/framing/`).
- Both films were re-rendered, and `media/v5/` was re-made from them (reels, posters, BLUE's cast card).

## Tests
Unit tests (12), `determinism`, `episode-data`, `robot-build`, `studio-editor`, `project`, `landing`, `performance`,
`speech-performance`, `character-art blue`.

## Rollback
Revert this commit: the insert card, caption position and BLUE framing come back, and so does the M4.2 landing media.
