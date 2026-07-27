# GROWGO SESSION 140 — COMMERCIAL ASSET PACK FOUNDATION

## Summary

Session 140 creates the Asset Factory foundation for commercial assets required by Atlas recipes.

Real-world data remains authoritative for:

- business location
- business classification
- footprint

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

`COMMERCIAL_ASSET_PACK_001`

Purpose:

Provide deterministic registry support, recipes, metadata, and validation for food, retail, service, and hospitality assets needed by Atlas-facing commercial assignment demand.

## Files Changed

- `asset-factory/asset-registry.mjs`
- `tests/asset-factory-asset-registry.test.mjs`
- `tests/asset-factory-asset-pack-priority.test.mjs`

## Files Created

- `GROWGO_SESSION_140_COMMERCIAL_ASSET_PACK_FOUNDATION.md`

## Commercial Asset Families

The registry now supports:

### `FOOD_BUSINESS_ASSET_FAMILY_001`

Foundation coverage includes:

- bakery
- cafe
- restaurant
- takeaway

Registered foundation entries:

- `BUILDING_COMMERCIAL_BAKERY_SMALL_001`
- `BUILDING_COMMERCIAL_CAFE_COASTAL_001`

### `RETAIL_ASSET_FAMILY_001`

Foundation coverage includes:

- small shop
- convenience store
- specialty store

Registered foundation entry:

- `BUILDING_COMMERCIAL_RETAIL_SHOP_001`

### `SERVICE_ASSET_FAMILY_001`

Foundation coverage includes:

- petrol station
- repair shop
- service buildings

Registered foundation entry:

- `BUILDING_COMMERCIAL_SERVICE_PETROL_001`

### `HOSPITALITY_ASSET_FAMILY_001`

Foundation coverage includes:

- pub
- hotel
- accommodation

Registered foundation entry:

- `BUILDING_COMMERCIAL_HOSPITALITY_INN_001`

## Asset Metadata

Each commercial entry now includes:

- asset ID
- recipe ID
- asset family
- usage rules
- LOD rules
- Atlas compatibility
- footprint compatibility

Footprint compatibility is now recorded explicitly for commercial entries such as:

- `SHOPFRONT_FOOTPRINT`
- `MAIN_STREET_COMMERCIAL_FOOTPRINT`
- `CORNER_CAFE_FOOTPRINT`
- `SERVICE_STATION_FOOTPRINT`
- `FORECOURT_FOOTPRINT`
- `ACCOMMODATION_FOOTPRINT`

This keeps commercial presentation compatible with real-world business placement and frontage patterns without changing authoritative footprint data.

## Recipes

Created commercial pack recipe definitions for:

- `BAKERY_RECIPE_001`
- `CAFE_RECIPE_001`
- `RESTAURANT_RECIPE_001`
- `PETROL_STATION_RECIPE_001`
- `RETAIL_SHOP_RECIPE_001`
- `HOSPITALITY_RECIPE_001`

Atlas bridge support is also recorded through commercial asset compatibility metadata:

- `RECIPE_BUILDING_BAKERY_SMALL_TOWN_001`
- `RECIPE_BUILDING_CAFE_COASTAL_001`
- `RECIPE_BUILDING_FUEL_STATION_STANDARD_001`
- `RECIPE_BUILDING_SHOP_STANDARD_001`
- `BUILDING_SHOP_GENERAL_RECIPE_001`

This allows the commercial pack to support both new reusable commercial recipes and the existing Atlas-facing bakery, cafe, petrol station, and retail recipe demand already present in the resolver.

## Registry Support

`ASSET_FACTORY_REGISTRY_LAYER_001` now includes commercial foundation records by default.

The registry supports:

- commercial asset ID lookup
- commercial recipe lookup
- family lookup
- Atlas assignment compatibility

`COMMERCIAL_ASSET_PACK_001` additionally provides:

- pack-level family listing
- pack recipe lookup
- deterministic commercial pack validation

## Validation

Created:

`COMMERCIAL_ASSET_PACK_VALIDATION_001`

Checks:

- unique IDs
- recipes exist
- Atlas compatibility
- footprint compatibility
- deterministic lookup

The registry-level deterministic validation remains active alongside the commercial pack validation.

## Testing

Added tests for:

- bakery lookup
- cafe lookup
- petrol station lookup
- retail lookup
- recipe lookup
- deterministic output
- explicit commercial pack validation

## Validation Results

Verified:

- `tests/asset-factory-asset-registry.test.mjs`
  - `41 / 41` passing

Regression slice:

- `tests/asset-factory-atlas-asset-recipe-resolver.test.mjs`
  - `10 / 10` passing
- `tests/asset-factory-asset-pack-priority.test.mjs`
  - `5 / 5` passing

## Planning Feedback

Because commercial assets are now represented in the registry, commercial demand is no longer treated as the largest uncovered planning gap by the pack-priority system.

The current ordering now shifts toward:

1. `CIVIC_PACK_001`
2. `ROAD_AND_STREET_PACK_001`
3. `COMMERCIAL_PACK_001`
4. `RESIDENTIAL_PACK_001`
5. `TRANSPORT_PACK_001`

That is the expected result for a deterministic demand-driven planning layer reacting to new coverage.

## Readiness

`COMMERCIAL_ASSET_PACK_001` is ready for future commercial asset creation.

Asset Factory now has a deterministic commercial foundation that supports Atlas recipe demand while preserving authoritative real-world business placement and footprint truth.
