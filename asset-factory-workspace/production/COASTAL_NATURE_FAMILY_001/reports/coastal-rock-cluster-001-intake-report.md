# COASTAL_ROCK_CLUSTER_001 Intake Report

- Date: 2026-07-30
- Workflow: Asset Factory v1
- Status: Intake complete, authoring not started

## Asset summary

COASTAL_ROCK_CLUSTER_001 is queued as a reusable coastal rock-cluster terrain-detail asset for beaches, cliffs, trails, parks, shorelines, and natural terrain within `COASTAL_NATURE_FAMILY_001`.

## Identity

- Asset ID: `COASTAL_ROCK_CLUSTER_001`
- Recipe ID: `COASTAL_ROCK_CLUSTER_RECIPE_001`
- Development version: `v001`
- LOD set: `LOD_CLOSE`, `LOD_GAMEPLAY`, `LOD_MAP`

## Performance targets

- CLOSE triangles: <= 220
- GAMEPLAY triangles: <= 132
- MAP triangles: <= 56
- Shared material strategy: 2 materials max across all LODs
- Mobile-first geometry required

## Source/export contract

- Blender source must live only in `source/`
- GLB outputs must live only in `export/`
- source/export separation must remain preserved through future production phases

## Validation requirements

- Asset identity defined
- Recipe identity defined
- Family assignment defined
- LOD expectations defined
- Performance targets defined
- Visual approval criteria defined
- Source/export contract defined
- No Blender source created yet
- No GLB outputs created yet
- No registration created yet

## Human visual approval criteria

- Reads clearly as a natural coastal rock cluster rather than a repeated tile
- Maintains papercut 2.5D style
- Preserves a natural silhouette from front, side, and 45-degree views
- Repeats well across beaches, cliffs, trails, parks, and shoreline scatter
- Preserves a recognisable clustered rock footprint through LOD reduction

## Next step

The asset is ready for Phase 196.2 authoring setup. No Blender file, geometry, GLB, or registration artifact has been created in this intake phase.
