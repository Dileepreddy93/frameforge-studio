# M3.1 · BLUE and ORANGE: three design directions (waiting for your pick)

M3 follows M1: robots are designed in 2D first and built in 3D only after you approve a design (STYLE.md:
"Each character is designed in 2D first (a model sheet the user approves)"). This step draws three original
directions for the pair. The model sheet (M3.2) and the 3D build need your pick.

`design/robot-directions.html` (screenshot: `node tools/design-shot.cjs design/robot-directions.html out.png`):
- **A · Capsule & visor:** smooth capsule heads with a big dark visor and faces made of light, hovering on a small
  thruster. BLUE is round with a ball antenna and pill eyes. ORANGE has a flat-topped box head, ear discs, round eyes
  and an LED mouth.
- **B · Retro box:** boxy CRT heads in a bezel with scan lines, square pixel eyes and bar brows, on two short legs.
  BLUE has a square screen and one antenna. ORANGE has a wide TV head, ring eyes, bolt ears and two antennae.
- **C · Round & ink:** round metal heads with the face drawn on the shell in ink, like DEV (big pupils, two glints,
  mood in the lids), on one wheel. BLUE has a ball head and a curled antenna. ORANGE has a wider dome with a ridge.

Every direction shows the pair in front, three-quarter and side views, all seven emotions for each robot, heads at
phone size, and a lineup at DEV's scale. BLUE is the eager one (smaller, rounder). ORANGE is deadpan: his lids are
heavy until something truly surprises him. Colours stay in the V6 palette: BLUE takes the set's teal-blue with
screen-blue features, ORANGE a warm orange with window-light amber features, and violet joints and accents come from
the desk.

Code: `design/robot-forms.js` (forms and faces, reusing DEV's light and shading) and `design/robot-directions.js`
(specs and emotion channels). Test: `node tests/robot-design.test.cjs`, which runs in CI.

Rollback: revert this commit. Nothing in the studio uses these files yet.
