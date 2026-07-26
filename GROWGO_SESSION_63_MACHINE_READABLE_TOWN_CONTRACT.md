# GROWGO SESSION 63 — MACHINE READABLE TOWN CONTRACT

## Session Scope

This session defines the machine-readable procedural contract for:

- `TOWN_LAYOUT_001`

Purpose:

- deterministic machine-readable Australian town generation

This session creates procedural schemas only.

This session does not:

- create Blender assets
- create GLB exports
- create town scenes
- create new buildings
- create new modules
- modify registered assets
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## 1. Source Of Truth

This contract is based on:

- `GROWGO_SESSION_62_TOWN_LAYOUT_FOUNDATION.md`
- `GROWGO_SESSION_56_MACHINE_READABLE_SUBURBAN_DISTRICT_CONTRACT.md`
- `GROWGO_SESSION_57_DETERMINISTIC_SUBURBAN_DISTRICT_GENERATOR.md`
- existing district and procedural generation contract patterns

Continuity rules:

- `SUBURBAN_DISTRICT_001` remains the first approved residential town district unit
- town generation extends the district system rather than replacing it
- deterministic rebuild from seed remains mandatory
- town composition must preserve district seam, pedestrian, reserve, and transport compatibility
- town layout must remain machine-readable before any future town generator, preview consumer, or Blender scene work

## 2. Contract Goal

`TOWN_LAYOUT_001` must describe a deterministic Australian town that can produce:

- a town boundary
- deterministic district placements
- a town centre
- commercial zones
- civic reserve locations
- transport corridors
- recreation and open-space distribution
- landmark reserve placements
- deterministic validation output

The contract must be readable by:

- future town generator scripts
- future town validation scripts
- preview adapters
- visual preview consumers
- future Atlas or Blender bridge layers

## 3. Schema Set

This session defines these schema identities:

- `TOWN_LAYOUT_001`
- `TOWN_DISTRICT_PLACEMENT_INSTANCE_001`
- `TOWN_CENTRE_ZONE_INSTANCE_001`
- `COMMERCIAL_ZONE_INSTANCE_001`
- `CIVIC_RESERVE_INSTANCE_001`
- `TRANSPORT_CORRIDOR_INSTANCE_001`
- `RECREATION_ZONE_INSTANCE_001`
- `LANDMARK_RESERVE_INSTANCE_001`
- `TOWN_VALIDATION_001`

## 4. Town Schema

### Schema ID

- `TOWN_LAYOUT_001`

### Required fields

- `schemaId`
- `townId`
- `generationProfile`
- `seedConfig`
- `townThemeProfile`
- `townBounds`
- `districtPlacements`
- `townCentreZones`
- `commercialZones`
- `civicReserves`
- `transportCorridors`
- `recreationZones`
- `landmarkReserves`
- `serviceEdgeZones`
- `ruralTransitionZones`
- `validationContract`
- `validationResult`

### Field intent

- `schemaId`: top-level versioned town contract identity
- `townId`: deterministic town output identity
- `generationProfile`: overall town composition profile
- `seedConfig`: full seed inputs for town rebuild
- `townThemeProfile`: selected town density and identity profile
- `townBounds`: total town footprint
- `districtPlacements`: placed district units
- `townCentreZones`: main activity centres
- `commercialZones`: supporting retail and service zones
- `civicReserves`: future civic service reserves
- `transportCorridors`: town-scale movement network
- `recreationZones`: park, sports, and green-corridor system
- `landmarkReserves`: future landmark anchor locations
- `serviceEdgeZones`: future industrial or utility edge support
- `ruralTransitionZones`: edge-of-town landscape transition
- `validationContract`: expected town rule set
- `validationResult`: generated-state validation output

### Suggested shape

```json
{
  "schemaId": "TOWN_LAYOUT_001",
  "townId": "TOWN_LAYOUT_001_A",
  "generationProfile": "regional_town_default",
  "seedConfig": {},
  "townThemeProfile": {},
  "townBounds": {},
  "districtPlacements": [],
  "townCentreZones": [],
  "commercialZones": [],
  "civicReserves": [],
  "transportCorridors": [],
  "recreationZones": [],
  "landmarkReserves": [],
  "serviceEdgeZones": [],
  "ruralTransitionZones": [],
  "validationContract": {},
  "validationResult": {}
}
```

## 5. Town Seed System

### Required inputs

- `townSeed`
- `regionSeed`
- `townThemeSeed`

### Deterministic expectations

The same seed must produce:

