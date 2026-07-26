# GrowGo Session 47 - Machine Readable Suburban Street Block Contract

## Session Scope

This session defines the machine-readable procedural contract for:

- `SUBURBAN_STREET_BLOCK_001`

Purpose:

- deterministic machine-readable `20-24` lot suburban street block generation

This session creates procedural schemas only.

This session does not:

- create Blender assets
- create GLB exports
- create street scenes
- create new buildings
- create new modules
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## 1. Source of Truth

This contract is based on:

- `GROWGO_SESSION_46_SUBURBAN_STREET_BLOCK_EXPANSION_FOUNDATION.md`
- `GROWGO_SESSION_36_MACHINE_READABLE_SUBURBAN_NEIGHBOURHOOD_GENERATOR_CONTRACT.md`
- `GROWGO_SESSION_37_DETERMINISTIC_SUBURBAN_PREVIEW_GENERATOR.md`
- existing Asset Factory and neighbourhood contract patterns

Continuity rules:

- the six-lot neighbourhood contract remains the base deterministic pattern
- `SUBURBAN_STREET_BLOCK_001` extends that pattern rather than replacing it
- the first target is a controlled `24` lot preview block
- all outputs must be reproducible from seed alone

## 2. Contract Goal

`SUBURBAN_STREET_BLOCK_001` must describe a deterministic suburban street block that can produce:

- a connected road graph
- `20-24` residential lots
- deterministic house selection
- deterministic driveway and fence resolution
- deterministic street feature placement
- deterministic validation output

The contract must be readable by:

- future generator scripts
- future validation scripts
- preview adapters
- visual preview consumers
- future Atlas or Blender bridge layers

## 3. Schema Set

This session defines these schema identities:

- `SUBURBAN_STREET_BLOCK_001`
- `ROAD_NODE_INSTANCE_001`
- `ROAD_SEGMENT_INSTANCE_001`
- `ROAD_INTERSECTION_INSTANCE_001`
- `LOT_SUBURBAN_BLOCK_001`
- `BUILDING_BLOCK_PLACEMENT_INSTANCE_001`
- `STREET_FEATURE_INSTANCE_001`

## 4. Street Block Schema

### Schema ID

- `SUBURBAN_STREET_BLOCK_001`

### Required fields

- `schemaId`
- `streetBlockId`
- `generationProfile`
- `seedConfig`
- `themeProfile`
- `blockBounds`
- `roadGraph`
- `roadNodes`
- `roadSegments`
- `intersections`
- `lotCount`
- `lots`
- `buildingPlacements`
- `streetFeaturePlacements`
- `roadFrontageConnections`
- `validationContract`
- `validationResult`

### Field intent

- `schemaId`: versioned top-level contract identity
- `streetBlockId`: deterministic block output identity
- `generationProfile`: scale and layout profile
- `seedConfig`: full seed inputs
- `themeProfile`: suburban identity and weighting profile
- `blockBounds`: total block footprint
- `roadGraph`: machine-readable graph summary
- `roadNodes`: node records
- `roadSegments`: segment records
- `intersections`: intersection records
- `lotCount`: explicit lot count
- `lots`: lot contract records
- `buildingPlacements`: resolved building placements
- `streetFeaturePlacements`: sidewalks, verges, trees, signs, bins, and similar public-area placements
- `roadFrontageConnections`: lot-to-road access records
- `validationContract`: expected rule set
- `validationResult`: generated-state validation result

### Suggested shape

```json
{
  "schemaId": "SUBURBAN_STREET_BLOCK_001",
  "streetBlockId": "SUBURBAN_STREET_BLOCK_001_A",
  "generationProfile": "suburban_multi_street_24_lot_default",
  "seedConfig": {},
  "themeProfile": {},
  "blockBounds": {},
  "roadGraph": {},
  "roadNodes": [],
  "roadSegments": [],
  "intersections": [],
  "lotCount": 24,
  "lots": [],
  "buildingPlacements": [],
  "streetFeaturePlacements": [],
  "roadFrontageConnections": [],
  "validationContract": {},
  "validationResult": {}
}
```

## 5. Road Node Schema

### Schema ID

- `ROAD_NODE_INSTANCE_001`

### Required fields

- `schemaId`
- `nodeId`
- `nodeType`
- `position`
- `connectedSegmentIds`
- `degree`
- `orientationProfile`

### Supported node types

- `intersection`
- `t_junction`
- `four_way`
- `cul_de_sac_end`
- `road_connection_point`

### Field intent

- `position`: node origin in block space
- `connectedSegmentIds`: road segments attached to the node
- `degree`: number of attached segments
- `orientationProfile`: permitted directions

### Suggested shape

