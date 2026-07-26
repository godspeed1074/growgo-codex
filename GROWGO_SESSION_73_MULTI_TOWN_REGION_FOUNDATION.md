# GROWGO SESSION 73 — MULTI TOWN REGION FOUNDATION

## Session Scope

This session defines the procedural foundation for:

- `REGION_LAYOUT_001`

Purpose:

- provide a procedural Australian region-generation framework that combines multiple towns, settlements, natural systems, transport links, and exploration routes

This session is planning and specification only.

This session does not:

- create Blender assets
- create exports
- create new buildings
- create new modules
- create final world scenes
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## Files Created

- `GROWGO_SESSION_73_MULTI_TOWN_REGION_FOUNDATION.md`

## Files Changed

- none

## 1. Foundation Goal

The town system now supports multiple deterministic settlement identities through:

- `TOWN_LAYOUT_001`
- `TOWN_VARIANT_PROFILE_SYSTEM_001`

The next procedural scale is not a larger town. It is a region layer that can place and connect multiple settlements within one coherent Australian landscape.

`REGION_LAYOUT_001` must support:

- multiple towns
- villages and hamlets
- rural connections
- natural areas
- landmark reserves
- regional transport corridors
- exploration routes

Core rule:

- regions extend the town and district architecture
- regions do not replace or bypass town generation

## 2. Region Purpose

`REGION_LAYOUT_001` must describe a deterministic Australian region that can generate:

- settlement hierarchy
- multi-town placement
- regional transport structure
- natural zone distribution
- regional landmark reserve placement
- exploration routes between settlements and natural features
- region-scale validation output

The contract must remain readable by:

- future region generator scripts
- future region validation scripts
- future preview consumers
- future world and atlas bridge layers

## 3. Region Structure

`REGION_LAYOUT_001` must combine:

- towns
- villages
- rural settlements
- natural areas
- transport corridors
- landmarks
- exploration routes

The region should feel like a believable Australian landscape where settlement patterns follow geography and infrastructure rather than artificial even spacing.

High-level region layers:

- settlement layer
- transport layer
- natural layer
- landmark layer
- exploration layer
- validation layer

## 4. Region Seed System

### Required Inputs

- `regionSeed`
- `biomeSeed`
- `climateSeed`
- `settlementPatternSeed`

### Deterministic Expectations

The same seed set must produce:

- the same major towns
- the same minor settlements
- the same road and rail relationships
- the same landmark reserve placement
- the same natural zone layout
- the same exploration route network

### Suggested Shape

```json
{
  "regionSeed": 10482,
  "biomeSeed": "COASTAL_TEMPERATE",
  "climateSeed": "MILD_WET_SUMMER",
  "settlementPatternSeed": "LOW_DENSITY_COASTAL_REGION"
}
```

## 5. Settlement Hierarchy

`REGION_LAYOUT_001` must support a multi-level settlement hierarchy.

### MAJOR_TOWN

Characteristics:

- largest population in the region
- strongest service and commercial role
- primary transport hub
- strongest civic concentration
- likely regional anchor

Typical use:

- major inland service centre
- major coastal destination town
- administrative anchor

### REGIONAL_TOWN

Characteristics:

- civic and service role
- supports surrounding smaller settlements
- moderate transport importance
- moderate commercial and civic intensity

Typical use:

- agricultural service town
- district centre
- inland connector town

### SMALL_COASTAL_TOWN

Characteristics:

- waterfront relationship
- tourism and recreation
- foreshore identity
- lower-density housing mix

Typical use:

- coastal holiday town
- fishing or tourism settlement
- scenic waterfront destination

### VILLAGE

Characteristics:

- small settlement scale
- limited services
- strong rural identity
- usually linked to one nearby larger town

Typical use:

- farming village
- scenic roadside village
- settlement near a local landmark

### HAMLET

Characteristics:

- minimal settlement
- low service level
- exploration or rural identity point
- often functions as a travel marker rather than a full service centre

Typical use:

- mountain hamlet
- river crossing stop
- lookout-side cluster

## 6. Town Placement System

Settlement placement must be shaped by geography and infrastructure.

### Placement Influences

- terrain relationship
- water relationship
- road relationship
- resource relationship
- distance rules

### Required Rules

- major settlements should anchor the strongest transport and land-use structure
- minor settlements should relate to larger nearby service towns
- coastal towns should not appear deep inland
- regional towns should not cluster too tightly unless justified by transport or terrain
- villages and hamlets should create believable spread rather than artificial grids

### Avoid

- evenly spaced artificial towns
- identical repeated settlement patterns
- settlements placed without transport logic
- coastal identities detached from coastline or river-mouth logic

### Placement Logic Examples

Coastal placement:

- prefers coastline, estuaries, bays, beaches, or lookout-adjacent terrain

Regional placement:

- prefers road junctions, flatter inland corridors, and agricultural access zones

Village placement:

- prefers local-road nodes, river crossings, or edge-of-farmland positions

Hamlet placement:

- prefers scenic or functional micro-locations such as trailheads, ridge roads, or isolated rural links

## 7. Transport Network

The regional transport layer must connect settlements and natural destinations.

### Supported Regional Connections

- highways
- major roads
- local roads
- railway corridors
- ferry or coastal routes

### Transport Hierarchy

#### Highways

- connect major towns
- handle longest region travel distances
- shape settlement corridors

#### Major Roads

- connect regional towns, coastal towns, and villages
- support cross-region movement

#### Local Roads

- connect villages, hamlets, farms, and local landmarks

