# FRAMEFORGE STUDIO — START HERE

**This private repository IS the project handoff. Continue from the existing code; DO NOT start over or ask the user to reconstruct old context.**

## Latest verified source position

- **Active developer branch:** feature/v5-expressive-character-portraits
- **Last pre-handoff source-code commit:** 8ae00022391ba175f3a23b35f33bf1ab80ab0910 (face geometry and portrait changes).
- **V3 protected production:** main / v3.0-stable, live https://frameforge-3d-director-preview.vercel.app/
- **V4 integrated branch:** develop (merge commit 06ec0d7); V4 media and tag v4.0-rc1 preserved.
- **Current artistic gate:** P1 character design remains UNAPPROVED. The latest face edit is newer than archived character-sheet renders. Do not assert reference-level quality.
- **Current request scope:** handoff-only push. No new development or production deployment was requested in this handoff turn.

## Mandatory reading (in order)

1. [CURRENT complete narrative handoff](docs/HANDOFF_CURRENT.md) — newest verified situation, mission, missing sources, source history and next work.
2. [Machine-readable current state + hashes](docs/HANDOFF_STATE_LATEST.json) — source head, tags, artifact checksums, open limitations.
3. [Original extensive handoff](docs/HANDOFF_2026-10-24.md) — previous thorough architectural decisions and failures.
4. [Master P0–P7 checklist](docs/MASTER_IMPLEMENTATION_CHECKLIST.md) and [implementation contract](docs/IMPLEMENTATION_CONTRACT.md).
5. [Development runbook](docs/DEVELOPMENT_RUNBOOK.md) and [decisions/failures](docs/DECISIONS_AND_FAILURES.md).
6. [Recovered NMXWZ PDF text](docs/history/NMXWZ-1-PDF_EXTRACTED_TEXT.md), [reverse-engineering report text](docs/history/Studio_Reverse_Engineering_Report_SOURCE.md), [original user takeover request](docs/history/USER_TAKEOVER_2026-10-23.md).
7. [Reference registry](spec/reference-register.json), [quality gates](spec/quality-gates.json), [art/media manifest](docs/RENDER_ASSET_CATALOG.json), [release reports](docs/releases/).
8. [Historical WIP diffs](docs/history/) — preserved for recovery; potentially superseded, **do not replay blindly**.

## Tests and evidence

- Code: node tests/phase0-contract.test.mjs; node tests/project-core.test.cjs; node tests/project-integration.test.mjs; node tests/check-source.mjs; node tests/check-v4.mjs; node tests/check-cinematic-v4.mjs.
- Render evidence: python3 tools/verify-preserved-renders.py (25 art files + 8 media/catalog items).
- Browser QA: tests/character-art-browser.cjs, tests/render-cinematic.cjs, tests/project-browser.cjs, tests/project-import-export-browser.cjs. Requires actual Chromium, WebGL and HTTP server.
- Preserve all git tags and validate any live URL via actual browser/media playback, not deployment dashboard status.

**Known missing exact source**: original git-blame.mp4 is not verified in GitHub. Original NMXWZ binary and source-report attachment are not included as original binaries; recovered text is included. Nothing in the handoff proves final reference parity.