- the same district layout
- the same town centre
- the same commercial zones
- the same civic reserve placement
- the same transport structure
- the same landmark reserve pattern
- the same validation output

### Suggested seed config shape

```json
{
  "townSeed": 10482,
  "regionSeed": 1,
  "townThemeSeed": "REGIONAL_TOWN"
}
```

## 6. District Placement Schema

### Schema ID

- `TOWN_DISTRICT_PLACEMENT_INSTANCE_001`

### Required fields

- `schemaId`
- `districtPlacementId`
- `districtType`
- `sourceDistrictSchemaId`
- `position`
- `rotation`
- `sizeProfile`
- `densityProfile`
- `themeProfile`
- `connectorRelationships`
- `streamingCellId`

### Supported district types

- `RESIDENTIAL_DISTRICT_SUBURBAN`
- `RESIDENTIAL_DISTRICT_COASTAL`
- `RESIDENTIAL_DISTRICT_MIXED`
- `RESIDENTIAL_DISTRICT_FUTURE_MEDIUM_DENSITY`

### Field intent

- `districtType`: town-level district role
- `sourceDistrictSchemaId`: currently expected to resolve to a district contract such as `SUBURBAN_DISTRICT_001`
- `position`: town-space origin
- `rotation`: deterministic district orientation
- `sizeProfile`: small, medium, or large district role
- `densityProfile`: placement density role within the town
- `themeProfile`: theme or regional override
- `connectorRelationships`: roads or corridor links to adjacent districts or centre systems
- `streamingCellId`: performance and loading boundary

### Suggested shape

```json
{
  "schemaId": "TOWN_DISTRICT_PLACEMENT_INSTANCE_001",
  "districtPlacementId": "TOWN_DISTRICT_001",
  "districtType": "RESIDENTIAL_DISTRICT_SUBURBAN",
  "sourceDistrictSchemaId": "SUBURBAN_DISTRICT_001",
  "position": { "x": 0, "y": 0, "z": 0 },
  "rotation": { "yawDegrees": 0 },
  "sizeProfile": "MEDIUM_DISTRICT",
  "densityProfile": "LOW_DENSITY_SUBURBAN",
  "themeProfile": "SUBURBAN_AUSTRALIA",
  "connectorRelationships": ["TOWN_CORRIDOR_001", "TOWN_CORRIDOR_002"],
  "streamingCellId": "TOWN_CELL_A1"
}
```

## 7. Town Centre Schema

### Schema ID

- `TOWN_CENTRE_ZONE_INSTANCE_001`

### Required fields

- `schemaId`
- `centreId`
- `centreType`
- `boundary`
- `pedestrianPriority`
- `commercialIntensity`
- `civicRelationship`
- `landmarkRelationship`
- `transportRelationship`

### Supported centre types

- `MAIN_STREET`
- `PLAZA_CENTRE`
- `VILLAGE_CENTRE`
- `FUTURE_CBD_EDGE`

### Field intent

- `boundary`: machine-readable centre footprint
- `pedestrianPriority`: whether the centre privileges walkability
- `commercialIntensity`: town-scale retail/service strength
- `civicRelationship`: whether the centre integrates civic frontage
- `landmarkRelationship`: landmark support level
- `transportRelationship`: corridor or station adjacency

### Suggested shape

```json
{
  "schemaId": "TOWN_CENTRE_ZONE_INSTANCE_001",
  "centreId": "TOWN_CENTRE_001",
  "centreType": "MAIN_STREET",
  "boundary": {
    "shape": "rect",
    "x": 120,
    "y": -80,
    "width": 220,
    "depth": 130
  },
  "pedestrianPriority": "HIGH",
  "commercialIntensity": "MEDIUM_HIGH",
  "civicRelationship": "ADJACENT_CIVIC_EDGE",
  "landmarkRelationship": "CENTRE_ANCHOR_SUPPORTED",
  "transportRelationship": "COLLECTOR_AND_BUS_ACCESS"
}
```

## 8. Commercial Zone Schema

### Schema ID

- `COMMERCIAL_ZONE_INSTANCE_001`

### Required fields

- `schemaId`
- `commercialZoneId`
- `commercialType`
- `boundary`
- `intensity`
- `parkingAccessRules`
- `pedestrianLinks`
- `roadRelationship`

### Supported commercial types

- `TOWN_MAIN_STREET_001`
- `COMMERCIAL_STRIP_001`
- `COASTAL_TOURISM_RETAIL`
- `FUTURE_SHOPPING_CENTRE`

