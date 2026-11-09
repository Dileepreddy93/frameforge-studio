# FrameForge V5 — Phase 1 engineering checkpoint

Snapshot date: 2026-10-24. This is a reusable-project ENGINEERING milestone, not a certified character-art or reference-quality milestone.

## Git and production safety
- Base: merged develop at 06ec0d7.
- Branch: feature/studio-v5-foundations.
- Phase 0: v5.0-phase0; reference and quality contracts.
- Phase 1 partial: v5.1-phase1b; structured episodes, imports/exports and validation.
- Protected history: main, v3.0-stable and v4.0-rc1 remain unchanged.
- Vercel production: NOT deployed or modified.

## Actual implementation
- Shared Node/browser project validator: src/project-core.js, schema frameforge.project/1.
- Two versioned episode examples, original spoken script preserved exactly: 14-shot Zero Latency and 6-shot storyboard mystery.
- Stable character IDs, visual and voice locks, expression vocabulary, visual-sheet status, first-frame status, safe zones and real audio-state claims.
- Existing studio now fetches project JSON rather than embedding dialogue arrays in its own engine source.
- Validated upload of user JSON episode, original three character rigs only; unsupported rig imports produce a real error.
- Existing shot editor can change dialogue/speaker/camera and Download exports full reusable project JSON.
- Static tests and a GitHub Actions configuration TEMPLATE. The connected GitHub OAuth credential lacks the workflow scope needed to activate .github/workflows/*, so the template is staged in docs/GITHUB_ACTIONS_SUGGESTED.yml instead of presenting CI as active.

## Test evidence
- Phase 0 and project static tests PASS.
- Exact V3 script/camera/speaker/duration migration verified against original v3.0-stable index.html.
- Project validator negative tests: duplicate IDs, unsafe IDs, unregistered speakers, invalid cameras, non-finite times, style-lock drift, missing voice IDs, false mastered audio, bad safe zones and more PASS.
- Playwright in cloud Chromium PASS: HTTP 200, 14-shot voiced episode loaded, six-shot storyboard loaded, a real 360x640 rendered JPEG generated; zero page errors or failed project requests.
- Browser import/edit/export PASS: custom six-shot episode, changed dialogue, downloaded valid full project, unknown rig refused, no page errors.
- Existing cinematic regression PASS: all 14 caption strings and all six true camera reaction cuts; five rendered film-frame checks and zero JS errors.

## Important incomplete work
- Art-direction phase not yet complete: no approved character multiview sheets or approved first frames.
- Dialogue-to-mouth timing remains V4's heuristic, not phoneme alignment.
- Custom voice track/movie output is NOT yet universal; Zero Latency remains the verified voiced movie.
- Episode save is a downloaded JSON file, not yet IndexedDB/cloud save, undo/redo or a complete editing timeline.
- Production render remains below full-resolution reference parity.
- No full new V5 cinematic film was rendered as part of this source-architecture checkpoint; the preserved V4 film remains the verified full episode.
- Exact user-named Git Blame reference has not been re-acquired and verified in this phase.

## Next gates
1. Generate visually consistent original multiview character lineups and 4+ expressive close-ups per performer.
2. Build first-frame review workflow and scene identity freeze; link approval to actual assets and hashes, not just an editable string.
3. Implement authored pose libraries, facial controls and phoneme timing against approved character assets.
4. Only then move to higher-resolution film rendering and true cinematic QA against exact source footage.
