# GROWGO SESSION 137 — CIVIC ASSET PACK FOUNDATION

## Summary

Session 137 creates the Asset Factory foundation for civic assets required by Atlas recipes.

Real-world data remains authoritative for:

- location
- footprint
- classification

Asset Factory provides:

- reusable visual assets
- variants
- LOD rules

This session does not:

- create final models
- modify renderer
- modify gameplay
- import OSM

## Target

Created:

`CIVIC_ASSET_PACK_001`

Purpose:

Provide deterministic registry support, recipes, metadata, and validation for civic assets needed by Atlas-facing school, library, community building, and sports-support recipes.

## Files Changed

- `asset-factory/asset-registry.mjs`
- `tests/asset-factory-asset-registry.test.mjs`
- `tests/asset-factory-asset-pack-priority.test.mjs`

## Files Created

- `GROWGO_SESSION_137_CIVIC_ASSET_PACK_FOUNDATION.md`

## Civic Asset Families

The registry now supports:

### `SCHOOL_ASSET_FAMILY_001`

Foundation coverage includes:

- primary school
- secondary school
- small rural school

Registered foundation entry:

- `BUILDING_CIVIC_SCHOOL_PRIMARY_001`

### `LIBRARY_ASSET_FAMILY_001`

Foundation coverage includes:

- small library
- community library

Registered foundation entry:

- `BUILDING_CIVIC_LIBRARY_SMALL_001`

### `COMMUNITY_BUILDING_ASSET_FAMILY_001`

Foundation coverage includes:

- community hall
- civic centre

Registered foundation entry:

- `BUILDING_CIVIC_COMMUNITY_HALL_001`

### `SPORTS_FACILITY_ASSET_FAMILY_001`

Foundation coverage includes:

- sports pavilion
- changing rooms
- recreation buildings

Registered foundation entry:

- `BUILDING_CIVIC_SPORTS_PAVILION_001`

## Asset Metadata

Each civic entry now includes:

- asset ID
- recipe ID
- asset family
- usage rules
- LOD rules
- Atlas compatibility
- footprint compatibility

Footprint compatibility is now recorded explicitly for civic entries such as:

- `CAMPUS_FOOTPRINT`
- `SUBURBAN_BLOCK_EDGE`
- `MAIN_STREET_CIVIC_FRONTAGE`
- `CIVIC_CLUSTER_FOOTPRINT`
- `SPORTS_EDGE_FOOTPRINT`

This keeps civic presentation compatible with real-world footprints without changing source geometry.

## Recipes

Created civic pack recipe definitions for:

- `SCHOOL_RECIPE_001`
- `LIBRARY_RECIPE_001`
- `COMMUNITY_BUILDING_RECIPE_001`
- `SPORTS_FACILITY_RECIPE_001`

Atlas bridge support is also recorded through civic asset compatibility metadata:

- `SCHOOL_RECIPE_001`
- `LIBRARY_RECIPE_001`
- `COMMUNITY_BUILDING_RECIPE_001`
- `SPORTS_OVAL_RECIPE_001`
- `RECREATION_AREA_RECIPE_001`

This allows the sports civic family to support both pavilion-style building treatment and Atlas sports-ground assignment demand.

## Registry Support

`ASSET_FACTORY_REGISTRY_LAYER_001` now includes civic foundation records by default.

The registry supports:

- civic asset ID lookup
- civic recipe lookup
- family lookup
- Atlas assignment compatibility

`CIVIC_ASSET_PACK_001` additionally provides:

- pack-level family listing
- pack recipe lookup
- deterministic civic pack validation

## Validation

Created:

`CIVIC_ASSET_PACK_VALIDATION_001`

Checks:

- unique IDs
- recipe exists
- Atlas compatibility
- footprint compatibility
- deterministic lookup

The registry-level deterministic validation remains active alongside the civic pack validation.

## Testing

Added tests for:

- school lookup
- library lookup
- community lookup
- sports lookup
- recipe lookup
- deterministic output
- explicit civic pack validation

## Validation Results

Verified:

- `tests/asset-factory-asset-registry.test.mjs`
  - `20 / 20` passing

Regression slice:

- `tests/asset-factory-atlas-asset-recipe-resolver.test.mjs`
  - `10 / 10` passing
- `tests/asset-factory-asset-pack-priority.test.mjs`
  - `5 / 5` passing

## Planning Feedback

Because civic assets are now represented in the registry, civic demand is no longer treated as an uncovered planning gap by the pack-priority system.

That shifts the current highest-priority pack ordering toward transport and street coverage, which is the expected behaviour for a demand-driven planning layer.

## Readiness

`CIVIC_ASSET_PACK_001` is ready for future civic asset creation.

Asset Factory now has a deterministic civic foundation that supports Atlas recipe demand while preserving authoritative real-world placement and footprint truth.
