# GROWGO SESSION 82 — MACHINE READABLE WORLD CONTRACT

## Session Scope

This session defines the machine-readable procedural contract for:

- `WORLD_LAYOUT_001`

Purpose:

- deterministic machine-readable connected world generation

This session creates schemas and contracts only.

This session does not:

- create Blender assets
- create GLB exports
- create world scenes
- create new buildings
- create new modules
- modify registered assets
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## Files Created

- `GROWGO_SESSION_82_MACHINE_READABLE_WORLD_CONTRACT.md`

## Files Changed

- none

## 1. Source Of Truth

This contract is based on:

- `GROWGO_SESSION_81_MULTI_REGION_WORLD_FOUNDATION.md`
- `GROWGO_SESSION_74_MACHINE_READABLE_REGION_CONTRACT.md`
- `GROWGO_SESSION_75_DETERMINISTIC_REGION_GENERATOR.md`
- existing region, town, and district contract patterns

Continuity rules:

- `REGION_LAYOUT_001` remains the approved region-generation unit for full regional outputs
- `WORLD_LAYOUT_001` orchestrates region composition rather than replacing region generation
- world outputs must remain fully reproducible from seed alone
- region placement, geography, connections, landmarks, exploration, streaming, and validation layers must remain machine-readable before any future world preview or world-scene work

## 2. Contract Goal

`WORLD_LAYOUT_001` must describe a deterministic connected world that can produce:

- world boundary and geography
- deterministic region placement
- inter-region transition rules
- world-scale transport corridors
- world landmark reserve placement
- world exploration route relationships
- streaming chunk structure
- deterministic validation output

The contract must be readable by:

- future world generator scripts
- future world validation scripts
- preview adapters
- visual preview consumers
- future Atlas bridge layers
- future streaming systems

## 3. Schema Set

This session defines these schema identities:

- `WORLD_LAYOUT_001`
- `REGION_INSTANCE_001`
- `WORLD_GEOGRAPHY_ZONE_001`
- `WORLD_CONNECTION_CORRIDOR_001`
- `WORLD_LANDMARK_RESERVE_001`
- `WORLD_EXPLORATION_ROUTE_001`
- `WORLD_STREAMING_CHUNK_001`
- `WORLD_VALIDATION_001`

## 4. World Schema

### Schema ID

- `WORLD_LAYOUT_001`

### Required fields

- `schemaId`
- `worldId`
- `generationProfile`
- `seedConfig`
- `worldProfile`
- `worldBounds`
- `regionInstances`
- `worldGeographyZones`
- `worldConnections`
- `worldLandmarkReserves`
- `worldExplorationRoutes`
- `streamingChunks`
- `validationContract`
- `validationResult`

### Field intent

- `schemaId`: versioned top-level world contract identity
- `worldId`: deterministic world output identity
- `generationProfile`: overall world composition profile
- `seedConfig`: full world seed inputs
- `worldProfile`: selected world identity and weighting behaviour
- `worldBounds`: total world footprint and boundary definition
- `regionInstances`: placed regions and their relationships
- `worldGeographyZones`: macro geography, biome, climate, and access areas
- `worldConnections`: inter-region transport and travel corridors
- `worldLandmarkReserves`: future world-scale destination anchors
- `worldExplorationRoutes`: long-range discovery and travel paths
- `streamingChunks`: chunking and loading structure
- `validationContract`: expected world rule set
- `validationResult`: generated-state validation output

### Suggested shape

```json
{
  "schemaId": "WORLD_LAYOUT_001",
  "worldId": "WORLD_LAYOUT_001_A",
  "generationProfile": "australian_coastal_world_default",
  "seedConfig": {},
  "worldProfile": {},
  "worldBounds": {},
  "regionInstances": [],
  "worldGeographyZones": [],
  "worldConnections": [],
  "worldLandmarkReserves": [],
  "worldExplorationRoutes": [],
  "streamingChunks": [],
  "validationContract": {},
  "validationResult": {}
}
```

## 5. World Seed System

### Required inputs

- `worldSeed`
- `geographySeed`
- `climateSeed`
- `biomeSeed`
- `settlementSeed`
- `explorationSeed`

### Deterministic expectations

The same seed set must produce:

- the same region arrangement
- the same geography
- the same transport corridors
- the same landmark reserves
- the same exploration routes
- the same streaming chunk layout
- the same validation output

### Suggested seed config shape

```json
{
  "worldSeed": 10482,
  "geographySeed": "AUSTRALIAN_COASTAL_CONTINENT",
  "climateSeed": "TEMPERATE_TO_WARM_MIX",
  "biomeSeed": "COASTAL_FOREST_FARMLAND_WETLAND",
  "settlementSeed": "MULTI_REGION_WORLD_A",
  "explorationSeed": "SCENIC_DISCOVERY_WORLD_A"
}
```

## 6. World Profile System

