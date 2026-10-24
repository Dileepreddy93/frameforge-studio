# FrameForge V4 director-cut — visual review of the **actual full MP4**

Source: `frameforge-v4-complete-director-41s.mp4`, SHA256 `7aa90314e91208ad14254b70f2e5b8738c3333544789a46ea167b9e41daf4590`.

## Sampled decoded frames

These frames were extracted from the encoded and publicly verified **41.842-second MP4** at:
1.3s (human cold open), 7.95s (robot listener), 17.7s (0ms performance screen),
24.2s (0 customers), 30.5s (robot answer), and 40.8s (wide ending).
They are not generated mockups.

## Confirmed improvements vs V3 baseline

- Human torso geometry is less cubic and robot shells are now cohesive rather than sharp blocks.
- Robot faces are prominent, visible, and deliver large easily-readable eyes and mouths.
- Camera framing is closer to eye level for key dialogue and listener reaction moments.
- The software insert now communicates **which** metric disappeared (page load time vs. actual customers), with styled software UI instead of a single number.
- Camera reaction cuts tested at six locations, all 14 shot-caption lines checked.
- Final full 1254-frame H.264 / AAC exported, decoded successfully and played in mobile Chromium.

## Outstanding material issues

1. **Facial acting:** The stylized human has a simple oval mouth and rigid brows; the robots use recurring eye/mouth display configurations. Nuanced, intent-driven facial transitions are still missing. **Fails artistic parity.**
2. **Body language:** Shoulder gesture range exists but many 2D sampled moments still appear posed rather than weight-shifted or naturally animated. **Fails realistic performance target.**
3. **Composition:** The final wide group frame crowds the orange character at the right edge; it does not have the reference's careful hierarchy and headroom. **Needs blocking pass.**
4. **Scene depth:** Background elements are recognizable but not a rich storytelling environment, and lighting favors dramatic highlights rather than clear, natural material separation. **Needs art-direction pass.**
5. **Synchronization:** Export aligns audio and frames. The mouth movements remain envelope- and text-heuristic-driven, *not proven to follow phoneme timestamps*. **Needs forced alignment or word/phoneme timing.**
6. **Sound:** Measured full V4 integrated loudness -16.2 LUFS, true peak -0.9 dBFS. **Subjective performance / emotional delivery has not been established** from loudness alone.
7. **Resolution:** Current V4 native 480×854 vs. candidate PIXEL reference 720×1280. **Not resolution parity.**
8. **Reference identity:** User named `git-blame.mp4` but that exact asset remains unavailable to this execution context. Historical `65469.mp4` is an **unconfirmed candidate**.

## Quality status and next corrective order

Technical video-pipeline gate: **PASS**.
Character art, performance and precise sync against reference: **NOT PASS**.
Promotion to production: **NOT AUTHORIZED**. Existing V3 stable production remains live.

Recommended next focused quality pass: (1) expressive facial pose library and dialogue-to-animation timing, (2) scene blocking of ending and human close-up, (3) material/lighting art direction, (4) voice/viseme timestamps, (5) longer 720×1280 or 1080×1920 final when software compute permits.
