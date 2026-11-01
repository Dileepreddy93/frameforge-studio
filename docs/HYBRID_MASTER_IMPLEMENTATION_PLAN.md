# FrameForge Ultimate — phase-gated hybrid implementation contract

Status: IMPLEMENTATION PLAN (not an assertion that phases are complete)
Created: 2026-11-01
Target repository: Dileepreddy93/frameforge-studio
Work branch: feature/hybrid-foundation
Frozen development starting commit: 2b78e60fd484f6590276f041bfafc977aa4ef479 (deployed to frameforge-v6.vercel.app when audited)
Source repository: Dileepreddy93/ember-take-studio, main @ 22c745ffd (inspect full SHA before cherry-picking)
Original FrameForge main: 49c10c59f89b971666c8be3b1aa7efa18ade1774 (DO NOT replace)
Production constraint: no main merge, tag overwrite, production redeploy or deletion before independent acceptance.

## EXECUTION STATUS AND RESUME POINT — 2026-11-01

**Current phase:** P5/P6 director/voice contracts IMPLEMENTED and source tests PASSED; integrated two-film video evidence in progress. **P3/P4:** rig/world/video integration passed technical CI. **P1/P0:** independent-page V6 visual parity and Windows/macOS release signoff still unresolved.
**Work branch:** `feature/hybrid-foundation`. **Main/production:** untouched. **No hybrid deployment has been made.**
**Authoritative baseline:** V6 M6.5 at `2b78e60fd484f6590276f041bfafc977aa4ef479`; do not reinterpret the old `main` branch as the V6 production baseline.

