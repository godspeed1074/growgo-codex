# GROWGO SESSION 141 — RESIDENTIAL ASSET PACK FOUNDATION

## Summary

Session 141 creates the Asset Factory foundation for residential assets required by Atlas recipes.

Real-world data remains authoritative for:

- building footprint
- location
- residential classification

Asset Factory provides:

- reusable house assets
- variants
- LOD rules

This session does not:

- create final models
- modify renderer
- modify gameplay
- import OSM

## Target

Created:

`RESIDENTIAL_ASSET_PACK_001`

Purpose:

Provide deterministic registry support, recipes, metadata, and validation for detached houses, multi-unit housing, and residential detail assets needed by Atlas-facing residential assignment demand.

## Files Changed

- `asset-factory/asset-registry.mjs`
- `tests/asset-factory-asset-registry.test.mjs`

## Files Created

- `GROWGO_SESSION_141_RESIDENTIAL_ASSET_PACK_FOUNDATION.md`

## Residential Asset Families

The registry now supports:

### `HOUSE_ASSET_FAMILY_001`

Foundation coverage includes:

- suburban house
- coastal house
- rural house
- modern house

Registered foundation entries:

- `BUILDING_RESIDENTIAL_HOUSE_SUBURBAN_001`
- `BUILDING_RESIDENTIAL_HOUSE_COASTAL_001`
- `BUILDING_RESIDENTIAL_HOUSE_RURAL_001`

### `MULTI_UNIT_ASSET_FAMILY_001`

Foundation coverage includes:

- townhouse
- apartment
- small units

Registered foundation entries:

- `BUILDING_RESIDENTIAL_MULTI_UNIT_TOWNHOUSE_001`
- `BUILDING_RESIDENTIAL_MULTI_UNIT_APARTMENT_001`

### `RESIDENTIAL_DETAIL_ASSET_FAMILY_001`

Foundation coverage includes:

- fences
- gardens
- driveways
- mailboxes

Registered foundation entry:

- `RESIDENTIAL_DETAIL_GARDEN_SET_001`

## Asset Metadata

Each residential entry now includes:

- asset ID
- recipe ID
- asset family
- usage rules
- LOD rules
- Atlas compatibility
- footprint compatibility

Footprint compatibility is now recorded explicitly for residential entries such as:

- `SUBURBAN_LOT_FOOTPRINT`
- `COASTAL_LOT_FOOTPRINT`
- `RURAL_PARCEL_FOOTPRINT`
- `ROW_HOUSE_FOOTPRINT`
- `APARTMENT_BLOCK_FOOTPRINT`
- `FRONT_YARD_FOOTPRINT`

This keeps residential presentation compatible with real-world dwelling footprints and frontage detail without changing authoritative footprint data.

## Recipes

Created residential pack recipe definitions for:

- `SUBURBAN_HOUSE_RECIPE_001`
- `COASTAL_HOUSE_RECIPE_001`
- `RURAL_HOUSE_RECIPE_001`
- `TOWNHOUSE_RECIPE_001`
- `APARTMENT_RECIPE_001`
- `RESIDENTIAL_GARDEN_RECIPE_001`

Atlas bridge support is also recorded through residential asset compatibility metadata:

- `RECIPE_BUILDING_RESIDENTIAL_HOUSE_STANDARD_001`
- `RECIPE_NATURE_SUBURBAN_GARDEN_STANDARD_001`

This allows the residential pack to support both the new reusable residential recipes and the earlier residential house and garden demand already present in the registry and Atlas flow.

## Existing Asset Relationship

Session 110 already onboarded:

- `BUILDING_RESIDENTIAL_SUBURBAN_001`

Session 141 does not replace that record.

Instead, the residential pack broadens the reusable family coverage around it so future residential creation can support:

- more dwelling identities
- multi-unit housing
- frontage detail systems

while preserving the existing suburban house onboarding trail.

## Registry Support

`ASSET_FACTORY_REGISTRY_LAYER_001` now includes residential foundation records by default.

The registry supports:

- residential asset ID lookup
- residential recipe lookup
- family lookup
- Atlas assignment compatibility

`RESIDENTIAL_ASSET_PACK_001` additionally provides:

- pack-level family listing
- pack recipe lookup
- deterministic residential pack validation

## Validation

Created:

`RESIDENTIAL_ASSET_PACK_VALIDATION_001`

Checks:

- unique IDs
- recipes exist
- Atlas compatibility
- footprint compatibility
- deterministic lookup

The registry-level deterministic validation remains active alongside the residential pack validation.

## Testing

Added tests for:

- house lookup
- townhouse lookup
- apartment lookup
- garden lookup
- recipe lookup
- deterministic output
- explicit residential pack validation

## Validation Results

Verified:

- `tests/asset-factory-asset-registry.test.mjs`
  - `48 / 48` passing

Regression slice:

- `tests/asset-factory-atlas-asset-recipe-resolver.test.mjs`
  - `10 / 10` passing
- `tests/asset-factory-asset-pack-priority.test.mjs`
  - `5 / 5` passing

## Planning Feedback

The broader residential pack does not materially change the current pack-priority ordering.

That is the expected outcome because:

- residential house coverage already had an existing onboarding base from Session 110
- residential garden support already had partial coverage through the nature pack
- the new residential foundation mostly deepens reusable variant coverage rather than opening a brand-new unmet Atlas demand category

The current ordering remains:

1. `CIVIC_PACK_001`
2. `ROAD_AND_STREET_PACK_001`
3. `COMMERCIAL_PACK_001`
4. `RESIDENTIAL_PACK_001`
5. `TRANSPORT_PACK_001`

## Readiness

`RESIDENTIAL_ASSET_PACK_001` is ready for future residential asset creation.

Asset Factory now has a deterministic residential foundation that supports Atlas recipe demand while preserving authoritative real-world dwelling footprint and placement truth.
