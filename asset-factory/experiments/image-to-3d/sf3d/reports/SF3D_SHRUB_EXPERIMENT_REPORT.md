# SF3D Shrub Scaffold Experiment

## Status: HARDWARE_BLOCKED

Like I’m 5: SF3D is the kind of helper that could make a rough 3D shrub shape from the picture. We kept the picture safe and made a sealed test room for it. But neither available computer has the kind of graphics engine SF3D needs, so asking it to run here would not make a real result.

- Official SF3D implementation: **FOUND** — Stability AI's `stable-fast-3d`.
- Installed in isolated environment: **NO** — deliberately not installed on unsupported hardware.
- Input: original 189 × 261 RGBA shrub crop, checksum `4a0bd6fb6eb6aaf8e835dededc004e48c3c459d9824eaf4d3b51a1aba150aacf`.
- Inference executed: **NO**.
- Raw output: **none**; no GLB, mesh, or texture was fabricated.
- Blender import / nine-view board / 3D measurements: **not run**, because they require a genuine provider output.

## Hardware finding

The Intel Mac has an AMD Radeon Pro 5300M with 4 GB VRAM, below the official default single-image requirement of roughly 6 GB. Its Intel architecture cannot use SF3D's experimental Apple-Silicon MPS support. The Steam Deck is retained as the certified Blender worker; it has an AMD APU and no CUDA, MPS, or detected ROCm toolchain.

The correct next location is a separate supported CUDA machine with at least 6 GB usable VRAM. It must accept the SF3D model's Hugging Face access terms and use a separate environment. Once it returns `RAW_SF3D_SHRUB.glb`, the existing Steam Deck Blender worker can perform the specified neutral import and nine-view evaluation unchanged.

## Future provider contract

The isolated adapter exposes `checkAvailability`, `prepareInput`, `runInference`, `collectOutput`, `inspectOutput`, and `createBlenderProof`. It is intentionally unable to make production changes or run inference while hardware is blocked. A later SPAR3D or other provider can implement the same boundary without changing production code.

## Safety

Production assets: **NO changes**. Simple Shop: **NO changes**. Current shrub authority: **NO changes**. Atlas/renderer/Master Asset Index: **NO changes**. Eucalyptus: **NOT STARTED**.
