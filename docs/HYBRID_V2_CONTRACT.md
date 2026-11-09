# FrameForge Ultimate — P1 v2 project and provider contract

**Status:** P1 implementation. Source-contract tests passed in CI at commit `618cb4ca`. Full browser/video proof is separately gated. Keep `docs/HYBRID_MASTER_IMPLEMENTATION_PLAN.md` as the authoritative status log.

## Scope and compatibility

- The current production `studio.html`, original FrameForge `src/project-core.js`, existing actors, music/voices, renderer, saved projects and MP4 exporter have **not** been modified for P1.
- Original `frameforge.project/1` files are passed directly to `FrameForgeProjectCore`, including timeline interpretation. `upgradeLegacyProject(v1)` makes a deep-copy `frameforge.project/2` document; `toLegacyProject(v2)` round-trips exactly if and only if the hybrid extensions are all legacy-only.
- Custom `frameforge.project/2` scenes **must not** be passed to the V6 production renderer. They are not yet user-facing; actor/world integration into `studio.html` begins in P2/P4.
- Only `1080×1920`/30 fps project output is supported by the current v2 contract, matching the original film target.
- The first integration branch is `feature/hybrid-foundation`; do not merge to `main` or redeploy existing production until release gates are approved.

## New modules

- `src/hybrid-project-core.js`: browser/Node UMD contract; `validateProject`, `assertProject`, `upgradeLegacyProject`, `toLegacyProject`, `timeAt`, `toTimelineShots`.
- `src/hybrid-providers.js`: browser/Node UMD provider registry, bounded memory asset store, camera/audio evaluators, deterministic `createSession`.
- `tests/hybrid-project-core.test.cjs`: v1/v2 roundtrip, asset security, invalid configurations and deterministic session lifecycle.
- `tests/hybrid-p1-proof.html` and `tests/hybrid-p1-video-browser.cjs`: test-only 3D adapter scene driven by Three.js; generated 360×640/12 fps H.264+AAC MP4 with silent test audio. This is **not** a full cinematic episode nor a customer feature.

## Minimal v2 representation (illustrative fragment)

```json
{
  "schema": "frameforge.project/2",
  "id": "sample-project",
  "title": "Sample Project",
  "logline": "A short story with a custom character",
  "output": {"width": 1080, "height": 1920, "fps": 30},
  "style": {"styleLock": "Original consistent design"},
  "environment": {
    "id": "new-stage",
    "description": "A customizable environment",
    "safeZone": {"top": 220, "bottom": 420}
  },
  "characters": [
    {
      "id": "hero", "name": "Hero", "visualIdentity": "Original actor",
      "voice": {"profile": "narrator", "voiceLock": "Stable voice"},
      "sheetStatus": "draft",
      "expressions": ["neutral", "happy", "sad", "surprised"]
    }
  ],
  "shots": [
    {
      "id": "shot-01", "speaker": "hero", "dialogue": "Hello world.",
      "camera": {"kind": "actor", "target": "hero"},
      "duration": 2.5, "intent": "greeting",
      "firstFrameStatus": "draft"
    }
  ],
  "audio": {"state": "storyboard_only", "masterUrl": null},
  "hybrid": {
    "version": 1,
    "cast": {"hero": {"provider": "procedural", "template": "human"}},
    "world": {"provider": "procedural", "template": "night-city"},
    "assets": []
  }
}
```

## Provider contracts

Create `registry=createRegistry()` and register `procedural` or `rigged` actor factories and `procedural` or `imported` world factories. Lock the registry after registration. Provider names cannot be overwritten.

Actor factory receives `{actor,descriptor,assets}` and must return:

- `setPose(absoluteTime, shot, performance)` — absolute-time, deterministic movement.
- `getAnchors()` — at least finite `root:[x,y,z]` and `head:[x,y,z]`.
- `dispose()` — release GPU meshes/materials/memory on editor exit.

World factory receives `{descriptor,project,assets}` and must return:

- `setTime(absoluteTime, shot)` — deterministic environment state.
- `getStageAnchors()` — `center:[x,y,z]`, `screen:[x,y,z]` for supported camera types.
- `dispose()` — free graphics resources.

`createCameraDirector().evaluate({shot,anchors,worldAnchors,stage})` resolves actor, two-shot, wide and screen targets without relying on fixed actor IDs.
`createAudioDirector().evaluate({shot,localTime})` records shot-based dialogue/timing/cues without synthesizing audio or replacing FrameForge's existing mixer.

`createSession(v2,{registry,assets})` owns the actor and world instances. Its `seek(t)` calls the absolute-time provider functions and returns a JSON-safe frame plan. Its `dispose()` releases all instances. Legacy v1, legacy-only v2, or mixed legacy/custom configurations are deliberately rejected by the new session until explicit compatibility adapters are implemented in later phases.

## Asset boundary

`hybrid.assets` entries use `{id,kind,uri:'asset://'+id}`. Rigged actors and imported worlds must refer to the correct asset kind; arbitrary external URLs are not allowed in the manifest. `createMemoryAssetStore` provides bounded, copied binary storage for tests and adapter integration. It is **not** durable IndexedDB storage or cloud storage. Actual GLB/VRM parsing/validation remains the responsibility of existing `src/rigged-asset-core.mjs` and the later Ember import integration.

## Gates before P2

1. v1 original episode/project and media SHA checks green.
2. v1->v2->v1 exact deep round-trip for both actual finished episodes.
3. v2 validator denies unsafe/missing types, references, performers and audio durations.
4. Multiple absolute-time seeks return equal character/world/camera state and pixels for equal timestamps.
5. Test-only WebGL provider scene produces a decodable MP4 with the expected frame count and dimensions.
6. Original 14-frame side-by-side V6 visual parity across the two old films remains green.
7. Branch code-quality and full release CI status recorded in the master plan; cross-platform release checks are independently tracked as P0, not silently marked complete.

## Critical limitation

P1 only defines and tests the integration contracts. It does **not** mean all six Ember characters/worlds are already present in FrameForge's UI or that a custom GLB/VRM cinematic episode can yet be exported from the existing studio. P2/P3/P4/P5 implement those capabilities behind these interfaces.
