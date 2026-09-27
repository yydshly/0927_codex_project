# Bundled source demonstration

This folder starts from the static build of [SamG-Coder/coastal-simulation-cuda-webshader](https://github.com/SamG-Coder/coastal-simulation-cuda-webshader) at commit `e5a80fe42b4eeba6c01de1467035bafd69592d3e` (retrieved 2026-09-27). Its `index.html`, `src/`, `vendor/`, baked initial state, style and attribution files are included. The original scene still runs at the default URL.

The original coastal scene and equations come from [iamtechartist/coastal-simulation](https://github.com/iamtechartist/coastal-simulation). See `CREDITS.md`, `LICENSE`, and `vendor/cuda-webshader/LICENSE` for authorship and licenses.

The parent 012 page loads this bundle in a same-origin frame. For `?reef=1`, a small local patch in `src/local-extension.js`, `src/main.js`, and `src/resident-coast.js` adds one rock before the original GPU buffers and Three.js world are built. That mode skips the original baked state and warms up the unmodified CUDA kernels with the new obstacle. It lets the added rock use the source renderer, water solver, wetness and spray. The separate 2D terrain experiment still does not modify this 3D scene; arbitrary heightmap import into the source solver is not implemented.