| Gate | State at this checkpoint | Evidence or blocker |
| --- | --- | --- |
| Plan and resume pointer saved in GitHub | **DONE** | This document; `CONTINUE_HERE.md` updated to point to the active hybrid plan |
| Safe feature branch from deployed V6 | **DONE** | `feature/hybrid-foundation`, starting at `2b78e60` |
| Freeze original V6 episode project/audio/media inputs | **DONE** | `spec/hybrid-v6-baseline.json`; 2 projects (14 and 12 shots), 13 media assets with Git blob SHA-1 |
| Enforce old project contract and checked-in fixture immutability | **DONE / UNIT PASS** | `tests/hybrid-baseline.test.cjs`; source-and-project job passed in [run 41287771443](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41287771443) after a corrected manifest SHA |
| Probe V6 reels and fully decode both MP4 films | **DONE / CI PASS** | `tests/hybrid-baseline.test.cjs --media`, portable-video-export job passed in [run 41287771443](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41287771443) |
| Test original film pixels against frozen M6.5 code in identical Chromium | **WIRED / RESULT PENDING** | `tests/hybrid-legacy-film-frames.cjs` compares 14 frames across 2 episodes using a git worktree; first run containing this test: [run 41288030520](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41288030520) |
| Existing character, editing, mobile, voice and audio regressions | **PARTIALLY PASSING / SUITE PENDING** | [latest integration CI](https://github.com/Dileepreddy93/frameforge-studio/actions/workflows/project-contract.yml) includes source, browser, mix, rigged and portable video jobs; verify all jobs for the **latest head SHA** before approval |
| Full Windows Chrome/Edge release-to-MP4 workflow | **RUNNING / NOT CERTIFIED** | Fixed verified old `mpv.exe` missing-PATH failure; [release run 41287333994](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41287333994) is testing that change |
| macOS AVFoundation compatibility of Windows release MP4 | **PENDING** | Downstream of successful Windows Chrome/Edge jobs in `release-e2e.yml` |
| Publication is explicit and non-destructive | **IMPLEMENTED / CI PENDING** | Release job now requires manual dispatch on `main`, uses run-unique demo asset branches/tags and no force pushes or release deletion |
| Manual full-film art, lip-sync and listening approval | **NOT DONE** | Exact final produced MP4 must be watched and heard; source tests alone cannot sign it off |
| Production deployment/merge | **NOT DONE (intentional)** | Only after all P0 gates pass and the user authorizes production promotion |

### P0 code changes committed so far

- `4b0827b`: Windows `mpv.exe` resolution in full-film release validation.
- `b699fb5`, `4045f11`, `e22484f`: original V6 asset/project SHA freeze, contract/media tests, CI wiring.
- `95c8263`: correct one incomplete 40-character `.webm` Git blob SHA after a real red source test; later source and portable-media jobs passed.
- `89fbd1d`: add safe new-chat entry point to `CONTINUE_HERE.md`.
- `cadc029`: remove automated demo publication by commit message, force push and release deletion.
- `889c91d`, `6de9964`: same-browser visual parity test (frozen baseline vs hybrid branch) wired into Chromium CI.
- `4d657cd`: cancel superseded feature-branch CI runs and skip docs-only push workflows to limit expensive duplicate GitHub Actions minutes.

### Commands to run at each P0 verification

```bash
git fetch origin --tags
git switch feature/hybrid-foundation
git pull --ff-only
node tests/hybrid-baseline.test.cjs
# With ffmpeg and ffprobe:
node tests/hybrid-baseline.test.cjs --media
# With Playwright Chromium installed and full git history:
node tests/hybrid-legacy-film-frames.cjs
# Existing unit/browser/voice/export suite is in .github/workflows/project-contract.yml
# Full Windows/AVFoundation release is in .github/workflows/release-e2e.yml
```

**Required next action:** Read the latest commit and latest two workflow runs on `feature/hybrid-foundation`. Inspect any failed job logs; fix failures with precise repro, do not rewrite the baseline manifest to match a regression. Obtain full green runs and watch/listen acceptance before marking P0 complete or beginning P1. Existing `frameforge-v6.vercel.app` is intentionally not modified.

**Update rule for all later phases:** Modify this section *in the same branch* after each phase or meaningful verification checkpoint. Keep: phase state, exact commit SHA, CI run URL, successful/failed commands, rendered-video/audio evidence, known regressions, next tasks and rollback reference. Never mark a gate PASS when it is merely queued/in progress.

---

## P1 — Versioned project and provider adapters (2026-11-01)

**Development state: CORE CODE + WEBGL VIDEO PROOF PASSED; release-wide acceptance pending.** P1 code lives only on `feature/hybrid-foundation`, and does not alter the existing `studio.html`, original `src/project-core.js`, characters, soundtrack, or production export code.

| Item | Evidence | State |
| --- | --- | --- |
| `frameforge.project/2` contract | `src/hybrid-project-core.js`; validates project, cast, cameras, assets, reference constraints, shot durations and film duration | **PASS** |
| Frozen `frameforge.project/1` compatibility | Both real films v1 → v2 → v1 deep-equal, v1 legacy timeline and project validation delegated to unmodified core | **PASS** |
| Deterministic timeline | `timeAt` / `toTimelineShots`, seek/rewind and shot-order independence tests | **PASS** |
| Provider contracts | `src/hybrid-providers.js`: actor/world factory registry, camera/audio directors, asset-store bounds and copy isolation; lifecycle and disposal tests | **PASS** |
| Malformed/untrusted v2 validation | 21 negative tests for invalid fields, provider types, references, timings, unsafe asset URIs, cameras and identities | **PASS** |
| Source contract and unit suite | [run 41289099137](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41289099137), `source-and-project-tests`; `HYBRID_P1_CONTRACT_PASS` log | **PASS** |
| Actual WebGL provider proof | `tests/hybrid-p1-proof.html`, `tests/hybrid-p1-video-browser.cjs`; 24-frame 360×640 at 12 fps test-only H.264/AAC file decoded by ffmpeg, deterministic same-time frame hashes | **PASS** |
| Browser/media video CI | [run 41289099137](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41289099137), `portable-video-export`; `HYBRID_P1_WEBGL_VIDEO_PASS`, `HYBRID_P0_MEDIA_PASS` | **PASS** |
| Video proof artifact | [P1 hybrid adapter proof](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41289099137/artifacts/13075629883) | **UPLOADED** |
| Legacy original-film parity | [run 41288071162](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41288071162) including visual parity test | **PASS** |
| Latest complete source/browser/voice CI | [run 41289099137](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41289099137): source, rigged, voice-and-mix, and portable video passed, but real-character browser job failed on Dark Mode frame parity before re-sync (see P1 regression note); corrected test rerun 41289431575 pending | **PENDING FINAL** |
| Windows/macOS full release certification | [release run 41287859898](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41287859898) | **P0 GATE OPEN** |

**P1 commits:** `98fed858` (v2 contract), `e695b039` (provider registry/session/storage), `4bba8b46` (negative and compatibility tests), `4d949408` (source CI), `263a8fec` (real Three.js proof scene), `6222d1a5` (real playable proof film), `618cb4ca` (video CI and artifact), `a0166fa3` (interface specification).

**Contract documentation:** [docs/HYBRID_V2_CONTRACT.md](HYBRID_V2_CONTRACT.md).

**Limitations, not hidden:** The P1 proof uses synthetic QA geometry and intentionally silent test audio. It proves providers can drive Three.js graphics and a decodable short film; it does not prove Ember cast quality, working imported rigs, multilingual speech, real 1080×1920 custom episode exports, or public UI support. All new custom actors and worlds remain **opt-in v2** and are NOT routed into production. Those are P2–P8 tasks.

**Latest P1 regression finding:** [run 41289099137](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41289099137) failed the new *test-only visual parity assertion* on Dark Mode at 0.5 seconds. Other P1 checks and old deterministic-frame tests passed. The test was switching from Zero Latency to Dark Mode without waiting for `FrameForgeQA.envelopeReady()` for the selected film, and capturing the frozen and integration versions concurrently in one headless GPU. The v1 scene/renderer code was not edited. In commit `5786557`, `tests/hybrid-legacy-film-frames.cjs` now waits for switched-episode voice timing and fonts, and renders pages sequentially. **This is an unverified suspected test-race fix until the full rerun passes**, not a waiver of visual compatibility. See [rerun 41289431575](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41289431575).

**Next checks:** Verify all jobs of run 41289099137, especially the real-character-render and voice/mix jobs, and complete the P0 Windows + macOS release tests. Do not promote to `main` or production, and do not claim P1 fully release-certified while these remain pending. If all gates pass, proceed to P2 vertical slice: one Ember actor and one Ember world inside the FrameForge rendering system with an independently verified voiced final MP4.

---

## P2 — Real Ember cast integration (2026-11-01)

**Status: P2 DEDICATED ART + VIDEO CI PASS; FULL SUITE AND LEGACY RELEASE APPROVAL STILL PENDING.** Read [P2 cast contract and testing](HYBRID_P2_CHARACTER_ENGINE.md). No production UI/deployment change.

- Source import: `src/ember-character-engine.mjs` (actual Ember source pinned to `22c745ffdc2d6411707f3a9bbe5bd70b10f9d9db`), `src/three-rounded-box.mjs` (Three.js r180 example, MIT).
- Adaptor: `src/ember-actor-provider.mjs` registers the procedural ActorProvider; six real Ember presets `creator/human/robot/creature/bot/mascot`, appearance options, original IK, action gestures and eight emotional faces.
- Character safety: dispose-owned geometry per model, including independent copies of the original shared hair-lock geometry (prevents shared mesh disposal between simultaneous rigs).
- Browser QA: `tests/hybrid-p2-character-proof.html`, `tests/hybrid-p2-characters-browser.cjs`; tests all templates, four views, eight expressions, look presets/customization, seek determinism, two simultaneous actors and cleanup.
- Movie proof: browser generates animated 360×640 frames, ffmpeg multiplexes **existing** V6 mastered audio into a two-second H.264/AAC P2 preview, then fully decodes/probes. This does **not** validate new character speech or lip sync: P6 owns that.
- CI wiring: `.github/workflows/project-contract.yml` runs new module syntax checks and P2 browser/video acceptance in portable-video-export, uploading `frameforge-p2-ember-cast-proof`.
- Relevant commits: `e163037`, `e6eb3dc`, `9556a6f`, `3060e38`, `2331120`, `0522320`, `ce3c9b8`, `03864e3`, `daccea7`. See commit history for precise full SHAs.
- **CI:** [P2 verified run 41290322745](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41290322745). Source and project tests **PASS**, rigged-character import **PASS**, portable-video-export **PASS**. Portable job log explicitly reports `HYBRID_P2_CAST_PASS` with all six presets showing four distinct camera views, eight distinct acting/emotion images and deterministic rewind; `HYBRID_P2_VIDEO_PASS` for a 2-second H.264/AAC clip with complete ffmpeg decode. Other browser/voice jobs were still executing at this checkpoint.
- **P0/P1 blocker still open:** side-by-side old-film frame-hash comparison failed intermittently in new browser instances even though the legacy scene source has not changed. No tolerance waiver or baseline overwrite is authorized. Diagnose, capture and compare pixel differences and ensure repeatable parity or approved bounded tolerance before promotion.
- **P2 real failure / fix:** Earlier [run 41290152840](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41290152840) failed because the *test page* applied actor camera-facing rotation **after** pose/IK evaluation, making rewind dependent on the prior view. Commit `ceaad73b9e6bb384277d679b1eb6601249e48254` applies actor facing before seeking. The corrected run 41290322745 passed the dedicated determinism and video tests. No original V6 renderer code was changed.
- **Proof artifact:** [P2 real Ember cast images and short MP4](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41290322745/artifacts/13076996727), with 6 × 4 view captures, 6 × 8 emotion captures, two-actor/custom-look previews and a saved report.
- **Next action:** Review other jobs of [run 41290322745](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41290322745) and unresolved P0/P1 cross-platform/visual parity, without relaxing comparison thresholds blindly. P3 may implement import adapters on the protected branch, but production promotion is blocked until release gates pass.

---

## P3 + P4 — Real imported humanoids and Ember environments (2026-11-01)

**Targeted engineering proof: PASSED. Full P3/P4 production acceptance: NOT YET APPROVED.**
Read [P3/P4 technical contract and licensing](HYBRID_P34_IMPORT_WORLDS.md).

### Delivered code (protected hybrid branch only)
- P3: `src/ember-import-validator.mjs` (Ember's original rig/face inspector), `src/ember-imported-rig.mjs` (true skinned humanoid/IK/viseme code), `src/hybrid-rigged-provider.mjs` (GLB preflight, 25 MiB cap, self-contained asset policy, required bone/extension checks, async preload, disposable absolute-time actor).
- P3 runtime libraries: locally pinned official Three.js r180 MIT `src/vendor-gltf-loader.mjs`, `src/vendor-buffergeometry-utils.mjs`.
- P4: `src/ember-world-engine.mjs` (actual Ember foliage, atmospheric light, snow, particles, scenes), `src/hybrid-world-provider.mjs` (bound options, world-time, safe anchors, scene restoration, GPU disposal, imported world validation).
- P4 runtime libraries: locally pinned official Three.js r180 MIT `src/vendor-sky.mjs`, `src/vendor-groundedskybox.mjs`.
- V6 `studio.html`, `src/project-core.js`, existing character engines, main and production remain unchanged, verified by actual GitHub compare against commit `2b78e60`.

### Verified CI and evidence
- [Code quality run 41295668842](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41295668842) `portable-video-export` **PASSED**, and the source and rigged-import jobs passed.
- Log `HYBRID_P3_IMPORT_PASS`: real `AraAthleticMan.glb`, **69 named humanoid bones**, 10,587,092 bytes, 48,820 triangles, 8 directed emotions, actual skinning/animations. Existing CC0/MakeHuman-derived test asset, CMU-derived bundled motion with **separate no-resale restrictions**: technical CI only, never commercial cast distribution; these clips are not used by proof.
- Log `HYBRID_P4_WORLDS_PASS`: original Ember `forest` morning, `meadow` golden, `snow` night, `desk` golden, deterministic state and rewind; imported-world GLB loading using **Khronos CesiumMan as a geometry proxy only**, not an artistically validated environment.
- Log `HYBRID_P34_VIDEO_PASS`: **24-frame, 300×500, H.264/AAC** test film, fully decoded by ffmpeg using the old V6 mastered audio. Not full-res new voiced/lip-synced output.
- [P3/P4 actual screenshot/film/report artifact](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41295668842/artifacts/13079385805).
- P0 media checks, P1 hybrid video, and P2 six-character browser/video proof **also passed in the same portable job**.

### Failure history and unresolved gates
- First P34 browser run timed out: strict humanoid preflight correctly rejected **Khronos CesiumMan** because its 19 joints use nonstandard names (e.g. Skeleton_torso_joint_1) and lacked the required mapping. Real model diagnosis at [run 41295412244](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41295412244) confirmed Ara's recognized 69-joint mapping; we did **not** weaken safety to make CesiumMan pass.
- Second browser run failed on a test typo expecting `world.preset`, when the correct v2 property is `world.template`; fixed in commit `c1251982` and verified green.
- Full **P3 acceptance still open**: independent VRM and Mixamo/Blender assets, MToon/spring-bone and facial morph limitations, multi-rig handling, mobile GPU/memory and commercial licence checks.
- Full **P4 acceptance still open**: one truly authored imported world, complete desk furniture/prop editing, HDRI/backdrop/360 options and real-device visual/performance tests.
- **P0/P1 whole product release gate still open:** existing independent-browser baseline screenshot comparator periodically fails even though original V6 rendering code is unchanged; Windows/macOS full-film release gate is not certified. Do not weaken thresholds without baseline-variance evidence.
- Production `frameforge-v6.vercel.app` and `main` deliberately untouched. New custom characters/worlds are not yet wired to the normal editor (P7), original voice/lip sync and final film pipeline (P6/P8).

**Next checkpoint:** continue P3/P4 compatibility hardening and future P5 director integration on the protected branch; do not promote production until all above release gates are independently verified.

---

## P5/P6 — One-timeline cinema direction and waveform-driven voice (2026-11-01)

**Status: CODE + CONTRACT CI PASS, TWO-FILM RENDER AND RELEASE VERIFICATION IN PROGRESS.** See [P5/P6 contract, demo limitations and voice rights](HYBRID_P56_DIRECTION_VOICE.md).

P5 implementation:
- `src/hybrid-direction.js` is the V2 script round-trip, shot reorder, actor-independent camera geometry (wide, single actor, two actor, screen), push/pull/orbit/drift, constrained camera blends and one-take continuity. Expressions, secondary-actor reaction beats and on-set screen cues come from the same FrameForge timeline. Existing V6 `src/script-core.js` remains untouched.
- `src/ember-screen-apps.mjs` is Ember's MIT screen-app renderer, wrapped by `src/hybrid-screen.mjs` as a frame-accurate editable monitor action, with audio cue mapping and a safe caption/screen layout.
- V2 validator now validates direction, one-take, reactions, caption and screen text; legacy v1 delegates to original parser.

P6 implementation:
- `src/hybrid-voice.mjs` bridges the existing local Kokoro worker (English), imported legal/consented 48 kHz mono PCM, shot re-timing, actor-audio assignment, FrameForge's existing stereo `episode-mix` with original sound-kit/music ducking and safe peak/loudness, 20Hz acoustic speech envelope and the existing FrameForge approximate visemes.
- `src/ember-actor-provider.mjs` and `src/hybrid-rigged-provider.mjs` now expose optional acoustic `setSpeech` mouth controls, without changing legacy V6 rendering.
- Tamil, Telugu, Hindi or any unsupported language are **not** silently mapped onto English Kokoro. Import of licensed human recordings is supported; native language synthesis is not yet verified and remains a commercial release gap.
- The worker bridge strips Kokoro's internal 60ms/100ms line padding before reapplying shot timing. The new voice transport's unit test uses a mock worker; new-original-dialogue Kokoro inference in an actual V2 scene still needs direct full-model testing.

P5/P6 QA:
- `tests/hybrid-director.test.cjs`, `tests/hybrid-voice.test.mjs`: script/one-take/reaction contracts and worker/PCM/mixing/consent; **source-and-project passed** in [run 41299172423](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41299172423).
- `tests/hybrid-p56-proof.html`, `tests/hybrid-p56-browser.cjs`: 2 distinct Ember authored-story scenes with moving camera, live application screen, spoken-word mouth motion, original V6 Kokoro English speech segments placed in the **new** V2 mixer, 360×640 full-video H.264/AAC plus WAV and PNG screenshots, independent full ffmpeg decode. Voice clips are reused from the existing Zero Latency track and are **not newly synthesized dialogue**.
- [Full P5/P6 acceptance run 41299172423](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41299172423) and art/video artifact **PENDING**. Do not mark complete until `HYBRID_P5_DIRECTOR_VIDEO_PASS` and `HYBRID_P6_AUDIO_VIDEO_PASS` appear in a successful portable-video-export job.
- The existing unrelated independent-page legacy film visual-parity test may still fail; P0/Windows+macOS release signoff still open. New combined hybrid customer UI is P7; high-resolution consumer export, long-film and mobile perf P8.
- Production V6 and main remain protected and unchanged.

**Next:** Fix any P5/P6 browser/voice failures, record exact passing CI and downloadable artifact, and then expand newly synthesized speech and multilingual R&D without pretending pre-recorded voice segments are a verified new TTS language.

---

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
