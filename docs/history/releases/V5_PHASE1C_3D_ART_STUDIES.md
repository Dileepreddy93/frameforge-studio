# FrameForge V5 — Phase 1C verified 3D art studies

**Status: TECHNICAL CHECKPOINT ONLY. Art direction and Phase 1 NOT YET APPROVED.** No production change.

## Reference-derived requirements

- NMXWZ-1.pdf (five-page user guide): same-scale front, three-quarter, side, rear turnarounds, plus four facial expressions; an independent empty 9:16 environment first frame with safe caption space. No claim that a static reference is an editable 3D rig.
- Agent Poly Studios public site: marketed seven emotions, thirteen body actions, six camera views, and styling combinations. These are public marketing features, not a privately inspected engine.
- Claude & Pixel public site: shows five playable episode examples including Git Blame (advertised around 52 seconds), a code-based Three.js and voices/timestamps/headless-Chrome/FFmpeg pipeline. The exact Git Blame MP4 file was not downloaded and checksummed in this session (direct cloud HTTP client received 403), so no claim of exact frame parity.
- Existing project references remain separately catalogued in spec/reference-register.json.

## Implemented original rendering system

- character-lab.html runs against the actual FrameForge index.html Three.js meshes. It is not independent/generated portraits.
- Three actors: DEV, BLUE, ORANGE.
- Four views (front, 3/4, side, back) and four expressions (neutral, happy, worried, surprised).
- Fixed camera and scene lights for side-by-side turnaround, deterministic pose capture, restoration of camera and renderer after each image.
- Environment-only 9:16 capture hides all actors, using the original stage and props.
- Downloadable 1440x1000 contact sheet and clear UNAPPROVED state.

## Tests that really ran (2026-10-24)

- DEV: 8 frames, 7 distinct SHA-256 image hashes (front neutral intentionally repeats).
- BLUE: 8 frames, 7 distinct hashes.
- ORANGE: 8 frames, 7 distinct hashes.
- Every actor test ran separately in headless Chromium with exit code 0, HTTP 200 and zero page JavaScript errors. Browser contact-sheet download succeeded.
- Environment-only PNG: 360x640, 131204 bytes.
- Public uploads downloaded again HTTP 200 and verified byte-for-byte against the rendered original.
- Existing V4 source parsing and project regression checks passed.

## Downloadable visual evidence (actual PNGs)

| Subject | SHA-256 | URL |
|---|---|---|
| DEV | 53debfbb618014b3906cca0d33ea7e71433286745a3cb1da0b9f93051d3b725e | https://agz0k9i7nymp3png.public.blob.vercel-storage.com/frameforge/v5-phase1-dev-unapproved.png |
| BLUE | f73d9a0f2be9e774617e8a6ac64e5e7b3027735e7c6edc7834059e60af8ccc2e | https://agz0k9i7nymp3png.public.blob.vercel-storage.com/frameforge/v5-phase1-blue-unapproved.png |
| ORANGE | 84a448df6dc75692c97ed2006b93e2100a2cb479daa25299e98b30f51493e978 | https://agz0k9i7nymp3png.public.blob.vercel-storage.com/frameforge/v5-phase1-orange-unapproved.png |
| Environment | 04ea0bb3fa4c91685f75b2b062b5b28467356a2c432acbcf0ce3008a5830ed47 | https://agz0k9i7nymp3png.public.blob.vercel-storage.com/frameforge/v5-phase1-environment-unapproved.png |

## Explicit blocking issues

1. Human facial acting remains simplistic, and proportions/clothing detail lack authored appeal.
2. Robot emotion states differ technically but still read too similarly at thumbnail size.
3. Lighting, prop depth, top-caption safe zone and environment identity have not passed visual approval.
4. The remaining Agent Poly style repertoire (seven emotions, thirteen actions, six cameras) is a target, not yet implemented or validated.
5. Lip-sync still uses heuristic voice envelope, not accurate phoneme/word timestamps.
6. The exact Git Blame video is playable on the source website, but its bytes were not recovered for frame-by-frame comparison.
7. No new full-length V5 film was rendered; verified V4 remains the last complete film.

## How to reproduce

Serve this feature branch with a real HTTP server and visit character-lab.html. Automated browser QA can be run one actor at a time with an installed Playwright Chromium:

FRAMEFORGE_URL=http://127.0.0.1:8959/ node tests/character-art-browser.cjs dev

Repeat for blue and orange. The studio needs its existing media and CDN assets for full audio previews; art QA can run with the captured animation state.

Keep main, V3 production, v3.0-stable, v4.0-rc1, v5.0-phase0, and v5.1-phase1b unchanged until a real acceptance gate.

