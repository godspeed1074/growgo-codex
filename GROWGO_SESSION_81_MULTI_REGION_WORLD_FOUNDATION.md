# GROWGO SESSION 81 — MULTI REGION WORLD FOUNDATION

## Session Scope

This session defines the procedural foundation for:

- `WORLD_LAYOUT_001`

Purpose:

- provide a deterministic connected-world framework that combines multiple regions into one coherent Australian-scale procedural world

This session is planning and specification only.

This session does not:

- create Blender assets
- create exports
- create world scenes
- create new buildings
- create new modules
- modify registered assets
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## Files Created

- `GROWGO_SESSION_81_MULTI_REGION_WORLD_FOUNDATION.md`

## Files Changed

- none

## 1. Foundation Goal

The region system now supports:

- deterministic regional generation through `REGION_LAYOUT_001`
- machine-readable region contracts
- connected settlement, transport, natural, landmark, and exploration layers
- metadata and inspection traceability ready for larger-scale composition

The next procedural scale is not a larger single region.

It is a connected world layer that can place, relate, and stream multiple regions while preserving deterministic behaviour.

`WORLD_LAYOUT_001` must support:

- multiple connected regions
- large-scale geography
- ocean and coastal continuity
- cross-region transport corridors
- global landmark placement
- long-range exploration structure
- world streaming boundaries

Core rule:

- worlds extend the region architecture
- worlds do not replace or bypass region generation

## 2. World Purpose

`WORLD_LAYOUT_001` must describe a deterministic procedural world that can generate:

- world boundary and geography
- region placement
- inter-region transition rules
- world-scale transport structure
- large-scale landmark reserve placement
- long-range exploration corridors
- world validation output

The contract must remain readable by:

- future world generator scripts
- future world validation scripts
- preview adapters
- visual preview consumers
- future Atlas bridge layers
- future streaming and chunk-management systems

## 3. World Structure

`WORLD_LAYOUT_001` must combine:

- regions
- oceans and coastlines
- biome and terrain systems
- inter-region transport corridors
- exploration corridors
- global landmark reserves
- world streaming metadata

High-level world layers:

- world geography layer
- region placement layer
- connection layer
- landmark layer
- exploration layer
- streaming layer
- validation layer

The world should feel like a believable connected landmass or coastal chain where regions are shaped by geography first and stitched together through purposeful travel logic.

## 4. World Seed System

### Required Inputs

- `worldSeed`
- `geographySeed`
- `climateSeed`
- `biomeSeed`
- `settlementSeed`

### Deterministic Expectations

The same seed set must produce:

- the same world geography
- the same region arrangement
- the same region profiles
- the same connection corridors
- the same landmark reserve layout
- the same exploration structure
- the same validation output

### Suggested Shape

```json
{
  "worldSeed": 10482,
  "geographySeed": "AU_CONTINENTAL_COASTAL",
  "climateSeed": "TEMPERATE_MIXED",
  "biomeSeed": "COASTAL_FOREST_FARMLAND",
  "settlementSeed": "MULTI_REGION_SCENIC_WORLD"
}
```

## 5. World Structure Model

`WORLD_LAYOUT_001` must act as the orchestration layer above `REGION_LAYOUT_001`.

### Composition Rule

World generation order should conceptually follow:

world seed

↓

world geography

↓

region placement

↓

region transitions

↓

inter-region transport

↓

world landmarks

↓

exploration routes

↓

validation

### Region as Approved Unit

`REGION_LAYOUT_001` remains the approved procedural settlement container for:

- towns
- villages
- hamlets
- natural zones
- regional landmarks
- regional transport

`WORLD_LAYOUT_001` must treat regions as connected world-scale units rather than regenerate town logic itself.

## 6. Region Placement System

The world must support region placement through:

- `REGION_INSTANCE_001`

### Required Fields

- `regionId`
- `regionProfile`
- `position`
- `size`
- `biome`
- `climate`
- `neighbouringRegions`
- `transitionRules`

### Region Profiles To Support

- `COASTAL_REGION`
- `RURAL_REGION`
- `MOUNTAIN_REGION`
- `TOURISM_REGION`
- `METROPOLITAN_EDGE_REGION`

### Placement Intent

- coastal regions should align to oceans, bays, or outer shoreline systems
- rural regions should occupy inland farmland, river, or open-country corridors
- mountain regions should occupy barrier terrain and landmark-heavy interior areas
- tourism regions should cluster around scenic coasts, protected areas, or major attractions
- metropolitan-edge regions should form higher-intensity growth bands near larger transport concentration

### Placement Rules

- neighbouring regions must have believable transition logic
- coastal regions should not appear landlocked
- mountain regions should influence corridor direction and route difficulty
- tourism regions should relate to landmark density and visitor access
- metropolitan-edge regions should sit on stronger transport spines
- repeated region patterns should be limited by world profile weighting

### Avoid

- evenly spaced grid-like regions
- abrupt profile jumps without terrain or transport explanation
- isolated regions with no corridor purpose
- coastal chains with no inland support structure

## 7. World Geography System

The world must support:

- `WORLD_GEOGRAPHY_ZONE_001`

### Geography Types

- oceans
- coastlines
- mountains
- forests
- deserts
- farmland
- wetlands
- rivers

### Geography Influence

World geography must influence:

- region placement
- settlement density
- transport direction
- landmark frequency
- exploration value

### Geography Rules

Oceans and coasts:

- define coastal region opportunity
- constrain overland movement
- support ferries and shoreline routes

Mountains:

- act as major barriers
- shape passes, ridges, and landmark density
- limit high-density region placement

Forests:

- support scenic and protected transitions
- increase exploration value

Deserts:

- reduce region density
- increase travel difficulty
- favour sparse corridors and landmark-driven journeys

