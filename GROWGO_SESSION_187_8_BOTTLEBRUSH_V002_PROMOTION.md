# GROWGO SESSION 187.8 — TREE_BOTTLEBRUSH_001 v002 Promotion

## Goal

Promote the verified `TREE_BOTTLEBRUSH_001_v002` package to the current Asset
Factory development revision without publishing it, activating runtime usage, or
overwriting the protected `v001` revision.

## Pre-promotion state

- current development catalog version: `v001`
- lifecycle status: `REGISTERED`
- validation status: `validated`
- v002 verification report: present and replacement-ready
- v002 validation record: present and replacement-ready
- all three v002 GLBs: present and verified
- protected v001 hashes: unchanged from Phase 187.7

## Promotion changes

The Asset Factory registry now records:

- `currentDevelopmentVersion: v002`
- `v001`: `historical_approved`, protected, not current
- `v002`: approved, current

The development catalog now records:

- version: `v002`
- lifecycle status: `APPROVED_CURRENT`
- validation status: `approved`
- v002 CLOSE, GAMEPLAY, and MAP output references
- explicit revision history preserving the v001 output references
- development-only visibility and runtime/publishing guards

The v002 validation record now records:

- revision status: `approved`
- promotion status: `approved/current`
- current development revision: true
- promoted to development catalog: true

## Files created

- `asset-factory/tree-bottlebrush-v002-promotion.mjs`
- `asset-factory/tree-bottlebrush-v002-promote.mjs`
- `tests/asset-factory-tree-bottlebrush-v002-promotion.test.mjs`
- `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/tree-bottlebrush-v002-promotion.json`

## Files updated

- `asset-factory/asset-registry.mjs`
- `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/tree-bottlebrush-development-catalog-entry.json`
- `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/tree-bottlebrush-v002-validation.json`

## Safety result

- v001 source and GLBs unchanged
- v001 manifest, metadata, validation, registration, and visual review unchanged
- v001 remains historical and protected
- identity contracts unchanged
- no publishing
- no release creation
- no renderer or map attachment
- no runtime activation
- eucalyptus untouched
- pavilion untouched

## Final state

`TREE_BOTTLEBRUSH_001_v002` is the approved current development revision in the
Asset Factory catalog. `TREE_BOTTLEBRUSH_001_v001` remains the protected
historical approved revision.
