# GROWGO SESSION 138 — TRANSPORT ASSET PACK FOUNDATION

## Summary

Session 138 creates the Asset Factory foundation for transport assets required by Atlas recipes.

Real-world data remains authoritative for:

- transport location
- routes
- station position
- road and rail geometry

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

`TRANSPORT_ASSET_PACK_001`

Purpose:

Provide deterministic registry support, recipes, metadata, and validation for transport assets needed by Atlas-facing railway, ferry, bus-stop, and road-infrastructure assignment demand.

## Files Changed

- `asset-factory/asset-registry.mjs`
- `tests/asset-factory-asset-registry.test.mjs`
- `tests/asset-factory-asset-pack-priority.test.mjs`

## Files Created

- `GROWGO_SESSION_138_TRANSPORT_ASSET_PACK_FOUNDATION.md`

## Transport Asset Families

The registry now supports:

### `RAIL_ASSET_FAMILY_001`

Foundation coverage includes:

- railway track
- station platform
- station buildings
- rail infrastructure

Registered foundation entry:

- `TRANSPORT_RAILWAY_STATION_PLATFORM_001`

### `BUS_ASSET_FAMILY_001`

Foundation coverage includes:

- bus stop
- shelter
- bus-related street objects

Registered foundation entry:

- `TRANSPORT_BUS_STOP_SHELTER_001`

### `FERRY_ASSET_FAMILY_001`

Foundation coverage includes:

- ferry terminal
- pier
- marina elements

Registered foundation entry:

- `TRANSPORT_FERRY_TERMINAL_PIER_001`

### `ROAD_INFRASTRUCTURE_ASSET_FAMILY_001`

Foundation coverage includes:

- signs
- crossings
- traffic furniture
- street infrastructure

Registered foundation entry:

- `TRANSPORT_ROAD_INFRASTRUCTURE_STANDARD_001`

## Asset Metadata

Each transport entry now includes:

- asset ID
- recipe ID
- asset family
- usage rules
- LOD rules
- Atlas compatibility
- footprint compatibility

Footprint compatibility is now recorded explicitly for transport entries such as:

- `LINEAR_PLATFORM_FOOTPRINT`
- `RAIL_CORRIDOR_EDGE`
- `KERB_EDGE_FOOTPRINT`
- `WATERFRONT_EDGE_FOOTPRINT`
- `ROAD_EDGE_FOOTPRINT`
- `CROSSING_NODE_FOOTPRINT`

This keeps transport presentation compatible with real-world routes, station positions, and street-edge placements without changing authoritative geometry.

## Recipes

Created transport pack recipe definitions for:

- `RAILWAY_STATION_RECIPE_001`
- `FERRY_TERMINAL_RECIPE_001`
- `BUS_STOP_RECIPE_001`
- `ROAD_INFRASTRUCTURE_RECIPE_001`

Atlas bridge support is also recorded through transport asset compatibility metadata:

- `RAILWAY_STATION_RECIPE_001`
- `FERRY_TERMINAL_RECIPE_001`
- `BUS_STOP_RECIPE_001`
- `ROAD_INFRASTRUCTURE_RECIPE_001`
- `RECIPE_TRANSPORT_ROUTE_STANDARD_001`

This allows the road infrastructure family to support both dedicated infrastructure treatment and Atlas route-level transport presentation demand.

## Registry Support

`ASSET_FACTORY_REGISTRY_LAYER_001` now includes transport foundation records by default.

The registry supports:

- transport asset ID lookup
- transport recipe lookup
- family lookup
- Atlas assignment compatibility

`TRANSPORT_ASSET_PACK_001` additionally provides:

- pack-level family listing
- pack recipe lookup
- deterministic transport pack validation

## Validation

Created:

`TRANSPORT_ASSET_PACK_VALIDATION_001`

Checks:

- unique IDs
- recipe exists
- Atlas compatibility
- footprint compatibility
- deterministic lookup

The registry-level deterministic validation remains active alongside the transport pack validation.

## Testing

Added tests for:

- railway lookup
- ferry lookup
- bus stop lookup
- infrastructure lookup
- recipe lookup
- deterministic output
- explicit transport pack validation

## Validation Results

Verified:

- `tests/asset-factory-asset-registry.test.mjs`
  - `27 / 27` passing

Regression slice:

- `tests/asset-factory-atlas-asset-recipe-resolver.test.mjs`
  - `10 / 10` passing
- `tests/asset-factory-asset-pack-priority.test.mjs`
  - `5 / 5` passing

## Planning Feedback

Because transport assets are now represented in the registry, transport demand is no longer treated as the largest uncovered planning gap by the pack-priority system.

The current ordering now shifts toward:

1. `ROAD_AND_STREET_PACK_001`
2. `COMMERCIAL_PACK_001`
3. `TRANSPORT_PACK_001`
4. `CIVIC_PACK_001`
5. `RESIDENTIAL_PACK_001`

That is the expected result for a deterministic demand-driven planning layer reacting to new coverage.

## Readiness

`TRANSPORT_ASSET_PACK_001` is ready for future transport asset creation.

Asset Factory now has a deterministic transport foundation that supports Atlas recipe demand while preserving authoritative real-world route and placement truth.
