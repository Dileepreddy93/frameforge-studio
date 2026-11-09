# FrameForge: continue here

Updated 2026-11-09. Keep this file short and current; move superseded notes to `docs/history/`.

## Now
- **One project on `main`.** Phases 0–9 of docs/IMPLEMENTATION_PLAN.md were worked through on 2026-11-09. The
  progress table at the top of the plan says exactly what's done and what's left.
- **What's left needs people, devices or decisions:**
  - the owner's look approval and a blind A/B
  - real GPU laptops and phones (docs/DEVICE_MATRIX.md)
  - a lawyer, a support email and a domain
  - recruiting creators (docs/USER_TESTING_PLAN.md)
  - price points
- **Live:** https://frameforge-v6.vercel.app still serves V6 (tag `v6.0.0`). Staging (`frameforge-hybrid-beta`) gets
  tags first; see docs/RELEASES.md. **Production deploys only with the owner's yes.**
- **Tools:**
  - `tools/creator-stills.cjs` (stills for reviews)
  - `tools/creator-film.cjs` (a voiced MP4 of any project)
  - `tools/creator-bench.cjs` (frame costs)
  - `tools/make-templates.cjs` (ready-made stories)
  - `tools/deploy.sh` (tag deploys)

## Before you start
1. Run `git fetch` and look at `main`'s latest CI runs (`gh run list --branch main`). Work also lands from other machines.
2. Read `AGENTS.md` (rules), `STYLE.md` (the look) and the plan phase you are working on.
3. Branch from `main`, open a PR into `main`, and merge only when CI is green.
4. Never run `vercel` inside the repo folder, and never deploy without the owner's yes (see README → Deploying).

## Evidence of the current state
- Last full proof film: CI run 41586499034 (Windows Chrome), artifact `frameforge-p7-windows-snow-lantern-30-60-second-movie`.
- 7/7 quality jobs: run 41586499104 at `9f3240a`.
- What the film still gets wrong: "Where we are" in the plan, and `docs/HYBRID_35S_REAL_FILM_AUDIT.md`.
- Earlier handoffs (P7–P14 details, CI links, staging URLs) are in `docs/history/`, starting with
  `HYBRID_P14_CONFIRMED_CONTINUATION_2026-11-03.md`.
