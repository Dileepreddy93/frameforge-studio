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

## Actual completed visual comparison and technical CI results
- Tested revision `3d31948881a10b19c68fc00beacd49155739d0d1`, GitHub workflow run [40098755955](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/40098755955): source/project, real-character render, rigged import, FFmpeg export **all success**. Before this successful run, an intermediate browser test failed only by clicking hidden Reset inside collapsed details; test fixed by opening the panel.
- Baseline old 808×648 screenshots vs neutral: mean absolute RGB channel delta (0–255 scale) happy 0.0333, worried 0.0321, surprised 0.2327. Correct eye-level portrait: happy 0.175, worried 0.191, surprised 1.070; direct cropped face region x280–530 y125–410 had MAE happy 1.241, worried 1.386, surprised 6.066; all numbers measured from *actual captured screenshots*. This is a visibility/framing improvement, not proof of emotional naturalness.
- Visually inspected happy/worried and recorded real frown/smile. Remaining issues: eyes/brows remain too flat, expression transition/directable microacting not measured, sample aesthetic semi-realistic and not approved for reference parity. **P1 art gate still FAIL / NOT_APPROVED.**
- Vercel separate review project API said READY but direct inline 10.6MB file upload materialized as zero-length (SHA1 `da39a3ee...`), and GitSource returned `repo_not_found` for private GitHub repository; the project has Vercel SSO. Do not claim mobile human preview verified. Issue #14 tracks permission and proper source-linked deploy. For now actual full-size model and screenshots remain in GitHub and provided local analysis artifact.
