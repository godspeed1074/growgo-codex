# GROWGO SESSION 56 — MACHINE READABLE SUBURBAN DISTRICT CONTRACT

## Session Scope

This session defines the machine-readable procedural contract for:

- `SUBURBAN_DISTRICT_001`

Purpose:

- deterministic machine-readable suburban district generation

This session creates procedural schemas only.

This session does not:

- create Blender assets
- create GLB exports
- create district scenes
- create new buildings
- create new modules
- modify registered assets
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## 1. Source of Truth

This contract is based on:

- `GROWGO_SESSION_55_SUBURBAN_DISTRICT_EXPANSION_FOUNDATION.md`
- `GROWGO_SESSION_47_MACHINE_READABLE_SUBURBAN_STREET_BLOCK_CONTRACT.md`
- `GROWGO_SESSION_48_DETERMINISTIC_24_LOT_SUBURBAN_STREET_BLOCK_GENERATOR.md`
- existing neighbourhood and street-block contract patterns

Continuity rules:

- `SUBURBAN_STREET_BLOCK_001` remains the validated residential block unit
- district generation extends the street-block system rather than replacing it
- all district outputs must be reproducible from seed alone
- land-use, open-space, and destination reservation must be machine-readable before any future district preview consumer is built

## 2. Contract Goal

`SUBURBAN_DISTRICT_001` must describe a deterministic suburban district that can produce:

- a district boundary
- a connected block layout
- a connected district road hierarchy
- deterministic land-use zoning
- deterministic open-space placement
- deterministic destination reserve placement
- deterministic district validation output

The contract must be readable by:

- future district generator scripts
- future district validation scripts
- preview adapters
- visual preview consumers
- future Atlas or Blender bridge layers

## 3. Schema Set

This session defines these schema identities:

- `SUBURBAN_DISTRICT_001`
- `BLOCK_PLACEMENT_INSTANCE_001`
- `DISTRICT_ROAD_CONNECTOR_INSTANCE_001`
- `LAND_USE_ZONE_INSTANCE_001`
- `OPEN_SPACE_INSTANCE_001`
- `DESTINATION_RESERVE_INSTANCE_001`
- `DISTRICT_VALIDATION_001`

## 4. District Schema

### Schema ID

- `SUBURBAN_DISTRICT_001`

### Required fields

- `schemaId`
- `districtId`
- `generationProfile`
- `seedConfig`
- `themeProfile`
- `districtBounds`
- `roadHierarchy`
- `blockGrid`
- `blockPlacements`
- `roadConnectors`
- `landUseZones`
- `openSpacePlacements`
- `destinationReserves`
- `lotCount`
- `validationContract`
- `validationResult`

### Field intent

- `schemaId`: versioned top-level district contract identity
- `districtId`: deterministic district output identity
- `generationProfile`: scale and composition profile
- `seedConfig`: full district seed inputs
- `themeProfile`: district identity and density profile
- `districtBounds`: total district footprint
- `roadHierarchy`: district road model summary
- `blockGrid`: machine-readable district layout summary
- `blockPlacements`: placed suburban street blocks
- `roadConnectors`: inter-block road relationships
- `landUseZones`: zoning contract records
- `openSpacePlacements`: parks, green corridors, and reserve greenspace
- `destinationReserves`: future school, retail, sport, civic, and transport reserve spaces
- `lotCount`: district-level resolved residential lot estimate
- `validationContract`: expected district rule set
- `validationResult`: generated-state validation result

### Suggested shape

```json
{
  "schemaId": "SUBURBAN_DISTRICT_001",
  "districtId": "SUBURBAN_DISTRICT_001_A",
  "generationProfile": "suburban_district_default",
  "seedConfig": {},
  "themeProfile": {},
  "districtBounds": {},
  "roadHierarchy": {},
  "blockGrid": {},
  "blockPlacements": [],
  "roadConnectors": [],
  "landUseZones": [],
  "openSpacePlacements": [],
  "destinationReserves": [],
  "lotCount": 180,
  "validationContract": {},
  "validationResult": {}
}
```

