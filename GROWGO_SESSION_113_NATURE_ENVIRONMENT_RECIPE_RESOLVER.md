# GROWGO SESSION 113 — NATURE ENVIRONMENT RECIPE RESOLVER

Branch:
`feature/growgo-asset-factory-world-expansion`

## Goal

Create the resolver that selects nature asset combinations for real-world environments.

## Scope Outcome

Created:

- `NATURE_ENVIRONMENT_RECIPE_RESOLVER_001`
- `NATURE_ASSET_ASSIGNMENTS_001`
- `NATURE_RECIPE_VALIDATION_001`
- [nature-environment-recipe-resolver.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/nature-environment-recipe-resolver.mjs)
- [asset-factory-nature-environment-recipe-resolver.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/asset-factory-nature-environment-recipe-resolver.test.mjs)

This session does not:

- create new models
- modify renderer
- modify gameplay
- import OSM

## Resolver Purpose

`NATURE_ENVIRONMENT_RECIPE_RESOLVER_001` now selects nature asset combinations based on:

- Atlas natural feature objects
- biome metadata
- environment classification
- Asset Factory nature pack data

The resolver preserves authoritative real-world geography and only assigns visual treatment.

## Input Support

The resolver now accepts:

- `GROWGO_OBJECT_CLASSIFICATION_LAYER_001`
- `GROWGO_WORLD_OBJECTS_001`
- direct natural-feature input with:
  - natural feature objects
  - biome metadata by object
  - environment classification by object

## Output Contract

`NATURE_ASSET_ASSIGNMENTS_001` entries now include:

- object ID
- environment type
- selected assets
- recipe ID
- biome rules
- LOD rules

## Recipes Created

### `COASTAL_PARK_RECIPE_001`

Uses:

- `TREE_COASTAL_001`
- `GROUND_COASTAL_GRASS_001`
- `ROCK_COASTAL_001`

### `SUBURBAN_GARDEN_RECIPE_001`

Uses:

- `TREE_EUCALYPTUS_001`
- `BUSH_NATIVE_001`
- `GROUND_COASTAL_GRASS_001`

### `FOREST_RECIPE_001`

Uses:

- `TREE_EUCALYPTUS_001`
- `BUSH_NATIVE_001`
- `GROUND_COASTAL_GRASS_001`

This first pass uses the currently registered lightweight forest-compatible assets already available in the nature pack.

### `BEACH_RECIPE_001`

Uses:

- `GROUND_COASTAL_GRASS_001`
- `GROUND_COASTAL_GRASS_001`
- `ROCK_COASTAL_001`

Because this session does not create new models, the existing coastal-ground asset currently covers both beach ground treatment and coastal grass treatment roles. This keeps the recipe deterministic without inventing an unregistered sand model.

## Environment Mapping

Resolver support now includes:

- `COASTAL_PARK`
- `SUBURBAN_GARDEN`
- `FOREST`
- `BEACH`

Resolution priority is:

1. explicit environment classification
2. real-world natural feature type
3. biome metadata
4. deterministic fallback to suburban garden treatment

## Validation

`NATURE_RECIPE_VALIDATION_001` now checks:

- assets exist
- biome compatibility valid
- Atlas compatibility valid
- deterministic assignment

The resolver also verifies that selected nature assets are registered in the current nature asset pack.

## Tests Added

Verified:

- coastal park assignment
- suburban garden assignment
- forest assignment
- beach assignment
- deterministic output
- classified Atlas-layer input
- explicit validation checks

## Files Created

- [nature-environment-recipe-resolver.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/nature-environment-recipe-resolver.mjs)
- [asset-factory-nature-environment-recipe-resolver.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/asset-factory-nature-environment-recipe-resolver.test.mjs)
- [GROWGO_SESSION_113_NATURE_ENVIRONMENT_RECIPE_RESOLVER.md](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_113_NATURE_ENVIRONMENT_RECIPE_RESOLVER.md)

## Validation Results

Verified:

- `tests/asset-factory-nature-environment-recipe-resolver.test.mjs`
  - `7 / 7` passing

- `tests/asset-factory-asset-registry.test.mjs`
  - `13 / 13` passing

- `tests/asset-factory-nature-asset-creation-pass.test.mjs`
  - `7 / 7` passing

- `tests/asset-factory-growgo-object-classification.test.mjs`
  - `7 / 7` passing

## Readiness

`NATURE_ENVIRONMENT_RECIPE_RESOLVER_001` is ready for Atlas environment preview work.

The Asset Factory can now deterministically turn real-world natural context into reusable, biome-aware nature treatment combinations without changing source geography or introducing untracked assets.
