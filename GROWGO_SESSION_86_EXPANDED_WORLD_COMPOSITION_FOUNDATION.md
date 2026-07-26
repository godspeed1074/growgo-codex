# GROWGO SESSION 86 — EXPANDED WORLD COMPOSITION FOUNDATION

## Session Scope

This session defines the next composition foundation for:

- `WORLD_COMPOSITION_PROFILE_SYSTEM_001`

Purpose:

- extend `WORLD_LAYOUT_001` into a larger, more varied connected-world composition system while preserving one deterministic world-generation architecture

This session is planning and specification only.

This session does not:

- create Blender assets
- create exports
- create world generator code
- create new buildings
- create new modules
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## Files Created

- `GROWGO_SESSION_86_EXPANDED_WORLD_COMPOSITION_FOUNDATION.md`

## Files Changed

- none

## 1. Foundation Goal

The first world implementation now supports:

- one deterministic world generator
- one connected `AUSTRALIAN_COASTAL_WORLD` profile
- a valid region mix
- a valid corridor network
- a valid landmark and exploration layer
- a reference-based streaming structure

The next step is not a different engine.

It is a composition system that lets the same world engine produce:

- larger worlds
- more varied geography
- richer region relationships
- different travel scales
- more deliberate exploration density

Core rule:

- `WORLD_LAYOUT_001` remains the approved world-generation engine
- `WORLD_COMPOSITION_PROFILE_SYSTEM_001` shapes scale, diversity, density, and relationship rules above it

## 2. Composition Purpose

`WORLD_COMPOSITION_PROFILE_SYSTEM_001` must allow one deterministic world engine to produce:

- small worlds
- medium worlds
- large worlds
- profile-specific geography mixes
- profile-specific settlement distributions
- profile-specific transport and exploration balance

The composition layer must remain readable by:

- future world generator revisions
- future validation scripts
- future preview consumers
- future multi-world comparison tools
- future streaming and travel systems

## 3. World Scale Expansion

The composition system must support three initial world scales.

### Small World

Target:

- `3–5` regions

Characteristics:

- readable first-pass travel structure
- short inter-region distances
- compact exploration loops
- suitable for validation and inspection

### Medium World

Target:

- `8–20` regions

Characteristics:

- more varied geography
- stronger multi-region identity clusters
- wider transport hierarchy
- stronger long-distance travel value

### Large World

Target:

- `20+` regions

Characteristics:

- broad biome diversity
- stronger regional specialization
- higher travel stakes
- world-route progression rather than only regional movement

### Scale Rules

For each scale define:

- region count rules
- distance rules
- travel scale
- exploration density

### Scale Logic

Small worlds should emphasize:

- clarity
- compact travel
- fast validation

Medium worlds should emphasize:

- variety
- transition richness
- stronger travel tiers

Large worlds should emphasize:

- identity diversity
- long-range route chains
- chunked streaming discipline

## 4. Geographic Diversity System

The composition system must support combinations of:

- coastal regions
- rural regions
- mountain regions
- forest regions
- desert regions
- wetland regions
- urban edge regions

### Diversity Rule

Geography must influence:

- region placement
- settlement types
- transport routes
- landmark frequency

### Diversity Behaviour

Coastal-heavy worlds:

- stronger shoreline alignment
- more tourism pressure
- more ferry and scenic-route opportunity

Rural-heavy worlds:

- more inland service logic
- broader settlement spacing
- stronger highway and rail spines

Mountain-heavy worlds:

- more constrained corridors
- rarer but stronger landmarks
- more high-value remote journeys

Forest and wetland-heavy worlds:

- stronger protected-area logic
- more scenic or slower travel
- more route shaping through natural barriers

Desert-heavy worlds:

- fewer dense settlements
- more isolated rare discoveries
- more meaningful long-distance travel

Urban-edge-heavy worlds:

- more metropolitan transition pressure
- stronger service corridors
- more chunk-ownership complexity

## 5. Region Relationship System

The composition system must define:

- `REGION_RELATIONSHIP_001`

### Purpose

This relationship layer must formalize how regions interact beyond simple adjacency.

### Required support

- neighbouring regions
- transition zones
- trade routes
- tourism links
- transport corridors

### Example relationships

- coastal region -> mountain region
- rural region -> regional town support corridor
- tourism region -> landmark network
- metropolitan edge region -> inland service corridor
- wetland or forest region -> protected exploration belt

### Relationship intents

Neighbouring regions:

- define direct adjacency
- shape visual continuity
- shape corridor feasibility

Transition zones:

- prevent hard unnatural boundaries
- explain biome and settlement shifts

Trade routes:

- justify major corridors
- explain why settlements matter to each other

Tourism links:

- create destination chains
- support attraction clustering

Transport corridors:

- formalize high-priority movement routes between region identities

## 6. World Travel Scale

The composition system must define four travel tiers.

### LOCAL

Scope:

- within town

Purpose:

- daily movement
- short errands
- small loops

