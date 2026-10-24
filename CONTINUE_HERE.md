# FrameForge — continue here (updated 2026-10-24)
Existing PRIVATE GitHub repo: https://github.com/Dileepreddy93/frameforge-studio. **Do not recreate or rewrite.**

## Read in this order
1. docs/IMPLEMENTATION_PLAN_P0_P8.md — accepted nine-phase source of truth (P0 through P8; special P5 caption phase).
2. docs/EXECUTION_LEDGER.md — per-step state, exact evidence, true gaps and required updates.
3. docs/REFERENCE_RESEARCH_REGISTER.md, docs/REFERENCE_SHOT_MATRIX.csv, docs/VISUAL_QUALITY_RUBRIC.md, docs/TOOLCHAIN_REPRODUCIBILITY.md.
4. spec/implementation-plan-v2.json (nine-phase status). spec/quality-gates.json is the **historical eight-phase** schema; do not conflate numbering.
5. docs/HANDOFF_CURRENT.md, docs/HANDOFF_2026-10-24.md, docs/history/USER_TAKEOVER_2026-10-23.md, docs/MASTER_IMPLEMENTATION_CHECKLIST.md — preserved older handoffs with some superseded branch/phase claims.
6. docs/history/NMXWZ-1-PDF_EXTRACTED_TEXT.md; docs/history/Studio_Reverse_Engineering_Report_SOURCE.md, preserved sources.

## Current merged state — verified October 24, 2026
- **Canonical implementation branch:** `develop` (Phase 0 PR #5 successfully merged, commit `8204aa36c898b24bea29e29c4fbe94b4082756e4`).
- `main` still protects V3 at `f7b20bd20ebd4bc37db5f2f6dd6f0085a544f04b`.
- V5.3 experimental Unicode Telugu/Hindi **text** mapping and approximate audio-guided mouth controls were already merged into develop via PR #4. This is not multilingual production voice synthesis and not true forced-phoneme alignment.
- PR #5 source and exact V4 movie/5-frame extraction jobs were successful; see [verified code/evidence run](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/40090426377). The post-merge CI run must be checked separately.
- Exact `git-blame.mp4` raw bytes remain unavailable to current tools despite existing Library metadata. This alone prevents Phase 0 reference-audit exit. Current Phase 0 engineering work has been merged, but **Phase 0 is not closed**.
- Resume from the CURRENT `develop` head, not from old `chore/p0-evidence-nine-phase-plan` branch or historical handoff refs.

## Safe branches
main: V3 `f7b20bd20ebd4bc37db5f2f6dd6f0085a544f04b`, preserved production.
develop baseline at this effort: `79bac8a80b67b37f4462215fb1df818b8b7bc202` (merged V4 and V5.2).
chore/p0-evidence-nine-phase-plan: acceptance plan, QA/evidence tests, no new film art.
V5.3 speech system: PR #4 merged into develop at 1d4bb48e07613fac1aeb8917df9c06011b8b1427; the P0 branch began at older develop 79bac8a, while PR #5 integration tests merge it against the newer develop. Do not discard V5.3 voice/gaze/Unicode changes when merging.
Tags v3.0-stable and v4.0-rc1 preserved; no force pushes. V3 live URL https://frameforge-3d-director-preview.vercel.app/ is not newest V5 source.

## Reference video
EXACT user file named git-blame.mp4 exists in ChatGPT Library at /video Analysis/git-blame.mp4 (metadata 3,365,415 bytes). Raw-byte materialization returned no artifact in this execution, so no new SHA256, frame measurement or video binary has been ingested into GitHub. Older 65469.mp4 is a DIFFERENT UNPROVEN comparison candidate. Do not label any reference verified without hashing actual source bytes. Don't redistribute original reference without rights.

## Current product gaps
V4 full 41.842s 480x854 H264/AAC movie previously technically verified; NOT artistically reference approved. V5.2 source on develop has actual Three.js rigs, project JSON, some emotion controls and 3s/6s previews. P1 models UNAPPROVED. Arbitrary custom rigs rejected; source currently includes only DEV, BLUE, ORANGE. Hindi/Telugu voice synthesis (distinct from recently merged Unicode text handling), phoneme-level sync, fully authorable 3D creator, 1080x1920 full film and final quality parity are NOT verified.

## Phase0 verification and next tasks
node tests/phase0-nine-phase-contract.mjs
node tests/phase0-contract.test.mjs
node tools/verify-phase0.mjs        # FFmpeg+ffprobe, SHA256, 1254 frames, full decode
node tests/phase0-video-playback.cjs # real Chromium+Playwright local MP4 playback
Review GitHub CI for actual pass/fail, then **update the execution ledger**. Next close exact reference hash/timecoded matrix, then P1 static art and performance quality gate. Never claim release from a passing unit test or button working.
