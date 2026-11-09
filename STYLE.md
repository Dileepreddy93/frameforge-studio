# FrameForge look (V6): matte faceted low-poly

The judge is the reference video, not the tests. Every colour below was sampled from its frames.
The reference frames stay outside this public repo (`~/Desktop/Animate/proof/v6/style-board.jpg`) because they
show a third-party character.

## Palette
Three main colours on a near-black set: **terracotta** (characters), **teal-blue** (clothes, rim light) and
**violet** (desk). Coral and green appear only on screens, where they carry the story.

| Role | Hex | Notes |
|---|---|---|
| Void / walls | `#100C1B` | range `#0E0A19`–`#151029`; no gradients or fog glow |
| Screen glass | `#151029` | bezel `#0B0A12` |
| Screen label | `#676284` | mono, e.g. "p95 page load" |
| Screen title | `#A7A1C7` | mono bold, title bar |
| Bad / alert | `#FC5757` | big number, sparkline, title rule `#E05553` |
| Bad tint | `#471C30` | badge pill, highlighted log row `#31182D` |
| Good | `#44E082` | big number, sparkline, rule `#3A9A66` |
| Code / info | `#79C5FF` | `→ Index Scan …` lines |
| Window lights | `#DEA32F` | dots: `#E05553` `#DEA32F` `#23A93B` |
| Skin | lit `#C1361C` · mid `#8F2B19` · shadow `#260B06` | shadow side falls to near black |
| DEV skin (warm brown) | lit `#C66C48` · mid `#8B3F1D` · shadow `#2C0F06` | the approved model sheet (M1.2); same lights |
| Hoodie | lit `#667168` · base `#3D5D66` · top `#467498` | top faces turn blue from the rim |
| Hair | `#120806`, rim edges `#4B87C0` | |
| Ink (eyes, mouth, brows, glasses) | `#04030A`, mouth `#2A0911`, tongue `#7C2C33` | flat, unlit |
| Glints, teeth | `#FFF7EE`, `#EADFD1` | flat, unlit |
| Drawstrings | `#B098B1` | |
| Desk / plaza | `#353790` → pool `#5F418C`; keys `#754DA6` | the arena's plaza and violet keys (M5.1) |
| Caption | `#FFFFFF` | |

## Shading and materials
- Flat shading: one colour per triangle, hard facet edges. No smooth normals, textures, outlines or AO.
- Few triangles: bodies are boxes or 6–8-sided cylinders, hair is cones/chunks, noses are octahedra, hands are
  rounded-box mittens (8 x 6 facets) with a capsule thumb. DEV's head (about 200 faces) is designed, not jittered: hand-placed brow, socket, cheekbone,
  jaw and chin points on the face, a smooth staggered shell for the cranium; eye line 58% down from the crown.
- Nothing on a head casts a shadow onto the face; faces are lit by their facets alone.
- Matte only: roughness 1, metalness 0, no clearcoat, no specular highlight, no emissive on characters.
- Faces are crisp flat shapes on the head, never textures (DEV, approved 2026-10-25, `design/dev-model-sheet.html`):
  big ink pupils with two fixed glints, a heavy upper-lid line that carries the mood, rounded ink brows, and a curved
  dark mouth with tongue and top teeth. No whites, irises, cheeks, lips or eyelid skin.
- Screens are the only self-lit things (unlit, not tone-mapped).

## Light
- **Key:** one strong warm-neutral light (`#FFE6D0`) from camera-right, above and in front. The far side of
  every form falls to near black (ambient ≤ 5%).
- **Rim / top:** one cool blue-lavender light (`#7F9CFF`) from behind-left and above. It paints hair edges,
  hood tops and box tops blue/lilac.
- **Character key** (M5.3): a second warm key (`#FFD6BC`, 5.5) that only the cast sees, from the key's side
  (camera right, 50° off the lens axis, 30° up, camera-relative). It brightens the lit side of faces and bodies,
  casts no shadows, and leaves the far side dark. The set doesn't get it.
- **Black lift** (M5.3): blacks rise to a violet haze, `#070510` screen-blended over the frame (luma ~10, like the
  reference). Highlights are untouched.
- A pink-violet pool on the plaza (or desk) top. Nothing else: no neon strips, no fill, no bloom, no fog glow.

## Camera
- 9:16, vertical fov 34–40°, eye level or slightly low.
- Close-up: head and shoulders, head about 60% of frame width, the in-world screen's big number visible
  above/behind the head. Wides: the cast about a fifth of the frame high on the plaza, keys around them and the
  windows' tiers above them (the reference's wides: 9–21%). Two-shots: the pair about 40% high, windows behind.
- Slow push-ins, small drifts, hard cuts on lines. Background stays sharp (no depth of field).

## Captions
- White, bold geometric sans (Inter-like), about 4.5% of frame width (48 px at 1080), centred, at most two
  lines, line height 1.45.
- Centred at about 31% of frame height: upper middle, over hair/forehead, never over eyes or mouth.
- Soft dark shadow only. **No box, no outline, no header, no title pill, no logo bug.**

## Screens
Real monitors inside the set, seen in perspective and often cropped by the frame, never overlay cards.
- Window: glass `#151029`, thick bezel, title bar with three dots and a mono bold title
  ("Dashboard · /reports"), a 3 px rule under it in the state colour.
- Metric screen: mono label, a huge mono bold number in the state colour (about 60% of screen width),
  a jagged 3 px sparkline, a badge (SLOW / FAST) on a tinted pill.
- Log screen: mono rows, timing column in coral, one highlighted row on a maroon band.
- The set is the screen arena (`design/set-arena.js`, approved 2026-10-26): app windows (inbox, review, changelog,
  terminal, chat, metrics, calendar) in three tiers on a half-ring around a violet plaza and a field of keycaps, a few
  more behind the camera for reverse angles. The big centre window is the story screen (the shot's wall).
  The cast stand on the plaza: one scale in every shot, like the reference.

## Characters
Simple, graphic and built from a few primitives, with a big head (about half the torso height).
Our own designs. Never Claude's mascot or any other studio's character.
Each character is designed in 2D first (a model sheet the user approves), then built in 3D to match it.
DEV's sheet is `design/dev-model-sheet.html`, and its numbers are in `design/dev-character.js`:
- round head, wider than tall; small features set low (eye line 60%); 2 heads from crown to ground;
- thick 12-sided round glasses;
- a side-swept wave quiff;
- a hoodie with a collar roll, a hood lying on the back, a pocket and drawstrings;
- mitten hands with a thumb.

BLUE and ORANGE's sheet is `design/robot-model-sheet.html` (direction A, approved 2026-10-26), numbers in
`design/robot-character.js`: matte faceted superellipsoid shells (BLUE a soft capsule, ORANGE a flat-topped box),
a dark visor (`#151029`) with a face of flat light (BLUE `#79C5FF`, ORANGE `#FFC15A`), violet joints, hovering on a
thruster. BLUE is 1.48 tall and eager; ORANGE is 1.58 and deadpan (resting lids a third down). DEV is 2.0.

## How we draw this in code
three.js; `MeshLambertMaterial({flatShading:true})` on low-detail geometry; black facial features as
`MeshBasicMaterial`; one `DirectionalLight` key and one `DirectionalLight` rim and almost no ambient light; the character key added to
the cast's materials (`addCharacterKey`) and the black lift (`blackLift`) in `studio.html`;
screens as `CanvasTexture` on `MeshBasicMaterial({toneMapped:false})`, drawn from the app layouts in
`design/set-forms.js`; the set in `src/arena-set.js` (instanced keycaps); captions drawn in the film compositor.
