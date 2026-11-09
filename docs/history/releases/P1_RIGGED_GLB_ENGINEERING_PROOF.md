# P1 Issue #9 — rigged GLB actor importer, technical proof
Date: 2026-10-24. Branch `feature/p1-real-glb-character-lab`, fork develop `1b37356cfd57d1f299b6dc87516d7705eec3fed1`.

## Scope
Existing movie engine and native voice/export remain untouched. This branch adds a separate but linked real Three.js GLB importer, not another primitive mesh approximation.
- `src/rigged-asset-core.mjs`: real glTF 2.0 binary bytes validation (25 MiB cap, header, asset manifest, no remote asset URIs), scene rig/mesh/morph inventories and real morph-target preset mapping.
- `asset-lab.html`: user-local self-contained .glb upload, real geometry/skeleton, 4 views, full/portrait composition, deterministic native clips/seek, PNG capture. UI disables emotions when imported model contains zero valid matching facial morphs. No pretend expressions.
- `assets/rigged-samples/CesiumMan.glb`: ©2017 Cesium **CC BY 4.0** diagnostic fixture, source Khronos glTF-Sample-Assets, upstream SHA `8586c4e6a59bf8ef585c2a685c50a80d28503216`. Contains Cesium trademark — NOT approved as a FrameForge film actor; see credits.
- Source tests `tests/rigged-asset-core.test.mjs`; Playwright `tests/rigged-asset-browser.cjs` loads actual GLB and asserts skinned meshes, bones, animation, 7 original GPU frame PNGs with SHA manifest; dedicated independent GitHub Actions job stores evidence.

## Gates
**Technical test PASS is only established by actual GitHub CI**, no arbitrary percentage or producer-art parity is implied by this code. Real candidate model may lack expressions (if so UI explicitly states so), no GLB to VRM extension handling yet, and no entry into the active Zero Latency film cast yet.

**P1 art gate remains NOT APPROVED**. Sample model has Cesium logo, limited facial detail and is for testing real skinning only. Follow Issue #9: pin Ara 3D Gen MakeHuman CC0 data, export one licensed distinctive human GLB with 20 actual expression blendshapes, inspect 4 views + 4 emotion close-ups and a 5-second muted acting clip against the exact target. If Ara quality/cost fails, create one original CC0 MakeHuman/Blender actor. Do not replace built-in DEV without comparison and performance proof.

## Cost, privacy and code provenance
No paid model generation, no user asset upload to FrameForge server, no externally requested GLB textures, no secrets. Three.js 0.180.0 loader imported through browser CDN. Asset sample distributed with CC BY attribution. Avoid copying proprietary characters or using unlicensed model packs.
