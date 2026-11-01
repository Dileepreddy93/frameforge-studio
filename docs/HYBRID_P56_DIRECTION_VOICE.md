# FrameForge Ultimate — P5/P6 director, screen and voice engineering

**Branch:** `feature/hybrid-foundation`. **Production:** untouched. **State:** P5/P6 scripted/voice QA and three short H.264/AAC films PASSED, including one newly synthesized V2 Kokoro-English two-speaker movie; Indic voice, high-resolution release and V6 parity gates remain OPEN. Read `docs/HYBRID_MASTER_IMPLEMENTATION_PLAN.md` first for the live phase ledger.

## Verified P5/P6 milestone — 2026-11-01

[GitHub Actions 41299172423](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41299172423) passed the `source-and-project-tests`, `voice-and-mix-tests`, `rigged-character-import` and `portable-video-export` jobs. The latter explicitly logged:

- `HYBRID_P5_DIRECTOR_VIDEO_PASS`: two separate scripted hybrid films with authored cameras, screens, one-take/reaction controls, in-order scrub-and-rewind pixel parity.
- `HYBRID_P6_AUDIO_VIDEO_PASS`: each film **4.5667 s**, **36 frames**, **360×640 H.264/AAC**, 48 kHz WAV stereo mastering, full ffmpeg decode, calibrated loudness **−14.027 LUFS** and peaks **−2 dBFS**, voice-driven lip movement rather than timed mouth approximation.
- [P5/P6 2 MP4s, 2 mastered WAVs, screenshot comparisons and report](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41299172423/artifacts/13080990912).
- Source and orchestration regression test after `synthesizeHybridProject()` was added: [run 41299701150](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41299701150), source-and-project-tests **PASS**.

This is **not proof of newly generated V2 dialogue**. The film audio intentionally reuses two existing first-party V6 Kokoro speech segments with matching authored transcripts. The original Kokoro worker's own full model generation was independently tested by the existing V6 voice-and-mix job, but the NEW orchestration path is only tested with an injected fake worker at this checkpoint. The next required proof is a V2 film rendered from two **freshly synthesized** original English lines by the actual Kokoro model.

One existing broader CI job still fails the independent-page V6 visual comparator. Nothing in P5/P6 changes V6 film sources; the independent release gate is not waived.

## Fresh-dialogue V2 milestone under verification (2026-11-01)

**New code merged into `feature/hybrid-foundation`, CI verdict PENDING:** [run 41316274642](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41316274642). Source-and-project tests passed.

Unlike the earlier two 4.57-second films that reused a preexisting speech track, `tests/hybrid-p6-fresh-synthesis.cjs` now instructs the **existing, real Kokoro model** to speak two original English sentences for distinct actors. It uses the first-party V6 browser worker via `FrameForgeVoiceQA.speakWav()`, decodes the true PCM and injects an actual speech bridge into `synthesizeHybridProject()`. It archives the complete new `frameforge.project/2`, two actor markers, actual mono voice and mastered stereo WAV. The new `tests/hybrid-p6-fresh-film-browser.cjs` reloads that audio and project via the P5 director and renders a third original animated Ember video using real acoustic mouth motion, fully verified with `ffprobe` and `ffmpeg` decode. This is tested in the already expensive voice-model job to avoid a second 90/326 MB download on separate CI jobs.

`src/hybrid-voice.mjs` now rounds synthesized voice shot lengths **up** to the next 30fps boundary to prevent a real clip being truncated by a negative frame rounding error. The fractional-duration boundary test in `tests/hybrid-voice.test.mjs` passes.

**ACTUAL CI PASSED:** [run 41316274642](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41316274642) has both `HYBRID_P6_REAL_KOKORO_V2_PASS` and `HYBRID_P6_FRESH_FILM_PASS` in the successful voice-and-mix job, and [artifact 13087274112](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41316274642/artifacts/13087274112) contains the original-dialogue MP4, mono source WAV, mastered stereo WAV, screenshots, film report and persisted V2 project. This is a real model-level test rather than arbitrary synthetic audio, but still uses FrameForge's existing first-party model; it is *not* a claim of native Telugu/Hindi support or precise phoneme alignment. If it fails, log and fix the actual cause instead of changing assertions to accept preexisting audio.

