# GrowGo Session 190.2 - SHRUB_COASTAL_LOW_001 v002 Visual Refinement

Date: 2026-07-29
Branch: `feature/growgo-asset-factory-town-expansion`

## Goal

Create a safe `v002` visual-refinement workflow for `SHRUB_COASTAL_LOW_001` after `v001` failed human visual approval despite passing technical validation.

## Preserved state

- `v001` remains fully preserved and untouched.
- No `v001` source, GLB, registration, promotion, or golden-regression records are overwritten.
- No final `v002` GLBs are exported in this phase.
- No registration or promotion occurs in this phase.

## Visual issues addressed

- Pancaked silhouette
- Weak side profile
- Flowers not visually readable

## Workflow updates

- Generator now targets `SHRUB_COASTAL_LOW_001_v002.blend`
- Export resume script now targets:
  - `SHRUB_COASTAL_LOW_001_v002_LOD_CLOSE.glb`
  - `SHRUB_COASTAL_LOW_001_v002_LOD_GAMEPLAY.glb`
  - `SHRUB_COASTAL_LOW_001_v002_LOD_MAP.glb`
- Revision-side authoring manifest now targets:
  - `shrub-coastal-low-v002-authoring-manifest.json`
- Revision-side export manifest now targets:
  - `shrub-coastal-low-v002-export-manifest.json`

## Geometry intent for manual Blender generation

- Increase canopy depth while remaining within a restrained papercut 2.5D profile
- Stagger foliage masses across front and back Y offsets
- Strengthen left/right mass balance for side and 45-degree views
- Push flower clusters toward outer, more visible silhouette positions
- Preserve mobile-first mesh budgets and shared materials

## Next Blender step

1. Open a fresh Blender 4.2 LTS scene.
2. Run `asset-factory/local-blender-scripts/generate_shrub_coastal_low_001.py`.
3. Inspect the new side profile, 45-degree silhouette, and flower visibility.
4. Save the scene as `SHRUB_COASTAL_LOW_001_v002.blend`.
5. Return before export or registration work.
