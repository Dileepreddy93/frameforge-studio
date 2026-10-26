# M2.6 · Finished episodes offline

The scope is mine: your TODO's text for M2.6 isn't in the repo. It fixes the M2.1 gap "finished episodes play silent
offline".

Before this, `sw.js` didn't keep `audio/` at all, and it let every Range request (which is how `<audio>` asks for
media) go to the network. Offline, a finished episode failed with "MEDIA_ELEMENT_ERROR: Format error".

Now:
- At install, the service worker reads `projects/index.json`, then each episode, and keeps every finished
  episode's `masterUrl` and `voiceUrl` (2.3 MB for the two episodes).
- Range requests for `audio/` go to the network when there is one. Offline, they're answered from the cached
  file as 206 byte slices, which covers seeking too.
- The AAC encoder module is kept as well, so MP4 export works offline in browsers without native AAC.
- The cache moves to `frameforge-shell-v2` and older shell caches are deleted. The voice model and voiced-line
  caches are left alone.

## Tests
`tests/offline-episode-browser.cjs` visits once online, then stops the server and cuts the network. Zero Latency
opens as a finished episode, lip sync reads its voice track, the 38.1 s master plays and seeks, and a 2 s MP4 export
is stereo with sound (−16 dB RMS). Run against the old `sw.js`, the same test fails with the format error.

## Rollback
Revert this commit. The next visit installs the old worker, which deletes nothing, and the v2 cache stays until the
browser evicts it.
