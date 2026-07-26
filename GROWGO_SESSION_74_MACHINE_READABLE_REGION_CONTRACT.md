# GROWGO SESSION 74 — MACHINE READABLE REGION CONTRACT

## Session Scope

This session defines the machine-readable procedural contract for:

- `REGION_LAYOUT_001`

Purpose:

- deterministic machine-readable Australian region generation

This session creates procedural schemas only.

This session does not:

- create Blender assets
- create GLB exports
- create region scenes
- create new buildings
- create new modules
- modify registered assets
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## Files Created

- `GROWGO_SESSION_74_MACHINE_READABLE_REGION_CONTRACT.md`

## Files Changed

- none

## 1. Source Of Truth

This contract is based on:

- `GROWGO_SESSION_73_MULTI_TOWN_REGION_FOUNDATION.md`
- `GROWGO_SESSION_63_MACHINE_READABLE_TOWN_CONTRACT.md`
- `GROWGO_SESSION_71_VARIANT_DRIVEN_TOWN_GENERATOR_IMPLEMENTATION.md`
- existing town and district contract patterns

Continuity rules:

- `TOWN_LAYOUT_001` remains the approved settlement-generation unit for full town outputs
- `TOWN_VARIANT_PROFILE_SYSTEM_001` remains the source of deterministic town identity behaviour
- region generation extends the town and district architecture rather than replacing it
- all regional outputs must be reproducible from seed alone
- settlement, transport, natural, landmark, and exploration layers must remain machine-readable before any future region preview, Atlas bridge, or Blender scene work

## 2. Contract Goal

`REGION_LAYOUT_001` must describe a deterministic Australian region that can produce:

- a region boundary
- deterministic settlement placements
- regional transport corridors
- natural zone distribution
- landmark reserve placement
- exploration route relationships
- deterministic validation output

The contract must be readable by:

- future region generator scripts
- future region validation scripts
- preview adapters
- visual preview consumers
- future Atlas or Blender bridge layers

## 3. Schema Set

This session defines these schema identities:

- `REGION_LAYOUT_001`
- `SETTLEMENT_INSTANCE_001`
- `REGIONAL_TRANSPORT_CORRIDOR_INSTANCE_001`
- `NATURAL_ZONE_INSTANCE_001`
- `REGIONAL_LANDMARK_RESERVE_INSTANCE_001`
- `EXPLORATION_ROUTE_INSTANCE_001`
- `REGION_VALIDATION_001`

## 4. Region Schema

### Schema ID

- `REGION_LAYOUT_001`

### Required fields

- `schemaId`
- `regionId`
- `generationProfile`
- `seedConfig`
- `regionProfile`
- `regionBounds`
- `settlements`
- `transportCorridors`
- `naturalZones`
- `landmarkReserves`
- `explorationRoutes`
- `streamingGrid`
- `validationContract`
- `validationResult`

### Field intent

- `schemaId`: versioned top-level region contract identity
- `regionId`: deterministic region output identity
- `generationProfile`: overall regional composition profile
- `seedConfig`: full region seed inputs
- `regionProfile`: selected region identity and climate/terrain behaviour
- `regionBounds`: total region footprint and shape definition
- `settlements`: placed towns, villages, and hamlets
- `transportCorridors`: inter-settlement movement structure
- `naturalZones`: biome and terrain-driven landscape areas
- `landmarkReserves`: future landmark anchor locations
- `explorationRoutes`: travel and discovery paths across the region
- `streamingGrid`: future chunking and world-streaming support
- `validationContract`: expected region rule set
- `validationResult`: generated-state validation output

### Suggested shape

```json
{
  "schemaId": "REGION_LAYOUT_001",
  "regionId": "REGION_LAYOUT_001_A",
  "generationProfile": "coastal_region_default",
  "seedConfig": {},
  "regionProfile": {},
  "regionBounds": {},
  "settlements": [],
  "transportCorridors": [],
  "naturalZones": [],
  "landmarkReserves": [],
  "explorationRoutes": [],
  "streamingGrid": {},
  "validationContract": {},
  "validationResult": {}
}
```

## 5. Region Seed System

### Required inputs

- `regionSeed`
- `biomeSeed`
- `climateSeed`
- `settlementPatternSeed`
- `regionProfileSeed`

### Deterministic expectations

The same seed set must produce:

