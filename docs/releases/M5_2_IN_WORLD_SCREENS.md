# M5.2 · The story on in-world screens

The full-frame screen cards are gone. A `screen` shot now looks at the arena's big centre window (the story window,
M5.1) from in front of it and off to its left, so the monitor is seen in perspective and runs off the frame's right
edge, as in the reference. The window shows the shot's insert, with the same data as the card, and keeps showing it
afterwards, so the close-ups that follow have the result behind the character.

## What changed
- `design/set-forms.js`: a new `insert` app layout with the card's fields (window title, context, headline, the big
  value, its caption, the request and status band, the graph, the footer), laid out so everything that must read
  sits in the left two thirds of the window, which a screen shot keeps in frame.
- `design/set-arena.js`: the story window is taller (8 × 5.4, was 4.6) to hold a whole insert, and its tier-2
  neighbours moved from ±30/±60° to ±36/±68° so none of them covers its edge.
- `src/arena-set.js`: `drawStory({wall})` or `drawStory({insert})`, and `storyFrame` (the window's centre, normal,
  right and up axes in the world) for the camera.
- `studio.html`:
  - the `screen` camera is placed from the story window (`distance` along its normal, `offset` sideways, `up` and
    `lookUp` along its height, the aim 0.45 of the way toward the camera's side); its sway runs on shot time, so a
    screen shot looks the same wherever it sits in the episode;
  - the story window shows the latest of a shot's `wall` and a screen shot's `insert` (before, it kept the first
    wall, so Zero Latency showed "12.0 s SLOW" behind DEV all film long, even after "Zero milliseconds");
  - the film compositor's card (about 40 lines) and the hidden V5 overlay `#screenInsert` are removed; captions sit
    at 31% on every shot (screen shots used to move them to 11.5%, above the card).
- `src/project-core.js`: the `screen` preset is distance 18, offset −5, up 2.3, lookUp 2.3, fov 40; `offset` may now
  be −8..8 (`docs/PROJECT_FORMAT.md` describes both). The three screen shots drop their old card framing and use the
  preset.

## Measured and checked
- Every screen shot of both films (Zero Latency 07 and 09, Dark Mode 07) shows its insert on the window; all its
  text reads at 1080×1920 and at phone size. The window's top edge sits at about 37% of the frame height, under the
  caption (31%), and its right third runs off the frame. Reference screen shots: window top at ~33–35%, cropped on
  the right, caption over the title bar (`screens-vs-ref.jpg`).
- After each insert, the close-ups show it behind the character: "0 ms" behind DEV's "Wow!", the red "0" behind
  "What about the customers?", "0%" behind "I can't see anything." (`*-sheet.jpg`).
- Renders (`--gpu`): Zero Latency 1,109 frames in 51 s, Dark Mode 975 in 54 s.

**Still off:** all three screen shots use the same angle (M5.4's camera life can vary them); the window's value is
smaller than the reference's, which fills the frame width; the screens are still brighter and sharper than the
reference's (the soft-focus question is open).

## Landing media (`media/v5/`)
Re-made from the new renders as in M5.1 (reels 0.70–0.72 Mb/s, posters at 0.8 s, cast cards at the same moments).
They barely change: only the story window behind the cast is taller. `landing-media.jpg` shows before and after;
the M5.1 files are in `proof/v6/M5.2/landing/before/`.

## Proof (`~/Desktop/Animate/proof/v6/M5.2/`)
`screens-vs-ref.jpg`, `before-after.jpg` (the M4.3 card against the window), `side-by-side-15s-ref-vs-ours.mp4`
(ours from 12.5 s: the wide, both screen shots and the close-ups after them), `zero-latency-1080x1920.mp4`,
`dark-mode-1080x1920.mp4`, `*-sheet.jpg`, `frames/`, `landing-media.jpg`, `directions.png` (the design sheet with
the moved windows).

## Tests
Unit tests (12). Browser: `episode-data` (a screen shot looks the same wherever it sits; editing the insert changes
the frame), `determinism`, `studio-editor`, `project`, `project-import-export`, `offline-episode`,
`phase0-video-playback`, `character-art` (dev, blue, orange), `robot-build`, `performance`, `speech-performance`,
`landing`, `export-codec`, `episode-mix`.

## Rollback
Revert this commit: the card, its caption position, the old screen framing and the M5.1 landing media come back.
