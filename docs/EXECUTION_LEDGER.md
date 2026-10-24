# FrameForge — continuous execution ledger
Update on EVERY changed source, rendered asset or release. The next chat should use this file, not infer status from version labels.

## Baseline / branch isolation — 2026-10-24
Repository: Dileepreddy93/frameforge-studio (private).
Working branch: chore/p0-evidence-nine-phase-plan; ancestor develop @ 79bac8a80b67b37f4462215fb1df818b8b7bc202.
main: f7b20bd20ebd4bc37db5f2f6dd6f0085a544f04b (archived V3). v3.0-stable/v4.0-rc1 refs exist. develop merges V4 and V5.2. Open PR #4 for V5.3 AUDIO-GUIDED speech is separate and NOT automatically included.

## Phase 0 status record
| ID | Changed/evidence paths | Status now | Exit blockers |
| --- | --- | --- | --- |
| P0.1 | Git refs, archived films, non-destructive feature branch | Audited with GitHub read API | Full rollback/cloned clean-room verification pending |
| P0.2 | media/v4-review/frameforge-v4-complete-director-41s.mp4, tools/verify-phase0.mjs, tests/phase0-video-playback.cjs | Historical verified full film; NEW reproducible tests added but need current CI outcomes | Rerun FFmpeg SHA+decode + true browser playback |
| P0.3 | docs/REFERENCE_RESEARCH_REGISTER.md | New research register written | Re-audit and snapshot source facts as available |
| P0.4 | ChatGPT Library /video Analysis/git-blame.mp4 | Identified metadata (3,365,415 bytes) but raw materialization refused; NOT HASHED | Need exact bytes in runnable environment; prohibit confusing with 65469.mp4 |
| P0.5 | docs/REFERENCE_SHOT_MATRIX.csv from projects/zero-latency.frameforge.json | OUR 14-shot timeline documented, not exact reference breakdown | Timecoded target reference matrix unfilled |
| P0.6 | docs/VISUAL_QUALITY_RUBRIC.md | Acceptance rubric + failure examples created, no false scores | Compare actual decoded reference/output frames |
| P0.7 | docs/TOOLCHAIN_REPRODUCIBILITY.md; source workflow updates | Version register + repeatable tests added | Exact runtime and third-party package pinning; clean clone |

Status meanings: IMPLEMENTED = source changed; VERIFIED = actual test evidence; HISTORICAL = source report claimed earlier pass; BLOCKED = dependency unfulfilled; PENDING = not executed; NOT_APPROVED = artistic gate failed or unjudged.

## Current product quality
V4 41.842358s, H.264/AAC, 480x854, 30fps, 1,254 frames, 11,682,636 bytes; archived SHA256 7aa90314e91208ad14254b70f2e5b8738c3333544789a46ea167b9e41daf4590 (historical verification). V5.2 real rig tests/3s,6s preview exist. P1 real artistic sign-off has NOT passed. Only hardcoded DEV/BLUE/ORANGE supported by src/project-core.js; multilingual production voices and 1080x1920 complete movie are not yet proven. New Phase 0 commit deliberately does NOT claim any new high-quality rendered art, voice, character or live Vercel deployment.

## Next engineering steps
1. Confirm workflow runs for this PR SHA, record actual outcomes below.
2. Acquire exact git-blame.mp4 raw bytes; checksum, ffprobe, inspect/annotate shot/audio captions, add frame visual identity evidence.
3. Lock reproducible package/browser/encoder versions and rerun V4 smoke/video.
4. Only then address P1 visual shortcomings in approved images and short performative film before more UI polish or episodes.

## Update template
YYYY-MM-DD | P#.step | branch + commit SHA | changed files | tests with PASS/FAIL evidence | decoded video/audio comparison | artistic approval | unresolved defects | next action.

## CI iteration: 2026-10-24, Phase0 verification
- First PR #5 run 40089620405: source/contract tests PASSED. Browser proof FAILED with Chromium media error code 4 (unsupported source). This was default Playwright **Chromium headless shell**, not Google Chrome with AAC/H264 codec support.
- Corrective code: tests/phase0-video-playback.cjs switches to actual installed Chrome `channel:'chrome'`; CI prints chrome version and reruns. Do not retroactively mark browser test PASS until new run verified.
- Portable FFmpeg V4 film verification from initial run remained in progress at correction time. Track latest CI run/commit, not the old run.
