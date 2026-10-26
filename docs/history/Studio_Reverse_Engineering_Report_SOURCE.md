# Studio Reverse Engineering Report — original user-provided Markdown

The content below is a snapshot of the previously uploaded report, not a newly independently verified audit. Claims about creator private code and inaccessible services remain uncertain. Source Files ID: file_00000000b1ec82089d91fb07dab7e90c.

---

# Studio research and build specification

Prepared for Dileep · 23 October 2026 · Public-source inspection

The core result: an original studio in this product category can run with free software and no AI service integration. The graphics, character controls, animation, editing and export are conventional software engineering. Natural dialogue needs recorded speech if the finished product must be completely AI-free. A free local neural voice engine is another option, but remains AI.

This document records an investigation and a proposed implementation. A competing studio has not been implemented or quality-certified in this task.

**Evidence standard**

| Label | Meaning |
|---|---|
| Observed | A public interface, downloaded file, or source expression was inspected directly. |
| Measured | A value was obtained from the downloaded media with FFprobe or FFmpeg. |
| Seller description | The vendor advertises this behavior; the purchased product was not run. |
| Engineering proposal | An independently designed way to build the required behavior. |
| Unverified | Public evidence did not establish the claim. |

The inspection covered both landing pages, public customization and playback controls, a public checkout page, eleven relevant JavaScript/CSS files, nine public MP4s, and two product images. Twelve frames were sampled from each MP4, giving 108 frames for visual inspection. All five Claude & Pixel episode files received technical audio measurements. Source review focused on the relevant application functions; unrelated courses and third-party framework internals were not exhaustively audited.

The paid application archives, backend implementation and original development conversations remain uninspected. Public frontend behavior reveals architecture and interfaces, but does not establish the creators' exact development chronology or every private algorithm. No verified vendor-owned public repository for either paid renderer was found in the targeted searches.

**What the two products are**

| Product | Advertised deliverable | Role of AI in the described workflow |
|---|---|---|
| Agent Poly Studios | Educational pack plus a separate downloadable browser studio and character lab | An external assistant can edit episode data; an external voice/editing workflow supplies speech. |
| Claude & Pixel on promptbase.shop | Educational course plus a downloadable animation project, with a limited cloud-render allowance | Coding agents assist authoring; ElevenLabs supplies voices and music. |

Agent Poly advertises bundled Three.js, offline HTML operation, seven emotions, thirteen actions, six camera views, and a 54-second example. Its specified capture target is 1080 × 1920, 30 fps and 12 Mbps. It describes silent captioned output, followed by an ElevenLabs/CapCut voice workflow. These are product specifications, not independently executed export tests. [A1]

Claude & Pixel describes structured dialogue, voice timing, camera selection, frame-by-frame Chrome capture and FFmpeg mixing. Its public outline names Node, Python, Three.js and an absolute-time scene function. The advertised master target is 1080 × 1920 at 30 fps. Its own description makes ElevenLabs a continuing dependency in the supplied workflow. [P1]

**Agent Poly: public code review**

The downloaded storefront script contains 85 lines. The complete script was reviewed. Its implementation map is:

| Source lines | Responsibility |
|---|---|
| 1 | Scroll restoration |
| 3–11 | Gumroad destinations and manually maintained promotion configuration |
| 12–14 | Clothing, hair and glasses choices |
| 15–29 | Filename selection, video replacement, labels and selected-control state |
| 30–33 | Customization event handlers |
| 34–41 | Product data and checkout navigation |
| 44–56 | Motion preference and playback handling |
| 60–65 | Animated statistics |
| 67–69 | Preview alignment |
| 71–82 | Promotion visibility and countdown |
| 84–85 | Initial scroll positioning |

Six clothing colors × five hair colors × two glasses states select 60 prerecorded variants. A tested purple swatch changed the MP4/poster; no canvas existed. The script contains no character geometry. Its sale count is manually configured. [A2]

The styling is a standalone CSS file. Observed fonts include Bricolage Grotesque, DM Sans and JetBrains Mono. The storefront combines a cream background, orange accents, bordered cards and offset shadows. Cloudflare analytics appears in the document. These observations do not identify its origin hosting platform. [A3; observed DOM]

