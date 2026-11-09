# Phase 3 · Export speed: what was measured, what changed, what's still unknown

## Measured (2026-11-09, this repo's dev machine, headless Chromium, **software rendering: no GPU**)
`node tools/creator-bench.cjs <project> --frames 24` renders 24 frames spread over the film at 1080 × 1920, once per
variant, with one cost switched off each time (`HybridP56QA.perfProbe`).

| Variant | Snow "Lantern" film, p50 / p95 ms | Zero Latency (desk), p50 / p95 ms |
|---|---|---|
| everything on, first pass | 1530 / 3500 | 788 / 932 |
| everything on, second pass | 1493 / 1704 | 777 / 903 |
| no shadows | 1313 / 2695 | 800 / 902 |
| no sheen and clearcoat | 1447 / 1739 | 783 / 880 |
| no instanced meshes (grass, rocks, trees) | 1448 / 1656 | — |
| no particles (snow, stars) | 1503 / 1720 | — |

What it means:
- **No single cost dominates.** In software rendering, time follows pixels × shading for everything on screen.
  - Shadows are the biggest single item at about 12% outdoors.
  - Shiny materials, instanced foliage and particles cost 2–5% each.
- **The desk set costs half what the snow set does.**
- **p95 spikes are first-pass warm-up, not a material.** The first pass through each shot pays for texture uploads
  and the first drawing of screens; the second pass doesn't. (An earlier reading blamed sheen; the second-pass row
  shows that was wrong.)

## Changed
- **The outdoor ground** has 100 × 100 segments (was 200 × 200): a quarter of the vertices, with the same hills.
  That's about 5% of a snow frame.
- **Shaders compile when a project loads** (`warmShaders`). No measurable gain in software rendering. It's kept
  because a first-use compile stall is a real cost on GPUs, but it isn't counted as a win.
- **"Estimate export time" in the Creator** times 12 real frames at the chosen size **on the user's computer** and
  predicts the export, so nobody starts a 10-minute export by surprise.

## Not known yet (needs the phase 4 machines)
- Customers render on a GPU, where costs scale completely differently. The plan's targets (35 s at 720p in ≤ 2 min,
  1080p in ≤ 5 min on an integrated-GPU laptop) **have not been measured**.
- How to measure on a real machine:
  1. Open the Creator in Chrome and choose *Estimate export time* at 720p and at 1080p.
  2. Or run `node tools/creator-bench.cjs <project> --gpu`: the `--gpu` flag uses the machine's real GPU.
  3. Record the results in `docs/DEVICE_MATRIX.md`.
- Only after those numbers exist should shadows or materials be traded away for speed.
