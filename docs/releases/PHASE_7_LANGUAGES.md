# Phase 7 · Languages: English first (decided 2026-11-09)

**Done for English:**
- **All 20 English voices** in the pinned model are in the cast picker with readable names: 6 American women,
  8 American men, 2 British women and 4 British men. It used to offer 4.
- **British voices** are pronounced with the British dictionary, American voices with the American one
  (`src/kokoro-g2p.js`, `assets/voice/`).
- **Every character keeps its own voice** across the film, and the episode templates keep the V6 voices: DEV Michael,
  BLUE Heart, ORANGE George.
- **Subtitles** (phase 2) make every line readable without sound.

**Checked facts for later** (Hugging Face API, the exact pinned revision `1939ad2a`, 2026-11-09):
- **55 voices at this revision.** Besides English there are Spanish, French, Hindi, Italian, Japanese, Portuguese and
  Chinese voices (prefixes e, f, h, i, j, p, z).
- **Hindi:** 4 voices (`hf_alpha`, `hf_beta`, `hm_omega`, `hm_psi`), under Apache-2.0 like the model. To use them, the
  browser needs Hindi text-to-phoneme rules. The English dictionaries here don't cover Hindi, and upstream Kokoro uses
  espeak-ng for it, which is GPL. A browser-side Hindi front end needs its own licence check, then native-speaker
  listening tests.
- **Telugu:** no voice in this model. Options are another commercially licensed model that runs in the browser, or
  recorded lines (the v2 format already supports voice files per line).
- **Upstream English voices not offered yet:** a few (for example `af_sky`, `af_nova`). The local test model ships
  only 20, so the picker stays at the 20 that are tested.
