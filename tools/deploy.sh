#!/bin/bash
# Deploy a release TAG of FrameForge. Only tags on main that passed CI can ship.
#
#   tools/deploy.sh <tag> --staging     preview deploy to frameforge-hybrid-beta (SSO-protected)
#   tools/deploy.sh <tag> --prod        production deploy to frameforge-v6 (https://frameforge-v6.vercel.app)
#   tools/deploy.sh <tag> --stage-only  build the staged copy and list what would ship; deploy nothing
#
# Roll back = deploy the previous tag the same way.
#
# Guards: the tag must exist on origin, point at a commit on origin/main, and that commit must have a green
# "FrameForge code quality" run. Files come from `git archive <tag>` (never the working tree), filtered by the tag's
# .vercelignore, staged OUTSIDE the repo (the repo's own .vercel link points at the protected
# frameforge-3d-director-preview project: never run vercel inside the repo).
set -euo pipefail

TAG=${1:-}; MODE=${2:-}
[ -n "$TAG" ] && [[ "$MODE" =~ ^--(staging|prod|stage-only)$ ]] || { sed -n '2,8p' "$0"; exit 2; }

REPO=$(cd "$(dirname "$0")/.." && pwd)
ROOT=${FRAMEFORGE_DEPLOY_ROOT:-$HOME/Desktop/Animate/deploy}
TEAM=team_0tNIYDBww6gVqvxRn4sRA576
case "$MODE" in
  --prod)    STAGE=$ROOT/frameforge-v6;      PROJECT=prj_nKz4mDnSN1D9bXwL6SEIk5DY43kG; NAME=frameforge-v6 ;;
  *)         STAGE=$ROOT/frameforge-staging; PROJECT=prj_NIQffXRaKOy0lR3t6KkzihvB9RPh; NAME=frameforge-hybrid-beta ;;
esac
case "$(mkdir -p "$STAGE" && cd "$STAGE" && pwd)/" in "$REPO"/*) echo "refusing: the staged copy is inside the repo"; exit 1;; esac

cd "$REPO"
git fetch -q --tags origin main
git rev-parse -q --verify "refs/tags/$TAG" >/dev/null || { echo "refusing: no tag $TAG"; exit 1; }
[ "$(git ls-remote --tags origin "refs/tags/$TAG^{}" "refs/tags/$TAG" | head -1 | cut -f1)" ] || { echo "refusing: $TAG is not pushed"; exit 1; }
SHA=$(git rev-list -n1 "$TAG")
git merge-base --is-ancestor "$SHA" origin/main || { echo "refusing: $TAG ($SHA) is not on origin/main"; exit 1; }

RUN=$(gh run list --commit "$SHA" --workflow project-contract.yml --status success --limit 1 --json databaseId,url --jq '.[0].url // empty' 2>/dev/null || true)
[ -n "$RUN" ] || { echo "refusing: no green 'FrameForge code quality' run for $SHA"; exit 1; }

# Stage the tag's files (not the working tree), minus what .vercelignore keeps out.
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
git archive "$TAG" | tar -x -C "$TMP"
rsync -a --delete --exclude-from=<(grep -v '^[#!]' "$TMP/.vercelignore" | sed '/^$/d') --exclude=.git --exclude=.vercel \
  --exclude=.github --exclude='*.md' "$TMP/" "$STAGE/"
mkdir -p "$STAGE/assets/voice" && cp "$TMP/assets/voice/NOTICE.md" "$STAGE/assets/voice/"
echo "Staged $TAG ($SHA) → $STAGE: $(find "$STAGE" -type f -not -path '*/.vercel/*' | wc -l | tr -d ' ') files, $(du -sh --exclude=.vercel "$STAGE" | cut -f1)"
echo "CI: $RUN"
[ "$MODE" = --stage-only ] && exit 0

LINK="$STAGE/.vercel/project.json"
if [ ! -f "$LINK" ]; then
  mkdir -p "$STAGE/.vercel"
  printf '{"projectId":"%s","orgId":"%s","projectName":"%s"}\n' "$PROJECT" "$TEAM" "$NAME" > "$LINK"
fi
grep -q "$PROJECT" "$LINK" || { echo "refusing: $STAGE is linked elsewhere:"; cat "$LINK"; exit 1; }

cd "$STAGE"
META=(--meta "githubCommitSha=$SHA" --meta "frameforgeTag=$TAG")
if [ "$MODE" = --prod ]; then
  URL=$(vercel deploy --prod --yes "${META[@]}")
  echo "Production: $URL  →  https://frameforge-v6.vercel.app"
else
  URL=$(vercel deploy --yes "${META[@]}")
  echo "Staging (SSO-protected): $URL"
fi
echo "Check it: node tools/deployed-check.cjs $URL/ <out-dir>"
