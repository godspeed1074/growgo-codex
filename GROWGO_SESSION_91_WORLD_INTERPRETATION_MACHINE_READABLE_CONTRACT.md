# GROWGO SESSION 91 — WORLD INTERPRETATION MACHINE READABLE CONTRACT

## Session Scope

This session defines the machine-readable contract for:

- `WORLD_INTERPRETATION_LAYER_001`

Purpose:

- create the deterministic contract that bridges real-world source data into GrowGo gameplay and presentation interpretation without replacing source geography

This session creates schemas and contracts only.

This session does not:

- implement OSM import
- modify backend systems
- modify renderer systems
- create assets
- create gameplay systems
- create world generator code
- modify registered assets

## Files Created

- `GROWGO_SESSION_91_WORLD_INTERPRETATION_MACHINE_READABLE_CONTRACT.md`

## Files Changed

- none

## 1. Source Of Truth

This contract is based on:

- `GROWGO_SESSION_90_WORLD_INTERPRETATION_INTEGRATION_FOUNDATION.md`
- `GROWGO_SESSION_82_MACHINE_READABLE_WORLD_CONTRACT.md`
- `GROWGO_SESSION_88_EXPANDED_WORLD_COMPOSITION_IMPLEMENTATION.md`
- existing GrowGo OSM architecture decisions

Continuity rules:

- real-world source data remains authoritative
- GrowGo does not create fictional geography in this layer
- interpretation is additive, deterministic, and traceable
- Atlas-facing presentation rules may stylize source truth but must not replace it
- gameplay interpretation must always be explainable from source data plus deterministic classification

## 2. Contract Goal

`WORLD_INTERPRETATION_LAYER_001` must describe a machine-readable bridge that can:

- ingest authoritative real-world input bundles
- classify real-world environments into GrowGo interpretation types
- select environment profiles from evidence
- produce gameplay interpretation rules
- produce Atlas Engine presentation rules
- validate traceability, explainability, and determinism

The contract must be readable by:

- future real-world data adapters
- future OSM-backed ingestion systems
- future classification scripts
- future gameplay interpretation systems
- future Atlas presentation bridges
- future validation scripts

## 3. Schema Set

This session defines these schema identities:

- `WORLD_INTERPRETATION_LAYER_001`
- `GEOGRAPHY_INPUT_001`
- `ROAD_NETWORK_INPUT_001`
- `SETTLEMENT_INPUT_001`
- `POI_INPUT_001`
- `NATURAL_FEATURE_INPUT_001`
- `WORLD_CLASSIFICATION_001`
- `GAMEPLAY_INTERPRETATION_RULE_001`
- `ATLAS_PRESENTATION_RULE_001`
- `INTERPRETATION_VALIDATION_001`

## 4. World Interpretation Layer Schema

### Schema ID

- `WORLD_INTERPRETATION_LAYER_001`

### Required fields

- `schemaId`
- `interpretationId`
- `sourceDataReferences`
- `classificationResults`
- `selectedEnvironmentProfile`
- `gameplayWeighting`
- `atlasPresentationRules`
- `validationState`

### Field intent

- `schemaId`: versioned top-level interpretation contract identity
- `interpretationId`: deterministic interpretation bundle identity
- `sourceDataReferences`: authoritative source-package linkage
- `classificationResults`: explainable world/region/environment classification output
- `selectedEnvironmentProfile`: resolved interpretation profile for the area
- `gameplayWeighting`: gameplay emphasis and traceable opportunity rules
- `atlasPresentationRules`: source-to-presentation interpretation contract
- `validationState`: deterministic validation output

### Suggested shape

```json
{
  "schemaId": "WORLD_INTERPRETATION_LAYER_001",
  "interpretationId": "WORLD_INTERPRETATION_001",
  "sourceDataReferences": {},
  "classificationResults": {},
  "selectedEnvironmentProfile": {},
  "gameplayWeighting": {},
  "atlasPresentationRules": {},
  "validationState": {}
}
```

## 5. Real-World Input Contracts

These source contracts describe authoritative input bundles.

### GEOGRAPHY_INPUT_001

#### Purpose

- define physical-world structure for interpretation

#### Includes

- coastline
- rivers
- elevation
- terrain
- biome
- protected areas

#### Required fields

- `schemaId`
- `inputId`
- `sourceProvider`
- `boundary`
- `coastlineFeatures`
- `riverFeatures`
- `elevationBands`
- `terrainBands`
- `biomeClassification`
- `protectedAreaFeatures`
- `sourceMetadata`

#### Suggested shape

```json
{
  "schemaId": "GEOGRAPHY_INPUT_001",
  "inputId": "GEOGRAPHY_INPUT_A",
  "sourceProvider": "future_osm_provider",
  "boundary": {},
  "coastlineFeatures": [],
  "riverFeatures": [],
  "elevationBands": [],
  "terrainBands": [],
  "biomeClassification": [],
  "protectedAreaFeatures": [],
  "sourceMetadata": {}
}
```

### ROAD_NETWORK_INPUT_001

#### Purpose

- define real access and movement structure

#### Includes

