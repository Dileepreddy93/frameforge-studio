# M5.3 · Light: a character key and a black lift

Part 1 drew three options on the real films and measured them. On 2026-10-31 the user left the pick to me. **Part 2
applies B's character key with A's black lift**, re-renders both films and re-makes `media/v5/`. See "Part 2" at the
end.

M5.2 (story on in-world screens) was approved by the user on 2026-10-31.

## The gap (M4.3, gap 3)
Reference close-ups: luma p5 ~10, mean ~48, p95 172–194. Ours were p5 ~0, p95 94–104. A stronger scene key (4.4 → 7.5)
moved p95 only 91 → 117, and a side key threw hair and glasses shadows across DEV's eyes (STYLE.md forbids them), so
it was reverted. Part of the gap is DEV's approved brown skin against the reference's pale face. Skin colours are not
touched here.

## What the options do
All three keep today's lights as they are: hemisphere 0.3, key `#FFE6D0` at 4.4 from (5,5,5) with shadows, rim
`#7F9CFF` at 9, `NoToneMapping`. Each option adds two things:

1. **A character key.** It is a directional light that only the cast's materials see: a term added to their Lambert
   shading through `onBeforeCompile`, so the set, keys and screens are unchanged. **It casts no shadows**, so hair,
   glasses, nose and ears can't throw anything across the face. It is camera-relative: it comes from the same side
   as the scene key (camera right, `az` degrees off the lens axis, `el` degrees up), so every close-up gets the same
   modelling, including reverse angles. The far side of each form stays dark, as STYLE.md asks.
2. **A black lift.** It is a screen-blend quad in front of the camera (`out = in + lift·(1 − in)`), so blacks rise
   to a violet haze and highlights are almost untouched. It is in the 3D render, so the live preview and the
   exported film match.

| | character key | warm hair rim (character-only) | lift |
|---|---|---|---|
| **A · soft** | `#FFE6D0` × 3 from az 55°, el 30° | — | `#070510` |
| **B · medium** | `#FFD6BC` × 5.5 from az 50°, el 30° | — | `#0A0814` |
| **C · strong + warm rim** | `#FFD2B4` × 8 from az 45°, el 30° | `#FFAA70` × 6 from az 110°, el 50° | `#0C0916` |

The exact values are in `tools/light-options.json`.

## How they got here (3 render rounds, then stopped)
1. Front character key (az 25–35°): p95 hit the reference, but it filled the shadow side and flattened every face.
2. Moved round to the scene key's side (az 50–55°): the lit side brightens and the far side stays dark. The first
   warm rim (az 145°) barely showed.
3. Strong option with the rim brought round to az 110°.

## Measured
Pillow `L` luma (Rec.601) on the whole 1080×1920 film frame, captions included, as in M4.3: p5 / mean / p95.
"Cast" is the same, counted only on the pixels that change when the cast is hidden (the same frame rendered with
the cast on a layer the camera doesn't see). It's the part the light actually moves.

Zero Latency (Dark Mode in brackets, same shot types):

| frame | now (M5.2) | A · soft | B · medium | C · strong + rim |
|---|---|---|---|---|
| DEV close-up | 1 / 44 / 123 (0 / 40 / 101) | 11 / 55 / 139 (8 / 53 / 131) | 14 / 61 / 146 (14 / 60 / 149) | 15 / 65 / 160 (15 / 66 / 162) |
| DEV close-up, cast | 0 / 47 / 105 (0 / 47 / 106) | 7 / 66 / 135 (7 / 68 / 137) | 10 / 76 / 151 (10 / 79 / 154) | 12 / 87 / 165 (12 / 90 / 166) |
| ORANGE close-up | 6 / 52 / 141 (6 / 52 / 150) | 12 / 62 / 168 (12 / 63 / 170) | 15 / 66 / 177 (15 / 68 / 179) | 17 / 70 / 189 (17 / 72 / 191) |
| BLUE close-up | 6 / 52 / 122 (6 / 51 / 122) | 12 / 59 / 134 (12 / 59 / 133) | 15 / 63 / 149 (15 / 63 / 149) | 17 / 66 / 166 (17 / 66 / 167) |
| Wide | 9 / 38 / 107 (9 / 37 / 101) | 16 / 45 / 114 (16 / 43 / 107) | 19 / 48 / 118 (19 / 46 / 109) | 20 / 49 / 121 (20 / 47 / 111) |
| Screen | 6 / 30 / 131 (6 / 28 / 114) | 13 / 37 / 134 (13 / 35 / 118) | 16 / 39 / 136 (16 / 37 / 120) | 18 / 40 / 137 (18 / 38 / 120) |
| **reference close-ups** | ~10 / 48 / 172–194 | | | |

Frames: Zero Latency 1.58 s (shot-01), 10.24 s (shot-05), 3.79 s (shot-02), 12.59 s (shot-06), 14.89 s (shot-07).
Dark Mode 1.58, 8.45, 3.95, 10.91, 16.89 s (shots 01, 04, 02, 05, 07).

Read with care:
- Our close-ups now reach 101–150 at p95 even without a change, because the arena's lit screens sit behind the cast
  (M4.3 measured the old dark void). In DEV's frames the screens and the caption set p95, so the cast row says more.
- Only C brings DEV's close-up into the reference's p95 range on the cast (165) and near it on the frame (160). The
  robots are already in range with A.
- **Blacks:** A lands p5 at 8–13, closest to the reference's ~10. B and C overshoot to 14–20, because their lift and
  key add up.
- The reference numbers come from its own frames (M4.3), not re-measured here: its video isn't in this machine (see
  below).

