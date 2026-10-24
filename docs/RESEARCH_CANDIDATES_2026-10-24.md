# Tool discovery and adoption criteria — 2026-10-24
Every tool is **candidate**, not a presumed integration. Add only when a measurable P1/P5/P6/P7 gap is addressed, license/cost compatible, and benchmark passes.

| Candidate | Primary use | License / cost / availability | Action |
| --- | --- | --- | --- |
| JSONCut (https://jsoncut.com) | Hosted editable timeline, animated captions, audio, templates, V2 API/MCP | Free mode is editor/preview ONLY. Exports, API/MCP require paid plan or 14-day card-required Pro trial. Hobby paid; Pro needed AI captions/voice. NOT fully free. | P5/P7 optional A/B benchmark; DO NOT make required dep |
| M3 CharacterStudio (https://github.com/M3-org/CharacterStudio) | Open-source modular VRM/glTF actor wardrobe and optimization | MIT source; separate asset packs, individual asset licenses must be checked | P1/P7 proof-of-concept: importing our OWN rig/third-party licensed assets, face expressions, screenshots, GLB export, perf |
| @pixiv/three-vrm (https://github.com/pixiv/three-vrm) | VRM humanoid bones, look-at, expression blends | MIT, well documented, existing Three.js compatible in concept | Highest priority P1/P2 feasibility spike, separate import layer; do NOT rip out current engine |
| glTF-Transform (https://gltf-transform.dev/) | GLB geometry/texture cleaning + optimization | MIT; library/build tool, no modeling | P6 candidate for real imported 3D assets only |
| Editly (https://github.com/mifi/editly) | Open-source JSON-driven FFmpeg-based video overlays/transitions | Public repo, inspect exact transitive licenses/deployment constraints | P5 benchmark for timed captions/transition performance, compared with plain FFmpeg |
| HyperFrames (https://github.com/heygen-com/hyperframes) | Node 22+ render pipeline alternative | Open-source framework, actual renderer throughput unbenchmarked | P6 A/B against tested Chromium/FFmpeg, don't rewrite blindly |
| Blender + glTF tools | High quality organic geometry/rigging and baked animation | Blender open-source; check each external asset license | P1 highest-impact asset creation pipeline as opposed to procedural toy meshes |

## Prioritized bounded experiments
P1-R1: Export/import one LICENSE-CLEAR original VRM/GLB actor, inspect face closeup + 4 angle frames, benchmark draw calls, bundle size, mobile playback, expressions, and rig parenting vs existing DEV. Exit if art gets worse or requires locked/paid assets.
P1-R2: M3 CharacterStudio reference implementation proof; assess asset pack terms before integrating; prioritize customizable actor data and reusable GLB over extra UI presets.
P5-R1: JSONCut free preview with dummy/test video; before any hosted upload request user consent; export/API not $0 indefinite, so defer real integration and compare FFmpeg+Editly no-cost baseline first.
P6-R1: HyperFrames measured same 10s scene with equivalent shaders and 1080x1920/30; benchmark memory, total cost and artifacts; accept only superior or safer workflow.

## Provenance
JsonCut product docs: https://jsoncut.com/docs/ and pricing https://jsoncut.com/pricing/ as of 2026-10-24. Its hosted HTML-first V2 JSON contract and API key require server-side handling. No API key provided or used. Open-source alternatives must keep third-party LICENSE attribution and check data rights. None claim to automatically produce AAA/photorealistic characters or improve rig quality without authored modeling.