**Promptbase: public application review**

| Public file | Size | Finding and review scope |
|---|---:|---|
| index-BW6geZEt.js | 304,865 bytes | React rendering, Vite dependency mapping and lazy route imports; relevant routes/dependencies inspected. |
| index-LI7ytPgr.css | 150,574 bytes | Tailwind-style generated utilities and custom styling signatures. |
| ClaudePixelPage-CP8yYbIl.js | 45,228 bytes | Relevant public page functions reviewed: previews, comparison UI, access-dependent views and request interfaces. |
| AuthContext-CmP3NZ_o.js | 2,361 bytes | Firebase authentication/profile handling and purchase synchronization. |
| firebase-Dq6o3f62.js | 363,682 bytes | Auth and Firestore SDK presence verified; SDK internals not audited. |
| regionPricing-DPmXe_LB.js | 14,472 bytes | Target product identifiers and region-dependent pricing inspected. |
| StudioOffer-BUL-YJHf.js | 3,523 bytes | Offer presentation with embedded prerecorded sample. |
| BuyPage-BgN-ds-O.js | 35,613 bytes | Relevant product and checkout presentation inspected. |
| usePurchase-D2EFQC1u.js | 3,993 bytes | Razorpay loading, order creation and verification flow reviewed. |

The course module implements a film/slides carousel and five sample players. Buyer-dependent data and downloads use bearer-token requests. Render submission sends a title and script to a server route; the UI represents queued, rendering, sent and returned-slot states. This proves the client contract, not the backend's correctness or processing machinery. No renderer or direct video-generation API call was established in this course-page module. [P2]

Firebase/Firestore client usage is supported by the authentication wrapper and SDK. The inspected Indian checkout displayed Razorpay and ₹9,199 for the Studio; the course page displayed ₹2,299 for the Guide. The payment hook obtains an order from the server and returns the payment result for verification. These are observations of the public flow, not completed purchases or verified server-side security. [P3–P7]

Google analytics/tag-manager, Meta tracking and Cloudflare analytics scripts were present. Marketing infrastructure is separate from the downloadable animation engine. Merely finding an AI-related package name inside a general SDK is not proof that the studio invokes that service. [Observed DOM; SDK inspection]

**Measured public video files**

Duration below is the container duration. Audio and video stream endpoints can differ slightly. These are compressed website samples; they do not establish the maximum quality of the private renderer.

| Public sample | Duration | Dimensions | Frame rate | Video frames | Integrated loudness |
|---|---:|---:|---:|---:|---:|
| Git Blame | 52.181 s | 720 × 1280 | 30 fps | 1,564 | −14.38 LUFS |
| Rubber Duck | 47.296 s | 720 × 1280 | 30 fps | 1,418 | −14.70 LUFS |
| Nine Dollars | 67.157 s | 720 × 1280 | 30 fps | 2,014 | −14.22 LUFS |
| Kevin | 50.933 s | 720 × 1280 | 30 fps | 1,528 | −14.82 LUFS |
| Demo Day | 45.760 s | 720 × 1280 | 30 fps | 1,372 | −14.37 LUFS |
| Claude & Pixel promotional film | 59.600 s | 1280 × 720 | 30 fps | 1,788 | Not measured |
| Agent Poly human hero loop | 6.000 s | 432 × 640 | 24 fps | 144 | No audio stream |
| Agent Poly robot loop | 6.000 s | 432 × 640 | 24 fps | 144 | No audio stream |
| Agent Poly duo loop | 2.000 s | 720 × 400 | 24 fps | 48 | No audio stream |

All five episode samples contain H.264 video and AAC stereo audio at 48 kHz. Their video bitrates are approximately 0.40–0.44 Mbps, suitable evidence of compressed previews rather than pristine masters. Their metadata includes an FFmpeg/libx264 encoder identifier. That supports FFmpeg encoding, but does not identify the upstream renderer by itself.

FFmpeg loudness analysis measured the original input streams; no revised audio was saved. True peaks ranged from −0.79 to −0.28 dBTP. The integrated readings are close to the seller's approximate −14 LUFS target. AAC encoding and other processing can affect measured peaks. No subjective voice-naturalness score or phoneme-accuracy claim is made from these measurements.

