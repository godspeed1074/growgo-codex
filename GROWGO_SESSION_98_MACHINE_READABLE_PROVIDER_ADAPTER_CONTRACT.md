# GROWGO SESSION 98 — MACHINE READABLE PROVIDER ADAPTER CONTRACT

## Session Scope

This session defines the machine-readable contract for:

- `PROVIDER_ADAPTER_LAYER_001`

Purpose:

- create the provider-facing contract that translates authoritative external source formats into `SOURCE_ADAPTER_LAYER_001` compatible source bundles

This session creates schemas and contracts only.

This session does not:

- implement live providers
- connect APIs
- implement OSM import
- modify backend systems
- modify renderer systems
- create assets
- create gameplay systems

## Files Created

- `GROWGO_SESSION_98_MACHINE_READABLE_PROVIDER_ADAPTER_CONTRACT.md`

## Files Changed

- none

## 1. Source Of Truth

This contract is based on:

- `GROWGO_SESSION_97_PROVIDER_ADAPTER_FOUNDATION.md`
- `GROWGO_SESSION_95_MACHINE_READABLE_SOURCE_ADAPTER_CONTRACT.md`
- `GROWGO_SESSION_96_DETERMINISTIC_FIXTURE_SOURCE_ADAPTER_IMPLEMENTATION.md`

Continuity rules:

- provider data is authoritative
- provider adapters translate formats, map fields, preserve provenance, and validate compatibility
- provider adapters do not invent geography, create missing places, or modify source truth
- provider adapter output must remain deterministic and compatible with `SOURCE_ADAPTER_LAYER_001`

## 2. Contract Goal

`PROVIDER_ADAPTER_LAYER_001` must define:

- provider adapter identities
- supported provider families
- provider field mapping rules
- provenance preservation rules
- validation contracts
- deterministic compatibility rules for `SOURCE_DATA_BUNDLE_001` output

The contract must be readable by:

- future OpenStreetMap adapters
- future terrain data adapters
- future government dataset adapters
- future tourism dataset adapters
- provider payload validators
- source-bundle compatibility validators

## 3. Schema Set

This session defines these schema identities:

- `PROVIDER_ADAPTER_LAYER_001`
- `PROVIDER_ADAPTER_001`
- `MAP_PROVIDER_ADAPTER_001`
- `TERRAIN_PROVIDER_ADAPTER_001`
- `POI_PROVIDER_ADAPTER_001`
- `NATURAL_FEATURE_PROVIDER_ADAPTER_001`
- `PROVIDER_FIELD_MAPPING_001`
- `PROVIDER_VALIDATION_001`

## 4. Provider Adapter Layer Schema

### Schema ID

- `PROVIDER_ADAPTER_LAYER_001`

### Required fields

- `schemaId`
- `layerId`
- `supportedAdapters`
- `normalizationTarget`
- `validationContracts`
- `compatibilityNotes`

### Field intent

- `schemaId`: versioned top-level provider adapter contract identity
- `layerId`: deterministic identity for the provider adapter layer definition
- `supportedAdapters`: provider adapter families available in this layer
- `normalizationTarget`: the downstream contract target for all provider adapters
- `validationContracts`: validation contracts that provider adapters must satisfy
- `compatibilityNotes`: future-provider compatibility and integration notes

### Suggested shape

```json
{
  "schemaId": "PROVIDER_ADAPTER_LAYER_001",
  "layerId": "PROVIDER_ADAPTER_LAYER_001",
  "supportedAdapters": [],
  "normalizationTarget": {},
  "validationContracts": [],
  "compatibilityNotes": {}
}
```

## 5. Provider Adapter Schema

### Schema ID

- `PROVIDER_ADAPTER_001`

### Required fields

- `schemaId`
- `adapterId`
- `providerType`
- `providerName`
- `providerVersion`
- `supportedDataTypes`
- `mappingVersion`
- `normalizationTarget`
- `validationStatus`

### Field intent

- `schemaId`: base provider adapter contract schema
- `adapterId`: stable provider adapter identity
- `providerType`: provider family classification
- `providerName`: concrete upstream provider identity
- `providerVersion`: upstream provider version or schema version
- `supportedDataTypes`: source data classes this adapter can convert
- `mappingVersion`: deterministic mapping rule version
- `normalizationTarget`: downstream GrowGo contract target
- `validationStatus`: validation state expected before handoff to `SOURCE_ADAPTER_LAYER_001`

### Suggested shape

