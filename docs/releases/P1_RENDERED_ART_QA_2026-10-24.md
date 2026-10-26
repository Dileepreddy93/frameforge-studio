# P1 — Real-render art QA, user-visible candidate REJECTED
Date: 2026-10-24. Feature head source 83f512773fe927fd395217fc5a7e356fd57bf1d9.
Independent CI: https://github.com/Dileepreddy93/frameforge-studio/actions/runs/40093527917 — conclusion SUCCESS for technical tests, but **NOT a visual quality approval**.
Artifact (actual browser-rendered native PNGs): `frameforge-p1-identity-24-real-frames` / artifact 12560052408. Review all 24 actor frames rather than only chosen front stills.

## Real visual evidence inspected
All 24 extracted 360x460 native WebGL PNG images were opened at usable scale: DEV 4 body views + 4 face expressions, BLUE and ORANGE same. This is after outward-winding correction in `sweptLock`. No source CGI film or private reference model was reused.

**DEV / human:** The new swept strand loft fixes the disconnected spherical-tuft construction and survives all four camera angles. However, the locks now read as a **comb of overly regular segmented ridges** rather than naturally grouped sculpted hair, with protruding temple piece in side view. Facial features remain visibly simplified: eyebrow bars float visually, mouth dark/flat, nose starkly faceted, expressions abrupt and not fully anatomically coordinated. Hoodie is still capsule-shaped with thin pocket/trim accents instead of genuinely tailored cloth; arms/feet static and toy-like. **Not good enough to lock as an approved character.**

**BLUE/ORANGE robots:** front, 3/4, side, back distinguish the visor shell, side pods, arms and feet consistently, but characters differ mostly by body color. Expression portraits change almost only tiny mouth shapes / eyebrow highlights, not a meaningful emotional performance. Head, glossy visor and chrome ring remain too dominant in tight crop. No reliable claim of reference artistic parity.

## Pixel sanity measurements (NOT perceived-quality ratings)
Average absolute RGB difference per pixel from each same-camera neutral emotion image, as 8-bit channel values across entire 360x460 frame:
| Actor | Happy | Worried | Surprised |
| --- | ---: | ---: | ---: |
| DEV | 7.93 | 17.09 | 11.97 |
| BLUE | 2.00 | 3.40 | 2.62 |
| ORANGE | 1.55 | 2.64 | 2.22 |

Robot expression differences are modest even by this coarse image metric; larger numeric differences do NOT imply better acting. Measurements depend on pose, lighting and the fixed image area. Facial/perceptual analysis remains required.

## Acceptance decision
- **P1 STATIC ART GATE: REJECTED / NOT_APPROVED.** Technical CI three jobs PASS; this is evidence the art renders, not that it meets the target.
- Experimental branch/PR #8 deliberately remains OPEN and DRAFT. Do not merge into develop or deploy as a finished character.
- Original protected V3/main, merged V5.3 develop, Phase0 reference audit and released MP4s remain unchanged.
- This one procedural loft is a documented learnings experiment; continuing to add isolated primitives has diminishing returns. The next primary engineering effort is a proper **sculpted, skinned character asset and morph/VRM pipeline** with original / CC0 source assets.

## Next specific correction (issue #9)
1. Obtain an original or CC0 license-cleared character mesh with coherent topology, UV/PBR materials and animation skeleton. Evaluate MakeHuman CC0 model data (source application has separate AGPL) and Blender for shaping; MIT `@pixiv/three-vrm` and M3 CharacterStudio for runtime imports.
2. Side-by-side same-size original DEV vs new rig: front, 3/4, profile, rear, happy/worried/surprised + at least five second muted emotional animation. Same color/light/background/relative framing.
3. Design a proper facial-expression atlas: brow deformation, lid closures, cheek shape, mouth corners, jaw and viseme channels, not rigid eyebrow strokes pasted over a skull.
4. Reject until head/hair/neck silhouette and body proportions support convincing closeups AND character identity stays fixed throughout animation.
5. No new paid dependency, binary redistribution without license or production promotion. Provide meaningful real browser PNGs and film evidence.

Supplementary finishing tool issue #10: JSONCut's **free preview does not include free export/API**, so its optional P5/P7 benchmark must not become mandatory.