For reproducibility, the measurement methods were `ffprobe -show_format -show_streams -of json` and FFmpeg's `loudnorm` analysis with JSON statistics. The table uses its input measurements, not its proposed normalized-output values.

**What creates the visible quality**

The following are visual observations and independent engineering interpretations, not recovered private shader settings.

Agent Poly's human has a strongly faceted head, oversized facial features, angular hair, simple limbs and a hoodie. A small screen-faced robot supplies the second silhouette. The inspected images establish a floating desktop environment, a large computer, dark negative space and warm background light spots. The character-lab image shows organized emotion, action and material controls. It is a product image, so it demonstrates appearance rather than proving each control works.

Claude & Pixel's samples repeatedly use a purple-clothed human and a red block-shaped robot on an oversized keyboard. Large software panels fill the background. The five episodes preserve recognizable proportions, costume and setting. Shots alternate between close facial framing, medium views and occasional wider compositions. Gestures, eyebrow changes, head inclinations and simple mouth shapes carry the performance. The sampled output is stylized 3D, rather than a target of live-action realism.

| Visible characteristic | Independent implementation approach |
|---|---|
| Faceted faces and clothing | Low-resolution polygon meshes with flat shading; stable material palettes. |
| Readable silhouettes | Deliberately exaggerated proportions and consistent camera distance. |
| Expressive eyes and eyebrows | Separate small meshes or a face texture whose parameters change over time. |
| Simple expressive mouths | A small viseme/shape library, with hand-correctable timing. |
| Body performance | Pivot-based joints with pose blending, anticipation, holds and recovery. |
| Giant keyboard and software backdrop | Repeated key meshes and a canvas-generated screen texture. |
| Warm highlights against dark surroundings | Key/fill/rim lighting, exposure control and restrained bloom. |
| Background glow and depth | Particles or billboards, depth separation and an appropriate focus treatment. |
| Dialogue-driven editing | A rule-based shot selector with explicit overrides. |
| Consistency across episodes | Reuse the same geometry, rig, palette and scene configuration. |

This is why a basic rotating cube demonstration would be an inadequate benchmark. Most of the work is in the character design, timing, framing and composition. Merely choosing the same rendering library would not establish equivalent output quality.

**Free implementation routes**

| Route | Appropriate use | Tradeoff |
|---|---|---|
| Three.js + our own timeline + local render worker | A focused custom studio with complete control over character behavior and editing | We implement authoring, capture and packaging. |
| Three.js + HyperFrames | Reuse an existing local HTML-to-video rendering system | Validate its frame adapter against our scene before committing to it. |
| Blender + Python | More demanding modeling, materials and offline lighting | Larger installation and a different authoring workflow. |
| Godot + scripted animation | A packaged interactive 3D application with offline movie output | More engine integration and a less browser-native product. |

Three.js uses the MIT license. Its documented materials support flat shading; CanvasTexture supports drawing a software display without connecting that display to a real service. [F1–F3]

HyperFrames is an Apache-2.0 project supporting Three.js and other seekable animation adapters. Its local renderer drives headless Chrome and FFmpeg; its documentation offers manual CLI use as well as coding-agent workflows. Local rendering need not call an AI model. Cloud rendering and AI media generation are separate choices. This was verified from its repository and documentation, not benchmarked in this task. [F4–F5]

Blender is free software usable commercially. Godot's documented movie mode advances offline frames and can produce video/audio without depending on real-time playback speed. These are viable alternative engines; neither automatically supplies the particular characters or performances required here. [F6–F7]

The proposed starting route is Three.js with a custom scene/timeline, testing HyperFrames as the export adapter. If the adapter cannot reliably capture the scene, keep the scene contract and use a dedicated local Chromium/FFmpeg worker. That fallback changes capture infrastructure rather than requiring new character assets.

**Strictly no AI versus no paid AI**

