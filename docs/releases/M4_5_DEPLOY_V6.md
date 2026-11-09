# M4.5 · V6 deployed to its own Vercel project

**URL: https://frameforge-v6.vercel.app** (landing page `/`, studio `/studio.html`, credits `/credits.html`).
- Project `frameforge-v6` (`prj_nKz4mDnSN1D9bXwL6SEIk5DY43kG`) in `dileepreddys-projects`, created by the CLI on
  2026-10-26. Production deployment `frameforge-v6-lq3yvtocy-dileepreddys-projects.vercel.app`.
- **Not connected to GitHub.** Deploys are by CLI only.
- The deployed files are byte-identical to commit `efc3013` (M4.4), checked with `rsync --checksum` against the
  staged copy.
- The project `frameforge-3d-director-preview` was not touched. Note: on 2026-10-26 its URL serves the **V5**
  landing page ("FrameForge — animated reels from a script"), deployed there on 2026-10-25. It is not V3. The V3 code
  is still tag `v3.0-stable`.

## How it was deployed
This checkout's `.vercel/project.json` is linked to `frameforge-3d-director-preview`, so **never run `vercel` from
the repo folder**. The deploy is made from a separate staged copy that follows `.vercelignore` and has its own link:
```
D=~/Desktop/Animate/deploy/frameforge-v6        # holds .vercel/project.json → frameforge-v6
rsync -a --delete --exclude-from=<(grep -v '^#' .vercelignore | sed '/^$/d') --exclude=.git --exclude=.vercel \
  --exclude=.github --exclude='*.md' ./ $D/ && cp assets/voice/NOTICE.md $D/assets/voice/
cd $D && cat .vercel/project.json   # must say frameforge-v6
vercel deploy --prod --yes
```
What ships: 49 files, 25 MB (pages, `src/`, `design/`, `projects/`, `audio/*/{mix,voice}.mp3`, `media/v5/`,
`assets/voice/`). What doesn't: `models/` (buyers download the model from Hugging Face), the labs, research rigs,
evidence media, V3 audio, docs, tests and tools (see M4.4).

## Checked on the deployed URL
| check | how | result |
|---|---|---|
| first-run voice download | `FRAMEFORGE_DEPLOYED_URL=https://frameforge-v6.vercel.app/ node tests/browser-voice-browser.cjs` (new option) in a fresh Chrome profile | model from Hugging Face (`source: huggingface`, `@1939ad2a`) in 20.6 s; WASM in headless Chrome |
| a new line voiced | same test | voiced (2.81 s), shot re-timed to 3.30 s, mouth follows it |
| MP4 export | same test | H.264 + Opus (Linux Chrome has no AAC encoder, see M4.4), −17.9 dB RMS: the line is in it |
| offline after one visit | same test: network cut, studio reloaded | studio, model and lines from the caches; a new line voiced offline |
| landing page | `node tools/deployed-check.cjs <url> <out>` (new) | both reels play (720×1280, 36.97 s and 32.51 s), toggle works, cast cards load |
| credits | same | 9 parts listed, linked from the studio header |
| phone viewport (390×844, touch) | same | no sideways scroll on landing, credits or studio; no page errors or failed requests |

Whole voice test: 122 s. Screenshots and the exported MP4 are in `~/Desktop/Animate/proof/v6/M4.5/`
(`deployed-new-line.mp4`, `deployed-voice-test.log`, `{desktop,phone}-{landing,studio,credits}.png`, `phone.jpg`).

Not checked: real phones (only Chrome's phone emulation), Safari and Firefox, and WebGPU on a real GPU (headless used
WASM). On a phone the studio's controls come first and the film monitor is below the fold. That's for M5.

## Rollback
- To an earlier V6 deployment: `cd ~/Desktop/Animate/deploy/frameforge-v6 && vercel rollback <deployment-url>`.
- To take V6 offline entirely: `vercel project rm frameforge-v6` (ask first; it deletes the project and its URL).
- Nothing else changed on Vercel, so nothing else needs rolling back.
