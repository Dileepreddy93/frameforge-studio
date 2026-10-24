# P2 actual silent 3D acting film — three-take QA decision
Measured 2026-10-24. Source model is the **same** original generated Ara 10.6MB GLB, original motion keyframes and face morphs, Chromium + FFmpeg, not prompt-to-video footage or 2D dialogue cards.

## Independently verified files
All three films were actually decoded with ffprobe/ffmpeg and representative video frames inspected, at **330 × 590, exactly 5.000 s, 150 frames / 30 FPS, H264/yuv420p and no audio stream**. None is native 1080 × 1920, and none replaces FrameForge's original V4 story.

| Take | File SHA256 | CI run | Artifact ID | Artist verdict |
| --- | --- | --- | --- | --- |
| Baseline 1 (face only) | `d628a3dd85e62bdfb0d5e83594a43122b6c1bbb38d5af5db7fea225650eba806` | 40102526756 | 12562899629 | FAIL: virtually motionless shoulders, toothy surprise |
| Take 2 (13 bone action) | `3b2c3fe4e5c94f537b6c055e55de1be0521b42320b112008dcf69487c46028ad` | 40104156637 | 12563453721 | FAIL: upper body visibly moves, recoil too theatrical |
| Take 3 (moderated spine) | `8682bc719f289c12ba527edac84e317ad1618384e31eb028e9c8abe494616b88` | **40104894497** (all four jobs success) | **12564327492** | FAIL: smoother physical beat, face & set still unconvincing |

## Pixel-based quantitative evidence (decoded video frames, NOT aesthetic quality)
Computed RGB mean absolute difference (0–255), same-size decoded MP4, shoulder/body rectangular region x0:330 y360:570:

| Frame comparison | Baseline | Take 2 | Take 3 |
| --- | ---: | ---: | ---: |
| 0 → 46 (initial → shock) | 2.50 | 33.51 | **31.58** |
| 24 → 46 (suspicion → shock) | 4.17 | 46.08 | **41.73** |
| 46 → 111 (shock → relief) | 1.78 | 22.35 | **21.91** |

At a >10 RGB channel difference threshold the body ROI between frame0→46 changed in 8.01% of pixels at baseline, 63.26% in Take 2 and 60.71% in Take 3. Interpretation: real pixel movement appears in the physical reaction. The algorithm cannot distinguish desirable acting from overly large/unrealistic movements or lighting jitter. Values are tied to this cropping and exact shots.

## What actually improved
1. Real imported rig motions now target 13 captured native bones (spine, shoulders, arms, forearms, neck, eyes, head), with original-pose restoration and random-access deterministic seek.
2. Coordinated visual beats make the head lower during suspicion, recoil on realization, blink in silence, then recover/relax.
3. Exaggerated teeth exposure corrected with jaw reduced to .21/.17 and mouthPucker lips during surprise; eye and eyebrow morphology changes are real GLB data channels.
4. Technical CI covers an actual encoded mute H264 film (full 150-frame decode), PNG keyframes, source tests, asset load, native film export regression. No hidden background synthesis service or paid component.

## Art quality remaining blockers — reject P2 artistic exit gate
- Take 3 still looks like a tech-demo close-up: blank navy background, no purposeful prop/software screen, no interaction or perceptible arm/hand reach despite bone offsets partly visible in narrow vertical framing.
- Face lacks emotional detail: mouth shape and brows change, but cheek/body-weight changes, asymmetric acting and natural eye contact are weak.
- Imported semi-realistic male is not an original, approved stylized character conforming to the reference art bible. Phase 1 was intentionally not approved, which limits how much Phase 2 procedural acting can achieve.
- Exact Git Blame reference shot/audio/style parity and a complete film remain far away. Static art identity and small high-quality prop-mediated performance are **next art-first priorities**, not more micro-adjustments of the same bare-head turn.

## Safe next engineering milestone
1. Prioritize P1 original actor material/face/hair/wardrobe/lighting and a visually compelling static lineup (Issue #13).
2. Give the actor a reason to react: original 3D workstation/phone or software interface prop, staged hand/eyeline/body blocking in a proper medium/reaction/close-up sequence. Improve arm visibility and measured natural joint arcs (Issue #17).
3. Replace five-second single-camera audition with a purposeful 5–10s director-approved scene using multiple readable beats. Compare with SHA-pinned Git Blame sample and review at matching size.
4. Only after P1/P2 art sign-off integrate the rig as reusable film cast and pursue voice alignment, native 1080×1920 export and customizer (P3–P8).
5. Keep `main` & existing preview untouched. Draft PR #16 is verified experimental code but **NOT APPROVED FOR PRODUCTION MERGE**.

No film quality score has been invented from CI green checks.
