# GROWGO SESSION 112 — NATURE ASSET CREATION PASS

Branch:
`feature/growgo-asset-factory-world-expansion`

## Goal

Create the first production-ready GrowGo nature assets using `NATURE_ASSET_PACK_001` definitions.

## Scope Outcome

Updated:

- [asset-registry.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/asset-registry.mjs)

Created:

- [nature-asset-creation-pass.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/nature-asset-creation-pass.mjs)
- [asset-factory-nature-asset-creation-pass.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/asset-factory-nature-asset-creation-pass.test.mjs)

This session does not:

- create final world scenes
- modify renderer
- modify gameplay
- import OSM

## Assets Created

The first nature asset creation pass now defines a complete five-asset set:

- `TREE_EUCALYPTUS_001`
- `TREE_COASTAL_001`
- `BUSH_NATIVE_001`
- `GROUND_COASTAL_GRASS_001`
- `ROCK_COASTAL_001`

These assets now exist as validated Asset Factory creation definitions with:

- permanent asset IDs
- Modular Bible entry IDs
- polygon budgets
- material and texture budgets
- LOD rules
- Atlas compatibility
- biome compatibility
- preview metadata

## Asset Status

### Prototype-backed existing assets

The following assets are now carried forward as validated prototype-backed nature assets:

- `TREE_EUCALYPTUS_001`
- `GROUND_COASTAL_GRASS_001`

These continue to reference their existing prototype package work and production-facing export contracts.

### First-pass creation definitions

The following assets now have complete first-pass production-ready metadata and validation definitions:

- `TREE_COASTAL_001`
- `BUSH_NATIVE_001`
- `ROCK_COASTAL_001`

These are ready for later model-authoring passes without needing a second naming or budget pass.

## Budgets

### `TREE_EUCALYPTUS_001`

- polygon budget:
  - close: `240`
  - gameplay: `160`
  - map: `72`
  - distant silhouette: `24`
- material budget:
  - shared materials: `3`
  - unique textures allowed: `0`

### `TREE_COASTAL_001`

- polygon budget:
  - close: `220`
  - gameplay: `144`
  - map: `64`
  - distant silhouette: `20`
- material budget:
  - shared materials: `3`
  - unique textures allowed: `0`

### `BUSH_NATIVE_001`

- polygon budget:
  - close: `96`
  - gameplay: `64`
  - map: `28`
  - distant silhouette: `12`
- material budget:
  - shared materials: `2`
  - unique textures allowed: `0`

### `GROUND_COASTAL_GRASS_001`

- polygon budget:
  - close: `160`
  - gameplay: `96`
  - map: `48`
  - distant silhouette: `12`
- material budget:
  - shared materials: `2`
  - unique textures allowed: `0`

### `ROCK_COASTAL_001`

- polygon budget:
  - close: `128`
  - gameplay: `84`
  - map: `40`
  - distant silhouette: `14`
- material budget:
  - shared materials: `2`
  - unique textures allowed: `0`

## LOD Rules

Supported LOD patterns now include:

- `LOD_CLOSE`
- `LOD_GAMEPLAY`
- `LOD_MAP`
- `LOD_DISTANT_SILHOUETTE`

Asset coverage:

- four-tier LOD:
  - `TREE_EUCALYPTUS_001`
  - `TREE_COASTAL_001`
  - `GROUND_COASTAL_GRASS_001`

- lightweight three-tier LOD:
  - `BUSH_NATIVE_001`
  - `ROCK_COASTAL_001`

## Atlas Compatibility

Each asset now records Atlas-facing placement roles.

Examples:

- `TREE_EUCALYPTUS_001`
  - park tree
  - coastal tree
  - street tree

- `TREE_COASTAL_001`
  - foreshore tree
  - coastal street tree
  - park tree

- `BUSH_NATIVE_001`
  - garden fill
  - park border
  - coastal shrub

- `GROUND_COASTAL_GRASS_001`
  - park ground
  - verge ground
  - coastal ground

- `ROCK_COASTAL_001`
  - cliff edge
  - beach edge
  - river edge

## Biome Compatibility

Defined biome support now includes:

- `COASTAL`
- `FORESHORE_PARKLAND`
- `SUBURBAN_PARKLAND`
- `URBAN_STREET`
- `SUBURBAN_GARDEN`
- `TEMPERATE_FOREST_EDGE`
- `TEMPERATE_GRASSLAND`
- `RIVER_CORRIDOR`
- `CLIFF_EDGE`

## Validation

Created:

- `NATURE_ASSET_CREATION_VALIDATION_001`

Checks now include:

- assets have IDs
- metadata complete
- LOD defined
- Atlas compatible
- performance budget valid

The creation pass also verifies existing prototype-backed assets:

- `TREE_EUCALYPTUS_001`
- `GROUND_COASTAL_GRASS_001`

## Validation Results

Verified:

- `tests/asset-factory-nature-asset-creation-pass.test.mjs`
  - `7 / 7` passing

- `tests/asset-factory-asset-registry.test.mjs`
  - `13 / 13` passing

- `tests/asset-factory-tree-eucalyptus-prototype-asset-package.test.mjs`
  - `4 / 4` passing

- `tests/asset-factory-ground-coastal-grass-prototype-asset-package.test.mjs`
  - `4 / 4` passing

## Files Changed

- [asset-registry.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/asset-registry.mjs)

## Files Created

- [nature-asset-creation-pass.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/nature-asset-creation-pass.mjs)
- [asset-factory-nature-asset-creation-pass.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/asset-factory-nature-asset-creation-pass.test.mjs)
- [GROWGO_SESSION_112_NATURE_ASSET_CREATION_PASS.md](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_112_NATURE_ASSET_CREATION_PASS.md)

## Readiness

This pass is ready for Atlas environment testing.

The Asset Factory now has a lightweight, mobile-friendly, papercut-2.5D nature asset set with shared-material constraints, LOD rules, biome metadata, and deterministic validation, while keeping authoritative real-world geography separate from visual treatment.
