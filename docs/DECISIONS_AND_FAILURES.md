# Engineering decision ledger, factual failures and anti-regression rules

| Historical issue | Evidence / root cause | Required safeguard |
|---|---|---|
| Initial Replit public demo returned 404 despite "publish success" | Actual browser displayed "no previewable artifacts"; Replit deployment status alone was misleading | Browser HTTP + real UI smoke test, never claim success from deployment status |
| V3 characters appeared as attached geometric blocks | Overly simple independent meshes, weak proportions, face control and materials | Approve character sheets and close-up performances before long film render |
| Earlier V4 human mouth grew into enormous oval | Rig mouth scale treated as an absolute size; caught on real contact sheet | Pixel-level before/after plus proportion invariants, never rely on source lint only |
| Orange robot expressions difficult to see | Insufficient contrast on facial texture relative to environment | Compare character emotions at mobile-thumbnail size and varied lighting |
| Close-ups cropped faces | Camera target heights from old rigs did not match redesigned head centers | Compose using actual face targets; automated safe-frame check and real image review |
| Repeated static talking heads | Camera preset per dialogue line lacked listening reaction grammar | Purposeful shot/reaction schedule, with exact camera cut QA and human cinematography review |
| Software shots lacked story content | Generic "0" graphics without context | Show meaningful code/system screens and verify punchline read at timeline timestamps |
| V4 voice-mouth mismatch | Text-character heuristic plus volume envelope, not authentic phoneme timestamps | Acquire word/phoneme alignment and visually/audibly test syllables and pauses |
| Foley was previously forgotten or too generic | Generic voice+music did not match character actions | Audio cue sheet, loudness + actual listening, Foley synchronized with animations |
| Demo mistaken for reference-quality | Code/MP4 worked but artistic direction remained below reference | Explicit separate technical/artistic acceptance and failure ledger |
| V5 P1B import dropdown browser test initially timed out | Test changed select without pressing Build; real UI requires explicit Build | Test actual user interactions, then keep regression |
| GitHub push of Actions once rejected | CLI OAuth lacked workflow permission at that point | Check current workflow exists and actual CI runs; never assume old denial still applies |
| Cloud render sessions expired repeatedly | Ephemeral Vercel sandbox sessions and slow SwiftShader rendering | Checkpoint source, re-open named sandboxes, never assume an async export finished |
| Git Blame filename ambiguities | Reference file not actually mounted; earlier 65469.mp4 41.8s candidate differs from reported 52.181s | Verify exact file hash/duration before comparison, never substitute |
| Overdeployment and micro-iteration | Many repeated live-preview changes without meaningful quality gain | Develop on branch, local render gate, deploy candidate only after full integrated quality review |
| Open-source implies "free unlimited premium video" | Compute, licenses, model access and hosted services are not unlimited | Benchmark actual price/runtime/GPU requirements and prefer usable deterministic techniques |
| Autonomous changes without preservation | Risk to prior verified output | Keep branch, immutable release tags and binary artifact/checksum manifests |

## Repeated engineering commitments
- Commit tested milestones, not just explanations. Fix actual defects and re-run dependent tests.
- No false green status, no fake 3D from CSS sprites or caption cards, no forged link, no imaginary frame count.
- Never commit authentication secrets or pay for external tools without consent.
- License/rights check for all third-party assets, voices and copyrighted character inspiration.
- User wants real paid-product-grade polish, but reference superiority is a hypothesis until actual peer-quality audio/visual comparison.
- Design the second episode as proof of engine reusability; source-editing every story is not acceptable as final state.
