# FRAMEFORGE STUDIO — COMPLETE HANDOFF FOR A NEW CONVERSATION

**Handoff version:** 2026-10-24, current project state through 13:09 IST.  
**Purpose:** A single, copyable, comprehensive continuation artifact. This is a **documentation-only handoff**, not an authorization to rework or deploy the studio now.  
**Important truthfulness note:** This package preserves all project context, design decisions and source artifacts *available in the connected repository and conversation summaries*. It is not a verbatim export of every historical private ChatGPT message or inaccessible purchased/ref video. Those gaps are called out instead of being silently invented.

## THE FIRST MESSAGE FOR THE NEW CONVERSATION

> Resume the existing FrameForge Studio project. Do **not** start from scratch or re-ask permissions already granted. First read this entire file, including its appended engineering handoff, master checklist and runbook. Read linked user-source extracts, reference/evidence manifests and archived videos. Compare current remote branch heads with the snapshot recorded here. Protect main, develop, v3.0-stable, v4.0-rc1, v5.0-phase0, v5.1-phase1b, v5.1-phase1c-artstudies, and the V5 handoff tag. The current film does NOT meet the artistic reference target. Latest V5 character work is experimental and not artistically approved. Before coding, identify the exact last tested code state, examine any uncommitted changes and recover media evidence. Continue the incomplete Phase 1 art/performance work only when requested. Build, render, *look and listen*, test, commit and tag phase checkpoints. A passing test or deployment alone is not cinematic quality. Do not claim inaccessible reference videos were viewed.

## A. Mandatory starting locations and current branch topology

