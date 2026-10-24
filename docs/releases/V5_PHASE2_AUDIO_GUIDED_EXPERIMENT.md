# FrameForge V5.3 — acoustic-guided mouth timing (experimental)

**NOT phoneme-level speech alignment.** This milestone does not certify artistic reference parity.

## Improvements
- Shared pure speech performance engine evaluates text visemes against the real decoded waveform instead of spreading letters at a constant pace.
- Per-shot adaptive audio thresholds, voiced-region cumulative mapping, silence gating, deliberate closed-lip consonants, and deterministic seeking.
- DEV and both robot rigs use the output to control lip shapes and opening energy.
- Silence and consonant categories are unit tested; clean dialogue-only waveform samples and a 3D film render are checked in Chromium.
- Fallback to amplitude and elapsed time when waveform is unavailable is explicitly marked as estimated.

## Open quality gates
- The studio uses dialogue42.ogg as its speech analysis stem, retaining the mixed soundtrack for video output. Speaker-isolated stems improve cue quality but do not give phoneme boundaries.
- This is approximate text-to-waveform alignment, NOT phoneme-forced alignment or validated Telugu/Hindi pronunciation.
- The V5.2 public preview remains the stable review version until V5.3 cinematic acceptance checks pass.
- Native full-HD export and reference-level facial/body acting remain incomplete.

## Frame-level acceptance
- At 32.45s DEV's mouth is visibly open; at 33.80s the detected silence closes it. Seeking back restores the identical pose. Chromium directly inspects the Three.js rig and decoded voice waveform.
