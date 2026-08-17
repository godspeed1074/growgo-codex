# 3D Planter + Shrub Completion Report

## PASS WITH NOTES

Like I’m 5: the old plant was mostly flat pictures. The new candidate is a real small 3D plant: it has a deep planter, chunky overlapping foliage volumes, individual bent leaves, and flowers with depth. It was rendered on the real Steam Deck Blender worker and then inserted into an isolated copy of the latest shop. The building source was not changed.

- Previous shrub: `GG-VEG-PLANTER-SHRUB-001@1.0.0` (protected)
- New candidate: `GG-VEG-PLANTER-SHRUB-001@2.0.0`
- Steam Deck Blender: `5.2.0 LTS`
- Execution: `REAL_BLENDER_WORKER_EXECUTION`
- Known-good: **NO**
- Eucalyptus: **NOT STARTED**

## Evidence

- Isolated proof: [PLANT_3D_MULTI_VIEW_BOARD.png](../../../test-output/plant3d/PLANT_3D_MULTI_VIEW_BOARD.png)
- Reference comparison: [PLANT_3D_GOLDEN_FRONT_COMPARISON.png](../../../test-output/plant3d/PLANT_3D_GOLDEN_FRONT_COMPARISON.png)
- Component ID: [PLANT_3D_COMPONENT_ID.png](../../../test-output/plant3d/PLANT_3D_COMPONENT_ID.png)
- Integrated front: [SHOP_WITH_3D_PLANT_FRONT.png](../../../test-output/plant3d-integration/SHOP_WITH_3D_PLANT_FRONT.png)
- Integrated hero: [SHOP_WITH_3D_PLANT_HERO.png](../../../test-output/plant3d-integration/SHOP_WITH_3D_PLANT_HERO.png)

## Geometry

| Measure | Result |
|---|---:|
| Leaf instances | 28 |
| Flower instances | 3 |
| Foliage clusters | 7 |
| Physical size | approximately 1.05 W × 1.45 H × 0.44 D |
| Depth / width | 42% |
| Triangles | 832 |
| Vertices | 528 |
| Objects | 56 |
| Materials | 6 |
| Anonymous geometry | 0 |
| Mobile budget | PASS |

## Visual gate

- Front silhouette: **PASS WITH NOTES**
- True 3D foliage: **PASS**
- 3/4 volume: **PASS**
- Left side volume: **PASS**
- Right side volume: **PASS**
- Flower depth: **PASS**
- Planter depth: **PASS**
- Grounding: **PASS**
- Card-stack appearance: **NO** for the main shrub mass; leaves remain genuine reusable 3D module instances
- Golden Reference front likeness: **PASS WITH NOTES** — the candidate preserves the right placement and rounded plant read, but the low-poly foliage masses are more faceted than the supplied concept and remain operator-review material
- Full-shop integration: **PASS** in an isolated candidate output; only the plant was replaced

## Protected scope

Shop body, Door, Window, Awning, Fascia, Foundation, recipe identity, camera contract, Golden Reference, Atlas/live map, and production assets were not modified. The Master Asset Index now records the 2.0.0 candidate lineage without replacing the historical version.

## Recommended next step

Operator review of the isolated and integrated plant boards. If approved, promote `@2.0.0` through the normal controlled registration workflow; otherwise make one plant-only refinement. Do not resume facade work or start eucalyptus until this review is complete.
