# Modular Source + Camera-Locked Presentation Bake

## Result

**BLOCKED — presentation convergence not achieved**

The modular source remains authoritative and unchanged. A camera-locked presentation derivative was generated from the real Steam Deck Blender front render with a tight source-silhouette alpha. A reference-tonal composite was tested, but it introduced visible alignment artifacts and was rejected. The safe derivative now matches the source rather than risking regression.

## Status

- Modular source preserved: **YES**
- Source score: **91**
- Presentation derivative: `GG-PRES-BLD-SIMPLE-SHOP-GROWGO-001@1.0.0`
- Presentation variants tested: **2**
- Final primary-view score: **91 (no improvement)**
- Visual improvement: **91 → 91**
- Alpha silhouette: **PASS**
- Rectangular artifact: **NO** in safe baseline derivative
- Crop fringe: **NO** in safe baseline derivative
- Codex Vision: **STALLED_PRESENTATION_CONVERGENCE**
- Source technical gates: **PASS**
- Presentation budget: **PASS**
- Known-good assigned: **NO**
- Ready for operator final review: **NO**

Evidence: `test-output/presentation-derivative/`
