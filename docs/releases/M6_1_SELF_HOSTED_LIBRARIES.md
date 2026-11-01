# M6.1 · The studio's libraries come from our own site, with a CDN fallback and clear start-up errors

## What changed
- `vendor/` (new) holds unmodified copies of the pinned libraries, each with its licence (`vendor/README.txt`):
  - three.js 0.180.0 (`three.module.min.js`, `three.core.min.js`, MIT);
  - Mediabunny 1.62.1 (`mediabunny.mjs`, MPL-2.0);
  - ONNX Runtime Web 1.30.0 (`ort.webgpu.bundle.min.mjs`, `ort-wasm-simd-threaded.asyncify.wasm`, MIT).
  - 28 MB in all, almost all of it the voice runtime's WebAssembly file (26.8 MB).
- **Loading order:** each library is loaded from our site first and from the same pinned version on jsDelivr if ours
  fails. That covers three.js in `studio.html` (now a top-level `await`), Mediabunny when an MP4 is exported, and
  ONNX Runtime and its `.wasm` in `src/kokoro-worker.js`.
- **Start-up guard:** a small script before the 3D module. Until M6.1 the failure panel existed in the page but no
  code ever showed it: if three.js didn't load, the studio said "Loading engine…" forever. Now it shows the reason and
  a *Try again* button when:
  - the browser has no WebGL 2 (with how to turn graphics acceleration on);
  - a library can't be downloaded from either source;
  - our own code fails while starting (other sites' and extensions' errors are ignored);
  - start-up takes more than 90 s.
  The first reason is kept; later errors don't overwrite it.
- **Offline cache** (`sw.js`, cache `frameforge-shell-v5`):
  - the vendored modules are precached and served cache-first;
  - the CDN entries are dropped from the precache list, but are still cached if a fallback uses them;
  - the voice worker keeps the `.wasm` itself. Visitors who cached it from the CDN before keep working offline,
    because the worker falls back to that cached copy.
- `vercel.json`: `/vendor/*` is served with `Cache-Control: public, max-age=31536000, immutable`; the folder names
  carry the version.
- `credits.html` says the libraries are served from this site, links each licence, and names the CDN fallback.

## Tests
- `tests/self-host-browser.cjs` (new):
  - **CDN blocked:** the studio loads, an MP4 exports, and the voice runtime's module and `.wasm` are served (26.8 MB).
    With `FRAMEFORGE_VOICE=1` (CI's voice job) the voice engine also starts.
  - **Our copies blocked:** three.js comes from the CDN.
  - **Both blocked:** "A part of the studio could not be downloaded (three.js)", plus *Try again*.
  - **No WebGL 2:** the graphics-acceleration message.
- `tests/engine-syntax.test.mjs` now checks the module as an ES module (`node --check`) and checks the guard.
- Unit tests (13) and the full browser list pass locally; CI runs the new test in the browser and voice jobs.

## Rollback
Revert this commit: the libraries load from jsDelivr only again, and the start-up guard and `vendor/` go away.
