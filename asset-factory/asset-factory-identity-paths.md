# Asset Factory Identity & Path Resolver

Status: Asset Factory v1 naming and compatibility layer  
Date: 2026-07-29

## Purpose

Provide one reusable resolver for:

- canonical asset identity
- family and workspace discovery
- lifecycle state lookup
- version-aware record resolution
- legacy compatibility names

without changing existing production asset records.

## Supported identity inputs

- canonical asset ID  
  `COASTAL_GRASS_TUSSOCK_001`
- canonical revision ID  
  `TREE_BOTTLEBRUSH_001_v002`
- compatibility slug  
  `tree-eucalyptus`
- compatibility versioned slug  
  `shrub-coastal-low-v002`

## Resolved identity fields

- `assetId`
- `familyId`
- `assetType`
- `version`
- `lifecycleState`
- `canonicalSlug`

## Resolved folders

- `specification/`
- `source/`
- `export/`
- `validation/`
- `reports/`

## Compatibility behaviour

The resolver prefers canonical Asset Factory v1 paths, but can still locate legacy records when proven assets use older patterns, including:

- unversioned approval files for v001 assets
- legacy export-side validation records
- legacy export-side source blend locations
- manual visual review records used before dedicated visual approval files

## Naming validation

Accepted canonical formats:

- `ASSET_FAMILY_ITEM_001`
- `ASSET_FAMILY_ITEM_001_v001`
- `FAMILY_NAME_FAMILY_001`

Rejected examples:

- lowercase names
- hyphenated names in canonical mode
- names missing the numeric suffix

## Current proven assets

- `TREE_EUCALYPTUS_001_v001`
- `TREE_BOTTLEBRUSH_001_v002`
- `SHRUB_COASTAL_LOW_001_v002`
- `COASTAL_GRASS_TUSSOCK_001_v001`

## Finalisation command integration

`asset-factory-finalize.mjs` now uses this resolver to:

- discover the correct production family
- select the correct version-aware records
- explain missing files with expected paths
- recommend the next required action when finalisation is blocked