- the same terrain and landscape structure
- the same settlement hierarchy
- the same transport network
- the same landmark reserve layout
- the same natural zone placement
- the same exploration route network
- the same validation output

### Suggested seed config shape

```json
{
  "regionSeed": 10482,
  "biomeSeed": "COASTAL_TEMPERATE",
  "climateSeed": "MILD_WET_SUMMER",
  "settlementPatternSeed": "MULTI_TOWN_SCENIC_REGION",
  "regionProfileSeed": "COASTAL_REGION"
}
```

## 6. Region Profile System

`REGION_LAYOUT_001` must support machine-readable region profiles that shape settlement spread, transport intensity, natural-zone weighting, and landmark density.

### Required region profiles

- `COASTAL_REGION`
- `RURAL_REGION`
- `MOUNTAIN_REGION`
- `TOURISM_REGION`
- `METROPOLITAN_EDGE_REGION`

### Profile fields

- `profileId`
- `settlementDensity`
- `majorTownWeight`
- `regionalTownWeight`
- `smallTownWeight`
- `villageWeight`
- `hamletWeight`
- `transportIntensity`
- `naturalZoneWeighting`
- `landmarkFrequency`
- `explorationRouteDensity`
- `boundaryBehaviour`
- `growthPattern`

### Profile intent

- `COASTAL_REGION`: settlement patterns follow coastline, foreshore access, and tourism corridors
- `RURAL_REGION`: agricultural spread, inland service towns, and stronger road-distance logic
- `MOUNTAIN_REGION`: constrained terrain, scenic corridors, smaller settlement clusters, and landmark-heavy travel routes
- `TOURISM_REGION`: strong attraction weighting, recreation access, and destination-linked transport structure
- `METROPOLITAN_EDGE_REGION`: larger town counts, stronger road hierarchy, service clustering, and suburban expansion pressure

## 7. Settlement Schema

### Schema ID

- `SETTLEMENT_INSTANCE_001`

### Required fields

- `schemaId`
- `settlementId`
- `settlementType`
- `position`
- `sizeProfile`
- `townProfile`
- `populationScale`
- `terrainRelationship`
- `transportRelationship`
- `serviceRole`
- `linkedSettlements`
- `streamingCellId`

### Supported settlement types

- `MAJOR_TOWN`
- `REGIONAL_TOWN`
- `SMALL_COASTAL_TOWN`
- `VILLAGE`
- `HAMLET`

### Field intent

- `settlementId`: deterministic settlement identity
- `settlementType`: hierarchy role within the region
- `position`: region-space origin
- `sizeProfile`: relative footprint and influence
- `townProfile`: linked town variant profile when the settlement resolves to a town generator
- `populationScale`: comparative population tier
- `terrainRelationship`: coastal, inland, river, ridge, valley, or farmland alignment
- `transportRelationship`: how the settlement attaches to roads, rail, or coastal routes
- `serviceRole`: regional support purpose such as hub, local service point, scenic node, or travel stop
- `linkedSettlements`: deterministic dependency or service relationships
- `streamingCellId`: future chunk and streaming boundary

### Suggested shape

```json
{
  "schemaId": "SETTLEMENT_INSTANCE_001",
  "settlementId": "SETTLEMENT_001",
  "settlementType": "REGIONAL_TOWN",
  "position": { "x": 1240, "y": 0, "z": 860 },
  "sizeProfile": "MEDIUM_SETTLEMENT",
  "townProfile": "REGIONAL_TOWN",
  "populationScale": "DISTRICT_SERVICE_SCALE",
  "terrainRelationship": "INLAND_RIVER_CORRIDOR",
  "transportRelationship": "HIGHWAY_AND_COLLECTOR_LINK",
  "serviceRole": "REGIONAL_SERVICE_HUB",
  "linkedSettlements": ["SETTLEMENT_004", "SETTLEMENT_007"],
  "streamingCellId": "REGION_CELL_B2"
}
```

## 8. Regional Transport Corridor Schema

### Schema ID

- `REGIONAL_TRANSPORT_CORRIDOR_INSTANCE_001`

### Required fields

- `schemaId`
- `corridorId`
- `transportType`
- `startLocation`
- `endLocation`
- `hierarchy`
- `connectedSettlements`
- `supportsFreight`
- `supportsPassengerTravel`
- `futureExpansionCompatible`

### Supported transport types

