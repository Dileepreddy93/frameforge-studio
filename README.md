> **Current project state (October 24, 2026):** This README's original material documents the preserved V3 backup. For the active V5+ studio, implementation phases, exact evidence and new-chat continuation, start at [CONTINUE_HERE.md](CONTINUE_HERE.md), [nine-phase contract](docs/IMPLEMENTATION_PLAN_P0_P8.md) and [execution ledger](docs/EXECUTION_LEDGER.md). V3 production is intentionally preserved. Development now includes merged V5.3 speech work on `develop`; quality is still not reference-approved.

---

# FrameForge Studio

Private backup of the verified FrameForge Studio V3 snapshot, stored before new experiments.

Production URL: https://frameforge-3d-director-preview.vercel.app/
Verified V3 movie: https://agz0k9i7nymp3png.public.blob.vercel-storage.com/frameforge/zero-latency-acting-v3-with-foley.mp4

This repository captures the actual deployed HTML/JS engine and its audio assets. It is not a new mock-up.

## Restore
Clone the private repository, switch to tag v3.0-stable and serve this directory with Python:
  python3 -m http.server 8080

The HTML needs the internet for its Three.js dependency and externally hosted V3 film and Foley soundtrack. Bundled copies are included under media/ for disaster recovery.

## Files
- index.html: exact verified deployed HTML/JS source
- dialogue42.ogg: 41.8-second voice timing and lipsync envelope source
- master42.ogg: earlier stereo/dialogue master
- dialogue.ogg: legacy 30-second experimental voice track
- media/zero-latency-stereo-foley-v2.ogg: 41.8-second Foley/music soundtrack
- media/zero-latency-acting-v3-with-foley.mp4: 41.8-second verified sample video
- docs/PROJECT_STATE.md: product state and known limitations
- docs/QUALITY_GATES.md: target quality validation
- docs/RESTORE.md: recovery and deployment process
- docs/SHA256SUMS.txt: per-file SHA-256 manifest

The v3.0-stable tag is protected by our workflow, not by GitHub branch protection. Keep main stable and perform later experiments on dedicated branches.

Do not commit .env, API credentials, private keys or GitHub/Vercel tokens.

## V5 experimental foundation (feature branch only)

The new browser now loads JSON from the projects/ directory. Existing episodes are preserved in a validated schema with character, voice and style locks. You can import a JSON project with the current three rigs, edit dialogue/speaker/camera and download a complete revised project file. The source of truth is documented at docs/PROJECT_FORMAT.md.

Tests (Node 22+):
- node tests/engine-syntax.test.mjs
- node tests/project-core.test.cjs
- node tests/project-integration.test.mjs

Browser tests need Playwright (`npm install --no-save playwright@1.56.1 && npx playwright install chromium`):
- node tests/determinism-browser.cjs — same time gives the same frame (fresh, repeated, after a jump)
- node tests/episode-data-browser.cjs — every shot decision comes from the episode JSON, not shot order
- Others (`performance-browser`, `speech-performance-browser`, `project-browser`, ...) need a local HTTP server and FRAMEFORGE_URL.

CI runs these in .github/workflows/project-contract.yml.