| Capability | Strictly AI-free solution | Free local AI option |
|---|---|---|
| Dialogue writing | User-authored text or finite story templates | Optional local language model; additional compute and quality evaluation. |
| Natural voice | Recorded human speech imported as audio | Piper or another evaluated local neural speech system. |
| Synthetic robot speech | Formant synthesis such as eSpeak NG | Neural voice with effects. |
| Mouth motion | Manual visemes, timed syllables, or an audio-envelope-driven mouth | Speech recognition/alignment can automate timing. |
| Captions | Provided text with manual timing or line boundaries | Automatic transcription/alignment. |
| Music and effects | Original composition, synthesizers and appropriately licensed recordings | Optional generative music, with separate model/license review. |
| 3D models, lighting, camera, export | Conventional code throughout | AI is unnecessary for these functions. |

eSpeak NG explicitly uses formant synthesis and acknowledges its naturalness limitations. It is suitable for a deliberate synthetic character voice, not a justified promise of ElevenLabs-equivalent expressive speech. Piper is a local neural engine: avoiding API fees does not make it non-AI. Rhubarb can generate mouth cues from recordings, but its recognizer-based design should not be quietly labeled a purely rules-only solution. [F8–F10]

An AI-free runtime can still be developed with help from this assistant. Development assistance and a customer-facing dependency are different choices. The delivered application can contain no API key field, model dependency or subscription requirement.

**Proposed application architecture**

Build the product around a versioned scene document. The editor and exporter read the same data so changing a line does not require rewriting the renderer.

| Module | Responsibility |
|---|---|
| Scene document | Cast, appearance, environment, dialogue, audio references, actions, shots, captions and duration. |
| Character factory | Construct original geometry, pivot hierarchy, facial controls and material slots. |
| Performance evaluator | Turn absolute time and action data into poses and expressions. |
| Audio/timing editor | Import speech, adjust line boundaries and mouth cues, retain silent beats. |
| Camera director | Choose or accept shot assignments; interpolate camera and target movement. |
| Scene renderer | Draw geometry, screen textures, lighting, shadows and post-processing. |
| Transport/editor | Play, pause, scrub, undo, change looks and edit dialogue with validation. |
| Project storage | Save/reopen local project data and imported media; provide portable export. |
| Render worker | Evaluate every output frame, capture it and encode the final movie. |
| Verification | Check timing, image quality, geometry behavior, export integrity and offline use. |

A conceptual project schema would contain `version`, `fps`, `duration`, `seed`, `cast`, `set`, `dialogue`, `actions`, `shots`, `audio` and `captions`. These are proposed fields, not a recovered vendor format.

The animation engine should evaluate absolute time. At frame i and frame rate f, compute t = i/f. Rebuild the required pose from that time rather than incrementing rotations according to elapsed wall time. Scrubbing backward should produce the same scene as opening the project directly at that moment. Random-looking motion should use a stored seed and deterministic functions.

For characters, establish a clean neutral pose and separate controls for root, torso, head, arms, legs and face. Blend actions with defined entrance, hold and exit windows. Resolve overlapping actions explicitly. A thinking pose should not unexpectedly overwrite a speaking character's mouth. Expressions should continue during pauses, with blinking and small gaze shifts that remain reproducible.

The director can operate without a language model: speaker changes favor the current speaker; tagged reactions permit cutaways; explicit silence permits wider framing; minimum shot duration prevents frantic cuts. The editor must allow a deliberate exception. Camera targets should track face positions in world coordinates rather than assuming every character has the same height.

For strict AI-free dialogue, import one recording per line or a continuous recording. Expose waveform markers for boundaries and captions. Audio amplitude can produce basic opening/closing motion; precise lips require authored visemes or timing. Do not silently describe amplitude-only animation as accurate phoneme synchronization.

Keep preview and final export separate in resolution, but identical in scene state. A 540-pixel-wide editing preview can remain responsive while the exporter renders actual 1080 × 1920 frames. Do not upscale a low-resolution preview and call it a native full-resolution render.

The exporter must await fonts, textures and audio metadata before capture. Temporal effects need a documented reset or warm-up strategy. The job must report progress, support cancellation, and preserve the completed output after failure-free finalization. Determinism should be tested within a pinned browser/engine environment; cross-GPU pixel identity should not be assumed.

