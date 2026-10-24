# FrameForge project format v1 — source of truth for episodes

The V5 browser reads actual JSON documents from the projects/ directory. It no longer embeds script/shot dialogue arrays in index.html. The pure validator is src/project-core.js; it is shared between Node.js tests and the browser.

## Required fields
- schema: frameforge.project/1
- id, title, logline; output target 1080x1920 at 30 FPS
- style.styleLock: invariant visual style; shot.styleLock, if present, must match exactly
- environment: id, description, safeZone top/bottom overlay margins in 1080x1920 coordinates
- characters: stable id, name, visualIdentity, voice.profile and voice.voiceLock, sheetStatus, four or more unique expressions
- shots: stable id, dialogue, registered speaker, allowed camera, 0.4-15s duration, intent, emotion, action, firstFrameStatus
- audio: state mastered with valid media URL or storyboard_only with no URL

Examples: projects/zero-latency.frameforge.json (mastered, 14 scenes) and projects/mountain-mystery.frameforge.json (unvoiced storyboard, 6 scenes). The original V3 lines, speaker, camera and durations were transferred bit-for-bit into JSON and regression-tested.

The 1080x1920 output is a **target in project metadata**, NOT a claim the current GPU-free rendering pipeline already provides that native resolution. V4 verified export was 480x854, and the benchmark remains unreached.

## Stage gates still open
- Character sheets must be created from identity specs and actually approved; sheetStatus is not_created.
- First frames are NOT approved; firstFrameStatus is not_created. No fabricated approval.
- Viseme timing is still heuristic from V4; requires word/phoneme alignment.
- Existing scene UI permits edits during one browser session. File-backed save/reopen, undo and full scene editing are future work; this milestone provides reusable, validated **loading**, not persistent in-browser writes.
- Camera and acting direction still use V4 preset mapping; P2 and P3 gates are open.

## How to add an episode
Create projects/new-story.frameforge.json based on an existing example. Validate with the Node tests and link it to the projectFiles map in index.html. The eventual editor must remove this last catalog registration step and implement save/import. Never spoof audio for storyboard-only projects.

Tests: node tests/project-core.test.cjs; node tests/project-integration.test.mjs.
