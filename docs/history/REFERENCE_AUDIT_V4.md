# FrameForge V4 evidence and root-cause audit

## Artifact identity and limits
- Requested reference `git-blame.mp4`: not located in current mounted/project files. It has **not** been inspected; no source-identical reverse engineering is claimed.
- Available conversation candidate `65469.mp4`: H.264/AAC, 720×1280, 30 FPS, 41.8 seconds. Its 16-frame contact sheet clearly shows a PIXEL STORIES episode with expressive angular characters, developer/computer screens, varied angles, title banners and readable captions. Identity as `git-blame.mp4` remains unverified.
- Baseline `media/zero-latency-acting-v3-with-foley.mp4`: 41.8-second V3 film, 480×854 H.264/AAC. `v3.0-stable` and Vercel production remain unchanged.
- V4 code lives on `feature/cinematic-v4-facial-performance`; this audit does not claim reference-level parity.

## Ranked deficiencies, causes, remedies
| Priority | Actual source evidence | Cause | Correction and test |
|---|---|---|---|
| 1 | Robot camera lookAt heights 1.5/1.65, head center about 2.2 | Camera framing retained pre-redesign torso targets | Reframe on eyes at ~2.13; inspect 14 shot frames |
| 2 | One camera per dialogue line despite emotional exchanges | No end-of-line listener reaction grammar | Six authored reaction cut locations; assert actual camera delta over cut threshold |
| 3 | Screen shots were generic zero-number plates | Software interaction not communicated cinematically | Story-relevant telemetry with requests and customer status; inspect frames at 19–27s |
| 4 | Robot gaze oscillated regardless of who speaks | Speaking/listening state not used by face renderer | Per-speaker gaze and responsive facial reaction; inspect eyes in real frames |
| 5 | estimateViseme() allocates text characters over shot duration | Heuristic text progression, no verified phoneme or word timestamps | Keep honest status; real alignment and manual auditory QA remain required |
| 6 | Simplified character rigs and procedural Foley | Limited facial controls and authored sound timing | Next performance/viseme pass; inspect full video and audible sync |
| 7 | V3 480×854 rather than reference candidate 720×1280 | Preview/software rendering constraints | Test higher resolution only after quality and stable export |

## Required evidence before release
- Source syntax, no console errors or failed critical media requests
- Actually rendered 30-FPS frames from multiple shots and before/after reaction cuts
- Full MP4 duration/frame count/codec/decode/size + stereo audio levels (integrated LUFS and true peak where available)
- Contact-sheet visual review against identified reference candidate; explicit limitations
- No production deployment until V4 passes a full user-reviewable cut
