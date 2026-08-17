# Exact Target Plant Reconstruction

## BLOCKED

The supplied crop is locked as the authoritative reference and three depth variants were rendered from one traced front arrangement:

- DEPTH_A: 24%
- DEPTH_B: 28% (selected)
- DEPTH_C: 32%

Steam Deck Blender 5.2.0 execution passed. The planter, X detail, rim, posts, soil, sharp leaf mesh family, and modular IDs were preserved.

### Target measurements

- Image: 189 × 261 px
- Planter bounds: x=8–174, y=169–258
- Foliage bounds: x=28–161, y=25–174
- Foliage: 133 × 149 px
- Foliage/planter width ratio: 0.801
- Foliage/planter height ratio: 1.674
- Flower band: y=148–174

### Selected DEPTH_B

- 36 visible sharp leaf instances
- 3 flower groups
- 28% depth/width
- 1,104 triangles; 670 vertices; 59 objects; 7 materials
- Anonymous geometry: 0
- Budget: PASS

### Vision/numeric gate

- Tall centre hierarchy: PASS WITH NOTES
- Pointed leaves: PASS
- Flower placement: PASS
- Planter relationship: PASS
- Front density: FAIL — 57%, target ≥78%
- Front bounds: FAIL — width and height errors exceed target tolerance
- Left/right shelf pattern: NEEDS_CORRECTION
- 3D depth: PASS WITH NOTES
- Muddy/blob foliage: NO
- Ready for operator review: NO

Evidence board: [PLANT_EXACT_TARGET_RECONSTRUCTION_BOARD.png](../../../test-output/PLANT_EXACT_TARGET_RECONSTRUCTION_BOARD.png)

No shop or eucalyptus work was started. The next correction must add/reposition medium and small target-shaped leaves into the measured gaps while preserving the same traced front hierarchy.
