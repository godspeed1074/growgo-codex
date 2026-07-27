# GROWGO SESSION 103 — RUNTIME REGIONAL PACKAGE READER

Branch:
`feature/growgo-asset-factory-world-expansion`

## Goal

Create the runtime reader layer that consumes `GROWGO_REGION_IMPORT_PACKAGE_001` and exposes validated GrowGo-ready regional objects.

## Scope Outcome

Created:

- `REGION_PACKAGE_RUNTIME_READER_001`
- `RUNTIME_PACKAGE_VALIDATION_001`
- `asset-factory/region-package-runtime-reader.mjs`
- `tests/asset-factory-region-package-runtime-reader.test.mjs`

This session does not:

- connect live APIs
- import OSM
- modify backend
- modify renderer
- create assets
- create gameplay systems

## Runtime Reader Design

Reader input:

- `GROWGO_REGION_IMPORT_PACKAGE_001`

Reader output collections:

- `RUNTIME_ROAD_OBJECTS_001`
- `RUNTIME_SETTLEMENT_OBJECTS_001`
- `RUNTIME_POI_OBJECTS_001`
- `RUNTIME_NATURAL_FEATURE_OBJECTS_001`
- `RUNTIME_BUILDING_REFERENCE_OBJECTS_001`

The reader:

- preserves package provenance
- preserves prepared geometry
- reuses existing interpretation rules for runtime tags
- does not modify source data
- does not invent features

## Runtime Object Shape

Each runtime object exposes:

- `objectId`
- `sourceReference`
- `objectType`
- `geometry`
- `interpretationMetadata`
- `gameplayCompatibilityTags`

Examples now supported:

- parks with nature and exploration tags
- businesses from service POIs
- landmarks with discovery and quest traceability
- building reference objects for service, cultural, and landmark POIs

## Validation

Runtime validation contract:

- package version valid
- provenance preserved
- object types valid
- geometry present
- interpretation metadata available
- deterministic reading

## Tests Added

Created:

- [asset-factory-region-package-runtime-reader.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/asset-factory-region-package-runtime-reader.test.mjs)

Coverage:

- package loading
- road extraction
- park extraction
- business extraction
- landmark extraction
- provenance preservation
- deterministic output
- explicit reader validation

## Files Created

- [region-package-runtime-reader.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/region-package-runtime-reader.mjs)
- [asset-factory-region-package-runtime-reader.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/asset-factory-region-package-runtime-reader.test.mjs)
- [GROWGO_SESSION_103_RUNTIME_REGIONAL_PACKAGE_READER.md](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_103_RUNTIME_REGIONAL_PACKAGE_READER.md)

## Readiness

`REGION_PACKAGE_RUNTIME_READER_001` is ready for controlled Atlas Engine integration.

The runtime layer now exposes:

- validated road objects
- settlement objects
- POI objects
- natural feature objects
- building reference objects

all derived from prepared real-world regional packages without changing source truth.
