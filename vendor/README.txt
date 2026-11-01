Unmodified copies of the pinned libraries the studio runs, served from our own site so a visitor never depends on a
third-party CDN (M6.1). The studio loads these first and falls back to the same version on cdn.jsdelivr.net.
  three@0.180.0            build/three.module.min.js, build/three.core.min.js     MIT       (npm: three)
  mediabunny@1.62.1        dist/bundles/mediabunny.mjs                            MPL-2.0   (npm: mediabunny; source: github.com/Vanilagy/mediabunny)
  onnxruntime-web@1.30.0   dist/ort.webgpu.bundle.min.mjs, ort-wasm-simd-threaded.asyncify.wasm   MIT (npm: onnxruntime-web)
Each folder holds the licence. To update: npm install the new version, copy the same files, and change the version
in the folder name and in studio.html, src/kokoro-worker.js and sw.js.