## 5. Block Placement Schema

### Schema ID

- `BLOCK_PLACEMENT_INSTANCE_001`

### Required fields

- `schemaId`
- `blockInstanceId`
- `streetBlockType`
- `sourceBlockSchemaId`
- `position`
- `rotation`
- `densityProfile`
- `themeProfile`
- `connectorRelationships`
- `estimatedLotCount`
- `streamingCellId`

### Field intent

- `streetBlockType`: currently `SUBURBAN_STREET_BLOCK_001`
- `sourceBlockSchemaId`: block contract identity used by the district
- `position`: district-space origin
- `rotation`: deterministic block rotation
- `densityProfile`: low/medium/coastal/future urban edge block role
- `themeProfile`: district-local theme override if needed
- `connectorRelationships`: roads that connect the block to neighbouring blocks
- `estimatedLotCount`: lot contribution to the district total
- `streamingCellId`: future performance and loading boundary

### Suggested shape

```json
{
  "schemaId": "BLOCK_PLACEMENT_INSTANCE_001",
  "blockInstanceId": "BLOCK_001",
  "streetBlockType": "SUBURBAN_STREET_BLOCK_001",
  "sourceBlockSchemaId": "SUBURBAN_STREET_BLOCK_001",
  "position": { "x": 0, "y": 0, "z": 0 },
  "rotation": { "yawDegrees": 0 },
  "densityProfile": "LOW_DENSITY_SUBURBAN",
  "themeProfile": "SUBURBAN_AUSTRALIA",
  "connectorRelationships": ["CONNECTOR_001", "CONNECTOR_002"],
  "estimatedLotCount": 24,
  "streamingCellId": "DISTRICT_CELL_A1"
}
```

## 6. Road Connector Schema

### Schema ID

- `DISTRICT_ROAD_CONNECTOR_INSTANCE_001`

### Required fields

- `schemaId`
- `connectorId`
- `startBlockId`
- `endBlockId`
- `roadType`
- `direction`
- `width`
- `hierarchy`
- `supportsPedestrianLink`
- `futureExpansionCompatible`

### Supported hierarchy

- `local_connection`
- `collector_connection`
- `future_arterial_connection`

### Field intent

- `startBlockId` and `endBlockId`: deterministic block relationship
- `roadType`: connector geometry class
- `direction`: north/south/east/west or angled route family
- `width`: connection width
- `hierarchy`: district traffic role
- `supportsPedestrianLink`: whether walking continuity is required
- `futureExpansionCompatible`: whether the connector can extend into future districts

### Suggested shape

```json
{
  "schemaId": "DISTRICT_ROAD_CONNECTOR_INSTANCE_001",
  "connectorId": "CONNECTOR_001",
  "startBlockId": "BLOCK_001",
  "endBlockId": "BLOCK_002",
  "roadType": "collector_residential_street",
  "direction": "east_west",
  "width": 16,
  "hierarchy": "collector_connection",
  "supportsPedestrianLink": true,
  "futureExpansionCompatible": true
}
```

## 7. Land-Use Zone Schema

### Schema ID

- `LAND_USE_ZONE_INSTANCE_001`

### Required fields

- `schemaId`
- `zoneId`
- `zoneType`
- `boundary`
- `purpose`
- `allowedContent`
- `placementRules`
- `densityCompatibility`

### Supported zone types

- `RESIDENTIAL_LOW_DENSITY`
- `OPEN_SPACE`
- `PARK_RESERVE`
- `COMMUNITY_ZONE`
- `COMMERCIAL_EDGE_ZONE`

### Field intent

- `boundary`: machine-readable district-space polygon or rectangle
- `purpose`: human-readable intent
- `allowedContent`: permitted future content categories
- `placementRules`: deterministic zoning constraints
- `densityCompatibility`: district profiles the zone supports

### Suggested shape