#### Railway Corridors

- connect major service centres
- support future stations or freight reserve logic

#### Ferry / Coastal Routes

- optional future support for coastal regions and island-linked settlement patterns

### Travel Rules

- every settlement above hamlet level must connect into the road hierarchy
- major towns should not become isolated endpoints unless terrain explicitly justifies it
- travel distances must feel region-scale rather than town-scale
- transport corridors must support future exploration, services, and destination logic

## 8. Natural System

Natural zones must do more than fill empty space. They must shape the region.

### Natural Zone Types

- coastline
- forests
- farmland
- rivers
- wetlands
- mountains / hills
- protected areas

### Region Rules

- natural zones influence settlement placement
- natural zones create barriers and corridors
- natural zones support landmark placement
- natural zones create exploration opportunities
- farmland should concentrate around suitable low-slope settlement-support areas
- protected natural areas should suppress dense settlement placement

### Examples

Coastline:

- supports coastal towns, tourism zones, lighthouses, beaches, and scenic routes

Forest:

- suppresses dense settlement
- supports trails, lookouts, and natural landmarks

Farmland:

- supports regional towns, villages, and rural road webs

River systems:

- shape crossings, valley settlement, and exploration routes

Mountains / hills:

- create scenic edge behaviour, protected zones, and low-density placement restrictions

## 9. Landmark System

`REGION_LAYOUT_001` must support regional landmark reserves that act as exploration anchors and world-identity signals.

### Supported Landmark Reserve Types

- national parks
- waterfalls
- lighthouses
- historic sites
- scenic lookouts
- geological features

### Landmark Rules

- landmark placement must respond to natural zones and transport access
- landmark density should vary by region profile
- landmarks should encourage movement between settlements and natural features
- not every landmark needs a town nearby, but every landmark should have an access logic

### Region Roles

- tourism anchor
- scenic anchor
- heritage anchor
- navigation anchor
- exploration reward

## 10. Exploration Route System

The region must support routes that connect settlements and landmarks into discoverable travel paths.

### Supported Exploration Links

- town-to-town routes
- town-to-landmark routes
- trail networks
- scenic drives
- coastal walks
- lookout chains

### Required Uses

- future quests
- achievements
- collections
- sightseeing loops
- progression routes

### Rules

- routes must connect meaningful destinations
- routes should not duplicate the entire road hierarchy
- natural zones should influence route character
- scenic loops should be different from service corridors

## 11. Region Profiles

`REGION_LAYOUT_001` must support multiple large-scale region identities.

### COASTAL_REGION

Characteristics:

- coastline and estuary emphasis
- coastal towns and recreation
- tourism and scenic routes
- medium landmark frequency
- moderate settlement density

Key weighting:

- settlement density: medium
- terrain weighting: coast and low hills
- transport intensity: medium
- landmark frequency: high scenic coastal

### RURAL_REGION

Characteristics:

- farmland and inland settlements
- strong regional-town support
- practical road hierarchy
- lower tourism emphasis

Key weighting:

- settlement density: low-medium
- terrain weighting: plains, rivers, farmland
- transport intensity: medium-high
- landmark frequency: medium

### MOUNTAIN_REGION

Characteristics:

- terrain-constrained settlement
- stronger scenic routes
- more protected areas
- lower settlement density

Key weighting:

- settlement density: low
- terrain weighting: mountains, valleys, rivers
- transport intensity: medium
- landmark frequency: high scenic and natural

### TOURISM_REGION

Characteristics:

- multiple attractions
- visitor-focused settlements
- stronger landmark density
- stronger recreation network

Key weighting:

- settlement density: medium
- terrain weighting: scenic mixed
- transport intensity: medium-high
- landmark frequency: very high

### METROPOLITAN_EDGE_REGION

Characteristics:

- city-edge expansion
- suburban and peri-urban spread
- stronger transport corridors
- higher settlement density

Key weighting:

- settlement density: high
- terrain weighting: urban fringe and corridors
- transport intensity: high
- landmark frequency: medium-low

## 12. Validation System

`REGION_LAYOUT_001` must define validation rules for structure, travel, nature, and performance.

### Region Checks

- settlements valid
- settlement hierarchy consistent
- roads connected
- no impossible overlaps

### Travel Checks

- routes accessible
- distances reasonable
- major settlements connected
- isolated hamlets justified by terrain or exploration role

### Natural Checks

- natural zones valid
- landmarks placed correctly
- protected areas respected
- settlement placement responds to terrain and water

### Performance Checks

- streaming boundaries defined
- region chunking compatible
- instance reuse preserved
- preview layers separable

## 13. Readiness Rules

Before implementation:

- `REGION_LAYOUT_001` must extend the current deterministic settlement architecture
- towns remain generated through `TOWN_LAYOUT_001`
- town variants remain the approved source of settlement identity
- region generation must place towns and other settlements, not hand-author them
- natural and transport layers must stay machine-readable before any large-scale preview system is built

## 14. Recommended Implementation Order

Recommended next steps:

1. define the machine-readable `REGION_LAYOUT_001` contract
2. define settlement-placement schemas and region profile schemas
3. implement deterministic settlement hierarchy placement
4. add regional transport corridor generation
5. add natural-zone placement
6. add landmark reserves
7. add exploration-route generation
8. add region preview and validation tooling

## 15. Readiness Status

Session 73 status:

- `READY FOR IMPLEMENTATION`

The system is now prepared to scale from single-town generation into deterministic multi-town regional generation using one shared procedural architecture.
