# GROWGO SESSION 135 — ATLAS REAL WORLD OBJECT RECIPE EXPANSION

## Summary

Session 135 expands Atlas asset recipe coverage so more classified real-world objects receive deterministic visual treatments through `ATLAS_ASSET_RECIPE_RESOLVER_001`.

Real-world classification remains authoritative.

Recipes only define visual treatment.

Recipes do not:

- change object type
- move objects
- alter geometry

No renderer work was activated.
No new models were created.
No gameplay systems were added or modified.

## Target

Expanded:

`ATLAS_ASSET_RECIPE_RESOLVER_001`

Purpose:

Increase deterministic recipe coverage for civic, sports, transport, natural, and industrial object types already flowing through Atlas.

## Files Changed

- `asset-factory/atlas-asset-recipe-resolver.mjs`
- `tests/asset-factory-atlas-asset-recipe-resolver.test.mjs`

## File Created

- `GROWGO_SESSION_135_ATLAS_REAL_WORLD_OBJECT_RECIPE_EXPANSION.md`

## Recipes Added Or Updated

### Civic

- `SCHOOL_RECIPE_001`
- `LIBRARY_RECIPE_001`
- `COMMUNITY_BUILDING_RECIPE_001`

### Sports

- `SPORTS_OVAL_RECIPE_001`
- `RECREATION_AREA_RECIPE_001`

### Transport

- `RAILWAY_STATION_RECIPE_001`
- `FERRY_TERMINAL_RECIPE_001`
- `BUS_STOP_RECIPE_001`

### Natural

- `BEACH_RECIPE_001`
- `RESERVE_RECIPE_001`
- `FOREST_RECIPE_001`

### Industrial

- `WAREHOUSE_RECIPE_001`
- `INDUSTRIAL_BUILDING_RECIPE_001`

## Mapping Expansion

The resolver now assigns explicit recipe records for:

- civic:
  `LIBRARY`, `SCHOOL`, `COMMUNITY_BUILDING`
- sports:
  `OVAL`, `RECREATION_AREA`
- transport:
  `RAILWAY_STATION`, `FERRY_TERMINAL`, `BUS_STOP`
- natural:
  `BEACH`, `RESERVE`, `FOREST`
- industrial:
  `WAREHOUSE`, `INDUSTRIAL_BUILDING`

This replaces reliance on older generic identifiers for several object groups and removes generic fallback behaviour for `BEACH` and `FOREST`.

## Assignment Contract Update

`ATLAS_ASSET_ASSIGNMENTS_001` now includes:

- object ID
- object type
- classification
- recipe ID
- asset family
- variant rules
- LOD rules

This keeps recipe assignment traceable back to the existing Atlas classification result while preserving source geometry references.

## Validation

Updated:

`ATLAS_ASSET_ASSIGNMENT_VALIDATION_001`

Checks:

- recipe exists
- classification compatibility
- deterministic assignment
- geometry preserved

Validation now accepts both existing `RECIPE_...` identifiers and explicit `..._RECIPE_001` identifiers used by this expanded contract.

## Testing

Added or updated tests for:

- civic recipe assignment
- sports recipe assignment
- transport recipe assignment
- natural recipe assignment
- industrial recipe assignment
- deterministic output

Focused resolver test result:

- `10/10` passing

Regression slice:

- `tests/asset-factory-atlas-object-coverage-test.test.mjs`
- `tests/asset-factory-atlas-environment-preview.test.mjs`

Regression result:

- `16/16` passing

## Readiness

Atlas now has broader deterministic recipe coverage for real-world civic, sports, transport, natural, and industrial objects.

This is ready for future Asset Factory pack creation and wider Atlas real-world package consumption.
