# Phase 1 mobile-sized character lab proof
Feature branch `feature/p1-mobile-character-lab-qa` from develop `b3317bf976f74ffbcc2a236494fb5b446d0b2952` — 2026-10-24.

**Intent:** User currently previews on mobile; desktop Playwright cannot establish mobile usability. This test uses **real Chromium with 390×844 mobile viewport and touch emulation**. It loads the exact 10.6 MB Ara generated human from checked-in GLB, verifies 69 bones and 63 clips, checks no sideways overflow, enables worried emotion, edits a real mouthFrown morph channel to 1.0 and seeks to 0.33s. Actual WebGL PNG and viewport screenshot + sha manifest uploaded as GitHub CI artifact.

**Not claimed:** physical Android/iOS GPU parity, acceptable 30fps on user's phone, artistic performance, native 1080p film render, public Vercel preview. Browser time-to-ready is recorded from hosted GitHub runner but does not imply device/network performance.

**Gate:** the test must pass and actual mobile-viewport PNG must be reviewed before technical mobile-browser subgate can pass. P1 static art acceptance remains **not approved** regardless. Public Vercel preview remains blocked by Vercel GitHub App repository permission (Issue #14) and SSO; do not share broken model URL.

## Actual verified test outcome — 2026-10-24
- Browser PR #15 tested source commit `5a44587f4a3ebbbf78234452bc6f21d2c161dee5`: [Actions run 40099817197](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/40099817197), **all four jobs SUCCESS**, merged to `develop` as `2c91e6ff5755dd12107f915063aa4f6869520ff1`.
- Artifact 12561864724 `frameforge-p1-human-mobile-chromium`: `mobile-real-lab.png`, `mobile-face-worried.png` and `manifest.json`. Independently inspected 332×565 real mobile-sized WebGL frame: human fills closeup; mouth frown and shoulders in picture; visual expression still needs work.
- Manifest: browser emulation viewport 390×844, scrollWidth=390, canvas 332×565, 69 bones, 9 skinned meshes, 63 clips, 180 per-mesh morph channels, browser errors [], actor click-to-ready 753ms **only on GitHub runner** (NOT real phone benchmark).
- **P1 art exit NOT APPROVED** and platform one-click preview still blocked as documented in Issue #14. New test adds no real physical mobile performance or voice/lip-sync proof.
