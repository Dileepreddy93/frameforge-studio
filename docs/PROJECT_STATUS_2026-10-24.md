# FRAMEFORGE — official project status checkpoint
Date: 2026-10-24 (Asia/Kolkata). Canonical development line: `develop`; existing public V3 director at `main` remains unchanged.

## Immutable facts now independently measured
- Exact Git Blame target user file: SHA256 `560ca0dd7fc3b8f0e762dd818423a15e2192029f40383765a5db52b49029247e`, 52.181s, 720×1280, 30fps, ~27 approximate shots. P0 primary reference bytes VERIFIED, but publisher provenance not authenticated.
- Existing owned complete V4 film: 41.842358s, 480×854 at 30fps, 1254 frames, H264/AAC. Old real previews and original DEV/BLUE/ORANGE remain functioning. Technical pass not art parity.
- New real GLB import lab merged by PR #11, tested four CI jobs. Sample CesiumMan CC BY 4.0 only for structural proof, not production actor.
- Ara MakeHuman-based human: own generated 10,587,092 byte GLB, SHA256 `3faf7629bd6f62f70e916d665b4051de35b0b27832e8da3b19b8a4dd93c4be22`, 9 skinned submeshes, 69 bones, 63 imported animation clips, 20 named facial morph types and 48,820 triangles; actual nine-frame Chromium output, rights explained in `assets/rigged-samples/AraAthleticMan.CREDITS.md`. Do NOT call all baked CMU animations CC0.
- PR #12 merged from tested source commit `3d31948881a10b19c68fc00beacd49155739d0d1` (all FOUR CI jobs passed in GitHub Actions run **40098755955**) as merge `9417af09a795cac2fb71f75223510d75932ca68b`. Built-in human loader, real morph sliders, non-destructive geometry controls persisting across animation seeks, reset, corrected face-closeup view. Production V3/main untouched.
- Actual screenshot review found old camera pointed at half-body instead of face, masking expression problems. True portrait visually inspected after correction; model looks better, but not exceptional acting. See `docs/releases/P1_FACE_CLOSEUP_MORPH_QA.md`.

## Progress per phase — do not confuse tests with exit-gate acceptance
| Phase | Engineering already present | Unmet acceptance |
| --- | --- | --- |
| P0 reference evidence | Original target verified and shot research matrix, reproducible V4 video tests | Final word/audio/caption timing + source runtime pinning and detailed matched-frame comparison |
| P1 character art | Real skinned, animatable human GLB import; one-click research actor, 20 actual morph types, direct controls, 4 views/closeup; old robots | **Art direction NOT APPROVED**: no original visually compelling stylized static lineup or consistent bespoke actors |
| P2 character acting | Procedural moods and basic speech envelope; imported humanoid has 63 motion clips | Facial/body coordinated emotionally directed acting, hands/eyelines; speech forced phoneme alignment absent |
| P3 film direction | 14-shot V4 film and editor of speaker/camera/dialogue | Reference-grade contact-sheet readability, continuity, meaningful sets, full camera grammar |
| P4 audio | Existing English Kokoro voice tracks + 43 Foley | Natural multilingual Telugu/Hindi production voices; professional takes, alignment and listening QA |
| P5 captions | Exploratory research incl. NMXWZ workflow and optional JSONCut | Real word timestamps, dynamic emphasis, Unicode shaping and verified mobile-safe clean/captioned masters |
| P6 rendering | Full technical 480×854 film and short deterministic FFmpeg/WebCodecs tests | Native 1080×1920 entire film, constant 30fps, low-memory render/retry/mobile performance benchmark |
| P7 reusable studio | Project-schema JSON, simple shot editor, independent GLB importer | Arbitrary characters attached to episodes, wardrobe/environment library, persistent save/reopen, undo/redo, render queue |
| P8 release certification | Real decode/browser/CI evidence | Exact reference artistic parity and full independent audio/frame signoff, release lock and public acceptance |

**Formal gates approved: 0 of 9; this does NOT mean 0 engineering progress.** No invented engineering completion percentage because phase scopes differ greatly and quality is not yet accepted. Most of the cinematic-production capabilities and artistically competitive output remain to be built.

## Remaining major dependencies in priority order
1. **P1 original actor visual identity** (Issue #13): settle stylized vs semi-realistic art direction, improve face/eyes/hair/clothes and correct lighting; actual 4-angle + emotion renders judged side-by-side to Git Blame. Freeze one compelling static actor, **then** attempt 5–10s muted acting.
2. **Mobile QA access** (Issue #14): Vercel team hobby project Git integration cannot see private repo (`repo_not_found`). A separate file-upload deployment reported READY but included an empty AraAthleticMan.glb SHA1 `da39a3ee...`; Vercel SSO is enabled. Thus NO verified one-click mobile human preview link yet. Grant Vercel GitHub App repository access, then deploy from tested GH branch and verify downloaded SHA at browser runtime. Do not disable auth globally or share broken deployment as success.
3. P1/P2 **actual facial control library and imported-mesh animation on cinematic timeline**: eye contacts, brows/cheeks, viseme cues, arm/body blocking and target-camera shots. Source motion imports alone not a story acting engine.
4. P3–P8 full creative workflow: independently written scene, sound/voices, safe-zone captions, native 1080×1920 render, complete watch/listen acceptance, actual production release.

## What the next chat must do
Read `CONTINUE_HERE.md`, `docs/EXECUTION_LEDGER.md`, this status, `docs/releases/P1_FACE_CLOSEUP_MORPH_QA.md`, `docs/releases/P1_RENDERED_ART_QA_2026-10-24.md`, research issue #9 and specific issue #13. Preserve original model SHA, use latest `develop` and do not revive rejected primitive art PR #8 or assume Vercel URL works. Work on **art-first** changes with actual PNG and film evidence, not another unreviewed UI makeover.

## Additional mobile engineering verification (later 2026-10-24)
PR #15 merged mobile Chromium regression to develop as `2c91e6ff5755dd12107f915063aa4f6869520ff1`. Run 40099817197 four green jobs. Browser emulated 390×844 touch viewport with real imported human/morph and screenshot manifest artifact 12561864724; 0 horizontal overflow; no JS errors; 753ms ready on GitHub runner only. Does not close P1 artistic gate or verify a public mobile deployment. Full phase status and blockers above unchanged.

## P2 THREE-TAKE REVIEW — ENGINEERING PROOF ONLY (2026-10-24)
- Open DRAFT PR #16 https://github.com/Dileepreddy93/frameforge-studio/pull/16, source branch `feature/p2-muted-acting-study`. Do not merge code until film art gate passes. The latest experimental film was encoded in run 40104894497 (all 4 CI jobs GREEN): **5 seconds, 150 real 3D frames, 330×590, 30fps, H264, silent**, SHA256 `8682bc719f289c12ba527edac84e317ad1618384e31eb028e9c8abe494616b88`, artifact ID 12564327492. Full local decode/15-frame visual inspection completed.
- Three real successive experimental films and frame-hash IDs are preserved in `docs/releases/P2_THREE_TAKE_FULL_FILM_QA_2026-10-24.md`. Baseline shoulder/body frame0→46 MAE 2.50/255, take2 33.51, take3 31.58; movement now occurs but the scene remains art-UNAPPROVED (flat navy set, no visible prop or hand action, weak facial performance, wrong art direction).
- **P0–P8 formal exit gates still NOT signed off**; P1 stylized character art (Issue #13), P2 physically motivated multi-shot scene (Issue #17), and mobile Vercel authorization (Issue #14) remain key blockers. Focus on character identity and story-relevant props before more isolated procedural face work. `main`/V3 production unchanged.
