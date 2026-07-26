# GROWGO SESSION 95 — MACHINE READABLE SOURCE ADAPTER CONTRACT

## Session Scope

This session defines the machine-readable contract for:

- `SOURCE_ADAPTER_LAYER_001`

Purpose:

- create the provider-independent normalized real-world data boundary used before `WORLD_INTERPRETATION_LAYER_001`

This session creates schemas and contracts only.

This session does not:

- implement OSM import
- connect external APIs
- modify backend systems
- modify renderer systems
- create assets
- create gameplay systems
- create world generator code

## Files Created

- `GROWGO_SESSION_95_MACHINE_READABLE_SOURCE_ADAPTER_CONTRACT.md`

## Files Changed

- none

## 1. Source Of Truth

This contract is based on:

- `GROWGO_SESSION_94_SOURCE_ADAPTER_CONTRACT_FOUNDATION.md`
- `GROWGO_SESSION_91_WORLD_INTERPRETATION_MACHINE_READABLE_CONTRACT.md`
- `GROWGO_SESSION_93_REAL_WORLD_FIXTURE_INTERPRETATION_LAYER.md`
- existing GrowGo OSM architecture decisions

Continuity rules:

- external providers remain authoritative
- the adapter layer normalizes, validates, preserves provenance, and prepares GrowGo-ready data
- the adapter layer does not invent geography, create fictional places, or replace source truth
- normalized outputs must remain deterministic and directly consumable by `WORLD_INTERPRETATION_LAYER_001`

## 2. Contract Goal

`SOURCE_ADAPTER_LAYER_001` must define:

- provider metadata and import boundaries
- normalized feature output contracts
- provenance preservation rules
- data quality validation rules
- deterministic region packaging rules

The contract must be readable by:

- future fixture adapters
- future OSM-backed adapters
- preprocessing pipelines
- interpretation validators
- region package builders
- cache and storage planners

## 3. Schema Set

This session defines these schema identities:

- `SOURCE_ADAPTER_LAYER_001`
- `MAP_DATA_SOURCE_001`
- `TERRAIN_DATA_SOURCE_001`
- `POI_DATA_SOURCE_001`
- `NATURAL_DATA_SOURCE_001`
- `NORMALIZED_GEOGRAPHY_DATA_001`
- `NORMALIZED_ROAD_DATA_001`
- `NORMALIZED_SETTLEMENT_DATA_001`
- `NORMALIZED_POI_DATA_001`
- `NORMALIZED_NATURAL_FEATURE_DATA_001`
- `PROVENANCE_RECORD_001`
- `GROWGO_REGION_PACKAGE_001`

## 4. Source Adapter Layer Schema

### Schema ID

- `SOURCE_ADAPTER_LAYER_001`

### Required fields

- `schemaId`
- `adapterId`
- `provider`
- `providerVersion`
- `importVersion`
- `geographicArea`
- `sourceTimestamps`
- `sourceReferences`
- `normalizedOutputs`
- `normalizationStatus`
- `validationStatus`

### Field intent

- `schemaId`: versioned top-level adapter contract identity
- `adapterId`: deterministic adapter run identity
- `provider`: authoritative upstream provider identity
- `providerVersion`: upstream schema or dataset version
- `importVersion`: GrowGo-side import or preparation version
- `geographicArea`: area covered by the adapted package
- `sourceTimestamps`: capture, refresh, and import timing data
- `sourceReferences`: provider-level source reference set
- `normalizedOutputs`: normalized provider-neutral feature bundles
- `normalizationStatus`: completeness and transformation state
- `validationStatus`: quality and determinism validation summary

### Suggested shape

```json
{
  "schemaId": "SOURCE_ADAPTER_LAYER_001",
  "adapterId": "SOURCE_ADAPTER_001",
  "provider": {},
  "providerVersion": {},
  "importVersion": "IMPORT_VERSION_001",
  "geographicArea": {},
  "sourceTimestamps": {},
  "sourceReferences": [],
  "normalizedOutputs": {},
  "normalizationStatus": {},
  "validationStatus": {}
}
```

## 5. Source Schemas

These describe authoritative provider-side source packages before normalization.

### MAP_DATA_SOURCE_001

Purpose:

- describe imported map-network source data

Required fields:

- `schemaId`
- `sourceId`
- `provider`
- `providerVersion`
- `featureSetVersion`
- `geographicArea`
- `roadFeatures`
- `trailFeatures`
- `pathFeatures`
- `transportRouteFeatures`
- `sourceMetadata`