### Field intent

- `boundary`: zone footprint
- `intensity`: retail/service scale
- `parkingAccessRules`: vehicle access strategy
- `pedestrianLinks`: walkable connection requirements
- `roadRelationship`: collector, arterial, or centre linkage

### Suggested shape

```json
{
  "schemaId": "COMMERCIAL_ZONE_INSTANCE_001",
  "commercialZoneId": "COMMERCIAL_001",
  "commercialType": "COMMERCIAL_STRIP_001",
  "boundary": {
    "shape": "rect",
    "x": 360,
    "y": -90,
    "width": 180,
    "depth": 90
  },
  "intensity": "MEDIUM",
  "parkingAccessRules": {
    "edgeParkingAllowed": true,
    "rearAccessPreferred": true
  },
  "pedestrianLinks": ["PED_CORRIDOR_001", "PED_CORRIDOR_002"],
  "roadRelationship": "COLLECTOR_OR_ARTERIAL_FRONTAGE"
}
```

## 9. Civic Reserve Schema

### Schema ID

- `CIVIC_RESERVE_INSTANCE_001`

### Required fields

- `schemaId`
- `civicReserveId`
- `civicType`
- `boundary`
- `accessibilityProfile`
- `roadRelationship`
- `pedestrianRelationship`

### Supported civic types

- `SCHOOL_RESERVE`
- `LIBRARY_RESERVE`
- `COMMUNITY_CENTRE_RESERVE`
- `EMERGENCY_SERVICE_RESERVE`
- `HEALTHCARE_RESERVE`

### Suggested shape

```json
{
  "schemaId": "CIVIC_RESERVE_INSTANCE_001",
  "civicReserveId": "CIVIC_001",
  "civicType": "SCHOOL_RESERVE",
  "boundary": {
    "shape": "rect",
    "x": -220,
    "y": 120,
    "width": 160,
    "depth": 120
  },
  "accessibilityProfile": "COLLECTOR_AND_PEDESTRIAN_ACCESS",
  "roadRelationship": "COLLECTOR_EDGE_REQUIRED",
  "pedestrianRelationship": "GREEN_CORRIDOR_LINK_PREFERRED"
}
```

## 10. Transport Corridor Schema

### Schema ID

- `TRANSPORT_CORRIDOR_INSTANCE_001`

### Required fields

- `schemaId`
- `corridorId`
- `corridorType`
- `hierarchy`
- `path`
- `connections`
- `direction`
- `capacityProfile`

### Supported corridor types

- `LOCAL_ROAD`
- `COLLECTOR_ROAD`
- `ARTERIAL_ROAD`
- `BUS_CORRIDOR`
- `RAILWAY_CORRIDOR`
- `FUTURE_STATION_LINK`

### Field intent

- `path`: machine-readable route or segment list
- `connections`: connected districts, centre zones, or reserves
- `direction`: major orientation
- `capacityProfile`: movement scale

### Suggested shape

```json
{
  "schemaId": "TRANSPORT_CORRIDOR_INSTANCE_001",
  "corridorId": "TOWN_CORRIDOR_001",
  "corridorType": "COLLECTOR_ROAD",
  "hierarchy": "TOWN_COLLECTOR",
  "path": [
    { "x": -600, "y": 0, "z": 0 },
    { "x": 600, "y": 0, "z": 0 }
  ],
  "connections": ["TOWN_DISTRICT_001", "TOWN_CENTRE_001", "COMMERCIAL_001"],
  "direction": "EAST_WEST",
  "capacityProfile": "MEDIUM_TOWN_MOVEMENT"
}
```

## 11. Recreation Zone Schema

### Schema ID

- `RECREATION_ZONE_INSTANCE_001`

### Required fields

- `schemaId`
- `recreationZoneId`
- `recreationType`
- `boundary`
- `accessRules`
- `greenRelationship`

### Supported recreation types

- `PARK`
- `SPORTS_FIELD`
- `PLAYGROUND_ZONE`
- `WALKING_TRAIL`
- `GREEN_CORRIDOR`

### Suggested shape

```json
{
  "schemaId": "RECREATION_ZONE_INSTANCE_001",
  "recreationZoneId": "RECREATION_001",
  "recreationType": "GREEN_CORRIDOR",
  "boundary": {
    "shape": "rect",
    "x": -90,
    "y": -40,
    "width": 420,
    "depth": 80
  },
  "accessRules": {
    "pedestrianPriority": true,
    "districtConnectivityRequired": true
  },
  "greenRelationship": "DISTRICT_AND_CENTRE_LINK"
}
```

