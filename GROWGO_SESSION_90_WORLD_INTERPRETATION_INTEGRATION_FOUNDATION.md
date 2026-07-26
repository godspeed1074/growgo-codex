# GROWGO SESSION 90 — WORLD INTERPRETATION INTEGRATION FOUNDATION

## Session Scope

This session defines the architecture foundation for:

- `WORLD_INTERPRETATION_LAYER_001`

Purpose:

- connect real-world geographic and settlement data to the GrowGo World Interpretation Engine without replacing source geography

This session is planning and specification only.

This session does not:

- implement OSM import
- modify backend systems
- create renderer changes
- create new assets
- create world generator code
- create gameplay systems

## Files Created

- `GROWGO_SESSION_90_WORLD_INTERPRETATION_INTEGRATION_FOUNDATION.md`

## Files Changed

- none

## 1. Foundation Goal

GrowGo does not invent fictional geography for this layer.

Real-world sources remain authoritative for:

- roads
- coastlines
- terrain
- settlements
- landmarks
- natural areas

GrowGo adds:

- gameplay interpretation
- quests
- achievements
- collections
- 2.5D presentation rules
- procedural gameplay layers

Core architectural rule:

- source geography is preserved
- interpretation is additive
- every interpreted gameplay layer must trace back to a real-world source record or deterministic classification result

## 2. Architecture Position

`WORLD_INTERPRETATION_LAYER_001` sits between:

1. real-world data preparation
2. deterministic world classification
3. profile-driven gameplay emphasis
4. Atlas Engine presentation
5. player interaction systems

It does not replace:

- raw map data providers
- world/region preview contracts
- Atlas rendering systems
- gameplay runtime systems

It acts as the explainable translation layer between them.

## 3. Real-World Input Model

The interpretation layer consumes machine-readable real-world input packages.

### GEOGRAPHY_INPUT_001

Purpose:

- provide authoritative physical-world structure

Includes:

- coastlines
- rivers
- terrain
- elevation
- biome information

Required fields:

- `inputId`
- `sourceProvider`
- `boundary`
- `coastlineFeatures`
- `riverFeatures`
- `terrainBands`
- `elevationBands`
- `biomeClassification`
- `sourceMetadata`

Interpretation role:

- determines whether the world reads coastal, inland, alpine, wetland, remote, or mixed

### ROAD_NETWORK_INPUT_001

Purpose:

- provide authoritative movement and access structure

Includes:

- roads
- trails
- paths
- transport routes

Required fields:

- `inputId`
- `sourceProvider`
- `roadSegments`
- `trailSegments`
- `pathSegments`
- `transportCorridors`
- `networkHierarchy`
- `sourceMetadata`

Interpretation role:

- drives travel behaviour, corridor logic, access difficulty, and route density

### SETTLEMENT_INPUT_001

Purpose:

- provide authoritative human-settlement distribution

Includes:

- towns
- suburbs
- villages
- cities

Required fields:

- `inputId`
- `sourceProvider`
- `settlementPoints`
- `settlementBoundaries`
- `populationHints`
- `densityHints`
- `serviceIntensityHints`
- `sourceMetadata`

Interpretation role:

- drives urban, suburban, rural, remote, or mixed settlement classification

### POI_INPUT_001

Purpose:

- provide authoritative human-interest and service anchors

Includes:

- landmarks
- attractions
- services
- cultural locations

Required fields:

- `inputId`
- `sourceProvider`
- `poiRecords`
- `poiCategories`
- `tourismHints`
- `serviceClusters`
- `culturalSignificanceHints`
- `sourceMetadata`

Interpretation role:

- drives landmark weighting, tourism emphasis, quest density, and collection opportunities

### NATURAL_FEATURE_INPUT_001

Purpose:

- provide authoritative nature and protected-space structure

Includes:

- parks
- reserves
- forests
- beaches
- protected areas

Required fields:

- `inputId`
- `sourceProvider`
- `naturalFeatureRecords`
- `protectionStatus`
- `accessHints`
- `recreationHints`
- `sourceMetadata`

Interpretation role:

- drives exploration value, scenic weighting, recreation paths, and environmental identity

## 4. Real-World Source Boundary

The interpretation layer must preserve a clear source boundary.

Source-provider rules:

