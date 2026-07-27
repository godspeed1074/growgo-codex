# GROWGO SESSION 102 — CONTROLLED REAL DATASET PACKAGE FOUNDATION

Branch:
`feature/growgo-asset-factory-world-expansion`

## Goal

Define and implement the controlled regional import package used between source ingestion and GrowGo runtime systems.

## Scope Outcome

This session creates and validates:

- `GROWGO_REGION_IMPORT_PACKAGE_001`
- `REGION_PACKAGE_METADATA_001`
- `PACKAGE_PROVENANCE_INDEX_001`
- `REGION_INTERPRETATION_METADATA_001`
- `REGION_CACHE_METADATA_001`
- `REGION_PACKAGE_VALIDATION_001`
- `asset-factory/region-package-builder.mjs`
- `tests/asset-factory-region-package-builder.test.mjs`

This session does not:

- connect live APIs
- import OSM
- modify backend
- modify renderer
- create assets
- create gameplay systems

## Package Structure

### 1. `GROWGO_REGION_IMPORT_PACKAGE_001`

Purpose:

- reusable deterministic package boundary between adapter output and GrowGo runtime consumption

Contains:

- package metadata
- normalized geography data
- normalized road data
- normalized settlement data
- normalized POI data
- normalized natural feature data
- provenance index
- interpretation metadata
- cache metadata
- validation report

### 2. `REGION_PACKAGE_METADATA_001`

Includes:

- `packageId`
- `regionId`
- `sourceVersions`
- `creationTimestamp`
- `geographicBounds`
- `packageVersion`

Implementation note:

- creation timestamp is derived from source adapter import time so package generation stays deterministic

### 3. `PACKAGE_PROVENANCE_INDEX_001`

Purpose:

- fast trace lookup from source feature to normalized feature

Includes:

- `sourceFeatureId`
- `provider`
- `normalizedFeatureId`
- `normalizationVersion`
- normalized feature group

### 4. `REGION_INTERPRETATION_METADATA_001`

Includes:

- classification result
- selected profile
- confidence
- evidence reasons

Example:

- `COASTAL`
- `AUSTRALIAN_COASTAL_WORLD`

### 5. `REGION_CACHE_METADATA_001`

Includes:

- package size
- chunk references
- version
- expiry/update information
- compatibility version
- deterministic package hash

### 6. `REGION_PACKAGE_VALIDATION_001`

Checks:

- source references preserved
- required data present
- provenance complete
- interpretation compatible
- deterministic package hash valid
- cache metadata valid

## Builder Implementation

Created:

- [region-package-builder.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/region-package-builder.mjs)

Builder flow:

`SOURCE_ADAPTER_LAYER_001`

↓

normalized outputs reused directly

↓

world interpretation re-resolved deterministically

↓

provenance index built

↓

cache metadata and deterministic package hash generated

↓

validated `GROWGO_REGION_IMPORT_PACKAGE_001`

## Validation Results

Created focused tests:

- [asset-factory-region-package-builder.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/asset-factory-region-package-builder.test.mjs)

Coverage:

- package creation
- metadata validation
- provenance indexing
- interpretation compatibility
- deterministic package generation
- cache metadata validity
- explicit package validation

## Files Created

- [region-package-builder.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/region-package-builder.mjs)
- [asset-factory-region-package-builder.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/asset-factory-region-package-builder.test.mjs)
- [GROWGO_SESSION_102_CONTROLLED_REAL_DATASET_PACKAGE_FOUNDATION.md](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_102_CONTROLLED_REAL_DATASET_PACKAGE_FOUNDATION.md)

## Readiness

`GROWGO_REGION_IMPORT_PACKAGE_001` is now ready for controlled runtime regional package consumption.

The package:

- preserves source authority
- preserves provenance
- preserves validation state
- supports deterministic reuse
- remains compatible with `WORLD_INTERPRETATION_LAYER_001`
