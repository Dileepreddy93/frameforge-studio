# Mandatory continuation entry point

When the next user says "continue", **do not restart**. First read CONTINUE_HERE.md, docs/HANDOFF_2026-10-24.md, docs/MASTER_IMPLEMENTATION_CHECKLIST.md, docs/DEVELOPMENT_RUNBOOK.md, docs/DECISIONS_AND_FAILURES.md, spec/quality-gates.json and spec/reference-register.json. Check the current Git branch/remote, known media artifacts and exact tests, then continue unfinished phase work with real code/render evidence. This is a handoff and preservation snapshot, NOT a claim of reference parity. Keep main/V3/V4 and the deployed production URL protected.

# FrameForge engineering rules

Preserve the V3 stable snapshot and production URL. All visual experiments occur on a branch, never on the stable tag. Validate camera, lighting, performance, expression, audio and full video against the provided reference. Do not claim parity from a passing build alone. Keep current voice, Foley, editor and export paths unless a tested replacement is better. Verify copyright/license status of imported assets. Never commit tokens. Preserve rollback instructions and screenshots for major changes.