```json
{
  "schemaId": "LAND_USE_ZONE_INSTANCE_001",
  "zoneId": "ZONE_001",
  "zoneType": "RESIDENTIAL_LOW_DENSITY",
  "boundary": {
    "shape": "rect",
    "x": 0,
    "y": 0,
    "width": 320,
    "depth": 220
  },
  "purpose": "Detached suburban residential housing.",
  "allowedContent": ["SUBURBAN_STREET_BLOCK_001"],
  "placementRules": {
    "adjacentToCollectorPreferred": true,
    "supportsCulDeSacs": true
  },
  "densityCompatibility": ["LOW_DENSITY_SUBURBAN", "COASTAL_ESTATES"]
}
```

## 8. Open Space Schema

### Schema ID

- `OPEN_SPACE_INSTANCE_001`

### Required fields

- `schemaId`
- `openSpaceId`
- `openSpaceType`
- `position`
- `size`
- `connectionRules`
- `futureAssetCompatibility`

### Supported open-space types

- `park`
- `green_corridor`
- `reserve`
- `walking_link`

### Field intent

- `position`: district-space origin or center
- `size`: footprint and scale band
- `connectionRules`: how the space relates to roads, paths, and adjacent blocks
- `futureAssetCompatibility`: future parks, sport fields, or civic landscaping support

### Suggested shape

```json
{
  "schemaId": "OPEN_SPACE_INSTANCE_001",
  "openSpaceId": "OPEN_SPACE_001",
  "openSpaceType": "park",
  "position": { "x": 420, "y": 180, "z": 0 },
  "size": { "width": 90, "depth": 70 },
  "connectionRules": {
    "adjacentToCollectorPreferred": true,
    "supportsWalkingLink": true,
    "buffersResidentialBlocks": true
  },
  "futureAssetCompatibility": ["playground", "sport_field", "trees", "path_network"]
}
```

## 9. Destination Reserve Schema

### Schema ID

- `DESTINATION_RESERVE_INSTANCE_001`

### Required fields

- `schemaId`
- `reserveId`
- `reserveType`
- `boundary`
- `futureUse`
- `roadAccessProfile`
- `bufferRules`

### Supported reserve types

- `school_reserve`
- `shopping_reserve`
- `sports_field_reserve`
- `railway_station_reserve`
- `civic_building_reserve`

### Field intent

- `boundary`: reserved district footprint only
- `futureUse`: what the reserve is intended to host later
- `roadAccessProfile`: expected connector relationship
- `bufferRules`: neighbouring land-use expectations

### Suggested shape

```json
{
  "schemaId": "DESTINATION_RESERVE_INSTANCE_001",
  "reserveId": "RESERVE_001",
  "reserveType": "school_reserve",
  "boundary": {
    "shape": "rect",
    "x": 620,
    "y": 160,
    "width": 110,
    "depth": 90
  },
  "futureUse": "Primary school campus",
  "roadAccessProfile": "collector_edge_access",
  "bufferRules": {
    "requiresOpenSpaceBuffer": true,
    "avoidDeepCulDeSacAccess": true
  }
}
```

## 10. District Validation Schema

### Schema ID

- `DISTRICT_VALIDATION_001`

### Required fields

- `schemaId`
- `validationId`
- `districtId`
- `checks`
- `summary`

### Required checks

District validation must confirm:

- blocks inside boundary
- roads connected
- zones valid
- no overlapping blocks
- valid road hierarchy
- sensible land-use distribution
- deterministic same-seed output
- streaming boundaries defined
- instance reuse strategy declared

### Suggested shape

```json
{
  "schemaId": "DISTRICT_VALIDATION_001",
  "validationId": "DISTRICT_VALIDATION_001_A",
  "districtId": "SUBURBAN_DISTRICT_001_A",
  "checks": {
    "blocksInsideBoundary": true,
    "blocksDoNotOverlap": true,
    "roadsConnected": true,
    "roadHierarchyValid": true,
    "landUseDistributionValid": true,
    "openSpaceValid": true,
    "destinationReservesValid": true,
    "deterministicRebuildValid": true,
    "streamingBoundariesValid": true,
    "instanceReuseStrategyValid": true
  },
  "summary": {
    "validationPassed": true
  }
}
```

## 11. District Seed System

