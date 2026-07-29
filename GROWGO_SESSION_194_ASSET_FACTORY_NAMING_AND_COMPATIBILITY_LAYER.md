# GrowGo Session 194 — Asset Factory Naming & Compatibility Layer

Date: 2026-07-29  
Branch: `feature/growgo-asset-factory-town-expansion`

## Goal

Create a universal identity and path resolution layer for Asset Factory v1 without changing proven production asset state.

## Created

- `asset-factory/asset-factory-identity-paths.mjs`
- `asset-factory/asset-factory-identity-paths.md`
- `tests/asset-factory-identity-paths.test.mjs`
- `GROWGO_SESSION_194_ASSET_FACTORY_NAMING_AND_COMPATIBILITY_LAYER.md`

## Updated

- `asset-factory/asset-factory-finalize.mjs`
- `tests/asset-factory-finalize-command.test.mjs`

## Coverage

The compatibility layer now resolves:

- canonical asset IDs
- canonical revision IDs
- legacy slug names
- family workspace folders
- version-aware record paths
- lifecycle state from existing catalog and registration records

## Proven assets checked

- `TREE_EUCALYPTUS_001_v001`
- `TREE_BOTTLEBRUSH_001_v002`
- `SHRUB_COASTAL_LOW_001_v002`
- `COASTAL_GRASS_TUSSOCK_001_v001`

## Finalisation improvements

The finalisation command now:

- uses the shared identity/path resolver
- follows compatibility mappings instead of hard-coded slug discovery
- explains blocked readiness checks with expected file paths
- recommends the next required action for missing files

## Safety

- no asset production records were rewritten in the proven real-asset checks
- no GLBs were generated
- no Blender launch was performed
- no publishing or runtime activation paths were added