### New original-English dialogue and movie — verified

- Characters and authentic Kokoro model voices: **Luna** `af_heart`, **Atlas** `am_michael`.
- New dialogues: “Our studio makes a new story right here.” and “And these words are spoken for the first time.”
- Real first-party browser model inference, not preexisting sound samples; existing V6 model's worker reused through `FrameForgeVoiceQA.speakWav`, with `synthesizeHybridProject` carrying out the new V2 shot retime and stereo mastering.
- Report: **5.5667 seconds**, **−14.007 LUFS**, **−2.0 dBFS**, **44 independently decoded 360×640 H.264/AAC frames at 8 fps**, speech-driven facial mouth control peak `0.97` and deterministic seek.
- The existing P5/P6 pair of 4.57-second camera/screen films still passes the same branch's portable video job. Source, rig and voice jobs green; separate cross-page V6 visual parity job remains red.
- **Limitations:** This is an engineering film, not a final 30–60 second polished customer film. English only. Kokoro transport is proven via the existing first-party worker interface, but a dedicated *direct new V2 worker* release test and precise forced phoneme alignment are additional release-hardening work. Indic models and commercial-grade character likeness/licensing need separate acceptance.

## P5 — One authoritative FrameForge timeline

`src/hybrid-direction.js` is the only hybrid screenplay parser/camera director. It takes a fully validated `frameforge.project/2` and offers `scriptToProject`, `projectToScript`, `reorderShots`, `performanceAt` and `cameraAt`. The original `src/script-core.js` and V6 renderer/legacy projects are **untouched**.

Authoring grammar:

```text
# The Instant Solution
> A cinematic tech story.
@mode one-take
@shot id=shot-01 duration=2.6 camera=actor:luna move=push transition=cut intent=setup caption=OPEN%20SOURCE
Luna (worried) [think]: Our app takes twelve seconds to load.

@shot id=shot-02 duration=2 camera=two:atlas%2Cluna move=orbit transition=blend blend=0.4 intent=reveal
Atlas (happy) [wave]: I can make it instant.
@reaction actor=luna at=0.4 emotion=surprised action=nod
@screen kind=terminal tone=success title=LOCAL%20BUILD
| > npm run build
| ** Export ready
```

The screenplay is **not** arbitrary JavaScript. Metadata values containing spaces or punctuation use URL percent-encoding. Cameras resolve actor head and world-screen anchors; direction supports static, push, pull, drift and orbit, bounded shot transition blending, and an explicit cross-shot one-take setting. Reactions are independently timed per shot and constrained to existing actors and allowlisted emotions/actions. Camera positions are evaluated only from absolute episode time; there is no second animation clock.

`src/ember-screen-apps.mjs` is the retained MIT original on-set computer-app painter. `src/hybrid-screen.mjs` is the integration contract: it derives text animation and key/click sounds from **the same** FrameForge shot duration, draws to a reusable 1600×900 canvas texture, and keeps subtitles in a nonoverlapping safe zone. No arbitrary HTML, external web pages, scripts or remote screen assets are executed.

`src/hybrid-project-core.js` adds allowlisted `shot.direction`, `shot.screen`, `shot.caption`, `shot.reactions` and `hybrid.director.oneTake` validation **only for V2**. The v1 validator remains delegated to the frozen original core. This is a production architecture boundary, not an unvalidated editor shortcut.

## P6 — Safe audio/voice architecture

`src/hybrid-voice.mjs` reuses FrameForge's existing Kokoro 82M worker `src/kokoro-worker.js`, original `src/speech-performance-core.js`, and `src/episode-mix.mjs` (music, effects, ducking and loudness/limiting). It does **not** bundle another TTS model or establish paid cloud accounts.