- `HIGHWAY`
- `MAJOR_ROAD`
- `LOCAL_ROAD`
- `RAILWAY_CORRIDOR`
- `COASTAL_ROUTE`

### Field intent

- `transportType`: top-level movement mode
- `startLocation` and `endLocation`: deterministic connection anchors
- `hierarchy`: corridor importance within the region
- `connectedSettlements`: settlements served by the corridor
- `supportsFreight`: future logistics compatibility
- `supportsPassengerTravel`: future civilian travel compatibility
- `futureExpansionCompatible`: compatibility with larger region or state-scale generation

### Suggested shape

```json
{
  "schemaId": "REGIONAL_TRANSPORT_CORRIDOR_INSTANCE_001",
  "corridorId": "REGION_CORRIDOR_001",
  "transportType": "HIGHWAY",
  "startLocation": { "x": 0, "y": 0, "z": 420 },
  "endLocation": { "x": 4200, "y": 0, "z": 1180 },
  "hierarchy": "PRIMARY_REGIONAL_LINK",
  "connectedSettlements": ["SETTLEMENT_001", "SETTLEMENT_002", "SETTLEMENT_005"],
  "supportsFreight": true,
  "supportsPassengerTravel": true,
  "futureExpansionCompatible": true
}
```

## 9. Natural Zone Schema

### Schema ID

- `NATURAL_ZONE_INSTANCE_001`

### Required fields

- `schemaId`
- `naturalZoneId`
- `zoneType`
- `boundary`
- `biomeType`
- `accessibility`
- `explorationValue`
- `settlementInfluence`
- `transportInfluence`
- `protectedStatus`

### Supported natural zone types

- `COASTLINE`
- `FOREST`
- `FARMLAND`
- `RIVER`
- `WETLAND`
- `MOUNTAINS`
- `PROTECTED_AREA`

### Field intent

- `boundary`: machine-readable region-space footprint
- `biomeType`: terrain and ecology classification
- `accessibility`: how traversable the zone is
- `explorationValue`: discovery importance for future gameplay and preview scoring
- `settlementInfluence`: how the zone attracts or constrains settlement
- `transportInfluence`: how the zone redirects or supports routes
- `protectedStatus`: whether development is constrained

### Suggested shape

```json
{
  "schemaId": "NATURAL_ZONE_INSTANCE_001",
  "naturalZoneId": "NATURAL_ZONE_003",
  "zoneType": "COASTLINE",
  "boundary": {
    "points": [
      { "x": 0, "z": 0 },
      { "x": 600, "z": 80 },
      { "x": 1180, "z": 220 }
    ]
  },
  "biomeType": "TEMPERATE_COASTAL",
  "accessibility": "PARTIAL_PUBLIC_ACCESS",
  "explorationValue": "HIGH",
  "settlementInfluence": "STRONG_COASTAL_ATTRACTION",
  "transportInfluence": "LIMITS_INLAND_CONNECTOR_PATHS",
  "protectedStatus": "FORESHORE_MANAGED"
}
```

## 10. Regional Landmark Reserve Schema

### Schema ID

- `REGIONAL_LANDMARK_RESERVE_INSTANCE_001`

### Required fields

- `schemaId`
- `landmarkReserveId`
- `landmarkType`
- `position`
- `accessibility`
- `questCompatibility`
- `naturalRelationship`
- `settlementRelationship`
- `visibilityProfile`

### Supported landmark types

- `WATERFALL`
- `LIGHTHOUSE`
- `HISTORIC_SITE`
- `NATIONAL_PARK`
- `LOOKOUT`
- `GEOLOGICAL_FEATURE`

### Field intent

- `landmarkType`: future landmark content category
- `position`: deterministic reserve anchor
- `accessibility`: how reachable the landmark should be
- `questCompatibility`: future mission, achievement, or collection support
- `naturalRelationship`: linked biome or terrain role
- `settlementRelationship`: nearest or intended host settlement relationship
- `visibilityProfile`: how strongly the reserve should read in previews and exploration systems

### Suggested shape

```json
{
  "schemaId": "REGIONAL_LANDMARK_RESERVE_INSTANCE_001",
  "landmarkReserveId": "LANDMARK_002",
  "landmarkType": "LIGHTHOUSE",
  "position": { "x": 3120, "y": 0, "z": 140 },
  "accessibility": "SCENIC_ROUTE_ACCESS",
  "questCompatibility": "HIGH",
  "naturalRelationship": "COASTAL_HEADLAND",
  "settlementRelationship": "LINKED_TO_SMALL_COASTAL_TOWN",
  "visibilityProfile": "LONG_RANGE_DESTINATION"
}
```

