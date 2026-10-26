# M4.1 · The finished episodes, re-voiced

Zero Latency and Dark Mode were mastered before M2.2–M2.4. Re-running `node tools/build-audio.mjs` on each now voices
every line with its speaker's emotion in that shot (M2.2), the studio's own pronouncer with British English for
ORANGE (`bm_george`, M2.3) and each shot's pace (M2.4). Each shot is then re-timed to its new line, and the score
and sound cues move with the shots. `src/voice-emotion.js` was not changed: tuning waits for your ears.

Both episodes got about 3% shorter (the emotion paces are mostly ×1.05–1.06): Zero Latency 38.10 → 36.97 s,
Dark Mode 33.67 → 32.50 s.

## How it was measured
`.venv/bin/python -I tools/audio-report.py <before-dir> projects/<id>.frameforge.json <out-dir>` (new in this step):
- line and shot lengths from the line manifests and the episode;
- loudness and true peak with ffmpeg's `ebur128=peak=true` (whole master; per line for the Δ LU column);
- pitch as the median f0 of voiced frames (autocorrelation). It is rough (±0.3 st) and compares with the old
  neutral take, which also used a different pronouncer (eSpeak), so read it as direction, not as a measurement
  of the emotion alone;
- music cues placed the way `build-audio.mjs` places them, checked against their shot and line.

### zero-latency: 38.1 s → 36.97 s
Master (mix.mp3): -14.0 → **-13.9 LUFS**, true peak -1.9 → **-1.7 dBTP**.

| shot | who | emotion | line | old s | new s | Δ s | shot old → new | Δ LU | Δ pitch (st) |
|---|---|---|---|---|---|---|---|---|---|
| 01 | dev | worried | Our app takes twelve seconds to load. | 2.17 | 2.12 | -0.05 | 2.67 → 2.63 | -1.1 | +0.4 |
| 02 | blue | happy | I can make it instant. | 1.45 | 1.43 | -0.02 | 1.93 → 1.93 | +0.9 | +1.1 |
| 03 | dev | worried | Without breaking anything? | 1.56 | 1.49 | -0.07 | 2.33 → 2.23 | -0.6 | +1.0 |
| 04 | blue | surprised | Define anything. | 1.11 | 1.11 | +0.00 | 1.80 → 1.80 | +1.7 | +2.4 |
| 05 | orange | worried | Backup created. Emotionally. | 2.34 | 2.25 | -0.10 | 2.83 → 2.73 | -1.0 | +1.3 |
| 06 | dev | happy | Okay. One tiny change. | 1.89 | 1.61 | -0.28 | 2.40 → 2.10 | +0.5 | +1.0 |
| 07 | blue | happy | Done. Zero milliseconds. | 1.68 | 1.67 | -0.01 | 2.43 → 2.43 | +0.8 | +1.1 |
| 08 | dev | happy | Wow! The screen opens immediately. | 2.23 | 2.01 | -0.23 | 3.10 → 2.87 | +0.4 | +1.3 |
| 09 | orange | angry | It no longer requests data. | 2.31 | 2.27 | -0.03 | 3.17 → 3.13 | +3.0 | +0.9 |
| 10 | dev | worried | What about the customers? | 1.46 | 1.37 | -0.09 | 2.27 → 2.20 | -0.3 | +0.3 |
| 11 | blue | happy | Also removed. No more waiting. | 2.03 | 1.94 | -0.09 | 2.63 → 2.53 | +1.0 | +1.5 |
| 12 | dev | angry | You deleted the users? | 1.55 | 1.55 | +0.00 | 2.47 → 2.47 | +2.7 | +1.1 |
| 13 | orange | happy | Technically, retention is perfect. | 2.60 | 2.46 | -0.13 | 3.40 → 3.27 | +1.0 | +1.7 |
| 14 | dev | worried | Because nobody can leave. | 1.70 | 1.70 | -0.01 | 4.67 → 4.63 | -0.9 | +0.6 |

| music cue | shot | when | old start | new start | in its shot | after the line |
|---|---|---|---|---|---|---|
| groove | 01 | shotStart | 0.00 | 0.00 | yes | yes |
| stop | 09 | shotStart | 19.50 | 18.73 | yes | yes |
| tension | 10 | shotStart | 22.67 | 21.87 | yes | yes |
| stop | 14 | shotStart | 33.43 | 32.33 | yes | yes |
| sting | 14 | afterLine | 35.39 | 34.28 | yes | yes |

| sound | shot | at (s into shot) | line ends at | shot length | inside the shot |
|---|---|---|---|---|---|
| typing | 01 | 0.00 | 2.27 | 2.63 | yes |
| pop | 04 | 0.15 | 1.26 | 1.80 | yes |
| typing | 06 | 1.20 | 1.76 | 2.10 | yes |
| whoosh | 07 | 0.00 | 1.82 | 2.43 | yes |
| chime | 07 | 0.25 | 1.82 | 2.43 | yes |
| whoosh | 09 | 0.00 | 2.42 | 3.13 | yes |
| buzz | 09 | 0.30 | 2.42 | 3.13 | yes |
| zap | 11 | 0.95 | 2.09 | 2.53 | yes |
| scratch | 12 | 0.00 | 1.70 | 2.47 | yes |

### dark-mode: 33.67 s → 32.5 s
Master (mix.mp3): -14.0 → **-13.9 LUFS**, true peak -2.0 → **-1.6 dBTP**.