- `createKokoroBridge`: one worker, typed requests, bounded timeouts, error reporting, disposal and model choice. The existing English Kokoro model can synthesize authorized original lines. The response is normalized to remove the worker's internal 60 ms lead/100 ms tail before shot-timing padding is applied. `synthesizeHybridProject()` coordinates two or more original English line requests, validates identity/source, re-times the entire V2 project and returns the mastered stereo and exact acoustic markers. Existing V6 `voice.kokoro.voice` IDs are reused correctly and Ember `curious/idea` emotions are mapped to supported Kokoro speaking styles.
- `resamplePCM`: bounded decoded mono voice import (8–96 kHz) and normalized 48 kHz PCM, with no unknown network upload.
- `validateVoiceRights`: imported speech requires recorded consent/licensing and source provenance. Without that documentation the mixer fails closed.
- `retimeForVoice`: preserves scene/acting/screens while re-timing shots from actual waveform lengths, lead and trailing pause, with the existing maximum duration constraints.
- `renderHybridAudio`: places each recorded/synthesized line under the correct actor ID, prevents waveform overflow/mismatched dialogue, converts screen sounds into the original sound-kit cues, and returns mastered 48 kHz stereo with loudness, peaks, voice start/end and metadata.
- `sampledEnvelope` / `speechAt`: generate acoustic energy and approximate text-guided visemes from the real speech waveform using FrameForge's original speech estimator. This is **not** forced phoneme alignment.
- Optional `setSpeech()` on both Ember built-in and imported GLB providers overrides the old demonstration mouth-open approximation with the waveform-driven mouth/facial channels. Silent speakers have a closed mouth.

**Language boundary:** existing Kokoro uses English; a Hindi/Telugu string is **explicitly rejected** as a Kokoro voice request. Consented Hindi/Telugu user recordings may be imported as decoded PCM; reliable native-language TTS requires a separately audited model. Do not claim that voice cloning, lip-perfect phoneme sync or Hindi/Telugu local TTS is already shipped.

## Testing and proof limitations

- `tests/hybrid-director.test.cjs`: actor-independent screenplay round trip, shot reorder, camera interpolation and absolute-time seek, one-take mode, reaction beats, caption/screen noncollision and invalid-input rejection.
- `tests/hybrid-voice.test.mjs`: mocked Kokoro transport contract, explicit non-English model rejection, voice consent and identity, 16/48 kHz voice imports, timing consistency, actual stereo mixing and voice-envelope evidence. A **mock transport proves interface behavior only**, not actual new TTS generation.
- `tests/hybrid-p56-proof.html` + `tests/hybrid-p56-browser.cjs`: two real Ember cast/world scene variants, two V2-authored shots each, original Ember screen-app pixels, one-take/reactions, moving camera, real V6 Kokoro-generated **pre-existing** English voice segments re-timed and mixed under the new actors, acoustic mouth movement, 360×640 MP4 (H.264/AAC), PNG frame proof, 48 kHz stereo WAV and complete ffmpeg decode. These are **engineering QA films**, not customer-ready longer cinematic stories or freshly synthesized dialogue. Their voice segments match the two original Zero Latency lines; they do not prove the new worker speaks new text yet.
- Existing V6 real Kokoro model/English mixing test job independently exercises real speech synthesis and master export, but that legacy job is not a hybrid V2 generation acceptance substitute.
- The normal hybrid editor UI is P7; 1080×1920 high-quality custom final-film export and real phone stress tests are P8. Existing P0/P1 independent-browser visual parity and full Windows/macOS release checks remain open and must not be waived.

**Required P5/P6 acceptance:** `HYBRID_P5_DIRECTOR_PASS`, `HYBRID_P6_AUDIO_PASS`, `HYBRID_P5_DIRECTOR_VIDEO_PASS`, `HYBRID_P6_AUDIO_VIDEO_PASS` from successful CI jobs, film artifacts and listening/visual review. For full P6 release approval, additionally test two completely original freshly synthesized English scenes and separately verified Indic voice models when available, then measure voices/lip sync on mobile.

**Resume:** read this file, the master phase plan, and the latest `FrameForge code quality` run for the protected branch. Fix any failing P5/P6 browser test, rather than declaring success on compile-only results. **Do not merge to main or redeploy frameforge-v6.vercel.app.**