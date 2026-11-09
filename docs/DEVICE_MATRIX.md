# Device matrix (plan phase 4)

Automated runs cover browser **engines** on CI machines (no GPU) in `.github/workflows/cross-browser.yml`. This
page is for the part only a person with the real device can do. Fill in one row per device, and keep the exported
films and problem reports in `~/Desktop/Animate/proof/devices/<device>/`.

## The path to check on every device
1. Open the landing page, then *Make your own film*. The Creator opens and the scene renders.
2. *Start from… → Zero Latency*. Note how long the voice model takes to download the first time.
3. *Generate English speech*. Note how long it takes.
4. *Estimate export time* at 720p and at 1080p. Write both down.
5. Export the full film at 720p. Note the real time and compare it with the estimate.
6. Play the MP4 in the phone's gallery or player, and upload it to Instagram/YouTube as a draft.
7. Start an export, then cancel it. Export again.
8. Refresh mid-edit: the edit is still there. Turn off the network and reload: the Creator still works.
9. Open the Creator in a second tab: it says it's open in another tab.
10. If anything fails: *Report a problem*, then download the report.

## Results

| Device | Browser | Creator opens | Voices (first run / again) | Estimate 720p / 1080p | Real 720p export | Plays in gallery / upload | Notes |
|---|---|---|---|---|---|---|---|
| Windows laptop, integrated GPU (8 GB) | Chrome | | | | | | |
| Windows laptop, integrated GPU (8 GB) | Edge | | | | | | |
| MacBook (Apple silicon) | Chrome | | | | | | |
| MacBook (Apple silicon) | Safari | | | | | | |
| Mid-range Android phone | Chrome | | | | | | |
| iPhone | Safari | | | | | | |
| Linux laptop | Chrome | | | | | | Chrome on Linux has no AAC encoder: audio will be Opus |
| Linux laptop | Firefox | | | | | | |

## Known from automated runs (2026-11-09)
- **Chromium (open-source build, Linux):** the Creator works, but it has no H.264 encoder, so export is refused with
  a clear message. Branded Chrome and Edge have H.264.
- **Firefox 142 on Linux:** the Creator works and H.264 encoding works; there's no AAC encoder. A real 2-second
  export gave a verified H.264 + Opus MP4, and the Creator shows a note that some Apple apps may not play Opus.
- **No WebGL** (hardware acceleration off): the Creator says so and says what to do. No crash.
- **WebKit 26 on macOS (Safari's engine, CI run on PR #23):** the Creator boots and renders, and it has WebGL 2,
  H.264 at 720p and 1080p, and AAC. So standard MP4 export should work in Safari. Real Safari on a Mac and on an
  iPhone still needs a person to confirm.
- **Chromium on macOS (open-source build):** boots; AAC yes, H.264 no. Branded Chrome has H.264.
- **Firefox 142 on Windows:** boots; H.264 yes, AAC no. Export uses Opus audio.
