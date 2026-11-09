# FrameForge: prompt to continue with M5 in a new chat

Paste everything below the line into a new Claude Code chat on your computer, in `~/Desktop/Animate/frameforge-studio`.

---

Continue FrameForge Studio, a browser studio that makes short animated episodes with DEV (a human developer) and
two robots, BLUE and ORANGE. The repo is `Dileepreddy93/frameforge-studio`, cloned locally. Push as Dileepreddy93
(check `gh auth status` before every push; if another account is active, stop and tell me, don't switch). Start from
`feature/m4-ship-episode1` (or `main`, if I've merged it) and create `feature/m5-close-the-look-gap`.

Read first: `CONTINUE_HERE.md`, `AGENTS.md`, `STYLE.md`, `docs/PROJECT_STATE.md` and `docs/releases/M4_*.md`
(above all `M4_3_REFERENCE_COMPARISON.md`). Ignore older handoff docs.

State as of 2026-10-26: V6 is live at https://frameforge-v6.vercel.app (Vercel project `frameforge-v6`, CLI deploys
only, from `~/Desktop/Animate/deploy/frameforge-v6`; never run `vercel` in the repo folder, which is linked to the
protected `frameforge-3d-director-preview`). M4 re-voiced both episodes, rendered them at 1080×1920, compared them
with the reference, replaced the LGPL AAC encoder with an Opus fallback, added a credits page, deployed, and rewrote
the handoff docs.

My open feedback from M4 (ask me if it isn't here):
- the M4.1 voices (`~/Desktop/Animate/proof/v6/M4.1/<id>/ab-lines.wav`), especially DEV's "worried";
- whether STYLE.md should allow the reference's soft background focus and glow (M4.3 gap 6);
- whether the Opus fallback's narrower music stereo matters (`proof/v6/M4.4/`).

Rules:
- Commit and push after every step; one release note per step in `docs/releases/M5_x_*.md` (what changed, how it
  was measured, how to roll back); proof files in `~/Desktop/Animate/proof/v6/M5.x/`.
- Judge rendered frames and motion next to the reference (`~/Desktop/Animate/git-blame.mp4`; reference frames stay
  out of the repo). Never claim parity from a passing build. You can't listen: give me audio and video.
- Character and set design changes go 2D first and need my pick. Don't grind: after about 3 render iterations
  without converging, stop and show me options.
- No GPL/LGPL in what buyers run; check the licence of anything you import. Never commit tokens or `.env` files.
- Run the unit tests and the relevant browser tests before every push. Ask before any deploy to `frameforge-v6`, and
  never deploy to the protected project.

## M5 · Close the look gap (in the order of the M4.3 ranking)
**M5.1 · Set: density and scale, designed first.** Draw two or three 2D set directions: walls of in-world app
screens (inbox, review, changelog, terminal) around a desk or keyboard landscape, at a scale where the characters
read small in wides. I pick one. Then build it in three.js in STYLE.md's materials, and re-frame the wides and
two-shots for it.

**M5.2 · Story on in-world screens.** Replace the flat full-frame `screen` cards with monitors in the set, seen in
perspective and cropped by the frame, keeping the episode's `insert` data. Captions stay readable.

**M5.3 · Light, for you to judge.** M4.3 measured the gap (reference close-up p95 luma 172–194 against our 94–104;
blacks ~10 against ~0) and found that a side key throws hair shadows across DEV's eyes. Try a character key that
brightens the lit side without face shadows, plus a slight black lift. Show me three options side by side with the
reference; change nothing until I pick.

**M5.4 · Cutting and camera life.** The reference averages 1.93 s per shot against our 2.64 s, and 1% near-still
frames against our 16%. Add reaction cuts in the shot planner and a slow drift on every hold, including inserts.
Measure both numbers again.

**M5.5 · Studio on a phone.** Put the film monitor above the controls at phone width; check on a real phone if I can
give you one, otherwise in emulation.

**M5.6 · Robustness.** `tools/render-episode.mjs` must fail (non-zero, no empty file) when ffmpeg fails. Add CI for
`export-codec-browser`, and check that the M4 tests run in GitHub Actions.

Each step ends with a re-render of the affected shots next to the reference frames, and the landing media re-made
if the films change. Start by reading the files above and running the unit tests, then tell me the plan for M5.1
in a few lines before drawing anything.