```json
{
  "schemaId": "ROAD_NODE_INSTANCE_001",
  "nodeId": "NODE_001",
  "nodeType": "four_way",
  "position": { "x": 0, "y": 0, "z": 0 },
  "connectedSegmentIds": ["SEGMENT_001", "SEGMENT_002", "SEGMENT_003", "SEGMENT_004"],
  "degree": 4,
  "orientationProfile": "north_up_cardinal"
}
```

## 6. Road Segment Schema

### Schema ID

- `ROAD_SEGMENT_INSTANCE_001`

### Required fields

- `schemaId`
- `roadSegmentId`
- `roadType`
- `startNodeId`
- `endNodeId`
- `direction`
- `length`
- `roadWidth`
- `sidewalkWidth`
- `vergeWidth`
- `lotRanges`
- `supportsDriveways`

### Supported road types

- `local_residential_street`
- `collector_residential_street`
- `cul_de_sac_residential_loop`

### Supported direction tags

- `north_south`
- `east_west`
- `north_east_south_west`
- `north_west_south_east`
- `curved_local`

### Suggested shape

```json
{
  "schemaId": "ROAD_SEGMENT_INSTANCE_001",
  "roadSegmentId": "SEGMENT_001",
  "roadType": "local_residential_street",
  "startNodeId": "NODE_001",
  "endNodeId": "NODE_002",
  "direction": "east_west",
  "length": 86,
  "roadWidth": 12,
  "sidewalkWidth": 1.6,
  "vergeWidth": 1.8,
  "lotRanges": ["LOT_RANGE_NORTH_001", "LOT_RANGE_SOUTH_001"],
  "supportsDriveways": true
}
```

## 7. Intersection Schema

### Schema ID

- `ROAD_INTERSECTION_INSTANCE_001`

### Required fields

- `schemaId`
- `intersectionId`
- `nodeId`
- `intersectionType`
- `connectedSegmentIds`
- `turnRules`
- `lotVisibilityBuffer`

### Supported intersection types

- `t_intersection`
- `four_way_intersection`
- `corner_connection`
- `cul_de_sac_head`

### Field intent

- `turnRules`: allowed routing behavior
- `lotVisibilityBuffer`: keeps corner lots and verge features clear enough for readability

### Suggested shape

```json
{
  "schemaId": "ROAD_INTERSECTION_INSTANCE_001",
  "intersectionId": "INTERSECTION_001",
  "nodeId": "NODE_001",
  "intersectionType": "t_intersection",
  "connectedSegmentIds": ["SEGMENT_001", "SEGMENT_002", "SEGMENT_003"],
  "turnRules": {
    "leftTurnAllowed": true,
    "rightTurnAllowed": true,
    "throughAllowed": true
  },
  "lotVisibilityBuffer": 4
}
```

## 8. Lot Schema

### Schema ID

- `LOT_SUBURBAN_BLOCK_001`

### Required fields

- `schemaId`
- `lotId`
- `position`
- `dimensions`
- `frontageRoadSegmentId`
- `frontageDirection`
- `cornerStatus`
- `lotType`
- `setbackProfile`
- `drivewaySide`
- `drivewayStreet`
- `fenceRules`
- `landscapingZones`
- `buildingSocket`
- `drivewaySocket`
- `resolverInputs`
- `landscapingSeed`

### Supported corner status values

- `interior`
- `corner_primary`
- `corner_secondary`
- `cul_de_sac_edge`

### Field intent

- `frontageRoadSegmentId`: the street the lot primarily faces
- `cornerStatus`: street-block-specific lot behavior
- `drivewayStreet`: the road segment chosen for access
- `fenceRules`: front, side, rear, and corner-opening behavior
- `landscapingZones`: front lawn, backyard, side planting, tree, and verge-adjacent zones

### Suggested shape

```json
{
  "schemaId": "LOT_SUBURBAN_BLOCK_001",
  "lotId": "LOT_001",
  "position": { "x": 0, "y": 0, "z": 0 },
  "dimensions": { "width": 16, "depth": 36 },
  "frontageRoadSegmentId": "SEGMENT_001",
  "frontageDirection": "north",
  "cornerStatus": "interior",
  "lotType": "standard",
  "setbackProfile": {
    "front": 5.5,
    "left": 1.8,
    "right": 1.8,
    "rear": 6.5
  },
  "drivewaySide": "east",
  "drivewayStreet": "SEGMENT_001",
  "fenceRules": {},
  "landscapingZones": {},
  "buildingSocket": {},
  "drivewaySocket": {},
  "resolverInputs": {},
  "landscapingSeed": "LANDSCAPE_10482_001"
}
```

## 9. Building Placement Schema

### Schema ID

- `BUILDING_BLOCK_PLACEMENT_INSTANCE_001`

### Required fields