Examples:

- OSM roads
- path networks
- trail networks
- transport routes

### TERRAIN_DATA_SOURCE_001

Purpose:

- describe imported terrain and landform source data

Required fields:

- `schemaId`
- `sourceId`
- `provider`
- `providerVersion`
- `featureSetVersion`
- `geographicArea`
- `elevationFeatures`
- `terrainFeatures`
- `landformFeatures`
- `biomeFeatures`
- `sourceMetadata`

Examples:

- elevation providers
- terrain rasters
- landform datasets

### POI_DATA_SOURCE_001

Purpose:

- describe imported destination and service source data

Required fields:

- `schemaId`
- `sourceId`
- `provider`
- `providerVersion`
- `featureSetVersion`
- `geographicArea`
- `landmarkFeatures`
- `attractionFeatures`
- `serviceFeatures`
- `culturalFeatures`
- `sourceMetadata`

Examples:

- attractions
- services
- landmarks
- cultural locations

### NATURAL_DATA_SOURCE_001

Purpose:

- describe imported natural feature source data

Required fields:

- `schemaId`
- `sourceId`
- `provider`
- `providerVersion`
- `featureSetVersion`
- `geographicArea`
- `beachFeatures`
- `forestFeatures`
- `parkFeatures`
- `reserveFeatures`
- `waterwayFeatures`
- `sourceMetadata`

Examples:

- beaches
- forests
- parks
- reserves
- waterways

## 6. Provenance Schema

### Schema ID

- `PROVENANCE_RECORD_001`

### Required fields

- `schemaId`
- `provider`
- `sourceId`
- `originalType`
- `providerVersion`
- `importVersion`
- `normalizationVersion`
- `importBatchId`
- `normalizationRuleId`

### Field intent

- `provider`: authoritative upstream provider name
- `sourceId`: original provider feature identifier
- `originalType`: original provider feature type
- `providerVersion`: upstream provider version
- `importVersion`: adapter import-version identity
- `normalizationVersion`: normalization contract version
- `importBatchId`: import batch identity
- `normalizationRuleId`: deterministic rule used to normalize the feature

### Provenance trace purpose

Source Feature

↓

Normalized Feature

↓

GrowGo Interpretation

↓

Gameplay Object

Rule:

- every normalized feature must carry at least one valid `PROVENANCE_RECORD_001`

## 7. Normalized Geography Schema

### Schema ID

- `NORMALIZED_GEOGRAPHY_DATA_001`

### Includes

- coastline
- rivers
- terrain
- elevation
- biome
- protected areas

### Required fields

- `schemaId`
- `normalizedId`
- `boundary`
- `coastlineFeatures`
- `riverFeatures`
- `terrainBands`
- `elevationBands`
- `biomeClassification`
- `protectedAreaFeatures`
- `provenance`

### Rule

- normalized geography may simplify provider naming, but must not alter geographic truth

## 8. Normalized Road Schema

### Schema ID

- `NORMALIZED_ROAD_DATA_001`

### Includes

- road ID
- geometry reference
- road type
- hierarchy
- accessibility
- source reference

### Required fields

- `schemaId`
- `normalizedId`
- `roadSegments`
- `trailSegments`
- `pathSegments`
- `transportRoutes`
- `networkHierarchy`
- `accessibilityRules`
- `provenance`

### Support

- roads
- trails
- paths
- transport routes

### Rule

- hierarchy and access may be standardized, but provider geometry and identity must remain traceable

## 9. Normalized Settlement Schema

### Schema ID

- `NORMALIZED_SETTLEMENT_DATA_001`

### Includes

- settlement ID
- type
- boundary
- density
- source reference

### Required fields

- `schemaId`
- `normalizedId`
- `cityRecords`
- `townRecords`
- `suburbRecords`
- `villageRecords`
- `settlementDensity`
- `settlementBoundaries`
- `provenance`

### Rule

- settlement density may be normalized into GrowGo categories, but source settlement identity must remain intact

## 10. Normalized POI Schema

### Schema ID

- `NORMALIZED_POI_DATA_001`

### Includes

- POI ID
- category
- location
- source reference
- confidence

### Required fields

- `schemaId`
- `normalizedId`
- `landmarkRecords`
- `attractionRecords`
- `serviceRecords`
- `culturalLocationRecords`
- `categoryMapping`
- `confidenceHints`
- `provenance`

