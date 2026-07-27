# GROWGO SESSION 136 — ASSET FACTORY PACK EXPANSION FOUNDATION

## Summary

Session 136 creates the next Asset Factory expansion planning layer based on current Atlas recipe demand.

Atlas decides:

- what object exists
- where it exists
- what recipe it needs

Asset Factory provides:

- reusable assets
- variants
- LODs
- materials

This session does not:

- create models
- modify renderer
- modify gameplay
- import OSM

## Target

Created:

`ASSET_FACTORY_PACK_PRIORITY_SYSTEM_001`

Purpose:

Track which asset families have the highest current Atlas demand and identify which packs should move into future creation phases first.

## Files Created

- `asset-factory/asset-pack-priority.mjs`
- `tests/asset-factory-asset-pack-priority.test.mjs`
- `GROWGO_SESSION_136_ASSET_FACTORY_PACK_EXPANSION_FOUNDATION.md`

## Priority Packs

The priority system now defines:

### `ROAD_AND_STREET_PACK_001`

Includes:

- roads
- sidewalks
- crossings
- street lights
- signs
- street furniture

### `RESIDENTIAL_PACK_001`

Includes:

- houses
- townhouses
- apartments
- gardens
- fences

### `COMMERCIAL_PACK_001`

Includes:

- bakery
- cafe
- restaurant
- petrol station
- shops

### `CIVIC_PACK_001`

Includes:

- schools
- libraries
- community buildings
- sports facilities

### `TRANSPORT_PACK_001`

Includes:

- railway
- stations
- buses
- boats

## Priority Logic

Each pack record now includes:

- pack ID
- priority score
- Atlas demand sources
- recipe dependencies
- estimated reuse value

Priority is computed deterministically from:

- unmet Atlas-facing recipe demand
- number of Atlas demand sources
- estimated reuse value
- existing recipe coverage already available through the current registry

This means the ranking reflects both:

1. what Atlas is already asking for, and
2. where Asset Factory coverage is still thin.

## Current Ordering

Current highest-priority order:

1. `CIVIC_PACK_001`
2. `TRANSPORT_PACK_001`
3. `ROAD_AND_STREET_PACK_001`
4. `COMMERCIAL_PACK_001`
5. `RESIDENTIAL_PACK_001`

Reasoning:

- civic rises first because Atlas now has direct demand for school, library, community, and sports recipes with no onboarded direct asset coverage yet
- transport follows because railway, ferry, and bus-stop demand exists but current coverage is still mostly route-level
- road and street remains high because route demand is broad and street-scene reuse is expected to be strong
- commercial remains important but has partial existing coverage through the current shop and hospitality onboarding
- residential stays valuable but has the strongest current direct coverage of the defined packs

## Validation

Created:

`ASSET_FACTORY_PACK_PRIORITY_VALIDATION_001`

Checks:

- pack IDs unique
- recipe links valid
- priorities deterministic

The system also produces a deterministic priority hash so pack rankings stay stable for the same recipe-demand state.

## Tests

Added tests for:

- pack lookup
- priority ordering
- recipe dependency validation
- deterministic output
- explicit priority validation

## Validation Results

Verified:

- `tests/asset-factory-asset-pack-priority.test.mjs`
  - `5 / 5` passing

Regression slice:

- `tests/asset-factory-asset-registry.test.mjs`
  - `13 / 13` passing
- `tests/asset-factory-atlas-asset-recipe-resolver.test.mjs`
  - `10 / 10` passing

## Readiness

`ASSET_FACTORY_PACK_PRIORITY_SYSTEM_001` is ready for future asset creation phases.

Asset Factory now has a deterministic planning layer that can justify which packs should expand next based on real Atlas recipe demand rather than ad hoc ordering.
