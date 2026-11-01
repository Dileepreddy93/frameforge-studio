# M6.2 · Autosave, undo/redo and recovery

The goal: a new user never loses work, whether to a refresh, a crash or closing the tab.

## What changed (`studio.html`, "Autosave, undo and recovery")
- **Autosave.** Every change saves 0.5 s later, and leaving the page (`pagehide`, tab hidden) saves at once. A change
  is anything in the episode: lines, speakers, cameras, moves, acting, timing, shot order, looks, voices,
  pronunciations, or making an episode from a script. Saves go to the browser's IndexedDB with
  `durability: 'strict'`, so a save is on disk before it reports done.
  - **localStorage wasn't enough.** It was tried first: the crash test killed Chrome 0.5 s after an edit and the edit
    was gone, because Chrome writes localStorage to disk seconds later. With strict IndexedDB the same test passes.
  - **IndexedDB alone wasn't enough either.** A page being refreshed or closed can be gone before its last
    IndexedDB write commits. On a slow machine, an edit followed at once by a refresh was lost: this container renders
    the 3D monitor in software, which delays the half-second timer. So leaving the page (`pagehide`, tab hidden) also
    writes the unsaved state to localStorage, synchronously, and on start the newer of the two copies is reopened.
    Together: IndexedDB survives a crash, localStorage survives a refresh or close. The test now covers an edit
    followed immediately by a refresh.
- **One saved copy per episode, up to 20.** The status line says "Saved in this browser at 14:02", or why it couldn't
  save.
- **A typed script that hasn't been made yet is saved too.**
- **Recovery.**
  - **On start:** the studio reopens the episode you were on, as you left it, with "Welcome back: “Zero Latency” is
    as you left it (saved 14:02)". The button "Use the original instead" (or "Start from an episode" for episodes
    made from a script) deletes the saved copy first, then opens the original.
  - **From the menu:** choosing an episode with saved changes opens them, with the same note and button.
  - **Unedited episodes:** a refresh simply reopens the one you were on.
  - **Script-made or imported episodes:** they exist nowhere else, so they are saved as soon as they open.
- **Undo and redo.** Buttons above the monitor plus Ctrl+Z, Ctrl+Shift+Z and Ctrl+Y (inside a text box these stay the
  text box's own undo). Up to 100 steps, each a whole-episode snapshot, with the selected shot and time kept. Voicing
  re-times shots by itself; that becomes the new baseline, not an undo step.
- **Voices after recovery:** a recovered episode with changed lines is re-voiced in the browser. Lines already voiced
  come from the voice cache, so it's quick, and works offline.

## Tests
`tests/autosave-browser.cjs` (new) checks, in one browser session:
- saving, undo/redo with the buttons and Ctrl+Z / Ctrl+Shift+Z;
- a refresh recovery (with the note);
- saved changes reopened from the menu, and "Use the original instead" deleting them;
- a typed script surviving a refresh;
- a script-made episode surviving a refresh;
- **the crash case:** Chromium's whole process group killed with SIGKILL right after a save, restarted on the same
  profile, and the edit is there.

Six runs in a row pass. Two flakes on the way were fixed:
- "Use the original instead" now finishes deleting before it loads.
- The test waits for the save before reloading, as a person naturally would; it's within the half-second the studio
  allows.

Unit tests and the full browser list pass; the new test runs in CI.

## Limits
- **This browser, this profile only.** Clearing the browser's site data deletes the saved copies. Download the
  episode to keep it elsewhere.
- **The last half second before a crash can be lost** (the save waits 0.5 s for typing to pause).
- **Private windows** keep the saves only until the window closes.

## Rollback
Revert this commit: no autosave, undo or recovery; the menu opens episodes directly.