### REGIONAL

Scope:

- between towns

Purpose:

- service access
- short delivery or commuter logic
- nearby attraction travel

### LONG_DISTANCE

Scope:

- between regions

Purpose:

- strategic travel
- trade or destination routing
- chunk-to-chunk movement

### EPIC

Scope:

- world exploration routes

Purpose:

- long-form discovery
- multi-region achievements
- landmark chain progression

### Travel tier fields

Each tier should define:

- distance
- difficulty
- reward potential

### Travel tier rules

Small worlds should compress:

- regional and long-distance tiers

Medium worlds should separate:

- local
- regional
- long-distance

Large worlds should make epic travel a distinct system rather than a stretched regional route

## 7. World Exploration Density

The composition system must define how exploration value varies by world profile and scale.

### High Exploration Worlds

Characteristics:

- many landmarks
- short discovery loops
- more route intersections
- denser attraction chains

### Low Exploration Worlds

Characteristics:

- longer journeys
- rarer discoveries
- bigger travel payoff
- stronger isolation value

### Tourism Worlds

Characteristics:

- dense attractions
- destination clustering
- scenic route layering
- stronger visible reward cadence

### Remote Worlds

Characteristics:

- rare high-value locations
- fewer but more meaningful route decisions
- longer quiet travel bands

### Density rule

Exploration density must influence:

- landmark count
- route spacing
- route difficulty
- reward pacing

## 8. Settlement Distribution

The composition system must define how settlements scale as world size grows.

### Major Towns

Rules:

- fewer in number
- highly connected
- strong corridor responsibility
- act as travel anchors

### Villages

Rules:

- more frequent
- support regional texture
- help reduce empty travel bands

### Hamlets

Rules:

- function as exploration points
- support scenic or remote identity
- should not behave like diluted towns

### Distribution principle

Avoid:

- evenly spaced settlements

Prefer:

- geography-shaped placement
- corridor-shaped support spacing
- landmark-shaped travel stops
- profile-specific clustering

## 9. World Identity Profiles

The expanded system must support multiple composition identities.

### AUSTRALIAN_COASTAL_WORLD

Characteristics:

- strong coastline weighting
- coastal/tourism region mix
- medium scenic density
- shoreline and ferry opportunity

### AUSTRALIAN_OUTBACK_WORLD

Characteristics:

- sparse settlements
- long inland travel
- stronger rarity value
- more remote route logic

### ALPINE_WORLD

Characteristics:

- elevation-driven region placement
- constrained corridors
- strong discovery value
- landmark-heavy mountains and forests

### TOURISM_ARCHIPELAGO_WORLD

Characteristics:

- coastal and island-style composition
- ferry-rich travel logic
- strong attraction density
- short scenic loops mixed with destination chains

### METROPOLITAN_EXPANSION_WORLD

Characteristics:

- stronger urban-edge pressure
- denser settlement support
- more transport hierarchy
- more chunk and cache complexity

### Profile fields

Each profile should define:

- geography weighting
- region mix
- settlement density
- transport intensity
- landmark frequency

## 10. Streaming Scale

The composition system must define how streaming scales with larger world sizes.

### Support requirements

- more chunks
- region loading
- long-distance travel
- cache strategy

### Streaming requirements

- mobile friendly
- deterministic
- low memory overhead

### Streaming rules

Small worlds:

- simpler chunk ownership
- fewer simultaneous active zones

Medium worlds:

- multiple active corridor-linked chunks
- stronger cache prediction

Large worlds:

- layered loading priority
- travel-direction-aware caching
- stronger chunk handoff logic

### Streaming principle

Scale must increase composition richness without collapsing mobile viability.

## 11. Validation Requirements

The composition system must define checks for:

- geographic continuity
- region relationships
- travel feasibility
- settlement distribution
- exploration balance
- streaming boundaries

### Validation intent

Geographic continuity:

- biome transitions should feel explainable
- water, mountain, forest, and desert systems should shape growth logically

Region relationships:

- adjacent regions should complement or intentionally contrast
- no accidental identity clashes without transition support

Travel feasibility:

- route tiers should remain meaningful
- long-distance and epic travel should be justified by reward or utility

Settlement distribution:

- no grid-like spacing
- no over-concentration without corridor or resource logic

Exploration balance:

- worlds should not feel empty or over-packed relative to profile and scale

Streaming boundaries:

- chunk layouts should stay practical for inspection and runtime scaling

## 12. Implementation Readiness

`WORLD_COMPOSITION_PROFILE_SYSTEM_001` is ready for machine-readable contract definition next.

Recommended next session scope:

- define a machine-readable expanded world composition contract
- formalize `REGION_RELATIONSHIP_001`
- formalize scale profiles for small, medium, and large worlds
- formalize exploration-density rules
- formalize streaming-scale rules

Readiness status:

- `READY FOR MACHINE-READABLE EXPANDED WORLD COMPOSITION CONTRACT`