### Inputs

District generation must accept:

- `districtSeed`
- `regionSeed`
- `districtThemeSeed`

### Deterministic guarantees

The same seed combination must produce:

- the same block layout
- the same connector roads
- the same land-use zones
- the same open-space placements
- the same destination reserve placements

### Seed intent

- `districtSeed`: primary district layout driver
- `regionSeed`: compatibility with larger world-region routing
- `districtThemeSeed`: suburban/coastal/future edge flavour and density direction

## 12. Block Placement Rules

### Inputs

Block placement should depend on:

- district boundary
- density target
- terrain or theme profile
- district seed

### Outputs

For each block, the contract should resolve:

- block ID
- position
- rotation
- street block type
- density profile
- theme profile
- connector relationships

### Placement constraints

Block placement must:

- support multiple `SUBURBAN_STREET_BLOCK_001` instances
- support future block variants without changing the district contract
- avoid repetitive rows and mirrored district patterns
- maintain neighbourhood identity continuity
- preserve collector-road legibility

## 13. Road Connector Rules

District connectors must support:

- local connections
- collector roads
- future arterial roads

Recommended rules:

- residential blocks connect primarily through collector continuity
- local connections should remain internal or secondary
- future arterial corridors should sit on district edges or reserved growth spines
- cul-de-sacs should not terminate major district routes

## 14. Zoning Rules

District zoning must support:

- low-density residential dominance by default
- open-space interruptions between block clusters
- community and commercial edge reservations on stronger connectors
- future coastal-estate and medium-density variants without rewriting the base contract

Recommended distribution intent:

- most district area remains `RESIDENTIAL_LOW_DENSITY`
- each district includes meaningful `OPEN_SPACE` or `PARK_RESERVE`
- `COMMUNITY_ZONE` and `COMMERCIAL_EDGE_ZONE` remain limited and structured

## 15. Open Space Rules

Open-space logic must support:

- parks
- green corridors
- reserves
- walking links

Recommended rules:

- every district should have at least one meaningful park or reserve
- green corridors can buffer blocks or connect future community zones
- walking links should align with collector edges, parks, and future reserves
- open-space placement must remain compatible with future asset insertion

## 16. Density Profiles

District density profiles must support:

- `LOW_DENSITY_SUBURBAN`
- `MEDIUM_DENSITY_SUBURBAN`
- `COASTAL_ESTATES`
- `FUTURE_URBAN_EDGE`

Each density profile should declare:

- block count range
- estimated lot target range
- open-space target
- dominant road hierarchy
- future building-family compatibility

### Suggested profile intent

- `LOW_DENSITY_SUBURBAN`:
  - detached houses
  - highest suburban street-block reuse

- `MEDIUM_DENSITY_SUBURBAN`:
  - future townhouses and duplexes
  - stronger collectors

- `COASTAL_ESTATES`:
  - more coastal street-block weighting
  - stronger open-space and reserve alignment

- `FUTURE_URBAN_EDGE`:
  - denser edge conditions
  - stronger future arterial reservation

## 17. Preview Configuration

Create:

- `SUBURBAN_DISTRICT_001_PREVIEW_001`

Recommended first preview target:

- `4-8` street blocks
- `100-300` lots
- district connectors
- open space
- destination reserve placeholders

Suggested preview contract fields:

- `previewId`
- `districtId`
- `districtSeed`
- `blockCount`
- `estimatedLotCount`
- `roadConnectorCount`
- `zoneCount`
- `openSpaceCount`
- `destinationReserveCount`

## 18. Implementation Readiness

This contract is ready for implementation planning because:

- the street-block base unit already exists and is validated
- district-scale schemas are now explicitly named
- deterministic seed behavior is clearly defined
- zoning, open space, and reserve systems are described without forcing immediate asset work
- validation requirements are known before generator work begins

Recommended next step:

- implement the first deterministic district generator for `SUBURBAN_DISTRICT_001_PREVIEW_001`
- resolve `4-8` street blocks, connector roads, land-use zones, open space, and destination reserves from district seed alone
