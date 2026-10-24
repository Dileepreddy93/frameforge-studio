# FrameForge — continuous execution ledger
Update on EVERY changed source, rendered asset or release. The next chat should use this file, not infer status from version labels.

## Baseline / branch isolation — 2026-10-24
Repository: Dileepreddy93/frameforge-studio (private).
Working branch: chore/p0-evidence-nine-phase-plan; ancestor develop @ 79bac8a80b67b37f4462215fb1df818b8b7bc202.
main: f7b20bd20ebd4bc37db5f2f6dd6f0085a544f04b (archived V3). v3.0-stable/v4.0-rc1 refs exist. develop merges V4 and V5.2. PR #4 for V5.3 audio-guided speech, including newer Unicode Telugu/Hindi text parsing, MERGED into develop as 1d4bb48e07613fac1aeb8917df9c06011b8b1427 after this P0 branch was cut. PR #5 tests the combined merge, not necessarily the old source branch by itself.

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

## Latest verified CI: 2026-10-24, commit 942d852
- https://github.com/Dileepreddy93/frameforge-studio/actions/runs/40089784168 — **ALL THREE jobs succeeded**.
- Source + nine-phase contract tests PASS; real Google Chrome V4 playback test PASS; actual 3D Chromium character/browser renders PASS; software FFmpeg frame exporter PASS.
- Frame archive PASS: 41.842358 sec, 1254 frames, 480x854 30/1, H264 video, stereo AAC; 11682636 bytes, SHA256 7aa90314e91208ad14254b70f2e5b8738c3333544789a46ea167b9e41daf4590.
- Reproducible V5 short clip PASS: 90 frames, 3 seconds, 360x640 H264/AAC, SHA256 f481f8ab36512553ee5291a4691b8399ffffdcfa9aae5d10df9f998926d9c827. This remains an art-unapproved preview.
- P0.5 addition: tools/capture_reference.py outputs native-frame PNGs + frame SHA256 + source metadata for review; local smoke test against a 3-sec synthetic test clip produced 3 independent decoded PNG frames successfully. GitHub test against archived V4 five-frame sample PENDING on this commit.
- Distinct Library artifacts: git-blame.mp4 metadata 3,365,415 bytes and 65469.mp4 9,395,815 bytes: **they cannot be byte-identical**. Git Blame still inaccessible for byte verification.

## Parallel branch update / merged code warning
- develop moved from 79bac8a to 1d4bb48 (V5.3 merged) during P0 work. PR #5 is based on older develop and is **mergeable**; GitHub PR CI tests the merged result. Do not replace latest develop with the old P0 branch tree. Use GitHub's normal non-force PR merge to preserve both histories.
- V5.3 handles Unicode Telugu/Hindi text mapping experimentally; it does NOT supply actual high-quality Telugu/Hindi production voice models or validated phoneme alignment. Preserve that distinction for future chats.
- Latest P0 technical evidence extractor commit 461e623: new 5-frame V4 extraction, source SHA, PNG hashes and CI artifact. Workflow run https://github.com/Dileepreddy93/frameforge-studio/actions/runs/40090426377 recorded as source tests+FFmpeg successful, browser character-render still running at this ledger update.

## P0 direct reference audit — 2026-10-24 (THIS SUPERSEDES earlier `git-blame.mp4` blocked status)
- Raw user-designated source actually opened at `/mnt/data/git-blame.mp4` (not downloaded from publisher). Exact SHA256 **560ca0dd7fc3b8f0e762dd818423a15e2192029f40383765a5db52b49029247e**, bytes 3,365,415; FFprobe 52.181 s, H264 720x1280 30 FPS 1,564 video frames; AAC stereo 48000 Hz. Full `ffmpeg -xerror -f null -` decoding PASS.
- FFmpeg loudnorm input -14.38 LUFS, -0.79 dBTP true peak, LRA 4.60. Auditory performance / speech alignment not personally listen-certified.
- Existing `tools/capture_reference.py` decoded 24 native stills and measured per-frame SHA256 in `spec/git-blame-reference.json`. Visually sampled candidate shots and compiled `docs/GIT_BLAME_SHOT_MATRIX.csv`, plus descriptions in `docs/GIT_BLAME_REFERENCE_AUDIT.md`.
- Scene cuts: 26 candidates at FFmpeg `gt(scene,0.22)` resulting in 27 approximate time intervals; manually inspected thumbnail midpoint samples, not frame-perfect edit validation.
- New reference file no longer blocked by missing bytes. Its publisher provenance and redistribution license remain unverified; exact matched-frame comparison with FrameForge output, full listen-through/word alignment and clean-room tool pins remain OPEN. P0 acceptance NOT complete and P1/P8 art gates remain NOT APPROVED.
- Existing PR #5 run 40089784168 (SHA 942d852) ALL THREE jobs PASS. Later 40090426377 succeeded per GitHub. Verify all CI on latest new SHA separately.
- P0 branch and new manifest should be merged by normal PR only; `develop` already contains merged V5.3. Preserve other contributors' commits.
