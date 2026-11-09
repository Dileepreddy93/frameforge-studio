# FrameForge Hybrid — independently verified continuation (2026-11-03)

## Read first: exact code, proof and guardrails

Repository: Dileepreddy93/frameforge-studio
Branch: feature/hybrid-foundation
**Latest fully verified SOURCE commit: f4f00c03a682f28702018121798bb20edf08b099.** This handoff is a DOCS-ONLY commit on top of that verified code; always refresh the actual branch HEAD before editing. No authentication, payments, main-branch changes or production-V6 changes. Main is not the active work tree. GitHub API reports feature/hybrid-foundation protected=false; our pushes have used expected-old-SHA and force=false, but repository rules still need human/admin protection if mandatory.

**Main quality CI: 7/7 SUCCESS** https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41565854667
**Independent complete Windows native film: SUCCESS** https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41565854700
**Final film artifact:** GitHub Actions ID 13199587111, name frameforge-p7-windows-snow-lantern-30-60-second-movie.
**Final staging:** isolated Vercel project frameforge-hybrid-beta, ID prj_NIQffXRaKOy0lR3t6KkzihvB9RPh; deployment dpl_83Gh68xHdzLMHW747eqLdvnXAoYQ, READY, target=staging, exact git SHA f4f00c03a682f28702018121798bb20edf08b099; URL https://frameforge-hybrid-beta-5n1d5l7gf-dileepreddys-projects.vercel.app/creator.html. This separate project has SSO protection enabled and is NOT the original frameforge-v6.vercel.app production deployment. Protected access can prevent unauthenticated browser tests.

## Chronological verified evidence

1. Original unhandled-Lantern baseline: source 1284529bb874e4bdc21b1b3c38934debf35c5617. 7/7 CI https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41460684020 ; original 35.6-second film https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41460684181. The lantern stayed grounded; screen text filled the snowy set. Read docs/HYBRID_35S_REAL_FILM_AUDIT.md and docs/HYBRID_LANTERN_VERIFIED_CONTINUATION_2026-11-02.md.
2. New authored IK action milestone d697238b7a019f42fc08bbb1b928faf213918aab: Creator-saved reach, lift and carry of the original Three.js lantern; per-shot object-tracking camera; 2D screenplay roundtrip; validated per-shot actor; browser QA and Windows film accepted at https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41562767591. That first new film is FULL HD H264/AAC, 1,067 actual decoded frames and 35.584s. The lantern physically lifted around 0.41 metres and the independently sampled IK handle-to-wrist error was 0 in lift/carry. Source quality 6/7 at https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41562767610 due to legacy V6 screenshot capture variability, NOT a clean 7/7.
3. Cinematic/measurement milestone 25b7f2f155087c3f3da6dbaac68a78bfde476114: Creator per-shot **background workstation monitor** visibility (default keeps legacy appearance); outdoor film hides it in 8 nonscreen shots while keeping the two on-set scripted screen inserts; export instrumentation by rendering, canvas copy, encoder and finalize. The attempted reposition of the lantern did NOT fix a near-reach residual; the full-film test correctly blocked a false near-perfect grip claim. First PNG parity attempt called the legacy QA wrapper incorrectly and failed.
4. Corrective fully verified source f4f00c03a682f28702018121798bb20edf08b099: captures the actual frozen V6 composited **canvas.film** losslessly as PNG, not JPEG or the V6 QA JPEG-string wrapper; never modifies original studio.html or loosens pixel-difference thresholds. Original V6 frozen-baseline vs candidate comparison PASS across 14 film frames, exact or no greater than independently repeated frozen-baseline self-noise, in quality run 41565854667. Restores original lantern position. Separates **approach** (reach to within 20 cm) from actual **grip** (lift and carry require real IK wrist contact within 4 cm). All seven jobs PASS.
5. The final 10-shot snowy film at f4f00c0 independently PASSED Windows Chrome export, full ffmpeg decode, 1080x1920 H264 30fps 1,067 frames, AAC stereo 48 kHz, 35.584s, 36,289,517 bytes. Voice source is original locally generated English Kokoro; soundtrack and two effects present, LUFS -14.0614, peak -2.0dB. Export/persisted project, first/middle/last and reach/lift/carry stills, independent-delivery-report.json, authored-lantern-spatial-proof.json, actual-export-performance.json and verification.json all present in GitHub artifact 13199587111. No AI-image/video model was called to create the film: actual native browser WebGL/WebCodecs.