| shot | who | emotion | line | old s | new s | Δ s | shot old → new | Δ LU | Δ pitch (st) |
|---|---|---|---|---|---|---|---|---|---|
| 01 | dev | worried | Users keep asking for dark mode. | 2.20 | 2.12 | -0.08 | 2.70 → 2.63 | -0.9 | -0.3 |
| 02 | blue | happy | Dark mode is my favorite mode. | 1.94 | 1.71 | -0.23 | 2.43 → 2.20 | +0.7 | +1.5 |
| 03 | dev | happy | Great. Just make the app darker. | 1.96 | 1.84 | -0.12 | 2.67 → 2.53 | +0.8 | +1.9 |
| 04 | orange | neutral | How dark? | 1.08 | 1.05 | -0.03 | 1.83 → 1.80 | -0.6 | -0.3 |
| 05 | dev | neutral | Easy on the eyes. Nothing fancy. | 2.46 | 2.39 | -0.07 | 2.97 → 2.90 | -0.1 | +0.0 |
| 06 | blue | happy | Done. Maximum darkness achieved. | 2.19 | 2.03 | -0.15 | 2.93 → 2.77 | +0.5 | +1.5 |
| 07 | orange | neutral | The screen is now completely black. | 2.58 | 2.59 | +0.01 | 3.43 → 3.43 | +0.0 | -0.1 |
| 08 | dev | surprised | I can't see anything. | 1.39 | 1.34 | -0.05 | 2.20 → 2.13 | +1.3 | +2.4 |
| 09 | blue | happy | Exactly. No more eye strain. | 1.95 | 1.75 | -0.21 | 2.60 → 2.40 | +0.9 | +1.2 |
| 10 | dev | worried | Can you add a little light? | 1.61 | 1.56 | -0.05 | 2.27 → 2.20 | -1.0 | -0.4 |
| 11 | orange | happy | I added one pixel. It is very proud. | 2.98 | 2.86 | -0.12 | 3.87 → 3.77 | +0.9 | +1.7 |
| 12 | dev | worried | Ship it. | 0.83 | 0.77 | -0.06 | 3.77 → 3.73 | -0.1 | -0.1 |

| music cue | shot | when | old start | new start | in its shot | after the line |
|---|---|---|---|---|---|---|
| groove | 01 | shotStart | 0.00 | 0.00 | yes | yes |
| stop | 07 | shotStart | 15.53 | 14.83 | yes | yes |
| tension | 08 | shotStart | 18.97 | 18.27 | yes | yes |
| stop | 12 | shotStart | 29.90 | 28.77 | yes | yes |
| sting | 12 | afterLine | 30.98 | 29.79 | yes | yes |

| sound | shot | at (s into shot) | line ends at | shot length | inside the shot |
|---|---|---|---|---|---|
| typing | 01 | 0.00 | 2.27 | 2.63 | yes |
| chime | 06 | 0.30 | 2.18 | 2.77 | yes |
| whoosh | 07 | 0.00 | 2.74 | 3.43 | yes |
| buzz | 07 | 0.40 | 2.74 | 3.43 | yes |
| scratch | 08 | 0.00 | 1.49 | 2.13 | yes |
| pop | 11 | 0.90 | 3.01 | 3.77 | yes |

## Results
- Loudness: both masters measure −13.9 LUFS (target −14; `build-audio`'s own loudnorm pass reads −14.36 and
  −14.30, as the two meters differ by about 0.4 LU on these files). True peak −1.7 and −1.6 dBTP, under −1.
- Every music cue still starts in its own shot, and both closing stings still come after DEV's last line. They all
  move earlier by the time the earlier shots lost (up to 1.2 s). Every sound effect still falls inside its shot.
- The emotional lines move the way the M2.2 table says: angry +2.7 to +3 LU, surprised +2.4 st, happy +1 to +1.9 st.
  **DEV's worried lines barely move** (−0.4 to +0.6 st against the old neutral take, −0.9 to −1.1 LU). They may
  sound almost neutral. That is the first thing to check by ear.

## Proof (outside the repo: `~/Desktop/Animate/proof/v6/M4.1/<id>/`)
- `before/`: the old line WAVs, `lines.json`, `mix.mp3`, `voice.mp3` and the old episode file.
- `after/`: the new line WAVs, `mix.mp3` and `voice.mp3`.
- `ab-lines.wav`: every line, old then new, in shot order.
- `report.md`, `report.json`: the tables above.

## Tests
Unit tests (12) plus `episode-mix-browser`, `offline-episode-browser`, `episode-data-browser` and
`determinism-browser`. They read the durations from the episode files, so none needed new numbers.
(`tests/phase0-frame-evidence.test.mjs` is an old V4 tool that needs a manifest path argument; it isn't a unit test.)

## Rollback
`git checkout <commit before this one> -- audio/zero-latency/mix.mp3 audio/zero-latency/voice.mp3 audio/dark-mode
projects/zero-latency.frameforge.json projects/dark-mode.frameforge.json`. The per-line WAVs (`audio/*/lines/`) are
gitignored, so git doesn't keep the old ones. They are in the proof folder's `before/`: copy them back to
`audio/<id>/lines/` (with `lines.json`) and `build-audio.mjs` will treat them as stale and voice them again, so
restore the committed `mix.mp3`/`voice.mp3`/project rather than re-running it.
