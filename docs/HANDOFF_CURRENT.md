# FRAMEFORGE — CURRENT COMPLETE HANDOFF (2026-10-24)

**Purpose: HANDOFF ONLY. No new film code, character code, merge or production deployment is authorized by this document.** Continue the real private FrameForge repository, not a fresh app. This current delta, the preceding 18 KB historical handoff, machine state, research extracts, archived movies and test suite together comprise the recoverable engineering context.

## 1. Mission and user decisions

Deliver a premium, independently owned, reusable cinematic animated-video studio: visually and emotionally as compelling as (ultimately better than) the exact Agent Poly / Claude & Pixel references. Quality is assessed on the ACTUAL PLAYABLE OUTPUT, not source syntax, product marketing or Vercel deployment badges. The developer owns microscopic detail: coherent 3D shapes and silhouette, expressive eyes/pupils/brows/mouths, head/hair, garments, gestures/weight/idle reactions, sets/backgrounds, key/fill/rim, materials, camera blocking, acting/pacing, expressive voices, lip sync, Foley/music, captions/mobile safe-zones, FFmpeg export and tested studio UI. Prioritize free/open source, predictable cost, lawful independent art/code and reversible Git releases. The user has repeatedly authorized practical work with connected GitHub/Vercel tools and requested no repetitive approvals for existing access. Never exaggerate quality or pretend to have examined inaccessible references. Support English, Telugu and Hindi voices eventually; work remains to be done.

Research/quality strategy: exhaustive evidence-driven sources -> project/character identity and first frames -> expressive performance -> cinematic direction -> time-aligned speech and Foley -> deterministic rendering/finishing -> reusable editor -> exact reference comparison and release. Passing code tests is not artistic approval.

## 2. Exact version-control context at latest audit

- Private GitHub repo: https://github.com/Dileepreddy93/frameforge-studio
- ACTIVE experimental branch: feature/v5-expressive-character-portraits
- Latest PRE-HANDOFF application source commit: 8ae00022391ba175f3a23b35f33bf1ab80ab0910 — improves face depth/eyes/mouth/facial hair in index.html and adds tools/refine-portrait-geometry.py. This code was committed but the newly modified appearance has NOT passed fresh artistic inspection or a new approved contact sheet.
- Earlier V5 branch: feature/studio-v5-foundations — separate branch; not the currently active portrait work.
- MAIN stable V3 source: f7b20bd20ebd4bc37db5f2f6dd6f0085a544f04b.
- DEVELOP contains merged V4 via PR #1: 06ec0d77dc3011edf71530295e8c62ad717e1a55.
- Protected restore tags: v3.0-stable, v4.0-rc1, v5.0-phase0, v5.1-phase1b, v5.1-phase1c-artstudies, v5-handoff-2026-10-24. Do not retag/delete old checkpoints.
- Current LIVE PRODUCTION URL (V3; not current experimental V5): https://frameforge-3d-director-preview.vercel.app/ . Do not redeploy to production without full-film visual and technical release acceptance.
- GitHub Actions project-contract workflow was created and a run passed through GitHub connector after an earlier GitHub CLI OAuth workflow-scope failure. Recheck the current branch and workflow statuses before claiming CI on a particular commit.
- Named Vercel sandbox: frameforge-repository-backup (repository path /vercel/frameforge-archive); QA sandbox: frameforge-final-qa-check. Session IDs EXPIRE. Inspect the active workspace/repository and credentials anew; do not assume a historical session ID will be usable.

This handoff's eventual documentation commit/tag adds docs only and must be treated separately from 8ae0002. The new source SHA may therefore point to a documentation commit, but the last actual app-code changes remain 8ae0002.

## 3. Historical completed work with verification

V3: early procedural low-poly studio and film preserved under v3.0-stable, with video and Foley. Failed earlier Replit launch returned 404 even when connector said success — lesson: test actual HTTP/browser artifacts.

V4: completely exported 41.842358-second reviewed film in media/v4-review/frameforge-v4-complete-director-41s.mp4. Native 480 x 854, H.264 30 FPS, 1,254 frames, stereo AAC. Exact SHA-256 7aa90314e91208ad14254b70f2e5b8738c3333544789a46ea167b9e41daf4590. Archived public MP4: https://agz0k9i7nymp3png.public.blob.vercel-storage.com/frameforge/frameforge-v4-complete-director-41s.mp4 . Test evidence: zero FFmpeg decoder warnings, mobile Chromium playback with byte-range response, 14 caption checks, six camera-reaction cuts. Audio previously measured -16.2 LUFS integrated and -0.9 dBFS true peak. These are engineering achievements, not reference-level artistic approval.