At 1080 × 1920, an uncompressed RGBA frame is approximately 8.29 MB. A 60-second, 30-fps sequence contains 1,800 frames, or roughly 14.9 GB of raw pixels. Stream frames to the encoder or use bounded chunks instead of retaining the whole movie in memory. Lower-powered hardware primarily changes rendering time if fixed-frame capture is implemented correctly.

Use FFmpeg for final audio placement, music ducking, loudness measurement and MP4 muxing. A browser MediaRecorder path can serve quick previews, but supported codecs must be detected. The final-quality path should avoid dependence on maintaining real-time preview speed. FFmpeg's documented loudness and sidechain filters cover the relevant mixing operations. [F11–F12]

**A build sequence that produces reviewable evidence**

| Stage | Deliverable | Exit condition |
|---|---|---|
| 1. Visual benchmark | Original cast in a final-quality scene, with close, medium and wide views | Proportions, palette, light and framing are acceptable at delivery resolution. |
| 2. Performance | A short scene exercising speech, reaction, gesture and silence | No clipping, sliding, pose snaps or accidental expression resets. |
| 3. Deterministic engine | Saved project and absolute-time transport | Direct seek, continuous playback and offline render agree. |
| 4. Authoring studio | Dialogue, appearance, action, shot and audio controls | A second episode can be created without changing application source. |
| 5. Final export | Native-resolution MP4 with audio and captions | File inspection and full playback meet the acceptance checks below. |
| 6. Packaging | Reopenable project, local launcher and dependency notices | Works in a clean supported environment after installation. |
| 7. Product website | Marketing and distribution, if requested | The actual studio and sample output are already verified. |

Finish related changes locally, validate the integrated result, and deploy a coherent build. The exported movie is a required artifact; a screenshot of an editor is insufficient evidence that export works.

**Acceptance checks before calling the output comparable**

These are proposed checks for our product, not tests passed by a product already built.

| Area | Required evidence |
|---|---|
| Real 3D | Orbiting and camera changes reveal consistent geometry, depth and occlusion. |
| Character continuity | Geometry, face layout and costume remain stable across cuts and episodes. |
| Visual treatment | Side-by-side evaluation of agreed framing, lighting, materials and depth at equal resolution. |
| Acting | Representative gesture and expression combinations have intentional timing and clean transitions. |
| Camera | Subjects remain framed; no unintended wall crossings, abrupt jumps or face clipping. |
| Timing | Seek tests at shot boundaries, pause/resume, backward seek and direct-time evaluation agree. |
| Speech | Mouth state follows the chosen timing method; naturalness is assessed using actual audio. |
| Captions | Correct text, readable size, safe margins and no collisions with faces or interface overlays. |
| Export | Actual 1080 × 1920 output, constant 30 fps, expected frame count and correct duration. |
| Audio | Deliberate loudness target, documented true-peak ceiling and no audible truncation or sync drift. |
| Reliability | Missing assets and malformed projects produce useful errors; save/reopen preserves edits. |
| Offline operation | After installing dependencies, disconnect network and complete preview plus export. |
| Resource usage | Measure peak memory and render time on the intended machine; no invented performance promises. |
| Repeatability | Re-render an unchanged project and compare frames in a pinned environment. |

A percentage such as 99.9% requires a defined metric. Pixel error between two identical test scenes measures something different from perceived quality between two original characters. SSIM or similar measures can help catch regressions in our own renderer, but cannot certify equivalent storytelling, acting or overall quality. Keep visual review and functional validation as explicit separate checks.

**Cost and ownership boundaries**

The core desktop/local application can avoid paid software and AI service fees. Rendering still uses hardware, electricity, storage and time. A hosted multi-user render service additionally consumes compute and bandwidth; a free static website does not supply unlimited free rendering. Natural recorded voice work also has a human effort cost, even if no service subscription is involved.

For a competing studio, create original character geometry, designs and application source. Agent Poly's published license permits commercial rendered outputs but restricts reuse of its product files and engine/models in another product; it also specifies an output badge. Buying that kit would not establish permission to redistribute it as our studio. [A4]

**Unverified details to retain as open evidence items**