```json
{
  "schemaId": "PROVIDER_ADAPTER_001",
  "adapterId": "PROVIDER_ADAPTER_001",
  "providerType": "MAP_PROVIDER",
  "providerName": "example-provider",
  "providerVersion": "1.0",
  "supportedDataTypes": [],
  "mappingVersion": "MAPPING_VERSION_001",
  "normalizationTarget": "SOURCE_DATA_BUNDLE_001",
  "validationStatus": {}
}
```

## 6. Map Provider Adapter Schema

### Schema ID

- `MAP_PROVIDER_ADAPTER_001`

### Purpose

- convert mapping-provider data into GrowGo-compatible source bundle road, path, boundary, and transport structures

### Support

- roads
- trails
- paths
- boundaries
- transport features

### Required fields

- `schemaId`
- `adapterId`
- `providerType`
- `providerName`
- `providerVersion`
- `supportedDataTypes`
- `mappingVersion`
- `roadMappings`
- `accessMappings`
- `boundaryMappings`
- `validationStatus`

### Mapping examples

Provider field:

`highway/type`

↓

GrowGo:

`NORMALIZED_ROAD_DATA_001 road type`

Provider field:

`surface/access`

↓

GrowGo:

`NORMALIZED_ROAD_DATA_001 accessibility metadata`

## 7. Terrain Provider Adapter Schema

### Schema ID

- `TERRAIN_PROVIDER_ADAPTER_001`

### Purpose

- convert terrain and elevation datasets into GrowGo-compatible geography structures

### Support

- elevation
- terrain
- landform
- slope

### Normalization target

- `NORMALIZED_GEOGRAPHY_DATA_001`

### Required fields

- `schemaId`
- `adapterId`
- `providerType`
- `providerName`
- `providerVersion`
- `supportedDataTypes`
- `mappingVersion`
- `elevationMappings`
- `terrainMappings`
- `landformMappings`
- `validationStatus`

## 8. POI Provider Adapter Schema

### Schema ID

- `POI_PROVIDER_ADAPTER_001`

### Purpose

- convert attractions, landmarks, services, and cultural locations into GrowGo-compatible POI structures

### Support

- attractions
- landmarks
- services
- cultural locations

### Normalization target

- `NORMALIZED_POI_DATA_001`

### Required fields

- `schemaId`
- `adapterId`
- `providerType`
- `providerName`
- `providerVersion`
- `supportedDataTypes`
- `mappingVersion`
- `poiCategoryMappings`
- `confidenceMappings`
- `validationStatus`

## 9. Natural Feature Provider Adapter Schema

### Schema ID

- `NATURAL_FEATURE_PROVIDER_ADAPTER_001`

### Purpose

- convert environmental and natural datasets into GrowGo-compatible natural feature structures

### Support

- beaches
- forests
- parks
- reserves
- waterways

### Normalization target

- `NORMALIZED_NATURAL_FEATURE_DATA_001`

### Required fields

- `schemaId`
- `adapterId`
- `providerType`
- `providerName`
- `providerVersion`
- `supportedDataTypes`
- `mappingVersion`
- `naturalTypeMappings`
- `accessibilityMappings`
- `validationStatus`

## 10. Provider Field Mapping Schema

### Schema ID

- `PROVIDER_FIELD_MAPPING_001`

### Required fields

- `schemaId`
- `providerField`
- `providerType`
- `growgoTargetField`
- `transformationRule`
- `confidenceHandling`

### Field intent

- `providerField`: original provider-side field identity
- `providerType`: provider family the field belongs to
- `growgoTargetField`: destination GrowGo field
- `transformationRule`: deterministic transformation or translation rule
- `confidenceHandling`: rule for preserving, defaulting, or flagging confidence values

### Suggested shape

```json
{
  "schemaId": "PROVIDER_FIELD_MAPPING_001",
  "providerField": "highway",
  "providerType": "MAP_PROVIDER",
  "growgoTargetField": "roadFeatures[].type",
  "transformationRule": "MAP_HIGHWAY_TO_GROWGO_ROAD_TYPE",
  "confidenceHandling": "DIRECT"
}
```

## 11. Field Mapping System

Provider field mappings must follow:

Provider field

↓

Provider adapter rule

↓

GrowGo source bundle field

↓

`SOURCE_ADAPTER_LAYER_001`

### Required mapping behaviour

- one provider field may map directly to one GrowGo field
- multiple provider fields may combine only through deterministic rules
- unsupported provider fields must be ignored safely or flagged explicitly
- missing provider fields must never be replaced with fabricated values
- low-confidence mappings must be marked for downstream validation

