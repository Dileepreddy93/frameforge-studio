# FrameForge Studio — exact instructions for a new agent/chat

## Source of truth
Private GitHub: https://github.com/Dileepreddy93/frameforge-studio
Start with CONTINUE_HERE.md, docs/HANDOFF_2026-10-24.md, docs/MASTER_IMPLEMENTATION_CHECKLIST.md, docs/DECISIONS_AND_FAILURES.md, spec/quality-gates.json, spec/reference-register.json, docs/releases, docs/RENDER_ASSET_CATALOG.json.
The handoff commit goes on feature/studio-v5-foundations. A parallel feature/v5-expressive-character-portraits exists; at handoff inventory time both were at bd2c625 before the new handoff. Check actual remote HEAD before editing.
Keep main V3, develop V4, v3.0-stable, v4.0-rc1, v5.0-phase0, v5.1-phase1b, v5.1-phase1c-artstudies untouched unless explicitly authorized. Production Vercel is an older V3 site and may not be Git-linked.

## Verify exact current state
    git fetch --all --tags
    git branch -avv
    git status --short
    git log --oneline --decorate -20
    git tag --list | sort
    git switch feature/studio-v5-foundations

Read the relevant notes and preserve unrelated changes. The repo is private, and current tool auth should be checked rather than assumed.

## Runtime and test commands
Node.js 22, Python 3, FFmpeg/ffprobe for video; Playwright 1.56.1 + Chromium for browser QA. Some dependencies are external CDN/audio; offline playback is not fully verified.

    node tests/phase0-contract.test.mjs
    node tests/project-core.test.cjs
    node tests/project-integration.test.mjs
    node tests/check-source.mjs
    node tests/check-v4.mjs
    node tests/check-cinematic-v4.mjs
    node tools/check-gates.mjs
    python3 tools/verify-preserved-renders.py

Serve the directory and validate actual browser behavior:

    python3 -m http.server 8959

Then in another terminal:

    npm install --no-save playwright@1.56.1
    npx playwright install --with-deps chromium
    FRAMEFORGE_URL=http://127.0.0.1:8959/ node tests/project-browser.cjs
    FRAMEFORGE_URL=http://127.0.0.1:8959/ node tests/project-import-export-browser.cjs
    FRAMEFORGE_BASE_URL=http://127.0.0.1:8959/ node tests/render-cinematic.cjs
    FRAMEFORGE_URL=http://127.0.0.1:8959/ node tests/character-art-browser.cjs dev
    FRAMEFORGE_URL=http://127.0.0.1:8959/ node tests/character-art-browser.cjs blue
    FRAMEFORGE_URL=http://127.0.0.1:8959/ node tests/character-art-browser.cjs orange

Browser test timeouts require investigation; never count a pending or timed-out test as a pass. CI workflow .github/workflows/project-contract.yml is not itself evidence that every run passed.

## Recoverable render artifacts
- media/zero-latency-acting-v3-with-foley.mp4: V3 public-era stable movie.
- media/v4-review/frameforge-v4-complete-director-41s.mp4: verified complete V4 candidate, artistically UNAPPROVED.
- media/v4-review: two 15-second V4 clips and comparison JPEG.
- media/v5-evidence: three actor turnarounds and one environment-only first frame.
- assets/v5-art-evidence: 24 PNG real-rig frames (3 actors x 8), plus JPG comparison.
- docs/RENDER_ASSET_CATALOG.json: original V4/V5 public URLs and expected bytes.
- docs/RENDER_FRAME_SHA256SUMS.txt: checksum per actual 3D PNG/JPEG. Verify via tools/verify-preserved-renders.py.
V4 public sample: https://agz0k9i7nymp3png.public.blob.vercel-storage.com/frameforge/frameforge-v4-complete-director-41s.mp4 . This is NOT the latest V5 finished film.

## What is and is not available
- Exact Git Blame reference: NOT stored as verified bytes. Previous report quotes metrics only. Do not claim to have done exhaustive source-frame parity.
- NMXWZ-1.pdf and Studio Reverse Engineering Report originals: user-provided Project/chat assets may need Files connector; the repo contains detailed extracted conclusions, NOT the full original source files.
- Agent Poly paid studio source/pack: NOT acquired or cloned, and licenses prohibit unauthorized redistribution.
- Feature future: real Telugu, English, Hindi voice models, accurate forced alignment, expressive acting, real native HD movie and reference-grade animation are NOT completed.
- Existing project UI imports/exports validated JSON and edits some fields; full production editor/persistent timeline does NOT yet exist.
- Actual previously named Vercel cloud sandboxes may expire; GitHub source and archived binary evidence are the durable state.

## Safe phase development loop
1. Verify the latest branch, docs, source and saved artifacts.
2. Pick a quality defect, formulate exact acceptance and test criteria.
3. Implement on a feature branch; never change main/production or unrelated files.
4. Run source checks and actual Chrome 3D renders; inspect for artistic defects.
5. For media changes, run FFmpeg/ffprobe and listen/watch actual full output.
6. Save representative render proof with SHA256 and update artifact/issue/checklist state.
7. Commit and push tested changes, tag only a real recoverable milestone.
8. Update CONTINUE_HERE.md and handoff at every completed phase.

## Verification before reporting success
Fresh clone, tracked files present, git rev-parse tag consistency, no credentials in docs, all manifest hashes pass, meaningful real browser tests, linked film public HTTP and actual playback for any new deploy. Distinguish V5 engineering milestone from artistic reference parity.

Next action when user says CONTINUE: focus on actual character art/acting, compare V5 real rigs against known reference and fix visible defects; keep unapproved art unchecked. Never simply repeat the handoff plan.


## User research and experimental patch archive
- docs/history/NMXWZ-1-PDF_EXTRACTED_TEXT.md: text of 5-page guide; original page illustrations are NOT preserved.
- docs/history/Studio_Reverse_Engineering_Report_SOURCE.md: previously uploaded detailed research Markdown, containing public-source claims and measurements with stated verification limitations.
- docs/history/wip-expressive-character-portraits/UNCOMMITTED_SOURCE.patch: non-shipped experimental source diffs saved rather than thrown away. Code here has not been accepted or verified for production. Review and re-test before cherry-picking.
