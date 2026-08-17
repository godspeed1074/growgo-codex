# Reference-Locked Facade Background Proof

## Result

**BLOCKED — Blender projection rejected**

The 2D reference-layer reassembly is lossless, but the isolated Blender projection still exposes a rectangular gap at the right wall boundary. The reference-locked layer is therefore not promoted and the 91-score modular baseline remains the active safe candidate.

## Results

- 2D reference reassembly: **PASS**
- Facade-background module: `GG-BLD-FACADE-BACKGROUND-SIMPLE-SHOP-001@1.0.0`
- Mask iterations: **3**
- Real Blender iterations: **3**
- Starting score: **91**
- Final promoted score: **91 baseline unchanged**
- Wall richness: potentially improved in 2D, not accepted in Blender
- Upper transition: not accepted
- Hero modules: preserved
- Visible mask edges: **YES** in Blender candidate
- Hero modules painted over: **NO**
- Floating facade card appearance: **YES/edge artifact present**
- Codex vision: **STALLED_VISUAL_CONVERGENCE for this projection strategy only**

## Technical status

- Steam Deck Blender 5.2.0 LTS: PASS
- Four-side: PASS
- Component IDs: PASS
- Anonymous geometry: 0
- Budget: PASS
- Known-good: **NO**
- Active production baseline: **91-score modular candidate**

The target, mask, 2D proof, and Blender evidence remain available under `test-output/reference-facade-background/` and `test-output/reflock*` for audit. No production recipe, hero module, camera, or Golden Reference was changed.
