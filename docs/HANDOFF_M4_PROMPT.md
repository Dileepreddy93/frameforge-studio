# FrameForge: prompt to continue with M4 in a new chat

Paste everything below the line into a new Claude Code chat on the repository `Dileepreddy93/frameforge-studio`.

---

You're continuing FrameForge Studio, a browser studio that makes short animated episodes: DEV (a human developer) and
two robots, BLUE and ORANGE. Read `AGENTS.md`, `STYLE.md` and `README.md` first, then the release notes in
`docs/releases/M2_*.md` and `docs/releases/M3_*.md`. They say what exists, how it was verified and how to roll it
back. Ignore older status claims in `CONTINUE_HERE.md` and `docs/HANDOFF_*`: they predate V6.

## Where things stand (2026-10-26)
- Work branch: start from `claude/youthful-ride-l03e6o` (head after M3.4 plus the approval commit), which is built on
  `feature/v6-matte-lowpoly`. `main` and the tag `v3.0-stable` are the protected V3 production; never touch them.
  Nothing from V6 is deployed.
- Done and pushed, M1.1–M1.4: DEV designed in 2D, approved, built in 3D, acting.
- Done and pushed, M2 (voices and sound in the browser):
  - M2.1: Kokoro-82M voices in the browser, offline after one 326 MB download.
  - M2.2: emotion in the voice (`src/voice-emotion.js`, PSOLA).
  - M2.3: British English for the `b*_` voices, per-episode `pronunciations`, and offline renders using the browser's
    pronouncer (`tools/phonemize.mjs`).
  - M2.4: line timing (lead, pause, pace) in the Shot inspector, saved with the episode.
  - M2.5: music and sound effects for browser-voiced episodes (`src/episode-mix.mjs`, which matches the offline
    master at 0.97 correlation).
  - M2.6: finished episodes play and export offline (`sw.js`).
- Done and pushed, M3 (robots):
  - M3.1: three robot directions (`design/robot-directions.html`).
  - M3.2: model sheet of direction A, approved by the user 2026-10-26 (`design/robot-model-sheet.html`,
    `design/robot-character.js`).
  - M3.3: robots built in 3D from the sheet (`design/robot-forms.js`, `buildRobot`/`drawRobotFace` in
    `studio.html`).
  - M3.4: robot acting (`src/robot-acting-core.js`).
- Known gaps, which M4 is for:
  - The two finished episodes (`projects/zero-latency`, `projects/dark-mode`) still carry audio mastered before
    M2.2/M2.3, and their landing videos and posters (`media/v5/*`) show the old robots.
  - No frame-by-frame comparison of the V6 look against the user's reference video.
  - An open licence decision on the AAC encoder (see `docs/releases/M2_5_*.md`).
  - No deploy of V6.
  - Stale handoff docs.

## Rules (from the user and AGENTS.md)
- Develop on a feature branch, commit with clear messages, and push. The user has said to push every milestone and
  keep going; they verify later. Don't open PRs unless asked. Never commit tokens. Preserve rollback notes and
  screenshots for major changes.
