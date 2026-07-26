# GROWGO SESSION 94 — SOURCE ADAPTER CONTRACT FOUNDATION

## Session Scope

This session defines the contract foundation for:

- `SOURCE_ADAPTER_LAYER_001`

Purpose:

- create a provider-independent bridge between external real-world data and GrowGo interpretation-ready inputs

This session is planning and specification only.

This session does not:

- implement OSM import
- connect live APIs
- modify backend systems
- modify renderer systems
- create assets
- create gameplay systems
- create world generator code

## Files Created

- `GROWGO_SESSION_94_SOURCE_ADAPTER_CONTRACT_FOUNDATION.md`

## Files Changed

- none

## 1. Foundation Goal

External sources remain authoritative.

GrowGo does not create geography in this layer.

Adapters only:

- normalize
- validate
- classify source data structure
- preserve provenance

Adapters do not:

- invent roads
- invent landmarks
- invent settlements
- replace source truth

Core rule:

- adapter output is a deterministic translation of provider data into GrowGo-ready normalized contracts

## 2. Architecture Position

`SOURCE_ADAPTER_LAYER_001` sits before:

1. `WORLD_INTERPRETATION_LAYER_001`
2. classification and profile resolution
3. gameplay interpretation
4. Atlas presentation mapping

It sits after:

1. external source retrieval
2. provider-specific parsing
3. provider-specific field extraction

It is the boundary where provider-specific payloads stop and provider-neutral GrowGo data begins.

## 3. Source Adapter Layer Schema

Create:

- `SOURCE_ADAPTER_LAYER_001`

### Required fields

- `schemaId`
- `adapterId`
- `sourceProvider`
- `sourceVersion`
- `importTimestamp`
- `geographicArea`
- `sourceReferences`
- `normalizationStatus`
- `validationStatus`

### Field intent

- `schemaId`: top-level adapter contract identity
- `adapterId`: deterministic adapter run or package identity
- `sourceProvider`: provider name and type
- `sourceVersion`: upstream dataset version or revision marker
- `importTimestamp`: import-time metadata
- `geographicArea`: area covered by the adapted data
- `sourceReferences`: preserved provider identifiers and raw-source linkage
- `normalizationStatus`: normalized-output completeness state
- `validationStatus`: quality and determinism validation state

### Suggested shape

```json
{
  "schemaId": "SOURCE_ADAPTER_LAYER_001",
  "adapterId": "SOURCE_ADAPTER_001",
  "sourceProvider": {},
  "sourceVersion": {},
  "importTimestamp": "2026-07-26T00:00:00Z",
  "geographicArea": {},
  "sourceReferences": [],
  "normalizationStatus": {},
  "validationStatus": {}
}
```

## 4. Source Types

The adapter layer must support multiple upstream source classes.

### MAP_DATA_SOURCE_001

Examples:

- OSM
- road networks
- paths
- trails

Purpose:

- provide authoritative linear transport and access structure

Expected content:

- roads
- intersections
- paths
- trails
- hierarchy tags
- access classifications

### TERRAIN_DATA_SOURCE_001

Examples:

- elevation
- terrain
- landform

Purpose:

- provide authoritative physical landscape structure

Expected content:

- elevation bands
- slope hints
- terrain classes
- landform boundaries

### POI_DATA_SOURCE_001

Examples:

- attractions
- services
- landmarks
- cultural locations

Purpose:

- provide authoritative human-interest anchors

Expected content:

- feature identifiers
- source categories
- significance hints
- clustering or density hints

### NATURAL_DATA_SOURCE_001

Examples:

- beaches
- forests
- parks
- reserves
- waterways

Purpose:

- provide authoritative natural-world and recreation features

Expected content:

- natural boundaries
- protected-area status
- recreation access hints
- scenic feature types

## 5. Normalization Pipeline

Define the provider-neutral pipeline as:

External Source

↓

Provider-Specific Extractor

↓

`SOURCE_ADAPTER_LAYER_001`

↓

Normalized GrowGo Data

↓

`WORLD_INTERPRETATION_LAYER_001`

Key rule:

- the adapter layer is not interpretation
- it prepares consistent, validated, provenance-preserving inputs for interpretation

## 6. Normalized Output Contracts

The adapter layer must emit normalized provider-neutral contracts.

### NORMALIZED_GEOGRAPHY_DATA_001

Contains:

- coastlines
- rivers
- terrain
- biome

Required fields:

- `schemaId`
- `normalizedId`
- `boundary`
- `coastlineFeatures`
- `riverFeatures`
- `terrainBands`
- `biomeClassification`
- `provenance`

### NORMALIZED_ROAD_DATA_001

Contains:

- roads
- trails
- paths
- hierarchy

Required fields:

- `schemaId`
- `normalizedId`
- `roadSegments`
- `trailSegments`
- `pathSegments`
- `networkHierarchy`
- `accessHints`
- `provenance`

### NORMALIZED_SETTLEMENT_DATA_001

Contains:

- settlements
- density
- boundaries

Required fields:

- `schemaId`
- `normalizedId`
- `cityRecords`
- `townRecords`
- `suburbRecords`
- `villageRecords`
- `settlementDensity`
- `settlementBoundaries`
- `provenance`

### NORMALIZED_POI_DATA_001

Contains:

- landmarks
- services
- attractions

