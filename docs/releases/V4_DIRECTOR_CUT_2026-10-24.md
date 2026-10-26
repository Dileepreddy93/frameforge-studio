# FrameForge V4 — verified director-cut render

## Artifact and source identity

- **Release status:** V4 review candidate; not approved as reference-parity and not promoted to production.
- **Created / reviewed:** 2026-10-24.
- **Git branch:** `feature/cinematic-v4-facial-performance`.
- **Source code that produced the film:** GitHub branch state at `23e6093` (subsequent commits changed QA tests only, not the film-rendering code).
- **Private code:** https://github.com/Dileepreddy93/frameforge-studio/tree/feature/cinematic-v4-facial-performance
- **Public final film:** https://agz0k9i7nymp3png.public.blob.vercel-storage.com/frameforge/frameforge-v4-complete-director-41s.mp4
- **SHA-256:** `7aa90314e91208ad14254b70f2e5b8738c3333544789a46ea167b9e41daf4590`
- **Size:** 11,682,636 bytes
- **Native output:** 480 × 854 H.264 at 30 FPS (1,254 decoded frames).
- **Audio:** 44.1-kHz stereo AAC.
- **Container duration:** 41.842358 seconds.
- **Audio measurements:** Integrated −16.2 LUFS, LRA 3.6 LU, true peak −0.9 dBFS.

## Verification evidence

- Encoded file has 1,254 video frames; FFmpeg decoded complete file without error/warning output.
- Download of publicly hosted MP4 returned HTTP 200 and content-type video/mp4, with exact matching SHA-256 checksum.
- Mobile Chromium obtained HTTP 206 video/mp4 range response, metadata at 480×854 and 41.842358 seconds, and actual playback advanced to 0.67 seconds without page errors.
- Separate Playwright full-story regression passed: all 14 caption lines, all 6 designed reaction cuts, screens at 17.75 and 24.3s, and no page-level JavaScript errors.
- Tested 15-second middle segment: 450 frames at 30 FPS, H.264 and stereo AAC; matching audio offset, no decode warnings, −17.0 LUFS, true peak −1.2 dBFS.
- Inspected V4 story sequence frame contact sheets including blue reaction, orange reaction, human close-up, page-time screen, and zero-users screen.

## Improvements over preserved V3

- More cohesive robot and human meshes, and expressive shared LED faces.
- Camera target moves up to eye level and six deliberate listener reaction cut locations.
- Speaker-aware robot eye direction and emotion state.
- Narrative inserts for `0 ms` and `0 active users`, with software telemetry and visual graph.
- A frame-accurate `startTime` export parameter for audio/video aligned test sections.
- Automated browser validation test covering line captions, shot cut boundaries and narrative screens.

## Outstanding limitations

- **NOT reference quality.** Facial articulation and character performance remain simpler and more repetitive than the example; camera/acting improvements are not a substitute for authored expressions.
- Speech-to-mouth movement relies on amplitude and heuristic word/letter cadence. No verified word timestamps or true phoneme alignment.
- The exact user-mentioned `git-blame.mp4` reference was not located. The previously available `65469.mp4` was only considered an *unconfirmed comparison candidate*.
- Source page / assets depend on external CDN and media hosting.
- No claim of proper artistic voice review; audio LUFS/peak do not establish voice acting quality.
- Native render is below the available candidate reference's 720×1280 dimensions.
- Not promoted to Vercel production. V3 remains recoverable via `v3.0-stable`.

## Restore and further iteration

1. Keep `main` and `v3.0-stable` unchanged.
2. Work in feature branches; run `node tests/check-source.mjs`, `node tests/check-v4.mjs`, and `node tests/check-cinematic-v4.mjs`.
3. Run browser QA `tests/render-cinematic.cjs` with a locally served V4 source.
4. Do not deploy production without an explicit reference-quality visual review of the **finished actual MP4**, not merely code validity.
