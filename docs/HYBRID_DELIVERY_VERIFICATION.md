# FrameForge Hybrid Creator — delivered-film independent acceptance

Status: **engineering verification, NOT commercial or artistic release approval**. Authentication and payments explicitly excluded. Original V6 production must not be modified.

## Independent encoded-film examination

Run on the actual MP4 downloaded from the hybrid Creator:

```sh
node tools/verify-hybrid-delivery.cjs path/to/customer-film.mp4
```

Requires locally installed `ffmpeg` and `ffprobe`. The program **independently** checks:

- Complete H264/AAC video/audio frame decode, 1080×1920 pixels, 30fps, 30–60s duration, and frame counts matching elapsed time.
- Audible 48kHz stereo soundtrack (FFmpeg `volumedetect`) with no digital clipping, not merely an empty AAC stream.
- Five separately decoded original movie frames (start, quarter, middle, three-quarter, end). Reports mean gray brightness, standard deviation, visible/black fractions and SHA256. Refuses movies where all five are blank or identical.
- Rejects missing video, missing audio, incorrect codec, shortened/incomplete MP4, empty frames and silent audio with a nonzero exit status.

`tests/hybrid-delivery-analyzer.test.cjs` verifies zero/gradient signal classification. Confirmed `HYBRID_FINAL_FILM_SIGNAL_ANALYZER_PASS` in [GitHub Actions 41392907068](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41392907068), source-and-project job. **This test is for the analyzer itself, not proof that the current Creator has already produced a complete commercial film.**

## Additional required release acceptance

1. Make a truly new original 30–60-second V2 film with original Kokoro English dialogue and native WebCodecs H264/AAC via actual Creator UI on supported Windows Chrome/Edge. Archive MP4, project JSON, initial/middle/final screenshots and full film independent decode. [Windows Chrome release pipeline](https://github.com/Dileepreddy93/frameforge-studio/actions/runs/41392193307) was actively running at this checkpoint.
2. Analyze this exact downloaded file using the command above. Test audio intelligibility, correct speaker order, expression and lip matching by real listening and viewing; numeric AAC peak tests are **not** speech-quality proof.
3. Reopen project, change dialogue/character/world, regenerate the line, export twice and compare determinism/expected change; reject stale voices and corrupted autosaves.
4. Run reproducible full-film exports on physical Android Chrome and iOS Safari, plus macOS Safari and Windows Chrome/Edge (or show clearly unavailable export where unsupported). Chrome mobile viewport simulation is **not** a physical device.
5. Independently recruit 20 real first-time creators; record unassisted first-film completion, export rate and meaningful feedback. Do not fabricate usability ratings.
6. Separate the frozen V6 screenshot renderer's known baseline self-noise from actual source changes, with recorded original images and measured pixel drift. Do not update frozen image hashes without independent review.
7. Compare two same-script original films against selected commercially licensed references in a blinded creative review. Automated tests cannot certify natural acting or cinematic quality by themselves.

## Staging and production safety

- Current isolated protected beta: https://frameforge-hybrid-beta-adp0c22o7-dileepreddys-projects.vercel.app/creator.html, Vercel deployment `dpl_HudxvnbmpnZ795yTZ2bL7558Cnh9` from SHA `bcec664d6dc12cceb5c3eaf3717bc5f6ac303b09`. Verified **READY**; sign-in may be required. Deployment status is not a human workflow audit.
- Frozen public V6: https://frameforge-v6.vercel.app; original deployed SHA `2b78e60fd484f6590276f041bfafc977aa4ef479`, untouched.
- Before publishing any higher quality rating, attach evidence from completed CI, delivered files and independent reviewers. **10/10 cannot be inferred from green build jobs or a score assigned by the development team.**
