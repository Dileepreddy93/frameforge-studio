# Phase 1 review candidate — sculpted hair and more cohesive DEV face
Date: 2026-10-24 | Branch: feature/p1-character-identity-art-revision

## Baseline inspected visually
We inspected actual preserved `assets/v5-art-evidence/dev-04-neutral.png`, `dev-05-happy.png`, `blue-06-worried.png`, `orange-07-surprised.png` through GitHub. Human shows repeated detached hair spheres, bulky dark mouth and heavy clay-toy anatomy. Robots are more coherent but facial displays are simplistic, and none has art approval.

## Hypothesis and code changes (NOT YET approved art)
- Replace DEV's 10 sphere tufts and 7 faceted bobbles with a closed tapered variable-radius 3D multi-ring hairstyle loft. Include continuous hair cap, swept front strands and integrated temple/side geometry; preserve four angles and film source rig.
- Balance the skin tone, shrink nose/mouth and moustache; add hoodie pocket and seams for stable silhouette instead of disconnected toy blocks.
- Preserve the exact animation model and production movie behavior; do not add external AI art, textures or dependencies.
- Update Chromium CI to export all 24 real captured character views+emotions as native PNGs for *manual* art inspection. Basic image hashes do not prove film quality.

## Required pass criteria
1. Current Playwright art sheets pass for DEV, BLUE, ORANGE. 24 actual PNGs retained under CI artifact `frameforge-p1-identity-24-real-frames`.
2. Inspect DEV all four angles and all emotions at native pixel size vs preserved baseline. Reject seams, floating hair, hidden eyes, brows, cropped hair or disconnected pocket parts.
3. Inspect BLUE/ORANGE unchanged screenshots for regressions; report separately.
4. Run full movie export and visually sample closeups; technical pass not artistic approval.
5. Compare to actual Git Blame reference SHA256-verified frame matrix `spec/git-blame-reference.json`; no subjective parity score without human visual review.
6. IF static lineup truly compelling, move into P2 acting; otherwise iterate geometry/model design. None of this implies full arbitrary character customizer.

## Actual post-implementation evidence
CI run 40093527917 of corrected commit 83f512 succeeded and preserved 24 actual WebGL PNGs in artifact 12560052408. Those frames were individually inspected. **Art gate is rejected**: overly comb-like hair, flat mouth/face, capsule clothing, weak robot expressions. See docs/releases/P1_RENDERED_ART_QA_2026-10-24.md. No merge to develop/production permitted on this evidence.
