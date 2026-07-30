# GrowGo Session 200.1 — COASTAL_LOCATION_RECIPE_001 New Recipe Intake

Date: 2026-07-30  
Branch: `feature/growgo-asset-factory-town-expansion`

## Scope

Create the first world assembly recipe package using approved coastal assets, without generating geometry, exporting GLBs, modifying assets, registering anything, or promoting anything.

## Files created

- `asset-factory/coastal-location-recipe-intake.mjs`
- `tests/asset-factory-coastal-location-recipe-intake.test.mjs`
- `asset-factory-workspace/recipes/COASTAL_LOCATION_RECIPE_001/specification/coastal-location-recipe-001-specification.json`
- `asset-factory-workspace/recipes/COASTAL_LOCATION_RECIPE_001/validation/coastal-location-recipe-001-validation.json`
- `asset-factory-workspace/recipes/COASTAL_LOCATION_RECIPE_001/reports/coastal-location-recipe-001-report.md`

## Recipe identity

- recipe ID: `COASTAL_LOCATION_RECIPE_001`
- type: `WORLD_ASSEMBLY_COASTAL_EXPLORATION_LOCATION`
- version: `v001`
- variant: `DEFAULT`
- palette: `AU_COASTAL_EXPLORATION_001`
- LOD profile: `WORLD_ASSEMBLY_REFERENCED_ASSETS_ONLY`

## Approved dependencies used

Required core assets:

- `COASTAL_GRAVEL_PATH_001`
- `COASTAL_BOARDWALK_001`
- `COASTAL_WATER_EDGE_001`
- `COASTAL_GROUND_COVER_001`
- `COASTAL_ROCK_CLUSTER_001`

Approved vegetation assets:

- `COASTAL_GRASS_TUSSOCK_001`
- `SHRUB_COASTAL_LOW_001`
- `TREE_BOTTLEBRUSH_001`

Deferred for later recipe adoption:

- `TREE_EUCALYPTUS_001`  
  Deferred because its current catalog lifecycle is still `REGISTERED`/`validated` rather than an approved lifecycle band.

## Defined rules

- placement zones for entry path, shoreline edge, wet crossing, vegetation buffer, and lookout/rest nodes
- deterministic seed strategy based on recipe, location, biome, variant, and placement zone
- coastal-only biome compatibility rules
- pedestrian exploration navigation rules
- mobile-first performance caps and per-archetype triangle budgets

## Validation result

- validation status: `pass`
- next allowed action: `recipe_generation_only`

## Safety

Confirmed:

- no Blender files created
- no geometry generated
- no GLB exports created
- no asset modifications performed
- no registration records created
- no promotion records created

## Tests

Focused tests run:

- `tests/asset-factory-coastal-location-recipe-intake.test.mjs`

Result:

- 6 passed
- 0 failed

## Outcome

`COASTAL_LOCATION_RECIPE_001` is ready for recipe generation work in the next phase.
