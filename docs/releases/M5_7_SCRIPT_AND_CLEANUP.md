# M5.7 · Write an episode as a script; every control does what it says

The user asked for the site to be ready for buyers and every part of it checked. An automated audit changed each studio
control and measured what it did to the film frame and to the episode. The controls that did nothing are now fixed or
removed. The biggest gap, writing a new episode, now has a script box.

## The audit (before this step)
Each control changed, then the frame (mean pixel change at 180×320) and the episode data compared. Proof:
`proof/v6/e2e/control-audit.txt`.

| control | result | now |
|---|---|---|
| Story idea + "Build episode timeline" | **did nothing**: the box was overwritten with the template's logline and the button only reloaded the template | replaced by the script box |
| Language (English / Telugu / Hindi) | **did nothing**: the voices are English-only | removed; the help text says English, US and UK voices |
| Set design (Midnight / Sunset / Noir) | **invisible**: changes of 0.17–0.20 levels (the arena covers the background it tinted) | removed |
| Episode template "Mountain mystery" | a V3 storyboard: the developer set with a blank screen, no voices | unlisted (still loaded for the tests) |
| "Title card" | named a shot but appears in no film | renamed "Shot name", now shown in the shot list too |
| Landing page FAQ | said a line is re-voiced by "one command on your computer" (wrong since M2); promised Telugu and Hindi | rewritten |
| Studio notes | "Play the 41.8-second episode…" (it is 36.97 s), "Hindi/Telugu not connected" | rewritten |
| Lighting intensity, camera movement, looks (4 colours), Reset looks, shot editor (line, speaker, camera, move, amount, roll), acting and emotion for each character, timing, voices, pronunciations, reorder/duplicate/delete | all change the frame or the episode as they say (frame changes of 4–37 levels where visible; the robot colours checked on their own close-ups) | unchanged |

## The script box (`src/script-core.js`, new)
The left panel is now **Write an episode**:
- **Start from** opens an episode at once.
- **Script** shows the open episode as plain text and follows edits made in the shot editor until you type in it.
- **Make the episode from this script** plans the script and opens it as "<title> — your script". If voices are
  downloaded it voices every line in the browser; if not, it says how.

Format, one line per shot (also under "How to write it" in the studio):
```
# Bigger Logo
> A designer wants the logo bigger.
[wall bad] logo size = 12 px
DEV (worried): Can we make the logo bigger?
BLUE (happy): Instantly!
ORANGE: How much bigger?
DEV: Just a bit.
BLUE (happy): Done.
[screen good] Logo size = 4,000 km | Visible from the Moon.
DEV (surprised): It's the size of the Moon!
ORANGE: You did say bigger.
```
How the planner directs it:
- **Cameras:** each line on its speaker's close-up. The arena's wide comes on the first change of speaker after
  everyone has been introduced, and a two-shot closes the episode. Three close-ups of one speaker in a row open up to
  a two-shot. `[screen]` makes a screen shot.
- **Acting:** from the emotion and the punctuation. A worried question pleads, a happy exclamation celebrates.
- **Listeners:** a question makes them think, an exclamation surprises them, bad news worries them. The M5.4 shot
  planner then cuts to them on long lines.
- **Music and sound:** music in on the first line, stopped and stung on the last; whoosh plus chime or buzz on screen
  shots.
- **Durations:** estimates until the lines are voiced, which re-times every shot.
- **Mistakes:** each one is reported with its line number and the fix (unknown speaker, unknown emotion, a malformed
  `[wall]` or `[screen]`). Nothing changes until the script is clean.

Evidence the rules match how the films were directed: both hand-directed episodes, read back as scripts and planned
again, get exactly their original cameras, shot for shot (`tests/script-core.test.cjs`).

Also:
- **Screen values shrink to fit.** "4,000 km" was cut off on the story window. Values that fit before keep their size,
  so the two films don't change.
- **Script episodes are ordinary episode files:** download one, open it again, re-voice it, export it.

## Tests
- `tests/script-core.test.cjs` (new): round trips, a new script, acting, music, short scripts, every error.
- `tests/script-browser.cjs` (new) checks the box in the studio:
  - it shows the open episode;
  - it follows shot edits;
  - it reports errors by line;
  - it makes the "Bigger Logo" episode (cameras `dev blue orange wide screen dev duo`, 2 planned reaction cuts);
  - it draws, downloads a valid file, and switches episodes.
- `project-browser` now checks the menu lists only the two episodes and opens one on choice.
- Both new tests run in CI.
- Unit tests (13) and the full browser list pass.

## CI
- **What failed:** run 153 (commit 072a65c on `feature/m5-close-the-look-gap`) failed once. `determinism-browser`
  timed out after 60 s waiting for the studio to load on a slow runner, while the same commit passed on the other
  branch (run 152).
- **Fix:** its waits now match the other browser tests (page 60 s, readiness 120 s). It's still a real failure if the
  studio never loads.

## Proof (`proof/v6/e2e/`)
`control-audit.txt`, `studio-script.png` (the new panel with the help open), `script-episode-frames.jpg` (one frame per
shot of the typed episode), `landing.png`, `template-*.jpg` and `env-*.jpg` (the template and set-design findings).

## Rollback
Revert this commit: the old Quick Create panel, the language and set-design menus, the mystery template in the menu
and the old landing copy come back.