`WORLD_LAYOUT_001` must support machine-readable world profiles that shape geography weighting, region density, corridor intensity, landmark spread, and exploration structure.

### Required world profiles

- `AUSTRALIAN_COASTAL_WORLD`
- `CONTINENTAL_WORLD`
- `MOUNTAIN_WORLD`
- `TOURISM_WORLD`

### Profile fields

- `profileId`
- `geographyWeighting`
- `regionDensity`
- `regionProfileWeighting`
- `transportIntensity`
- `landmarkFrequency`
- `explorationRouteDensity`
- `boundaryBehaviour`
- `growthPattern`

### Profile intent

- `AUSTRALIAN_COASTAL_WORLD`: stronger coastline weighting, coastal-region clustering, marine landmark support, and tourism-route emphasis
- `CONTINENTAL_WORLD`: larger inland spread, rural and varied-biome weighting, stronger long-distance transport spines
- `MOUNTAIN_WORLD`: elevation-heavy geography, constrained corridors, remote settlement support, and landmark-heavy mountain travel
- `TOURISM_WORLD`: scenic routes, visitor destinations, higher landmark density, and attraction-linked region mix

## 7. Region Instance Schema

### Schema ID

- `REGION_INSTANCE_001`

### Required fields

- `schemaId`
- `regionId`
- `profile`
- `position`
- `size`
- `biome`
- `climate`
- `neighbouringRegions`
- `transitionRules`

### Field intent

- `regionId`: deterministic placed-region identity
- `profile`: selected region profile such as coastal, rural, mountain, tourism, or metropolitan edge
- `position`: world-space origin
- `size`: relative footprint and influence
- `biome`: primary biome identity
- `climate`: climate identity affecting placement and transition logic
- `neighbouringRegions`: deterministic neighbour relationships
- `transitionRules`: how this region blends or connects to adjacent regions

### Placement rules

- regions must not appear as a grid
- placement must be influenced by geography, climate, biome, transport, and resources
- coastal regions must align to coastline or marine-access geography
- mountain regions must constrain corridor logic and increase travel difficulty
- tourism regions should cluster near scenic geography and world landmark opportunities
- rural and inland support regions should provide believable service and transport continuity

### Suggested shape

```json
{
  "schemaId": "REGION_INSTANCE_001",
  "regionId": "REGION_001",
  "profile": "COASTAL_REGION",
  "position": { "x": 0, "z": 0 },
  "size": "LARGE",
  "biome": "TEMPERATE_COASTAL",
  "climate": "MILD_WET_SUMMER",
  "neighbouringRegions": ["REGION_002"],
  "transitionRules": ["COAST_TO_FARMLAND", "TOURISM_EDGE_ACCESS"]
}
```

## 8. World Geography Schema

### Schema ID

- `WORLD_GEOGRAPHY_ZONE_001`

### Required fields

- `schemaId`
- `zoneId`
- `zoneType`
- `boundary`
- `biome`
- `climate`
- `accessibility`
- `influenceRules`

### Supported zone types

- `OCEAN`
- `COASTLINE`
- `MOUNTAINS`
- `FOREST`
- `DESERT`
- `FARMLAND`
- `WETLAND`
- `RIVER`
- `PROTECTED_AREA`

### Field intent

- `zoneId`: deterministic geography identity
- `zoneType`: macro geography type
- `boundary`: world-space shape definition
- `biome`: biome identity
- `climate`: climate identity
- `accessibility`: expected travel and development accessibility
- `influenceRules`: how the zone shapes regions, transport, landmarks, and exploration

### Influence rules

- oceans constrain overland movement and enable ferry logic
- coastlines enable coastal regions, marine routes, and tourism corridors
- mountains act as hard barriers and landmark multipliers
- forests support scenic, protected, and discovery-heavy regions
- deserts lower density and increase route difficulty
- farmland supports rural and service-region placement
- wetlands and rivers create crossing constraints and ecological identity
- protected areas limit development and elevate exploration value

## 9. World Connection Corridor Schema

### Schema ID

- `WORLD_CONNECTION_CORRIDOR_001`

### Required fields

- `schemaId`
- `corridorId`
- `startRegion`
- `endRegion`
- `connectionType`
- `hierarchy`
- `distance`
- `difficulty`
- `explorationValue`

### Supported connection types

- `HIGHWAY`
- `RAILWAY`
- `COASTAL_ROUTE`
- `FERRY_ROUTE`
- `TRAIL`

### Field intent

- `corridorId`: deterministic corridor identity
- `startRegion`: origin region
- `endRegion`: destination region
- `connectionType`: travel mode category
- `hierarchy`: route importance level
- `distance`: travel length
- `difficulty`: travel complexity influenced by geography
- `explorationValue`: scenic or discovery value beyond pure utility

### Connection rules

