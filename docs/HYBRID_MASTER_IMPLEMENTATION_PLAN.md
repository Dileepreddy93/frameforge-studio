# FrameForge Ultimate — phase-gated hybrid implementation contract

Status: IMPLEMENTATION PLAN (not an assertion that phases are complete)
Created: 2026-11-01
Target repository: Dileepreddy93/frameforge-studio
Work branch: feature/hybrid-foundation
Frozen development starting commit: 2b78e60fd484f6590276f041bfafc977aa4ef479 (deployed to frameforge-v6.vercel.app when audited)
Source repository: Dileepreddy93/ember-take-studio, main @ 22c745ffd (inspect full SHA before cherry-picking)
Original FrameForge main: 49c10c59f89b971666c8be3b1aa7efa18ade1774 (DO NOT replace)
Production constraint: no main merge, tag overwrite, production redeploy or deletion before independent acceptance.

## Goal

One product, using FrameForge's deterministic cinematic episode engine, cast identity, audio, browser voices, film export verification, and test infrastructure, extended with Ember's configurable characters, humanoid GLB/VRM characters, worlds, props, cameras, reactions, screen interactions, looks, and usable editing UI.

An exported custom episode must remain editable/reopenable and reproducible. The existing DEV/BLUE/ORANGE episodes must remain functional and produce identical results when no new feature is enabled.

No attempt at "everything works" by concatenating sources: integrate module-by-module behind stable contracts.

## Architecture and compatibility invariants

1. Leave the original project contract `frameforge.project/1` valid, unchanged to consumers. Define a distinct `frameforge.project/2` extended document, with an explicit v1 -> v2 adapter and v1-native read/play/export mode.
2. Maintain a `legacy` render path for DEV, BLUE, ORANGE and existing episodes. New features opt in using document version/capability flags. Never silently change framing, acting, lighting or sound of old episodes.
3. Introduce interfaces with pure time-based evaluation (seek is deterministic):
   - ActorProvider: `create(config,assets)`, `setPose(time,shot,performance)`, `getAnchors()`, `dispose()`.
   - WorldProvider: `create(world,assets)`, `setTime(time)`, `getStageAnchors()`, `dispose()`.
   - CameraDirector: `evaluate(time,shot,anchors)`, independent of actor names.
   - AudioDirector: voice/sound/music cues -> `mix`, with explicit timing metadata and legacy fallback.
   - AssetStore: imports, validation, IndexedDB, versioned project references, no arbitrary remote URLs.
4. Validate assets *before* loading; enforce byte, geometry, texture, bone, morph and extension limits; gracefully reject unsupported models. No remote code execution or untrusted arbitrary scripts from imported files.
5. Pin dependencies; Three.js version overlap (0.180.0) is useful but not sufficient. Keep CSS/editor widgets independent of film model and rendering engine.
6. Old FrameForge renders must match a captured baseline on a pinned Chromium/software path (frame hashes if deterministic; otherwise stated image/audio comparison thresholds). Preserve original soundtrack and rendered fixture artifacts as independent evidence.
7. Test one real complete output at each integration milestone; a rendered still or a passing source test alone is not acceptance.
8. Maintain third-party licence notices and asset provenance. Preserve FrameForge's restrictions against redistributing research-only Ara/CMU assets.
9. No chargeable cloud/GPU usage without authenticated server-side quotas, rate limits, per-job limits and cost alerts. Local-first is default.
10. Every phase requires a reversible PR, green relevant tests, video/audio proof and a staging Vercel preview, not an unchecked production overwrite.

## Work phases and concrete exit criteria

### P0 — Baseline & safety (first, blocking)
- Audit source/deployment SHA, Git branches, licences, CI and export/voice failure evidence.
- Fix release-test Windows mpv PATH resolution, then rerun full release and existing V6 CI.
- Render and archive original Zero Latency and Dark Mode on pinned tooling, with metadata, decoded representative frames and audio measurements.
- Make baseline fixture manifest with hashes/probes and an automatic old-episode compatibility gate.
- EXIT: two existing films and current editor/export pass; pinned baseline and rollback documented; no production change.

### P1 — Versioned document & feature adapters
- Add v2 document parser/validator, v1 passthrough, explicit migration, and round-trip tests; do not weaken the v1 validator.
- Define ActorProvider, WorldProvider, CameraDirector, AssetStore and stable evaluation contracts in separate modules.
- EXIT: existing v1 remains identical; a minimal v2 synthetic actor/world test can seek and export without involving UI. This synthetic *test fixture* is permitted for code correctness, never as a user-facing cinematic quality claim.

### P2 — Configurable built-in cast
- Adapt Ember's six templates from `characters.js` through ActorProvider.
- Support body/head proportions, outfits, accessories, colors, multiple actors, pose anchors, memory cleanup.
- Preserve DEV/BLUE/ORANGE original providers and model sheets.
- EXIT: each template loads, animates, seeks and exports; legacy renders unchanged; show validated 4-view and 8-emotion evidence.

