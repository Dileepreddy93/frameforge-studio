# P1 Ara pinned model-generation experiment — actual execution contract
Date: 2026-10-24. Branch feature/p1-ara-character-spike.

Repo: https://github.com/olatunde85/3d-gen pinned to **8aa993d7141b6f37e5d16f611264e6f1ab520f30**. This is a NEW community repo, not a vetted professional asset supplier.

- Code MIT. Data from MakeHuman CC0 base/system pack; scripts/ASSETS_LICENSE.txt also notes CMU motion-capture takes subject to separate no-resale wording. Only test outputs with documented rights are candidates.
- GitHub Actions isolated job (no stored checkout credentials, read-only token) clones exact source revision. It runs npm ci via upstream lockfile, setup-assets (external MakeHuman data, rolling asset commit and ~280MB archive), then exports **one** medium-quality "Athletic man" GLB (game rig, clips, facial blendshapes true by default).
- It uses FrameForge's real self-contained GLB loader, not the vendor's promotional screenshots; verifies skin count, morph channels and animations plus 4 turnarounds / 4 face emotions / one action frame in real headless Chromium.
- Retains original generated GLB and PNGs as Actions artifact; no vendor code or giant binary committed to FrameForge source, no paid SaaS API.
- Not fully reproducible until MakeHuman source commit and asset archive checksum are pinned. The upstream code could fail if mirrors/network change.
- **Exit means** a structurally valid and visually inspectable REAL human asset. **Does not mean** it looks excellent, lip sync is correct, or our film engine already renders it in Zero Latency.
- Treat CI failure as actionable defect/report, not permission to silently fall back to another low-detail toy mesh.
- Check budget: a one-time job with max 28 GitHub-hosted runner minutes and large network download; use existing account's hosted runner allowance, which may be metered. Not continuously scheduled.
