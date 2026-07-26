# GrowGo Session 48 - Deterministic 24 Lot Suburban Street Block Generator

## Session Scope

This session implements the first executable deterministic generator for:

- `SUBURBAN_STREET_BLOCK_001_PREVIEW_001`

Purpose:

- first executable `24` lot suburban street block generator

This session is procedural data generation only.

This session does not:

- create Blender assets
- create GLB exports
- create 3D street scenes
- create new buildings
- create new modules
- modify registered assets
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## 1. Source of Truth

This generator implementation is based on:

- `GROWGO_SESSION_47_MACHINE_READABLE_SUBURBAN_STREET_BLOCK_CONTRACT.md`
- `GROWGO_SESSION_46_SUBURBAN_STREET_BLOCK_EXPANSION_FOUNDATION.md`
- `GROWGO_SESSION_37_DETERMINISTIC_SUBURBAN_PREVIEW_GENERATOR.md`
- existing Asset Factory generator patterns

## 2. Generator Implementation

Implemented:

- `asset-factory/suburban-street-block-generator.mjs`

The generator accepts:

- `streetBlockSeed`
- `regionSeed`
- `neighbourhoodThemeSeed`
- `lotCount`
- `blockConfiguration`

Default controlled input:

```json
{
  "streetBlockSeed": 10482,
  "regionSeed": 1,
  "neighbourhoodThemeSeed": "SUBURBAN_AUSTRALIA",
  "lotCount": 24
}
```

## 3. Generated Street Block Output

Created generated outputs:

- `asset-factory-workspace/procedural-previews/SUBURBAN_STREET_BLOCK_001_PREVIEW_001.json`
- `asset-factory-workspace/procedural-previews/SUBURBAN_STREET_BLOCK_001_PREVIEW_VALIDATION_001.json`

The first controlled output includes:

- `24` lots
- `7` road nodes
- `6` road segments
- `3` intersections
- `24` building placements
- `69` street feature placements

## 4. Road Graph Summary

The first executable road graph supports:

- straight collector segments
- a four-way intersection anchor
- a T intersection anchor
- a cul-de-sac branch
- connected local street structure

Resolved graph counts:

- `ROAD_NODE_INSTANCE_001`: `7`
- `ROAD_SEGMENT_INSTANCE_001`: `6`
- `ROAD_INTERSECTION_INSTANCE_001`: `3`

## 5. Lot and Building Summary

The generator resolves:

- `24` lots using `LOT_SUBURBAN_BLOCK_001`
- deterministic setbacks
- deterministic driveway side resolution
- deterministic frontage-road assignment
- deterministic fence rule and landscaping zone data

Resolved building mix for the default seed:

- `BUILDING_HOUSE_SUBURBAN_BRICK_001`: `12`
- `BUILDING_HOUSE_COASTAL_COTTAGE_001`: `8`
- `BUILDING_HOUSE_BEACH_BUNGALOW_001`: `4`

Supported building pool remains:

- `BUILDING_HOUSE_SUBURBAN_BRICK_001`
- `BUILDING_HOUSE_COASTAL_COTTAGE_001`
- `BUILDING_HOUSE_BEACH_BUNGALOW_001`

Resolver behavior includes:

- suburban weighting
- deterministic street-aware selection
- duplicate prevention on shared street edges
- corner-lot variation metadata
- deterministic rebalance toward suburban dominance

## 6. Street Feature Summary

Generated `STREET_FEATURE_INSTANCE_001` placements include:

- sidewalks
- grass verges
- street trees
- street signs

The first implementation also records frontage mailbox preview anchors as street-feature placements for lot-edge continuity.

Resolved street feature count:

- `69`

## 7. Validation Results

Validation output:

- `SUBURBAN_STREET_BLOCK_001_PREVIEW_VALIDATION_001`

Current validation status:

- `roadConnectivityValid`: `PASS`
- `intersectionValidity`: `PASS`
- `allLotsGenerated`: `PASS`
- `lotBoundaryValidity`: `PASS`
- `lotFrontageValidity`: `PASS`
- `validBuildingIds`: `PASS`
- `buildingPlacementValidity`: `PASS`
- `drivewayConnectionValidity`: `PASS`
- `streetFeatureContainmentValidity`: `PASS`
- `deterministicRebuildValidity`: `PASS`

Overall result:

- `validationPassed: true`

## 8. Focused Test Coverage

Added:

- `tests/asset-factory-suburban-street-block-generator.test.mjs`

Focused tests verify:

- `24` lots are generated
- same seed produces identical output
- different seed produces variation
- supported building IDs only
- valid road graph
- validation passes
- checked-in preview and validation outputs match the generator

Test run result:

- `5 / 5` focused tests passed

## 9. Files Created

Created:

- `asset-factory/suburban-street-block-generator.mjs`
- `tests/asset-factory-suburban-street-block-generator.test.mjs`
- `asset-factory-workspace/procedural-previews/SUBURBAN_STREET_BLOCK_001_PREVIEW_001.json`
- `asset-factory-workspace/procedural-previews/SUBURBAN_STREET_BLOCK_001_PREVIEW_VALIDATION_001.json`
- `GROWGO_SESSION_48_DETERMINISTIC_24_LOT_SUBURBAN_STREET_BLOCK_GENERATOR.md`

## 10. Readiness

Status:

- `READY FOR VISUAL PREVIEW INTEGRATION`

Meaning:

- the machine-readable `24` lot street block contract now has a working deterministic generator
- the generated block and validation output are reproducible
- the next recommended step is a preview adapter or consumer layer that can inspect the street block visually without changing generator rules