Farmland:

- support rural and service-region placement
- create lower-barrier inland connections

Wetlands and rivers:

- shape crossings and route chokepoints
- support ecological identity and exploration routes

## 8. Region Connection System

The world must support:

- `WORLD_CONNECTION_CORRIDOR_001`

### Connection Types

- highways
- railways
- coastal routes
- ferries
- trails

### Required Fields

- `connectionType`
- `startRegion`
- `endRegion`
- `distance`
- `travelDifficulty`
- `explorationValue`

### Connection Rules

- highways should connect the most important service and population regions
- railways should favour long-distance efficient spines between high-value regional anchors
- coastal routes should follow shoreline logic and tourism movement
- ferries should connect separated coastal regions, islands, or water-barrier edges
- trails should connect protected, scenic, or low-intensity regions

### Connection Quality Rules

- every region must have at least one meaningful world connection
- high-value regions should have multiple access modes where justified
- travel difficulty must reflect geography
- world connections must not ignore ocean, mountain, or wetland barriers
- scenic value should shape at least some non-optimal routes

## 9. World Landmark System

The world must support:

- `WORLD_LANDMARK_RESERVE_001`

### Supported Landmark Classes

- natural wonders
- famous locations
- historical places
- unique discoveries

### Required Fields

- `location`
- `regionRelationship`
- `rarity`
- `explorationValue`

### Landmark Rules

- some landmarks should be region-local
- some landmarks should be world-significant destinations
- landmark rarity should vary by world profile
- landmark placement should reinforce geography rather than ignore it

### Example Landmark Types

- great coastal cliffs
- major lighthouse systems
- national park anchor destinations
- canyon or waterfall chains
- historic inland rail towns
- mountain lookouts
- geological formations

## 10. World Exploration System

The world must support:

- `WORLD_EXPLORATION_ROUTE_001`

### Supported Route Relationships

Routes may connect:

- regions
- landmarks
- towns
- attractions

### Required Fields

- `routeType`
- `distance`
- `difficulty`
- `discoveryRewardPotential`

### Exploration Rules

- world exploration routes should be more than shortest-path travel
- some routes should exist for discovery, scenic travel, and achievement design
- routes should support chaining across multiple regions
- difficulty should reflect both geography and remoteness

### Example World Route Roles

- coastal grand tour
- inland heritage route
- mountain discovery route
- multi-region national-park chain
- ferry and foreshore visitor loop

## 11. World Streaming System

The world must support streaming and chunk orchestration from the start.

### Required Support

- world chunks
- region loading boundaries
- cached regions
- device limitations

### Streaming Requirements

- mobile friendly
- instance reuse
- deterministic regeneration

### Streaming Rules

- regions should be the primary content container
- world chunks may group one or more nearby regions
- cross-region corridors must survive chunk transitions
- landmark and route metadata must remain valid even when geometry is not loaded
- cache rules should prioritise nearby regions, active travel corridors, and current destination chains

## 12. World Profiles

`WORLD_LAYOUT_001` must support multiple world identity profiles.

### AUSTRALIAN_COASTAL_WORLD

Characteristics:

- strong coastline presence
- multiple coastal regions
- moderate inland support
- high scenic travel value
- strong lighthouse, foreshore, and tourism opportunities

### CONTINENTAL_WORLD

Characteristics:

- larger inland spread
- stronger rural and service-region balance
- longer transport spines
- broader biome shifts

### MOUNTAIN_WORLD

Characteristics:

- heavy terrain constraint
- lower movement efficiency
- landmark-heavy routing
- stronger pass and valley logic

### TOURISM_WORLD

Characteristics:

- higher landmark density
- stronger scenic and visitor corridors
- more coastal and protected-area emphasis
- higher recreation weighting

### Profile Fields To Define Later In Contract Form

- geography weighting
- region density
- landmark frequency
- transport intensity

## 13. Transition Rules

World generation must support believable region-to-region transitions.

### Required Transition Types

- coastal to rural
- rural to mountain
- tourism to protected natural edge
- metropolitan edge to service hinterland

### Transition Rules

- boundaries should reflect geography, not only abstract partition lines
- transition corridors should explain why adjacent regions interact
- biome shifts should be gradual where appropriate
- hard boundaries should be justified by water, mountains, or protected systems

## 14. Validation System

`WORLD_LAYOUT_001` must include world-scale validation rules.

### World Checks

- regions valid
- transitions valid
- no impossible overlaps

### Geography Checks

- biome consistency
- natural transitions

### Travel Checks

- corridors connected
- routes reasonable

### Performance Checks

- chunk boundaries
- streaming suitability

### Determinism Check

- same seed = same world

### Additional Validation Intent

- each region profile should be geographically justified
- each world connection should serve either service, travel, or exploration value
- major barriers should meaningfully influence the final corridor graph
- landmark rarity and spread should remain inside world-profile expectations

## 15. Future Expansion Path

This foundation should remain compatible with:

- multi-world profile generation
- atlas-scale preview consumers
- global travel systems
- region-to-region quest chains
- world map progression
- biome-specific landmark sets
- future ocean, island, and inland basin worlds

## 16. Implementation Readiness

`WORLD_LAYOUT_001` is ready for machine-readable contract definition next.

Recommended next session scope:

- define a machine-readable world contract
- formalize `REGION_INSTANCE_001`
- formalize `WORLD_GEOGRAPHY_ZONE_001`
- formalize `WORLD_CONNECTION_CORRIDOR_001`
- formalize `WORLD_LANDMARK_RESERVE_001`
- formalize `WORLD_EXPLORATION_ROUTE_001`
- define deterministic world preview configuration

Readiness status:

- `READY FOR MACHINE-READABLE WORLD CONTRACT`
