# FrameForge Studio — master engineering + artistic acceptance checklist

Snapshot 2026-10-24. This consolidates the earlier conversations, NMXWZ five-page workflow, Claude & Pixel and Agent Poly public references, Studio Reverse Engineering Report and actual project QA. Completion evidence is in spec/quality-gates.json. A source test does NOT mean artistic quality has passed.

## P0 — Research and evidence preservation
- [x] Preserve main stable V3, develop V4, feature V5, and v3.0-stable / v4.0-rc1 / v5.0-phase0 / v5.1-phase1b / v5.1-phase1c-artstudies tags.
- [x] Preserve V3 stable MP4 and audio, full V4 review film, V4 shorts, original V5 character contact sheets and 24 raw 3D PNG test frames.
- [x] Record primary websites, confidence limits, licensing cautions and known failures.
- [x] Record reference-engineering quality requirements, honest phases and restore instructions.
- [ ] Obtain, locally hash and analyze the exact user-named Git Blame reference MP4. Website sample or a differently named upload is NOT equivalent.
- [ ] Archive the actual NMXWZ PDF and reverse-engineering report if authorized bytes are accessible in a new chat/Project; current repo has detailed notes but no complete original attachments.
- [ ] Make an exact reference shot/action/camera/voice/sound/lighting/typography timing matrix.
- [ ] Freeze exact tool/package/runtime versions and prove a fresh clean-room clone and browser render.

## P1 — Real art direction, reusable characters and scenes
- [x] Versioned JSON format for characters, shots, speakers, camera, timing, voice locks and visual style.
- [x] Zero Latency original 14 scenes and Mystery 6-shot storyboard load, with import/edit/export tests.
- [x] Real Three.js character-lab for DEV, BLUE and ORANGE, four angles plus four emotions each.
- [x] Environment first-frame preview and render-captured PNG evidence (NOT approved artistic assets).
- [ ] Approve an original distinctive show bible: head/body scale, authentic silhouettes, character proportions, material palettes, hair, outfit, props, character identity across shots.
- [ ] Verify same-scale front / three-quarter / side / back and multiple emotion poses against real reference design quality, not simple differences in PNG hash.
- [ ] Fix disconnected body parts, expression inconsistency, unconvincing eyelids/pupils/hair/costume and visible model collisions.
- [ ] Approve character-specific facial rigs capable of sustained dialog close-ups at true mobile viewing size.
- [ ] Approve real 9:16 environment, foreground/midground/background depth, keys/fills/rims, shadow contacts, desk/screen readability and source-specific lighting.
- [ ] Record actual first-frame approvals and asset checksums, rather than marking unreviewed artwork complete.
- [ ] Create a second independent episode without editing engine code, proving real scene data reuse.
- [ ] Enable persistent project edits, undo/redo and reload from disk/browser storage.

## P2 — Performance and animation
- [ ] Distinct character personalities, action library, emotion changes, brow/eyelid/eye direction, gaze locks, asymmetrical microexpression and blinking.
- [ ] Natural gestures: hands, wrists, fingers, shoulders, neck, torso, spine, body weight, balance, breathing, idle and physical anticipation.
- [ ] Emotional staging across setup/escalation/reveal/payoff; reaction, silence, pause, attack, release, follow-through, settling.
- [ ] Rig mouth family tied to actual aligned phoneme or validated word timestamps; do not present V4 volume/text heuristic as genuine lip-sync.
- [ ] Prevent motion snapping, clipping, head/hair/limb intersections, camera-boundary pose resets and synchrony drift.
- [ ] Verify real animated footage of each emotion and body action, not just static expression sheet.

## P3 — Cinematography, sets and continuity
- [ ] Beat-structured storyboarding; hook/setup/escalation/reaction/punchline with every shot recording actor/emotion/camera/motion/lighting/script.
- [ ] Intentional close-up, OTS, two-shot, insert, wide, push/pan, pause and reaction cuts, with consistent eyelines and screen direction.
- [ ] Eyeline-height and composition safety; no head crop, crowded wide shots, body part clipping or important off-screen actors.
- [ ] Layered believable set dressing, displays, keyboard, effects, shadows, lighting gradients and intentional background storytelling.
- [ ] Stable exposure/material/identity and physical continuity through all shots.
- [ ] Silent contact-sheet comparison against actual reference, and verify comprehension even without dialog/captions.

