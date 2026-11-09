# FrameForge Hybrid — P12 independently verified continuation, 2026-11-03

## Exact latest state — READ THIS FIRST

- Repository: `Dileepreddy93/frameforge-studio`
- Branch: `feature/hybrid-foundation`
- **Last independently verified SOFTWARE code commit: `d1ce0e940771081df162b620493b1745d76f4647`.** This handoff is a docs-only commit on top. Refresh actual GitHub HEAD before editing.
- **All 7/7 source/quality jobs PASSED, after targeted rerun**: https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41575538540
- **35.584-second native full 1080×1920 Windows Chrome H264/AAC film PASSED**: https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41575538492
- Full-film artifact: Actions artifact `13204275187` named `frameforge-p7-windows-snow-lantern-30-60-second-movie`. Contains original MP4, `independent-delivery-report.json`, `actual-export-performance.json`, `verification.json`, `authored-lantern-spatial-proof.json`, `reach-lift-seam-proof.json`, `world-sign-per-shot-proof.json`, PNG screenshots, and imported V2 project JSON.
- **Isolated SSO-protected staging READY**: Vercel project `frameforge-hybrid-beta` (`prj_NIQffXRaKOy0lR3t6KkzihvB9RPh`), staging deployment `dpl_4K4LoDiiQkmoQt2HmbMqLsGKgTQ1`, exact git SHA `d1ce0e940771081df162b620493b1745d76f4647`, at https://frameforge-hybrid-beta-krm5w7kav-dileepreddys-projects.vercel.app/creator.html . Staging is SSO-protected; deploy READY is not an unauthenticated production/browser signoff.
- `main` and original public V6 deployment `frameforge-v6.vercel.app` **untouched**. No auth, subscription, payment integration, or public launch. Branch GitHub reports `protected:false`: non-force expected-SHA updates have been used, but add official branch protection via GitHub administration when feasible.

## Verified work and important failures

**P12A — complete scenic sign/board lifecycle**
- Source: `8347c943f7e40cfe4a4345b5f2e4b3b8e3e0ba3a`.
- Actual cause: Ember's procedural `buildNature` adds a big sign group with black/dark wooden backing, face, posts and lamp. Previously hiding only the floating screenPlane left it intact.
- Added safe `setScreenVisible/getScreenVisible` through Ember world and adapter; `frameAt` toggles all in-world sign geometry and its light before render. Creator and Windows test reverse seek through eight shot samples: `[false,true,false,true,false,true,false,true]`, only authored inserts show the sign. Retains default screen semantics in other projects and original V6 unchanged.
- [P12A main 7/7 quality](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41572652547) (targeted rerun because original-V6 pixel capture self-noise); [P12A complete film](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41572652569) PASSED, artifact `13202526716`. Real before/after showed snowy sky and trees instead of a dark stage sign in outdoor shots.

**P12B — performer torso lean**
- Source: `8340bbd52e68748f98a8dbad0064de4ac431e8d5`, [7/7 quality](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41574316737).
- Reach and start of lift add deterministic torso bend to procedural character rig. Browser Creator fixture passed a stricter under-8cm wrist proximity test. **Do NOT generalize this as a film grasp**: the independently sampled actual full-length Lantern film still reports reach handle gap **0.184373m** at shot 5. Actor style, world and character placement differ from the small browser fixture.

**P12C — portrait-safe real actor + lantern framing, followed by actual film seam fix**
- `36902f988b4ee4b254a2c9f0dc3dd75453134c6f` blends 36% of the holding actor's head and 64% of the 3D lantern focus in closeups; increases default prop camera distance from 3.8 to 4.6 and author-film lens distances to 5.2/4.9. Visual decoded film frames now show character facial expression *and* lantern rather than cropping eyes/head.
- Initial independent Windows long-film acceptance https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41575196949 **FAILED**, showing a measurable 0.18268m teleport from ground at end of reach to lifted lantern in very first frame. Correctly did not hide or weaken the continuity threshold.
- `d1ce0e940771081df162b620493b1745d76f4647` fixes the jump: authored lift starts fixed at ground, holds for .16s, smoothly interpolates to actual IK wrist over the following .56s; by full attach `gripError=0`. New Creator checks first/last lift phases; full-film acceptance now requires first lift to be grounded, seam-distance less than 4cm, no floor penetration. **Actual full film `reach-lift-seam-proof.json`: seam displacement = 0.000m; attachProgress=0 at first lift frame; initial gripError=0.1826796m**, so no visual teleport and no fake contact before actual grip.
- Full independent final movie 35.584sec, 1,067 decoded frames, 1080×1920 @30fps, H264/AAC 48kHz stereo, 36,249,289 bytes, original local Kokoro English voices, 2 SFX, loudness -14.0614 LUFS, peak -2dB; external decoder full PASS, verified nonblank/nonfrozen frames. 10 original user-editable V2 scenes were **imported** through Creator, not each manually clicked by a novice. Real mobile devices not tested.
- Final film accepted https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41575538492 and code-quality 7/7 https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41575538540.

