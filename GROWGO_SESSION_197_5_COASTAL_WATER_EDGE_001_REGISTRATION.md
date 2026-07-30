# GrowGo Session 197.5 — COASTAL_WATER_EDGE_001 Registration

## Goal

Register the export-verified and visually approved `COASTAL_WATER_EDGE_001_v001` asset without promoting it, publishing it, activating runtime, or modifying other approved assets.

## Completed

- verified the required pre-registration inputs existed:
  - export validation
  - export manifest
  - source verification
  - visual approval
- confirmed asset identity and recipe identity stayed aligned across:
  - intake
  - authoring setup
  - source verification
  - export manifest
  - export validation
- confirmed source/export separation remained valid for this asset:
  - source `.blend` remains in `source/`
  - no `COASTAL_WATER_EDGE_001*.blend` file exists in `export/`
  - final GLBs remain in `export/`
- registered `COASTAL_WATER_EDGE_001_v001`
- created a development-only catalog entry
- created a version record
- kept the asset unpromoted, unpublished, and runtime-disabled

## Files Created

- `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/coastal-water-edge-visual-approval.json`
- `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/coastal-water-edge-registration.json`
- `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/coastal-water-edge-development-catalog-entry.json`
- `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/coastal-water-edge-v001-version-record.json`
- `tests/asset-factory-coastal-water-edge-registration.test.mjs`
- `GROWGO_SESSION_197_5_COASTAL_WATER_EDGE_001_REGISTRATION.md`

## Files Changed

- `asset-factory/coastal-water-edge-registration.mjs`
- `asset-factory/asset-registry.mjs`
- `tests/asset-factory-asset-registry.test.mjs`
- `tests/asset-factory-coastal-water-edge-manual-authoring.test.mjs`

## Visual Approval

Visual approval was formalised as:

- status: `approved`
- source: manual visual approval confirmed in the Phase 197.5 registration request
- visual review complete: `true`
- visually approved for development catalog: `true`

## Registration Result

Registration record state:

- asset ID: `COASTAL_WATER_EDGE_001`
- version: `v001`
- registration status: `registered`
- validation status: `validated`
- visual approval status: `approved`
- publish status: `not_published`
- release status: `not_released`
- ready for approval: `true`
- ready for publishing: `false`
- promotion status: `approved/current candidate`

Verified output hashes preserved:

- `COASTAL_WATER_EDGE_001_LOD_CLOSE.glb`
  - `9fc965aedb6d5454014f2c1de80b129c623daad2eb136bd27f1354033e16dd95`
- `COASTAL_WATER_EDGE_001_LOD_GAMEPLAY.glb`
  - `52aa060d98f77c8e7ec8fdcdbb2017bcd62bb3a319cde733130ea0c7c00c139e`
- `COASTAL_WATER_EDGE_001_LOD_MAP.glb`
  - `3ea3341ecc439c7b8efb4d544746761aecedfd841aeaa850234174cd379bd275`

## Development Catalog

Development catalog entry state:

- lifecycle status: `APPROVED_CURRENT_CANDIDATE`
- environment: `DEVELOPMENT_ONLY`
- beta visibility: `false`
- production visibility: `false`
- runtime activation: `disabled`
- automatic publishing: `disabled`
- release creation: `disabled`
- map attachment: `disabled`

## Version Record

Version record state:

- previous development version: `null`
- current development version: `v001`
- `v001` status: `approved/current candidate`
- `v001` current: `true`
- promotion performed: `false`
- published: `false`
- runtime activated: `false`

## Tests

Focused tests and regression checks passed:

- `tests/asset-factory-coastal-water-edge-manual-authoring.test.mjs`
- `tests/asset-factory-coastal-water-edge-source-verification.test.mjs`
- `tests/asset-factory-coastal-water-edge-export.test.mjs`
- `tests/asset-factory-coastal-water-edge-registration.test.mjs`
- `tests/asset-factory-asset-registry.test.mjs`
- `tests/asset-factory-tree-eucalyptus-registration.test.mjs`

Result:

- `76` passed
- `0` failed

## Final Version State

`COASTAL_WATER_EDGE_001_v001` is now:

- export-verified
- visually approved
- registered
- present in the development catalog
- marked as the approved/current candidate
- not promoted
- not published
- runtime inactive

