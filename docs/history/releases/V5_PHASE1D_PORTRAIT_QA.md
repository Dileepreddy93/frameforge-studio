# V5 Phase 1D: experimental expression/portrait QA

**Status: EXPERIMENTAL, NOT APPROVED as final character art.** No production deployment.

## Verified input references
- User-supplied `65469.mp4`: H.264 720x1280, 30 FPS, 1254 video frames. We inspected twelve timestamped frames at 0.8, 3.0, 6.7, 9.2, 12.5, 15.0, 19.5, 23.5, 28.0, 32.0, 36.0, 40.3 seconds. These show expressive eyebrows, face closeups, hair, environments, large story-relevant software inserts and varied camera framing.
- User's `Studio_Reverse_Engineering_Report.md` distinguishes public observations and exact video measurements from seller claims; no vendor private application code was reused.
- `NMXWZ-1.pdf` five-page instructions call for consistent front/3/4/side/back turnarounds and four expression portraits. The 3D lab implements this type of inspection for original characters.
- The exact `git-blame.mp4` file was not verified in this run; do not pretend that `65469.mp4` is identical to it.

## Code and actual render changes
- Isolated `feature/v5-expressive-character-portraits` derived from V5 foundations, without touching main/develop/V3 live production.
- Improved DEV head silhouette with intentional faceting and more structured polygon hair.
- Explicit emotion portraits use a closer camera than body turnarounds.
- Corrected protruding eyes, nose and overlarge ellipse mouth after **observing the actual decoded browser-rendered face images**.
- Separate Chromium render tests generated eight distinct outputs each for DEV, BLUE and ORANGE, with valid downloadable PNG sheets and no reported browser exceptions in successful runs.
- Existing V4 source, cinematic camera and JSON project tests pass.
- GitHub test runner supports art lab, but browser QA environment startup can be unstable; do not infer continuous render reliability from one success.

## Current visual-quality verdict
- Human hair silhouette and closeup readability improved.
- Eyes are less bulbous but still stylized, and the face lacks natural coordinated eyelid/cheek/brow performance.
- Happy/worried/surprised read as different poses, but do not meet the benchmark's compelling expressive animation.
- Robot shells are relatively cohesive; camera, mouth cues, body anticipation and emotional timing remain oversimplified.
- None of the character-sheet approval flags are set to approved.

## Next strict exit requirements
1. Rig eye sockets/eyelids, cheeks, lip corners, jaw and brows as coordinated **animatable parameters**, not unconnected primitive parts.
2. Drive those parameters over time through explicit keyframed acting and listener reactions.
3. Add performance screen tests before and after emotion transitions and inspect actual 30-FPS sequences, not only static portraits.
4. Evaluate against supplied real reference frames; do not invent a parity score.
5. Render an exemplary short scene with lip-sync and layered Foley before attempting another full episode.
