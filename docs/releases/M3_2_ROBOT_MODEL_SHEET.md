# M3.2 · BLUE and ORANGE model sheet (direction A, provisional)

You said "continue" without naming a direction, so I picked **A (capsule & visor)** to keep M3 moving. The episodes
describe the robots as "rounded metal body and contrasting digital face", which is A: a light-on-glass face that
contrasts with DEV's ink face, on rounded shells. The film already has them hovering, which suits a thruster. The
sheet and `design/robot-character.js` are labelled provisional until you approve. If you pick B or C instead, the
same pipeline (forms, sheet, 3D build) is reused.

`design/robot-model-sheet.html` (screenshot: `node tools/design-shot.cjs design/robot-model-sheet.html out.png`):
- Turnaround (front, three-quarter, side, back) of both robots with DEV and height guides. BLUE is 1.48 tall with
  his head centre at 1.0. ORANGE is 1.58 tall, head centre at 1.3 (made taller than at M3.1, where both were
  1.48). DEV is 2.0.
- The seven emotions for each robot, also at phone size. ORANGE's resting lid sits a third down, and surprise
  breaks it.
- The eye chart (open, half, closed, happy arc, looking left, right and up) and the mouth chart they speak with
  (rest, M B P, A, E, O, F V, smile, frown).

`design/robot-character.js` holds the numbers for the 3D build, and `face(robot, emotion, {viseme, open, blink, look})`
gives the face channels at any moment of speech. In `robot-forms.js`, arm parts are now tagged with their side and
shoulder, and strip-shaped face pieces are marked, so the 3D build can rig and triangulate them.

Test: `node tests/robot-character.test.cjs`, which runs in CI.

Rollback: revert this commit. Nothing in the studio uses these files yet.
