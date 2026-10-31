# M5.6 · Robustness: the renderer fails loudly, CI runs the M4 tests

## The renderer (`tools/render-episode.mjs`)
**Before:** when ffmpeg failed, the render crashed with a Node stack trace and left an empty MP4 at `--out` (M4.2
saw one exit 0 with an empty file). Reproduced with a fake ffmpeg that exits 1: exit 1, a stack trace, a 0-byte
`old.mp4` left behind.

**Now:**
- ffmpeg is checked before the browser starts (`ffmpeg -version`). If it's missing, the render stops with "ffmpeg is
  not available … install ffmpeg".
- Frames go to `<out>.partial-<pid>.mp4`. That file replaces `--out` only after ffprobe reads it back with the
  right frame count, size, 30 fps and an audio stream. On any failure the partial file is deleted, and an old file
  at `--out` is left as it was.
- Every ffmpeg failure ends the render: ffmpeg can't start, exits non-zero, is killed, or stops reading frames
  (EPIPE). The frame loop stops at once, and the render exits 1 with a one-line reason that names ffmpeg.
- `FRAMEFORGE_CDN_MIRROR=<folder>` serves the pinned CDN libraries from a local npm folder, like the browser tests
  (`tests/cdn-mirror.cjs`). Sandboxes that block cdn.jsdelivr.net can render without a preload hack.

`tests/render-failure-browser.cjs` (new) checks three cases:
- a fake ffmpeg that fails mid-render: non-zero exit, the reason names ffmpeg, no file and no partial file;
- no ffmpeg on `PATH`: the same;
- a real 12-frame render: exit 0, 12 frames, and an old file at `--out` replaced.

## CI (`.github/workflows/project-contract.yml`)
**Before:** the workflow failed on every push since M4.6 (runs 143–146, including M5.1 and M5.2). The
`export-codec-browser` step crashed with `SyntaxError: "undefined" is not valid JSON`: that job never installed
ffmpeg, so the test's `ffprobe` call returned nothing. The export itself was fine. The workflow also ran only on
`develop` and `feature/**`, so pushes to `claude/**` session branches were never checked. And several M4 tests were
never in it: `project`, `project-import-export`, `offline-episode`, `episode-mix`, and the `kokoro-g2p` unit test.

**Now:**
- The browser job installs ffmpeg and checks `ffprobe -version`.
- `export-codec-browser` (and its probe helper) fails with "ffprobe is needed … install ffmpeg" instead of a JSON
  error.
- A new step runs `project`, `project-import-export`, `offline-episode` and `render-failure`.
- A new job, `voice-and-mix-tests`, runs `episode-mix`. It downloads the Kokoro model (~326 MB) on each run.
- The unit job runs `kokoro-g2p.test.cjs` too.
- The workflow triggers on `claude/**` pushes and by hand (`workflow_dispatch`).

## Tests
Unit tests. Locally (cloud container, CDN mirror): `render-failure`, `export-codec`, `offline-episode`, `project`,
`project-import-export`, `studio-editor`. GitHub Actions: see "CI result" below.

## CI result
Run 147 (https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41219153365, the M5.6 commit on
`claude/serene-dijkstra-7u51a6`) passed all five jobs. It's the first green run since M4.3 (run 142):
- `source-and-project-tests`: all 12 unit tests, the planner tests included;
- `real-character-render-tests`: the browser list including `export-codec`, plus `project`,
  `project-import-export`, `offline-episode` and `render-failure`;
- `voice-and-mix-tests`: `episode-mix`, with the Kokoro model downloaded. It can't run in the cloud container;
- `portable-video-export`;
- `rigged-character-import`.

## Rollback
Revert this commit: the renderer writes straight to `--out` again, and the workflow goes back to its M4 form.
