# FrameForge V5 evidence-driven implementation contract

Checkpoint: 2026-10-24. Development on a feature branch derived from origin/develop.
Keep main, Vercel production, v3.0-stable and v4.0-rc1 unchanged.

The project requirements and evidence status are machine-readable in spec/quality-gates.json and spec/reference-register.json. A passing source test alone is never a film-quality pass.

## Source-based design decisions
- Claude & Pixel provides a public procedural Three.js, line-by-line voice, timed render and FFmpeg workflow. We do not possess or reproduce its private code.
- Agent Poly supplies a target for cohesive low-poly characters, expressions, action libraries, cameras and authoring. Marketing claims are NOT verified implementations.
- NMXWZ-1.pdf, pages 2-5: character sheets (front, 3/4, side, back, four faces), 9:16 worlds with caption space, approved first frames, 8-sec clips with up to two short spoken lines, locked style and voices per shot, clean video for post-production, transcribed word timings, animated 1-4-word captions with character colors, face-aware placement and suggested -14 LUFS mastering. Do not blindly combine the proposed top-caption space with UI overlay exclusion zones; use actual safe-zone tests.
- Optional image-to-video is a provider adapter with separate output pixels and no promise of editable meshes. It must not block the free deterministic Three.js engine.
- ViralSpy, Gumroad skills, HypedTown and Can We Build This remain external leads, not dependencies.

## Architecture and verification
1. Versioned, validated project document holds cast, style locks, stage, camera, dialogue, timing and assets. Engine reads this without source changes.
2. Rendered first-frame/multiview character sheets are required before performance; no glued-looking joints, weak facial controls or broken eye direction.
3. True lip alignment needs timed speech markers, not text-length heuristics. Assert exact sync and perform audio listening.
4. Each shot defines intent, speaker, emotions, listener, action, camera, FX and caption-safe space.
5. Keep video clean if adding captions in post-production; check every word/timestamp and mobile overlay.
6. Deterministic seekable rendering, FFmpeg finishing, actual full-film frame-count/codec/loudness checks and byte-level published checksum.
7. Automated code/browser QA and subjective visual QA are separate gates. Compare the exact reference asset, not a guessed substitute.

## Deployment discipline
One tested milestone commit and annotated tag for each completed engineering phase. Experimental work goes on feature branches; promote to develop after review. Main/production remains unchanged until full-film artistic approval. A phase can be technically delivered without receiving artistic reference parity.