## Reliability and performance qualifications

- Main quality initial attempt for latest source **6/7**: legacy V6 autosave test intermittently failed “an edit made just before a refresh is kept.” Its dedicated rerun of real-character-render-tests PASSED, including `AUTOSAVE_BROWSER_PASS` (undo/redo, rapid refresh, script draft, crash recovery) and 14-frame `HYBRID_LEGACY_VISUAL_PARITY_PASS`. No V6 source or pixel threshold changed. Track intermittent autosave/renderer test repeatability, and never claim one green rerun proves zero data-loss risk.
- Final Windows 35.6s film test elapsed about **620 seconds**; actual browser video exporter `wallMs=597129`, `renderMs=593131`, `canvasTransferMs=854`, `encodeMs=1401`, `finalizeMs=92`; average 1080p frame render ~555.89ms. Rendering dominates 99% on GitHub Windows software renderer. A single CI run does not prove comparative hardware performance, especially vs previous 496sec/623sec runs.
- Visual quality still **stylized, not photorealistic**. Hero actor shows exaggerated clay/plastic face, weak weight transfer, eye/gaze and hand-contact detail; lantern glass simple box geometry, snow pattern repeats. Most important verified gap is 18.4cm actor hand-to-handle gap in full film reach shot despite closeup and torso lean; a smooth object-position blend later masks discontinuity but is not physically accurate grasp. No human creative blind review or physical iOS/Android/macOS hardware export certification. Do not rate 10/10.

## Next prioritized work (without repeating completed P12A/C)

**P12B.2 (high priority):** Make reach-to-handle contact physically convincing in the **actual 10-shot film configuration**, not just the Creator small demo: log shoulder/target/IK reachable set, choose appropriate actor/prop blocking, solve wrist/hand and visible finger curl and floor grounding, maintain no-snap continuity and matching filmed close-up; require sampled reach gap less than 4cm (or medically/rig-justified reachable threshold) and proof in real full-film stills. Do not change 4cm gate to 20cm or make prop follow ungripped hand immediately. Check arc-length, maximum velocity, shoulder and elbow anatomy in a few frames around cut.
**P13 performance:** instrument 30fps render frame p50/p95/p99, WebGL draw calls/shadow passes vs WebCodecs cost. Benchmark same full film 3+ independent runs on same hardware, including low-end Intel graphics/real Android, and optimize scene draw/material/shadows with actual quality-difference proof. Do NOT degrade 1080p mastered export to make CI appear faster.
**P14 creator UX:** real 10-shot novice manual GUI authoring, direct Android/iOS touch UX, file reload/offline recovery, validation, keyboard accessibility and human testing. Original V6 autosave flake warrants follow-up evidence but source frozen untouched.
**P15 creative signoff:** independent blinded reviewer comparisons and human approvals; character acting/lipsync/eye direction, ambient environment and light interactions. No login/payments until a product decision.

## Continuation contract

On resume, **FIRST** read this file, `CONTINUE_HERE.md`, `docs/HYBRID_VERIFIED_HANDOFF_2026-11-03.md`; query newest GitHub branch HEAD + workflows, inspect actual artifact `13204275187`, don't repeat 7/7 or full film. Continue only on `feature/hybrid-foundation` with expected-SHA non-force pushes, isolate stage project. Incremental commits and tests, independent MP4/frame evidence. No automatic “10/10” or public launch claims.
