# M2.2 · Emotion in the voice

Each line is now spoken with its speaker's emotion in that shot (`cast.<speaker>.emotion`), in the browser and in the
offline Python renders. Changing the speaker's emotion in the Shot inspector re-voices that line and re-times its shot;
a listener's emotion stays on their face only.

## How
Kokoro has no emotion input. Measured on `am_michael` and `af_bella`, ending a line with `!`, `…` or `?` moves its pitch
by under 0.5 semitone, and scaling the style vector only moves the voice's register. So `src/voice-emotion.js` shapes
the delivery around the model:

| emotion | Kokoro speed | pitch | range | end of line | tremor | brightness | loudness |
|---|---|---|---|---|---|---|---|
| neutral | ×1 | 0 | ×1 | 0 | 0 | 0 dB | 0 dB |
| happy | ×1.05 | +1.5 st | ×1.3 | +0.5 st | 0 | +1.5 dB | +1 dB |
| surprised | ×1.06 | +2.5 st | ×1.45 | +2 st | 0 | +2 dB | +2 dB |
| angry | ×1.05 | +0.5 st | ×1.35 | −0.5 st | 0 | +3 dB | +3 dB |
| worried | ×1.06 | +1 st | ×0.8 | +0.5 st | 0.35 st | 0 dB | −1 dB |
| sad | ×0.88 | −1.5 st | ×0.6 | −1.5 st | 0 | −3 dB | −3 dB |
| thinking | ×0.92 | −0.5 st | ×0.85 | 0 | 0 | −1 dB | −2 dB |

Pitch is reshaped with TD-PSOLA (our own code), which keeps the line's length and timbre: the spectral envelope stays
put, where plain resampling would shift it by about 17%. At the original pitch the PSOLA rebuilds the line sample for
sample. Neutral lines skip all of it, and they keep their M2.1 cache key, so they're bit-identical to M2.1.
`tools/voice_lines.py` runs the same file through `tools/voice-emotion.mjs`.

## Measured (DEV, "Twelve seconds is far too slow for our users.", compared with neutral)
Browser: happy +1.1 st, +1.5 LU; surprised +2.4 st; angry +2.7 LU; sad −1.8 st, ×1.09 longer, −2.4 LU; thinking −0.8 st.
Offline Python: happy +1.4 st, sad −1.9 st, angry +2.6 LU. These numbers come from the tests, not from listening;
the delivery still needs to be judged by ear.

## Tests
- `node tests/voice-emotion.test.cjs`: no model, in CI.
- `tests/voice-emotion-browser.cjs`: real model; set `FRAMEFORGE_EMOTION_OUT=dir` to keep every take and a screenshot.

## Rollback
Revert this commit. Lines cached with an emotion use their own cache keys and are simply never asked for again.
Neutral lines and the shipped episodes' mastered audio (`audio/*/mix.mp3`) are unchanged: those episodes are not
re-rendered. Running `tools/build-audio.mjs` on an episode now re-voices its emotional lines.
