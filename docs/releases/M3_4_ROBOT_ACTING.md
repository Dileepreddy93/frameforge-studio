# M3.4 · BLUE and ORANGE act

`src/robot-acting-core.js` gives the robots body acting, built the way DEV's is (M1.4): pure and seekable, key poses
around the line's accent, each channel on a damped spring that overshoots and settles, and a release to rest before
the cut. All 13 project actions are covered (typing, react, question, plead, alarm, surprise, defeat, announce,
explain, celebrate, shrug, anticipate, listen). The robots hover, so the whole body rises and dips, leans, tilts and
turns. The head adds pitch, yaw and roll to the emotion's pose and turns toward whoever speaks. Each arm swings
forward and out from its shoulder. Speech nods the speaker's head and pulses the gesturing hand.

**In character:** BLUE moves bigger and snappier and bobs more. ORANGE is deadpan: smaller, slower, well damped. On
celebrate, alarm, surprise and announce, BLUE's peak moves are at least 1.4× ORANGE's (tested). In Zero Latency's
shots, BLUE's body and arms move about twice as much as ORANGE's.

This replaces the old generic `actPose`, the extra sway, and the legacy bob on the robot roots, which would have
doubled the hover. `actPose` and its helper were removed.

The robot reaction cuts were also reframed. They use a 31° lens and their own distance, so they now stand back
(4.7 instead of 3.05) to show head and shoulders like the close-ups. At 3.05, ORANGE's head was wider than the
frame.

## Tests
- `node tests/robot-acting.test.cjs` (in CI): every action for both robots, seekable, moving, released by the cut,
  in character, striking around its accent, nodding with speech and looking toward the speaker.
- `tests/robot-build-browser.cjs` also checks that both robots act through their lines in the film and that seeking
  gives the same pose.
- Proof: the studio's own export of the whole of Zero Latency with the new robots (540×960, 1,143 frames, 38.1 s,
  mastered audio).

## Rollback
Revert this commit. The robots keep their M3.3 build but stand still, apart from their faces.
