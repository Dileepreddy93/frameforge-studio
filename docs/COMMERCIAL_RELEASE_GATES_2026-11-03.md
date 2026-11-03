# FrameForge public-launch release gates — actual evidence, no assumptions

## Status and scope

This checklist concerns the existing FrameForge Hybrid Creator on `feature/hybrid-foundation` only. Payment and authentication are outside this document. A GitHub green badge alone does not certify customer readiness. The original `main` / public V6 deployment remain unchanged.

### Machine-verifiable hard gates (automate and archive the proof)

- The exact intended source SHA passes all seven GitHub code quality jobs.
- A **different, independent Windows Chrome job** authors ten valid V2 shots, imports them into Creator, synthesizes real local speech, exports a full original 30–60 second 1080×1920 30fps H.264+AAC MP4 and decodes every frame with ffmpeg.
- Film tests must measure sampled prop contact **within 4 cm BEFORE lifting** (not merely in the later attached carry pose), grip continuity across the cut, correct floor placement, scene-panel visibility, and actor/lantern portrait-safe camera framing. Archive wrist, shoulder, handle and frame stills.
- Source and editor state save, recover after immediate refresh, undo/redo, import/export project JSON, reject corrupt projects safely, refuse unvoiced export, cancel safely and explain codec failures.
- Export report records render p50/p95/p99, draw calls, actual encode/canvas transfer time, codec, output dimensions, frame count and audio provenance. No invented performance numbers.
- Verify 360/720/1080 modes independently as supported; don't silently upscale 360p to label 1080p.

### Manual device-compatibility evidence (NOT yet obtained)

Use real devices and record OS version/browser, RAM, GPU, thermal/battery status, 2s export success, full 35s master success, download playback, permissions, recoverability and any crash trace. Test at minimum:
- Windows laptop with Intel integrated graphics and 8GB RAM: Chrome stable and Edge stable
- Android 8GB mid-range device: Chrome stable (touch inputs, model download, speech, export, file handling)
- iPhone iOS Safari: editor and voice behavior; if native AAC/H264 encoding unavailable, show a clear limitation without losing project
- A low-power device with limited memory, slow/unstable internet and offline reload

Viewport emulation **does not** satisfy physical-device acceptance.

### Real creator usability study (NOT yet conducted)

Recruit 5–10 people who have not worked on FrameForge, ideally people who actually publish reels/shorts. Do not give instructions besides the in-product guide:
1. Open a fresh Creator, make a unique 10-shot, 30–60s story with two characters, an environment, at least two emotions and a custom camera beat.
2. Save the project, refresh/reopen it, change one dialogue line and regenerate its voice.
3. Export a video at a supported quality, play it on their own device, and share the final result.
4. Ask separately: time to first preview, confusion points, edits lost, audio/acting quality, perceived reliability, whether they would *actually* pay, and what price they expect.
5. Preserve screen recordings with consent, independent report of every failure and actual video outputs. Treat refusal to pay or poor-looking output as data, not tester error.

Do not substitute a scripted Playwright ten-shot journey for real novice success. A human must judge animation quality and speech clarity against actual competing options.

### Language and claims

Current verified browser speech is **English Kokoro**. Hindi speech exists in some broader Kokoro model distributions, but this project's pinned speech bridge only validates English; Telugu requires a separately licensed and end-to-end-verified provider. Never silently present English phonemes as working Telugu/Hindi. Until both voices are truly synthesized, mouth timing aligns, and speech is independently checked by native speakers, do not market those languages as supported.

Describe current visuals as **stylized original 3D animation**. Do not claim photorealism, professional film equivalence or 10/10 solely because objective codec and geometry checks pass.

### Release decision record

Engineering result: P12 7/7 CI and an actual independently decoded Full HD film were achieved, but repeatability on customers' hardware, creator willingness to pay, multilingual voices, and independent creative quality approval remain open. Release to invited test users first. Publish a new release decision only after obtaining the above evidence, with the exact build SHA and unmodified artifacts.