### Example mappings

`highway`

↓

`roadFeatures[].type`

`surface`

↓

`roadFeatures[].properties.surface`

`access`

↓

`roadFeatures[].properties.access`

`poi_category`

↓

`poiFeatures[].type`

`natural_type`

↓

`naturalFeatures[].type`

`elevation_value`

↓

`geographyFeatures[].properties.averageMeters`

## 12. Provenance Requirements

Every adapted feature must retain:

- provider name
- provider ID
- original type
- provider version
- mapping version

These must remain traceable through:

Provider Record

↓

Provider Adapter Output

↓

`SOURCE_ADAPTER_LAYER_001`

↓

`PROVENANCE_RECORD_001`

Required rule:

- provider adapters may rename or regroup fields for compatibility, but they must not drop provider identity or original type information

## 13. Provider Validation Schema

### Schema ID

- `PROVIDER_VALIDATION_001`

### Required fields

- `schemaId`
- `providerMetadataExists`
- `mappingsValid`
- `requiredFieldsPresent`
- `unsupportedFieldsHandled`
- `provenancePreserved`
- `normalizedOutputCompatible`
- `deterministicConversion`

### Suggested shape

```json
{
  "schemaId": "PROVIDER_VALIDATION_001",
  "providerMetadataExists": true,
  "mappingsValid": true,
  "requiredFieldsPresent": true,
  "unsupportedFieldsHandled": true,
  "provenancePreserved": true,
  "normalizedOutputCompatible": true,
  "deterministicConversion": true
}
```

## 14. Validation Rules

Provider adapters must validate:

- provider metadata exists
- mappings valid
- required fields present
- unsupported fields handled
- provenance preserved
- normalized output compatible
- deterministic conversion

### Validation gate details

`providerMetadataExists`

- provider identity, version, and timestamps are present

`mappingsValid`

- all active mappings resolve to approved GrowGo target fields

`requiredFieldsPresent`

- minimum fields required for compatible source-bundle output are present

`unsupportedFieldsHandled`

- unsupported fields are ignored safely or flagged without breaking deterministic output

`provenancePreserved`

- provider name, provider ID, original type, and version survive conversion

`normalizedOutputCompatible`

- adapter output is compatible with `SOURCE_DATA_BUNDLE_001` and therefore usable by `SOURCE_ADAPTER_LAYER_001`

`deterministicConversion`

- same provider package produces the same provider-adapter output

## 15. Error States

Provider adapters must define these machine-readable error outcomes.

### Unsupported provider

- rejected safely
- no partial fabricated output allowed

### Missing field

- warning
- continue only if source-bundle compatibility remains valid

### Invalid geometry

- rejected
- geometry must not enter `SOURCE_ADAPTER_LAYER_001`

### Low confidence mapping

- flagged
- downstream validation must be able to inspect the mapping state

## 16. Compatibility Notes

This contract is designed to support:

- OpenStreetMap
- terrain datasets
- government datasets
- tourism datasets
- satellite-derived datasets

Compatibility expectation:

- provider-specific payloads end at the provider adapter boundary
- `SOURCE_ADAPTER_LAYER_001` receives only provider-neutral source bundle structures

## 17. Determinism Contract

Provider adapters must guarantee:

same provider payload

=

same provider adapter output

=

same `SOURCE_ADAPTER_LAYER_001` input

Not allowed:

- hidden randomization
- unstable field ordering
- provider-record merging without deterministic rules
- silent reassignment of unsupported categories
- runtime-dependent geometry rewriting

## 18. Implementation Readiness

This machine-readable contract is ready to support:

1. provider-specific adapter definitions
2. deterministic field mapping tables
3. provider payload validators
4. source-bundle compatibility validators
5. controlled future OSM adapter work
6. future terrain, government, tourism, and satellite dataset adapters

Recommended next step:

- implement a deterministic provider adapter prototype that converts one controlled provider-style payload into `SOURCE_DATA_BUNDLE_001` for `SOURCE_ADAPTER_LAYER_001` validation

## 19. Readiness Status

Session 98 status:

- `READY FOR PROVIDER ADAPTER PROTOTYPE IMPLEMENTATION`

Reason:

- provider adapter schemas are now machine-readable
- mapping, provenance, validation, and error-state rules are explicit
- compatibility with `SOURCE_ADAPTER_LAYER_001` is clearly defined
- future provider integrations can proceed without weakening the authoritative-source rule