## P4 — Voice, audio, sync and captions
- [ ] Validated free/licensable voice identities for English, Telugu and Hindi with distinct personalities and controlled pronunciation/consistency.
- [ ] Real line-by-line voices, emotional pacing, sample-accurate starts, silences, breaths and aligned word timestamps.
- [ ] Sync mouth/body/camera/caption beats to actual voice data and test audible/visual precision, not just file loudness.
- [ ] Foley and ambience sheet: movement, typing, footsteps, impacts, UI, air/room tone, music and transitions, with ducking.
- [ ] Real listen-through and mix revision: clarity, drama, jokes, music balance, unwanted artifacts, true peak and LUFS for chosen platform.
- [ ] Word-level color-coded 1–4 word captions, punchline animation, stroke/outline, karaoke highlights, readable timing and accurate language support.
- [ ] Dynamic face/screen/prop safe-zone checks on target mobile apps; NMXWZ example top 220/bottom 420 pixels is NOT a universal rule.
- [ ] Preserve independent clean-video, dialog, Foley and captioned masters.

## P5 — Verified native rendering
- [x] V4 pipeline technical evidence: complete 41.842 s MP4, H.264 480x854, 1254 frames at 30 fps, stereo AAC and mobile playback; not native 1080x1920.
- [x] V4 timed 15-second A/V segments and checksum verification.
- [ ] Exact deterministic evaluation under arbitrary seek, paused/reverse scrubbing and offline timeline rendering.
- [ ] Native 1080x1920 @ 30fps (not low-res upscaling) with defensible visual/render cost benchmarking.
- [ ] Test Chrome/FFmpeg vs HyperFrames or alternate exporters before making any switch.
- [ ] Make robust render worker, chunking, retries, progress, timeout, cancellation, resumability and resource safety.
- [ ] Validate entire exported file: frame count, codec, dimensions, audio, LUFS, peaks, decode, AV offsets, duration, byte checksums, actual mobile playback.
- [ ] Inspect every sequence in completed native movie and compare with reference-quality film examples.

## P6 — Real production-ready creator studio
- [ ] Create, edit, undo/redo, save, reopen, rename, duplicate, version, export and restore full projects.
- [ ] True character model customization incl. head/body/face/hair/outfit/lighting/colors/rigged gestures, NOT a separate image-only studio.
- [ ] Reusable asset/preset libraries with stable references, license info, validation, resilient file relinking and clear errors.
- [ ] Scene/timeline editor with dialog, expression, motion, camera, Foley, captions and visual preview all editable.
- [ ] UX usability/responsiveness for mobile and desktop, accessibility, recovery from crashes, import failures and unsupported media.
- [ ] Optional image-to-video provider interface, first-frame consistency + voice locks, provider prices/rate limits/rights audited. No mandatory paid provider.
- [ ] Optional viral/content-intelligence integrations only if actually verified, compliant and worth cost.
- [ ] Second independent episode from the same code and asset library, with no hidden source edits.

## P7 — Reference acceptance, QA and production deployment
- [ ] Make and approve one excellent 5–10 second authentic performance shot.
- [ ] Make and approve an 8–15 second cinematic sequence including synchronized dialog/Foley/camera/captions.
- [ ] Make two complete original polished native-resolution episodes from the reusable system.
- [ ] Compare actual identified source reference to our exported film shot-by-shot for geometry, acting, eye/hair/face/cloth, environments, light, camera, dialog, Foley, music, captions, story, pacing.
- [ ] Real user flow and video/auditory QA with repeated desktop/mobile playback and practical tests.
- [ ] Source licenses, privacy, cost, accessibility, performance, security and reliability checked.
- [ ] Immutable release/source/assets/media manifests, tags, and rollback proof.
- [ ] Independently test isolated public deployment URL and actual MP4, not status-only badges.
- [ ] Promote main/production ONLY after completed-artifact acceptance.

## Working priorities
Do not spend further time rewriting an already tested project parser. The current P1 artistic gate is blocked by character/model/polish deficits, not by missing GitHub permission. User explicitly requests independent judgment and code/render/test commits for later phases. Treat P0 source-evidence uncertainty as open, not forgotten. Do not claim any numerical quality score or benchmark match without direct evidence.
