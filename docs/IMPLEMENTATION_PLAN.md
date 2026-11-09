# FrameForge implementation plan

Written 2026-11-09, right after the V6 studio and the Hybrid Creator were merged into `main` (PR #20).
**This is the only current plan.** Older plans are in `docs/history/` for the record.

**Goal:** a studio people pay for and use on their own. A buyer writes a story in the Creator and gets a finished,
voiced 9:16 film they are proud to post, on the computer or phone they already own, with no keys and no cost per video.

**Out of scope here:** login and payments. They come after phase 8, once people have shown they want to pay.

---

## Where we are (checked 2026-11-09)

**Works, with proof:**
- **One codebase.** `main` holds the V6 studio (M1–M6) and the Creator (P0–P14). CI runs on `main` and on pull requests.
- **The Creator** (`creator.html`):
  - Content: 6 cast types and 5 English voices, 4 sets × 3 times of day, 8 emotions, 9 body actions, 5 framings and
    5 camera moves, 1 prop (the lantern: reach, grasp, lift, carry), 6 on-set screen types, 7 sound effects, 4 music cues,
    and films up to 60 s.
  - Editing safety: autosave with recovery, undo/redo, and save/open of project files.
  - Export: MP4 export with cancel and retry, and a check of every file.
- **The latest proof film** (`9f3240a`):
  - Format: 35.6 s, 1080 × 1920, H.264 + AAC, two voices, music and effects.
  - Checks: every frame was decoded by ffmpeg, and the hand really meets the lantern handle.
  - CI: 7/7 quality jobs green (run 41586499104), plus the Windows full-film test (run 41586499034).
- **V6** is live at https://frameforge-v6.vercel.app (`2b78e60`) and still opens its two episodes.

**Not good enough yet (from looking at the frames of that film):**
- **The look.** It is glossy toy 3D, not the flat low-poly look in `STYLE.md`, and it isn't the approved
  DEV/BLUE/ORANGE.
  - The human's hair hangs onto the chest like a beard, and the eyes look half-closed.
  - The snow ground is covered in red-brown dots, and the sky is flat grey-brown.
  - The on-set screen is a mostly empty black board.
  - The same two-shot repeats.
- **Speed.** About 10 minutes to export 35 s at 1080p on the CI machine, which draws without a real GPU. Rendering is
  99 % of the time: 560 ms per frame, 136 draw calls and 192 k triangles. Nobody has measured it on a customer's
  laptop or phone.
- **Reach.**
  - Only Chrome and Edge on Windows have been tested.
  - Safari, Firefox, macOS, iPhone and Android are untested; Chrome on Linux has no H.264/AAC encoder.
  - "Mobile" so far means a 390 px browser window, not a phone.
- **Breadth.** One prop, four sets, English only.
- **Trust.**
  - The site has no Terms, Privacy Policy, refund policy or contact address.
  - Nothing reports errors.
  - Two tabs can edit the same project.
- **Proof of demand.** No real user has made a film, and nobody has said they would pay.

---

## How we work (applies to every phase)

- One task, one branch, one pull request into `main`. Merge only when CI is green. See `AGENTS.md`.
- **Every visual change is judged in the film.** Export a new film, look at frames and motion next to the reference
  (`~/Desktop/Animate/git-blame.mp4` and the look-target video), and put the before/after frames in the PR.
- **Every speed claim** needs 3+ runs on the same named machine, with p50 and p95.
- Each phase ends with a short note in `docs/releases/` and an updated `CONTINUE_HERE.md`.
- **Decisions marked 🟡 belong to the owner.** Ask, don't guess.

---

## Phase 0: Make `main` safe to ship from

Do this first, so nothing below can break production by accident.

1. **Protect `main`:** pull requests only, the 7 quality jobs required, no force-push, no deletion.
2. **Release from tags.**
   - A release is a tag on `main` (`v7.0.0`, …).
   - `tools/deploy-v6.sh` becomes `tools/deploy.sh <tag>`. It refuses anything that isn't a tag on `main`, and
     prints the commit and the CI run it is shipping.
   - Rollback = deploy the previous tag.
3. **One production project.** 🟡 Choose: keep `frameforge-v6` as the production project for the merged product, or
   create a fresh `frameforge` project for it.
   - Either way, the staging project (`frameforge-hybrid-beta`) gets every candidate first.
   - Don't touch the old protected preview.
4. **Licence for the public repo.** 🟡 The repo stays public (owner's decision). With no licence file, others may read
   the code but not reuse it.
   - Add a `LICENSE` that says so plainly ("All rights reserved", or a source-available licence such as BUSL). That
     keeps copying illegal even though it is visible.
   - The code itself is not the moat. The finished films, the cast and the hosted service are.
5. **Flaky tests.** 3 of the 4 runs before the last green one failed: `real-character-render-tests`,
   `hybrid-beta-usability` and `windows-chrome-full-film`. Find each cause (flaky test or real bug) and fix it.

**Done when:**
- A tag-based deploy to staging works and the rollback has been tried.
- `main` is protected.
- 5 CI runs in a row are green with no re-runs.

## Phase 1: One product, one front door

The landing page now opens the Creator (done in the consolidation PR). Make the rest match:

1. **The V6 episodes become Creator templates.**
   - 🟡 Choose: (a) DEV, BLUE and ORANGE become cast members in the Creator (rebuild them as Ember actors from their
     approved model sheets), or (b) the Creator opens v1 episodes and plays them with the V6 renderer, read-only.
   - Recommended: (a). One renderer means one look and half the maintenance. (b) is a stop-gap.
2. **Retire `studio.html` as a separate app** once both episodes open in the Creator. Old v1 files still open and are
   upgraded with `upgradeLegacyProject`.
3. **Landing page around the Creator:** new copy, a reel made in the Creator, and an honest FAQ (browsers, languages,
   export time).
4. `credits.html` covers the Creator's cast, sets and lantern, and `beta.html` is folded into the Creator's first-run tips.

**Done when:**
- A new visitor goes landing → Creator → their own exported film without ever seeing "V6".
- Both old episodes open in the Creator.
- All tests are green.

## Phase 2: The look (the biggest gap)

1. 🟡 **Pick one art direction and write it into `STYLE.md`.** The recorded target is the flat, matte low-poly "coded"
   look. The Creator drifted to glossy toy 3D. Recommended: go back to the flat matte target for the whole Creator cast.
2. **Characters.**
   - Fix hair (no strands on the chest) and eyelids (open, readable eyes).
   - Make faces readable at phone size.
   - Make all 6 cast types match the style sheet.
   - Design in 2D first, get the owner's OK, then build in 3D (the method that worked in M1 and M3).
3. **Sets.**
   - Snow that reads as snow, with no red-brown dots.
   - A night sky with depth, real tree silhouettes, and ground contact shadows.
   - Forest, meadow and studio desk get the same pass.
4. **On-set screens:** no empty black board. The screen is sized to its content, sits in the world (not on stage
   posts), and its text is readable at 720p.
5. **Directing:** more varied shots (over-the-shoulder, low and high angles, reaction close-ups), the shot planner from
   M5.4 for cuts, eyes and the prop kept in frame, and captions on every spoken line.
6. **Lighting:** a key light on faces in every set and time of day, and a warm spill from the lantern at night.

**Done when:** the owner approves a new full film, frame by frame and in motion, next to the reference, and 5 people
who didn't build it pick it over the current film in a blind A/B.

## Phase 3: Export speed

Rendering is 99 % of the export time, so the work is in the 3D scene, not the encoder.

1. **Profile per shot:** draw calls, triangles, shadow passes, material and texture uploads, and garbage collection.
   `src/hybrid-browser-export.mjs` already records p50/p95/p99.
2. **Optimisations to try, measuring each one:**
   - Share materials and geometry.
   - Merge or instance static set pieces (snow, trees, rocks).
   - One shadow map, sized to need, and only updated when something moves.
   - No per-frame allocations.
   - Skip work hidden by the 9:16 frame.
   - Render at the export size, not the window size.
3. **Honest presets:** 720p "social" (the default) and 1080p "master", with a time estimate from the first frames
   (already started in P14).
4. **A benchmark page** that runs the same 10 s scene and reports frames per second, for support and for phase 4.

**Targets (to confirm on the phase 4 machines):**
- 35 s at 720p in ≤ 2 minutes on a mid laptop with an integrated GPU (8 GB, Intel Iris Xe class).
- 35 s at 1080p in ≤ 5 minutes on the same machine.

**Done when:** 3 runs per machine meet the targets with every pixel and codec check still passing.

## Phase 4: Real devices and browsers

1. **Device matrix (real hardware, not emulation):**
   - Windows laptop with integrated GPU
   - MacBook (Safari and Chrome)
   - Mid Android phone (Chrome)
   - iPhone (Safari)
   - Linux (Chrome and Firefox)
2. **Per device, check the whole path:** first-run model download, voicing, preview, a full export, playing the file
   in the phone's gallery or player, cancel, refresh, offline, and memory use.
3. **Close the gaps:**
   - Safari: WebCodecs H.264 and AAC support, and storage limits.
   - Firefox and Linux: the encoder fallback (Opus audio, or a clear "use Chrome" message).
   - Phones: a smaller voice model and lower preview quality, and an export size that fits in memory.
4. **Keep the evidence:** a GitHub macOS runner for Safari where possible, plus a written per-device log for the rest.

**Done when:**
- Every device in the matrix makes and plays a full film, or the Creator says clearly, before any work is done,
  that the device isn't supported.
- The landing FAQ matches the matrix.

## Phase 5: Never lose a customer's work

1. **One tab at a time:** a lock per project (`navigator.locks` or BroadcastChannel), and a clear "open in another tab"
   message.
2. **Storage space:** ask for persistent storage at first save, warn early when space is low, and show how big the
   project is.
3. **Backups:** offer a project-file download after every N minutes of editing, and keep the last 5 autosaves.
4. **Crash tests:** refresh, close, low memory and quota-full in the middle of an edit and in the middle of an export.

**Done when:** an automated stress test (multi-tab, refresh during save, storage full) loses no edits.

## Phase 6: Breadth people expect from a paid tool

1. **Props:** turn the lantern into a prop system. Start with 10 original props (cup, phone, laptop, ball, book, box,
   flower, key, umbrella, sign), each with reach/grasp/lift/carry.
2. **Sets:** 4 more (city street, office, classroom, home interior), each with 3 times of day.
3. **Acting:** 10 more body actions and two-person actions (handshake, high-five, hand-over), plus finer face control.
4. **Cast customisation:** a few options per part (face, hair, outfit, colours) that always stay inside the style sheet.
5. **Templates:** 10 ready-made stories (explainer, ad, comedy, kids' lesson) that open ready to edit.

**Done when:** every new item has a test, appears in a film reviewed against the style sheet, and is listed in credits.

## Phase 7: Languages

1. 🟡 Pick the first languages. Hindi and Telugu were asked for before.
2. **Hindi:**
   - Upstream Kokoro-82M v1.0 is reported to include Hindi voices, but this has to be checked first: the copy pinned in
     the app ships English voices only.
   - Check licence, quality with native speakers, and a phoneme front end that runs in the browser.
3. **Telugu:** needs a different model. Research browser-runnable, commercially licensed options. If none is good
   enough, support user-recorded voice lines (record or upload per line, with lip-sync from the waveform), which the v2
   format already allows.
4. Captions and fonts for the chosen scripts, and the UI translated.

**Done when:** native speakers rate a full film in each language as natural, and the licence allows selling.

## Phase 8: Trust, support and running the service

1. **Legal pages:** Terms, Privacy Policy, refund policy, and who owns the films (the user does: say so).
2. **A contact and support address** in the site footer and in every error message.
3. **Error reporting the user chooses to send:** a "Send report" button that attaches browser, device, steps and export
   log. Nothing is sent silently.
4. **Privacy-friendly usage counts** (no personal data): visits, films started, films exported, export failures.
   Needed for phase 9.
5. **A custom domain** instead of `*.vercel.app`, and a status page.

**Done when:** each page is live on staging, the report button delivers a test report, and the counts appear on a
simple dashboard.

## Phase 9: Prove people want it (before charging)

1. **Recruit 5–10 real creators** (people who post Reels or Shorts and who didn't build FrameForge). Each one starts
   from a blank project.
2. **Measure:** time to first film, where they got stuck, whether they finished, whether they'd post it, and what
   they'd pay.
3. **Fix the top 5 problems,** then repeat with new people.
4. 🟡 **Pricing test:** a price page with two or three plans, measuring clicks only, before payments exist.

**Done when:** at least 7 of 10 new creators finish a film unaided in under 20 minutes, at least half say they'd pay
at a stated price, and the top blockers are fixed. Then build login and payments.

---

## Order and what runs in parallel

```
Phase 0 ─▶ Phase 1 ─▶ Phase 2 ──────────────▶ Phase 9 ─▶ (login + payments)
              │         Phase 3 ─▶ Phase 4 ──▶   ▲
              │         Phase 5 ───────────────▶ │
              └──────▶ Phase 8 ────────────────▶ │
                        Phase 6, Phase 7 (after phase 2 fixes the style)
```

- Phase 0 is first because it protects production.
- Phases 1 and 2 decide what the product is and how it looks, so everything else builds on them.
- Phase 3 must come before phase 4: a slow export fails on every device.
- Phase 6 (breadth) waits for phase 2, so new props and sets are made in the final style.

## Owner decisions needed (🟡)

1. **Production project** (phase 0): reuse `frameforge-v6` or create a new one.
2. **Licence** for the public repo (phase 0).
3. **The V6 cast in the Creator** (phase 1): rebuild them (recommended), or a read-only stop-gap.
4. **Art direction** (phase 2): the flat matte low-poly target (recommended), or the current glossy toy look.
5. **First languages** (phase 7).
6. **Price points** to test (phase 9).