- roads
- trails
- paths
- transport routes
- road hierarchy

#### Required fields

- `schemaId`
- `inputId`
- `sourceProvider`
- `roadSegments`
- `trailSegments`
- `pathSegments`
- `transportRoutes`
- `roadHierarchy`
- `sourceMetadata`

### SETTLEMENT_INPUT_001

#### Purpose

- define real settlement structure and density

#### Includes

- cities
- towns
- suburbs
- villages
- settlement density

#### Required fields

- `schemaId`
- `inputId`
- `sourceProvider`
- `cityRecords`
- `townRecords`
- `suburbRecords`
- `villageRecords`
- `settlementDensity`
- `sourceMetadata`

### POI_INPUT_001

#### Purpose

- define human-interest and service anchors

#### Includes

- landmarks
- attractions
- services
- cultural locations

#### Required fields

- `schemaId`
- `inputId`
- `sourceProvider`
- `landmarkRecords`
- `attractionRecords`
- `serviceRecords`
- `culturalLocationRecords`
- `sourceMetadata`

### NATURAL_FEATURE_INPUT_001

#### Purpose

- define recreational and protected natural-space structure

#### Includes

- beaches
- parks
- forests
- reserves
- natural attractions

#### Required fields

- `schemaId`
- `inputId`
- `sourceProvider`
- `beachFeatures`
- `parkFeatures`
- `forestFeatures`
- `reserveFeatures`
- `naturalAttractionRecords`
- `sourceMetadata`

## 6. Source Data Reference Contract

`WORLD_INTERPRETATION_LAYER_001` must preserve authoritative source linkage.

### Required source-reference fields

- `geographyInputRef`
- `roadNetworkInputRef`
- `settlementInputRef`
- `poiInputRef`
- `naturalFeatureInputRef`
- `providerBoundary`
- `sourceTimestamp`
- `sourceDeterminismMode`

### Required behaviours

- source geometry remains authoritative
- interpreted outputs reference source inputs by stable identity
- missing source data reduces confidence rather than inventing unsupported features
- local fixture providers and future OSM providers must fit the same interpretation boundary

## 7. World Classification Schema

### Schema ID

- `WORLD_CLASSIFICATION_001`

### Purpose

- determine the character of a real location

### Inputs

- geography
- roads
- settlement density
- POIs
- terrain
- natural features

### Outputs

- coastal
- rural
- urban
- mountain
- tourism
- remote

### Required fields

- `schemaId`
- `classificationId`
- `worldTypeScores`
- `primaryWorldType`
- `secondaryWorldTypes`
- `regionTypeHints`
- `gameplayEmphasisHints`
- `confidenceScore`
- `reasons`
- `sourceEvidence`

### Classification rule intent

- `worldTypeScores`: weighted score map for each supported interpretation category
- `primaryWorldType`: most strongly supported world interpretation
- `secondaryWorldTypes`: additional supported environment signals
- `regionTypeHints`: suggested lower-level region interpretation hints
- `gameplayEmphasisHints`: deterministic gameplay-weighting direction
- `confidenceScore`: normalized overall classification confidence
- `reasons`: human-readable explanation summaries
- `sourceEvidence`: structured references to source features that support the decision

### Suggested shape

```json
{
  "schemaId": "WORLD_CLASSIFICATION_001",
  "classificationId": "WORLD_CLASSIFICATION_A",
  "worldTypeScores": {
    "coastal": 0.91,
    "tourism": 0.74,
    "urban": 0.18
  },
  "primaryWorldType": "coastal",
  "secondaryWorldTypes": ["tourism"],
  "regionTypeHints": [],
  "gameplayEmphasisHints": [],
  "confidenceScore": 0.89,
  "reasons": [],
  "sourceEvidence": []
}
```

## 8. Profile Selection Rules

The interpretation layer must resolve environment profiles from evidence, not from arbitrary theme selection.

### Coastal profile selection

Signals:

- coastline proximity
- beaches
- marine POIs

Expected interpretation emphasis:

- scenic routes
- coastal achievements
- waterfront exploration

### Outback profile selection

Signals:

- low density
- long distances
- rural features

Expected interpretation emphasis:

- long-haul travel
- remote discovery
- sparse high-value destinations

### Mountain profile selection

Signals:

- elevation
- forests
- trails

Expected interpretation emphasis:

- climbing or walking challenges
- protected-area exploration
- terrain-constrained routing

### Tourism profile selection

Signals:

- attraction density
- visitor locations

Expected interpretation emphasis:

- destination loops
- collection opportunities
- sightseeing goals

### Urban profile selection

Signals:

- population density
- transport intensity

Expected interpretation emphasis:

- multi-hub travel
- destination clustering
- higher interaction density

## 9. Gameplay Interpretation Schema

### Schema ID

- `GAMEPLAY_INTERPRETATION_RULE_001`

### Purpose

- translate real features into deterministic GrowGo gameplay layers

### Required fields

- `schemaId`
- `ruleId`
- `sourceFeatureType`
- `sourceFeatureRefs`
- `interpretedGameplayType`
- `achievementRules`
- `questRules`
- `collectionRules`
- `explorationRules`
- `weighting`
- `traceability`