## Performance: OBSERVED, not yet causal benchmark

Final Windows test observed 496s from export click through file verification (previous rigged-film observed 626s). New export-internal wall clock: 469,202 ms; WebGL/renderFrame: 464,012ms (98.9% of export wall), drawing to encode canvas: 1,428ms, encoding: 2,205ms, finalize: 70ms, 434.88ms average 1080p frame render. Therefore optimizing encoder/mux won't fix responsiveness; focus on world/character WebGL render and separate performance controls. A single pair of CI runs is NOT proof that hiding the monitor caused the entire ~21% improvement. Test the same scenes on matched hardware with 3+ repetitions and cold/warm runs.

## Verified visual shortfalls: do not claim 10/10

- The original 3D lantern clearly exists and is carried in the final MP4, but **the reach stage still ends about 0.184m from the handle**, then lift attaches to the actual wrist. It is an *approach*, not a convincing full grasp; ensure a physically continuous reach->grasp->lift beat with visible fingers and a stable grounded starting position.
- Hiding the workstation *screen content/plane* does NOT remove the large, dark stage backing/board. The snowy exterior still looks like a studio set. This is now highly visible in the final after frames.
- Object-close-up shots fill the screen with the character torso and lantern, cropping eyes and expression. Improve portrait-safe composition, cinematic over-the-shoulder angles, eye-lines and coverage. The recurring static two-shot/black-board setup still feels formulaic.
- World depth and snow texture, volumetric atmospheric light and lantern spill, tactile contact shadows, character weight shift and facial emotion do not meet film-studio-level realism yet. Do NOT describe the result as photorealistic.
- Formal human creative approval, blind comparison with professional competitor clips, accessibility manual signoff and real physical Android/iOS/macOS device tests are NOT done. Tested 390px mobile viewport is browser emulation, not real-phone media export. Multilingual voices and enterprise billing remain outside the proven feature set. Do not implement login/payments yet.

## Exact next priority order

P12A: On the snowy outdoor story, eliminate the empty dark set panel (not just its screen texture), without breaking directed on-set screen inserts or original V6. Add an assertion that screenPlane/backing visibility matches authored shot requirements. Produce before/after stills from a *new full Windows film*.

P12B: Physical contact: design an explicitly grounded reach/grasp/lift/carry trajectory and solve actual hand-to-handle contact (existing 'reach' intentionally does not fully grip), preserve continuity at shot boundaries, animate shoulders/torso, and ensure object does not snap/fly. Verify measured contact, object floor penetration, human-visible frames.

P12C: Cinematography: add portrait-safe composition & camera-height/azimuth variation (object and speaker eyelines in frame), character reaction close-ups, silhouette-safe lighting and emotional beats. Run blind comparisons against 2-3 real user-provided or legitimate competitor footage samples, not a model-assigned score.

P13: Use actual-export-performance.json to profile render passes/mesh drawcalls/material allocation/shadows and dynamic resolution tiers without sacrificing final 1080x1920 output. Test on Windows desktop and lower-powered phone hardware. Provide CI averages/95th percentile and per-frame timing, not a single number.

P14: Real-editor usability: physically test novice creation of a 10-shot story from empty project on desktop and touch phone; video onboarding, keyboard focus order, accessible labels, undo/recovery safety, export recovery and mobile device compatibility. Current Windows movie was imported from a valid original V2 project, NOT all ten shots clicked manually in the editor.

P15: Authentic user tests, creative scoring and subscription decisions only after objective film quality and actual-device acceptance. Leave auth/payments and the public V6 site alone.

## New-chat instructions

FIRST read this file, CONTINUE_HERE.md and the exact latest feature-branch CI/artifact. Inspect actual final MP4/stills from artifact 13199587111 (don't repeat earlier P0-P10 work or the verified 7/7). Continue with P12A/B/C, test and commit in small increments with expected-SHA nonforce push on feature/hybrid-foundation. Preserve existing staging SSO; deploy only tested commits to the isolated hybrid staging project. Always report independent video/frame evidence and failed checks, and never assert 10/10 without human evaluation.
