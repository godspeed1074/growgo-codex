# GrowGo Session 200.2 — COASTAL_LOCATION_RECIPE_001 Recipe Generation

Date: 2026-07-30  
Branch: `feature/growgo-asset-factory-town-expansion`

## Scope

Generate the first deterministic coastal location assembly plan from approved Asset Factory assets without creating Blender files, GLBs, asset modifications, or runtime activation.

## Files created

- `asset-factory/coastal-location-recipe-generation.mjs`
- `tests/asset-factory-coastal-location-recipe-generation.test.mjs`
- `asset-factory-workspace/recipes/COASTAL_LOCATION_RECIPE_001/generation/coastal-location-recipe-001-generated-plan.json`
- `asset-factory-workspace/recipes/COASTAL_LOCATION_RECIPE_001/generation/coastal-location-recipe-001-dependency-map.json`
- `asset-factory-workspace/recipes/COASTAL_LOCATION_RECIPE_001/validation/coastal-location-recipe-001-generation-validation.json`
- `asset-factory-workspace/recipes/COASTAL_LOCATION_RECIPE_001/reports/coastal-location-recipe-001-generation-report.md`

## Seed and recipe output

- recipe ID: `COASTAL_LOCATION_RECIPE_001`
- location plan ID: `COASTAL_EXPLORATION_LOCATION_001:COASTAL_LOCATION_RECIPE_001:DEFAULT:SEED_001`
- seed: `COASTAL_LOCATION_RECIPE_001:DEFAULT:SEED_001`
- biome profile: `COASTAL_RESERVE_TRAIL`
- archetype: `RESERVE_LOOP`

Deterministic placement counts:

- `COASTAL_GRAVEL_PATH_001`: 4
- `COASTAL_BOARDWALK_001`: 1
- `COASTAL_WATER_EDGE_001`: 3
- `COASTAL_GROUND_COVER_001`: 7
- `COASTAL_ROCK_CLUSTER_001`: 2
- `COASTAL_GRASS_TUSSOCK_001`: 6
- `SHRUB_COASTAL_LOW_001`: 2
- `TREE_BOTTLEBRUSH_001`: 1

## Included generation logic

- deterministic seed handling
- zone allocation
- placement plan
- asset dependency map
- navigation path logic
- water transition rules
- vegetation density rules
- mobile performance limits

## Validation result

- validation status: `pass`
- all dependencies exist: `pass`
- lifecycle requirements pass: `pass`
- deterministic output for same seed: `pass`
- no unsupported assets included: `pass`
- runtime activation: `not performed`

## Performance summary

- close triangles: `5302 / 7600`
- gameplay triangles: `3770 / 5200`
- map triangles: `2402 / 2600`
- unique referenced assets: `8 / 8`

## Safety

Confirmed:

- no Blender files created
- no GLBs created
- no assets modified
- no runtime activation performed

## Tests

Focused tests run:

- `tests/asset-factory-coastal-location-recipe-generation.test.mjs`

Result:

- 6 passed
- 0 failed

## Outcome

`COASTAL_LOCATION_RECIPE_001` now has a deterministic, dependency-validated assembly plan and is ready for recipe review or world-assembly preview work.
