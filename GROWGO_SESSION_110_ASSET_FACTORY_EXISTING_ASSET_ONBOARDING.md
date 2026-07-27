# GROWGO SESSION 110 — ASSET FACTORY EXISTING ASSET ONBOARDING

Branch:
`feature/growgo-asset-factory-world-expansion`

## Goal

Create the Asset Factory onboarding layer for existing GrowGo assets so they can be registered, referenced, and resolved by Atlas.

## Scope Outcome

Updated:

- `ASSET_FACTORY_REGISTRY_LAYER_001`
- `ASSET_REGISTRY_VALIDATION_001`
- [asset-registry.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/asset-registry.mjs)

Created:

- [asset-factory-asset-registry.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/asset-factory-asset-registry.test.mjs)

This session does not:

- create new asset models
- modify renderer
- modify gameplay
- import OSM

## Registered Assets

The onboarding layer now registers existing GrowGo work as permanent Asset Factory entries.

### Residential House

- `BUILDING_RESIDENTIAL_SUBURBAN_001`
- asset family: `FAMILY_BUILDING_RESIDENTIAL_HOUSE`
- asset type: `RESIDENTIAL_HOUSE`
- recipe: `RECIPE_BUILDING_RESIDENTIAL_HOUSE_STANDARD_001`
- source work preserved:
  - `BUILDING_HOUSE_SUBURBAN_BRICK_001`
  - `RECIPE_HOUSE_SUBURBAN_BRICK_001`

### Commercial Shop

- `BUILDING_COMMERCIAL_SMALL_SHOP_001`
- asset family: `FAMILY_BUILDING_COMMERCIAL_SMALL_SHOP`
- asset type: `SMALL_SHOP`
- recipe: `BUILDING_SHOP_GENERAL_RECIPE_001`
- source work preserved:
  - `BUILDING_SHOP_GENERAL_001`
  - `BUILDING_BAKERY_SMALL_TOWN_001`
  - `BUILDING_CAFE_COASTAL_001`

## Metadata Structure

Each onboarded asset record now includes:

- asset ID
- asset family
- asset type
- recipe ID
- version
- LOD rules
- usage rules
- Atlas compatibility
- onboarding metadata

Atlas compatibility metadata records:

- supported object types
- supported classifications
- Atlas-facing recipe IDs
- assignment mode

## Recipe Linking

The registry now supports:

Asset

↓

Recipe

↓

Atlas assignment resolution

Available lookups include:

- asset ID lookup
- recipe ID lookup
- family listing
- Atlas assignment resolution

## Validation

`ASSET_REGISTRY_VALIDATION_001` now checks:

- unique IDs
- recipe exists
- version exists
- Atlas compatibility validity
- deterministic lookup

The registry also produces a deterministic registry hash for stable reuse.

## Tests Added

- house lookup
- shop lookup
- recipe lookup
- Atlas assignment resolution
- invalid asset handling
- deterministic registry output
- explicit registry validation

## Files Changed

- [asset-registry.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/asset-registry.mjs)

## Files Created

- [asset-factory-asset-registry.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/asset-factory-asset-registry.test.mjs)
- [GROWGO_SESSION_110_ASSET_FACTORY_EXISTING_ASSET_ONBOARDING.md](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_110_ASSET_FACTORY_EXISTING_ASSET_ONBOARDING.md)

## Validation Results

Verified:

- `tests/asset-factory-asset-registry.test.mjs`
  - 7 / 7 passing

- `tests/asset-factory-atlas-asset-recipe-resolver.test.mjs`
  - 7 / 7 passing

## Readiness

`ASSET_FACTORY_REGISTRY_LAYER_001` is ready for future asset pack expansion.

Existing GrowGo asset work is now onboarded into a deterministic Asset Factory registry layer without duplicating models, losing provenance, or breaking Atlas recipe resolution.
