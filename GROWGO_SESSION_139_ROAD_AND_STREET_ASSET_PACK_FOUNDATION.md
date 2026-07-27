# GROWGO SESSION 139 — ROAD AND STREET ASSET PACK FOUNDATION

## Summary

Session 139 creates the Asset Factory foundation for road and street assets required by Atlas.

Real-world data remains authoritative for:

- road geometry
- intersections
- paths
- accessibility
- hierarchy

Asset Factory provides:

- visual road pieces
- street details
- variants
- LOD rules

This session does not:

- create final models
- modify renderer
- modify gameplay
- import OSM

## Target

Created:

`ROAD_AND_STREET_ASSET_PACK_001`

Purpose:

Provide deterministic registry support, recipes, metadata, and validation for road-surface, sidewalk, street-furniture, and road-detail assets needed by Atlas-facing route and street-scene demand.

## Files Changed

- `asset-factory/asset-registry.mjs`
- `tests/asset-factory-asset-registry.test.mjs`
- `tests/asset-factory-asset-pack-priority.test.mjs`

## Files Created

- `GROWGO_SESSION_139_ROAD_AND_STREET_ASSET_PACK_FOUNDATION.md`

## Road And Street Asset Families

The registry now supports:

### `ROAD_SURFACE_ASSET_FAMILY_001`

Foundation coverage includes:

- residential roads
- main roads
- paths
- trails
- intersections

Registered foundation entry:

- `ROAD_SURFACE_RESIDENTIAL_STREET_001`

### `SIDEWALK_ASSET_FAMILY_001`

Foundation coverage includes:

- sidewalks
- curbs
- crossings
- ramps

Registered foundation entry:

- `SIDEWALK_CURB_CROSSING_001`

### `STREET_FURNITURE_ASSET_FAMILY_001`

Foundation coverage includes:

- street lights
- signs
- bins
- benches
- mailboxes

Registered foundation entry:

- `STREET_FURNITURE_STANDARD_SET_001`

### `ROAD_DETAIL_ASSET_FAMILY_001`

Foundation coverage includes:

- markings
- lane details
- barriers
- fences

Registered foundation entry:

- `ROAD_DETAIL_MARKING_SET_001`

## Asset Metadata

Each road and street entry now includes:

- asset ID
- recipe ID
- asset family
- usage rules
- LOD rules
- Atlas compatibility
- geometry compatibility

Geometry compatibility is now recorded explicitly for road-facing entries such as:

- `LINEAR_ROAD_GEOMETRY`
- `CURVING_STREET_SEGMENT`
- `EDGE_ALIGNED_GEOMETRY`
- `CROSSING_NODE_GEOMETRY`
- `LANE_CENTERLINE_GEOMETRY`
- `INTERSECTION_SURFACE_GEOMETRY`

This keeps road presentation compatible with real-world route and intersection geometry without changing authoritative map data.

## Recipes

Created road and street pack recipe definitions for:

- `RESIDENTIAL_STREET_RECIPE_001`
- `TOWN_MAIN_ROAD_RECIPE_001`
- `PEDESTRIAN_PATH_RECIPE_001`
- `INTERSECTION_RECIPE_001`
- `STREET_FURNITURE_RECIPE_001`

Atlas bridge support is also recorded through road and street asset compatibility metadata:

- `RESIDENTIAL_STREET_RECIPE_001`
- `TOWN_MAIN_ROAD_RECIPE_001`
- `PEDESTRIAN_PATH_RECIPE_001`
- `INTERSECTION_RECIPE_001`
- `STREET_FURNITURE_RECIPE_001`
- `RECIPE_TRANSPORT_ROUTE_STANDARD_001`
- `ROAD_INFRASTRUCTURE_RECIPE_001`

This allows the pack to support both dedicated road-surface treatment and the broader Atlas route and street-detail presentation path.

## Registry Support

`ASSET_FACTORY_REGISTRY_LAYER_001` now includes road and street foundation records by default.

The registry supports:

- road and street asset ID lookup
- road and street recipe lookup
- family lookup
- Atlas assignment compatibility

`ROAD_AND_STREET_ASSET_PACK_001` additionally provides:

- pack-level family listing
- pack recipe lookup
- deterministic road and street pack validation

## Validation

Created:

`ROAD_AND_STREET_ASSET_PACK_VALIDATION_001`

Checks:

- unique IDs
- recipes exist
- Atlas compatibility
- geometry compatibility
- deterministic lookup

The registry-level deterministic validation remains active alongside the road-and-street pack validation.

## Testing

Added tests for:

- road lookup
- sidewalk lookup
- furniture lookup
- detail lookup
- recipe lookup
- deterministic output
- explicit road and street pack validation

## Validation Results

Verified:

- `tests/asset-factory-asset-registry.test.mjs`
  - `34 / 34` passing

Regression slice:

- `tests/asset-factory-atlas-asset-recipe-resolver.test.mjs`
  - `10 / 10` passing
- `tests/asset-factory-asset-pack-priority.test.mjs`
  - `5 / 5` passing

## Planning Feedback

Because road and street assets are now represented in the registry, road-surface and street-detail demand is no longer treated as the largest uncovered planning gap by the pack-priority system.

The current ordering now shifts toward:

1. `COMMERCIAL_PACK_001`
2. `CIVIC_PACK_001`
3. `ROAD_AND_STREET_PACK_001`
4. `RESIDENTIAL_PACK_001`
5. `TRANSPORT_PACK_001`

That is the expected result for a deterministic demand-driven planning layer reacting to new coverage.

## Readiness

`ROAD_AND_STREET_ASSET_PACK_001` is ready for future road asset creation.

Asset Factory now has a deterministic road-and-street foundation that supports Atlas recipe demand while preserving authoritative real-world route and intersection truth.