## 11. Exploration Route Schema

### Schema ID

- `EXPLORATION_ROUTE_INSTANCE_001`

### Required fields

- `schemaId`
- `routeId`
- `routeType`
- `startAnchor`
- `endAnchor`
- `distance`
- `difficulty`
- `discoveryValue`
- `connectedPointsOfInterest`
- `travelModeCompatibility`

### Supported route targets

- towns
- landmarks
- trails
- attractions
- natural features

### Field intent

- `routeType`: scenic road, walking trail, lookout chain, heritage path, or mixed exploration corridor
- `startAnchor` and `endAnchor`: deterministic route endpoints
- `distance`: expected traversal length
- `difficulty`: future exploration complexity marker
- `discoveryValue`: perceived reward for traversal
- `connectedPointsOfInterest`: linked settlements or landmarks
- `travelModeCompatibility`: vehicle, walking, cycling, or mixed suitability

### Suggested shape

```json
{
  "schemaId": "EXPLORATION_ROUTE_INSTANCE_001",
  "routeId": "ROUTE_005",
  "routeType": "SCENIC_COASTAL_DRIVE",
  "startAnchor": "SETTLEMENT_002",
  "endAnchor": "LANDMARK_002",
  "distance": 18.4,
  "difficulty": "LOW",
  "discoveryValue": "HIGH",
  "connectedPointsOfInterest": ["SETTLEMENT_002", "LANDMARK_002", "NATURAL_ZONE_003"],
  "travelModeCompatibility": ["VEHICLE", "WALKING_VIEWPOINT_SEGMENTS"]
}
```

## 12. Region Validation Contract

### Schema ID

- `REGION_VALIDATION_001`

### Required checks

Region:

- settlements valid
- transport network connected
- natural zones valid

Settlements:

- sensible placement
- hierarchy valid
- settlement-to-terrain logic valid

Travel:

- routes accessible
- distances reasonable
- transport hierarchy coherent

Exploration:

- landmarks reachable
- route network supports discovery
- natural attractions connect meaningfully to settlements or corridors

Performance:

- region chunking valid
- streaming boundaries defined
- instance reuse and reference-only placement preserved

Determinism:

- same seed = same region

### Suggested validation shape

```json
{
  "schemaId": "REGION_VALIDATION_001",
  "placementChecks": {
    "settlementsValid": true,
    "naturalZonesValid": true,
    "landmarksReachable": true
  },
  "transportChecks": {
    "corridorsConnected": true,
    "distancesReasonable": true
  },
  "performanceChecks": {
    "streamingBoundariesDefined": true,
    "referenceOnlyPlacement": true
  },
  "determinismChecks": {
    "sameSeedRebuildMatches": true
  },
  "status": "PASS"
}
```

## 13. Preview Configuration

Create:

- `REGION_LAYOUT_001_PREVIEW_001`

Purpose:

- first machine-readable preview target for a multi-settlement Australian region

### Preview target

The preview configuration should demonstrate:

- multiple settlements
- regional transport network
- natural zone distribution
- landmark reserve placement
- exploration route relationships

### Suggested preview shape

```json
{
  "previewId": "REGION_LAYOUT_001_PREVIEW_001",
  "regionProfileSeed": "COASTAL_REGION",
  "targetSettlementCount": 5,
  "targetTransportCorridors": 6,
  "targetNaturalZones": 8,
  "targetLandmarkReserves": 4,
  "targetExplorationRoutes": 7
}
```

## 14. Implementation Readiness

`REGION_LAYOUT_001` is ready for implementation planning because it now defines:

- a top-level machine-readable region schema
- deterministic seed inputs
- region-profile-driven composition rules
- settlement hierarchy contracts
- transport corridor contracts
- natural zone contracts
- landmark reserve contracts
- exploration route contracts
- region validation rules
- a first preview configuration target

Recommended implementation order:

1. create the deterministic region seed and top-level schema scaffold
2. implement settlement placement and hierarchy resolution
3. implement transport corridor generation
4. implement natural zone placement
5. implement landmark reserve placement
6. implement exploration route generation
7. generate the first `REGION_LAYOUT_001_PREVIEW_001` artifact
