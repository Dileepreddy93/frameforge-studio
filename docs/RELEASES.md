# FrameForge releases

Every deploy is a tag on `main` shipped with `tools/deploy.sh <tag> --staging|--prod` (see README → Deploying).
Newest first. "Staging" = `frameforge-hybrid-beta` (SSO-protected); "Production" = https://frameforge-v6.vercel.app.

| Tag | Commit | Where | Date | Notes |
|---|---|---|---|---|
| `v7.0.0-rc.1` | `264d97f` | Staging, 2026-11-09 (`frameforge-hybrid-beta-b29lsg4ti…`) | 2026-11-09 | Phase 0 check: first tag-based deploy. READY, tagged in Vercel with commit and tag, public access → login (302). |
| `v6.0.0` | `2b78e60` | Production (since 2026-11-01); also staging 2026-11-09 (`…-enoyayota…`) as the rollback test | tagged 2026-11-09 | V6 after M6.5. The rollback test deployed it with the same command. |
