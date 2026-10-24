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
User-designated exact-reference file `git-blame.mp4` WAS ACCESSED as mounted `/mnt/data/git-blame.mp4` on 2026-10-24, SHA256 `560ca0dd7fc3b8f0e762dd818423a15e2192029f40383765a5db52b49029247e`, 3,365,415 bytes, 52.181s, 720x1280 30fps, 1564 frames. Direct full decode PASS and 24 native PNG frame hashes recorded in `spec/git-blame-reference.json`. Publisher provenance is unverified; original binary NOT pushed. The file may not remount automatically in every new chat. Do NOT confuse with historical `65469.mp4`.

## Current product gaps
V4 full 41.842s 480x854 H264/AAC movie previously technically verified; NOT artistically reference approved. V5.2 source on develop has actual Three.js rigs, project JSON, some emotion controls and 3s/6s previews. P1 models UNAPPROVED. Arbitrary custom rigs rejected; source currently includes only DEV, BLUE, ORANGE. Hindi/Telugu voice synthesis (distinct from recently merged Unicode text handling), phoneme-level sync, fully authorable 3D creator, 1080x1920 full film and final quality parity are NOT verified.

## Phase0 verification and next tasks
node tests/phase0-nine-phase-contract.mjs
node tests/phase0-contract.test.mjs
node tools/verify-phase0.mjs        # FFmpeg+ffprobe, SHA256, 1254 frames, full decode
node tests/phase0-video-playback.cjs # real Chromium+Playwright local MP4 playback
Review GitHub CI for actual pass/fail, then **update the execution ledger**. Next: review candidate shot-boundary accuracy, voice/word captions, run matched FrameForge-vs-reference review, then P1 art gate. Reference manifest is hash-verified. Never claim release from a passing unit test or button working.

## LATEST MERGED REFERENCE AUDIT
PR #7 merged into develop as 0f66345e654b6834464df26486cbb98a4f4ffca0 with all three CI jobs green (run 40091928524). Actual Git Blame 52.181s target bytes were SHA256-verified: 560ca0dd7fc3b8f0e762dd818423a15e2192029f40383765a5db52b49029247e. Start with spec/git-blame-reference.json, docs/GIT_BLAME_SHOT_MATRIX.csv and docs/GIT_BLAME_REFERENCE_AUDIT.md. Do not restart P0 because older handoffs say reference inaccessible. P0 final quality/runtimes acceptance remains OPEN and P1 artistic close-up gate is still NOT APPROVED.

## P1 latest experiment and integration caution
feature/p1-character-identity-art-revision revises the real DEV Three.js rig's hair, face and clothing, with retained 24-frame Chromium art-evidence artifact. Read docs/releases/P1_CHARACTER_IDENTITY_REVIEW_2026-10-24.md and spec/character-design-lock-v1.json. This is NOT an approved model or production film. Preserve git-blame source reference hash and V5.3 speech handling. Do not merge before screenshot inspection and passing CI. Research candidates in docs/RESEARCH_CANDIDATES_2026-10-24.md.