## 12. Landmark Reserve Schema

### Schema ID

- `LANDMARK_RESERVE_INSTANCE_001`

### Required fields

- `schemaId`
- `landmarkReserveId`
- `landmarkType`
- `boundary`
- `visibilityRole`
- `destinationRole`
- `accessRelationship`

### Supported landmark types

- `HISTORICAL_LANDMARK`
- `TOURIST_ATTRACTION`
- `NATURAL_LANDMARK`
- `UNIQUE_TOWN_FEATURE`

### Suggested shape

```json
{
  "schemaId": "LANDMARK_RESERVE_INSTANCE_001",
  "landmarkReserveId": "LANDMARK_001",
  "landmarkType": "HISTORICAL_LANDMARK",
  "boundary": {
    "shape": "rect",
    "x": 80,
    "y": 220,
    "width": 90,
    "depth": 90
  },
  "visibilityRole": "OVERVIEW_ANCHOR",
  "destinationRole": "VISITOR_DRAW",
  "accessRelationship": "PEDESTRIAN_AND_COLLECTOR_ACCESS"
}
```

## 13. Town Theme Profiles

This contract defines the following machine-readable town theme seeds:

- `SMALL_COASTAL_TOWN`
- `REGIONAL_TOWN`
- `SUBURBAN_CITY_EDGE`
- `TOURIST_TOWN`

### `SMALL_COASTAL_TOWN`

- district count target: `2-4`
- density: `LOW`
- centre size: `SMALL`
- commercial intensity: `MEDIUM`
- transport intensity: `LOW`
- recreation allocation: `HIGH`

### `REGIONAL_TOWN`

- district count target: `3-6`
- density: `LOW_MEDIUM`
- centre size: `MEDIUM`
- commercial intensity: `MEDIUM_HIGH`
- transport intensity: `MEDIUM`
- recreation allocation: `MEDIUM`

### `SUBURBAN_CITY_EDGE`

- district count target: `4-8`
- density: `MEDIUM`
- centre size: `MEDIUM`
- commercial intensity: `MEDIUM`
- transport intensity: `HIGH`
- recreation allocation: `MEDIUM`

### `TOURIST_TOWN`

- district count target: `2-5`
- density: `LOW`
- centre size: `SMALL_MEDIUM`
- commercial intensity: `HIGH`
- transport intensity: `MEDIUM`
- recreation allocation: `HIGH`

## 14. Validation Contract

### Schema ID

- `TOWN_VALIDATION_001`

### Required checks

#### Town structure

- districts inside boundary
- zones valid
- roads connected
- no impossible overlaps

#### Centres

- centre accessible
- centre connected to transport
- centre connected to residential districts

#### Commercial

- sensible placement
- corridor access valid
- pedestrian connection valid

#### Civic

- accessible
- not isolated
- road relationship valid

#### Performance

- streaming boundaries defined
- instance reuse preserved
- LOD strategy compatible

#### Determinism

- same seed equals same town

### Suggested validation shape

```json
{
  "validationId": "TOWN_LAYOUT_001_VALIDATION_001",
  "townId": "TOWN_LAYOUT_001_A",
  "checks": {
    "districtsInsideBoundary": "PASS",
    "townCentreAccessible": "PASS",
    "transportConnected": "PASS",
    "civicAccessible": "PASS",
    "commercialPlacementValid": "PASS",
    "streamingBoundariesValid": "PASS",
    "deterministicRebuildValid": "PASS"
  },
  "summary": {
    "validationPassed": true
  }
}
```

## 15. Preview Configuration

Create:

- `TOWN_LAYOUT_001_PREVIEW_001`

### First preview target

The first preview configuration should support:

- multiple district placements
- one town centre
- one commercial zone
- at least one civic reserve
- at least one recreation zone
- multiple transport corridors

### Suggested preview intent

The first town preview should prioritize:

- town readability from overview scale
- district-to-centre relationships
- transport hierarchy clarity
- future preview consumer compatibility

## 16. Implementation Readiness

Status:

- `READY FOR DETERMINISTIC TOWN GENERATOR DESIGN`

Meaning:

- the town framework now has a machine-readable schema set
- district placement and centre logic are defined
- commercial, civic, transport, recreation, and landmark systems have compatible contract shapes
- the next step can implement a deterministic `TOWN_LAYOUT_001` generator and validation output without changing the approved lower-level district contracts