- `schemaId`
- `placementId`
- `lotId`
- `assetId`
- `familyId`
- `recipeId`
- `position`
- `rotation`
- `scale`
- `lodProfile`
- `frontSetback`
- `drivewaySide`
- `streetContext`
- `variationProfile`
- `resolverMetadata`

### Supported buildings

- `BUILDING_HOUSE_SUBURBAN_BRICK_001`
- `BUILDING_HOUSE_COASTAL_COTTAGE_001`
- `BUILDING_HOUSE_BEACH_BUNGALOW_001`

### Field intent

- `streetContext`: whether the lot is on a local street, collector edge, corner, or cul-de-sac
- `variationProfile`: roof, yard, fence, and colour variation settings
- `resolverMetadata`: why the resolver chose the asset

### Resolver requirements

The resolver must support:

- street-aware selection
- corner-lot variation
- neighbourhood theme weighting
- duplicate prevention
- deterministic output

### Suggested resolver weighting

Default `SUBURBAN_AUSTRALIA` profile:

- `BUILDING_HOUSE_SUBURBAN_BRICK_001`: `85%`
- `BUILDING_HOUSE_COASTAL_COTTAGE_001`: `12%`
- `BUILDING_HOUSE_BEACH_BUNGALOW_001`: `3%`

### Duplicate prevention rules

- no identical adjacent houses on the same street side
- no identical facing pairs across a street when avoidable
- no more than two identical houses in a short local cluster
- corner lots may bias toward higher-identity or wider-footprint houses when legal

### Suggested shape

```json
{
  "schemaId": "BUILDING_BLOCK_PLACEMENT_INSTANCE_001",
  "placementId": "PLACEMENT_001",
  "lotId": "LOT_001",
  "assetId": "BUILDING_HOUSE_SUBURBAN_BRICK_001",
  "familyId": "FAMILY_HOUSE_SUBURBAN_BRICK",
  "recipeId": "RECIPE_HOUSE_SUBURBAN_BRICK_001",
  "position": { "x": 8, "y": -17.4, "z": 0 },
  "rotation": { "facingDirection": "north", "yawDegrees": 180 },
  "scale": { "x": 1, "y": 1, "z": 1 },
  "lodProfile": "LOD_GAMEPLAY",
  "frontSetback": 5.5,
  "drivewaySide": "east",
  "streetContext": "local_residential_interior",
  "variationProfile": {},
  "resolverMetadata": {}
}
```

## 10. Street Feature Schema

### Schema ID

- `STREET_FEATURE_INSTANCE_001`

### Required fields

- `schemaId`
- `featurePlacementId`
- `featureType`
- `assetId`
- `streetSegmentId`
- `relatedLotId`
- `position`
- `rotation`
- `variationSeed`
- `placementRule`
- `publicAreaClass`

### Supported feature types

- `sidewalk`
- `grass_verge`
- `street_tree`
- `street_sign`
- `mailbox`
- `bin`
- `street_furniture`

### Public area classes

- `public_footpath`
- `public_verge`
- `intersection_buffer`
- `lot_frontage_edge`
- `cul_de_sac_centre`

### Field intent

- `assetId`: future feature asset or registered placeholder ID
- `relatedLotId`: optional lot link for mailboxes, bins, or frontage features
- `variationSeed`: deterministic placement and variation source

### Suggested shape

```json
{
  "schemaId": "STREET_FEATURE_INSTANCE_001",
  "featurePlacementId": "FEATURE_001",
  "featureType": "street_tree",
  "assetId": "MOD_TREE_EUCALYPTUS_STANDARD_001",
  "streetSegmentId": "SEGMENT_001",
  "relatedLotId": null,
  "position": { "x": 12, "y": -7.2, "z": 0 },
  "rotation": { "yawDegrees": 0 },
  "variationSeed": "STREET_TREE_10482_001",
  "placementRule": "verge_interval_standard",
  "publicAreaClass": "public_verge"
}
```

## 11. Street Graph Rules

### Graph support

The first contract must support:

- straight streets
- T intersections
- four-way intersections
- corner roads
- cul-de-sacs

### Graph requirements

The road graph must:

- remain connected
- remain north-up in coordinate conventions
- expose legal node-to-segment relationships
- provide frontage references for lot generation
- provide deterministic access paths for driveways and pedestrian links

### First controlled preview topology

Recommended `SUBURBAN_STREET_BLOCK_001_PREVIEW_001` topology:

1. one collector street
2. two connected local residential streets
3. one cul-de-sac branch
4. one four-way or T intersection anchor

This gives enough variety to test:

- interior lots
- corner lots
- cul-de-sac lots
- cross-street repetition prevention

## 12. Block Seed System

### Required seed inputs

- `streetBlockSeed`
- `regionSeed`
- `neighbourhoodThemeSeed`

### Determinism contract

The same seed set must produce:

- the same road graph
- the same lots
- the same buildings
- the same street features
- the same validation result

