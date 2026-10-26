# FrameForge — controlling nine-phase implementation contract
Version 2026-10-24. Supersedes the **numbering** of the historical P0–P7 checklist; preserves its evidence. The user explicitly separates captions (P5), rendering (P6), reusable studio (P7) and final certification (P8).

## Rules applying to every step
Work in the existing repo, preserve main/V3/v3.0-stable, v4.0-rc1, develop history and media. Create a feature branch, record parent SHA, avoid destructive changes or force push. Each step must update docs/EXECUTION_LEDGER.md with source paths, exact tested actions, evidence, defects, time of test, Git SHA and next action. Technical tests, artistic approval and deployment are separate. Passing CI does not imply the film meets a reference. Keep licenses, compute cost, mobile playback, quality and security explicit. Do not copy proprietary reference source. Never call an unverified task complete.

## P0 — preserve evidence and lock specifications
P0.1 Inventory and protect tags, branches, archived assets.
P0.2 Reverify real 41.8-second V4 film bytes, checksum, codecs, frames, decoding and browser playback.
P0.3 Maintain a provenance/licensing register for six sites and two documents plus all new sources.
P0.4 Obtain the **exact** Git Blame MP4 file, compute SHA256 and measured metadata. Do not substitute 65469.mp4.
P0.5 Make timecoded shot/acting/audio/caption reference matrix. Treat our film matrix and target reference matrix separately.
P0.6 Establish an explicit visual quality rubric and dated examples of known failure.
P0.7 Freeze tool versions and repeatable CI/browser/rendering tests, including clean clone.
EXIT: identified, measurable source requirements; explicit unknowns; reproducible baseline. Unmeasured reference = gate OPEN.

## P1 — art direction and character identity
P1.1 Approve original design bible: silhouettes, proportions, hair, clothing, materials, palette, textures, feature positions.
P1.2 Create actual same-rig front/three-quarter/side/rear sheets and at least four readable emotion closeups.
P1.3 Build close/medium/body shots plus environment/foreground/background and key-fill-rim/contact shadow studies.
P1.4 Check intersections, seams, scales, eyes, human anatomy and face readability at mobile size.
P1.5 Lock recurring identity/style/voice references and first-frame approvals for optionally generated footage.
EXIT: the STATIC lineup itself is visually compelling and consistent. Current three rig sheets are NOT artist-approved.

## P2 — character acting engine
P2.1 Coordinate blink speed, lids, gaze, brows, cheeks, mouth corners/asymmetry, jaw and six viseme families.
P2.2 Support gestures, head/neck/spine/shoulder/elbow/wrist/hand and where needed hip/knee/ankle/weight.
P2.3 Act out anticipation, action, hold, reaction, follow-through, recovery, listening and breathing with individual personality.
P2.4 Use actual word and preferably phoneme timing with manual correction: text-length/audio amplitude estimates alone FAIL final lip-sync.
P2.5 Enforce seekable deterministic pose mixing without resets, sliding, clipping or snapping.
EXIT: watch a short (5–10s) muted acting clip and understand emotion WITHOUT dialogue.

## P3 — film direction and continuity
P3.1 Story beats: hook/setup/escalation/surprise/silence/payoff/callback.
P3.2 Shot table: speaker, emotion, camera, gaze, action, dialogue, exact duration; support manual shot override.
P3.3 Cover close/medium/wide/duo/OTS/insert/reaction; verify eyelines, axis, motion, headroom.
P3.4 Continuity of props, costume, position, stage, shadows; meaningful software screens and environment reactions.
P3.5 Optional video-generation mode uses approved first frames and roughly 8s clips with <=2 short lines.
EXIT: the contact sheet alone tells the story, with no audio or captions.

## P4 — audio production
P4.1 Compare licensed/free real voice systems for English, Telugu and Hindi; establish persistent character voice identity.
P4.2 Generate/capture separate emotional dialogue stems line-by-line and archive sources.
P4.3 Correct word/phoneme timestamps, pauses, breaths and speech-to-action sync.
P4.4 Foley sheet, room tone, transitions, music ducking and fades; clean outputs before captions.
P4.5 Measure integrated loudness (~-14 LUFS reference where appropriate), true peak; LISTEN to all takes.
EXIT: isolated audio itself sounds intentionally directed, coherent and intelligible.

## P5 — caption and social finishing
P5.1 Real word timestamps and appropriately grouped 1–4 words including complex Telugu/Hindi shaping.
P5.2 Character color, visual emphasis, short pop animations, punchline accent and readable stroke/shadow.
P5.3 Avoid faces, props, UI and platform overlays dynamically; reconcile "top 25%" with changing app safe zones.
P5.4 Every caption tested with frames; save clean and captioned masters.
EXIT: synchronized, legible, uncropped and expressive across actual viewing formats.

## P6 — rendering and performance
P6.1 Fast low-res preview separate from master, deterministic seek and backward scrub.
P6.2 Benchmark current Chromium/WebCodecs/FFmpeg vs HyperFrames before switching.
P6.3 Native 1080x1920 at constant 30fps (not upscale), faithful shaders/materials/lighting/camera.
P6.4 Bounded frames/chunking, queue, progress, cancellation, retries, recovery and clean audio boundaries.
P6.5 Verify decoded full film, stream specs, frame count, audio offset, mobile + desktop, time and compute cost.
EXIT: full native master proven deterministic, playable and within a measured budget.

## P7 — reusable FrameForge Studio
P7.1 Keep typed/versioned scene data; extend existing project-core contract without regressions.
P7.2 Studio authoring of arbitrary reusable characters/meshes, outfit, rig, motions, backgrounds, lighting, camera, speech, captions.
P7.3 Asset library/relink, persistent projects, undo/redo, import/export and recovery.
P7.4 Timeline manual override, reference A/B tools, render jobs/logs/checksums.
P7.5 Create TWO independently scripted professional movies using identical engine code and reused library assets.
EXIT: a new story becomes a new film without editing underlying JavaScript.

## P8 — independent final quality certification
P8.1 Review representative shots AND entire film for character identity, acting, face, speech, camera, lighting.
P8.2 Review all spoken words and caption safe zones; decode/listen to audio and inspect actual renders.
P8.3 Measure stream data, frames, resolution, audio sync, performance and cross-device playback; regression-test against approved tags.
P8.4 Compare the hash-identical target reference at consistent native viewing size and document blocking defects until resolved.
P8.5 Immutable release tag with source/assets/MP4/hash/QA reports; demonstrate restore, THEN merge/deploy public version.
EXIT: proven technical + artistic acceptance, public site AND independent MP4 playback verified.

## Dependency policy
Phases may run experimental spikes in parallel but upstream ART approval cannot be bypassed. Do NOT optimize UI while character art is the quality bottleneck. Reproducible 5–10s excellent scene comes before another full-length film. Historical docs/HANDOFF_CURRENT.md predates latest developments and must not override actual remote branch heads.
