# GrowGo Session 20 - Beach Bungalow Recipe Assembly Test Foundation

## Session Scope

This session creates the controlled assembly-test contract for:

- `RECIPE_HOUSE_BEACH_BUNGALOW_001`
- `BUILDING_HOUSE_BEACH_BUNGALOW_001`

The purpose of this session is to validate second-recipe residential reuse against the approved Layer A Asset Library without introducing new Layer A modules.

## Source of Truth

This session follows:

- `GROWGO_SESSION_17_SECOND_RECIPE_ASSEMBLY_TEST_FOUNDATION.md`
- `GROWGO_SESSION_18_COASTAL_BUNGALOW_MODULE_EXPANSION_FOUNDATION.md`
- `GROWGO_SESSION_19_5_COASTAL_EXPANSION_VALIDATION_AND_LIBRARY_REGISTRATION.md`
- `GROWGO_SESSION_10_RECIPE_EXPANSION_BATCH_1_FOUNDATION.md`
- `GROWGO_SESSION_9_BLENDER_ASSET_FACTORY_IMPLEMENTATION_PLAN_FOUNDATION.md`

## Approved Assembly Scope

### Reused modules

- `MOD_PATH_STANDARD_001`
- `MOD_FENCE_STANDARD_001`
- `MOD_GROUND_GRASS_STANDARD_001`
- `MOD_BUSH_NATIVE_STANDARD_001`
- `MOD_TREE_EUCALYPTUS_STANDARD_001`
- `MOD_DRIVEWAY_STANDARD_SINGLE_001`
- `MOD_FLOWERBED_STANDARD_001`
- `MOD_ROOF_GABLE_STANDARD_001`
- `MOD_WALL_WEATHERBOARD_WHITE_001`
- `MOD_WINDOW_RESIDENTIAL_STANDARD_001`
- `MOD_DOOR_STANDARD_RESIDENTIAL_001`

### New coastal modules already validated in Layer A

- `MOD_FOUNDATION_RAISED_COASTAL_001`
- `MOD_WINDOW_RESIDENTIAL_LARGE_001`
- `MOD_DECK_TIMBER_COASTAL_001`

## Assembly Output

The controlled Layer C output target remains:

- `BUILDING_HOUSE_BEACH_BUNGALOW_001_LOD_CLOSE.glb`
- `BUILDING_HOUSE_BEACH_BUNGALOW_001_LOD_GAMEPLAY.glb`
- `BUILDING_HOUSE_BEACH_BUNGALOW_001_LOD_MAP.glb`

Metadata outputs:

- `building-house-beach-bungalow-manifest.json`
- `building-house-beach-bungalow-metadata.json`
- `building-house-beach-bungalow-validation.json`

## Reuse Validation

- reused modules: `11`
- new modules used: `3`
- total modules: `14`
- target reuse percentage: `79`

## Session Result

This session establishes:

1. a local Blender assembly-test contract
2. a production-run validation contract
3. a controlled metadata/export expectation for the bungalow recipe

This session does not claim that final bungalow GLB exports were produced inside Codex.
