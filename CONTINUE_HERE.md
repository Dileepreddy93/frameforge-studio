> **LATEST VERIFIED FRAMEFORGE HYBRID CONTINUATION — 2026-11-03:** [New exact-code, CI, film, performance, staging and P12 handoff](docs/HYBRID_VERIFIED_HANDOFF_2026-11-03.md). Last verified software code SHA **f4f00c03a682f28702018121798bb20edf08b099**; [7/7 CI green](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41565854667), [new 35.6s Full HD Windows film PASS](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41565854700), [isolated SSO staging READY](https://frameforge-hybrid-beta-5n1d5l7gf-dileepreddys-projects.vercel.app/creator.html). Older notes below remain historical. **No auth/payments, main, or V6 production modifications. No 10/10 assertion.**

> **VERIFIED CONTINUATION UPDATE — 2026-11-02:** FrameForge Hybrid on `feature/hybrid-foundation` now has independent 35.6-second original *Lantern* film with a visible, creator-authored 3D lantern prop. **Latest verified software SHA `1284529bb874e4bdc21b1b3c38934debf35c5617`**, [7/7 CI PASS](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41460684020) and [Windows long-film PASS](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41460684181). [Visual comparison, staging, honest remaining gaps and exact next work](docs/HYBRID_LANTERN_VERIFIED_CONTINUATION_2026-11-02.md). The original V6 production and `main` remain untouched; no login/payments. **Not production ready or independently rated 10/10.**

> **NEW CHAT — START HERE (2026-11-02):** [Verified continuation and next engineering tasks](docs/HYBRID_NEXT_CHAT_HANDOFF_2026-11-02.md). This supersedes older time-stamped checkpoint summaries below. At exact source SHA `08831f0f4a1bf02a25a081aacad9b0675d817bad`, **7/7 main CI jobs PASSED** in [41394212683](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41394212683) and a **35.7s / 1,071-frame / 1080×1920 / H264+AAC browser-native Windows film PASSED** in [41394212648](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41394212648). The latest original-film [visual audit](docs/HYBRID_35S_REAL_FILM_AUDIT.md) records why this is **not yet independently rated 10/10**. Continue on `feature/hybrid-foundation`, no authentication/payment changes, protect original V6 production and `main`. Refresh GitHub HEAD and CI before editing.

# FrameForge — verified continuation, 2026-11-02 (hybrid Creator hardening)

**Safety:** Original V6 `frameforge-v6.vercel.app` (deployed SHA `2b78e60`) and `main` remain untouched. Only `feature/hybrid-foundation` and the separate authenticated Vercel Hobby project `frameforge-hybrid-beta` were edited/deployed. **No payment/login integration was attempted. This is NOT rated 10/10 or cleared for commercial release.**

**Newest QA staging:** [Hybrid Creator](https://frameforge-hybrid-beta-8in32xstk-dileepreddys-projects.vercel.app/creator.html), deployment `dpl_9JqadnC3j7pLoPJxZFSGX41fVcEM`, built READY from `d1f5d236279f48029659f6f002128edb1819a4e4`. Authenticated access may be required. GitHub backend staging build READY does not imply physical-device customer UX tested.

## Actual current accomplishments

- Live WebGL preview and the **MP4 encoder** now use `frameAt(t,false)` without per-frame PNG data URL; PNG encoding remains for explicitly requested still photos. The actual Creator renders on a native canvas, and desktop + 390px mobile-viewport browser tests pass (not physical mobile certification). 
- Creator's original actor customization now exposes persisted clothing/accent color, hairstyle, and smooth/faceted 3D style. Strictly validated look patches are saved in `frameforge.project/2`. Browser tests change model appearance, verify pixel differences and JSON round-trip, and protect corrupt IndexedDB recovery.
- **Real Creator Kokoro speech/playhead bug FIXED and independently verified**, [successful voice job in run 41378958347](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41378958347): `HYBRID_P7_REAL_ENGLISH_KOKORO_CREATOR_PASS`, real two-speaker 5.1s 48kHz stereo audio at ~−14.01 LUFS/−2dB peak, observed playhead progress in 906ms. Linux Chromium lacked both H264/AAC encoders, so exporter correctly failed closed: **native consumer MP4 not certified by this test**.
- Actual real-browser night-scene face was too dark: same screenshot ROI rose **mean luma 24.59 → 75.42/255** after deterministic front key/fill/rim lighting, independently measured from two archived desktop Chromium screenshots. Added `faceReadability` regression in `tests/hybrid-p7-creator-browser.cjs`; check the **newest** run before claiming new regression PASS.
- Inspected independently decoded original hybrid MP4 frames: a 9:16 two-shot visibly cropped the human listener. `src/hybrid-direction.js` now places the 2-shot at 9.4 units rather than 6.5, and widens the default wide shot to 11.2. Mathematical portrait-frustum unit test added. **Actual updated film shot needs visual verification when new portable-video artifact finishes.**
- MP4 export no longer silently labels a truncated first 60 seconds as the 'full story' if the authored story is longer than 60 seconds. A dedicated Windows Chrome QA workflow (`.github/workflows/hybrid-creator-windows.yml`) was created to require a real 1080×1920 H264/AAC browser-native 2-second MP4 and full external ffmpeg decode. [Run 41380632012](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41380632012) was **in progress** at this checkpoint; never call the Windows native export passed without its green `HYBRID_P7_WINDOWS_NATIVE_HD_RELEASE_PASS` marker.
- Existing frozen V6 image SHA test remains red even though original V6 inputs are untouched. Frozen baseline vs the same baseline repeatedly produces different hashes. Pixel forensic screenshots (baseline A/B vs candidate A/B, at each differing frame) are now archived from CI using `tests/hybrid-legacy-film-frames.cjs` and `frameforge-p0-v6-exact-pixel-forensics`. **Do not quietly weaken/re-record the frozen baseline or claim original parity fixed.**
- No complete 30–60s **customer-authored hybrid native browser MP4** has passed real Windows/macOS/Android/iOS compatibility signoff. No independent audio listening, manual full-film art approval, or recruited creators have rated the actual output. Those are hard blockers to an evidence-backed “10/10” claim.

**After reading this, inspect the newest complete run for branch SHA and all 7 job conclusions, the Windows native export run result, and the archived portrait camera/lighting frames before changing or promoting any deployment.** Preserve the untouched V6/main.

---

> **ACTIVE HYBRID — CURRENT CHECKPOINT 2026-11-01**. Work on `feature/hybrid-foundation`; read `docs/HYBRID_MASTER_IMPLEMENTATION_PLAN.md` and `docs/HYBRID_P8_P10_PRODUCT_RELEASE.md`. The original V6 production URL `frameforge-v6.vercel.app` (commit `2b78e60fd484f6590276f041bfafc977aa4ef479`) and `main` were NOT modified.
>
> **P7 EDITABLE CREATOR EXISTS AND BROWSER-TESTED:** `creator.html`, `src/hybrid-editor-core.js`, `src/hybrid-editor-app.mjs`, `src/hybrid-editor-storage.mjs`, `src/hybrid-browser-export.mjs`, `src/hybrid-preview-engine.mjs`. Real Cast/World/Shot editing with actual WebGL render changes; title/dialogue/actions/cameras/on-set screens, undo/redo, original JSON save/reopen, IndexedDB recovery, PNG stills, local Kokoro-English voice model and fail-closed H264/AAC browser MP4 path. Desktop/mobile-viewport Playwright browser E2E and source tests passed in [run 41322641272](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41322641272) and [run 41328790897](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41328790897). Latest browser tests also protect corrupted autosave: editing, import and voice generation are blocked until the user downloads a raw recovery copy.
>
> **P6→P7 REAL-MODEL INTEGRATION:** new `tests/hybrid-p7-real-creator-voice.cjs`, wired into real browser Kokoro voice CI via `tests/voice-model-browser.cjs`. Tests new original English dialogue through Creator UI, verifies fresh stereo audio, playhead and browser-native MP4 if codecs exist, or explicit fail-closed if unsupported. **CI run 41329592563 was ongoing at this checkpoint; do NOT claim this integrated voice test passed until its `HYBRID_P7_REAL_ENGLISH_KOKORO_CREATOR_PASS` marker and green voice job are verified.**
>
> **P8:** 2-second true 1080×1920 30fps WebGL FFmpeg-packed H264/AAC proof passed in independent CI. Actual browser-native full 30–60s customer export remains OPEN and must not be conflated with this 2-second CI demo. Physical Android/iOS/macOS/Windows benchmarks, accessibility manual review, model licensing and human speech/film approval remain OPEN.
>
> **P9:** independent SSO-protected Hobby Vercel **staging** deployment READY from QA commit `fef68f2987897e5e079b6b4c8c0c991060d3ddb7`: [Creator staging](https://frameforge-hybrid-beta-7rz45zdpy-dileepreddys-projects.vercel.app/creator.html), project `prj_NIQffXRaKOy0lR3t6KkzihvB9RPh`, deployment `dpl_7AaF6LsmsMiTgg2nk7gTwKEJDeJ1`. This is NOT the original production or a public customer launch, and staging may require Vercel authorization. Staging currently pre-dates the newest recovery/real-model test commits.
>
> **P0 PARITY INVESTIGATION (NOT GREEN):** `tests/hybrid-legacy-film-frames.cjs` compares frozen V6 against candidate original V6 rendering. Exact frozen-V6 source files have NOT changed, but comparing the frozen baseline against a second frozen-baseline capture produced different JPEG hashes, including `e6be815e...` and `daa2bb8b...`. Repeat baselines can differ even on the same origin; the first paired comparisons at 0.5s matched exactly but a later 15s frame did not. See [run 41328790897](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41328790897). This demonstrates nondeterministic screenshot capture, but DOES NOT authorize relaxing the parity gate or claiming all V6 frames are identical. Investigate deterministic rendering/input stabilization or calibrated baseline noise before signoff.
>
> **P10:** opt-in-only local research instrumentation and accessible beta tested, but NO real user cohorts, hypothetical price conversion evidence or paying subscribers. **Overall NO production promotion and NO paid-launch certification.** Complete verified browser exports, real-device QA, V6 parity and human acceptance before touching `main` or original V6 deployment.

---

# FrameForge: continue here (updated 2026-10-26, after M4)

FrameForge Studio is a browser studio that turns a short script into a finished 9:16 animated episode. It has
three original characters (DEV, a human developer, and two robots, BLUE and ORANGE), voices that run in the
buyer's browser, music, sound effects, captions and MP4 export. Buyers use it alone: no keys, no server, no cost per video.

**To continue, paste `docs/HANDOFF_M5_PROMPT.md` into a new chat.** Read `AGENTS.md`, `STYLE.md` and the release
notes in `docs/releases/M2_*`, `M3_*` and `M4_*` first. Older docs (`docs/HANDOFF_*`, `EXECUTION_LEDGER`,
`IMPLEMENTATION_PLAN_P0_P8`, the V5 sections of other files) predate V6. Read them as history only.

## Where things are
| | |
|---|---|
| Repo | `Dileepreddy93/frameforge-studio` (push as Dileepreddy93) |
| V6 work | branch `feature/m4-ship-episode1`, from `main` @ `49c10c5` (M1–M3 merged through PR #19) |
| Live V6 | **https://frameforge-v6.vercel.app**: Vercel project `frameforge-v6`, CLI deploys only, not linked to GitHub (M4.5) |
| Protected | tag `v3.0-stable` (`f7b20bd`) and project `frameforge-3d-director-preview`. That URL currently serves the **V5** landing page (deployed 2026-10-25), not V3. Never deploy to it |
| Reference | `~/Desktop/Animate/git-blame.mp4` (outside the repo; SHA-256 in `spec/git-blame-reference.json`) |
| Proof | `~/Desktop/Animate/proof/v6/<step>/` (outside the repo: MP4s, WAVs, frames, reference frames) |

## V6, honestly
**Verified (measured or tested, with the proof above):**
- DEV (M1) and BLUE and ORANGE (M3), each designed in 2D, approved by the user, then built in 3D and acting.
- In-browser Kokoro voices with emotion, British ORANGE, pronunciations and line timing; music and effects mixed
  in the browser; offline after one visit (M2).
- Both finished episodes re-voiced: −13.9 LUFS, true peak ≤ −1.6 dBTP, every cue in its shot (M4.1).
- Both films rendered at 1080×1920, and the landing media re-made from them (M4.2, M4.3).
- No GPL or LGPL code in what buyers run. Export audio is AAC, or Opus where the browser has no AAC encoder. A credits
  page lists every part (M4.4).
- On the live URL: first-run model download, a new line voiced, MP4 export, offline voicing, and a phone-sized
  viewport (M4.5).

**Not verified, or known to be behind:**
- **Not reference parity.** `docs/releases/M4_3_REFERENCE_COMPARISON.md` ranks the gaps: set density and scale
  (rebuilt in M5.1 as the screen arena), in-world screen shots instead of flat cards (done in M5.2), a harder key light (M5.3: a character key and a black
  lift), faster cutting and the camera never resting (M5.4:
  planner reaction cuts and distance-scaled moves).
- Delivery by ear: the user hasn't listened to the M4.1 voices yet. DEV's "worried" lines barely move in pitch.
- The Opus fallback narrows the music's faint stereo (M4.4).
- Real phones, Safari and Firefox, and WebGPU on real GPUs: only Chrome on Linux and phone emulation were tested.
- The phone layout (M5.5: film first) was checked in emulation only.

## Commands
```
export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH
npm install --no-save playwright@1.56.1; git fetch --tags        # project-core.test needs v3.0-stable
python3 -m http.server 8959 --bind 127.0.0.1 &                   # studio browser tests: FRAMEFORGE_URL=http://127.0.0.1:8959/
for t in tests/*.test.cjs tests/*.test.mjs; do node $t || echo FAIL $t; done   # skip phase0-frame-evidence (needs a manifest)
node tools/build-audio.mjs projects/<id>.frameforge.json         # voices, timing, music, master (needs .venv: kokoro-onnx, soundfile)
node tools/render-episode.mjs projects/<id>.frameforge.json --gpu
.venv/bin/python -I tools/audio-report.py <before-dir> projects/<id>.frameforge.json <out>   # line-by-line audio diff
node tools/deployed-check.cjs https://frameforge-v6.vercel.app/ <out>                      # landing, credits, studio, phone
FRAMEFORGE_DEPLOYED_URL=https://frameforge-v6.vercel.app/ node tests/browser-voice-browser.cjs   # voices + export + offline, live
```
Deploying: **never run `vercel` in the repo folder** (it's linked to the protected project). Use the staged copy in
`~/Desktop/Animate/deploy/frameforge-v6`, as described in `docs/releases/M4_5_DEPLOY_V6.md`.
Since 2026-11-01 a deploy can also be made without the Mac: Vercel builds a pushed commit straight from GitHub
(`create_deployment` with `gitSource`, project `frameforge-v6`); `.vercelignore` applies to it (the build log lists
the removed files). `tools/deploy-v6.sh` does the Mac route in one command (stage the committed files, check the link is `frameforge-v6`,
`vercel deploy --prod`); `--stage` stages only. It refuses a dirty tree or a copy linked to any other project.