- real-world inputs remain source-of-truth records
- interpreted outputs may enrich but must not overwrite source geometry
- every interpreted feature must carry source linkage or deterministic derived linkage
- when source data is incomplete, interpretation may downgrade confidence but must not fabricate arbitrary geography

Provider compatibility direction:

- local deterministic fixture providers remain valid for preparation and testing
- future OSM-backed providers may replace fixture data without changing the interpretation contract

This aligns with the existing passive preparation direction already present in the repo:

- deterministic local provider first
- future OSM compatibility preserved
- no hidden live-network assumptions in the interpretation contract

## 5. Interpretation Pipeline

`WORLD_INTERPRETATION_LAYER_001` defines this pipeline:

### Step 1 — Real-World Data Ingestion

Inputs:

- `GEOGRAPHY_INPUT_001`
- `ROAD_NETWORK_INPUT_001`
- `SETTLEMENT_INPUT_001`
- `POI_INPUT_001`
- `NATURAL_FEATURE_INPUT_001`

Result:

- normalized authoritative input bundle

### Step 2 — Classification Into GrowGo Types

Process:

- classify geography
- classify movement network
- classify settlement pattern
- classify destination density
- classify natural recreation opportunity

Result:

- `WORLD_CLASSIFICATION_001`

### Step 3 — Environment Profile Selection

Process:

- resolve world profile
- resolve region profile
- resolve sub-area emphasis

Result:

- explainable profile selection package

### Step 4 — Gameplay Weighting

Process:

- map real places to gameplay opportunity density
- assign quest, achievement, collection, and exploration potential
- weight travel goals by environment type

Result:

- gameplay interpretation package

### Step 5 — Atlas Engine Presentation Rules

Process:

- convert authoritative map structures into approved 2.5D presentation categories
- preserve spatial truth while adapting visual style

Result:

- Atlas-facing presentation contract

### Step 6 — Player Interaction Systems

Process:

- expose interpreted destinations, routes, and activities to player-facing systems

Result:

- interaction-ready world layer

## 6. World Classification System

Create:

- `WORLD_CLASSIFICATION_001`

Purpose:

- determine the real-world environment identity before gameplay weighting

Inputs:

- geography
- density
- POIs
- transport
- terrain

Outputs:

- world profile
- region profile
- gameplay emphasis
- confidence scores
- classification evidence

Required fields:

- `classificationId`
- `worldProfile`
- `regionProfiles`
- `settlementPattern`
- `transportPattern`
- `landmarkPattern`
- `recreationPattern`
- `gameplayEmphasis`
- `confidenceScores`
- `evidenceTrace`

### Classification categories

Initial required categories:

- `COASTAL`
- `RURAL`
- `URBAN`
- `MOUNTAIN`
- `TOURISM`
- `REMOTE`

These are not mutually exclusive at raw-input level.

The system must support:

- primary identity
- secondary identity
- mixed identity evidence

## 7. Profile Selection Rules

Profile selection must be explainable from source evidence.

### Coastal selection

Signals:

- coastline nearby
- beaches or foreshore features
- marine or waterfront POIs
- scenic road or walking access

Likely result:

- `AUSTRALIAN_COASTAL_WORLD`

Gameplay emphasis:

- scenic discovery
- waterfront achievements
- visitor movement
- destination chains

### Outback selection

Signals:

- low settlement density
- long transport distances
- sparse service nodes
- inland terrain dominance

Likely result:

- `AUSTRALIAN_OUTBACK_WORLD`

Gameplay emphasis:

- long-haul travel
- remote discovery
- sparse high-value landmarks
- endurance-style route goals

### Mountain selection

Signals:

- high elevation
- forested terrain
- trail presence
- constrained corridor logic

Likely result:

- `ALPINE_WORLD`

Gameplay emphasis:

- elevation routes
- protected-area discovery
- remote achievements
- route difficulty variation

### Tourism selection

Signals:

- attraction density
- visitor service clustering
- scenic transport options
- landmark concentration

Likely result:

- `TOURISM_ARCHIPELAGO_WORLD` or tourism-weighted coastal profile

Gameplay emphasis:

- visitor loops
- collection chains
- sightseeing quests
- hub-and-destination travel

### Urban selection

Signals:

- population density
- transport intensity
- multiple service hubs
- continuous settlement fabric

Likely result:

