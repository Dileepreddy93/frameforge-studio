#!/bin/bash
# Replaced by tools/deploy.sh (2026-11-09): production ships from a release tag on main that passed CI.
#   tools/deploy.sh <tag> --prod
echo "tools/deploy-v6.sh is retired. Use: tools/deploy.sh <tag> --prod   (or --staging / --stage-only)" >&2
exit 2
