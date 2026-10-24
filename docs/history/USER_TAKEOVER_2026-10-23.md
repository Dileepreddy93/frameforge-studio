# Historical user-provided FrameForge takeover brief (verbatim)

This is a preserved user-provided engineering brief, originally uploaded in the conversation on 2026-10-23. It expresses historical goals and directions; **latest verified repository evidence and current safety/quality contracts take precedence when facts or capabilities differ**.

---

# FRAMEFORGE — CURRENT-STATE TAKEOVER, ROOT-CAUSE FIXES AND CINEMATIC QUALITY IMPROVEMENT

You are continuing an existing FrameForge Studio engineering project. You are not starting a new project.

The Git repository and project already exist. I have already worked through earlier versions of FrameForge, a missing-demo-button problem, basic 3D animation, a PIXEL-style episode preview and the transition to Codex.

I do not want another generic plan, another starter project, another superficial UI improvement or an explanation of what would be nice to implement.

I want you to investigate the project that actually exists, identify exactly why its finished videos fall short of the reference, implement the most important fixes, and prove the improvement with actual rendered output.

My ultimate goal is to build a code-driven animation production system whose finished videos are at least as compelling as the supplied reference and eventually better.

## 1. ESTABLISH THE CURRENT STATE — DO NOT REPEAT SETUP

Inspect the current workspace before doing anything destructive.

- Confirm the repository root, current branch, Git status, recent history and available project instructions.
- Identify the active FrameForge source directory and the files served by the existing local application.
- Inspect the existing scene engine, rendering pipeline, characters, cameras, animations, dialogue system, audio handling and export implementation.
- Check existing documentation, unfinished work, recent changes, test results and rendered artifacts.
- Determine which of the previously discussed implementations have actually been completed and which only exist as plans or claims.

Do not run `git init`, create a duplicate repository, download a replacement FrameForge project, discard current changes or repeat completed setup.

Do not run destructive Git commands or overwrite existing work. Preserve all user changes and establish a safe checkpoint if necessary.

If the application is running on `localhost:8080`, verify which source files and version it actually serves. If it is not running, determine whether the reason is environmental, configuration-related or code-related before choosing a fix.

Use the evidence available in the real repository, not assumptions inherited from previous conversations.

## 2. IDENTIFY AND VERIFY THE REFERENCE ARTIFACTS

Find and inspect the available video files.

Expected reference:
- `git-blame.mp4`

Expected current output:
- `zero-latency-acting-v3-with-foley.mp4`

The earlier project history also mentions `65469.mp4`, `The Last Bug` (34 seconds) and a PIXEL-style episode demo (41.8 seconds).

Search for these artifacts and establish their actual identities. The historical filenames are not automatically authoritative.

Use the contents, duration, representative frames and other available metadata to identify which assets correspond to the intended reference and current output.

If any of the two primary videos cannot be located, report that fact and continue with whatever genuine evidence is available. Do not silently substitute a different video.

## 3. DEFINE WHAT WE ARE OPTIMIZING FOR

The main objective is NOT to reproduce the reference dialogue, its story or its subject matter.

The objective is to reproduce and ultimately improve the production quality.

Study these elements independently:

### A. Character appearance

Compare:

- Silhouette and proportions.
- Geometric style and surface detail.
- Facial structure, eye placement and readable expressions.
- Materials, highlights, shadows and shading.
- Character identity and consistency across camera angles.
- How well the character design fits the intended animation style.

Identify whether the current models themselves need redesign or whether their shortcomings can be fixed through materials, lighting and composition.

Do not try to make fundamentally inadequate character geometry look professional through lighting adjustments alone.

### B. Cinematic environment

Compare the composition and quality of the complete scene:

- Foreground, characters, props and background.
- Workstation, keyboard, software displays and other relevant set elements.
- Color palette and contrast.
- Key, fill and rim lighting.
- Shadow quality and material response.
- Depth separation and visual hierarchy.
- Scene density without unnecessary clutter.

The goal is a coherent, deliberately composed miniature animated film, not simply a 3D interface with characters standing in it.

### C. Cinematography and editing

Inspect the reference and current output throughout their full durations.

Create timestamped contact sheets and identify shot boundaries as accurately as the available tools allow.

Compare:

- Shot types and their frequency.
- Close-ups, medium shots, wide shots and reaction shots.
- Camera angles and perspective.
- Subject placement and headroom.
- Camera movement and transitions.
- How long each shot holds.
- How speakers and listeners are framed.
- Whether consecutive shots feel repetitive.
- Whether visual emphasis changes when the character's emotional state changes.

Infer a shot-planning specification from the actual reference instead of imposing arbitrary shot counts.

