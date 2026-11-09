# Phase 6 · Breadth (first part)

Things the engine already drew, now offered in the Creator, plus ready-made stories:
- **22 body actions** (was 9): pointing at the other person or at the screen, shaking the head, clapping, thumbs up,
  hands up, facepalm, crossed arms, leaning in, raising a hand, typing, hopping, jumping, and more. Actions from the
  older episodes stay selectable.
- **8 sets** (was 4): the studio desk now has five window views (city, mountains, ocean, forest, space). Each one has
  all three times of day. A `view` field is validated in `src/hybrid-world-provider.mjs`.
- **Appearance:**
  - What a character is holding (phone, tablet, book, mug, coffee cup), glasses and hat.
  - The pickers show each template's real starting look (DEV's chunky hair and round glasses).
- **Ready-made stories** in *Start from…*, built through the Creator's own validated editor by
  `tools/make-templates.cjs` into `projects/templates/`:
  - How a Password Manager Works (DEV and BLUE, desk on a city morning)
  - Launch Day (ORANGE and BLUE, desk with the space view at night)
  - Why Leaves Change Colour (Pip the fox and Sunny, forest at golden hour)
  - The Lantern That Learned to Listen (the 10-shot snow film)
  - With the two episodes, that is six stories, all with subtitles on.
- **Seen while checking the stories, and fixed:**
  - Screen shots face the screen straight on. A side angle cropped the card's edge.
  - The camera's look-over-the-cast height now uses each character's real head top (hair, hat, antenna), measured
    every frame, so DEV's big head no longer covers the screen.
  - The kids' story turns the background code screen off.

**Not done yet** (each needs modelling and grip work, not just exposure):
- new 3D props beyond the lantern with reach/grasp/lift/carry
- new outdoor sets (city street, office, classroom, home)
- two-person actions
- face customisation
