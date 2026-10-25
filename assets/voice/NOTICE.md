# In-browser voices: third-party notices

## Pronunciation dictionaries (`en-us-lexicon.json`, `en-gb-lexicon.json`)
From **misaki** by hexgrad (https://github.com/hexgrad/misaki), commit `fba1236595f2d2bf21d414ba6e57d25256afada3`,
files `misaki/data/us_gold.json` and `misaki/data/us_silver.json` (American), `misaki/data/gb_gold.json` and
`misaki/data/gb_silver.json` (British). Licensed under the Apache License 2.0
(`LICENSE-misaki.txt`). Changes: each dialect's two files merged into one JSON file, and silver entries that repeat a gold
entry removed (`tools/build-voice-lexicon.mjs`).

`src/kokoro-g2p.js` is a JavaScript port of the dictionary rules in misaki's `misaki/en.py` (same licence).
It does not use eSpeak NG or any other GPL code.

## Downloaded by the buyer's browser (not stored in this repository)
- **Kokoro-82M v1.0** voice model and voices by hexgrad, ONNX export by onnx-community
  (https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX, revision `1939ad2a8e416c0acfeecc08a694d14ef25f2231`):
  Apache License 2.0.
- **ONNX Runtime Web 1.30.0** by Microsoft (https://github.com/microsoft/onnxruntime): MIT License.
