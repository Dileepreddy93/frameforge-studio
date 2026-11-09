# FrameForge

FrameForge is a browser studio that turns a short story into a finished, voiced 9:16 animated film (up to 60 s,
1080 × 1920, H.264 + AAC). Everything runs in the buyer's browser: the 3D renderer, the voices (Kokoro-82M), the music
and effects, and the MP4 encoder. No server, no API keys, no cost per video.

**One project, one branch.** Since 2026-11-09 everything lives on `main`: the V6 studio (M1–M6) and the Hybrid
Creator (P0–P14) were merged in PR #20. What happens next is in [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md).
New to the repo (person or agent)? Start at [CONTINUE_HERE.md](CONTINUE_HERE.md).

## The product

| Page | What it is |
|---|---|
| `index.html` | Landing page. Its buttons open the Creator; the example episodes are one click away. |
| `creator.html` | **The Creator**: write a story, pick a cast, set and time of day, direct each shot (speaker, line, emotion, action, camera, lens, prop, on-set screen, sound), voice it and export a checked MP4. Autosave, undo/redo, project files. |
| `studio.html` | The V6 studio: the two finished example episodes (DEV, BLUE and ORANGE) with the script box, editor and export. |
| `credits.html` | Open-source parts and their licences. |
| `hybrid-preview.html` | The Creator's render engine (loaded by `creator.html` in a frame). |
| `beta.html` | The beta preview guide. |

Internal pages that never ship (see `.vercelignore`): `asset-lab.html`, `character-lab.html`, `review.html`.

## How the code fits together

One project format with two renderers:

- **`frameforge.project/2`** (the Creator): `src/hybrid-project-core.js` validates it; `src/hybrid-providers.js` builds
  a session from actor and world providers; `src/ember-*.mjs` draw the cast and worlds in three.js;
  `src/hybrid-direction.js` places cameras; `src/hybrid-voice.mjs` + `src/kokoro-worker.js` voice the lines;
  `src/hybrid-browser-export.mjs` encodes the MP4 (WebCodecs + Mediabunny) and checks it;
  `src/hybrid-editor-*.mjs` are the editor and its storage (IndexedDB + recovery).
- **`frameforge.project/1`** (the V6 episodes): `src/project-core.js`, rendered by `studio.html`. A v1 file can be
  upgraded to v2 (`upgradeLegacyProject`); a v2 file that uses only V6 parts routes back to the V6 renderer.
- Shared: `src/sound-kit.mjs` (music and effects, synthesised), `src/episode-mix.mjs`, `src/kokoro-g2p.js`,
  self-hosted libraries in `vendor/` (three.js, ONNX Runtime Web, Mediabunny) with a CDN fallback.

Formats: [docs/PROJECT_FORMAT.md](docs/PROJECT_FORMAT.md) (v1), [docs/HYBRID_V2_CONTRACT.md](docs/HYBRID_V2_CONTRACT.md) (v2).

## Run it locally

```bash
python3 -m http.server 8080      # then open http://localhost:8080/creator.html in Chrome or Edge
```

The full voice model (~326 MB) or the light one (~92 MB) downloads once from Hugging Face. Local copies go in
`models/` (git-ignored).

## Tests

CI (`.github/workflows/`) runs on every push to `main`, `feature/**`, `claude/**` and `chore/**`, and on every pull
request into `main`:

- `project-contract.yml`: the 7 quality jobs (source and project tests, real character renders, voice and mix, portable
  video export, the Creator's native HD export, beta usability on desktop and a 390 px viewport, rigged import).
- `hybrid-creator-extended.yml`: the full 35 s film made in the Creator on Windows Chrome and decoded frame by frame.
- `hybrid-creator-windows.yml`: real Kokoro voice in the Creator and a 1080 × 1920 native export on Windows.
- `release-e2e.yml`: the V6 release test on Windows Chrome/Edge and macOS (manual publishing from `main` only).

Run locally: Node 22+, Python 3, ffmpeg, and `npm install --no-save playwright@1.56.1 && npx playwright install chromium`.
Source tests: `node tests/<name>.test.*`. Browser tests: `node tests/<name>-browser.cjs` (most start their own server;
the rest need `python3 -m http.server 8959`, as in the workflow).

## Deploying

No Vercel project is connected to GitHub, so a merge never deploys anything. Every deploy is a deliberate, manual step:

| Vercel project | URL | Serves | How |
|---|---|---|---|
| `frameforge-v6` | https://frameforge-v6.vercel.app | V6 (`2b78e60`) | `tools/deploy-v6.sh` (stages a copy outside the repo) |
| `frameforge-hybrid-beta` | SSO-protected preview URLs | the Creator, for testing | staging deploys of tested commits |
| `frameforge-3d-director-preview` | protected | V5 landing (legacy) | **never deploy**; the repo's `.vercel/` link points here, so never run `vercel` inside the repo |

Rules for production are in [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) (phase 0).

## Docs

- [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md): where the product is going, phase by phase.
- [docs/COMMERCIAL_RELEASE_GATES_2026-11-03.md](docs/COMMERCIAL_RELEASE_GATES_2026-11-03.md): the release checklist.
- [docs/releases/](docs/releases/): one note per finished V6 step (M2–M6).
- [docs/HYBRID_35S_REAL_FILM_AUDIT.md](docs/HYBRID_35S_REAL_FILM_AUDIT.md), [docs/HYBRID_DELIVERY_VERIFICATION.md](docs/HYBRID_DELIVERY_VERIFICATION.md): film audits.
- [STYLE.md](STYLE.md): the look. [AGENTS.md](AGENTS.md): engineering rules.
- [docs/history/](docs/history/): earlier handoffs, plans and V3–V5 notes. Kept for the record; not current.

Older snapshots: tag `v3.0-stable` (V3), and the `archive/*` tags for retired experiment branches.
