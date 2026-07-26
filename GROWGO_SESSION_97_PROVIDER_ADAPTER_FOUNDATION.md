# GROWGO SESSION 97 — PROVIDER ADAPTER FOUNDATION

## Session Scope

This session defines the planning and specification foundation for:

- `PROVIDER_ADAPTER_LAYER_001`

Purpose:

- create the provider-independent architecture that allows external real-world data providers to feed `SOURCE_ADAPTER_LAYER_001`

This session is planning and specification only.

This session does not:

- connect live APIs
- implement OSM import
- modify backend systems
- modify renderer systems
- create assets
- create gameplay systems

## Files Created

- `GROWGO_SESSION_97_PROVIDER_ADAPTER_FOUNDATION.md`

## Files Changed

- none

## 1. Source Of Truth

This foundation is based on:

- `GROWGO_SESSION_96_DETERMINISTIC_FIXTURE_SOURCE_ADAPTER_IMPLEMENTATION.md`
- `GROWGO_SESSION_95_MACHINE_READABLE_SOURCE_ADAPTER_CONTRACT.md`
- `GROWGO_SESSION_91_WORLD_INTERPRETATION_MACHINE_READABLE_CONTRACT.md`

Continuity rules:

- providers supply authoritative source information
- provider adapters translate provider formats into GrowGo-ready source bundles
- provider adapters preserve source identity and provenance
- provider adapters normalize provider differences without inventing missing geography or replacing source truth
- provider adapter output must remain deterministic and compatible with `SOURCE_ADAPTER_LAYER_001`

## 2. Foundation Goal

`PROVIDER_ADAPTER_LAYER_001` must define:

- a provider-facing adapter contract
- supported provider adapter families
- field mapping rules from provider formats into GrowGo source bundles
- provenance and metadata preservation rules
- error handling rules for incomplete or invalid provider payloads
- deterministic validation expectations before `SOURCE_ADAPTER_LAYER_001` processing

This layer exists before:

Provider Data

↓

Provider Adapter

↓

`SOURCE_ADAPTER_LAYER_001`

↓

Normalized GrowGo Data

## 3. Architecture Position

`PROVIDER_ADAPTER_LAYER_001` is the bridge between:

1. provider-native payload structure
2. provider-neutral GrowGo source bundle structure

It sits after:

1. external provider retrieval or provider package loading
2. provider-specific file or payload parsing
3. provider-specific field extraction

It sits before:

1. `SOURCE_ADAPTER_LAYER_001`
2. normalized GrowGo region packaging
3. `WORLD_INTERPRETATION_LAYER_001`

Core rule:

- provider adapters standardize source representation, not world meaning

## 4. Provider Adapter Layer Definition

Create:

- `PROVIDER_ADAPTER_LAYER_001`

Purpose:

- define the family of provider adapters that translate authoritative provider payloads into `SOURCE_DATA_BUNDLE_001` compatible inputs for `SOURCE_ADAPTER_LAYER_001`

### Required responsibilities

- translate provider-native feature structures
- preserve source IDs and provider metadata
- preserve original type information
- attach provider timestamps and versions
- classify provider fields into GrowGo source bundle categories
- reject invalid geometry before normalization

### Prohibited responsibilities

- invent missing roads
- invent landmarks
- infer fictional coastlines
- generate substitute settlement boundaries
- replace provider truth with estimated data

## 5. Provider Adapter Contract

Create:

- `PROVIDER_ADAPTER_001`

### Required fields

- `adapterId`
- `providerType`
- `providerName`
- `providerVersion`
- `supportedDataTypes`
- `sourceMetadataMapping`
- `normalizationStrategy`
- `validationStrategy`

### Field intent

- `adapterId`: stable provider adapter identity
- `providerType`: high-level provider family category
- `providerName`: concrete upstream provider identity
- `providerVersion`: upstream provider version or schema version
- `supportedDataTypes`: source classes this adapter can convert
- `sourceMetadataMapping`: rules for preserving provider identifiers, timestamps, and source references
- `normalizationStrategy`: deterministic translation rules into GrowGo source bundle fields
- `validationStrategy`: deterministic checks applied before handoff into `SOURCE_ADAPTER_LAYER_001`

### Suggested shape

```json
{
  "adapterId": "PROVIDER_ADAPTER_001",
  "providerType": "MAP_PROVIDER",
  "providerName": "example-provider",
  "providerVersion": "1.0",
  "supportedDataTypes": [],
  "sourceMetadataMapping": {},
  "normalizationStrategy": {},
  "validationStrategy": {}
}
```

## 6. Supported Provider Types

This foundation defines four adapter families.

### MAP_PROVIDER_ADAPTER_001

Purpose:

- convert mapping-provider data into GrowGo source bundle structures

Examples:

- OpenStreetMap-style data
- road networks
- paths
- boundaries

Expected output focus:

- roads
- trails
- paths
- transport routes
- settlement boundaries where available

### TERRAIN_PROVIDER_ADAPTER_001

Purpose:

- convert terrain and elevation source data into GrowGo source bundle structures

Examples:

- elevation
- terrain mesh data
- landform information

Expected output focus:

- elevation features
- terrain features
- landform features
- biome classification hints

### POI_PROVIDER_ADAPTER_001

Purpose:

- convert point-of-interest datasets into GrowGo source bundle structures

Examples:

- attractions
- services
- landmarks
- cultural locations

Expected output focus:

- landmark features
- attraction features
- service features
- cultural features

### NATURAL_FEATURE_PROVIDER_ADAPTER_001

Purpose:

- convert natural and environmental datasets into GrowGo source bundle structures

Examples:

- parks
- reserves
- waterways
- beaches

Expected output focus:

