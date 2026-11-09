# M5.4 · Cutting and camera life

The reference cuts every 1.93 s on average and its camera is almost never still (1% near-still frames). Before this
step our films cut every 2.17 / 2.32 s, and 17% / 21% of their frames stood still: the screen shots and the Dark Mode
wide completely, the reaction cuts and the ends of every move too. Now the films cut at about the reference's pace,
and the camera never rests.

## What changed
- **Shot planner** (`src/project-core.js`, `plannedReaction`):
  - **Which shots:** a close-up or screen shot of 2.4 s or more with no authored `reactionCut` ends on a listener's
    reaction for 30% of the shot (0.6–0.9 s, never leaving less than 1.4 s before the cut).
  - **Who reacts:** a listener whose emotion the shot sets, DEV first when a robot speaks, BLUE first when DEV does,
    carrying that emotion. The choice comes from the shot alone, so reordering shots never changes it.
  - **Audio:** only the picture cuts. Shot timing, voices, music and effects are unchanged, so no re-voicing or
    re-mixing was needed.
  - **Saving:** planned cuts aren't written into a downloaded episode. `"reactionCut": false` keeps a shot uncut.
  - Zero Latency gains 6 cuts (shots 01, 05, 07, 09, 11, 13), Dark Mode 5 (01, 03, 06, 07, 09). Most are DEV
    reacting to a screen or to ORANGE: the reference's robot, human, robot pattern.
- **Camera life** (`studio.html`, `update()`):
  - **Distance:** a move covers the same share of the view at any distance (wides, two-shots and screen shots scale
    it by distance ÷ 4.7), and so does the idle sway. Before, a 0.33 push at 18–21 units barely moved the frame.
  - **Screen shots:** they push and drift along the story window's own axes.
  - **Reaction cuts:** a slow push in (4%) and a small sideways drift, no longer locked off.
  - **Static moves:** `static` now drifts sideways at a tenth of the default travel. For a locked-off camera, choose
    *Static tripod* under Camera movement.
  - **Never stopping:** every move is 60% linear and 40% eased, so the camera never comes to a full stop at a
    shot's ends.
- **Screen angles:** the three screen shots no longer share one angle:
  - Zero Latency 07 keeps the preset;
  - Zero Latency 09 is lower and looking up (distance 16.5, offset −6, up 0.9, lookUp 2.3);
  - Dark Mode 07 is higher and more oblique (15.5, −6.5, 3.6, 2.0).
  - All their text reads at 1080×1920.
- `docs/PROJECT_FORMAT.md` describes the planner, `reactionCut: false` and the distance-scaled moves.
- `tools/cutting-report.py` (new) measures it, Python and ffmpeg only.

## How it's measured
`tools/cutting-report.py <film>`, the M4.3 method:
- **Cuts:** ffmpeg scene detection at 0.22. Shots = cuts + 1.
- **Frame change:** the mean absolute luma difference between frames 1/15 s apart at 90×160, with cuts left out.
- **Near-still:** a change below 0.3. M4.3 didn't record its threshold. 0.3 reproduces its 16% on the M4 films
  (0.25 gives 14–15%, 0.35 gives 17–19%).

The reference was measured by M4.3 on the Mac. Its video isn't in this container.

| | reference | Zero Latency M5.3 → M5.4 | Dark Mode M5.3 → M5.4 |
|---|---|---|---|
| shots (detected) | 27 in 52.2 s | 17 → 20 in 37.0 s | 14 → 17 in 32.5 s |
| mean shot | 1.93 s | 2.17 → 1.85 s | 2.32 → 1.91 s |
| near-still frames | 1% | 16.9% → 0.2% | 21.3% → 2.0% |
| median frame change | 1.21 | 1.15 → 1.60 | 1.21 → 1.48 |

Scene detection misses a cut between two similar frames, so the real edit has more cuts than it detects: Zero
Latency has 14 shots + 12 reaction cuts = 26 picture cuts, and Dark Mode 12 + 8 = 20.

**Still off:**
- Our median frame change is now above the reference's. Our close-ups move more than the reference's (acting and
  pushes, 2–3.5 per shot type), and the wides and screens used to hold the median down. The camera never rests, but
  our close-ups are busier than the reference's; calming them is acting and framing, not cutting.
- ORANGE's deadpan close-up in Dark Mode (shot 04) still has 8% still frames, because the robot holds still.
- Not judged next to the reference in motion: its video is on the Mac.

Render iterations: four, all converging (Dark Mode near-still 21% → 4.9% → 3.1% → 0.9% at 360×640; 2.0% in the final
1080×1920 film). Scene detection also misses the Zero Latency cut from the wide to the first screen shot (two dark,
screen-filled frames), so the real pace is a little faster than measured.

## Films and landing media
Both films re-rendered at 1080×1920 (software path): Zero Latency 1,109 frames in 450 s, Dark Mode 975 frames in 311 s.
Audio is unchanged. `media/v5/` was re-made from them the M5.3 way:
- reels 0.71–0.74 Mb/s;
- posters at 0.8 s;
- cast cards at 5.61 / 25.38 / 30.70 s, with the M5.3 crop boxes; none of those moments falls in a new reaction cut.

The M5.3 files are in `proof/v6/M5.4/landing/before/`.

## Proof (`~/Desktop/Animate/proof/v6/M5.4/` on the machine that made it)
`cutting-*.json` (the measurements with every cut time), `zero-latency-sheet.jpg`, `dark-mode-sheet.jpg` (one frame per
shot), `*-cuts.jpg` (one frame per detected shot, so the new reaction cuts show), `screens.jpg` (the three screen
angles), `before-after-ep0*.mp4` (the M5.3 reel beside the M5.4 reel, with sound, to judge in motion), the two films,
`landing-media.jpg`.

## Tests
Unit tests (12; `project-core` gains the planner tests: which shots, who reacts, authored cuts kept, opt-out,
timing unchanged). Browser (CDN mirror):
- `phase0-video-playback`, `character-art` (dev, blue, orange), `robot-build`
- `performance`, `speech-performance`, `determinism`
- `episode-data`, `studio-editor`, `project`, `project-import-export`
- `landing`, `export-codec`, `offline-episode`, `ara-mobile`

A downloaded episode keeps only the 6 authored cuts.

## Rollback
Revert this commit: the planner, the camera life, the screen angles and the M5.3 landing media come back. To keep the
code but switch the planner off for one episode, give its shots `"reactionCut": false`.