### Rule intent

- `sourceFeatureType`: real-world origin type such as beach, landmark, trail, settlement, or service cluster
- `sourceFeatureRefs`: source feature identities
- `interpretedGameplayType`: gameplay outcome category
- `achievementRules`: achievement opportunities created from the source
- `questRules`: quest potential created from the source
- `collectionRules`: collectible or checklist opportunity
- `explorationRules`: movement or discovery opportunity
- `weighting`: gameplay importance or frequency value
- `traceability`: evidence path back to source records and classification logic

### Example mappings

#### Beach

Real feature:

- beach

GrowGo gameplay layer:

- coastal achievement
- collection opportunity
- exploration route

#### Landmark

Real feature:

- landmark

GrowGo gameplay layer:

- quest location
- achievement
- discovery reward

#### Trail

Real feature:

- trail

GrowGo gameplay layer:

- walking challenge
- exploration route

## 10. Atlas Presentation Schema

### Schema ID

- `ATLAS_PRESENTATION_RULE_001`

### Purpose

- translate authoritative source features into approved 2.5D presentation categories

### Required fields

- `schemaId`
- `ruleId`
- `sourceFeatureType`
- `sourceFeatureRefs`
- `presentationCategory`
- `presentationPriority`
- `styleProfile`
- `geometryPreservationMode`
- `traceability`

### Rule intent

- `sourceFeatureType`: real feature origin
- `sourceFeatureRefs`: authoritative source identities
- `presentationCategory`: target Atlas-facing presentation class
- `presentationPriority`: readability priority
- `styleProfile`: chosen 2.5D interpretation style family
- `geometryPreservationMode`: how source truth is preserved in presentation
- `traceability`: proof that presentation came from source truth

### Example mappings

#### Real road

Presentation:

- 2.5D road presentation

#### Real building footprint

Presentation:

- building interpretation

#### Real park

Presentation:

- green-space presentation

#### Real coastline

Presentation:

- water/cliff/beach presentation

## 11. Validation Schema

### Schema ID

- `INTERPRETATION_VALIDATION_001`

### Required fields

- `schemaId`
- `validationId`
- `sourceIntegrityValid`
- `classificationExplainable`
- `gameplayTraceabilityValid`
- `presentationTraceabilityValid`
- `deterministicOutputValid`
- `validationPassed`
- `reasons`

### Validation groups

#### Source integrity

Checks:

- no fictional geography added
- source references preserved

#### Classification

Checks:

- profile selection explainable
- evidence available

#### Gameplay

Checks:

- gameplay traces to real features

#### Presentation

Checks:

- Atlas rules match source type

#### Determinism

Checks:

- same source data = same interpretation

### Suggested shape

```json
{
  "schemaId": "INTERPRETATION_VALIDATION_001",
  "validationId": "INTERPRETATION_VALIDATION_A",
  "sourceIntegrityValid": true,
  "classificationExplainable": true,
  "gameplayTraceabilityValid": true,
  "presentationTraceabilityValid": true,
  "deterministicOutputValid": true,
  "validationPassed": true,
  "reasons": []
}
```

## 12. Deterministic Behaviour Contract

The interpretation contract must remain deterministic.

Same source inputs plus same interpretation configuration must produce:

- same classification results
- same selected environment profile
- same gameplay-weighting outputs
- same Atlas presentation outputs
- same validation outputs

Not allowed:

- hidden randomization
- unverifiable profile switching
- untraceable gameplay generation

## 13. Explainability Contract

`WORLD_INTERPRETATION_LAYER_001` must remain explainable at every step.

Every classification or interpretation result should support:

- `why was this profile selected`
- `which source features caused this classification`
- `which real feature produced this gameplay opportunity`
- `which real feature produced this presentation rule`

Minimum explainability outputs:

- score
- reason
- evidence reference

## 14. Atlas And Gameplay Boundary Rules

The interpretation contract must preserve clean boundaries.

### Atlas boundary

- Atlas receives presentation rules, not authority to alter source truth
- style may simplify or stylize but must preserve positional meaning

### Gameplay boundary

- gameplay receives interpreted opportunities, not permission to invent unsupported geography
- quests, achievements, and collections must stay anchored to source-backed interpreted features

## 15. Implementation Readiness

This contract is ready for future implementation work in stages:

1. normalized input bundle adapters
2. classification engine contract implementation
3. profile-selection engine contract implementation
4. gameplay interpretation traceability rules
5. Atlas presentation bridge rules
6. validation and audit tooling

Recommended next step:

- implement a deterministic data structure or passive foundation module that instantiates `WORLD_INTERPRETATION_LAYER_001` from local fixture inputs before any live OSM ingestion work

## 16. Readiness Status

Session 91 status:

- `READY FOR DETERMINISTIC WORLD INTERPRETATION FOUNDATION IMPLEMENTATION`

Reason:

- the real-world source boundary is explicit
- gameplay and presentation interpretation are separately defined
- classification, traceability, and validation contracts are machine-readable
- the contract preserves continuity with existing world, Atlas, and OSM preparation decisions
