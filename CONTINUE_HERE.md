# FRAMEFORGE STUDIO — START HERE IN A NEW CHAT

**Read [FRAMEFORGE_COMPLETE_HANDOFF_2026-10-24.md](FRAMEFORGE_COMPLETE_HANDOFF_2026-10-24.md) first.** This is the comprehensive, current cross-chat transfer: goals, complete earlier engineering handoff, P0–P7 checklist, recovery/runbook, specific source docs, QA evidence, render archive, current branch differences, known uncertainties and next steps. User explicitly asked for **handoff only**; this documentation push is NOT a code merge, new render or deployment.

## Primary facts
- Private repo: https://github.com/Dileepreddy93/frameforge-studio
- **Canonical handoff / media-archive branch:** feature/studio-v5-foundations
- **Newest experimental character-code branch:** feature/v5-expressive-character-portraits, previously verified HEAD 8ae0002 (inspect new HEAD).
- Protected: main (V3), develop (merged V4), v3.0-stable, v4.0-rc1, v5.0-phase0, v5.1-phase1b, v5.1-phase1c-artstudies, v5-handoff-2026-10-24.
- Production: https://frameforge-3d-director-preview.vercel.app/ — **V3**, not latest V5.
- Exact external Git Blame reference video not yet checksum-verified; 65469.mp4 cannot automatically be called the same clip.
- P1 art/character approvals remain open; P2–P7 not accepted. Existing render QA is technical evidence, not artistic reference parity.

## Follow-on files (on the canonical handoff branch)
1. FRAMEFORGE_COMPLETE_HANDOFF_2026-10-24.md — the single unified 400+-line handoff.
2. docs/HANDOFF_ARCHIVE_INDEX.json — **49** archived file paths/sizes/checksums, including first-party media and extracted source reports.
3. docs/HANDOFF_2026-10-24.md — detailed prior engineering summary.
4. docs/MASTER_IMPLEMENTATION_CHECKLIST.md — complete phased checklists.
5. docs/DEVELOPMENT_RUNBOOK.md — exact restore/build/test/deploy procedure.
6. docs/history/NMXWZ-1-PDF_EXTRACTED_TEXT.md and docs/history/Studio_Reverse_Engineering_Report_SOURCE.md — source text as archived, distinct from raw PDF bytes.
7. assets/v5-art-evidence/, media/v4-review/, media/v5-evidence/, docs/RENDER_ASSET_CATALOG.json, docs/RENDER_FRAME_SHA256SUMS.txt — original output and QA.
8. spec/reference-register.json, spec/quality-gates.json, docs/DECISIONS_AND_FAILURES.md and AGENTS.md — verified evidence, open tasks and guardrails.

**Important:** docs/HANDOFF_STATE_2026-10-24.json exists on the later experimental branch, **not** this canonical handoff branch. Use docs/HANDOFF_ARCHIVE_INDEX.json here.

## Scope and status
This is a preservation/transfer operation only. Never call Phase 1 completed, skip rendered-film QA, merge the experimental branch or deploy live production merely because a handoff document was published.

For precise context, requirements and project continuation, read the complete handoff file now.