- `METROPOLITAN_EXPANSION_WORLD`

Gameplay emphasis:

- multi-destination routing
- commuter-style travel
- services and logistics
- dense achievement networks

## 8. Gameplay Interpretation Layer

The gameplay layer must translate real places into deterministic play opportunities.

### Example — real beach

Real-world input:

- coastline feature
- beach natural feature
- access path

GrowGo interpretation:

- coastal achievement node
- collection opportunity
- exploration route anchor

Traceability:

- interpreted node references beach source feature IDs

### Example — real landmark

Real-world input:

- named POI
- cultural or scenic importance

GrowGo interpretation:

- quest location
- achievement target
- discovery reward

Traceability:

- interpreted node references source POI record

### Example — real trail

Real-world input:

- trail segment
- terrain difficulty
- protected-area adjacency

GrowGo interpretation:

- walking route
- exploration challenge
- completion path

Traceability:

- interpreted route references source trail chain

### Example — real service town

Real-world input:

- settlement boundary
- road-network role
- service POIs

GrowGo interpretation:

- checkpoint hub
- route resupply logic
- achievement cluster

Traceability:

- interpreted hub references settlement and POI groupings

## 9. Atlas Engine Connection

The Atlas-facing layer does not invent new geography.

It maps authoritative or interpreted real-world structures into approved presentation categories.

### Real road

Source:

- road segment hierarchy

Atlas presentation:

- 2.5D road asset
- road-class style selection
- path readability priority

### Real building footprint

Source:

- building or settlement footprint data

Atlas presentation:

- building interpretation
- density-aware placement category
- silhouette family selection

### Real park

Source:

- natural feature boundary

Atlas presentation:

- green space presentation
- recreation-friendly scenic zone

### Real coastline

Source:

- coastline geometry

Atlas presentation:

- water edge
- beach or cliff interpretation
- scenic boundary treatment

Atlas connection rule:

- presentation changes style, readability, and gameplay affordance
- presentation does not change the real-world positional truth of the source feature

## 10. Deterministic Output Structure

`WORLD_INTERPRETATION_LAYER_001` should eventually emit a deterministic interpretation bundle.

Suggested top-level sections:

- `sourceBundle`
- `classificationBundle`
- `profileSelectionBundle`
- `gameplayInterpretationBundle`
- `atlasPresentationBundle`
- `interactionReadinessBundle`
- `validationBundle`

Important rule:

- the same real-world source inputs plus the same interpretation configuration must produce the same interpreted output

## 11. Validation Rules

The interpretation layer must validate both truth preservation and gameplay usefulness.

### Source preservation

Checks:

- no fictional geography added
- source data preserved
- interpreted routes derive from real route structures
- interpreted landmarks map to real landmarks or deterministic grouped POIs

### Determinism

Checks:

- same source inputs produce same interpretation output
- same profile configuration produces same gameplay weighting
- no hidden randomization inside classification

### Explainability

Checks:

- profile selection explainable
- region classification explainable
- gameplay emphasis explainable
- confidence scores recorded

### Traceability

Checks:

- quests trace back to source POIs, routes, or settlements
- achievements trace back to real locations
- collections trace back to real-world categories
- presentation layers trace back to authoritative map features

### Safety against fictional drift

Checks:

- interpretation never invents unsupported coasts, roads, towns, or landmarks
- missing data causes downgraded confidence or reduced feature output, not invented substitutes

## 12. Implementation Readiness

This foundation is ready to support future implementation work in clearly separated layers:

1. source ingestion adapters
2. normalized authoritative input contracts
3. classification engine
4. profile selection engine
5. gameplay interpretation engine
6. Atlas presentation bridge
7. player-system bridge

Recommended order:

1. define normalized input schemas and validation contracts
2. define `WORLD_CLASSIFICATION_001`
3. define explainable profile-selection rules
4. define gameplay traceability contract
5. define Atlas-facing interpretation bridge

## 13. Readiness Status

Session 90 status:

- `READY FOR MACHINE-READABLE WORLD INTERPRETATION CONTRACT`

Reason:

- the boundary between real-world truth and GrowGo interpretation is now explicit
- profile selection is framed as explainable classification, not fictional generation
- gameplay layers are defined as traceable additions rather than source replacements
- Atlas Engine integration has a clean presentation contract without requiring renderer changes
