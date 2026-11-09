# M6.4 · A light voice model next to the full one

## What changed
- **Voices → Voice model** offers two models:
  - **Full quality:** Kokoro-82M v1.0, `onnx/model.onnx`, 326 MB; WebGPU or WebAssembly;
  - **Light:** the same model quantized to 8 bits, `onnx/model_quantized.onnx` from the same pinned Hugging Face
    revision `1939ad2a`, 92 MB; WebAssembly only (WebGPU runs quantized models poorly).
- **The choice is kept per browser.** Switching starts a fresh voice worker with the other model and voices the
  episode's lines again.
- **Lines are cached per model** (the model id is in the cache key), so lines voiced by the two never mix.
- **The download size shown** in the button and the status follows the chosen model. The landing FAQ mentions both.

## Measured (GitHub Actions, Chrome on Linux, WebAssembly; `tests/voice-model-browser.cjs`, run 173)
| | full | light |
|---|---|---|
| model download | 325.5 MB | 92.4 MB |
| engine load (download + start) | 33 s | 34 s |
| DEV "Our app takes twelve seconds to load." (worried) | 2.12 s long, voiced in 9.1 s, RMS −19.3 dB | 2.14 s, 10.8 s, −19.4 dB |
| BLUE "I can make it instant!" (happy) | 1.42 s, 6.4 s, −18.2 dB | 1.43 s, 7.0 s, −18.3 dB |
| ORANGE "Technically, retention is perfect." | 2.51 s, 9.6 s, −17.7 dB | 2.51 s, 10.9 s, −17.7 dB |

- **Same timing and level:** the light model says the same lines in the same time (within 0.02 s) at the same level.
- **Not faster:** on this CPU it voiced each line 10–20% *slower*. It saves download, not time.
- **Sound:** I can't judge it. The WAVs are the artifact `frameforge-voice-model-samples` of run 173
  (https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41273712427/artifacts/13069529694): `full-*.wav`
  and `light-*.wav` for each character, plus `summary.json`. **Listen before recommending Light to buyers.** Full
  stays the default.

## Tests
`tests/voice-model-browser.cjs` (new, CI voice job):
- downloads both models;
- checks the light one runs on WebAssembly;
- voices the three lines with each, checking length, level and that it's speech;
- checks the light model is under 40% of the full one's size and the timing matches;
- uploads the WAVs.

## Rollback
Revert this commit and M6.4 part 1: the Voices panel loses the model menu; the worker always uses `model.onnx`.