| Question | Current status | Evidence that would resolve it |
|---|---|---|
| Exact purchased engine source and file tree | Not inspected | Authorized access to the actual distributed project. |
| Exact shaders, light values and camera-planning rules | Not recovered | Renderer source or an inspectable runtime. |
| Exact prompts used during development | Not established | Creator-provided history or documentation. |
| Which person/agent wrote each function | Not established | Development records; branding is insufficient. |
| Exact speech API/model version actually invoked | Public wording names ElevenLabs; requests not observed | Runtime code and request configuration. |
| Cloud workers, queue technology and email provider | Not established | Backend code or operational documentation. |
| Full export reliability of either paid kit | Not tested | Execute the supplied applications and inspect their outputs. |
| Our eventual quality parity | No competing build yet | Completed original sample and the agreed comparison checks. |

The observed evidence supports proceeding with an independently built studio. It does not justify declaring an unseen implementation audited, or a future output already equal to the references.

**Source register**

- A1 — [Agent Poly product page](https://agentpolystudios.com/).
- A2 — [Public storefront JavaScript](https://agentpolystudios.com/store.js). Retrieved through the page's script element.
- A3 — [Public storefront CSS](https://agentpolystudios.com/styles.css).
- A4 — [Agent Poly license](https://agentpolystudios.com/license).
- P1 — [Claude & Pixel product page](https://promptbase.shop/learn/claude-pixel).
- P2 — [Public course-page module](https://promptbase.shop/assets/ClaudePixelPage-CP8yYbIl.js).
- P3 — [Authentication module](https://promptbase.shop/assets/AuthContext-CmP3NZ_o.js).
- P4 — [Firebase bundle](https://promptbase.shop/assets/firebase-Dq6o3f62.js).
- P5 — [Region pricing module](https://promptbase.shop/assets/regionPricing-DPmXe_LB.js).
- P6 — [Inspected public checkout](https://promptbase.shop/buy?product=pdt_0NvClaudePixelStudio149).
- P7 — [Purchase hook](https://promptbase.shop/assets/usePurchase-D2EFQC1u.js).
- F1 — [Three.js license](https://github.com/mrdoob/three.js/blob/dev/LICENSE).
- F2 — [Three.js material documentation](https://threejs.org/docs/pages/MeshStandardMaterial.html).
- F3 — [Three.js canvas textures](https://threejs.org/docs/pages/CanvasTexture.html).
- F4 — [HyperFrames repository](https://github.com/heygen-com/hyperframes).
- F5 — [HyperFrames introduction](https://hyperframes.heygen.com/introduction).
- F6 — [Blender project and licensing overview](https://www.blender.org/about/).
- F7 — [Godot offline movie rendering](https://docs.godotengine.org/en/stable/tutorials/animation/creating_movies.html).
- F8 — [eSpeak NG repository and synthesis description](https://github.com/espeak-ng/espeak-ng).
- F9 — [Piper local neural speech engine](https://github.com/OHF-Voice/piper1-gpl).
- F10 — [Rhubarb lip-sync implementation and recognizers](https://github.com/DanielSWolf/rhubarb-lip-sync).
- F11 — [FFmpeg filters](https://ffmpeg.org/ffmpeg-filters.html).
- F12 — [MediaRecorder format support](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static).

The sampled media URLs came from the observed page elements. Agent Poly files were under `/assets/`: `hero-motion.mp4`, `bot-motion.mp4` and `look-duo.mp4`. Promptbase files were under `/videos/showcase/claude-pixel/`: `git-blame.mp4`, `rubber-duck.mp4`, `nine-dollars.mp4`, `kevin.mp4`, `demo-day.mp4` and `promo.mp4`.

Two source fingerprints preserve the identity of the inspected versions:

| File | SHA-256 |
|---|---|
| Agent Poly store.js | `edd26c02ff35758207bc4531be46fd82fb3ad583b35cca991e59df210779bac7` |
| ClaudePixelPage-CP8yYbIl.js | `3fcfd6d520d214cc52ad2c5b6ced1722ec7d93fc5a1bb93d0a29fb8adea313a8` |

References and hashed asset names can change after this inspection. Recheck them before attributing later versions to these findings.