### Rule

- provider-specific categories may map into GrowGo-neutral categories, but unsupported categories must be flagged instead of silently reassigned

## 11. Normalized Natural Feature Schema

### Schema ID

- `NORMALIZED_NATURAL_FEATURE_DATA_001`

### Includes

- feature ID
- type
- geometry
- accessibility
- source reference

### Required fields

- `schemaId`
- `normalizedId`
- `beachFeatures`
- `forestFeatures`
- `parkFeatures`
- `reserveFeatures`
- `waterwayFeatures`
- `accessibilityHints`
- `provenance`

### Rule

- natural features may be grouped into shared normalized categories, but source-backed boundaries and identities must be preserved

## 12. Region Package Schema

### Schema ID

- `GROWGO_REGION_PACKAGE_001`

### Includes

- normalized geography
- normalized roads
- normalized settlements
- normalized POIs
- normalized natural features
- interpretation metadata
- cache metadata

### Required fields

- `schemaId`
- `packageId`
- `geographicArea`
- `normalizedGeographyRef`
- `normalizedRoadDataRef`
- `normalizedSettlementDataRef`
- `normalizedPoiDataRef`
- `normalizedNaturalFeatureDataRef`
- `interpretationMetadata`
- `cacheMetadata`
- `packageValidation`

### Rule

- the region package is a reusable storage and delivery unit
- it must not change normalized truth
- it exists to support caching, regional reuse, and future device delivery boundaries

## 13. Source Adapter Contract Rules

The adapter contract must define:

- adapter ID
- provider
- provider version
- import version
- geographic area
- source timestamps
- normalization status
- validation status

### Normalization status

Should include:

- `status`
- `normalizedFeatureCounts`
- `unsupportedFeatureCounts`
- `droppedFeatureCounts`
- `normalizationRuleVersion`

### Validation status

Should include:

- `deterministic`
- `provenancePreserved`
- `geometryValid`
- `duplicatesResolved`
- `stalenessAccepted`
- `interpretationCompatible`

## 14. Data Quality Validation

Required checks:

- invalid coordinates
- duplicate features
- missing provenance
- unsupported types
- stale versions
- incomplete geometry

### Invalid coordinates

Rule:

- coordinates outside valid geographic bounds must fail validation

### Duplicate features

Rule:

- duplicate features may only be collapsed with deterministic identity rules and preserved provenance

### Missing provenance

Rule:

- features without provenance must not be treated as interpretation-ready

### Unsupported types

Rule:

- unsupported provider types must be flagged and excluded or routed to future support categories

### Stale versions

Rule:

- stale source packages must be marked explicitly so downstream systems can decide whether to accept, refresh, or degrade them

### Incomplete geometry

Rule:

- features that require geometry but do not contain it must fail compatibility or be excluded with explanation

## 15. Determinism Contract

The adapter layer must guarantee:

same source package

=

same normalized output

=

same interpretation result

Not allowed:

- hidden randomization
- non-deterministic feature ordering
- unstable duplicate resolution
- implicit category reassignment based on runtime context

## 16. Interpretation Compatibility

Normalized outputs must be directly compatible with:

- `GEOGRAPHY_INPUT_001`
- `ROAD_NETWORK_INPUT_001`
- `SETTLEMENT_INPUT_001`
- `POI_INPUT_001`
- `NATURAL_FEATURE_INPUT_001`

Compatibility requires:

- required field completeness
- stable provenance
- valid geometry and coordinates
- provider-neutral feature naming
- deterministic normalized feature ordering

## 17. Implementation Readiness

This machine-readable contract is ready to support:

1. deterministic local fixture adapters
2. source-package validators
3. provenance-preserving normalization logic
4. region package builders
5. interpretation compatibility tests
6. later controlled OSM-backed adapter work

Recommended next step:

- implement a deterministic local source adapter foundation that emits `SOURCE_ADAPTER_LAYER_001` and `GROWGO_REGION_PACKAGE_001` from fixture packages before any live provider integration

## 18. Readiness Status

Session 95 status:

- `READY FOR SOURCE ADAPTER IMPLEMENTATION FOUNDATION`

Reason:

- the provider-neutral boundary is now machine-readable
- provenance and normalized output rules are explicit
- region packaging is defined
- determinism and validation expectations are clear
- the contract stays aligned with the real-world authoritative-data rule