- **Private repository:** https://github.com/Dileepreddy93/frameforge-studio
- **Canonical handoff branch:** [feature/studio-v5-foundations](https://github.com/Dileepreddy93/frameforge-studio/tree/feature/studio-v5-foundations), last known head **c0b8b8e** before this documentation-only update. This branch includes the historical extracted user-source reports, archive manifest, references, actual V4/V5 output media and handoff material.
- **Latest code experiment branch:** [feature/v5-expressive-character-portraits](https://github.com/Dileepreddy93/frameforge-studio/tree/feature/v5-expressive-character-portraits), last verified head **8ae0002**. IMPORTANT: this is *not* identical to the canonical handoff branch. It includes more recent human/robot face geometry and character-lab work. It is not production-ready or art-approved.
- **develop:** **06ec0d7**, merged V4. Note: a local \`develop\` branch in a sandbox may be stale; inspect **origin/develop**, never infer it from local names.
- **main (default, stable V3):** **f7b20bd**. DO NOT merge experimental material here without accepted full-film QA.
- **Frozen restore tags:** \`v3.0-stable\`, \`v4.0-rc1\`, \`v5.0-phase0\`, \`v5.1-phase1b\`, \`v5.1-phase1c-artstudies\` and \`v5-handoff-2026-10-24\`.
- **Vercel live V3:** https://frameforge-3d-director-preview.vercel.app/ — do NOT mislabel as V4/V5. Production was not changed by the handoff.
- **Vercel connected cloud workspace metadata:** named sandbox \`frameforge-repository-backup\`, QA sandbox \`frameforge-final-qa-check\`, Vercel project \`prj_Jpuh8Hl2FgA78PwWVwCLiB6B9oRP\`, team \`team_0tNIYDBww6gVqvxRn4sRA576\`. Discover/resume the named sandbox and obtain a *fresh* session ID, since previous session IDs expire. No credentials are contained in this file.

### CRITICAL latest working-tree warning (as last inspected)

The recovered \`/vercel/frameforge-archive\` workspace was checked out on \`feature/v5-expressive-character-portraits\` with HEAD \`8ae0002\`. The only untracked path observed there was \`media/frameforge-v4-complete-director-41s.mp4\` (a local V4 copy), **not committed**. Do not delete it before confirming its hash and archival equivalent. The canonical feature/studio-v5-foundations branch contains the separate, checksummed \`media/v4-review/\` archive. Prior handoff-era uncommitted source changes are preserved as historical patches; they may already have been overtaken by subsequent experimental commits—review diffs before reapplying anything.

The experimental branch has seven commits ahead of the canonical handoff baseline, including the original WIP face refinements (2ce223b), handoff/archive notes (462fdb6 and later), contact-sheet wait correction (22a4e02) and latest face-depth, eye, mouth and facial-hair corrections (8ae0002). **These specific later geometry changes require renewed browser render inspection; do not declare Phase 1 art passed from their existence.**

## B. Assets and complete source recovery index

Read in this order:
1. \`CONTINUE_HERE.md\` — one-screen entry point.
2. **This file** — all accessible conversation decisions and consolidated checklists.
3. \`docs/HANDOFF_2026-10-24.md\` — original engineering handoff written from the long project.
4. \`docs/HANDOFF_ARCHIVE_INDEX.json\` — SHA-256/size manifest of **49 archived files** on the canonical branch (not \`docs/HANDOFF_STATE_2026-10-24.json\`, which is present only on the later experimental branch).
5. \`docs/MASTER_IMPLEMENTATION_CHECKLIST.md\` — P0–P7 task-level artistic and engineering gates.
6. \`spec/reference-register.json\` and \`spec/quality-gates.json\` — source confidence levels and code-readable incomplete statuses.
7. \`docs/RENDER_ASSET_CATALOG.json\`, \`docs/RENDER_FRAME_SHA256SUMS.txt\`, \`docs/SHA256SUMS.txt\` — archived output evidence and integrity checks.
8. \`docs/history/NMXWZ-1-PDF_EXTRACTED_TEXT.md\` — extracted text of all five pages of user-given PDF. **Not the original PDF image/layout.**
9. \`docs/history/Studio_Reverse_Engineering_Report_SOURCE.md\` — user-provided research report archived with its claims and caveats.
10. \`docs/history/USER_TAKEOVER_2026-10-23.md\` — project intention and constraints.
11. \`docs/DECISIONS_AND_FAILURES.md\` — prior failures and how not to repeat them.
12. \`docs/DEVELOPMENT_RUNBOOK.md\`, \`docs/PROJECT_FORMAT.md\`, \`docs/IMPLEMENTATION_CONTRACT.md\`, \`docs/releases/\` — technical execution and release evidence.
13. \`AGENTS.md\` — existing project-specific work guidance (canonical branch).
14. \`assets/v5-art-evidence/\` — 24 individual first-party rig-render frames and a contact-sheet comparison; **not original vendor footage**.
15. \`media/v5-evidence/\` — actual first-party character turnarounds/expressions and environment previews.
16. \`media/v4-review/\` — archived V4 full movie and shorter tests / stills. Avoid copying binaries unnecessarily; rely on hashes.

### What is not actually recovered
- **Exact original \`git-blame.mp4\` bytes:** not in the repository and previously blocked on direct public fetch. The 52.181-second, 720×1280 @30 FPS measurement is from the supplied report, NOT independently verified on exact bytes in the last session.
- \`65469.mp4\` was used as an *unconfirmed* comparison candidate in some earlier reviews. Do not conflate it with \`git-blame.mp4\`.
- Original uploaded \`NMXWZ-1.pdf\` binary and its visual layout are *not* in the repository; its extracted text is preserved. Exact original \`Studio_Reverse_Engineering_Report.md\` text is archived as a Markdown source snapshot.
- Paid Agent Poly/Claude & Pixel private engine, models and assets have not been accessed and must not be copied or misrepresented.
- Full raw ChatGPT transcript, invisible tool sessions, and encrypted connected secrets cannot be guaranteed by a repository document. All recoverable decisions and artifacts have corresponding paths listed above.

## C. Source/reference URLs and integration principles

- https://agentpolystudios.com/ — benchmark character styling, published emotions/actions/cameras/customization; public marketing and pages, not verified proprietary code.
- https://promptbase.shop/learn/claude-pixel — benchmark for stylized original code-rendered characters, timed speech, Three.js/Chromium/FFmpeg, camera beats, expressive visual comedy and dialogue.
- https://viralspy.app/ — optional content/hook research, **not** a validated/required video renderer.
- https://futurist40.gumroad.com/l/starter-pack-15-claude-skills — unaudited/possibly paid; no required installation.
- https://www.hypedtown.com/ — limited verified access; no assumed product features.
- https://www.canwebuildthis.dev/ — limited verified access; no assumed product features.
- Previously mentioned inspiration: bruno-simon.com, samsy.ninja, lusion.co, activetheory.net, resn.co.nz, minhpham.design, lucasvallenet.com, valentingassend.com/en and aristidebenoist.com. Inspiration for 3D art direction/interactivity, not license to clone.
- NMXWZ video production guide: 16:9 front/3/4/side/back character identity sheets + 4 expressive faces, 9:16 environment and first-frame preapproval, short ~8s image-to-video clips with style/voice locks, clean footage, FFmpeg finishing, 1–4 word highlighted captions with face-aware safe areas, reference suggests ~−14 LUFS. **Optional image-to-video tools can be paid** and return 2D pixels, not editable 3D rigs. Our owned deterministic Three.js engine remains primary; evaluate alternative renderers empirically, not by hype.
- Free/open-source preference applies to voices, asset/rig techniques, testing and rendering. Telugu/English/Hindi voice support remains future unmet requirement. Verify voice/model licenses, resource needs and output rather than assuming anything is free.

## D. Actual releases, proofs and limitations

- **V3 baseline**: stable single-page Three.js studio, 14-shot comedy "Zero Latency", DEV/BLUE/ORANGE, Kokoro English voice track and many Foley cues, shot/camera timeline and WebCodecs browser export. Verified earlier full V3 film 41.8s, 480×854, 30 FPS, stereo AAC. Production URL above. Not artistically reference-level.
- **V4 full film:** [verified 41.84-second director-cut MP4](https://agz0k9i7nymp3png.public.blob.vercel-storage.com/frameforge/frameforge-v4-complete-director-41s.mp4), SHA-256 \`7aa90314e91208ad14254b70f2e5b8738c3333544789a46ea167b9e41daf4590\`, 1254 H.264 frames @30fps, 480×854, stereo 44.1kHz AAC; integrated −16.2 LUFS, true peak −0.9 dBFS. Browser-run, FFmpeg decode and HTTP-public copy hash tests previously passed. THIS IS NOT final artistic parity.
- V4 improved rounded meshes, speaker-aware expressive screens, shot-level close-ups/reactions, story-meaningful 0ms and 0-users screens, six verified listener cuts, audio-aligned segment export. Remaining defects: unnatural human mouth and brows; repeated digital robot expressions; stiff weight shift, limited arms/hands; crowded orange at final frame; thin environment depth, missing phoneme aligned lip-sync and native high resolution. See docs/releases/V4_VISUAL_REVIEW_2026-10-24.md.
- **V5 Phase 0:** source/evidence registry and quality-contract testing; tag v5.0-phase0.
- **V5 Phase 1A/1B:** reusable structured JSON project \`frameforge.project/1\`, with validated character/style/voice identity contracts, \`projects/zero-latency.frameforge.json\` voiced 14 shots, \`projects/mountain-mystery.frameforge.json\` storyboard 6 shots. Browser import/edit/download works for registered 3 rigs, and malformed/cross-reference IDs fail. A user can write a new scene file, but advanced timeline, save/reopen/undo and custom rig export remain unfinished. v5.1-phase1b.
- **V5 Phase 1C:** \`character-lab.html\` uses the actual Three.js actors, not detached generated portraits. 3 actors × (front, 3/4, side, back + neutral, happy, worried, surprised). Art QA used Playwright Chromium with actual WebGL, 24 individual frames, 3 per-character sheets and environment. This is a **technical art-study checkpoint only** (v5.1-phase1c-artstudies). Original character-sheet style, expressions, multi-angle model quality and final first-frame approval still FAIL or remain open; inspect actual artifacts and latest experimental code before declaring progress.

### Authentic runbook/tests (as existing source supports)
\`\`\`bash
git status --short
git branch -avv
git log -8 --oneline
git tag --list

node tests/phase0-contract.test.mjs
node tests/project-core.test.cjs
node tests/project-integration.test.mjs
node tests/check-source.mjs
node tests/check-v4.mjs
node tests/check-cinematic-v4.mjs
# Browser QA requires a running HTTP server and Playwright Chromium:
# FRAMEFORGE_URL=http://127.0.0.1:8959/ node tests/project-browser.cjs
# FRAMEFORGE_URL=http://127.0.0.1:8959/ node tests/project-import-export-browser.cjs
# FRAMEFORGE_URL=http://127.0.0.1:8959/ node tests/character-art-browser.cjs dev
# Repeat character-art-browser.cjs for blue and orange.
# FRAMEFORGE_BASE_URL=http://127.0.0.1:8959/ node tests/render-cinematic.cjs
\`\`\`
Tests must be re-run against **the exact branch and files being promoted**, not solely earlier builds. A browser frame test is not a substitute for complete audiovisual artistic QA.

## E. Required recovery and privacy workflow

1. Read all linked docs and current Git branch heads. Compare \`feature/studio-v5-foundations\` with \`feature/v5-expressive-character-portraits\`; do **not** auto-merge or revert.
2. In connected Vercel sandbox, inspect \`git status\`, current branch and untracked V4 copy. Preserve any unique uncommitted media before changing branches.
3. Verify \`docs/HANDOFF_ARCHIVE_INDEX.json\` and relevant individual SHA-256 file lists against archived outputs. For source PDFs/text, keep distinction between raw document and extraction.
4. Inspect the latest experimental code and render it before integrating; last experimental face geometry commit 8ae0002 has not automatically obtained artistic acceptance.
5. Do not restart project, overwrite stable source, delete archive or deploy to live Vercel as part of *receiving context*.
6. Subsequent coding should happen **only when user asks to continue development**, by producing finished reviewable movie/assets, QA results and tagged commits. During *this handoff task*, push documentation only.
7. Never expose account credentials or private messages in public. GitHub repository is private, while V4 video links are public.
8. Avoid promising indefinite background work: each user-directed phase needs concrete synchronous evidence, and partial completion must be identified honestly.

## F. Direct owner intent at this moment

The latest message explicitly corrects the assistant: **"i just asked you to push the 100% hand off only".** This step must create and push a full transfer-of-context package, not keep developing art, not deploy and not ask another approval. Provide the link and a concise confirmation. The larger artistic project resumes in the *next conversation* after its agent reads these files.

---

# APPENDIX 1 — EARLIER COMPLETE ENGINEERING HANDOFF (PRESERVED VERBATIM)

# FrameForge Studio — Comprehensive engineering handoff (2026-10-24)

## A. Charter: user's actual non-negotiable goal
Build an **independently controlled, highly polished code-driven 3D cinematic animation production studio** that produces short original stylized comedy/action films at least as compelling as the user's supplied Agent Poly / Claude & Pixel reference quality, eventually better. The output video and production usability—not screenshots of UI, a WebGL cube or a successful deployment badge—are the acceptance criteria. The user expects independent judgment about overlooked microscopic details: characters, eyes, brows, hair, mouth, clothing, lighting, sets, camera, acting, story, voice, sound effects, export, color, captions, mobile, quality and long-term reusability.

User constraints: Prefer FREE/Open Source and ownable pipeline; minimize paid dependencies; no forcing Blender or paid image-to-video provider when 3D code can solve the task; no fake claims, no guessing about tests; real render QA; leave stable checkpoints intact; production-quality polish, end-to-end functionality, mobile-playable previews, Telugu/English/Hindi voice support as a future requirement; save recoverable GitHub commits and do not ask for permissions already granted in a connected provider. Each major phase needs code, validation, actual visible/audible evidence, commit, and honest remaining defects. Never copy proprietary reference engine code. No jailbreaks or hallucinations can replace engineering.

## B. Source of truth — verified exact repository status
- Private repository: https://github.com/Dileepreddy93/frameforge-studio
- MAIN (stable V3 source): f7b20bd; GITHUB default main. NOT promoted to V4 or V5.
- DEVELOP (merged V4 code): 06ec0d7; PR #1 merged V4 into develop without production change.
- V4 feature branch: feature/cinematic-v4-facial-performance (later QA/doc commits).
- Previous foundations branch: feature/studio-v5-foundations. Actual active experimental branch at handoff is feature/v5-expressive-character-portraits. The branches pointed to the same source HEAD bd2c625 at audit. At inventory time, pre-handoff HEAD was bd2c625 (character-sheet download rendering reliability). Future handoff commit advances this hash. Always inspect live HEAD.
- Git tags: v3.0-stable (historical recovery), v4.0-rc1 (V4 review candidate), v5.0-phase0 (research contracts), v5.1-phase1b (structured JSON episodes), v5.1-phase1c-artstudies (3D character/contact sheets). Tags are annotated and may point to tag objects; use git rev-parse TAG^{} for peeled commit.
- Local engineering workspace in Vercel named sandbox: /vercel/frameforge-archive (sandbox sessions expire; name frameforge-repository-backup, project prj_Jpuh8Hl2FgA78PwWVwCLiB6B9oRP, team team_0tNIYDBww6gVqvxRn4sRA576). This is environment metadata, not an authentication credential. A separate frameforge-final-qa-check sandbox has supported Chromium rendering. Future chats should discover fresh sessions rather than reusing stale session IDs.
- Connected GitHub access was confirmed and used to push/tag; NEVER print or commit OAuth tokens.
- Current Vercel production URL: https://frameforge-3d-director-preview.vercel.app/ is V3, NOT the V5 branch. Vercel project isn't necessarily linked to GitHub auto deploy; verify before using. Replit TidyShadyBrain had previously returned 404 and is NOT a reliable active public studio.

## C. Implemented history (and current technical level)
### V3 baseline
Working Three.js HTML/JS studio, 14-shot original comedy Zero Latency, three actors DEV, BLUE, ORANGE, 41.8s English Kokoro dialogue, three root OGG assets, Foley/music (~43 cue elements cited in older notes), WebCodecs/Mediabunny browser exporter, basic character and director controls, V3 hosted and repo-preserved MP4. Original V3 was 480x854, 30 FPS, 1254 H.264 frames with stereo AAC. Reference parity not achieved; block-like models, simple faces, acting and staging.
### V4 code/video checkpoint
Redesigned rounded robot shells and human, dual robot facial displays, approximate mouth visemes, six editorial reaction cuts, purposeful eyeline cameras, software telemetry inserts (0ms page; 0 users), speaker-aware gaze, audio-locked segment exports. Full V4 41.842358s H.264 480x854 at 30 FPS with 1254 frames + stereo 44.1kHz AAC, −16.2 LUFS, −0.9 dBFS true peak; no decode warnings; tested mobile Chromium playback and byte-for-byte public SHA-256 equality. Real artistic defects remain: human mouth/brows and gestures, repetitive robot faces, crowded final group composition, low set depth, 480x854 below 720x1280 candidate reference and 1080x1920 target. V4 full file archived under media/v4-review/.
### V5 Phase 0 research contract
The project's required external sources, evidence status and future tests are in spec/reference-register.json. The acceptance phases P0..P7, including non-promotion until full film quality, are in spec/quality-gates.json and docs/IMPLEMENTATION_CONTRACT.md. No claims that one can inspect inaccessible sites or purchased assets.
### V5 Phase 1A/B reusable project model
Source in src/project-core.js, two JSON projects in projects/, browser loads project JSON rather than only embedding hardcoded dialogue, supports local import → edit shot text/speaker/camera → download reusable validated JSON; rejects malformed characters, unknown rigs and false mastered-audio status. V3 dialogue/camera/speakers/timing migrated exactly. 14-scene voiced comedy and six-scene storyboarding mystery. **Mystery is not a voiced complete film.** Full persistent editing, arbitrary user-created 3D rigs and phoneme alignment are not implemented. Tests: project-core, project-browser, project-import-export-browser, render-cinematic.
### V5 Phase 1C CHARACTER LAB (newer than many chat summaries)
The current branch now has character-lab.html linked to actual V5 Three.js scene, not static generated stock portraits. Rigs DEV, BLUE, ORANGE rendered from front/three-quarter/side/back and neutral/happy/worried/surprised, fixed lighting and camera, deterministic capture and reset. Independent 9:16 environment-only frame. Downloadable 1440x1000 studies; real Chromium tests (tests/character-art-browser.cjs), source evidence in docs/releases/V5_PHASE1C_3D_ART_STUDIES.md; later commits improved authored human emotion mouth shapes and pre-rendered contact sheet for slow WebGL. Visual quality and multiview sheets explicitly **NOT ARTISTICALLY APPROVED**. Archived four real PNG examples in media/v5-evidence.
### Current GitHub CI
.github/workflows/project-contract.yml NOW EXISTS on latest branch and includes source tests and cloud Chromium tests for all three rigs on ubuntu-24.04. Earlier credential lacked workflow scope, so the workflow initially failed to push; later a different authorized route added it. Presence ≠ verified green; inspect the latest GitHub Actions run status independently.

## D. Complete architecture/map
- index.html: main real Three.js/WebGL cinematic studio, shot timeline, dialogue, cameras, acting, media, screen inserts, WebCodecs MP4 and QA hooks.
- character-lab.html: real Three.js character sheets and environment first-frame images.
- src/project-core.js: validated shared browser/Node project schema.
- projects/zero-latency.frameforge.json: master-audio comedy.
- projects/mountain-mystery.frameforge.json: six shots, storyboard-only.
- spec/reference-register.json and spec/quality-gates.json: assumptions/evidence, release requirements.
- media/zero-latency-acting-v3-with-foley.mp4; media/zero-latency-stereo-foley-v2.ogg; root dialogue.ogg, dialogue42.ogg, master42.ogg: originals protected in repo.
- media/v4-review and media/v5-evidence: handoff-added verified original development render backups (NOT benchmark videos); JSON and checksums in docs/RENDER_ASSET_CATALOG.json.
- tests/check-source.mjs, check-v4.mjs, check-cinematic-v4.mjs, project-core.test.cjs, project-integration.test.mjs, phase0-contract.test.mjs, project-browser.cjs, project-import-export-browser.cjs, render-cinematic.cjs, character-art-browser.cjs: existing validation.
- upgrade_v4.py, improve_story_v4.py, improve_segment_export.py, polish_human_v4.py, tools/*: historical in-repo transformation and verification scripts. Inspect before reuse; do NOT repeatedly run patches on already patched files.
- docs/releases/*: actual QA and quality-gap records. Treat their measurement claims as historical measured evidence unless rechecked.
- AGENTS.md: engineering guardrails. README.md and docs/RESTORE.md for setup/rollbacks.

## E. Reference quality targets, source caveats
- Agent Poly: https://agentpolystudios.com/ (marketed character customization, 7 emotions, 13 actions, 6 camera views; not privately inspected source; independently authored alternative required).
- Claude & Pixel: https://promptbase.shop/learn/claude-pixel (code-based Three.js/line voices/word timing/chrome/FFmpeg public method; not their private source).
- NMXWZ-1.pdf: all five pages of extracted text are now archived at docs/history/NMXWZ-1-PDF_EXTRACTED_TEXT.md. Raw original PDF image/layout bytes are NOT in Git. Concept: identity-locked multi-view character sheets (front, 3/4, side, back), four expressions, environment 9:16, first-frame approval, ~8-second shots with no more than 2 short spoken lines for AI-video option, consistent style & voice locks, clean frames, word-timed colorful 1-4-word captions, timing/effects, suggested -14 LUFS. Actual model/service may be paid: do not claim unlimited free AI-video.
- Earlier user reverse-engineering report (original full Markdown text now archived in docs/history/Studio_Reverse_Engineering_Report_SOURCE.md) described Git Blame reference ~52.181s, 720x1280, 30 FPS and −14.38 LUFS; claims not directly reverified from exact file. **git-blame.mp4 is NOT in repo**, and Claude & Pixel external video requests encountered HTTP 403 previously. Uploaded 65469.mp4 (41.8 sec, 720x1280) was a DIFFERENT *unconfirmed* PIXEL STORIES candidate; do NOT silently relabel it as Git Blame.
- ViralSpy https://viralspy.app/: optional content research and trend monitoring; no required API.
- 15-skills Gumroad https://futurist40.gumroad.com/l/starter-pack-15-claude-skills: unaudited and optional.
- HypedTown https://www.hypedtown.com/ and Can We Build This https://www.canwebuildthis.dev/: inaccessible/insufficient corroboration earlier; do not invent implementations.
- Relevant interactive design inspirations (NOT proof of our studio quality): https://bruno-simon.com/, https://samsy.ninja/, https://lusion.co/, https://activetheory.net/, https://resn.co.nz/, https://minhpham.design/, https://lucasvallenet.com/, https://valentingassend.com/en/, https://aristidebenoist.com/.
- Optional free tools to benchmark: https://github.com/heygen-com/hyperframes (seekable render pipeline), https://github.com/DanielSWolf/rhubarb-lip-sync (timed mouth-cue extraction), local FFmpeg, Three.js, Playwright Chromium, Kokoro TTS where licensed/supportable; tools are candidates, not installed/integrated simply because listed.
- In paid AI-video mode, generation produces pixels, NOT manipulable source meshes; keep deterministic procedural engine primary. Respect copyright/licensing and user consent.

## F. Concrete acceptance gates and why shortcuts fail
A clean test run proves code correctness for tested cases; it does NOT prove artistic quality. A site returning HTTP 200 does not prove controls work. Successful Vercel deploy does not prove actual MP4 plays. Browser WebGL preview does not equal a professionally rendered film. Synthetic sound or CSS slides cannot stand in for a fully acted episode. Use the checklist file as the exact active task ledger.

Each accepted phase needs all of: source commit, passing static/unit/integration tests, a real rendered visual/audio artifact, measured metadata/CRC/SHA-256, actual artistic inspection where applicable, known remaining defects, and honest exit-gate state. Non-approved P1C art sheets must not set firstFrameStatus='approved' or sheetStatus='approved'. Keep the verified existing film playable after migration and re-run regression whenever character designs, voices or staging change.

## G. Urgent next step
**Do NOT start with another editor redesign or brand-new project.** Open media/v5-evidence DEV/BLUE/ORANGE character sheets and environment, compare them with actual reference frames or quality rubric, identify the highest-impact silhouette/face/lighting/art-direction flaw, and improve **one short scene or close-up** end to end. Make intended emotion read with sound muted, no attached-cube look, and test head/eye/brow/mouth/gesture transitions on real renders. Add/modify automated art QA and compare contact sheets before/after. This is the shortest path from engineering foundation to premium-film quality. When character design is actually approved, proceed with time-aligned voice/visemes, authored body action library and camera/set continuity, then final 1080x1920 film and second real episode.

## H. Explicit unresolved capabilities / permission notes
- Remote GitHub auth must be confirmed in the **new** session. Never store any token. A private repo link may 404 to an unauthenticated browser and is not evidence of deletion.
- GitHub Actions workflow exists; latest CI status may vary. Check before claiming green.
- Vercel CLI/sandbox sessions can expire. Reopen named sandbox using the correct team/project and verify new session ID.
- Real Telugu/Hindi character voices, unlimited free cinematic AI generation, arbitrary customized copyrighted character models, full undo/persistent editor, native 1080x1920 parity, exact Git Blame media acquisition and complete reference parity remain unimplemented or unverified.
- "All work in the conversation" is not automatically portable as a raw chat transcript. This handoff packages meaningful engineering facts and a separately preserved original user-authored takeover brief. A full report Markdown snapshot and the text of all five NMXWZ PDF pages have been captured. For the original PDF's illustrations or exact git-blame.mp4 bytes, query Project Files/attachments; do not guess or fabricate.

## I. Key direct assets
- Verified V3: media/zero-latency-acting-v3-with-foley.mp4 and V3 hosted movie https://agz0k9i7nymp3png.public.blob.vercel-storage.com/frameforge/zero-latency-acting-v3-with-foley.mp4.
- V4 complete: media/v4-review/frameforge-v4-complete-director-41s.mp4, 11,682,636 bytes, SHA-256 7aa90314e91208ad14254b70f2e5b8738c3333544789a46ea167b9e41daf4590, 41.842358sec, H264 480x854 30 FPS 1,254 frames, AAC 44.1kHz stereo. Hosted https://agz0k9i7nymp3png.public.blob.vercel-storage.com/frameforge/frameforge-v4-complete-director-41s.mp4.
- V4 review clips: media/v4-review/v4-first-15sec-preview.mp4 and media/v4-review/v4-cinematic-story-reaction-test-15s.mp4.
- V5 real UNAPPROVED PNGs: media/v5-evidence/dev-character-sheet.png, blue-character-sheet.png, orange-character-sheet.png, environment-first-frame.png.
- All links, byte counts, actual hashes and known expected hashes are in docs/RENDER_ASSET_CATALOG.json. Mirror copies were downloaded in this handoff specifically to avoid relying on ephemeral cloud URLs.

## J. Final handoff-only snapshot of unfinished local work

As of 2026-10-24, the exact checked-out V5 working branch was feature/v5-expressive-character-portraits at original HEAD bd2c625. This is more recent as an active branch name than the historical V5 foundations branch. Both branches pointed to the same code commit before this handoff. New chats must check live remote refs.

This commit preserves pending tracked application changes as docs/history/PENDING_APP_CHANGES_2026-10-24.patch and the untracked tool as docs/history/PENDING_FACE_REFINEMENT_SCRIPT.py.txt. These were NOT committed into application code, not validated by this handoff operation, and must be reviewed on a fresh branch before applying. Original sandbox files may expire.

Original FrameForge art evidence was archived to assets/v5-art-evidence, media/v5-evidence and media/v4-review, with independent SHA-256 hashes in docs/HANDOFF_STATE_2026-10-24.json. These are NOT the copyrighted external reference films. A redundant local copy of the complete V4 film remains omitted from the handoff commit because an identical named file exists in media/v4-review. External PDFs and exact git-blame.mp4 are not stored in the project repository.

No application source, production deployment, research-checklist completion status or existing tag was intentionally changed during the handoff commit. New documentation files include CONTINUE_HERE.md, docs/MASTER_IMPLEMENTATION_CHECKLIST.md, and docs/DEVELOPMENT_RUNBOOK.md. This is not a complete raw conversation export.


## Durable handoff package added 2026-10-24 (documentation/archive-only commit)
The canonical continuation branch now carries a consolidated phase-by-phase checklist and executable restoration/testing instructions. In addition to existing V3 media, it archives 8 original V4/V5 media assets enumerated in docs/RENDER_ASSET_CATALOG.json, plus the 25 direct 3D-render images in assets/v5-art-evidence and their SHA256SUMS file. The actual full V4 video is recoverable without its cloud URL. All binaries were hash-checked at the archival checkpoint.

The latest art lab was already implemented on the repository feature branch before this handoff. This archival commit deliberately does NOT include any concurrent, uncommitted adjustments to index.html, character-lab.html or experimental tool scripts; those are not presumed validated. Any next agent should compare canonical branch with feature/v5-expressive-character-portraits and inspect git status before taking changes.

Do not mistake this archival milestone for a newly rendered reference-quality release. P1 art acceptance remains incomplete; P2–P7 are still unfinished. Exact Git Blame bytes, original source PDFs and private reference studio source are not included unless explicitly acquired later. This evidence restriction is part of the handoff, not an omission to conceal.

## J. Handoff-only final archival extension
- This handoff commit intentionally changes documentation, checksums, and archival evidence only. It is NOT an extra V5 cinematic feature release and does not modify index.html, character-lab.html, Three.js rendering or the deployed website.
- The complete original 2026-10-23 user takeover prompt is in docs/history/USER_TAKEOVER_2026-10-23.md, the full 283-line Studio Reverse Engineering Report is in docs/history/Studio_Reverse_Engineering_Report_SOURCE.md, and text extracted from all five pages of NMXWZ-1.pdf is in docs/history/NMXWZ-1-PDF_EXTRACTED_TEXT.md. These three sources are historical user-supplied records; any claim in them needs current source/code verification.
- An *additional concurrent/uncommitted* development worktree was discovered on feature/v5-expressive-character-portraits. Its unfinished source diff and development helper were preserved read-only under docs/history/wip-expressive-character-portraits/; the 25 frame/contact images were copied to assets/v5-art-evidence. This material is **not reviewed or merged** into the stable V5 feature branch; the original other worktree was left untouched. See WIP README, then inspect branch state freshly in the next chat.
- All first-party V4/V5 archived media are checksum-verified. A manifest with file sizes, SHA-256 and source URLs is docs/RENDER_ASSET_CATALOG.json. A separate docs/HANDOFF_ARCHIVE_INDEX.json enumerates the complete handoff documents, copied WIP evidence and manifests.
- It is NOT possible to guarantee every ephemeral assistant thought, inaccessible link, binary of unrelated chats, or external paid service has been saved. The handoff is meant to preserve every currently retrievable *actionable project fact and first-party asset*, with exact boundaries documented.


### Original text source snapshots and pending design changes

The repo also now includes docs/history/NMXWZ-1-PDF_EXTRACTED_TEXT.md (five-page extracted text, including prompts and page markers) and docs/history/Studio_Reverse_Engineering_Report_SOURCE.md (the original user-uploaded research Markdown). They are historical user-supplied sources, not new verification. The raw PDF file is not included, and the reader should use the user's original project attachment if exact illustrations and layout matter.

Any parallel uncommitted character-model experiments encountered during preservation were saved **only as text patch/script** under docs/history/wip-expressive-character-portraits; these are not merged, not browser-tested and must not be treated as shipped or accepted code. Avoid losing them, but DO NOT apply them without carefully reviewing source diffs, test conditions and visual output.


---

# APPENDIX 2 — MASTER IMPLEMENTATION CHECKLIST (PRESERVED VERBATIM)

# FrameForge Studio — master engineering + artistic acceptance checklist

Snapshot 2026-10-24. This consolidates the earlier conversations, NMXWZ five-page workflow, Claude & Pixel and Agent Poly public references, Studio Reverse Engineering Report and actual project QA. Completion evidence is in spec/quality-gates.json. A source test does NOT mean artistic quality has passed.

## P0 — Research and evidence preservation
- [x] Preserve main stable V3, develop V4, feature V5, and v3.0-stable / v4.0-rc1 / v5.0-phase0 / v5.1-phase1b / v5.1-phase1c-artstudies tags.
- [x] Preserve V3 stable MP4 and audio, full V4 review film, V4 shorts, original V5 character contact sheets and 24 raw 3D PNG test frames.
- [x] Record primary websites, confidence limits, licensing cautions and known failures.
- [x] Record reference-engineering quality requirements, honest phases and restore instructions.
- [ ] Obtain, locally hash and analyze the exact user-named Git Blame reference MP4. Website sample or a differently named upload is NOT equivalent.
- [x] Preserve extracted text of the NMXWZ guide and the original Studio Reverse Engineering Report Markdown inside docs/history. These are historical user-provided documents, not an independent audit.
- [ ] Preserve original PDF bytes and images/layout if available from the user's Project Files; the repo currently contains only extracted text.
- [ ] Make an exact reference shot/action/camera/voice/sound/lighting/typography timing matrix.
- [ ] Freeze exact tool/package/runtime versions and prove a fresh clean-room clone and browser render.

## P1 — Real art direction, reusable characters and scenes
- [x] Versioned JSON format for characters, shots, speakers, camera, timing, voice locks and visual style.
- [x] Zero Latency original 14 scenes and Mystery 6-shot storyboard load, with import/edit/export tests.
- [x] Real Three.js character-lab for DEV, BLUE and ORANGE, four angles plus four emotions each.
- [x] Environment first-frame preview and render-captured PNG evidence (NOT approved artistic assets).
- [ ] Approve an original distinctive show bible: head/body scale, authentic silhouettes, character proportions, material palettes, hair, outfit, props, character identity across shots.
- [ ] Verify same-scale front / three-quarter / side / back and multiple emotion poses against real reference design quality, not simple differences in PNG hash.
- [ ] Fix disconnected body parts, expression inconsistency, unconvincing eyelids/pupils/hair/costume and visible model collisions.
- [ ] Approve character-specific facial rigs capable of sustained dialog close-ups at true mobile viewing size.
- [ ] Approve real 9:16 environment, foreground/midground/background depth, keys/fills/rims, shadow contacts, desk/screen readability and source-specific lighting.
- [ ] Record actual first-frame approvals and asset checksums, rather than marking unreviewed artwork complete.
- [ ] Create a second independent episode without editing engine code, proving real scene data reuse.
- [ ] Enable persistent project edits, undo/redo and reload from disk/browser storage.

## P2 — Performance and animation
- [ ] Distinct character personalities, action library, emotion changes, brow/eyelid/eye direction, gaze locks, asymmetrical microexpression and blinking.
- [ ] Natural gestures: hands, wrists, fingers, shoulders, neck, torso, spine, body weight, balance, breathing, idle and physical anticipation.
- [ ] Emotional staging across setup/escalation/reveal/payoff; reaction, silence, pause, attack, release, follow-through, settling.
- [ ] Rig mouth family tied to actual aligned phoneme or validated word timestamps; do not present V4 volume/text heuristic as genuine lip-sync.
- [ ] Prevent motion snapping, clipping, head/hair/limb intersections, camera-boundary pose resets and synchrony drift.
- [ ] Verify real animated footage of each emotion and body action, not just static expression sheet.

## P3 — Cinematography, sets and continuity
- [ ] Beat-structured storyboarding; hook/setup/escalation/reaction/punchline with every shot recording actor/emotion/camera/motion/lighting/script.
- [ ] Intentional close-up, OTS, two-shot, insert, wide, push/pan, pause and reaction cuts, with consistent eyelines and screen direction.
- [ ] Eyeline-height and composition safety; no head crop, crowded wide shots, body part clipping or important off-screen actors.
- [ ] Layered believable set dressing, displays, keyboard, effects, shadows, lighting gradients and intentional background storytelling.
- [ ] Stable exposure/material/identity and physical continuity through all shots.
- [ ] Silent contact-sheet comparison against actual reference, and verify comprehension even without dialog/captions.

## P4 — Voice, audio, sync and captions
- [ ] Validated free/licensable voice identities for English, Telugu and Hindi with distinct personalities and controlled pronunciation/consistency.
- [ ] Real line-by-line voices, emotional pacing, sample-accurate starts, silences, breaths and aligned word timestamps.
- [ ] Sync mouth/body/camera/caption beats to actual voice data and test audible/visual precision, not just file loudness.
- [ ] Foley and ambience sheet: movement, typing, footsteps, impacts, UI, air/room tone, music and transitions, with ducking.
- [ ] Real listen-through and mix revision: clarity, drama, jokes, music balance, unwanted artifacts, true peak and LUFS for chosen platform.
- [ ] Word-level color-coded 1–4 word captions, punchline animation, stroke/outline, karaoke highlights, readable timing and accurate language support.
- [ ] Dynamic face/screen/prop safe-zone checks on target mobile apps; NMXWZ example top 220/bottom 420 pixels is NOT a universal rule.
- [ ] Preserve independent clean-video, dialog, Foley and captioned masters.

## P5 — Verified native rendering
- [x] V4 pipeline technical evidence: complete 41.842 s MP4, H.264 480x854, 1254 frames at 30 fps, stereo AAC and mobile playback; not native 1080x1920.
- [x] V4 timed 15-second A/V segments and checksum verification.
- [ ] Exact deterministic evaluation under arbitrary seek, paused/reverse scrubbing and offline timeline rendering.
- [ ] Native 1080x1920 @ 30fps (not low-res upscaling) with defensible visual/render cost benchmarking.
- [ ] Test Chrome/FFmpeg vs HyperFrames or alternate exporters before making any switch.
- [ ] Make robust render worker, chunking, retries, progress, timeout, cancellation, resumability and resource safety.
- [ ] Validate entire exported file: frame count, codec, dimensions, audio, LUFS, peaks, decode, AV offsets, duration, byte checksums, actual mobile playback.
- [ ] Inspect every sequence in completed native movie and compare with reference-quality film examples.

## P6 — Real production-ready creator studio
- [ ] Create, edit, undo/redo, save, reopen, rename, duplicate, version, export and restore full projects.
- [ ] True character model customization incl. head/body/face/hair/outfit/lighting/colors/rigged gestures, NOT a separate image-only studio.
- [ ] Reusable asset/preset libraries with stable references, license info, validation, resilient file relinking and clear errors.
- [ ] Scene/timeline editor with dialog, expression, motion, camera, Foley, captions and visual preview all editable.
- [ ] UX usability/responsiveness for mobile and desktop, accessibility, recovery from crashes, import failures and unsupported media.
- [ ] Optional image-to-video provider interface, first-frame consistency + voice locks, provider prices/rate limits/rights audited. No mandatory paid provider.
- [ ] Optional viral/content-intelligence integrations only if actually verified, compliant and worth cost.
- [ ] Second independent episode from the same code and asset library, with no hidden source edits.

## P7 — Reference acceptance, QA and production deployment
- [ ] Make and approve one excellent 5–10 second authentic performance shot.
- [ ] Make and approve an 8–15 second cinematic sequence including synchronized dialog/Foley/camera/captions.
- [ ] Make two complete original polished native-resolution episodes from the reusable system.
- [ ] Compare actual identified source reference to our exported film shot-by-shot for geometry, acting, eye/hair/face/cloth, environments, light, camera, dialog, Foley, music, captions, story, pacing.
- [ ] Real user flow and video/auditory QA with repeated desktop/mobile playback and practical tests.
- [ ] Source licenses, privacy, cost, accessibility, performance, security and reliability checked.
- [ ] Immutable release/source/assets/media manifests, tags, and rollback proof.
- [ ] Independently test isolated public deployment URL and actual MP4, not status-only badges.
- [ ] Promote main/production ONLY after completed-artifact acceptance.

## Working priorities
Do not spend further time rewriting an already tested project parser. The current P1 artistic gate is blocked by character/model/polish deficits, not by missing GitHub permission. User explicitly requests independent judgment and code/render/test commits for later phases. Treat P0 source-evidence uncertainty as open, not forgotten. Do not claim any numerical quality score or benchmark match without direct evidence.


---

# APPENDIX 3 — DEVELOPMENT/RECOVERY RUNBOOK (PRESERVED VERBATIM)

# FrameForge Studio — exact instructions for a new agent/chat

## Source of truth
Private GitHub: https://github.com/Dileepreddy93/frameforge-studio
Start with CONTINUE_HERE.md, docs/HANDOFF_2026-10-24.md, docs/MASTER_IMPLEMENTATION_CHECKLIST.md, docs/DECISIONS_AND_FAILURES.md, spec/quality-gates.json, spec/reference-register.json, docs/releases, docs/RENDER_ASSET_CATALOG.json.
The handoff commit goes on feature/studio-v5-foundations. A parallel feature/v5-expressive-character-portraits exists; at handoff inventory time both were at bd2c625 before the new handoff. Check actual remote HEAD before editing.
Keep main V3, develop V4, v3.0-stable, v4.0-rc1, v5.0-phase0, v5.1-phase1b, v5.1-phase1c-artstudies untouched unless explicitly authorized. Production Vercel is an older V3 site and may not be Git-linked.

## Verify exact current state
    git fetch --all --tags
    git branch -avv
    git status --short
    git log --oneline --decorate -20
    git tag --list | sort
    git switch feature/studio-v5-foundations

Read the relevant notes and preserve unrelated changes. The repo is private, and current tool auth should be checked rather than assumed.

## Runtime and test commands
Node.js 22, Python 3, FFmpeg/ffprobe for video; Playwright 1.56.1 + Chromium for browser QA. Some dependencies are external CDN/audio; offline playback is not fully verified.

    node tests/phase0-contract.test.mjs
    node tests/project-core.test.cjs
    node tests/project-integration.test.mjs
    node tests/check-source.mjs
    node tests/check-v4.mjs
    node tests/check-cinematic-v4.mjs
    node tools/check-gates.mjs
    python3 tools/verify-preserved-renders.py

Serve the directory and validate actual browser behavior:

    python3 -m http.server 8959

Then in another terminal:

    npm install --no-save playwright@1.56.1
    npx playwright install --with-deps chromium
    FRAMEFORGE_URL=http://127.0.0.1:8959/ node tests/project-browser.cjs
    FRAMEFORGE_URL=http://127.0.0.1:8959/ node tests/project-import-export-browser.cjs
    FRAMEFORGE_BASE_URL=http://127.0.0.1:8959/ node tests/render-cinematic.cjs
    FRAMEFORGE_URL=http://127.0.0.1:8959/ node tests/character-art-browser.cjs dev
    FRAMEFORGE_URL=http://127.0.0.1:8959/ node tests/character-art-browser.cjs blue
    FRAMEFORGE_URL=http://127.0.0.1:8959/ node tests/character-art-browser.cjs orange

Browser test timeouts require investigation; never count a pending or timed-out test as a pass. CI workflow .github/workflows/project-contract.yml is not itself evidence that every run passed.

## Recoverable render artifacts
- media/zero-latency-acting-v3-with-foley.mp4: V3 public-era stable movie.
- media/v4-review/frameforge-v4-complete-director-41s.mp4: verified complete V4 candidate, artistically UNAPPROVED.
- media/v4-review: two 15-second V4 clips and comparison JPEG.
- media/v5-evidence: three actor turnarounds and one environment-only first frame.
- assets/v5-art-evidence: 24 PNG real-rig frames (3 actors x 8), plus JPG comparison.
- docs/RENDER_ASSET_CATALOG.json: original V4/V5 public URLs and expected bytes.
- docs/RENDER_FRAME_SHA256SUMS.txt: checksum per actual 3D PNG/JPEG. Verify via tools/verify-preserved-renders.py.
V4 public sample: https://agz0k9i7nymp3png.public.blob.vercel-storage.com/frameforge/frameforge-v4-complete-director-41s.mp4 . This is NOT the latest V5 finished film.

## What is and is not available
- Exact Git Blame reference: NOT stored as verified bytes. Previous report quotes metrics only. Do not claim to have done exhaustive source-frame parity.
- NMXWZ-1.pdf and Studio Reverse Engineering Report originals: user-provided Project/chat assets may need Files connector; the repo contains detailed extracted conclusions, NOT the full original source files.
- Agent Poly paid studio source/pack: NOT acquired or cloned, and licenses prohibit unauthorized redistribution.
- Feature future: real Telugu, English, Hindi voice models, accurate forced alignment, expressive acting, real native HD movie and reference-grade animation are NOT completed.
- Existing project UI imports/exports validated JSON and edits some fields; full production editor/persistent timeline does NOT yet exist.
- Actual previously named Vercel cloud sandboxes may expire; GitHub source and archived binary evidence are the durable state.

## Safe phase development loop
1. Verify the latest branch, docs, source and saved artifacts.
2. Pick a quality defect, formulate exact acceptance and test criteria.
3. Implement on a feature branch; never change main/production or unrelated files.
4. Run source checks and actual Chrome 3D renders; inspect for artistic defects.
5. For media changes, run FFmpeg/ffprobe and listen/watch actual full output.
6. Save representative render proof with SHA256 and update artifact/issue/checklist state.
7. Commit and push tested changes, tag only a real recoverable milestone.
8. Update CONTINUE_HERE.md and handoff at every completed phase.

## Verification before reporting success
Fresh clone, tracked files present, git rev-parse tag consistency, no credentials in docs, all manifest hashes pass, meaningful real browser tests, linked film public HTTP and actual playback for any new deploy. Distinguish V5 engineering milestone from artistic reference parity.

Next action when user says CONTINUE: focus on actual character art/acting, compare V5 real rigs against known reference and fix visible defects; keep unapproved art unchecked. Never simply repeat the handoff plan.


## User research and experimental patch archive
- docs/history/NMXWZ-1-PDF_EXTRACTED_TEXT.md: text of 5-page guide; original page illustrations are NOT preserved.
- docs/history/Studio_Reverse_Engineering_Report_SOURCE.md: previously uploaded detailed research Markdown, containing public-source claims and measurements with stated verification limitations.
- docs/history/wip-expressive-character-portraits/UNCOMMITTED_SOURCE.patch: non-shipped experimental source diffs saved rather than thrown away. Code here has not been accepted or verified for production. Review and re-test before cherry-picking.
