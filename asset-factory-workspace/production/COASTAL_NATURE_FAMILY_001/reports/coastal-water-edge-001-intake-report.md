# COASTAL_WATER_EDGE_001 Intake Report

- Date: 2026-07-30
- Workflow: Asset Factory v1
- Status: Intake complete, authoring not started

## Asset summary

COASTAL_WATER_EDGE_001 is queued as a reusable shoreline transition asset for beaches, rocky coasts, lakes, rivers, creeks, and water edges within `COASTAL_NATURE_FAMILY_001`.

## Identity

- Asset ID: `COASTAL_WATER_EDGE_001`
- Recipe ID: `COASTAL_WATER_EDGE_RECIPE_001`
- Development version: `v001`
- LOD set: `LOD_CLOSE`, `LOD_GAMEPLAY`, `LOD_MAP`

## Performance targets

- CLOSE triangles: <= 180
- GAMEPLAY triangles: <= 108
- MAP triangles: <= 48
- Shared material strategy: 2 materials max across all LODs
- Mobile-first geometry required

## Source/export contract

- Blender source must live only in `source/`
- GLB outputs must live only in `export/`
- source/export separation must remain preserved through future production phases

## Production lessons applied

- visual approval required before registration
- source path verification required before export
- heavy water simulation should be avoided

## Validation requirements

- Asset identity defined
- Recipe identity defined
- Family assignment defined
- LOD expectations defined
- Performance targets defined
- Visual approval criteria defined
- Source/export contract defined
- Pre-export gates defined
- No Blender source created yet
- No GLB outputs created yet
- No registration created yet

## Human visual approval criteria

- Reads clearly as a natural water-edge transition rather than a repeated tile
- Maintains papercut 2.5D style
- Preserves a readable shoreline silhouette from front, side, and 45-degree views
- Repeats well beside existing coastal vegetation and rocks
- Avoids heavy simulated water effects while keeping a clear shoreline transition

## Next step

The asset is ready for Phase 197.2 authoring setup. No Blender file, geometry, GLB, or registration artifact has been created in this intake phase.