V5 Phase 0: auditable source register, NMXWZ/Agent Poly/Claude & Pixel requirements, schema-driven phase gates. v5.0-phase0.

V5 Phase 1A/1B: reusable schema frameforge.project/1 in src/project-core.js; zero-latency and mystery JSON projects, validated source migration, cast/style/voice identity locks, import/edit/export and unknown-rig rejection. Real Chrome and unit tests passed. v5.1-phase1b.

V5 Phase 1C: character-lab.html displays ACTUAL WebGL DEV, BLUE and ORANGE rigs (not generated portraits); four turnaround views and neutral/happy/worried/surprised expressions, 8 frames each, environment first-frame study. Files: assets/v5-art-evidence (24 distinct viewing slots + contact-sheet) and media/v5-evidence (3 sheets + environment). Previously Chromium generated/captured 8 per actor with 7 unique hashes per actor because front neutral appears twice. v5.1-phase1c-artstudies. All material remains UNAPPROVED for art parity.

LATEST: post-1C facial improvements 8ae0002 changed source after the archived sheet images; rerender latest actual rigs before drawing artistic conclusions. Do not label earlier PNGs as visual evidence of 8ae0002.

## 4. Highest-priority research assets / evidence locations

FIRST READ: CONTINUE_HERE.md, docs/HANDOFF_CURRENT.md, docs/HANDOFF_2026-10-24.md, docs/HANDOFF_STATE_LATEST.json, docs/MASTER_IMPLEMENTATION_CHECKLIST.md, docs/DEVELOPMENT_RUNBOOK.md, docs/DECISIONS_AND_FAILURES.md, docs/history/USER_TAKEOVER_2026-10-23.md, AGENTS.md.

Machine truth: spec/reference-register.json, spec/quality-gates.json, docs/IMPLEMENTATION_CONTRACT.md, docs/RENDER_ASSET_CATALOG.json, docs/RENDER_FRAME_SHA256SUMS.txt, docs/releases/V5_PHASE1C_3D_ART_STUDIES.md, docs/releases/V4_VISUAL_REVIEW_2026-10-24.md.

Recovered original source TEXT from an earlier handoff tag:
- docs/history/NMXWZ-1-PDF_EXTRACTED_TEXT.md — 260 lines of the user-supplied five-page NMXWZ production guide.
- docs/history/Studio_Reverse_Engineering_Report_SOURCE.md — 288 lines of earlier uploaded reverse-engineering report.
- docs/history/HANDOFF_ARCHIVE_INDEX_ORIGINAL_2026-10-24.json — historic manifest, NOT current hashes.
- docs/history/wip-expressive-character-portraits/ — older exact WIP patch/script/readme snapshot. Historical, perhaps already incorporated.
These are recovered text or historical snapshots; the ORIGINAL PDF binary, exact source attachments and target reference video are not necessarily stored in GitHub.

External creator sources, with verification limits:
- https://agentpolystudios.com/ — public marketing of emotions/action sets/cameras/styling; private engine NOT read.
- https://promptbase.shop/learn/claude-pixel — publicly described code-based Three.js, timed voices, render and FFmpeg production. No private source copied.
- https://viralspy.app/ — optional social/viral research, do not assert features without verification.
- https://futurist40.gumroad.com/l/starter-pack-15-claude-skills — unaudited/possibly paid.
- https://www.hypedtown.com/ and https://www.canwebuildthis.dev/ — features not independently verified.
- Creative coding examples: https://bruno-simon.com/ ; https://samsy.ninja/ ; https://lusion.co/ ; https://activetheory.net/ ; https://resn.co.nz/ ; https://minhpham.design/ ; https://lucasvallenet.com/ ; https://valentingassend.com/en/ ; https://aristidebenoist.com/ . Inspiring interaction/shader/composition reference, not licenses to clone their work.
- Engineering leads: Three.js/Chromium/FFmpeg primary, HyperFrames only after benchmark, Rhubarb or credible forced alignment for speech, optional AI-video provider without compromising native 3D editing. Provider pricing/license must be checked.

NMXWZ requires four consistent character-sheet viewpoints with >=4 expressions, approved 9:16 scene first frames, consistent voice/style lock, ~8-second shots up to two concise spoken lines, clean footage, actual word timestamps, 1–4-word timed captions, character colors, accent/bounce, face/UI safe zones and professionally mixed audio (example target ~-14 LUFS). AI-generated video remains raster pixels, not manipulable Three.js geometry.

