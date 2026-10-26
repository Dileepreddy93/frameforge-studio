# M4.4 · Licence and asset audit

## Your decision on the AAC encoder: Opus fallback (2026-10-26)
`@mediabunny/aac-encoder` (a WASM build of FFmpeg's LGPL-2.1+ AAC encoder) is gone from the studio and from the
offline cache. The MP4 export now uses AAC where the browser's WebCodecs encodes it (Chrome and Edge on Windows and
macOS, Safari), and **Opus audio in the MP4** where it doesn't. If neither is available, it says so and suggests
Chrome or Edge. The status line names the audio codec when it's Opus.

What this means in practice:
- **Chrome on Linux has no WebCodecs AAC encoder** (measured on this machine). Before this step, every export here
  loaded the LGPL encoder; now these exports carry Opus. Playwright's Chromium (CI) is the same.
- Opus in MP4 plays in Chrome, Edge, Firefox and VLC. Some Apple players and upload pipelines want AAC.
- **Known difference:** Chrome's WebCodecs Opus keeps both channels (a hard-panned test tone comes back at
  −13.5 / −27.5 dB, as sent) but narrows the music's faint stereo. On an edited cut, side/mid energy went from 1.1e-3
  (AAC) to 1.6e-5 (Opus). The music's side signal sits 36 dB under the centre, and the voice is mono. ffmpeg's
  libopus keeps it (1.2e-3), so it's Chrome's encoder settings. Setting `application:'audio'`, `signal:'music'` and
  `complexity:10` through mediabunny's `onEncoderConfig` didn't change it, so I stopped after three attempts. Listen
  to `proof/v6/M4.4/` to judge whether it matters.

## Runtime: what a buyer's browser loads
| Component | Version / source | Licence | Notes |
|---|---|---|---|
| three.js | 0.180.0, jsDelivr | MIT | unmodified |
| ONNX Runtime Web | 1.30.0, jsDelivr (`ort.webgpu.bundle.min.mjs`, `ort-wasm-simd-threaded.asyncify.wasm`) | MIT | unmodified |
| Mediabunny | 1.62.1, jsDelivr | MPL-2.0 | unmodified, so only the notice is required (credits page); modified files would have to be published |
| Kokoro-82M v1.0 (ONNX) | Hugging Face `onnx-community/Kokoro-82M-v1.0-ONNX` @ `1939ad2a`, downloaded by the browser | Apache-2.0 | not redistributed by us |
| misaki dictionaries + rules port | `assets/voice/`, from `hexgrad/misaki` @ `fba12365` | Apache-2.0 | `NOTICE.md` and `LICENSE-misaki.txt` ship with the site |
| Archivo, Hanken Grotesk, Martian Mono | Google Fonts (landing page only) | SIL OFL 1.1 | |
| Studio caption and screen fonts | the system's sans and mono fonts | — | nothing shipped |
| H.264 video, AAC audio | the browser's own WebCodecs encoders | — | not shipped by us |

No GPL or LGPL code runs in the buyer's browser any more: eSpeak was already out (M2.3) and kokoro-js was never
used.

## Assets in the repository
| Asset | Licence / provenance | Ships to buyers? |
|---|---|---|
| `media/v5/*` (reels, posters, cast cards) | our own renders (M4.2/M4.3), with our synthesised music and effects (`src/sound-kit.mjs`, no samples) | yes |
| `audio/*/mix.mp3`, `voice.mp3` | our Kokoro lines (Apache-2.0 model; output unrestricted) and synthesised score | yes |
| `design/*` model sheets, `projects/*` | our own | yes |
| `assets/rigged-samples/AraAthleticMan.glb` | MakeHuman CC0 base, Ara 3D Gen (MIT). Its **CMU motion-capture-derived clips carry a no-resale restriction** | **no** (now in `.vercelignore`) |
| `assets/rigged-samples/CesiumMan.glb` | CC BY 4.0, © 2017 Cesium, includes the Cesium mark | **no** |
| `assets/v5-art-evidence/*`, `media/v5-evidence/*`, `media/v4-review/*` | our own V4/V5 renders (old look) | no: evidence only |
| `media/zero-latency-acting-v3-with-foley.mp4`, `media/zero-latency-stereo-foley-v2.ogg`, `dialogue.ogg`, `dialogue42.ogg`, `master42.ogg` | V3. **The source of the Foley and voices isn't documented anywhere in the repo** | **no** |

Build-time only (never shipped): ffmpeg (makes our media files), Playwright (Apache-2.0), kokoro-onnx (MIT),
soundfile (BSD-3), and in the `.venv` `phonemizer` (GPL-3.0) and `espeakng-loader` (GPL-3.0 eSpeak NG). The last
two are kokoro-onnx dependencies that our renders bypass: `tools/voice_lines.py` passes phonemes from
`tools/phonemize.mjs`.

## Changes in this step
- `studio.html`: the export picks AAC or Opus, with no LGPL encoder. The header link "Rigged character lab ↗"
  (which loaded the no-resale Ara rig) is now **"Credits & licences"**. The collapsed "Previous version · V3 film"
  panel, whose sound has no documented source, is removed.
- `credits.html` (new): every open-source part with its licence and source, linked from the studio header and the
  landing page footer, and kept offline by `sw.js`.
- `sw.js`: cache `frameforge-shell-v3` (the AAC encoder is no longer kept; `credits.html` is).
- `.vercelignore`: internal labs (`asset-lab.html`, `character-lab.html`, `review.html`), the research rigs, the
  V3–V5 evidence media, `docs/`, `tests/`, `tools/`, `spec/`. They stay in the repo for our tests and history.
- Tests: new `tests/export-codec-browser.cjs` (in CI): exports as the browser is, then with AAC encoding switched off;
  checks the file's codec, Opus stereo and sound, the status text, and that the AAC encoder is never requested.
  `episode-mix-browser` holds Opus to "left and right not identical" (see above), and `offline-episode-browser`
  reads the v3 cache. `tests/cdn-mirror.cjs` no longer maps the AAC encoder.

## Proof (`~/Desktop/Animate/proof/v6/M4.4/`)
`export-as-is-linux-chrome.mp4` (Opus, this machine) and `export-forced-no-aac.mp4`: 1.5 s studio exports.

## Tests
Unit tests (12), `export-codec`, `episode-mix`, `offline-episode`, `studio-editor`, `landing`, `determinism`,
`phase0-video-playback`.

## Rollback
Revert this commit. The AAC encoder path, the lab link and the V3 panel come back. Browsers keep the v3 cache until
the old worker installs again and deletes it.
