# GROWGO SESSION 99 — DETERMINISTIC PROVIDER ADAPTER PROTOTYPE

## Session Scope

This session implements the first deterministic runtime for:

- `PROVIDER_ADAPTER_LAYER_001`

Purpose:

- convert provider-shaped fixture data into `SOURCE_DATA_BUNDLE_001`
- connect the provider adapter output into `SOURCE_ADAPTER_LAYER_001`

This session allows:

- provider adapter implementation
- provider fixture bundle creation
- field mapping logic
- validation logic
- focused tests

This session does not:

- connect live APIs
- implement OSM import
- modify backend systems
- modify renderer systems
- create assets
- create gameplay systems

## Files Created

- `asset-factory/provider-adapter.mjs`
- `tests/asset-factory-provider-adapter.test.mjs`
- `GROWGO_SESSION_99_DETERMINISTIC_PROVIDER_ADAPTER_PROTOTYPE.md`

## Files Changed

- `asset-factory/source-adapter.mjs`

## 1. Implementation Summary

Implemented:

- `PROVIDER_ADAPTER_LAYER_001`

Created runtime:

- `asset-factory/provider-adapter.mjs`

The runtime now accepts:

- `PROVIDER_SOURCE_BUNDLE_001`

and emits:

- `SOURCE_DATA_BUNDLE_001`

with:

- provider metadata
- mapped source features
- preserved provider provenance
- deterministic field mapping state
- provider validation metadata

It also supports:

Provider Adapter

↓

`SOURCE_ADAPTER_LAYER_001`

↓

`GROWGO_REGION_PACKAGE_001`

## 2. Fixture Bundles Created

Created deterministic provider-shaped fixture bundles:

- `MAP_PROVIDER_FIXTURE_001`
- `TERRAIN_PROVIDER_FIXTURE_001`
- `POI_PROVIDER_FIXTURE_001`
- `NATURAL_PROVIDER_FIXTURE_001`

### MAP_PROVIDER_FIXTURE_001

Contains:

- roads
- trails
- paths
- boundaries

Mapping examples:

- `highway: "primary"` → `ROAD` with `roadClass: "PRIMARY"`
- `highway: "track"` → `TRAIL`
- `highway: "footway"` → `PATH`
- boundary polygon → settlement-style source feature

### TERRAIN_PROVIDER_FIXTURE_001

Contains:

- elevation
- terrain classes
- landform information

Mapping examples:

- elevation values → `ELEVATION`
- terrain class → `TERRAIN`
- biome class → `BIOME`
- protected landform → `PROTECTED_AREA`

### POI_PROVIDER_FIXTURE_001

Contains:

- landmarks
- attractions
- services

Mapping examples:

- `lighthouse` → `LANDMARK`
- `beach` → `ATTRACTION`
- `cafe` → `SERVICE`

### NATURAL_PROVIDER_FIXTURE_001

Contains:

- beaches
- parks
- waterways

Mapping examples:

- `beach` → `BEACH`
- `park` → `PARK`
- `waterway` → `WATERWAY`

## 3. Field Mapping Implementation

Implemented:

- `PROVIDER_FIELD_MAPPING_001`

Each mapping now records:

- provider field
- provider type
- GrowGo target field
- transformation rule
- confidence handling

Examples implemented:

- `highway` → `roadFeatures[].type`
- `surface` → `roadFeatures[].properties.surface`
- `access` → `roadFeatures[].properties.access`
- `category` → `poiFeatures[].type`
- `featureClass` → `naturalFeatures[].type`
- `elevationMeters` → `geographyFeatures[].properties.averageMeters`

## 4. Provenance Preservation

Every converted feature now retains provider-side provenance metadata including:

- provider name
- provider ID
- provider type
- provider version
- mapping version

This provenance is attached on converted source features before `SOURCE_ADAPTER_LAYER_001` processing.

Result:

- provider identity remains visible through conversion
- source truth is preserved
- downstream source adapter compatibility remains deterministic

## 5. Validation

Implemented:

- `PROVIDER_ADAPTER_VALIDATION_001`

Validation checks now cover:

- provider metadata exists
- mappings valid
- required fields present
- unsupported fields handled
- provenance preserved
- deterministic conversion
- source adapter compatibility

Also added a compatibility bridge that verifies:

Provider Adapter

↓

`SOURCE_DATA_BUNDLE_001`

↓

`SOURCE_ADAPTER_LAYER_001`

↓

`GROWGO_REGION_PACKAGE_001`

works correctly.

## 6. Source Adapter Adjustment

Updated:

- `asset-factory/source-adapter.mjs`

Adjustment made:

- provenance validation now accepts empty provenance arrays for legitimately empty feature categories

Reason:

- provider-specific bundles may represent only one source class
- this keeps partial authoritative provider bundles valid without inventing missing data

This change does not weaken existing deterministic source adapter behaviour for full bundles.

## 7. Conversion Results

Verified results:

- map provider fixture converts into road and settlement-compatible source features
- terrain provider fixture converts into geography-compatible source features
- POI provider fixture converts into POI-compatible source features
- natural provider fixture converts into natural-feature-compatible source features

Each converted bundle remains:

- deterministic
- provider-traceable
- source-adapter compatible

## 8. Test Coverage

Created:

- `tests/asset-factory-provider-adapter.test.mjs`

Validated:

- provider conversion
- field mapping
- provenance preservation
- deterministic same input
- source adapter compatibility
- validation success

Also re-ran:

- `tests/asset-factory-source-adapter.test.mjs`

to confirm the source adapter still behaves correctly after the partial-bundle compatibility update.

## 9. Test Results

Provider adapter result:

- `9` tests passed
- `0` failed

Source adapter regression result:

- `8` tests passed
- `0` failed

Combined focused result:

- `17` tests passed
- `0` failed

## 10. Readiness Status

Session 99 status:

- `READY FOR FUTURE PROVIDER IMPLEMENTATIONS`

Reason:

- provider-shaped fixture data now converts deterministically into `SOURCE_DATA_BUNDLE_001`
- field mappings are implemented and test-covered
- provenance is preserved across conversion
- compatibility with `SOURCE_ADAPTER_LAYER_001` is verified
- the prototype remains cleanly separated from live-provider and OSM integration work

## 11. Recommended Next Step

Recommended follow-up:

- implement a controlled real-provider mock adapter using the same `PROVIDER_SOURCE_BUNDLE_001` and `PROVIDER_FIELD_MAPPING_001` structure before any live API or OSM ingestion work
