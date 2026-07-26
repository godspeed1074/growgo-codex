# GROWGO SESSION 96 — DETERMINISTIC FIXTURE SOURCE ADAPTER IMPLEMENTATION

## Session Scope

This session implements the first deterministic runtime for:

- `SOURCE_ADAPTER_LAYER_001`

Purpose:

- convert local fixture provider-style source bundles into validated GrowGo normalized region packages

This session allows:

- adapter implementation
- fixture source bundle creation
- normalization logic
- validation logic
- focused tests

This session does not:

- implement OSM import
- connect external APIs
- modify backend systems
- modify renderer systems
- create assets
- create gameplay systems

## Files Created

- `asset-factory/source-adapter.mjs`
- `tests/asset-factory-source-adapter.test.mjs`
- `GROWGO_SESSION_96_DETERMINISTIC_FIXTURE_SOURCE_ADAPTER_IMPLEMENTATION.md`

## Files Changed

- none

## 1. Implementation Summary

Implemented:

- `SOURCE_ADAPTER_LAYER_001`

Created runtime:

- `asset-factory/source-adapter.mjs`

The runtime now accepts deterministic local fixture bundles shaped as:

- `SOURCE_DATA_BUNDLE_001`

and emits:

- `GROWGO_REGION_PACKAGE_001`

with:

- normalized geography
- normalized roads
- normalized settlements
- normalized POIs
- normalized natural features
- preserved provenance records
- validation metadata
- interpretation-compatible handoff payloads

## 2. Fixture Source Bundles Created

Created deterministic local source bundles:

- `COASTAL_SOURCE_BUNDLE_001`
- `RURAL_SOURCE_BUNDLE_001`
- `URBAN_SOURCE_BUNDLE_001`

### COASTAL_SOURCE_BUNDLE_001

Contains:

- coastline
- river/water relationship
- coastal roads
- beach access paths
- tourism POIs
- coastal reserve and foreshore features

Result:

- produces a coastal normalized GrowGo region package
- remains compatible with `WORLD_INTERPRETATION_LAYER_001`

### RURAL_SOURCE_BUNDLE_001

Contains:

- farmland terrain
- rural roads
- low-density town/village settlement pattern
- sparse POIs
- reserve and waterway features

Result:

- produces a rural normalized GrowGo region package
- remains compatible with `WORLD_INTERPRETATION_LAYER_001`

### URBAN_SOURCE_BUNDLE_001

Contains:

- dense roads
- collector/arterial relationships
- city/suburb settlement pattern
- service and commercial POIs
- urban park feature data

Result:

- produces an urban normalized GrowGo region package
- remains compatible with `WORLD_INTERPRETATION_LAYER_001`

## 3. Adapter Runtime Behaviour

The adapter runtime now performs:

1. source bundle normalization
2. geometry and coordinate validation
3. duplicate feature detection
4. unsupported-type rejection
5. provenance creation and attachment
6. normalized output assembly
7. region package creation
8. deterministic validation signature generation
9. interpretation compatibility handoff packaging

Key exported capabilities:

- fixture source bundle definitions
- `createSourceAdapterLayer(...)`
- `validateSourceAdapterLayer(...)`
- `createGrowgoRegionPackage(...)`
- `createWorldInterpretationInputsFromRegionPackage(...)`

## 4. Provenance Preservation

Every normalized feature now retains:

- source provider
- source ID
- original source type
- provider version
- import version
- normalization version
- normalization rule ID

This preserves the required trace:

Source Feature

↓

Normalized Feature

↓

GrowGo Interpretation

↓

Gameplay Object

Result:

- provenance is preserved across geography, roads, settlements, POIs, and natural features

## 5. Normalized Output Structure

Generated region packages now contain:

- `NORMALIZED_GEOGRAPHY_DATA_001`
- `NORMALIZED_ROAD_DATA_001`
- `NORMALIZED_SETTLEMENT_DATA_001`
- `NORMALIZED_POI_DATA_001`
- `NORMALIZED_NATURAL_FEATURE_DATA_001`

Region package wrapper:

- `GROWGO_REGION_PACKAGE_001`

Validation wrapper:

- `SOURCE_ADAPTER_VALIDATION_001`

The package also records:

- interpretation metadata
- cache metadata
- deterministic signature state

## 6. Interpretation Compatibility

Verified flow:

Source bundle

↓

Adapter runtime

↓

Region package

↓

`WORLD_INTERPRETATION_LAYER_001`

Compatibility helper created:

- `createWorldInterpretationInputsFromRegionPackage(...)`

Confirmed:

- coastal output feeds the interpretation engine and resolves to `COASTAL`
- rural output remains compatible and resolves to `RURAL` or `REMOTE` with outback profile selection
- urban output remains compatible and resolves to `URBAN`

## 7. Validation Results

Implemented validation checks for:

- required metadata exists
- coordinates valid
- geometry valid
- provenance preserved
- unsupported types handled
- duplicate detection
- deterministic output
- interpretation compatibility

Result:

- all adapter validation gates pass for coastal, rural, and urban fixture bundles

## 8. Test Coverage

Created:

- `tests/asset-factory-source-adapter.test.mjs`

Validated:

- source bundle normalization
- provenance preservation
- deterministic same-input output
- coastal bundle packaging
- rural bundle packaging
- urban bundle packaging
- validation success
- interpretation compatibility

Also re-ran interpretation regression coverage:

- `tests/asset-factory-world-interpretation-engine.test.mjs`
- `tests/asset-factory-world-interpretation-fixture-set.test.mjs`

## 9. Test Results

Focused adapter test result:

- `8` tests passed
- `0` failed

Interpretation regression result:

- `14` tests passed
- `0` failed

Combined result:

- `22` tests passed
- `0` failed

## 10. Readiness For Future Provider Adapters

Session 96 status:

- `READY FOR FUTURE PROVIDER ADAPTER FOUNDATIONS`

Reason:

- the provider-neutral adapter runtime now exists
- fixture source bundles validate deterministic normalization behaviour
- provenance preservation is explicit and enforced
- region packages are produced in a reusable GrowGo format
- interpretation compatibility is verified without introducing live-provider coupling

## 11. Recommended Next Step

Recommended follow-up:

- implement a controlled provider-specific adapter foundation that maps real external source payloads into `SOURCE_DATA_BUNDLE_001` before any live OSM or external API integration work
