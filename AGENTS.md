# FrameForge engineering rules

1. **One branch.** `main` is the product. Work on a short-lived branch (`feature/…`, `fix/…`, `chore/…`), open a pull
   request into `main`, and merge only when CI is green. No long-lived parallel lines again.
2. **Never deploy by accident.** No Vercel project is connected to GitHub. Never run `vercel` inside the repo folder
   (its `.vercel/` link points to the protected `frameforge-3d-director-preview`). Production deploys follow phase 0 of
   `docs/IMPLEMENTATION_PLAN.md`, and only with the owner's yes.
3. **Judge the film, not the build.** A passing test is required but never proof of quality. Look at the exported MP4
   (frames and motion) next to the reference, and say plainly what still looks wrong.
4. **Report honestly.** Name the exact commit, CI run and artifact behind every claim. Never call something verified
   that was only planned, emulated (a 390 px viewport is not a phone) or measured once.
5. **Don't weaken a gate to make it pass.** If a threshold is wrong, change it in its own commit and explain why.
6. **Licences.** Everything that ships must allow commercial use. Check the licence of every imported asset; keep
   no-resale assets out of what ships (`.vercelignore`) and update `credits.html` when shipped parts change.
7. **Keep old projects opening.** `frameforge.project/1` and `/2` files must keep loading; add a migration, never a break.
8. **Secrets.** Never commit tokens, keys or `.env` files.
9. **Docs stay short and current.** Update `CONTINUE_HERE.md` and the plan when a phase step finishes. Put superseded
   notes in `docs/history/` instead of stacking new notes on top of old ones.
