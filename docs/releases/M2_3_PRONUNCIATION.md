# M2.3 · Pronunciation

The scope is mine: your TODO's text for M2.3 isn't in the repo. It covers the pronunciation problems listed at M2.1.

- **British voices read British English.** ORANGE (`bm_george`) and the other `b*_` voices use misaki's GB
  dictionaries and its British rules (`ɪ` in -s and -ed endings, no flapped t). Words we have to guess are made
  non-rhotic. On 15 reference lines our British output is identical to misaki 0.9.4 with `british=True`.
- **Episode pronunciations.** A new optional `pronunciations: [{word, sayAs}]` field in the episode. `sayAs` can be
  a respelling with the stressed syllable in capitals (`koh-KOR-oh`), plain words (`co core oh`) or Kokoro phonemes
  between slashes. Under Voices, "+ Add a pronunciation" starts from a word the voices had to guess. A change
  re-voices only the lines that use the word, and the list is saved with the episode.
- **Offline renders use the studio's pronouncer.** `tools/voice_lines.py` gets its phonemes from
  `tools/phonemize.mjs`, which uses the same `src/kokoro-g2p.js` file as the browser, and Kokoro reads them directly.
  eSpeak is no longer involved. `build-audio.mjs` re-voices a line when its phonemes change.

## Measured
- A three-line storyboard: the browser and offline phonemes are identical for every line. Line lengths are within
  0.06 s of each other (2.92 vs 2.95 s, 3.19 vs 3.20 s, 1.15 vs 1.08 s). kokoro-onnx still adds its own short
  pauses at sentence and clause breaks.
- ORANGE before and after: "colour" was kˈʌləɹ and is now kˈʌlə, and "theatre" is now θˈɪətə.

## Tests
- `node tests/kokoro-g2p.test.cjs`: 25 American and 15 British misaki reference lines, plus respellings,
  pronunciation lists and dialect choice.
- `tests/pronunciation-browser.cjs`: real model; set `FRAMEFORGE_PRONUNCIATION_OUT=dir` to keep the episode and
  the offline lines.

## Rollback
Revert this commit. American lines keep their cache keys. British lines and lines that use a pronunciation get new
keys, so they're voiced again. Shipped episodes aren't re-rendered: running `tools/build-audio.mjs` on one now
re-voices it with the new pronouncer.
