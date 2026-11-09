# FrameForge: continue here

Updated 2026-11-09. Keep this file short and current; move superseded notes to `docs/history/`.

## Now
- **One project on `main`.** The V6 studio (M1–M6) and the Hybrid Creator (P0–P14) were merged in PR #20, and the
  repo was consolidated in the PR that follows it.
- The landing page opens the Creator (`creator.html`); the V6 episodes (`studio.html`) are the examples.
- **The plan:** [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md). The next step is **phase 0** (protect
  `main`, release from tags, fix the flaky CI jobs).
- **Live:** https://frameforge-v6.vercel.app still serves V6 (`2b78e60`). The Creator is only on the SSO-protected
  staging project `frameforge-hybrid-beta`.

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
