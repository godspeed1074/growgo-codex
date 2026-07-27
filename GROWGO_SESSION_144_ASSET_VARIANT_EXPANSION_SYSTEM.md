# GROWGO SESSION 144 — ASSET FACTORY VARIANT EXPANSION SYSTEM

## Summary

Created `ASSET_VARIANT_SYSTEM_001`, a deterministic presentation-layer variant resolver for Asset Factory records and recipes. The system selects regional, biome, and style-aware variants without changing classification, location, or geometry authority.

## Target

Created:

- `asset-factory/asset-variant-system.mjs`

## Variant System

The resolver supports these environment inputs:

- `biome`
- `climate`
- `regionProfile`
- `environmentType`
- `styleProfile`

It resolves variants against registered Asset Factory entries using deterministic scoring plus compatibility checks.

## Included Examples

### Tree Variant

Base:

- `TREE_EUCALYPTUS_001`

Variants:

- `coastal`
- `urban`
- `forest`

### House Variant

Base:

- `BUILDING_RESIDENTIAL_SUBURBAN_001`

Variants:

- `coastal`
- `rural`
- `suburban`

### Commercial Variant

Base:

- `BAKERY_RECIPE_001`

Variants:

- `town`
- `coastal`
- `urban`

## Output

Created:

- `ASSET_VARIANT_ASSIGNMENT_001`

Each assignment includes:

- asset ID
- selected variant
- reason
- environment context

## Validation

Created:

- `ASSET_VARIANT_VALIDATION_001`

Validation checks:

- variant exists
- base asset exists
- deterministic selection
- compatibility preserved

## Files Changed

- `asset-factory/asset-variant-system.mjs`
- `tests/asset-factory-asset-variant-system.test.mjs`
- `GROWGO_SESSION_144_ASSET_VARIANT_EXPANSION_SYSTEM.md`

## Test Coverage

Added tests for:

- tree variant selection
- house variant selection
- commercial variant selection
- deterministic same-input output
- explicit validation success

## Readiness

`ASSET_VARIANT_SYSTEM_001` is ready to support deeper asset creation passes by giving Atlas-facing assets a reusable presentation variation layer without changing world truth or gameplay ownership.
