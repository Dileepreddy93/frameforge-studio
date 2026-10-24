# P1 real face close-up and manual morph editor — 2026-10-24

## The defect that prompted this change
Previous “portrait” capture on 808×648 canvas was a half-body view; actual actor face was tiny. Comparing actual bundled Ara screenshots to neutral revealed happy MAE 0.0333 RGB/255 (0.153% changed pixels >5), worried MAE 0.0321 (0.156%), surprised MAE 0.2327 (0.668%). That was NOT readable cinematic acting despite all technical CI jobs green.

## Implemented
- Correct true face-closeup staging: normalized GLB height 2.7m, eye y≈2.43m, camera distance 1.15m, vertical FOV 36° instead of 3.0m and 32°. Frame should show face rather than full torso (validate directly against new PNG).
- Real **20-channel** morph sliders appear dynamically for the generated character; data comes from GLB target names, not predefined fake controls.
- `applyMorphControls(root,controls)` bounds-checks every 0..1 channel and updates actual Three.js morphTargetInfluences. Overrides persist across deterministic `setTime` calls, selected animation and user seeking. Reset returns to expression presets.
- Source tests and Chromium test exercise active slider, manual emotion capture, preservation after scrubbing and reset. No new paid dependency.

## Acceptance
Technical: all CI jobs pass and capture 4 angles, 4 predefined close-up emotions and 2 manual-expression frames.
Art: inspect new closeups and calculate expression pixel difference; real happy/worried faces must read without labels. This is a candidate, NOT an approved cinematic actor.
Production: full creator engine, clothing editor, arbitrary licensed asset library, manual keyframes, phoneme lipsync and professional expressive facial performance remain unbuilt.

Do not merge on technical success alone; inspect captured images. The exact Git Blame reference source stays version locked in `spec/git-blame-reference.json`.
