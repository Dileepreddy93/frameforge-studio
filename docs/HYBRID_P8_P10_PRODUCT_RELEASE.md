# FrameForge Hybrid — P8 exporter, P9 beta and P10 product validation

**Date:** 2026-11-01. **Owner branch:** `feature/hybrid-foundation`. **Production protection:** existing `frameforge-v6.vercel.app` and `main` must remain unchanged.

**Release distinction:** P8–P10 are not complete by writing documents or adding a beta link. Completion requires decoded full-size films, multi-device compatibility, an isolated deployed beta, observed users, and validated buyer behavior. Current certification status must be updated using CI and staging proof.

## Evidence-based product direction

We will not compete on “more AI buttons.” Krikey currently offers a free tier and a **$15/mo Pro** option with 165 monthly credits, custom 3D avatars, advanced motion/cameras, 20+ language voices, and export formats (source https://www.krikey.ai/pricing, checked 2026-11-01). Animaker offers a free tier with limited video downloads and paid subscriptions, including HD/FHD/higher resolution and animation libraries (source https://app.animaker.com/pricing?language=en). These are **advertised capabilities, not verified side-by-side artistic performance**. Pricing is subject to change.

**Our real differentiation hypothesis**: repeatable fictional-cast storytelling; deterministic editable scene timeline; responsive in-browser creation; clear no-per-render-credit local mode; consistent audio; transparent exported file provenance. These features mean nothing if a first-time customer cannot finish a real movie. Our technical constraints are important: today native Indic TTS, third-party unrestricted VRM support, unified V2 editing and multi-device full-size MP4 are **not** release-certified. Do not claim those features in ads, app store listings or pricing.

## P8 — Independent production film certification

Modules:
- `src/hybrid-export-readiness.mjs`: `preview` (360×640/15), `social` (720×1280/30), `master` (1080×1920/30); secure-context/WebGL2/H.264/AAC probing with real `isConfigSupported`, quota estimates, memory budget and explicit fail-closed error states. Unsupported WebCodecs must never be labeled as working MP4.
- `src/hybrid-preview-engine.mjs`: shared P5/P6 source for CI fixture and deployable hybrid preview. It supports **native** 360–1080px portrait WebGL rendering with correctly scaled captions, not 360px enlargement.
- `tests/hybrid-p8-readiness.test.mjs`: codec absent, storage insufficient, missing frames, cancel/disposal; no silent success.
- `tests/hybrid-p8-master-browser.cjs`: a **real 1080×1920 WebGL render at 30 fps**, encoded as H.264/AAC; pixel variance + first/middle/last full-size frame hashes; `ffprobe` duration/frame count and full `ffmpeg` decode. This is a **2-second certification slice** and CI uses ffmpeg packaging, not proof of consumer browser export on every platform.

Independent acceptance beyond this initial proof:
1. At least two complete **30–60-second** custom films encoded at actual 1080×1920/30 from the consumer UI; decode first/middle/last, continuous playback, consistent subtitles, stereo audio, loudness and voice timing.
2. Desktop Chrome and Edge on Windows, Chrome on Android, Safari on iOS and macOS, Chrome/Firefox on Linux (or explicit transparent blocked/unsupported status). Real-device verification, not only viewport emulation.
3. Render progress, pause/cancel, out-of-memory and storage exhaustion handling; no data loss; saved project reopens and reproduces.
4. 30+ frame seek/resume tests, audio across cuts, human eyes/ears approval, no silent codec downgrade.
5. Re-run historical V6 independent-page visual parity, which currently **fails** even though frozen V6 source files are unchanged; investigate pixel drift before production promotion.

## P9 — Safe isolated staging & usability

The new `beta.html` is not a generic marketing mockup. It is a guided beta surface driving a real Ember-based hybrid scene via the `src/hybrid-preview-engine.mjs` shared with CI. Features: story choice, timeline seeking, native PNG still capture, real device export diagnostics, direct link to the functioning legacy V6 editor, honest beta warning and voluntary local-only research. It intentionally does **not** present P7's missing unified editor or browser MP4 pipeline as a finished customer workflow.

Experience criteria:
- Immediate comprehensible headline and one primary action; 3 small steps rather than hundreds of controls. Secondary advanced tools are plainly discoverable. Grounding: NN/G progressive disclosure (https://www.nngroup.com/articles/progressive-disclosure/).
- Visible loading/errors, no fake full-progress bars, keyboard controls, text labels, focus indicators, 44px hit targets, proper mobile stacking, reduced-motion preference, no surprise audio. Grounding: WCAG 2.2 (https://www.w3.org/TR/wcag/), W3C ATAG authoring tools (https://www.w3.org/WAI/standards-guidelines/atag/).
- Target: landing LCP <=2.5s, INP <=200ms, CLS <=0.1 in actual field sample; requires measurement (https://developers.google.com/search/docs/appearance/core-web-vitals). Shader/voice model initial loading may be longer; show honest readiness and separately record wait times.
- When browser H264/AAC is unavailable or storage quota low, explain why and point to a supported device; never relabel WebM as MP4. Standard source: MDN WebCodecs codec selection (https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API/Codec_selection), storage quota (https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).
- `tests/hybrid-p9-beta-browser.cjs` drives desktop and 390px simulated mobile experiences in Chromium: actual preview ready, seek, story switch, real saved PNG, codec diagnostic, opt-in feedback download, consent erasure, screenshot evidence and horizontal overflow. Simulated viewport is NOT physical Android/iOS certification.

**Staging discipline:** New Vercel project named `frameforge-hybrid-beta` (only on existing free/hobby team, if supported), preview Git source pinned to feature branch SHA; do not bind the existing production domain. Link only after build returns READY and the beta + shared renderer routes load. A real participating customer cohort is not created by running a browser test.

## P10 — Commercial advantage and evidence (not vanity features)

`src/beta-research.mjs` collects at most 300 **explicitly consented, nonidentifying, session-only** task events, and exports feedback to the user's device. It does not phone home. Withdrawing consent clears data. `summarizeResearch()` reports actual submitted study artifacts, keeps hypothetical pricing separate from paid conversion and always reports `actualPaidCustomers: 0` until connected billing data provides evidence. Target outcomes are **not current achievements**.

Four sequential product hypotheses:
1. **Activation**: five diverse creators (at least one mobile creator, first-time editor, and a teacher/small-business producer) each tries *without instructions* to pick a character, change a scene, voice, preview, export and reopen. Today P7 is unavailable: mark full-flow success = **not testable**, not passed.
2. **Usability**: after fixing critical blockers, 20+ separately recruited participants try the same task. Metric = completed valid first MP4 / attempted, with failed or abandoned exports counted as failures. Goal >=80% successful and median time-to-first-export <10 min (initial thresholds to validate, not guarantees). NN/G advocates direct task success and small qualitative sessions (https://www.nngroup.com/articles/success-rate-the-simplest-usability-metric/).
3. **Differentiation**: blind side-by-side rated films with Krikey, Animaker and ours on voice clarity, actor consistency, usable camera choices, quality, elapsed creative time, latency, subtitles and supported languages. Record actual versions, price tiers and export settings. Do not use nonlicensed competitor assets in marketing.
4. **Willingness to pay**: after free usability succeeds, recruit at least 30 creators in specified segments, randomize exposure to $0 / $7 / $12 / $20 exploratory value propositions, document qualitative intent, then test voluntary paid conversion with legal payments and cancellation. Do NOT claim "we can sell $12/month" without evidence. Cost model should include serving assets, support, user acquisition, licensing, QA, and refund handling; local rendering does not mean all business costs are zero.

Research instruments live in the beta form; exported responses are downloaded privately, not auto-collected. Public claims must exclude unverifiable revenue, active customers or market size. All 100-crore vision numbers are hypotheses until proven.

### Isolated beta release evidence (actual, not inferred)

[Hobby Vercel deployment `dpl_FirF2JeVp7jRrBAypEVfMWcAiAS1`](https://frameforge-hybrid-beta.vercel.app/beta.html) is READY from feature commit `904d934436480f3619e8bc0fb719094e42256b2c`. Vercel build logs explicitly report 228 ignored files (CI, docs, noncommercial Ara model, old review assets) stripped by `.vercelignore`. Git source and build completed without error. It is a wholly separate project from `frameforge-v6`. Vercel labeled the new beta project's first deployment `production` *inside the isolated beta project* despite requesting `preview`; no original V6 domains or deployment were affected. Project has Vercel Authentication / SSO protection for these domains; an unauthenticated external browser cannot yet be claimed as tested. No authenticated visual walkthrough of that final hosted deployment has been recorded, distinct from the green local-served browser test.

The beta browser CI initially failed on two test-harness mistakes, not broken user behavior: typing into a range input via Playwright `.fill`, and expecting pre-consent scrub events to appear in an opt-in study report. Those tests were corrected to use a genuine slider input event and exercise consent only afterward. [Run 41318626453](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41318626453) `hybrid-beta-usability` is green. The renderer was refactored into `src/hybrid-preview-engine.mjs`, used by the CI QA page and the deployed beta, rather than shipping the ignored `tests/` route or duplicating expensive animation code. The existing `studio.html` remains untouched.

## P7 dependency, critical

The unified responsive **Cast → World → Direction → Voice → Preview → Export → Reopen** customer workflow has **not** been shipped. P8's encoder tests, P9 beta preview, and P10 research instruments are necessary infrastructure but not substitutes for P7. It would be misleading to mark full P8/P9/P10 product exit criteria complete while first-time creators cannot perform that sequence.

## Release decision log

| Gate | Required evidence | Initial state |
| --- | --- | --- |
| P8 native 1080×1920/30 short film | [CI run 41318626453](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41318626453) | Source/contract PASS; native-HD job running at last check |
| P8 full 30–60s film and real devices | Human watch/listen and browser tests | Open |
| P9 beta rendering UX | [CI 41318626453](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41318626453), [screenshot evidence 13088660981](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41318626453/artifacts/13088660981), separate protected [beta page](https://frameforge-hybrid-beta.vercel.app/beta.html) | PASS: Chromium desktop/mobile viewports, Vercel deployment READY; actual public/hardware devices OPEN |
| P9 beta user cohort | Real people tested, actual outcomes | Not yet recruited |
| P10 private opt-in research | Source test and downloadable local JSON | PASS in source CI and working beta; no human participants yet |
| P10 willingness to pay | Independent creator evidence and paid conversion | Not validated |
| V6 parity / Windows/macOS gates | Full green regression/release | Open |
| Production launch | Written user authorization **after** green gates | Not authorized |

Check `docs/HYBRID_MASTER_IMPLEMENTATION_PLAN.md` and newest GitHub Actions runs for exact updated status.