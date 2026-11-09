# FrameForge V3 restore instructions

1. Clone private repository and fetch tags.
2. Check out the stable checkpoint with: git switch -c restore-v3 v3.0-stable
3. Start a local server: python3 -m http.server 8080
4. Open http://localhost:8080 and test rendering and playback. Internet required for Three.js CDN and current hosted media.
5. For Vercel restore, deploy root index.html and the three root OGG assets to the EXISTING FrameForge Vercel project with an authorized client and promote the verified build to production only after testing.
6. If public media storage expires, upload the bundled MP4/Foley OGG again and update references in a NEW branch.
7. Verify files using: sha256sum -c docs/SHA256SUMS.txt

Never overwrite the stable checkpoint when testing an experiment. This repository snapshot is not automatically wired to Vercel Git integration.
