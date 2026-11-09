# Phase 1 · One product, one front door

**What changed**
- **DEV, BLUE and ORANGE are Creator cast.** They are three new templates in `src/ember-actor-provider.mjs`, rebuilt in
  the Creator's style from the V6 palette in `STYLE.md` and `design/robot-forms.js`:
  - DEV: human, round glasses, teal hoodie, warm-brown skin, black hair.
  - BLUE: a blue bot with a light-blue face.
  - ORANGE: an orange box-headed robot with an amber face.
  - They are rendered and tested like the other six (`tests/hybrid-p2-characters-browser.cjs`: 4 views and 8 emotions each).
- **The V6 episodes are Creator templates.** `fromEpisode()` in `src/hybrid-editor-core.js` turns a
  `frameforge.project/1` episode into a Creator project:
  - Every line, speaker, emotion, action, sound effect, score cue, reaction and screen insert carries over.
  - Cameras map to Creator cameras. The set is the studio desk at night.
  - The Creator's *Start from…* menu lists both episodes, and *Open project* accepts V6 episode files.
  - `creator.html#start=<file>` opens an episode directly.
- **All 20 English Kokoro voices** are in the cast picker, with readable names. It used to offer 4.
- **The landing page is about the Creator:**
  - New copy: how a film is made, the cast, an honest FAQ including export time and phones.
  - Cast cards are rendered in the Creator.
  - *Remake an example episode* opens Zero Latency in the Creator.
  - The reels are still the V6 renders, and the page says so.
- **`studio.html`** stays for old links and old saved work. Its header now says it is the earlier studio and links to
  the Creator.
- **Credits:**
  - Ember Take Studio (MIT, Copyright (c) 2026 Ember Take contributors), the source of the Creator's character and
    world engines and its screen apps, which were missing from the page.
  - The three.js add-ons the Creator uses.
  - The Creator cast and the lantern.
- **New tool** `tools/creator-stills.cjs`: renders stills of any Creator project with the real engine, for reviews.

**Tests:** `tests/creator-templates-browser.cjs` (new, in the `hybrid-beta-usability` job):
- the menu, both templates and the cast panel
- a real render
- opening a V6 file
- the `#start=` link

The landing, P2 cast and P7 Creator tests were updated and pass locally.

**Not done in this phase:**
- `beta.html` stays as the Creator's guide page; it has its own CI test (`hybrid-p9-beta-browser.cjs`).
- New reels made in the Creator wait for phase 2, so they show the fixed look.

**Seen while doing it, for phase 2:**
- Close-ups crop the top of the head.
- Blinks push skin-coloured lids out of the face, so mid-blink frames look sleepy.
- The "screen" shots don't make the monitor the hero.