Create a more deliberate camera direction system if the existing one relies on repetitive presets.

### D. Character acting and expression

This is a first-class engineering requirement.

For relevant moments, compare:

- Eye and gaze direction.
- Head tilts and turns.
- Facial expressions.
- Body posture and hand gestures.
- Anticipation before movement.
- The timing and magnitude of reactions.
- Listening behaviour when another character speaks.
- Movement during pauses and transitions.
- Whether the character remains visually static for too long.

A character must not merely have a talking animation. It must perform the line and react to the surrounding scene.

Use character-appropriate techniques. A character without a human-style mouth should communicate through its available facial features and body language rather than receiving inappropriate lip-sync.

### E. Voice acting

Evaluate the actual audio tracks separately from the video.

Assess, where audible:

- Naturalness and conversational rhythm.
- Vocal texture, perceived pitch and timbre.
- Distinct character identities.
- Emotional expression and dynamic variation.
- Emphasis, pauses and sentence endings.
- Response timing and conversational flow.
- Whether every line has the same generic delivery.
- Whether voices fit their characters and visible performances.
- Audio artifacts, unnatural pronunciation or awkward editing.

Do not claim to have listened to or understood a track if the required playback capability is unavailable.

Waveforms, transcripts and signal metrics can inform the assessment but cannot independently prove good acting.

If the existing voices sound generic, investigate alternative delivery instructions, line-level generation, voice settings and suitable supported providers. Preserve consistent voice identity and cache unchanged recordings.

Do not silently replace the intended voice system with browser speech and describe the result as professional voice acting.

### F. Speech, animation and caption synchronization

Inspect the timing between:

- Spoken words.
- Mouth or character-face movement where applicable.
- Head and body gestures.
- Listening reactions.
- Camera cuts.
- Dialogue captions.
- Pauses and silent beats.

Find actual synchronization errors and fix their causes.

If the existing voice provider supplies word-level timestamps, use those timestamps instead of estimating speech progress from string length or generic fixed-duration animations.

### G. Music, ambience and Foley

Examine the actual mix.

Evaluate:

- Dialogue clarity and relative prominence.
- Background-music levels.
- Music ducking during speech.
- Ambience continuity.
- Foley synchronization with visible actions.
- Transitions between scenes.
- Unintended dead air, clipping and abrupt audio endings.
- Consistency of loudness throughout the episode.

Use measured audio properties alongside auditory review. Do not solve every problem by increasing master gain.

The reference page describes an FFmpeg mix targeting approximately -14 LUFS integrated loudness. Use that as an initial technical target, with true peak controlled to an appropriate limit, while still evaluating the perceived result.

## 4. USE THE REFERENCE'S PRODUCTION WORKFLOW INTELLIGENTLY

The supplied Promptbase reference describes a production system with:

- A structured script containing speakers, emotional tags and pauses.
- Separate cached ElevenLabs v4 recordings.
- Word-level audio timestamps used for mouth movement and captions.
- Per-line camera planning.
- Three.js scene rendering.
- Headless Chrome rendering at 1080 × 1920 and 30 FPS.
- Music ducking and an FFmpeg final audio mix.

Compare this approach with the actual FrameForge architecture.

Adopt the parts that solve demonstrated problems. Retain existing components that already work well.

Do not copy the entire presumed implementation, install unnecessary libraries or replace working architecture simply because another technology is mentioned in the reference.

The desired long-term workflow is:

Structured script → character and shot direction → voice generation and timing → deterministic animation and rendering → captions and audio mix → verified MP4.

The complete system should eventually allow a new script to produce a consistent episode without manually reconstructing every shot.

## 5. PRODUCE AN EVIDENCE-BASED GAP ANALYSIS

After inspecting the existing system and both videos, identify the most important deficiencies.

For each deficiency, record:

1. The exact observable problem.
2. The relevant source files or subsystem.
3. The root cause, if established.
4. Whether the proposed cause is confirmed or still a hypothesis.
5. The implementation change required.
6. Why that change should improve the final video.
7. How the result will be tested.
8. Dependencies, costs, risks or missing capabilities.

Rank problems by perceptual impact and dependency order.

Separate visual quality from voice acting, synchronization, sound design and technical export. Do not allow excellent performance in one category to hide a serious deficiency in another.

Save findings in the project's existing documentation structure. If no suitable documentation exists, create concise, useful audit documents rather than duplicating existing files.

**Do not stop after delivering this analysis. Use it to drive implementation.**

## 6. IMPLEMENT IN A QUALITY-DRIVEN ORDER

Choose the order based on the evidence, but evaluate the following areas explicitly.