**REFERENCE LIMIT:** Exact user-named git-blame.mp4 bytes and checksum are NOT in the verified repo. Earlier chat material such as 65469.mp4 must not be silently relabeled as Git Blame. The reverse-engineering report contains reported benchmark metrics, which need revalidation with the real binary before asserting reference parity. Ask for media only if it is not actually obtainable from existing accessible sources.

## 5. Current phase/unfinished blockers

P0 engineering source/history archive substantially established, but exact reference binary and reproducible clean environment not fully verified.
P1 JSON project model and character art studies implemented and QA'd technically. **P1 ARTISTIC ACCEPTANCE NOT PASSED.** Original cohesive models, head/face/hair/costume/lighting design, multiview approval and shot first-frame sign-off remain open.
P2 facial/body acting pose system, convincing micro-expressions and true visemes: incomplete.
P3 detailed environments, lighting, staging, coherent story-directed blocking: incomplete.
P4 distinct emotional multilingual voice tracks, word/phoneme timings, Foley/music and readable word-group mobile captions: incomplete.
P5 native 1080x1920 30 FPS deterministic reliable export, full cross-platform and listening tests: incomplete (V4 film only 480x854).
P6 complete editable studio save/reopen, project assets, timeline, undo, queues, reliable second episode: incomplete.
P7 exact reference-quality side-by-side, stable production release and commercial quality gates: incomplete.

These statuses are not a promise that an unchecked task is secretly finished. Never flip them based solely on code compiling or a screenshot.

## 6. Current WIP versus historical archived patch

At the most recent working tree audit, tracked source was CLEAN at 8ae0002; there was one untracked media/frameforge-v4-complete-director-41s.mp4. Its matching verified file is ALREADY tracked at media/v4-review/frameforge-v4-complete-director-41s.mp4; do not duplicate it.
Older docs/history/PENDING_APP_CHANGES_2026-10-24.patch and docs/history/PENDING_FACE_REFINEMENT_SCRIPT.py.txt describe previously uncommitted historical edits. docs/history/wip-expressive-character-portraits/ is another archived WIP snapshot. They may conflict with current committed code. Reconcile by diff; NEVER blindly replay them, and NEVER call them presently uncommitted without checking.
No new character-code modifications are part of THIS handoff push.

## 7. Practical successor instructions

1. Clone or open the PRIVATE GitHub repository using authenticated GitHub plugin/gh connector. Fetch before resolving branch refs.
2. Start from current feature/v5-expressive-character-portraits at the branch head (which may now contain documentation commits). Preserve main, develop and all tags. Verify upstream and untracked state.
3. Read all named docs and extracted reference texts; inspect actual image/video evidence; run hashes.
4. Re-render 8 actual character-rig images for each actor + scene first frame from the newest SOURCE 8ae0002 (or later actual code) and compare with archived art using identical lighting and camera. Do not confuse earlier sheets with newest geometry.
5. Grade independently: profile silhouette, eye placement/blink/brows, mouth/expression readability, attached-mesh seams, hair and costumes, materials/key-fill-rim, set depth, composition and real performance. Document defects, fix in source, render again, keep versioned hashes.
6. Only after character sheets and first-frame style APPROVAL proceed to pose/acting library, phoneme-aligned speech, cinematic story/environment, sound/caption finishing, native-quality 1080x1920 films, reusable second episode, release.
7. Each phase: code tests + browser + actual movie/audio evidence + clear artistic review + commit/tag. Do not deploy V5 production or declare parity prematurely. Keep project work within present action/session, never promise background tasks.

Existing tests: node tests/phase0-contract.test.mjs; node tests/project-core.test.cjs; node tests/project-integration.test.mjs; node tests/check-source.mjs; node tests/check-v4.mjs; node tests/check-cinematic-v4.mjs. Additional Playwright entrypoints tests/character-art-browser.cjs, tests/project-browser.cjs, tests/project-import-export-browser.cjs, tests/render-cinematic.cjs. Browser needs served HTTP + Chromium/WebGL; absent system libraries are environmental errors, not confirmed app failures. Existing render verification: python3 tools/verify-preserved-renders.py.

**Absolute task boundary in this turn: PUSH THE FULL HANDOFF ONLY. No development, no new film, no render request or deploy, no code edits.**

## 8. Definition of "complete handoff"

All relevant currently available repository files, known source links, archived decisions, render evidence, test results, release history, current verified app-code head, remaining work and source-identity gaps are linked from this handoff. It is impossible to guarantee capture of every truncated past chat utterance or inaccessible original media file; those explicit exceptions must not be lied about. Future work can resume without the user re-explaining the project.

