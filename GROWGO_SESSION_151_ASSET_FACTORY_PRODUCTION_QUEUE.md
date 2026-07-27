# GROWGO SESSION 151 — ASSET FACTORY PRODUCTION ASSET QUEUE

## Summary

Created `ASSET_PRODUCTION_QUEUE_LAYER_001`, a deterministic production-priority layer that ranks Asset Factory candidates using:

- Asset registry data
- Atlas recipe demand
- Coverage review signals
- Variant depth gaps
- Pack priority weighting

This session does not create models, renderer work, or gameplay changes.

## Files Changed

- `asset-factory/asset-production-queue.mjs`
- `tests/asset-factory-asset-production-queue.test.mjs`
- `GROWGO_SESSION_151_ASSET_FACTORY_PRODUCTION_QUEUE.md`

## Target System

Created:

- `ASSET_PRODUCTION_QUEUE_LAYER_001`

Output:

- `ASSET_PRODUCTION_QUEUE_001`
- `ASSET_PRODUCTION_QUEUE_VALIDATION_001`

## Scoring System

Each queue entry is scored from five deterministic factors:

- `ATLAS_DEMAND_SCORE`
- `REUSE_SCORE`
- `COVERAGE_GAP_SCORE`
- `VISUAL_IMPACT_SCORE`
- `VARIANT_VALUE_SCORE`

The queue output records:

- asset ID
- pack
- priority score
- demand reason
- reuse value
- recommended order

## Queue Result

Reviewed candidates:

- `34` registered assets

Reviewed packs:

- `6`

Top priority asset:

- `BUILDING_CIVIC_SPORTS_PAVILION_001`

## Top Asset Priorities

1. `BUILDING_CIVIC_SPORTS_PAVILION_001`
   - pack: `CIVIC_ASSET_PACK_001`
   - priority score: `83`
   - reason: civic family depth and strong reuse potential
2. `BUILDING_CIVIC_SCHOOL_PRIMARY_001`
   - pack: `CIVIC_ASSET_PACK_001`
   - priority score: `73`
3. `BUILDING_CIVIC_COMMUNITY_HALL_001`
   - pack: `CIVIC_ASSET_PACK_001`
   - priority score: `71`
4. `BUILDING_CIVIC_LIBRARY_SMALL_001`
   - pack: `CIVIC_ASSET_PACK_001`
   - priority score: `71`
5. `ROAD_SURFACE_RESIDENTIAL_STREET_001`
   - pack: `ROAD_AND_STREET_ASSET_PACK_001`
   - priority score: `71`
6. `BUILDING_COMMERCIAL_SMALL_SHOP_001`
   - pack: `COMMERCIAL_ASSET_PACK_001`
   - priority score: `70`
7. `STREET_FURNITURE_STANDARD_SET_001`
   - pack: `ROAD_AND_STREET_ASSET_PACK_001`
   - priority score: `69`
8. `TRANSPORT_ROAD_INFRASTRUCTURE_STANDARD_001`
   - pack: `TRANSPORT_ASSET_PACK_001`
   - priority score: `67`
9. `FOREST_UNDERGROWTH_SET_001`
   - pack: `NATURE_ASSET_PACK_001`
   - priority score: `67`
10. `GROUND_BEACH_SAND_001`
   - pack: `NATURE_ASSET_PACK_001`
   - priority score: `67`

## Interpretation

The queue currently favors:

- civic assets with shallow family depth but high recipe demand alignment
- road and street assets with strong reuse and visible scene impact
- commercial bridge assets that support multiple Atlas-facing assignments
- nature and transport assets where coverage exists but depth is still thin

This keeps production priority data-driven rather than purely category-driven.

## Validation

Created:

- `ASSET_PRODUCTION_QUEUE_VALIDATION_001`

Checks passed:

- deterministic ordering
- valid asset IDs
- valid priority scores
- no duplicate queue entries

Deterministic queue hash:

- `6710cfee7ea1d8e7d15294c494b590f2cde7ac1de2f489a59309c10146583c19`

## Test Results

Added coverage for:

- queue generation
- priority ordering
- missing asset handling
- deterministic output
- explicit validation

Focused test pass completed successfully.

## Readiness

`ASSET_PRODUCTION_QUEUE_LAYER_001` is ready to drive actual Asset Factory production planning by giving the project a stable, inspectable, and repeatable asset creation order across the current registry.
