# Pixel-Traced Continuous Facade Mesh Proof

## Result

**BLOCKED — STALLED_CONTOUR_FACADE**

The authoritative wall mask and raster contour were generated, and a single registered Layer A contour mesh was rendered on Steam Deck Blender. The high-fidelity mask reduced the previous 20-vertex simplification, but the integrated render still produced visible stepped/rectangular wall regions and did not beat the 91-score baseline.

## Metrics

- Raw contour boundary points: **2,783**
- Mask-derived mesh cells: **627**
- Approximate contour mesh triangles: **1,254**
- Simplification tolerances tested: **0 px mask / 8 px mesh sampling**
- Alignment/depth candidates: **1**
- Door/Window cutouts: **PASS geometrically**
- Outer silhouette: **FAIL visually**
- Rectangular artifact: **YES**
- Visible seams: **YES**
- Floating facade: **YES/edge regions**
- Wall richness: not safely improved
- Upper transition: not safely improved
- Final score: **91 baseline retained**

## Technical status

- Steam Deck Blender 5.2.0 LTS: PASS
- Four-side: PASS
- Component IDs: PASS
- Anonymous geometry: 0
- Budget: PASS
- Known-good: **NO**
- Ready for operator final review: **NO**

Evidence: `test-output/contour-facade/` and `test-output/contourmesh/`.