### Priority 1: The visual foundation

Correct deficiencies in character design, geometry, materials, lighting and environment composition that prevent the output from approaching the reference.

Establish a stable visual style guide so characters do not change appearance unpredictably between shots.

### Priority 2: Cinematography

Improve shot selection, portrait framing, camera transitions, composition and reaction-shot timing.

Use actual story and performance information to motivate the camera. Avoid repetitive centered shots and unnecessary movement.

### Priority 3: Character performance

Introduce or improve expressive states, gestures, head movement, gaze direction, speaking behaviour, listening reactions and transitions between poses.

Coordinate performances with line-level timing.

### Priority 4: Voice and audio quality

Improve vocal delivery, emotional direction, line-level timing, synchronization, music ducking and sound mixing.

Use existing credentials and configured providers when available. If a required capability is unavailable, identify the blocker rather than quietly substituting an inferior implementation.

### Priority 5: Rendering and delivery

Validate deterministic rendering, scene synchronization, output dimensions, frame rate, audio encoding and playback. Use draft rendering for fast iteration and full-resolution rendering when a draft is ready.

Do not prioritize editor-interface polish above defects in the actual film.

## 7. VALIDATE BEFORE SCALING UP

Do not attempt to solve every production problem through one enormous implementation change.

First, select a representative 10–15-second portion of the intended episode that includes meaningful character movement, at least one important emotional reaction and speech with corresponding audio.

Use it as a complete proof-of-quality test.

It must pass through the actual existing production pipeline and produce a playable video artifact.

Generate contact sheets for the test, inspect important shots and transitions, and examine the audio. Fix the largest perceptual deficiencies and repeat the render.

Only after the scene demonstrates that the relevant systems are working together should you apply the validated changes to the complete episode.

Do not let this test scene become a stopping point. The ultimate deliverable remains the improved full episode, subject to available compute, tools and session constraints.

If the scene remains far below the reference, document why and continue targeted improvement rather than claiming success because all requested components exist.

## 8. TEST THE FINISHED ARTIFACT, NOT JUST THE APPLICATION

Verify the actual exported video.

Check:

- Dimensions and aspect ratio.
- Frame rate and duration.
- Successful encoding and playback.
- Missing or duplicated frames.
- Rendering and animation consistency.
- Character and camera continuity.
- Caption correctness and timing.
- Audio/video synchronization.
- Audio loudness and true peak.
- Audible gaps, clipping and abrupt endings.

Inspect visual frames throughout the clip, not just the opening and final frame.

Use automated tests for measurable technical properties, visual inspection for composition and animation, and actual listening where available for subjective audio quality.

If a test cannot be performed, report it explicitly.

## 9. REQUIRED BEFORE-AND-AFTER REVIEW

Compare the new output directly with the original reference.

Provide:

- The exact artifacts inspected.
- Representative reference and output frames at comparable moments.
- A breakdown of the most important changes.
- Evidence of improvements and remaining defects.
- Audio measurements and actual auditory findings, clearly distinguished.
- Technical export and test results.
- Source files changed and architectural decisions made.
- A prioritized list of unresolved quality gaps.

Score visual design, cinematography, character acting, voice performance, synchronization, sound design and technical reliability separately.

Support every score with actual evidence. Do not invent an objective score from appearance alone, and do not declare a subjective category passed without a suitable review.

## 10. AUTONOMY, SAFETY AND RECOVERY

Make ordinary engineering decisions independently. Do not repeatedly ask me to approve every small implementation detail or ask questions that can be answered through the available repository and artifacts.

Use available local tools and make justified project-level installations where needed. Respect permission boundaries, preserve secrets, avoid unnecessary paid services and do not send project assets to third-party services without authorization.

Keep changes reviewable and recoverable. Preserve unrelated working-tree changes. Run relevant regression tests and retain useful output artifacts.

If an approach fails, investigate why and correct or revert the failed change rather than building more functionality around it.

Do not fabricate results, claim tests were run when they were not, or report a plan as an implementation.

## IMMEDIATE EXECUTION INSTRUCTION

Start from the current repository state.

First establish the real source and artifact identities, inspect the existing code and run the available project or rendering checks. Then identify the highest-impact confirmed quality problem and implement a targeted fix.

Produce an actual improved test render, inspect it against the reference, correct the remaining defects, and continue toward a complete improved episode.

Do not return only with a plan, a diagnosis, a UI screenshot or another demo that repeats the current limitations.

The engineering mission is to make demonstrable improvements to the finished animation and build a reliable production process around those improvements.

**The final measure is the output we can inspect—not the features we can claim to have implemented.**
