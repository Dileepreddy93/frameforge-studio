#!/bin/bash
# Deploy V6 to the Vercel project frameforge-v6 (https://frameforge-v6.vercel.app), the M4.5 way: from a staged copy
# outside the repo. Never from the repo folder, whose .vercel link points to the protected project.
#   tools/deploy-v6.sh            stage the committed files and deploy to production
#   tools/deploy-v6.sh --stage    stage only, and list what would ship
# FRAMEFORGE_V6_STAGE overrides the staged copy (default ~/Desktop/Animate/deploy/frameforge-v6).
set -euo pipefail
REPO=$(cd "$(dirname "$0")/.." && pwd)
STAGE=${FRAMEFORGE_V6_STAGE:-$HOME/Desktop/Animate/deploy/frameforge-v6}
V6_PROJECT=prj_nKz4mDnSN1D9bXwL6SEIk5DY43kG   # frameforge-v6 (docs/releases/M4_5_DEPLOY_V6.md)

case "$(cd "$STAGE" 2>/dev/null && pwd)/" in "$REPO"/*) echo "refusing: the staged copy is inside the repo"; exit 1;; esac
LINK="$STAGE/.vercel/project.json"
[ -f "$LINK" ] || { echo "no $LINK: link the staged copy to frameforge-v6 first (docs/releases/M4_5_DEPLOY_V6.md)"; exit 1; }
grep -q "$V6_PROJECT" "$LINK" || { echo "refusing: $STAGE is not linked to frameforge-v6:"; cat "$LINK"; exit 1; }

cd "$REPO"
[ -z "$(git status --porcelain)" ] || { echo "refusing: commit or stash your changes first (the deploy ships committed files)"; exit 1; }
rsync -a --delete --exclude-from=<(grep -v '^#' .vercelignore | sed '/^$/d') --exclude=.git --exclude=.vercel \
  --exclude=.github --exclude='*.md' ./ "$STAGE/"
cp assets/voice/NOTICE.md "$STAGE/assets/voice/"
echo "Staged $(git rev-parse --short HEAD) ($(git rev-parse --abbrev-ref HEAD)): $(find "$STAGE" -type f -not -path '*/.vercel/*' | wc -l | tr -d ' ') files, $(du -sh "$STAGE" | cut -f1)"
[ "${1:-}" = "--stage" ] && exit 0

cd "$STAGE"
vercel deploy --prod --yes
echo "Live: https://frameforge-v6.vercel.app  (studio: /studio.html). Check it from the repo: node tools/deployed-check.cjs https://frameforge-v6.vercel.app/ <out-dir>"
