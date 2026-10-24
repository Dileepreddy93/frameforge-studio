# Phase 1 mobile-sized character lab proof
Feature branch `feature/p1-mobile-character-lab-qa` from develop `b3317bf976f74ffbcc2a236494fb5b446d0b2952` — 2026-10-24.

**Intent:** User currently previews on mobile; desktop Playwright cannot establish mobile usability. This test uses **real Chromium with 390×844 mobile viewport and touch emulation**. It loads the exact 10.6 MB Ara generated human from checked-in GLB, verifies 69 bones and 63 clips, checks no sideways overflow, enables worried emotion, edits a real mouthFrown morph channel to 1.0 and seeks to 0.33s. Actual WebGL PNG and viewport screenshot + sha manifest uploaded as GitHub CI artifact.

**Not claimed:** physical Android/iOS GPU parity, acceptable 30fps on user's phone, artistic performance, native 1080p film render, public Vercel preview. Browser time-to-ready is recorded from hosted GitHub runner but does not imply device/network performance.

**Gate:** the test must pass and actual mobile-viewport PNG must be reviewed before technical mobile-browser subgate can pass. P1 static art acceptance remains **not approved** regardless. Public Vercel preview remains blocked by Vercel GitHub App repository permission (Issue #14) and SSO; do not share broken model URL.
