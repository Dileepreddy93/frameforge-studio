# M3.3 · BLUE and ORANGE in 3D, from their model sheet

The studio's robots are now their M3.2 model sheet (direction A, provisional), built from the same forms that draw
it and at DEV's scale. The V5 robots are gone: the glossy physical materials, the emissive rings, and the canvas
face on a plane.

- **Build:** matte flat-shaded meshes in the sheet's colours (about 40% from mid to lit on each ramp, as DEV's skin
  is). The head sits on a pivot and the arms on shoulder pivots, kept as `armJoints`, so the existing acting still
  swings them. The chest light is drawn onto the body. Episode `look` colours still recolour the shells.
- **Face:** flat light on the visor, redrawn every frame from `robot-character.js`'s `face()`. That covers the
  emotion, ORANGE's deadpan lids, the shape of the sound being spoken (opened by its loudness), a blink on each robot's
  own rhythm, and a look toward whoever is speaking. Each emotion also tilts the head, using the sheet's pose. Face
  triangles are cut small and wrapped through a precomputed surface grid. The first version cut under the head's
  facets, and the grid brought the cost from 19.6 ms to 2.7 ms per frame for both faces.
- **Cameras:** each robot's close-up aims at that robot's head and sits at its eye level. BLUE's head is lower and
  ORANGE's higher than the old fixed 2.13. Close-ups frame head and shoulders with the head at about 60% of the frame
  width (STYLE.md). Reaction cuts use the same framing.
- The art lab now shows seven different robot faces. Before, sad and thinking were drawn as neutral, so the
  character-art test now expects 11 distinct frames for the robots too.

## Tests
- `tests/robot-build-browser.cjs` (in CI) checks seven faces per robot, head tilts, speech shapes, louder meaning
  wider, blinks, looks, two arm pivots, and that every robot close-up in Zero Latency centres the robot's head.
- All 11 existing studio browser tests pass, including character art for DEV, BLUE and ORANGE.

## Rollback
Revert this commit to bring back the V5 robots. M3.1 and M3.2 (the design files) don't depend on it.
