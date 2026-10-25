# M2.4 · Line timing in the editor

The scope is mine: your TODO's text for M2.4 isn't in the repo.

The Shot inspector has a new **Timing** section with three controls:
- **Before the line** (0–1.5 s) and **Pause after** (0–2 s) set `timing.lead` and `timing.pauseAfter`. The cut is
  re-timed from the cached lines, so nothing is re-synthesised.
- **Line pace** (×0.8–1.25) is a new `timing.pace` (0.7–1.4 in the format). It multiplies the character's speed and
  the emotion's pace, re-voices that line only, and the shot shrinks or grows to fit.

The downloaded episode now saves each shot's timing; before this, timing edits were lost. Only values that differ
from the defaults (0.15 s, 0.35 s, ×1) are written. `tools/voice_lines.py` speaks at the shot's pace and records it,
and `build-audio.mjs` re-voices a line when its pace changes.

## Measured
A DEV line at ×1 lasts 2.92 s; at ×1.2 it lasts 2.54 s in the browser and 2.56 s offline. With a 0.6 s lead and a
1 s pause, the shot goes from 3.43 s to 4.53 s, and then to 4.13 s at ×1.2.

## Tests
`tests/line-timing-browser.cjs` (real model) checks re-timing from the cache, silence before the line and in the
pause, a new take at the new pace, the saved and reopened episode, and the offline render at the same pace.

## Rollback
Revert this commit. Episodes saved with `timing.pace` would then fail validation, so remove that key from them.