- Don't claim parity from a passing build. Look at real rendered frames, and be honest about what you can't judge
  (you can't listen: give the user WAVs or MP4s to check by ear).
- Design changes to characters go 2D first and need the user's pick. The user has approved DEV and robot
  direction A.
- Verify the licence of anything you import. No GPL code in what buyers run (that's why eSpeak and kokoro-js are not
  used).

## Setting up a cloud session (Hugging Face and jsDelivr are blocked there; GitHub, npm and PyPI work)
1. Fetch tags (`git fetch origin 'refs/tags/*:refs/tags/*'`). `tests/project-core.test.cjs` needs `v3.0-stable`.
2. Voice model kit:
   - Download `kokoro-v1.0.onnx` and `voices-v1.0.bin` from the GitHub release `thewh1teagle/kokoro-onnx`,
     tag `model-files-v1.0`.
   - Build `models/kokoro-82m-v1.0/` (gitignored): with Python `onnx`, rename the model input `tokens` to
     `input_ids` and the output `audio` to `waveform`, and save it as `onnx/model.onnx`. Write each voice in the npz
     as `voices/<name>.bin` (float32). Write `tokenizer.json` as `{"model":{"vocab":...}}`, taking the vocab from
     `kokoro_onnx/config.json`.
   - For the offline Python path: `uv venv -p 3.12 .venv && uv pip install kokoro-onnx soundfile onnx numpy`, and
     symlink the two files into `~/.cache/hyperframes/tts/models/` and `.../voices/`.
3. CDN mirror: `npm install onnxruntime-web@1.30.0 three@0.180.0 mediabunny@1.62.1 @mediabunny/aac-encoder@1.62.1` in
   a scratch folder. Point `FRAMEFORGE_CDN_MIRROR` at it (see `tests/cdn-mirror.cjs`). Use the preinstalled
   Playwright, not an npm copy.
4. Browser tests:
   - Set `PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1` and `FRAMEFORGE_CHANNEL=chromium` (there's no Chrome).
   - Voice tests start their own server.
   - Studio tests need `python3 -m http.server 8959` and `FRAMEFORGE_URL=http://127.0.0.1:8959/`. Run that server
     as a background task so it doesn't die.
   - Studio tests that call `chromium.launch` need a `--require` shim that runs `useCdnMirror` on each new context.
5. Tests:
   - Unit tests (in CI): `tests/*.test.cjs` and `tests/*.test.mjs`.
   - Browser tests, `tests/*-browser.cjs`: voice, emotion, pronunciation, timing, mix, offline, robot build,
     character art (`dev`/`blue`/`orange`), determinism, episode data, studio editor, landing, project.
   - Run the relevant ones before every push.

## M4 · Ship V6 Episode 1: re-render, compare with the reference, deploy a preview
This scope is a proposal, made because the user's TODO text for M4 wasn't available. If the user pastes their own M4
spec, follow it instead. Do the steps in order and push after each one, with a release note in `docs/releases/`
(what changed, how it was measured, how to roll back) and proof files for the user.

**M4.1 · Re-voice the finished episodes.** Run `node tools/build-audio.mjs` on `projects/zero-latency` and
`projects/dark-mode`. They now get M2.2 emotions, the M2.3 pronouncer (British ORANGE) and M2.4 timing, and shots
re-time to the new lines. Check every line:
- the length change against the old master;
- loudness of −14 LUFS and true peak at or below −1 dBTP;
- that the music cues still land.

Keep the old `audio/<id>/` files restorable through git history. Give the user per-line WAVs (before and after) and
the new mixes to judge by ear. If an emotion sounds wrong, tune `src/voice-emotion.js` only with the user's
feedback.

**M4.2 · Render the films at 1080×1920.** Run `node tools/render-episode.mjs` (try `--gpu`) for both episodes with
the new robots. Re-make the landing media (`media/v5/ep01-*`, `ep02-*`, posters and cast images). Watch the landing
and determinism tests. Check the robots in every shot type: camera framing, the arms against the body, and captions
not covering faces (STYLE.md: captions at about 31% of frame height).

**M4.3 · Compare with the reference.** The user's reference is `git-blame.mp4` (`spec/git-blame-reference.json`:
SHA-256, 24 frame hashes, `docs/GIT_BLAME_SHOT_MATRIX.csv`). It isn't in the repo; ask the user to attach it if it
isn't mounted.
- Pick matched shots: close-up, two-shot, wide, screen insert.
- Compare camera, lighting, palette, expression readability, acting timing, captions and audio loudness and pacing,
  side by side.
- Write `docs/releases/M4_3_REFERENCE_COMPARISON.md` with paired frames and a ranked list of gaps.
- Fix the top cheap gaps (light, framing, caption placement) and leave larger ones as a proposed M5.
- Never call it parity.

**M4.4 · Licence and asset audit.** List every runtime dependency and asset with its licence:
- the CDN libraries;
- the Kokoro model and misaki dictionaries (Apache-2.0);
- the rigged samples (`assets/rigged-samples/*.CREDITS.md`);
- the media.

Settle the AAC encoder: `@mediabunny/aac-encoder` wraps FFmpeg's encoder (LGPL) and loads only where WebCodecs can't
encode AAC. Present the options (keep it with notice, Opus fallback, or refuse to export there), and implement the
user's choice. Add a credits/notices page reachable from the studio.

**M4.5 · Deploy a Vercel preview.** Never touch the production URL (`frameforge-3d-director-preview.vercel.app`, V3).
Check `vercel.json` and `.vercelignore` (`models/` stays out; buyers download the model from Hugging Face). Ask the
user for Vercel access if it's needed; never commit tokens. On the preview, verify:
- first-run voice download;
- offline use after one visit;
- export;
- a phone-sized viewport.

Record the URL, the checks done, and how to roll back.

**M4.6 · Handoff docs.** Rewrite `CONTINUE_HERE.md`, `docs/PROJECT_STATE.md` and the README status block to describe
V6 truthfully: what's verified, what isn't, and where the proof is. Write the next prompt for M5.

Start by reading the files above and running the unit tests. Then tell the user, in a few lines, the plan for M4.1
before you change any audio.
