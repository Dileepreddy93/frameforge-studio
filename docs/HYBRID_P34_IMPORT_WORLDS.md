# FrameForge Ultimate — P3/P4 implementation contract

Branch: `feature/hybrid-foundation`. Status: implementation present; release-wide CI pending. This is an engineering record and not an assertion that the hybrid UI is production ready.

## Integration design (not a blind source merger)

P3 imports the original Ember model-analysis and bone-retargeting source, but wraps it behind FrameForge's **versioned v2 project**, hard byte-size caps, explicit validation, **local-only asset URLs**, pinned **self-hosted Three.js r180 GLTFLoader**, and a preloading stage separate from the synchronous rendering session.

P4 uses actual Ember procedural world builders (forest, meadow, snow) and studio atmosphere. It attaches them to FrameForge's **single** world-provider contract, restoring scene state on disposal and exposing consistent `center`, `screen` and `ground` anchors to FrameForge's camera director. There is no second timeline and no change to legacy V6's set/renderer.

## P3 modules

- `src/ember-import-validator.mjs`: Ember source `character-import.js`, commit `22c745ffdc2d6411707f3a9bbe5bd70b10f9d9db`. Analyzes bone conventions, VRM metadata and morph channels.
- `src/ember-imported-rig.mjs`: Ember source `imported.js` with the same pinned Three.js, original IK/mouth drawing, rest-pose resets and dispose logic; not a simplified placeholder.
- `src/hybrid-rigged-provider.mjs`: enforces FrameForge's 25 MiB GLB cap, self-contained assets, recognized humanoid bones, required-extension allowlist and triangle budget **before GLTFLoader**. `prepareRiggedCast()` loads each model asynchronously exactly once per project instance. `registerRiggedCharacters()` maps completed rigs into P1's synchronous `ActorProvider` with deterministic absolute-time motion and head/root anchors.
- `src/vendor-gltf-loader.mjs` and `src/vendor-buffergeometry-utils.mjs`: official Three.js r180 MIT modules pinned locally to remove the CDN dependency.
- `assets/rigged-samples/CesiumMan.glb` (existing Khronos/Cesium CC BY 4.0 technical sample) is the first known real skinned validation fixture. It is not redistributed as a creator marketplace avatar, and other rig types have **not yet** been certified.

**Explicit VRM limitations:** glTF geometry and VRM metadata can be parsed and supported humanoid bone maps evaluated. VRM MToon materials, VRM-specific spring physics and VRMC node constraints are **not implemented**; unsupported *required* extensions must be rejected, and no universal VRM support claim is permitted.

## P4 modules

- `src/ember-world-engine.mjs`: Ember source `worlds.js`, imported with only local Three.js and original physics-sky classes.
- `src/vendor-sky.mjs`, `src/vendor-groundedskybox.mjs`: pinned Three.js r180 MIT shader/world support.
- `src/hybrid-world-provider.mjs`: uses the actual Ember `buildNature()` and `deskAtmosphere()`; world options are bounded for client rendering; `setTime(t)` calls the environment's pure absolute-time animations; scene state and GPU resources are released/cleaned on disposal. `auditWorldAsset` and `prepareImportedWorld` validate and load self-contained GLB worlds into `WorldProvider`.
- Builder options currently cover forest, meadow, snow, desk, morning/golden/night, foliage, wind, and recognized ambient particles. No misleading claim that all Ember UI/theme settings have been implemented.
- `tests/hybrid-p34-proof.html` creates a **single new v2** project using actual skinned CesiumMan and actual Ember world builds. The imported-world path uses the Khronos model **only as geometry-loading technical proxy**; it is not an original authored environment and cannot count toward final art acceptance.

## Gates and exact evidence

- P3 strict validation: required bones, skin, GLB bytes, extension and primitive bounds, no remote textures/buffers, no silent no-skin fallback. Existing `rigged-asset-core` and `asset-lab` tests remain in CI.
- P3 real browser: skinned GLB loaded, animated across eight v2-directed emotions and multiple camera angles, anchored and seekable.
- P4 nature: forest, meadow, snow, desk all render in Chromium, time-advanced and rewound, and scene cleanup works; imported world path validates and loads a locally contained GLB.
- P3/P4 proof: H.264/AAC short MP4 fully decoded and probed for frame count; uses existing V6 master audio and is **not** a new voice/lip-sync demo.
- Tests: `tests/hybrid-p34-policy.test.mjs` (source job), `tests/hybrid-p34-browser.cjs` (portable WebGL and video job), `tests/hybrid-p34-proof.html`.
- CI entry point: [FrameForge code quality](https://github.com/Dileepreddy93/frameforge-studio/actions/workflows/project-contract.yml). **Do not mark success until both `HYBRID_P3_IMPORT_PASS` and `HYBRID_P4_WORLDS_PASS` and `HYBRID_P34_VIDEO_PASS` appear in passing job logs.**
- P0/P1 outstanding legacy cross-browser-load frame parity and Windows/macOS final release certification still block production promotion.

## Roadmap decisions

1. Do **not** copy Ember's entire scene editor into `studio.html`: P5/P7 will adapt screens, direction and responsive controls while respecting FrameForge's stable film/export architecture.
2. Do **not** call GLTFLoader with nonvalidated or externally referenced uploads. Decode only from the in-memory, explicitly bounded asset store.
3. Do **not** claim all VRM or all Mixamo/Blender rigs work after only checking CesiumMan. Need multiple independently authored rig conventions, no-bone failures, morph-based expressive models and real browser/mobile performance proof.
4. Do **not** conflate a 2-second code proof using mastered V6 audio with a complete voiced, synchronized, customer-exported 1080p original movie. That acceptance belongs to P6/P8.
5. Never overwrite V6 production or existing `main`. All P3/P4 experiments remain reversible in `feature/hybrid-foundation`.

Resume: check the latest `feature/hybrid-foundation` SHA, this file, master plan, and full GitHub Actions jobs; fix every red test and update exact run/artifact IDs.