# GROWGO SESSION 152 — FIRST PRODUCTION ASSET BATCH PLANNING

## Summary

Created `ASSET_PRODUCTION_BATCH_LAYER_001`, a deterministic planning layer that groups high-value queue items into practical first production batches instead of treating assets as isolated work.

This session adds batch planning, validation, and tests only.

No final models were created.
No renderer work was changed.
No gameplay work was changed.

## Files Changed

- `asset-factory/asset-production-batch.mjs`
- `tests/asset-factory-asset-production-batch.test.mjs`
- `GROWGO_SESSION_152_ASSET_PRODUCTION_BATCH_PLANNING.md`

## Target System

Created:

- `ASSET_PRODUCTION_BATCH_LAYER_001`

Output:

- `ASSET_PRODUCTION_BATCH_001`
- `ASSET_PRODUCTION_BATCH_VALIDATION_001`

## Batch Grouping Logic

Batches are grouped from the production queue using four planning signals:

- Atlas demand alignment
- environment completeness
- reuse potential
- dependency relationships

The goal is to create batches that can form usable scene fragments early:

- civic/recreation locations
- coastal destinations
- town main street environments

## Production Batches

### 1. `CIVIC_LOCATION_BATCH_001`

Recommended order:

- `1`

Batch priority score:

- `70`

Expected reuse:

- `99`
- `VERY_HIGH`

Assets:

- `BUILDING_CIVIC_SPORTS_PAVILION_001`
- `BUILDING_CIVIC_SCHOOL_PRIMARY_001`
- `TRANSPORT_ROAD_INFRASTRUCTURE_STANDARD_001`
- `PARK_TREATMENT_GREENERY_SET_001`
- `RESIDENTIAL_DETAIL_GARDEN_SET_001`

Purpose:

- build a reusable civic and recreation location group
- cover pavilion anchor, access support, surrounding greenery, and fence-capable detail

Dependencies:

- anchor asset: `BUILDING_CIVIC_SPORTS_PAVILION_001`
- access support: `TRANSPORT_ROAD_INFRASTRUCTURE_STANDARD_001`
- landscape support: `PARK_TREATMENT_GREENERY_SET_001`
- boundary support: `RESIDENTIAL_DETAIL_GARDEN_SET_001`

### 2. `TOWN_MAIN_STREET_BATCH_001`

Recommended order:

- `2`

Batch priority score:

- `67`

Expected reuse:

- `96`
- `VERY_HIGH`

Assets:

- `BUILDING_COMMERCIAL_SMALL_SHOP_001`
- `BUILDING_COMMERCIAL_BAKERY_SMALL_001`
- `BUILDING_COMMERCIAL_RETAIL_SHOP_001`
- `ROAD_SURFACE_RESIDENTIAL_STREET_001`
- `SIDEWALK_CURB_CROSSING_001`
- `STREET_FURNITURE_STANDARD_SET_001`
- `ROAD_DETAIL_MARKING_SET_001`

Purpose:

- create a first complete main street production group
- combine shops, road structure, pedestrian edge treatment, and street detail

Dependencies:

- anchor asset: `ROAD_SURFACE_RESIDENTIAL_STREET_001`
- public realm support: `SIDEWALK_CURB_CROSSING_001`
- public realm support: `STREET_FURNITURE_STANDARD_SET_001`

### 3. `COASTAL_LOCATION_BATCH_001`

Recommended order:

- `3`

Batch priority score:

- `60`

Expected reuse:

- `94`
- `VERY_HIGH`

Assets:

- `GROUND_BEACH_SAND_001`
- `TREE_COASTAL_001`
- `ROCK_COASTAL_001`
- `BUILDING_RESIDENTIAL_HOUSE_COASTAL_001`
- `BUILDING_COMMERCIAL_CAFE_COASTAL_001`

Purpose:

- create a first coastal destination batch
- combine beach treatment, coastal vegetation, rock edge treatment, and coastal buildings

Dependencies:

- shoreline anchor: `GROUND_BEACH_SAND_001`
- environment support: `TREE_COASTAL_001`
- environment support: `ROCK_COASTAL_001`

## Batch Interpretation

The first planning pass intentionally favors grouped scene usefulness:

- civic batch first because it closes multiple shallow-but-important family gaps in one location-ready set
- main street batch second because it creates a high-reuse urban/town composition kit
- coastal batch third because it builds a clear foreshore identity set with strong environment value

This means the first production pass can create coherent places earlier, not just isolated objects.

## Validation

Created:

- `ASSET_PRODUCTION_BATCH_VALIDATION_001`

Checks passed:

- assets exist
- dependencies valid
- no duplicate batch entries
- deterministic ordering

Deterministic batch hash:

- `bc98021abf75ab6887945983fd72b82b00ced6203dc2331e61a9aad9dc427947`

## Test Results

Added coverage for:

- batch creation
- dependency validation
- duplicate protection
- deterministic output
- explicit validation

Focused test pass completed successfully.

## Readiness

`ASSET_PRODUCTION_BATCH_LAYER_001` is ready to drive the first grouped asset authoring wave by turning queue priorities into scene-useful production batches with deterministic validation and clear dependency structure.
