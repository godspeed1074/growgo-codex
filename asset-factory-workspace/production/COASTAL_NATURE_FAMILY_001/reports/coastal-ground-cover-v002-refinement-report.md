# COASTAL_GROUND_COVER_001 v002 Visual Refinement Workflow

- Date: 2026-07-29
- Workflow: Asset Factory v1 revision lane
- Status: v002 authoring setup complete

## Revision reason

`COASTAL_GROUND_COVER_001_v001` passed technical checks but failed human visual review because it read too much like a square terrain tile instead of a natural coastal vegetation cluster.

## v001 preservation

- `v001` remains preserved and untouched
- no `v001` files were overwritten
- no registration or promotion state was changed

## v002 refinement targets

- Replace square patch appearance with irregular organic clumps
- Improve front, side, and 45-degree silhouettes
- Make the asset suitable for procedural scattering
- Preserve papercut 2.5D style
- Preserve mobile-first geometry and low triangle budgets
- Support deterministic placement variation

## v002 expected source and outputs

- Blend target: `COASTAL_GROUND_COVER_001_v002.blend`
- Export targets:
  - `COASTAL_GROUND_COVER_001_v002_LOD_CLOSE.glb`
  - `COASTAL_GROUND_COVER_001_v002_LOD_GAMEPLAY.glb`
  - `COASTAL_GROUND_COVER_001_v002_LOD_MAP.glb`

## Next step

`COASTAL_GROUND_COVER_001_v002` is ready for manual Blender generation.