## What to look at
- **Faces:** no new shadows in any option, by construction. B and C push DEV's lit cheek towards a saturated orange
  (no tone mapping, so red reaches its ceiling first), lighter than the model sheet's lit `#C66C48` looks today. The
  material colours are unchanged; only the light is.
- **Hair:** the lift and the extra key raise DEV's near-black hair (`#120806`) to a mauve brown in B and C. In the
  reference the hair stays dark, with a warm edge.
- **C's warm rim** only shows on the hair's right edge and the robots' right shoulders. It is subtle at 1080×1920.
- **Screens:** only the lift touches them: their dark glass rises a few levels (p5 +7…+12), and their colours stay.

## Proof (outside the repo: `~/Desktop/Animate/proof/v6/M5.3/` on the machine that made it)
`options-zero-latency.jpg`, `options-dark-mode.jpg` (each row a shot type; columns: now, A, B, C; numbers under each),
`options-*.json`, `faces-*.jpg` (DEV's face at full resolution), `frames/` (PNG and cast-hidden PNG for every cell),
`rounds/` (rounds 1–3).

**The reference column is missing.** This step ran in a cloud container that has the repo but not
`~/Desktop/Animate` (no `git-blame.mp4`, no `proof/v6/M5.1/ref/`). To add the reference column and re-measure its
frames the same way, run this on the Mac (the reference times are M4.3's pairs):
```
node tools/light-options.cjs tools/light-options.json ~/Desktop/Animate/proof/v6/M5.3/frames zero-latency 1.58 10.24 3.79 12.59 14.89   # MASK=1 for cast numbers
/usr/bin/python3 -I tools/light-options-sheet.py --frames ~/Desktop/Animate/proof/v6/M5.3/frames --project zero-latency \
  --variants base,A,B,C --rows "DEV close-up=1.58,ORANGE close-up=10.24,BLUE close-up=3.79,Wide=12.59,Screen=14.89" \
  --ref-video ~/Desktop/Animate/git-blame.mp4 --ref-times 1.5,14.2,9.8,33.6,43.5 --out ~/Desktop/Animate/proof/v6/M5.3/options-vs-ref.jpg
```
(9.8 s, M4.3's medium shot, stands in for the BLUE row; the reference robot is the same in both.) The extracted
reference frames go to `frames/ref/`, outside the repo.

## Tools (new, in the repo, change nothing in the studio)
The variants are added on top of whatever `studio.html` holds. Since part 2, `base` is the applied light, so
re-running A/B/C now stacks them on it. Check out the part 1 commit (`21a648c`) to redraw the options against the
old light.

- `tools/light-options.cjs`: renders film frames under each variant in `tools/light-options.json`. It serves
  `studio.html` with one extra QA accessor. `THREE_DIR` serves three.js from npm where cdn.jsdelivr.net is blocked.
- `tools/light-options-sheet.py`: the sheet and the numbers (Pillow only), with an optional reference column.

## Tests (part 1)
Unit tests (12) pass. Browser, in the cloud container through `FRAMEFORGE_CDN_MIRROR`: `export-codec` and
`offline-episode` pass. `episode-mix` can't run there (it needs the Kokoro model from huggingface.co, which that
network blocks). The tests that don't use the mirror (determinism, episode-data, studio-editor, …) can't load
three.js there. No studio file changed in part 1; part 2 will run the full list.


---

# Part 2 · The pick, applied

**The pick: B's character key with A's lift** ("BA" in `tools/light-options.json`). The user left the choice to me.
- B's key, not C's: C brings DEV's p95 into the reference's range, but it pushes his lit cheek to a saturated
  orange and lightens the approved skin's look the most. B gets most of the way, and the robots reach the
  reference's range.
- A's lift, not B's: with B's key, A's lift lands blacks at p5 7–12, the reference's ~10. B's own lift overshot
  to 14–20 and lifted DEV's hair to mauve.
- C's warm hair rim: left out. It barely showed at 1080×1920.

## What changed
- `studio.html`:
  - `CHAR_KEY` (`#FFD6BC`, 5.5, az 50°, el 30°) and `addCharacterKey([dev, b.root, o.root])`, called once the
    robots are built. It adds the key to the cast's Lambert and Standard materials through `onBeforeCompile`.
    Ink, eyes and visor faces are `MeshBasicMaterial` and stay unlit. A check in the browser found the patched
    materials only in the three character groups: the set shares none.
  - `BLACK_LIFT` (`#070510`): the `black-lift` plane on the camera (the camera is now added to the scene so its
    child renders).
  - The *Lighting intensity* slider scales the character key with the scene key.
  - The scene key, rim, ambient and tone mapping are unchanged.
- `STYLE.md`: the light section describes the character key and the lift.
- The studio's frames match the option preview to within 1 level (the "applied" against "BA" frames).
- In art-lab views (model-sheet captures) the cast keeps the character key, but the lift is off: those views hide
  every scene child except the character, including the camera.

## Films (`renders/`, copies in the proof folder)
Rendered with `render-episode.mjs` on the software path (this container has no installed Chrome for `--gpu`):
Zero Latency 1,109 frames in 355 s, Dark Mode 975 frames in 408 s, at 1080×1920. Audio is untouched (the M4.1 mixes).

One frame per shot, 60% in (`zero-latency-sheet.jpg`, `dark-mode-sheet.jpg`), luma p5 / mean / p95 on the whole
frame, captions included:

| | reference close-ups | M5.2 close-ups | M5.3 close-ups (both films) | M5.3 wide | M5.3 screen |
|---|---|---|---|---|---|
| p5 | ~10 | 0–6 | **7–11** | 15 | 12 |
| mean | ~48 | 40–52 | 56–69 | 42–44 | 32–36 |
| p95 | 172–194 | 101–150 | **144–177** (DEV 144–162, BLUE 146–166, ORANGE 171–177) | 106–115 | 87–133 |

(The M5.2 numbers are part 1's frames at the same moments.)

**Still off (not parity):**
- DEV's close-ups stay under the reference's p95 (144–162 against 172–194). The rest of the gap is his approved brown
  skin against a pale face, and closing it would mean C's key or a skin change, which needs your call.
- Our mean is above the reference's, because the arena's lit screens fill more of our close-ups than its soft dark
  screens fill its frames (the open soft-focus/glow question, A′).
- The hair reads dark brown with a violet tinge, where the reference's has a warm edge.
- Not checked next to the reference's own frames or motion: they're on the Mac, not in this container. Run the
  sheet command above with `--ref-video` to add the reference column.

## Landing media (`media/v5/`)
Re-made from the new films, the M4.2 way:
- reels at 720×1280: H.264 600 kb/s average + AAC 128 kb/s (0.73 / 0.74 Mb/s), and VP9 600 kb/s two-pass + Opus
  96 kb/s (0.71 Mb/s);
- posters at 0.8 s;
- caption-free cast cards (480×600) at the same moments (DEV 5.61 s, BLUE 25.38 s, ORANGE 30.70 s), cropped from the
  1080×1920 canvas at 1032×1290 (26, 60), 960×1200 (60, 436) and 960×1200 (60, 496). The boxes were found by
  matching the M5.2 cards against the old frames.

`landing-media.jpg` shows before and after. The M5.2 files are in `proof/v6/M5.3/landing/before/`.

## Proof, part 2 (`proof/v6/M5.3/`)
`zero-latency-1080x1920.mp4`, `dark-mode-1080x1920.mp4` (the films with sound), `before-after-ep01-zero-latency.mp4`,
`before-after-ep02-dark-mode.mp4` (the M5.2 reel beside the M5.3 reel, with sound, to judge in motion),
`*-sheet.jpg`, `films/frames/`, `pick-*.jpg` (now / A / B / BA), `landing-media.jpg`.

## Tests (part 2)
Unit tests (12) pass. Browser tests, with the CDN routed to the local npm mirror (this container blocks
cdn.jsdelivr.net) — all pass:
- `phase0-video-playback`
- `character-art` (dev, blue, orange)
- `robot-build`, `performance`, `speech-performance`, `determinism`
- `episode-data`, `studio-editor`, `project`, `project-import-export`
- `landing` (after the new media), `export-codec`, `offline-episode`

`episode-mix` can't run here: it needs the Kokoro model from huggingface.co, which is blocked.

## Rollback
- Part 2: revert its commits. The light goes back to M5.2's (scene key, rim and ambient were never changed), and
  `media/v5/` comes back (the M5.2 files are also in `proof/v6/M5.3/landing/before/`).
- To keep the code but switch the light off: set `CHAR_KEY.intensity` to 0 and `BLACK_LIFT` to `0x000000`.
- Part 1 only adds tools and this note.