- protected areas
- beaches
- forests
- reserves
- waterways

## 7. Provider To Source Flow

The provider conversion path must be:

Provider Data

↓

Provider Parser

↓

Provider Adapter

↓

`SOURCE_DATA_BUNDLE_001`

↓

`SOURCE_ADAPTER_LAYER_001`

↓

Normalized GrowGo Data

Key rule:

- provider-specific shape ends at the provider adapter boundary
- `SOURCE_ADAPTER_LAYER_001` should receive provider-neutral source bundle structures

## 8. Field Mapping Contract

Provider adapters must define explicit, deterministic field mapping.

Mapping model:

Provider field

↓

GrowGo source field

↓

`SOURCE_ADAPTER_LAYER_001` normalized output

### Example mappings

`OSM highway`

↓

`SOURCE_DATA_BUNDLE_001 roadFeatures[].type`

↓

`NORMALIZED_ROAD_DATA_001 road type / hierarchy`

`POI category`

↓

`SOURCE_DATA_BUNDLE_001 poiFeatures[].type`

↓

`NORMALIZED_POI_DATA_001 category`

`Natural area type`

↓

`SOURCE_DATA_BUNDLE_001 naturalFeatures[].type`

↓

`NORMALIZED_NATURAL_FEATURE_DATA_001 feature type`

`Elevation source value`

↓

`SOURCE_DATA_BUNDLE_001 geographyFeatures[].properties`

↓

`NORMALIZED_GEOGRAPHY_DATA_001 elevation bands`

### Mapping rules

- one provider field may map to one GrowGo field
- multiple provider fields may be combined only with deterministic rules
- unsupported provider fields must be ignored safely or flagged explicitly
- missing provider fields must never be silently fabricated

## 9. Source Compatibility Rules

Every provider adapter must preserve:

- source ID
- provider name
- original type
- provider version
- source timestamps

These must survive the full trace:

Provider Record

↓

Provider Adapter Output

↓

`SOURCE_ADAPTER_LAYER_001`

↓

`PROVENANCE_RECORD_001`

↓

`WORLD_INTERPRETATION_LAYER_001`

Rule:

- provider adapters may rename fields for compatibility, but they must not lose source identity

## 10. Provider Output Contract

Provider adapters must emit provider-neutral source bundle content compatible with:

- provider metadata
- geography features
- road features
- settlement features
- POI features
- natural features

Minimum compatibility target:

- `SOURCE_DATA_BUNDLE_001`

The bundle must be valid input for:

- `createSourceAdapterLayer(...)`

Provider adapters therefore act as pre-normalization translators, not as alternate normalization engines.

## 11. Error Handling Rules

Provider adapters must define predictable handling for incomplete or invalid data.

### Unsupported fields

- ignored safely
- optionally recorded in adapter warnings
- must not break deterministic output ordering

### Missing fields

- emit validation warning
- preserve source record if still usable
- reject only when the missing field blocks deterministic source-bundle compatibility

### Invalid geometry

- rejected
- must not enter `SOURCE_ADAPTER_LAYER_001`
- adapter must preserve source reference for traceability

### Conflicting data

- provenance preserved for all contributing source records
- conflict resolution must be deterministic
- if conflict cannot be resolved safely, adapter emits validation failure rather than fabricated output

## 12. Quality Validation

Provider adapters must define validation for:

- provider metadata present
- mapping rules valid
- provenance preserved
- normalized output compatibility
- deterministic conversion

### Required validation gates

- provider identity present
- provider version present
- supported data types declared
- source timestamps preserved
- field mapping rules resolvable
- geometry structure valid
- source IDs preserved
- source bundle output compatible with `SOURCE_ADAPTER_LAYER_001`
- same provider package produces same output

## 13. Determinism Rules

Provider adapters must guarantee:

same provider payload

=

same provider adapter output

=

same `SOURCE_ADAPTER_LAYER_001` input

Not allowed:

- hidden randomization
- unstable field ordering
- context-dependent category assignment
- timestamp mutation during conversion
- provider-record merging without deterministic identity rules

## 14. Validation Relationship To Source Adapter Layer

Provider adapter validation must happen before source adapter validation.

Sequence:

1. provider payload validation
2. provider field mapping validation
3. provider adapter output generation
4. `SOURCE_ADAPTER_LAYER_001` validation
5. normalized region package validation
6. interpretation compatibility validation

This keeps failure responsibility clear:

- provider adapter catches provider-format problems
- source adapter catches GrowGo source-bundle problems
- interpretation layer catches downstream classification and presentation problems

## 15. Future Support Path

This provider adapter foundation is designed to support:

- OSM
- terrain providers
- satellite-derived data
- government datasets
- tourism datasets

Expected progression:

1. fixture-backed provider adapter mock
2. controlled provider schema adapters
3. region package validation against real provider exports
4. later live-provider ingestion work outside this session

## 16. Implementation Readiness

This foundation is ready to support:

1. provider-specific adapter contract files
2. deterministic field mapping tables
3. provider payload validators
4. provider-to-source-bundle conversion scripts
5. provenance-preserving pre-normalization pipelines
6. controlled future OSM adapter work

Recommended next step:

- define the machine-readable contract for `PROVIDER_ADAPTER_LAYER_001` and `PROVIDER_ADAPTER_001` so provider families can be implemented against a shared deterministic schema

## 17. Readiness Status

Session 97 status:

- `READY FOR PROVIDER ADAPTER MACHINE READABLE CONTRACT`

Reason:

- provider architecture is now separated cleanly from source normalization
- provider adapter responsibilities and limits are explicit
- field mapping and provenance preservation expectations are defined
- validation and determinism requirements are clear
- future real-provider integration can proceed without weakening the authoritative-source rule
