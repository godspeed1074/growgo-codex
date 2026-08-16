# Simple Shop 3D Planter + Shrub Reconstruction

Status: **PASS WITH OPERATOR REVIEW**

The plant was rebuilt as an isolated Layer A candidate. The shop facade was not changed. Blender 5.2.0 LTS executed the proof on the Steam Deck worker (`flatpak run org.blender.Blender`).

## Candidate

- Previous shrub: `GG-VEG-PLANTER-SHRUB-001@1.0.0` (preserved)
- Candidate: `GG-VEG-PLANTER-SHRUB-001@2.0.0`
- Leaf module: `GG-VEG-LEAF-SHRUB-BROAD-001@1.0.0`
- Flower module: `GG-VEG-FLOWER-ACCENT-001@1.0.0`
- Foliage cluster module: `GG-VEG-SHRUB-FOLIAGE-CLUSTER-001@1.0.0`

## Geometry and budget

28 leaf instances, 3 flower instances, 7 foliage clusters, 832 triangles, 528 vertices, 56 objects, 6 materials. The candidate is below the dedicated 1,500-triangle preferred working target and has zero anonymous geometry.

## Visual gate

- Front silhouette: PASS WITH NOTES
- True 3D foliage: PASS
- 3/4 volume: PASS
- Left/right volume: PASS
- Flower depth: PASS
- Planter depth and grounding: PASS
- Card-stack appearance: NO for the main foliage masses; residual thin leaf accents are intentional module instances
- Golden Reference front likeness: NEEDS OPERATOR REVIEW

The isolated render now has real volumetric foliage masses, overlapping low-poly leaves, flowers with depth, and a proper planter body/rim/soil. It is intentionally a stylized reconstruction rather than a texture-card solution.

## Evidence

- [PLANT_3D_GOLDEN_FRONT_COMPARISON.png](../../../test-output/plant3d/PLANT_3D_GOLDEN_FRONT_COMPARISON.png)
- [PLANT_3D_MULTI_VIEW_BOARD.png](../../../test-output/plant3d/PLANT_3D_MULTI_VIEW_BOARD.png)
- [PLANT_3D_COMPONENT_ID.png](../../../test-output/plant3d/PLANT_3D_COMPONENT_ID.png)
- [PLANT_3D.blend](../../../test-output/plant3d/PLANT_3D.blend)

Full-shop replacement was not promoted automatically. The next controlled step is to replace only the existing shrub/planter in the dimension-corrected shop wrapper and run the plant-specific integration gate.

Known-good assignment: **NO**. Eucalyptus work: **NOT STARTED**.