Required fields:

- `schemaId`
- `normalizedId`
- `landmarkRecords`
- `serviceRecords`
- `attractionRecords`
- `culturalLocationRecords`
- `categoryMapping`
- `provenance`

### NORMALIZED_NATURAL_FEATURE_DATA_001

Contains:

- natural areas
- protected zones
- recreation areas

Required fields:

- `schemaId`
- `normalizedId`
- `beachFeatures`
- `parkFeatures`
- `forestFeatures`
- `reserveFeatures`
- `waterwayFeatures`
- `recreationHints`
- `provenance`

## 7. Provenance System

Every normalized feature must retain:

- source provider
- source identifier
- original type
- import version

Purpose:

Real Feature

↓

Normalized Feature

↓

GrowGo Interpretation

↓

Gameplay Object

### Minimum provenance fields per normalized feature

- `providerId`
- `providerType`
- `sourceId`
- `sourceType`
- `importVersion`
- `importBatchId`
- `normalizationRuleId`

### Provenance rule

- if a normalized feature cannot preserve source linkage, it must not be treated as authoritative input

## 8. Normalization Rules

The adapter layer must normalize provider differences without changing truth.

### Allowed transformations

- field renaming
- type standardization
- hierarchy mapping
- geometry validation
- duplicate collapse when source identity proves equivalence
- category mapping into GrowGo-neutral names

### Disallowed transformations

- synthetic roads
- invented landmarks
- inferred settlements without source evidence
- fake coastline continuity
- geometry invention to fill provider gaps

### Deterministic normalization requirement

- same source payload plus same normalization rules must produce the same normalized output

## 9. Data Quality Validation

The adapter layer must validate source quality before interpretation.

Required checks:

- missing geometry
- invalid coordinates
- duplicate features
- unsupported types
- stale source data

### Missing geometry

Rule:

- required geometry-bearing features without usable geometry are flagged and excluded or downgraded

### Invalid coordinates

Rule:

- out-of-range coordinates or corrupt geometry must fail validation

### Duplicate features

Rule:

- duplicates may be collapsed only with deterministic equivalence rules and preserved provenance

### Unsupported types

Rule:

- unsupported provider types must be flagged, not silently reinterpreted

### Stale source data

Rule:

- stale source metadata must be recorded so interpretation can decide whether to trust or downgrade the input

## 10. Validation Contract

The adapter layer must expose validation aligned with interpretation readiness.

Required checks:

- source provenance preserved
- normalization deterministic
- no fictional data added
- interpretation compatibility

### Source provenance preserved

Checks:

- every normalized feature retains provider and source identity

### Normalization deterministic

Checks:

- same source input yields same normalized contract

### No fictional data added

Checks:

- normalized output contains only source-backed or source-collapsed features

### Interpretation compatibility

Checks:

- normalized outputs satisfy the minimum requirements for:
  - `GEOGRAPHY_INPUT_001`
  - `ROAD_NETWORK_INPUT_001`
  - `SETTLEMENT_INPUT_001`
  - `POI_INPUT_001`
  - `NATURAL_FEATURE_INPUT_001`

## 11. Region Packaging

Define future support for:

- `GROWGO_REGION_PACKAGE_001`

Purpose:

- package normalized source data and interpretation-ready metadata into reusable regional units

Should include:

- normalized geography
- normalized roads
- normalized POIs
- interpretation metadata
- cache metadata

### Required region package fields

- `packageId`
- `geographicArea`
- `normalizedGeographyRef`
- `normalizedRoadDataRef`
- `normalizedSettlementDataRef`
- `normalizedPoiDataRef`
- `normalizedNaturalFeatureDataRef`
- `adapterMetadata`
- `cacheMetadata`

### Packaging rule

- region packaging is for storage, caching, and reuse
- it must not change normalized truth

## 12. Performance Requirements

The adapter architecture must support:

- import once
- classify once
- compact storage
- device caching
- regional reuse

Key existing alignment:

- do not query public OSM services directly from every player device

### Practical implications

- normalization should happen upstream or in controlled preprocessing
- packages should be cacheable by region
- player devices should consume prepared packages rather than raw public-source queries

## 13. Compatibility With Interpretation Layer

`SOURCE_ADAPTER_LAYER_001` must provide data that is directly consumable by:

- `WORLD_INTERPRETATION_LAYER_001`

Minimum compatibility requirements:

- provider-neutral feature naming
- deterministic field presence
- preserved provenance
- geometry and coordinate validity
- ready mapping into the interpretation input schemas

The adapter contract should be the only place where provider-specific irregularity is tolerated.

## 14. Implementation Readiness

This foundation is ready to support future work in layers:

1. provider extractor contracts
2. normalization rule contracts
3. provenance persistence rules
4. quality validation rules
5. region packaging rules
6. interpretation compatibility checks

Recommended next step:

- define a machine-readable `SOURCE_ADAPTER_LAYER_001` contract with schema-level validation and a deterministic local fixture adapter before any live provider connection work

## 15. Readiness Status

Session 94 status:

- `READY FOR MACHINE-READABLE SOURCE ADAPTER CONTRACT`

Reason:

- the provider-neutral boundary is now explicit
- normalized output targets are defined
- provenance and validation requirements are clear
- region packaging and caching direction are aligned with existing GrowGo real-world architecture decisions
