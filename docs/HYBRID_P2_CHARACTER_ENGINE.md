# FrameForge Ultimate — P2: Ember built-in cast integration

**Status:** dedicated six-character, expression, look, deterministic rewind and H.264/AAC video QA PASSED in CI [run 41290322745](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41290322745). Full cross-platform release approval and legacy side-by-side visual comparator remain OPEN. **Production:** untouched. **Branch:** `feature/hybrid-foundation`. Read `docs/HYBRID_MASTER_IMPLEMENTATION_PLAN.md` for the authoritative phase status and known blockers.

## Provenance and preserved implementation

The actual MIT-licensed Ember Take Studio procedural rig source was imported from `Dileepreddy93/ember-take-studio` commit `22c745ffdc2d6411707f3a9bbe5bd70b10f9d9db`, not imitated with a placeholder primitive figure.

- `src/ember-character-engine.mjs` contains the Ember procedural geometry builder, two-bone arm and leg IK, gestures, stylized humanoid/robot/bot/creature/mascot shapes, eye/mouth textures, accessories and expression drawing. Edits are limited to module import paths, portable math helpers, and isolating shared hair geometry so one disposed character cannot break another.
- `src/three-rounded-box.mjs` is adapted from Three.js r180 MIT example with import retargeted to the pinned Three.js `0.180.0` vendor copy.
- `src/ember-actor-provider.mjs` wraps this source behind the P1 `ActorProvider` contract: `setPose(absoluteTime,shot,performance)`, `getAnchors()`, and `dispose()`. The V6 DEV, BLUE and ORANGE models and code are not changed.
- The six **preset names** are `creator`, `human`, `robot`, `creature`, `bot`, and `mascot`. There are five distinct primitive actor kinds (creator and human use the same humanoid rig with different starting appearances).
- Eight performance emotions are `neutral`, `happy`, `sad`, `angry`, `surprised`, `worried`, `curious`, and `idea`. The original Ember procedural eye and mouth painting is used.
- Appearance configuration includes height, build, head proportions, species, hair/facial hair, eye style, hats, glasses, clothes, accessories, held props, stance and hex colors. All fields are allowlisted with finite numeric bounds and preset enumerations.
- Two or more independent actor instances are supported by the provider interface; rigs have their own scene hierarchy and disposable geometries.
- Scene and cast are still *opt-in* under `frameforge.project/2`. The original `studio.html`, legacy `frameforge.project/1` film renderer, soundtrack and browser MP4 export have not been modified.

## Tests and artifacts

- `tests/hybrid-p2-character-proof.html` builds an actual Three.js stage and uses `FrameForgeHybridProviders.createSession()` with real Ember rigs.
- `tests/hybrid-p2-characters-browser.cjs` verifies all six templates, four camera views of each, eight emotions, deterministic rewind, appearance changes, invalid configuration rejection, two-actor creation and disposal.
- It writes image evidence and a **2-second H.264/AAC MP4**, fully decoded with ffmpeg. The audio comes from the existing V6 Zero Latency mastered track; **this is not new speech or phoneme-accurate lip synchronization**. The test therefore validates animated graphics and playable audio-video packaging, but it does not assert final voice performance.
- `.github/workflows/project-contract.yml` performs ESM syntax tests and runs the P2 browser proof in the existing Chromium/FFmpeg portable video job; uploads `frameforge-p2-ember-cast-proof`.
- Passing dedicated run: https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41290322745. Its portable-video-export job logged `HYBRID_P2_CAST_PASS` for all six templates (four distinct views, eight distinct emotion/acting frames, deterministic rewind), and `HYBRID_P2_VIDEO_PASS` for complete MP4 decode. Evidence: https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41290322745/artifacts/13076996727.

## Acceptance criteria

1. All six actual Ember presets instantiate without missing geometry, materials or textures.
2. Each preset has at least three visually distinct orientations and at least four visible emotional poses from eight tested values.
3. Absolute-time seek/rewind returns pixel-identical output under the same configured test browser.
4. Custom body/head scaling, outfit, accessories, skin, prop and palette survive the project roundtrip.
5. Multiple independent rigs animate and can be disposed without shared GPU geometry invalidation.
6. Complete test MP4 has an H.264 video stream, AAC audio stream, expected dimensions/frame count and no decoder errors.
7. The original two V6 projects, soundtrack assets and legacy renderer still pass P0 visual and contract regression gates.

## Known limitations and next phases

- The P2 cast adapter is **not yet wired into the normal production editor**. This is intentional while original FrameForge rendering/export safety gates remain open; P7 will provide the unified editing UI.
- P2 uses simple world-stage anchors for testing. Importing all of Ember's world builders, lights, HDRI and particles is P4.
- Voice-driven naturalistic lip sync, bilingual/Indic TTS, mastered audio timing and long 1080×1920 user-generated films are P6/P8.
- GLB/VRM rigs are a separate P3 integration, not part of this built-in cast phase.
- The P1/P0 visual-parity test has intermittent mismatches between independent browser instances even when the original V6 rendering source was not modified. Investigation must not be replaced by blindly raising tolerances or re-recording reference frames.
- A CI test-only artifact is not a deployable customer film; production is deliberately left untouched pending further phase integration.

## Safe resume point

Fetch `feature/hybrid-foundation` and read both this file and `docs/HYBRID_MASTER_IMPLEMENTATION_PLAN.md`. Inspect the newest `FrameForge code quality` workflow. P2 browser/art proof passed after fixing test-stage actor orientation before pose/IK evaluation (commit `ceaad73b9`). Read the master plan for remaining P0/P1 visual parity and release blockers, then implement P3 independently on this branch. Do not claim a deployed custom-character editor or synced custom speech yet. Leave `main` and `frameforge-v6.vercel.app` untouched.
