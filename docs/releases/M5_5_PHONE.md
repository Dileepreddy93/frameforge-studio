# M5.5 · Studio on a phone

At phone width (≤ 700 px) the studio now opens on the film. The monitor and its transport (Play, Stop, scrubber)
come first, then the shot list and inspector, then the production controls. Before, the controls came first, and the
monitor started about 2,600 px down the page.

## What changed
`studio.html`, CSS only, in the existing `max-width: 700px` rule:
- `.wrap` becomes a flex column ordered monitor (`main`), shot inspector (`aside.right`), controls (left `aside`).
  The DOM order is unchanged, so desktop, tablet, keyboard order and the tests' selectors are unaffected.
- The monitor's height is `min(64vh, 100svh − 215px)` (it was `64vh`, at least 400 px). On a short phone the
  transport now fits on the first screen. Its floor is 300 px. Browsers without `svh` keep `64vh`.

Wider than 700 px, nothing changes.

## Measured (Playwright device emulation, Chromium)
Top of the monitor and of the Play button, in page pixels; the visible screen height is in brackets:

| device | monitor before | monitor after | Play after | fits the first screen |
|---|---|---|---|---|
| iPhone 13 (390 × 664) | 2,629 | 154 | 594 (ends 630) | yes |
| Pixel 7 (412 × 839) | 2,578 | 154 | 706 (ends 742) | yes |
| iPhone SE (320 × 568) | 2,713 | 154 | 522 (ends 558) | yes (the monitor is 353 px tall, was 400) |

There's no horizontal overflow on any of them (scroll width = viewport width).

**Not checked on a real phone.** This is emulation in Chromium on Linux: Safari on iOS and real touch scrolling are
untested. If you can, open https://frameforge-v6.vercel.app/studio.html on your phone after the next deploy.

## Proof (`~/Desktop/Animate/proof/v6/M5.5/` on the machine that made it)
`before-*.png`, `after-*.png` (the first screen on each device), `phone-before-after.jpg`.

## Tests
Unit tests. Browser: `studio-editor`, `landing`, `project`, `episode-data`, `determinism` (the film frames don't
depend on the page layout).

## Rollback
Revert this commit: the phone layout goes back to controls first.
