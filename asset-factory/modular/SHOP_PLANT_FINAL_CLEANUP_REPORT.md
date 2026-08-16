# Plant Final Cleanup Report

## BLOCKED

Like I’m 5: the plant is rounder and the planter is preserved, but a few leaves still stick out sideways like little shelves when viewed from the left and right. Because the side-view gate is strict, the plant is not promoted and is not inserted into the shop.

Protected rollback: `GG-VEG-PLANTER-SHRUB-001@2.0.0` and Candidate B from the previous v3 pass.

### Cleanup variants

Three isolated cleanup variants were rendered on Steam Deck Blender 5.2.0:

- CLEANUP_A — orientation-focused, 18 leaves
- CLEANUP_B — orientation plus thick folded leaf profile, 27 leaves
- CLEANUP_C — orientation, profile, and selective cluster repositioning, 27 leaves

Cleanup A was the cleanest side candidate, but still has visible short projections. Cleanup B preserves the strongest front density but retains more side projections. Cleanup C is deeper but does not clear the hard side gate.

### Candidate metrics

- Candidate identity: `GG-VEG-PLANTER-SHRUB-001@3.0.0` (not promoted)
- Leaf meshes: `BROAD_CUPPED`, `BROAD_FOLDED`, `SMALL_CURVED`
- Leaf body: folded, double-surface, non-zero-depth 20-triangle mesh
- Flower instances: 4 groups
- Planter: locked and preserved with rim, soil, recessed panel, posts, and X detail
- Anonymous geometry: 0
- Mobile budget: PASS

### Vision gate

- Front likeness: PASS WITH NOTES
- Compact foliage density: PASS
- Individual leaf body: PASS
- Leaf side profile: PASS WITH NOTES
- Leaf curvature/fold: PASS
- Orientation diversity: PASS WITH NOTES
- Left-side volume: NEEDS_CORRECTION
- Right-side volume: NEEDS_CORRECTION
- 3/4 volume: PASS WITH NOTES
- Top-oblique depth: PASS
- Planter: PASS
- Flowers: PASS
- Parallel blade artifact: **YES, residual**
- Card-stack artifact: **YES, residual in extreme sides**
- Full-shop integration: **NOT RUN**
- Known-good: **NO**

Offending instance audit: [PLANT_SIDE_ARTIFACT_AUDIT.json](./PLANT_SIDE_ARTIFACT_AUDIT.json)

Review board: [PLANT_3D_V3_FINAL_CLEANUP_BOARD.png](../../../test-output/PLANT_3D_V3_FINAL_CLEANUP_BOARD.png)

### Required next step

Keep the planter and volumetric foliage masses. Apply a final local leaf pass to the nine audited instances: tuck them into the cluster envelope or replace them with more radial/shorter variants. Do not modify the shop or integrate until both left and right hard gates pass.