### P3 — Real imported humanoid characters
- Adapt `character-import.js`, `imported.js`, compatible GLTFLoader/three-vrm and `local-library.js`.
- Support vetted GLB/VRM, bone-mapping, jaw/viseme mapping, blinks, gaze, gestures, sitting/holding props, disposal.
- Preserve warnings when morphs/bones are absent and avoid claiming universal support.
- EXIT: at least three independently authored real models, from two rig conventions, imported and used in full voiced films.

### P4 — Worlds, environments and props
- Adapt Ember's world builders and world import; introduce stage anchors, shadows, lights, world-space monitor surfaces, HDRI validation, particle time-seeking.
- Preserve original FrameForge arena and set lighting for v1.
- EXIT: every Ember built-in world type and at least one imported world export in full films; stable stage alignment and bounded performance.

### P5 — Direction, cameras, actions, world-space screens
- Extend shot grammar for arbitrary actors, cinematic angles, one-take option, camera blending, screen actions, reaction beats and props.
- Adapt `screen-apps.js` and `dist/timeline.js` selectively; map to one FrameForge project timeline, never keep two concurrent source-of-truth timelines.
- EXIT: shot edit/reorder/reaction, accurate seek, script round-trip and no caption/screen collisions; legacy camera tests pass.

### P6 — Voice, multilingual R&D and sound
- Keep FrameForge's existing Kokoro voices/phonemizer and episode-mix as baseline.
- Adapt Ember's local/cloud voice options behind AudioDirector, and voice-import support where rights and compatibility are clear.
- Benchmark, rather than claim, Hindi/Telugu TTS including listening tests, phoneme timings, visemes and Unicode captions; do not expose unfinished language claims.
- EXIT: English regression, imported audio timing and two end-to-end custom actor movies pass. Release Indic languages only after separately tested.

### P7 — Single responsive creator UI
- Combine Cast, World, Scene, Voice and Film controls in FrameForge; keep story-first preview and shot inspector.
- Add browser asset library, autosave/recovery, undo, clear states, mobile controls and gentle quick-create path.
- EXIT: beginners can script -> character -> world -> voice -> preview -> export -> reopen on desktop and real mobile.

### P8 — Production exporter & release certification
- Preserve FrameForge's MP4 frame-count/codec/progress/cancel/report path as the primary exporter.
- Add well-tested fallbacks where browser encoders are absent; optimize memory, assets, render order and recording.
- Validate full 1080x1920/30fps H.264 plus audio, decoded first/last frame, loudness, subtitles and seeking.
- Test Chrome/Edge Windows, Chrome Android, Safari iOS/macOS and useful desktop Linux configurations. Report skipped tests explicitly.
- EXIT: no P0 regressions, exports independently playable, no critical error paths, approved full-film samples.

### P9 — Isolated Vercel beta & user testing
- Deploy feature branch to separate Vercel project/preview, never overwrite the existing protected production URL.
- Run new creator usability tests; measure first-video success, time-to-export, repeat-creation and reported defects.
- Promote to production only after explicit verified acceptance, with immutable tag/rollback.
- EXIT: verified stable beta with known documented limitations.

### P10 — Competitive differentiators (post-core)
- Test first-rate original characters/acting, custom reusable cast, Indian-language TTS, optional MediaPipe retargeted motion, GIF/PNG/FBX exports, advanced templates.
- Build durable authenticated cloud workspaces/render queues and subscription billing only when demand and unit economics are evidenced.
- EXIT: actual competitive quality benchmarks and buyer outcomes, never feature checkmarks alone.

## Priority order and risk gates

P0 -> P1 -> P2/P4 vertical slice -> P3 -> P5 -> P6 -> P7 -> P8 -> P9 -> P10.
P2 and P4 must first demonstrate *one* new customizable actor in *one* new world, voiced and exported, before expanding to all templates/worlds.
P8 must run continuously from P0, not only at the end.

Most likely high-risk boundaries:
- FrameForge v1 fixed-id camera/appearance logic vs Ember's arbitrary character IDs.
- Arm/face animation retargeting across GLB/VRM bone conventions.
- Lighting/material expectations and scale/coordinate differences.
- Asset storage and security, browser memory and GPU limitations.
- Two competing voice metadata formats; stale voice after script edits.
- Export codec compatibility, audio muxing and cross-platform playback.
- Increased bundle size and unsupported extension/decoder loads.
- Commercial terms of third-party avatar/motion assets and cloud TTS models.

## PR and artifact discipline

- One feature slice per PR; no giant cross-project source dump.
- PR includes changed interface, migration path, tests, screenshot/video proof, licence note, performance report and rollback instructions.
- Green unit/integration/browser/render tests + representative mobile checks + human watch/listen approval.
- Track failures with exact commit, command, platform and artifact. A CI failure is not marked passed by explaining its cause.
- Promotion: feature branch -> staging deploy -> review -> release tag -> main merge -> production only if explicitly authorized.
- No destructive Git operations, forced pushes, deleted older branches/tags, or expense-creating cloud resources without independent review.

## Business acceptance (after technical beta)

Positioning: local-first, independently editable 3D reels with reusable original cast and consistent high-quality audio/film output.
Competitor benchmark: Krikey's real workflows (custom avatars, motion libraries, languages, export types, project sharing), not just feature labels.
Proposed $12/mo is only a market test; no validated conversion or unit economics currently exist.
Run independent creator testing before claiming customers will pay.
