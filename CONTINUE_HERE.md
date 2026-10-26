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
- **Not reference parity.** `docs/releases/M4_3_REFERENCE_COMPARISON.md` ranks the gaps: set density and scale,
  in-world screen shots instead of flat cards, a harder key light, faster cutting, and the camera never resting.
- Delivery by ear: the user hasn't listened to the M4.1 voices yet. DEV's "worried" lines barely move in pitch.
- The Opus fallback narrows the music's faint stereo (M4.4).
- Real phones, Safari and Firefox, and WebGPU on real GPUs: only Chrome on Linux and phone emulation were tested.
- On a phone, the studio's controls come before the film monitor.

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
