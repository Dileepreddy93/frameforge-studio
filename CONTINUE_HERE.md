> **ACTIVE HYBRID WORK — P8/P9/P10 (2026-11-01):** Work only on `feature/hybrid-foundation` based on deployed original V6 `2b78e60fd484f6590276f041bfafc977aa4ef479`. Read **[docs/HYBRID_MASTER_IMPLEMENTATION_PLAN.md](docs/HYBRID_MASTER_IMPLEMENTATION_PLAN.md)** and **[docs/HYBRID_P8_P10_PRODUCT_RELEASE.md](docs/HYBRID_P8_P10_PRODUCT_RELEASE.md)** before editing code.
>
> **P1–P6 targeted verification:** versioned contracts, real built-in/imported characters, four Ember environments, directed scripts, screens and **three H264/AAC proof films including two newly synthesized English Kokoro voices** passed relevant CI. Broad legacy cross-page image parity remains RED; original V6 core renderer and main are unchanged.
>
> **P8:** `src/hybrid-export-readiness.mjs` + `tests/hybrid-p8-master-browser.cjs` test true 1080×1920 at 30fps with independent H264/AAC full decode; source tests PASSED, dedicated native HD job still under check in run 41318626453 at this checkpoint. Do not confuse the 2-second CI proof or FFmpeg packaging with a certified 30–60-second browser-native export or real-device Safari/Android.
>
> **P9:** `beta.html` with real hybrid engine from shared `src/hybrid-preview-engine.mjs`, responsive story selector, true animated 3D scrubbing, PNG download, export readiness and explicit limits. Desktop + mobile viewport Playwright acceptance PASSED in [CI run 41318626453](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41318626453), artifact `13088660981`. **Separate Hobby Vercel project** `frameforge-hybrid-beta` is READY at `https://frameforge-hybrid-beta.vercel.app/beta.html` from Git SHA `904d934`, but SSO-protected; this isolated project's initial deployment is labeled production **within the beta project only**. It never overwrites `frameforge-v6.vercel.app`. Build logs confirm 228 research-only/internal files excluded by `.vercelignore`. External logged-out live browser flow is not yet certified.
>
> **P10:** `src/beta-research.mjs` uses opt-in session-only, local/downloaded JSON, no automatic transmission or fake sales. Source tests PASSED. Early competitor audit & product positioning in the docs. **No actual customers, usability interviews, paid conversions or willingness-to-pay validation have happened.**
>
> **BLOCKERS:** P7 unified creator UI and full cast/world/edit/voice/reopen flow is still missing; P0/P1 frozen-V6 screenshot parity and cross-platform release are open; P8 30–60s full-resolution consumer export and real device checks remain; P10 real creator cohorts are not tested. **Do not merge `main`, release paid plans, claim P8/P9/P10 exits, or modify the existing V6 production deployment until explicit later acceptance.** Continue from latest commit/job states and update this ledger each phase.

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
