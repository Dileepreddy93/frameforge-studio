# FrameForge — continue here (updated 2026-10-24)
Existing PRIVATE GitHub repo: https://github.com/Dileepreddy93/frameforge-studio. **Do not recreate or rewrite.**

## Read in this order
1. docs/IMPLEMENTATION_PLAN_P0_P8.md — accepted nine-phase source of truth (P0 through P8; special P5 caption phase).
2. docs/EXECUTION_LEDGER.md — per-step state, exact evidence, true gaps and required updates.
3. docs/REFERENCE_RESEARCH_REGISTER.md, docs/REFERENCE_SHOT_MATRIX.csv, docs/VISUAL_QUALITY_RUBRIC.md, docs/TOOLCHAIN_REPRODUCIBILITY.md.
4. spec/implementation-plan-v2.json (nine-phase status). spec/quality-gates.json is the **historical eight-phase** schema; do not conflate numbering.
5. docs/HANDOFF_CURRENT.md, docs/HANDOFF_2026-10-24.md, docs/history/USER_TAKEOVER_2026-10-23.md, docs/MASTER_IMPLEMENTATION_CHECKLIST.md — preserved older handoffs with some superseded branch/phase claims.
6. docs/history/NMXWZ-1-PDF_EXTRACTED_TEXT.md; docs/history/Studio_Reverse_Engineering_Report_SOURCE.md, preserved sources.

## Safe branches
main: V3 `f7b20bd20ebd4bc37db5f2f6dd6f0085a544f04b`, preserved production.
develop baseline at this effort: `79bac8a80b67b37f4462215fb1df818b8b7bc202` (merged V4 and V5.2).
chore/p0-evidence-nine-phase-plan: acceptance plan, QA/evidence tests, no new film art.
feature/v5-3-audio-guided-performance: separate experimental PR #4, not merged into this effort.
Tags v3.0-stable and v4.0-rc1 preserved; no force pushes. V3 live URL https://frameforge-3d-director-preview.vercel.app/ is not newest V5 source.

## Reference video
EXACT user file named git-blame.mp4 exists in ChatGPT Library at /video Analysis/git-blame.mp4 (metadata 3,365,415 bytes). Raw-byte materialization returned no artifact in this execution, so no new SHA256, frame measurement or video binary has been ingested into GitHub. Older 65469.mp4 is a DIFFERENT UNPROVEN comparison candidate. Do not label any reference verified without hashing actual source bytes. Don't redistribute original reference without rights.

## Current product gaps
V4 full 41.842s 480x854 H264/AAC movie previously technically verified; NOT artistically reference approved. V5.2 source on develop has actual Three.js rigs, project JSON, some emotion controls and 3s/6s previews. P1 models UNAPPROVED. Arbitrary custom rigs rejected; source currently includes only DEV, BLUE, ORANGE. Hindi/Telugu production voices, phoneme-level sync, fully authorable 3D creator, 1080x1920 full film and final quality parity are NOT verified.

## Phase0 verification and next tasks
node tests/phase0-nine-phase-contract.mjs
node tests/phase0-contract.test.mjs
node tools/verify-phase0.mjs        # FFmpeg+ffprobe, SHA256, 1254 frames, full decode
node tests/phase0-video-playback.cjs # real Chromium+Playwright local MP4 playback
Review GitHub CI for actual pass/fail, then **update the execution ledger**. Next close exact reference hash/timecoded matrix, then P1 static art and performance quality gate. Never claim release from a passing unit test or button working.
