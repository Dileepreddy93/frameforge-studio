# M5.1 · The set: density and scale, designed first

**Part 1 (this commit): three set directions in 2D, waiting for your pick.** Nothing in the studio or the films has
changed yet. Part 2 (the three.js build, re-framed wides and two-shots, re-rendered shots) follows your pick.

## What the reference does (measured)
Every shot of `git-blame.mp4` was found by scene detection (27 shots, cuts at a 0.22 scene score), and the middle frame
of each was read against a 5% grid (frames in `~/Desktop/Animate/proof/v6/M5.1/ref/`, outside the repo):
| | reference | V6 today |
|---|---|---|
| cast height in wides | 9–11% (shot 27, 51.9 s), 17–21% (shot 3, 4.2 s) | DEV 58% (the `duo` shot) |
| key width / character height | ~0.27–0.3 | no keyboard in wides |
| app windows in a wide | 6–8 (a 3 × 2+ grid on the laptop's screen) | 1 dashboard monitor |
| scale between shots | one scale: the cast stand on the giant keyboard in close-ups too | — |

## The three directions (`design/set-directions.html`)
Drawn as flat-shaded SVG in perspective by `design/set-forms.js` (new), with the characters' light (warm key from
camera-right, blue rim from behind-left, in view space) and STYLE.md's colours. DEV, BLUE and ORANGE are drawn by
their approved model-sheet code at true scale. Each direction has a wide, a two-shot, a close-up (the studio's own
DEV close-up framing: 4.7 at fov 35°) and a plan with the cameras; every panel is phone size (405 × 720).
- **A · Laptop landscape:** the cast stand on a giant laptop keyboard; its screen is a wall of 11 app windows with the
  story dashboard right behind them. One scale in every shot, like the reference.
- **B · Desk canyon:** a giant desk; a mechanical keyboard with knee-high keys stands between the camera and the cast
  (it hides their legs in close-ups); monitors stacked into three towers, one big app each; a mug and sticky notes.
- **C · Screen arena:** a half-ring of 15 app windows in three tiers around a field of keycaps, plus 3 windows
  behind the camera for reverse shots and reaction cuts.
- **A′:** A with background blur and screen glow, for the open STYLE.md question (M4.3 gap 6).

App windows (inbox, review, changelog, terminal, chat, metrics, calendar and the story dashboard) are element lists in
a 1000-px-wide frame (`FrameForgeSet.APPS`), so the chosen layouts can be drawn onto the studio's canvas screens.

| | wide: DEV / frame height | two-shot | close-up: head / frame width |
|---|---|---|---|
| A | 19% | 46% | 73% |
| B | 14% | 41% | 73% |
| C | 21% | 46% | 73% |

## Proof (`~/Desktop/Animate/proof/v6/M5.1/`)
`directions-vs-ref.jpg` (the sheet with a reference row on top, made by `~/Desktop/Animate/tools/look/m51_sheet.py`),
`directions.png` (the sheet alone, as the repo page renders it), `ref/shot-NN-t*.png` (one frame per reference shot).
Re-shoot: `node tools/design-shot.cjs design/set-directions.html <out.png> 2400`.

## Tests
Unit tests (12). No studio code changed.

## Rollback
Delete `design/set-forms.js`, `design/set-directions.js`, `design/set-directions.html` and this note (or revert the
commit). Nothing loads them yet.
