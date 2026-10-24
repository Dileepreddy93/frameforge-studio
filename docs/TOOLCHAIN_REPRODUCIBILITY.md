# Phase 0 version and reproducibility contract
Known source imports: Three.js 0.180.0 via jsDelivr; Mediabunny 1.62.1 and @mediabunny/aac-encoder 1.62.1 via jsDelivr. GitHub Actions uses Node 22, Playwright 1.56.1, ubuntu-24.04, Chromium via Playwright installer, ffmpeg apt package and libx264. Exact Chrome/FFmpeg/transitive package hashes are NOT frozen yet.

## Fresh checkout
git clone --branch develop https://github.com/Dileepreddy93/frameforge-studio.git
cd frameforge-studio
git fetch --all --tags
git status --short
git branch -avv
git tag -l
git switch chore/p0-evidence-nine-phase-plan

## Local tests
node tests/phase0-contract.test.mjs
node tools/check-gates.mjs
node tools/verify-phase0.mjs
node tests/project-core.test.cjs
node tests/performance-core.test.cjs

With Node22, FFmpeg, ffprobe installed:
npm install --no-save playwright@1.56.1
npx playwright install --with-deps chromium
node tests/phase0-video-playback.cjs

Optional when raw original exact video is available:
node tools/verify-phase0.mjs --reference /absolute/path/to/git-blame.mp4

This checks V4 checksum, 1,254 frames at 480x854 30 FPS, H264/AAC, container duration and full FFmpeg decode; independent Chromium test checks local archive actual playback advancement. No website/CDN load is required for the video test.
Clean-room reproduction gates remain OPEN until lockfile/transitive dependency versions, browser revision, ffmpeg binary/build and CI OS digest are captured. 1080x1920 memory/performance and HyperFrames comparison remain untested; no extrapolation from 360x640 clips.
