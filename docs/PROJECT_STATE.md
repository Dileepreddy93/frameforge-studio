# FrameForge Studio — verified V3 checkpoint

Snapshot date: October 23, 2026.
Git repository visibility: PRIVATE (when pushed).
Vercel project: prj_Jpuh8Hl2FgA78PwWVwCLiB6B9oRP
Vercel team: team_0tNIYDBww6gVqvxRn4sRA576
Studio: https://frameforge-3d-director-preview.vercel.app/
Movie: https://agz0k9i7nymp3png.public.blob.vercel-storage.com/frameforge/zero-latency-acting-v3-with-foley.mp4
Foley: https://agz0k9i7nymp3png.public.blob.vercel-storage.com/frameforge/zero-latency-stereo-foley-v2.ogg

Current implementation:
- Single-page Three.js production studio and playable 14-shot Zero Latency comedy.
- Three synthetic English Kokoro voices and 43 Foley cues.
- Authored camera cuts, title/screen inserts, simplified robotic/human 3D character rigs.
- Improved sets, practical lights, faceted geometry and basic shot-specific gestures.
- Frame-accurate in-browser MP4/H.264/AAC export with WebCodecs/Mediabunny.
- 41.8-second film with 1,254 frames at native 480x854, 30 FPS and stereo AAC.
- Browser and public MP4 media playback verified in prior QA.
- The Vercel production project was deployed from uploaded files and NOT connected to this GitHub repository yet.

Known limitations and honest quality status:
- Not equal to uploaded Claude & Pixel / PIXEL STORIES reference quality.
- Characters still look assembled rather than professionally unified/rigged.
- Facial animation, eye direction and viseme sync underdeveloped.
- Cinematic camera language and reaction acting need improvements.
- Native V3 output is below the 720x1280 reference resolution.
- Hindi/Telugu production voices remain unintegrated.
- Real-time software-only rendering remains slower than finished playback.
- Current browser relies on externally hosted libraries and media.

Do not claim parity or $1M product readiness without actual frame-by-frame qualitative comparison.

Next:
1. Freeze V3 in private GitHub repository and annotated tag.
2. Develop v4 in separate branch without overwriting stable.
3. Produce one 5–10-second cinematic character-performance vertical slice.
4. Compare it with the reference for art direction, expression, acting, materials, lighting and Foley.
5. Only scale to full episodes when quality gates are met.