### Suggested seed shape

```json
{
  "streetBlockSeed": 20482,
  "regionSeed": 1,
  "neighbourhoodThemeSeed": "SUBURBAN_AUSTRALIA",
  "targetLotCount": 24,
  "generationProfile": "suburban_multi_street_24_lot_default"
}
```

### Seed usage rules

- `streetBlockSeed`: primary graph and lot distribution driver
- `regionSeed`: region-level compatibility and future biome continuity
- `neighbourhoodThemeSeed`: weighting and style selection
- derived per-lot and per-feature seeds must be deterministic children of the top-level seeds

## 13. Lot Generation Rules

### Generator inputs

- road graph
- target density
- block size
- lot rules

### Generator output per lot

Each lot must resolve:

- lot ID
- position
- frontage road
- corner status
- dimensions
- setback
- driveway side
- fence rules
- landscaping zone

### Frontage width bands

- narrow: `12-14m`
- standard: `15-18m`
- wide: `19-24m`

### Setback profiles

The first machine-readable contract should support:

- `standard_suburban_profile`
- `wide_lot_suburban_profile`
- `corner_lot_suburban_profile`
- `cul_de_sac_suburban_profile`

### Driveway rules

- must connect to a legal road frontage
- must remain on the selected side
- must align with garage logic
- must avoid impossible cross-lot paths
- corner lots may choose alternate street access deterministically

### Fence rules

Each lot must define:

- front boundary
- side boundaries
- rear boundary
- driveway opening
- pedestrian opening
- corner visibility opening when required

### Landscaping rules

Each lot should define:

- front lawn zone
- backyard zone
- side planting zone
- tree zone
- mailbox verge zone
- corner visibility planting zone when applicable

## 14. Validation Contract

### Validation goals

The block validation contract must check:

Road:

- connected graph
- no impossible intersections

Lots:

- inside block boundary
- valid frontage

Buildings:

- correct road facing
- no overlap

Driveways:

- connect to roads

Street features:

- contained within public areas

Determinism:

- same seed equals same block

### Recommended validation fields

- `roadConnectivityValid`
- `intersectionValidity`
- `lotBoundaryValidity`
- `lotFrontageValidity`
- `buildingFacingValidity`
- `buildingOverlapValidity`
- `drivewayConnectionValidity`
- `pedestrianAccessValidity`
- `streetFeatureContainmentValidity`
- `themeWeightingValidity`
- `streetIdentityScoreValidity`
- `deterministicRebuildValidity`
- `validationPassed`

### Validation meanings

- road connectivity:
  every road node belongs to a valid connected graph
- impossible intersections:
  no segment resolves to an illegal or ambiguous node pattern
- lot boundary validity:
  lots remain inside block bounds and do not overlap
- valid frontage:
  each lot faces a legal road segment
- correct road facing:
  each building rotates toward its selected frontage road
- no overlap:
  buildings respect setbacks and spacing
- driveways connect:
  each driveway reaches its legal street edge
- street features contained:
  no public-area feature overlaps private-only building space
- deterministic rebuild:
  the same seed reproduces the same full block contract

## 15. Preview Configuration

### Preview ID

- `SUBURBAN_STREET_BLOCK_001_PREVIEW_001`

### First controlled target

- `24` lots

### Preview must include

- road graph
- lots
- building selections
- street feature placements

### Recommended preview profile

```json
{
  "previewId": "SUBURBAN_STREET_BLOCK_001_PREVIEW_001",
  "schemaId": "SUBURBAN_STREET_BLOCK_001",
  "targetLotCount": 24,
  "roadGraphProfile": "collector_plus_two_local_plus_culdesac",
  "themeProfile": "SUBURBAN_AUSTRALIA",
  "supportedBuildings": [
    "BUILDING_HOUSE_SUBURBAN_BRICK_001",
    "BUILDING_HOUSE_COASTAL_COTTAGE_001",
    "BUILDING_HOUSE_BEACH_BUNGALOW_001"
  ],
  "supportedStreetFeatures": [
    "sidewalk",
    "grass_verge",
    "street_tree",
    "street_sign",
    "mailbox",
    "bin",
    "street_furniture"
  ]
}
```

## 16. Implementation Readiness

Status:

- `READY FOR CONTRACT IMPLEMENTATION`

Meaning:

- the machine-readable street-block contract now has explicit schemas
- the six-lot preview logic has a direct scaling path into a `24` lot block
- the next practical session can implement contract generation without redefining the rules

## 17. Recommended Next Step

Recommended next session:

- implement the first deterministic `SUBURBAN_STREET_BLOCK_001_PREVIEW_001` generator

Recommended first scope:

- `24` lots
- one collector street
- two local streets
- one cul-de-sac
- the current three residential building assets
- rule-driven street feature placements
