# FrameForge objective + artistic quality rubric — P0
This rubric has no approved benchmark score until exact reference video bytes are inspected.

For each selected timestamp keep original SHA256, output SHA256, both frame filenames/hashes, source/audio marker and comparison viewing size. Scale 0=broken, 1=crude, 2=readable prototype, 3=polished/consistent, 4=reference competitive. Never average over a blocker. Unavailable reference => NOT COMPARABLE, not a pass.

| Area | Observable threshold | Disqualifying example |
| --- | --- | --- |
| Character identity | Same human/robot proportion/hair/material across 4 views, shots, closeups | Disconnected box geometry, changing head shape |
| Face | Coordinated eyes/pupils/lids/brow/cheeks/mouth with asymmetric expression | Giant oval mouth, rigid brows, expression indistinct |
| Acting | Anticipation, gaze, hands/torso, breathing, reaction and recovery | Weightless motion, static talking heads, identical gestures |
| Stage/art | Coherent material response, contact shadows, depth, key/fill/rim | Random neon/flat props, missing shadow grounding |
| Cinematography | Clear story beats, consistent eyeline and meaningful camera cuts | Cropped closeups, actor off edge, contextless screen |
| Voice/speech | Natural line delivery and actual phoneme/word correspondence | Mouth moves through silence, monotone/wrong language |
| Foley/mix | Precise effects, ducking, no abrupt transitions or clipping | Missing cues, loud music masks dialogue |
| Captions | Every word timed, legible, inside mobile safe region, does not cover face | 1–4 words misaligned; text offscreen |
| Encoded master | Native 1080x1920, 30fps, AV synchronized, full decode | Upscaled draft, missing frames, no audio |

Review beginning, each shot boundary ±0.2s, emotional/reaction beats, inserts, silent moments, punchline, end credits and arbitrary seeks. Do a full watch/listen; stills alone insufficient.
Known failures from docs/DECISIONS_AND_FAILURES.md: early glued meshes; enlarged unintended mouth; unreadable ORANGE emotion; cropped faces; repetitive static dialogue; meaningless "0" software display; approximate text+volume speech movement. These are regression cases, not acceptable visual identity.
P1 artistic gate: original static sheets and environment genuinely compelling and internally consistent, with no collisions. P2: muted 5–10s acting conveys emotion. P8: every category sufficiently polished (3+), **zero hard blocking failures**, full film and exact reference reviewed, independent approval recorded.
