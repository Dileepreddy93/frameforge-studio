# FrameForge Hybrid — independently verified lantern continuation (2026-11-02)

## Authority and safety

- Repository: `Dileepreddy93/frameforge-studio`; branch: `feature/hybrid-foundation`.
- Latest **code** SHA: `1284529bb874e4bdc21b1b3c38934debf35c5617` (subsequent handoff/docs commits may advance branch HEAD without changing app).
- Original `main`: `49c10c59f89b971666c8be3b1aa7efa18ade1774` (unchanged).
- Original V6 production: `frameforge-v6.vercel.app`, Vercel ready deployment code SHA `2b78e60fd484f6590276f041bfafc977aa4ef479`, NOT redeployed.
- Separate Vercel staging: `frameforge-hybrid-beta` project `prj_NIQffXRaKOy0lR3t6KkzihvB9RPh`; **READY** deployment `dpl_EMHPDUHqiheoFvPRXBbtA11v51MC`, ref `feature/hybrid-foundation`, code SHA `1284529`, target `staging`, SSO/deployment protection configured. [Creator staging](https://frameforge-hybrid-beta-qbins9fdu-dileepreddys-projects.vercel.app/creator.html). Staging readiness ≠ a physical-device QA pass.
- GitHub API reports `feature/hybrid-foundation` currently `protected:false`. Commits in this continuation used explicit branch targeting and non-force updates, but **repository-enforced protection has not been configured**; do not claim otherwise.
- No authentication/billing/payments integrated or modified. No production promotion or `main` merge authorized.

## Completed implementation in this continuation

| Commit | Grounded change | Verification |
| --- | --- | --- |
| [`fc6a116`](https://github.com/Dileepreddy93/frameforge-studio/commit/fc6a116ad5d0d69fa160ae6418d1bf974e2376ba) | In-world monitor **portrait-safe** screen-insert camera default, 4.8→11.8 distance; geometric frame-bound regression; artist overrides retained | Latest source CI and actual film contact sheet |
| [`f688157`](https://github.com/Dileepreddy93/frameforge-studio/commit/f68815704d79ea810cdf8f6aa4bfef25306357e0) | Distinct snow-night 10-shot *The Lantern That Learned to Listen* screenplay with different camera beats, reactions, captions, score, genuine Kokoro dialogue; same Luna/Atlas/voice identities | New Windows CI, project signatures |
| [`9aa6b95`](https://github.com/Dileepreddy93/frameforge-studio/commit/9aa6b9511b0269c4bb7de775f17488d95ae47770) | Correct scenario-dependent music assertion after verified CI assertion-only failure | Later film [41457773215](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41457773215) PASS |
| [`cd9ad80`](https://github.com/Dileepreddy93/frameforge-studio/commit/cd9ad804f8a6a4a953c166d40f267c662c46878f) | Creator inspector now displays true screen camera default, not outdated 4.8; browser regression | [7/7](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41458271320) PASS |
| [`1284529`](https://github.com/Dileepreddy93/frameforge-studio/commit/1284529bb874e4bdc21b1b3c38934debf35c5617) | Original, local Three.js 3D lantern mesh + warm light; **per-shot author control**, V2 validation, screenplay `@prop name=lantern`, JSON save/reopen and cleanup; actual WebGL pixel change; updated native full film | [7/7](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41460684020) PASS, [Windows film](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41460684181) PASS, [real Creator screenshots](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41460684020/artifacts/13149456160) |

The new 3D prop is constructed entirely from authored geometry and materials; it is not a retrieved, copied or externally licensed character/model.

## Actual final film: independently checked

- Source: `frameforge.project/2`, original editable 10-shot episode imported through genuine Creator UI, `luna:af_heart,atlas:am_michael`. Two distinct original narratives exist: former forest workstation and new snowy lantern story.
- [**Final real MP4 and stills artifact 13148998466**](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41460684181/artifacts/13148998466).
- **Film run [41460684181](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41460684181) PASS** on source `1284529`; full externally decoded H.264 `1080×1920` at `30` FPS, **1,067 frames**, AAC stereo 48 kHz, **35.584 seconds**, **36,304,964 bytes**. Explicit independent FFmpeg full decode in CI and repeated separately after artifact download; audio sample mean −17.6dB, max −1.9dB; automated mix ~−14.06 LUFS and −2dBFS true peak. Original Kokoro English, score and two SFX.
- **Visual inspection of 15 actual sampled frames:** original forest repeated static desk and clipped two giant screen inserts; second snowy version gave distinctive ambient lighting and portrait-safe monitor; however **initial snow film had no lantern at all**. Authored prop then added and rerendered. Matching decoded shots at **15.18s and 24.70s** show an actual bright geometric lantern on the ground where none existed in the same shots before; the rendered glow and object are visible through multiple later shots.
- Rendering time is still far too slow: original forest **534 sec / 35.7 sec**, pre-prop snow **616 sec / 35.6 sec**, prop-enabled snow **638 sec / 35.6 sec** (~1.67 encoded FPS on Windows CI). CI runner/scene variability means 22 sec change is *not* a controlled proof of prop overhead. Profile render, texture upload, frame copy and encode separately before claiming an optimization.
- [Code quality](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41460684020) **7/7 CI jobs PASS** for exact prop code SHA. Creator E2E on desktop and 390px viewport independently changed real 3D pixels, saved/reopened the selected lantern, and archived browser screenshots. **No physical device validation**.

## What remains unverified / not competitive yet

1. **Cinematic staging**: the ground lantern is visible but passive; no actor reaches, grasps, lifts or carries it, and no dedicated close-up tracks it. The workstation monitor/environment is still overused, and several adjacent shots repeat similar composition. Implement general authored scene props and object interactions, a true camera focus target, light-driven story beats, per-shot world layouts, continuity, and proof frames.
2. **Acting and speech precision**: generated acoustic mouth control is not independent forced phoneme-to-viseme evaluation. Timecode human/robot speech, blinks/gaze, hands, listening/reactions and emotional timing; have people watch and listen to exact final MP4.
3. **Performance**: 638 sec for 35.6 sec at 1080p. Record per-stage render/copy/encode costs, peak memory/storage, cancellation behavior; optimize and rerun the *same film* side by side with visual/audio equivalence. Do not claim it is performant.
4. **Real-device and accessibility**: actual Windows Chrome passed; no independently completed Android/iOS Safari/macOS physical GPU and codec tests, no unassisted creator usability panel, no representative mobile-memory success. 390px Chromium viewport ≠ phone.
5. **Legacy V6 frozen parity**: SHA/source unchanged; old exact-pixel comparison across repeated captures suffers nondeterminism; investigate before claiming complete frame parity.
6. **Customer readiness**: no independent buyer trials, reference-grade blind film scoring, asset-by-asset commercial license signoff for every possible imported rig, or production authorization. Absolutely no claim of 10/10, paid launch, auth or payments.

## Next exact engineering sequence

1. Refresh branch HEAD and GitHub CI. Read this note, the three original handoff/audit docs and the latest actual 35.6s movie artifact. Start from `1284529`, **not a rewrite of P0–P10**.
2. Address the **visible lantern interaction gap** first: authored actor-to-prop spatial interactions and an actual object-target close-up; add safe V2 control and 360p real-pixel regressions. Generate another 35–60s full story and compare **matching frames**.
3. Benchmark 638sec exporter at separate GPU render, ambient monitor texture uploads, parent-canvas copy and WebCodecs encoding steps. Apply measurable optimizations only with image/audio regressions and identical story replay.
4. Advance distinct shot layouts, reaction/eye performance and genuine voiced lip timing; then real hardware and human panel. Continue code+tests+commit+visual evidence; stage **only** in separate protected Vercel project.
5. Do not touch `main`, original V6 deployment, login or payment integration.

**Meaning of green:** technical pipeline passes; it does not certify professional cinematic quality, real-device exports, or market fit.
