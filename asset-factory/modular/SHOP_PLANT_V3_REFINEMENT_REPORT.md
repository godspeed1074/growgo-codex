# Simple Shop Plant v3 Refinement Report

## BLOCKED — operator review gate not passed

The refinement correctly increased leaf-body thickness and added a detailed reusable planter, but the extreme left/right renders still show repeated horizontal leaf projections behind the rounded foliage volumes. The candidate is materially better than `@2.0.0`, but the hard side-view gate is not yet satisfied, so it is not promoted and is not integrated into the shop.

### Protected baseline

`GG-VEG-PLANTER-SHRUB-001@2.0.0` remains the rollback candidate. The shop building, recipe, camera, facade modules, Golden Reference, Atlas, and production assets were not modified.

### Candidates tested

Three deterministic compositions were rendered on the Steam Deck:

- A — compact/dense
- B — balanced reference (selected for refinement)
- C — deeper/volumetric

Candidate B metrics:

- Asset: `GG-VEG-PLANTER-SHRUB-001@3.0.0`
- Leaf modules: `GG-VEG-LEAF-SHRUB-BROAD_CUPPED`, `GG-VEG-LEAF-SHRUB-BROAD_FOLDED`, `GG-VEG-LEAF-SHRUB-SMALL_CURVED`
- Leaf instances: 27
- Flower instances: 4
- Foliage clusters: 9
- Triangles: 1,572
- Vertices: 940
- Objects: 77
- Materials: 7
- Depth/width ratio: 36%
- Anonymous geometry: 0
- Mobile budget: PASS

### Visual gate

- Golden Reference front likeness: PASS WITH NOTES
- Foliage silhouette: PASS
- Foliage density: PASS
- Individual leaf geometry: PASS
- Leaf curvature/fold: PASS
- Leaf side body: PASS WITH NOTES
- Orientation diversity: PASS WITH NOTES
- 3D depth envelope: PASS
- 3/4 volume: PASS
- Top-oblique volume: PASS
- Planter geometry: PASS
- Planter front detailing: PASS (recessed panel, corner posts, X detail, rim, soil)
- Grounding: PASS
- Left/right hard gate: **FAIL** — repeated leaf projections remain visible
- Card/blade artifact: **YES, residual**
- Full-shop integration: **NOT RUN** because the isolated side gate failed

### Evidence

- [V3 review board](../../../test-output/PLANT_3D_V3_REFERENCE_REVIEW_BOARD.png)
- [Candidate B front](../../../test-output/plant3d-v3/candidate-B/FRONT.png)
- [Candidate B left](../../../test-output/plant3d-v3/candidate-B/LEFT.png)
- [Candidate B right](../../../test-output/plant3d-v3/candidate-B/RIGHT.png)
- [Candidate B leaf close-up](../../../test-output/plant3d-v3/candidate-B/LEAF_CLOSEUP.png)
- [Candidate B planter close-up](../../../test-output/plant3d-v3/candidate-B/PLANTER_CLOSEUP.png)

### Next controlled correction

Keep the new solid leaf and planter modules, then perform one leaf-orientation cleanup: reduce leaves whose long axis projects toward the left/right camera, increase radial yaw diversity, and retain the front silhouette. Do not modify the shop or promote `@3.0.0` until both side renders pass.

Steam Deck execution: **PASS**. Known-good: **NO**. Eucalyptus: **NOT STARTED**.