- highways should connect the most important service and population regions
- railways should favour high-value long-range corridors
- coastal routes should follow marine and shoreline logic
- ferry routes should connect water-separated regions or coastal chains
- trails should support protected, scenic, and low-intensity travel
- connections must not ignore mountains, ocean, or wetland barriers

### Suggested shape

```json
{
  "schemaId": "WORLD_CONNECTION_CORRIDOR_001",
  "corridorId": "WORLD_CORRIDOR_001",
  "startRegion": "REGION_001",
  "endRegion": "REGION_002",
  "connectionType": "HIGHWAY",
  "hierarchy": "PRIMARY",
  "distance": 1240,
  "difficulty": "LOW_MEDIUM",
  "explorationValue": "MEDIUM"
}
```

## 10. World Landmark Reserve Schema

### Schema ID

- `WORLD_LANDMARK_RESERVE_001`

### Required fields

- `schemaId`
- `landmarkId`
- `landmarkType`
- `location`
- `rarity`
- `regionRelationship`
- `discoveryValue`

### Supported landmark classes

- `NATURAL_WONDER`
- `HISTORICAL_SITE`
- `RARE_DISCOVERY`
- `ICONIC_LOCATION`

### Field intent

- `landmarkId`: deterministic world landmark identity
- `landmarkType`: world destination category
- `location`: world-space placement
- `rarity`: expected frequency and significance
- `regionRelationship`: which regions the landmark shapes or belongs to
- `discoveryValue`: exploration and player-interest value

### Landmark rules

- some landmarks should be region-local anchors
- some should be world-significant destinations
- landmark placement should reinforce geography
- landmark rarity should stay inside world-profile expectations

## 11. World Exploration Route Schema

### Schema ID

- `WORLD_EXPLORATION_ROUTE_001`

### Required fields

- `schemaId`
- `routeId`
- `routeType`
- `distance`
- `difficulty`
- `rewardPotential`

### Route relationships

World exploration routes may connect:

- regions
- landmarks
- towns
- attractions

### Field intent

- `routeId`: deterministic route identity
- `routeType`: route role such as scenic, connector, heritage, mountain, or coastal travel
- `distance`: total journey length
- `difficulty`: route challenge shaped by geography and remoteness
- `rewardPotential`: quest, achievement, collection, or discovery value

### Route rules

- routes should support multi-region travel
- not every route should be shortest-path efficient
- scenic and landmark-driven travel should coexist with service corridors
- route difficulty should reflect geography
- reward potential should justify long-range exploration

## 12. World Streaming Chunk Schema

### Schema ID

- `WORLD_STREAMING_CHUNK_001`

### Required fields

- `schemaId`
- `chunkId`
- `regionOwnership`
- `loadingPriority`
- `cacheRules`
- `neighbourRelationships`

### Field intent

- `chunkId`: deterministic chunk identity
- `regionOwnership`: which region or region group anchors the chunk
- `loadingPriority`: relative importance during travel and exploration
- `cacheRules`: mobile-safe caching and retention logic
- `neighbourRelationships`: adjacent chunk relationships for seamless transitions

### Streaming rules

- streaming must remain mobile friendly
- deterministic regeneration must rebuild the same chunk layout
- instance reuse must be preserved
- chunks should support region boundaries without breaking cross-region corridors
- cache rules should favour current region, connected travel corridors, and active destination chains

## 13. World Validation Schema

### Schema ID

- `WORLD_VALIDATION_001`

### Required fields

- `schemaId`
- `regionsValid`
- `noImpossibleOverlaps`
- `transitionsValid`
- `biomeConsistency`
- `climateConsistency`
- `corridorsConnected`
- `routesReachable`
- `landmarksAccessible`
- `chunkBoundariesValid`
- `loadingStrategyValid`
- `deterministicRebuildValid`
- `validationPassed`

### Validation intent

World:

- regions valid
- no impossible overlaps
- transitions valid

Geography:

- biome consistency
- climate consistency

Connections:

- corridors connect regions
- routes are reachable

Exploration:

- landmarks accessible

Streaming:

- chunk boundaries valid
- loading strategy valid

Determinism:

- same seed = same world

## 14. Preview Configuration

### Preview ID

- `WORLD_LAYOUT_001_PREVIEW_001`

### Preview purpose

The first world preview configuration must demonstrate:

- multiple regions
- varied geography
- transport network
- landmark reserves
- exploration routes

### Preview contract expectation

This preview configuration should remain:

- reference-based
- deterministic
- suitable for future visual world inspection
- compatible with later Blender or Atlas preview consumer layers

## 15. Implementation Readiness

`WORLD_LAYOUT_001` is now ready for generator implementation.

Recommended next session scope:

- implement deterministic world generation
- generate first world preview JSON
- generate world validation output
- add world generator tests

Readiness status:

- `READY FOR DETERMINISTIC WORLD GENERATOR IMPLEMENTATION`
