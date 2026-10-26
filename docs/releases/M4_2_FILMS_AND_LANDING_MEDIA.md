# M4.2 · Both films rendered at 1080×1920 with the new robots; landing media re-made

- `node tools/render-episode.mjs projects/<id>.frameforge.json --gpu`, with the M4.1 audio:
  Zero Latency 1,109 frames (36.97 s) in 86 s, Dark Mode 975 frames (32.50 s) in 77 s.
- `media/v5/` re-made from those renders, the way it was made before (commit 7774fec):
  - `ep01-zero-latency`, `ep02-dark-mode`: 720×1280 H.264 + AAC (`.mp4`, ~0.75 Mb/s) and VP9 + Opus (`.webm`,
    ~0.6 Mb/s);
  - posters: the film frame at 0.8 s;
  - cast cards (480×600): caption-free film frames from Zero Latency (DEV worried 5.61 s, BLUE happy 25.38 s,
    ORANGE happy 30.70 s), taken from the studio with `~/Desktop/Animate/tools/look/nocap.cjs`.
  The folder keeps its `v5` name so the landing page and its test don't change.

## Checked in rendered frames (one frame per shot, 60% into each line: 26 frames)
| shot type | framing | arms | caption (31% of height) |
|---|---|---|---|
| DEV close-up | head and shoulders, head ~60% of the width, the screen's number behind | in front of the torso, no clipping | over hair/forehead; never over eyes or mouth |
| BLUE close-up | head centred at its eye level | floating hands beside the body (the approved design, `arms.style:'float'`) | just above the head |
| ORANGE close-up | head centred | tube arms leave the shoulders cleanly | just above the head |
| two-shot (DEV + BLUE) | both full figures, DEV left | clear of the bodies | over DEV's hair |
| screen insert | full-frame card | — | **overlaps the card's context line** (e.g. "prod / deployment 7a4f") |

Found and left for M4.3 (it's the step that fixes framing and caption placement):
- On screen inserts the caption prints over the card's text.
- BLUE's close-ups and its cast card show a cropped slice of DEV's head at the left edge.
- Screen inserts are flat full-frame cards in the old blue palette, not in-world monitors (STYLE.md).
- `render-episode.mjs` exited 0 and left an empty MP4 once when its ffmpeg failed (a first Dark Mode run, during a
  parallel network job; the re-run was clean). It should fail loudly.

## Proof (`~/Desktop/Animate/proof/v6/M4.2/`)
`zero-latency-1080x1920.mp4`, `dark-mode-1080x1920.mp4` (the full films with sound), `*-sheet.jpg` (every shot),
`*-shot-NN.png` (full-size frames), `landing-media.jpg` (cast cards and posters), `check-arms-captions.jpg`.

## Tests
Unit tests (12), `landing-browser`, `determinism-browser`, `robot-build-browser`.

## Rollback
`git checkout <commit before this one> -- media/v5`. The renders themselves are gitignored (`renders/`); copies are
in the proof folder.
