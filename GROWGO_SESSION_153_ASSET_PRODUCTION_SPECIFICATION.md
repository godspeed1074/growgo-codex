# GROWGO SESSION 153 — FIRST ASSET PRODUCTION BATCH SPECIFICATION

## Summary

Created `ASSET_PRODUCTION_SPECIFICATION_LAYER_001`, which converts the first approved production batch into detailed asset work packages ready for actual authoring planning.

This pass focuses on:

- batch-to-specification conversion
- work ordering
- dependency-aware asset packaging
- deterministic validation

No final models were created.
No renderer changes were made.
No gameplay changes were made.

## Files Changed

- `asset-factory/asset-production-specification.mjs`
- `tests/asset-factory-asset-production-specification.test.mjs`
- `GROWGO_SESSION_153_ASSET_PRODUCTION_SPECIFICATION.md`

## Target System

Created:

- `ASSET_PRODUCTION_SPECIFICATION_LAYER_001`

Output:

- `ASSET_PRODUCTION_SPECIFICATION_001`
- `ASSET_PRODUCTION_SPECIFICATION_VALIDATION_001`

## Input

Consumed:

- `ASSET_PRODUCTION_BATCH_001`

Focused batch:

- `CIVIC_LOCATION_BATCH_001`

## Batch Conversion Result

The civic batch now resolves into explicit asset work packages for:

- sports pavilion
- civic school anchor
- transport/arrival infrastructure
- supporting park greenery
- fencing and frontage detail

This covers the requested first-batch scope:

- sports pavilion
- sports field details
- fencing
- supporting nature assets
- civic environment pieces

## Work Order

Defined work order:

### `FOUNDATION_ASSETS`

- `BUILDING_CIVIC_SPORTS_PAVILION_001`
- `BUILDING_CIVIC_SCHOOL_PRIMARY_001`

### `SUPPORTING_ASSETS`

- `TRANSPORT_ROAD_INFRASTRUCTURE_STANDARD_001`
- `PARK_TREATMENT_GREENERY_SET_001`

### `DETAIL_ASSETS`

- `RESIDENTIAL_DETAIL_GARDEN_SET_001`

This ordering keeps anchor civic structures first, then access and environment support, then small boundary/frontage detail last.

## Asset Specifications

### `BUILDING_CIVIC_SPORTS_PAVILION_001`

- recipe: `SPORTS_FACILITY_RECIPE_001`
- stage: `FOUNDATION_ASSETS`
- variants:
  - `sports_pavilion`
  - `changing_rooms`
  - `recreation_building`
- LOD:
  - `LOD_CLOSE`
  - `LOD_GAMEPLAY`
  - `LOD_MAP`
- performance budget:
  - polygon: `medium`
  - material: `shared_civic_material`
  - instance friendly: `false`

### `BUILDING_CIVIC_SCHOOL_PRIMARY_001`

- recipe: `SCHOOL_RECIPE_001`
- stage: `FOUNDATION_ASSETS`
- variants:
  - `primary_school`
  - `secondary_school`
  - `small_rural_school`
- LOD:
  - `LOD_CLOSE`
  - `LOD_GAMEPLAY`
  - `LOD_MAP`
- performance budget:
  - polygon: `medium`
  - material: `shared_civic_material`
  - instance friendly: `false`

### `TRANSPORT_ROAD_INFRASTRUCTURE_STANDARD_001`

- recipe: `ROAD_INFRASTRUCTURE_RECIPE_001`
- stage: `SUPPORTING_ASSETS`
- depends on:
  - `BUILDING_CIVIC_SPORTS_PAVILION_001`
- variants:
  - `sign`
  - `crossing`
  - `traffic_furniture`
  - `street_infrastructure`

### `PARK_TREATMENT_GREENERY_SET_001`

- recipe: `PARK_ENVIRONMENT_RECIPE_001`
- stage: `SUPPORTING_ASSETS`
- depends on:
  - `BUILDING_CIVIC_SPORTS_PAVILION_001`
- variants:
  - `park_landscaping`
  - `garden_edge_treatment`
  - `recreation_greenery`

### `RESIDENTIAL_DETAIL_GARDEN_SET_001`

- recipe: `RESIDENTIAL_GARDEN_RECIPE_001`
- stage: `DETAIL_ASSETS`
- depends on:
  - `TRANSPORT_ROAD_INFRASTRUCTURE_STANDARD_001`
  - `PARK_TREATMENT_GREENERY_SET_001`
- variants:
  - `fence`
  - `garden`
  - `driveway`
  - `mailbox`

## Reuse of Earlier Specification Work

The batch layer reuses the earlier approved school specification from Session 146 for:

- `BUILDING_CIVIC_SCHOOL_PRIMARY_001`

This preserves:

- asset identity
- recipe alignment
- variants
- LOD rules
- performance budget assumptions

New batch-specific work packages were created for the other civic-batch assets where no earlier detailed specification existed.

## Validation

Created:

- `ASSET_PRODUCTION_SPECIFICATION_VALIDATION_001`

Checks passed:

- assets exist
- batch valid
- dependencies valid
- specifications complete
- deterministic ordering

Deterministic specification hash:

- `88ad6e2fcbfb3a207d37671b265b401784f2c3c4b1f18cc3f4c93d4d6e01607b`

## Test Results

Added coverage for:

- batch conversion
- dependency ordering
- specification completeness
- tampered ordering failure
- deterministic output
- explicit validation

Focused test pass completed successfully.

## Readiness

`ASSET_PRODUCTION_SPECIFICATION_LAYER_001` is ready to hand the first production batch into real asset authoring planning with clear asset requirements, dependency-aware work order, preserved registry identity, and deterministic validation.
