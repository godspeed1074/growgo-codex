# GROWGO SESSION 188 — COASTAL_SHRUB_FAMILY_001 Foundation

## Goal

Create the specification-only foundation for `COASTAL_SHRUB_FAMILY_001` using
the established Asset Factory Reference Pipeline. No Blender assets are
generated in this phase.

## Reference workflows inspected

- `TREE_EUCALYPTUS_001`
- `TREE_BOTTLEBRUSH_001`

The family foundation adopts their established boundaries for:

- permanent asset and recipe identity
- versioned source naming
- CLOSE, GAMEPLAY, and MAP LOD planning
- per-LOD identity anchors
- dependency identity declarations
- metadata-aware deterministic validation
- manual visual review before approval
- explicit publishing and runtime gates

## Preserved planned identity

The validated coastal starter production queue already reserves:

- asset: `SHRUB_COASTAL_LOW_001`
- recipe: `SHRUB_COASTAL_LOW_RECIPE_001`

Phase 188 preserves those identities and assigns them to the new production
family foundation:

- family: `COASTAL_SHRUB_FAMILY_001`
- version: `v001`
- variant: `DEFAULT`
- palette: `AU_COASTAL_SHRUB_NATIVE_001`
- LOD profile: `NATURE_STANDARD_001`

## Recipe placeholders

- `SHRUB_COASTAL_LOW_RECIPE_001`
  - primary low coastal shrub
- `SHRUB_COASTAL_FLOWERING_RECIPE_001`
  - reserved flowering variant
- `SHRUB_COASTAL_WINDSWEPT_RECIPE_001`
  - reserved windswept variant

These are placeholders only. They are not registered or authorized for
production in this phase.

## Dependency placeholders

- `MOD_SHRUB_BRANCH_CLUSTER_COASTAL_001`
- `MOD_SHRUB_FOLIAGE_CLUSTER_COASTAL_001`
- `MOD_SHRUB_FLOWER_CLUSTER_COASTAL_001`
- `MOD_SHRUB_GROUND_SOCKET_COASTAL_001`

## Expected future outputs

The foundation reserves, but does not create:

- `SHRUB_COASTAL_LOW_001_v001.blend`
- `SHRUB_COASTAL_LOW_001_LOD_CLOSE.glb`
- `SHRUB_COASTAL_LOW_001_LOD_GAMEPLAY.glb`
- `SHRUB_COASTAL_LOW_001_LOD_MAP.glb`

## Production structure

Created:

- `asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/source`
- `asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/export`
- `asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/validation`

The source and export directories are intentionally empty.

## Validation expectations

Future production must verify:

- asset, recipe, dependency, and metadata identity
- required per-LOD identity anchors
- no external dependencies
- decreasing LOD triangle complexity
- non-increasing mesh and primitive complexity
- deterministic export
- manual visual review before approval
- explicit publishing authorization

## Files created

- `asset-factory/coastal-shrub-family-foundation.mjs`
- `tests/asset-factory-coastal-shrub-family-foundation.test.mjs`
- `asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/family-specification.json`
- `asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/recipe-placeholders.json`
- `asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/validation/validation-expectations.json`
- empty source and export directory markers
- `GROWGO_SESSION_188_COASTAL_SHRUB_FAMILY_FOUNDATION.md`

## Safety

- no Blender launch
- no Blender generator created
- no `.blend` or `.glb` files created
- no registry or catalog activation
- no publishing or runtime activation
- no existing approved asset modified

## Next production step

Create the Phase 188.x manual authoring setup for
`SHRUB_COASTAL_LOW_001_v001`, including Blender generator and export-resume
scripts derived from the eucalyptus and bottlebrush reference patterns. That
step should remain separate from this family foundation.
