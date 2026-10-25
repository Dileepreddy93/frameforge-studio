# FrameForge episode format (`frameforge.project/1`)

An episode is one JSON file. The renderer takes every per-shot decision from it, including title, acting, camera framing, reaction cuts and screen inserts. Nothing is keyed by shot position, so you can reorder, add or delete shots without touching code.

The validator is `src/project-core.js`. It runs unchanged in Node and in the browser. `toTimelineShots()` fills in defaults so every shot reaches the renderer complete.

Examples:
- `projects/zero-latency.frameforge.json` is fully directed, with 14 shots and mastered audio.
- `projects/dark-mode.frameforge.json` (episode 02) was written only as data, with no code changes.
- `projects/mountain-mystery.frameforge.json` is a storyboard with no voice and relies on defaults.

## Episode fields
| Field | Required | Notes |
|---|---|---|
| `schema` | yes | `"frameforge.project/1"` |
| `id`, `title`, `logline` | yes | `id` is a lowercase slug |
| `banner` | no | Small line above the shot title, e.g. `"FRAMEFORGE STORIES  /  EPISODE 01"`. Default: `FRAMEFORGE STORIES`. |
| `output` | yes | `{width:1080,height:1920,fps:30}` |
| `style.styleLock` | yes | A shot's `styleLock`, if present, must match it exactly |
| `environment` | yes | `id`, `description`, `safeZone {top,bottom}` in 1080x1920 pixels |
| `characters[]` | yes | `id`, `name`, `visualIdentity`, `voice {profile,voiceLock,kokoro?:{voice,speed}}`, `sheetStatus`, 4+ `expressions`, optional `look` colours (`#rrggbb`): `dev` → `hoodie`, `hair`; `blue`/`orange` → `shell`. The current renderer animates `dev`, `blue` and `orange` only. |
| `shots[]` | yes | 1–120 shots, 180 s total maximum |
| `pronunciations` | no | up to 200 `{word, sayAs}`: how the voices say a word the dictionary does not know. `sayAs` is a respelling with the stressed syllable in capitals (`koh-KOR-oh`), plain words (`co core oh`) or Kokoro phonemes between slashes (`/kəkˈɔɹO/`). Used by the browser voices and `tools/voice_lines.py` alike |
| `audio` | yes | `{state:"mastered",masterUrl,voiceUrl}` or `{state:"storyboard_only",masterUrl:null}`; optional `music {bpm, cues:[{shot, style, at?}]}` with style `groove`/`tension`/`stop`/`sting` and `at` `start`/`afterLine` |

## Shot fields
| Field | Required | Values | Default |
|---|---|---|---|
| `id` | yes | unique slug | |
| `dialogue`, `speaker` | yes | text; a registered character id | |
| `camera` | yes | `dev` `blue` `orange` `duo` `wide` `screen` | |
| `duration` | yes | 0.4–15 s | |
| `intent` | yes | short director note | |
| `firstFrameStatus` | yes | `not_created` `draft` `approved` | |
| `title` | no | ≤ 60 chars, shown in the title card | episode `title`, uppercased |
| `cast.<id>.action` | no | `listen` `typing` `react` `question` `plead` `alarm` `surprise` `defeat` `announce` `explain` `celebrate` `shrug` `anticipate` | `explain` for the speaker, `listen` for everyone else |
| `cast.<id>.emotion` | no | `neutral` `happy` `worried` `surprised` `angry` `sad` `thinking` | `neutral` (for `dev`: legacy `acting.devEmotion` if present). The speaker's emotion is also how the line is spoken (pace, pitch, tone, loudness: `src/voice-emotion.js`) |
| `framing` | no | `distance` 1–15, `offset` −2..2, `up` −1..1, `fov` 15–75, `lookUp` −1..1 | from the camera preset |
| `framing.move`, `framing.amount` | no | `push` `pull` `drift` `static`; travel 0–2 | `push`, 0.33 |
| `framing.roll` | no | canted angle, −20..20 degrees | 0 |
| `framing.aim` | no | `center` or a character id: which side a duo/wide shot favours | the speaker for `duo`, else `center` |
| `timing` | no | `{lead, pauseAfter}` seconds before and after the spoken line | 0.15 / 0.35 (used by `tools/build-audio.mjs` and the studio's in-browser voices) |
| `sfx` | no | up to 8 `{cue, at, gain?}`, cue: `typing` `chime` `buzz` `zap` `scratch` `whoosh` `pop` | none |
| `voice` | generated | `{file, seconds}` written by `tools/build-audio.mjs` | |
| `reactionCut` | no | `{role, seconds, emotion?}`: cut to `role` for the last `seconds` of the shot, optionally changing their emotion | none |
| `insert` | no | Full-frame telemetry card for `camera:"screen"` shots: `window`, `context`, `headline`, `value`, `caption`, `request`, `status`, `footer`, `label` (all text), `tone` `good`/`bad`, `graph` `drop`/`flat` | none (a plain 3D shot) |

Older files that use `emotion`, `action` or `acting.devEmotion` on shots still open.

## Example shot
```json
{
  "id": "shot-03", "title": "NO REGRETS?",
  "dialogue": "Without breaking anything?", "speaker": "dev", "camera": "dev", "duration": 2.6, "intent": "setup",
  "cast": {"dev": {"action": "question", "emotion": "worried"}, "blue": {"action": "listen", "emotion": "worried"}},
  "framing": {"distance": 3.95, "offset": -0.16, "up": 0.08, "fov": 36},
  "reactionCut": {"role": "blue", "seconds": 0.58, "emotion": "surprised"},
  "firstFrameStatus": "not_created"
}
```

## Loading an episode
- Publish an episode by adding `{key, file, label}` to `projects/index.json`; the studio lists every entry. Or use **Import project** in the studio.
- **Download episode JSON** saves the edits made in the studio.
- Tests: `node tests/project-core.test.cjs` checks the format, and `node tests/episode-data-browser.cjs` checks that the renderer follows it.
