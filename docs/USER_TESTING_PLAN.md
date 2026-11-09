# Phase 9 · Proving people want it: the creator test

Everything a person needs to run the test. It can't be automated: it needs real creators.

## Who
**5–10 people** who post Reels, Shorts or TikToks, who didn't build FrameForge and have never seen it.
- At least two who don't write code.
- At least two on a laptop with integrated graphics.

## Before each session
- Record the device and browser in `docs/DEVICE_MATRIX.md`.
- Consent: explain they're testing the product, not themselves, and that the session (screen and voice) is only
  recorded if they agree.
- Start from the public landing page in a fresh browser profile.

## The task (say only this)
"Make a 20–30 second film you'd actually post, about anything you like. Think out loud. I can't help unless you're
completely stuck."

## What to measure
| Measure | How |
|---|---|
| Finished? | Yes, partly, or blocked (where) |
| Time to first exported film | Stopwatch from landing page to MP4 on disk |
| Where they got stuck | Every pause over 20 s, with a note of what they were trying to do |
| Errors | The Creator's *Report a problem* text, downloaded |
| Would they post it? | 1–5 |
| Ease | 1–5 |
| Price | "Would you pay for this? How much a month?" Choices: nothing, $3, $7, $12, $20, not sure |

The Creator's local, opt-in research mode (`src/beta-research.mjs`, the beta guide page) records the same steps on
the participant's own computer and can export them. Nothing is sent anywhere.

## After 5 sessions
- List the top 5 problems and fix them, then repeat with new people.
- **Done when:**
  - at least 7 of 10 new creators finish a film unaided in under 20 minutes
  - at least half say they'd pay at a stated price
  - the top problems are fixed
- Then build login and payments.

## Needs the owner
- Recruiting the people.
- Choosing the 2–3 price points for a pricing page.
- A support email.
- A way to count visits without personal data. Vercel Web Analytics is cookie-free and needs switching on in the
  Vercel dashboard for `frameforge-v6`.
