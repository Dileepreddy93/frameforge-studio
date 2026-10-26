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

## Timestamped evidence extraction (P0.5)
python3 tools/capture_reference.py media/v4-review/frameforge-v4-complete-director-41s.mp4 --allow-own --out artifacts/local-v4 --times 0.8,7.95,17.7,30.5,40.8
python3 tools/capture_reference.py /path/to/git-blame.mp4 --out artifacts/exact-target --times 0.8,3,7.95,15,22,31,41,50
Creates a new directory; refuses to overwrite existing directories, takes unscaled native PNGs, hashes source and stills and writes manifest.json. Filename validation is NOT publisher identity authentication. Do not commit copyrighted full reference MP4.

## Exact reference byte acceptance (2026-10-24)
Actual user-designated file: SHA256 `560ca0dd7fc3b8f0e762dd818423a15e2192029f40383765a5db52b49029247e` / 3,365,415 bytes, measured 52.181 seconds and 1,564 frames. `node tools/verify-phase0.mjs --reference /absolute/path/to/git-blame.mp4` now checks EXPECTED hash and stream properties; merely naming a different file `git-blame.mp4` will fail. `spec/git-blame-reference.json` pins 24 reproducible native-frame output hashes. This binary is not shipped with the Git repository. New chats must regain authorized access to those bytes for re-decoding.
