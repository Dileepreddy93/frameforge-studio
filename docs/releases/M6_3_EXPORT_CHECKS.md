# M6.3 · Export: progress, cancel and a validation report for every MP4

## In the studio (`studio.html`, export)
- **Progress:** a bar, plus "Rendering frame 46 of 1109 (4%) · 1.8 frames/s · about 9 min 40 s left".
- **Cancel:** *✕ Cancel export* appears while exporting. It stops at the next frame, discards the half-written file
  (`Output.cancel()`) and says "Export cancelled. Nothing was saved." A failed export also says that nothing was saved.
  The next export starts cleanly.
- **The check.** Every finished MP4 is opened again with Mediabunny and compared with what was asked for:

  | check | passes when |
  |---|---|
  | Video track | the file has a video track |
  | Video codec | H.264 (`avc`) |
  | Size | the chosen size, e.g. 1080×1920 |
  | Frames | exactly the episode's frame count |
  | Frame rate | 30 fps (within 0.05) |
  | Video length | frames ÷ 30, within half a frame |
  | First and last frames decode | where the browser can decode H.264; otherwise reported as skipped, never as passed |
  | Audio track | present |
  | Audio codec | AAC, or Opus where the browser has no AAC encoder (Chrome on Linux) |
  | Audio channels / sample rate | stereo, 48 kHz |
  | Audio not cut short | the audio lasts the video's length, between 0.05 s shorter and 0.15 s longer (encoder padding) |

  The report also records the audio's peak and RMS level (and the mix loudness when voiced in the browser), the
  export time and the browser. It shows under the button ("✓ The MP4 checks out" or what failed) with *Download this
  report (JSON)*.

## In the offline renderer (`tools/render-episode.mjs`)
- **Report file:** every film gets `<name>.report.json` next to it, with the same checks from ffprobe, plus
  integrated loudness, loudness range and true peak (ffmpeg `ebur128`).
- **Failed checks fail the render:** it exits 1 and names the failed checks.

## Tests
- `tests/export-report-browser.cjs` (new):
  - a 45-frame export whose report passes every check (the decode check ran in Playwright's Chromium here);
  - a full-length 1109-frame export cancelled at about 4%, with the progress line, the message, and the progress bar
    and Cancel button gone;
  - a new export right after, which passes.
- `render-failure-browser` reads the 12-frame render's report: it passes, and loudness is measured.
- Unit tests and the full browser list pass; the new test runs in CI.

## Rollback
Revert this commit: exports without progress details, cancel or the check; the renderer without a report.
