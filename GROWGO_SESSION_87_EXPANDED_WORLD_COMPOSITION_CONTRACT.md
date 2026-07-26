# GROWGO SESSION 87 — EXPANDED WORLD COMPOSITION CONTRACT

## Session Scope

This session defines the machine-readable contract for:

- `WORLD_COMPOSITION_PROFILE_SYSTEM_001`

Purpose:

- machine-readable rules for generating worlds of different scales and identities from one deterministic world engine

This session creates schemas and contracts only.

This session does not:

- create Blender assets
- create exports
- create world generator code
- create world preview scenes
- create new buildings
- create new modules
- modify registered assets
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## Files Created

- `GROWGO_SESSION_87_EXPANDED_WORLD_COMPOSITION_CONTRACT.md`

## Files Changed

- none

## 1. Source Of Truth

This contract is based on:

- `GROWGO_SESSION_86_EXPANDED_WORLD_COMPOSITION_FOUNDATION.md`
- `GROWGO_SESSION_82_MACHINE_READABLE_WORLD_CONTRACT.md`
- `GROWGO_SESSION_83_DETERMINISTIC_WORLD_GENERATOR.md`

Continuity rules:

- `WORLD_LAYOUT_001` remains the approved deterministic world-generation engine
- `WORLD_COMPOSITION_PROFILE_SYSTEM_001` shapes world scale, identity, density, and relationship behaviour above the base world engine
- composition outputs must remain fully reproducible from profile plus seed alone
- expanded composition rules must stay machine-readable before any future scale-up generator pass, preview pass, or runtime integration

## 2. Contract Goal

`WORLD_COMPOSITION_PROFILE_SYSTEM_001` must describe machine-readable composition rules that can produce:

- small, medium, and large world configurations
- multiple world identity profiles
- geography-driven region mixes
- relationship-driven travel structures
- exploration-density differences
- streaming-scale differences
- deterministic composition validation output

The contract must be readable by:

- future expanded world generator logic
- validation scripts
- preview consumers
- multi-world comparison tools
- streaming planners

## 3. Schema Set

This session defines these schema identities:

- `WORLD_COMPOSITION_PROFILE_001`
- `WORLD_SCALE_PROFILE_001`
- `REGION_RELATIONSHIP_001`
- `WORLD_TRAVEL_TIER_001`
- `EXPLORATION_DENSITY_PROFILE_001`
- `WORLD_COMPOSITION_VALIDATION_001`

## 4. World Composition Profile Schema

### Schema ID

- `WORLD_COMPOSITION_PROFILE_001`

### Required fields

- `profileId`
- `worldIdentity`
- `scaleProfile`
- `geographyWeighting`
- `regionMix`
- `settlementDensity`
- `transportIntensity`
- `landmarkFrequency`
- `explorationDensity`
- `streamingRequirements`

### Field intent

- `profileId`: versioned composition profile identity
- `worldIdentity`: high-level world character and intended feel
- `scaleProfile`: selected world scale behaviour
- `geographyWeighting`: macro weighting across biome and terrain types
- `regionMix`: preferred profile balance for placed regions
- `settlementDensity`: expected settlement spread and clustering
- `transportIntensity`: overall corridor emphasis
- `landmarkFrequency`: expected landmark density
- `explorationDensity`: selected exploration density profile
- `streamingRequirements`: machine-readable chunking and caching requirements

### Suggested shape

```json
{
  "schemaId": "WORLD_COMPOSITION_PROFILE_001",
  "profileId": "AUSTRALIAN_COASTAL_WORLD",
  "worldIdentity": "SCENIC_COASTAL_CHAIN",
  "scaleProfile": "SMALL_WORLD",
  "geographyWeighting": {},
  "regionMix": {},
  "settlementDensity": "MEDIUM_SCENIC",
  "transportIntensity": "MEDIUM_HIGH",
  "landmarkFrequency": "HIGH",
  "explorationDensity": "HIGH_EXPLORATION",
  "streamingRequirements": {}
}
```

## 5. World Scale Profile Schema

### Schema ID

- `WORLD_SCALE_PROFILE_001`

### Required fields

- `scaleId`
- `regionCountRange`
- `travelDistanceRange`
- `explorationDensity`
- `chunkRequirements`

### Scale profiles

#### SMALL_WORLD

Intent:

- compact readable worlds
- fast inspection and validation
- short inter-region travel

Required support:

- region count range
- travel distance range
- exploration density
- chunk requirements

#### MEDIUM_WORLD

Intent:

- larger region count
- longer travel
- multiple settlement networks
- expanded streaming

Required support:

- broader region count
- separated travel tiers
- denser relationship logic
- more active chunks

#### LARGE_WORLD

Intent:

- many regions
- continent-scale travel
- major transport systems
- advanced streaming requirements

Required support:

- high region count
- long-range route logic
- chunk hierarchy support
- stronger cache and memory rules

### Suggested shape

```json
{
  "schemaId": "WORLD_SCALE_PROFILE_001",
  "scaleId": "MEDIUM_WORLD",
  "regionCountRange": [8, 20],
  "travelDistanceRange": "MULTI_REGION",
  "explorationDensity": "MEDIUM_EXPLORATION",
  "chunkRequirements": {
    "minimumChunkCount": 8,
    "streamingComplexity": "MEDIUM"
  }
}
```

## 6. World Identity Profile Definitions

The expanded composition system must support machine-readable identity profiles.

### AUSTRALIAN_COASTAL_WORLD

Include:

- coastal geography
- tourism weighting
- marine landmarks
- scenic routes

Suggested identity:

- coastal settlement chain with inland support and strong foreshore travel value

### AUSTRALIAN_OUTBACK_WORLD

Include:

- remote settlements
- large travel distances
- sparse landmarks
- rural routes

Suggested identity:

- low-density inland world with rare high-value destinations and long-distance route significance

### ALPINE_WORLD

Include:

- mountain geography
- forests
- elevation routes
- remote exploration

Suggested identity:

- constrained, landmark-rich mountain world driven by passes, valleys, and discovery corridors

### TOURISM_ARCHIPELAGO_WORLD

Include:

- islands
- ferry routes
- dense landmarks
- visitor corridors

Suggested identity:

- destination-heavy coastal and island composition with strong ferry and scenic-network logic

### METROPOLITAN_EXPANSION_WORLD

Include:

- urban regions
- transport density
- multiple centres
- expansion corridors

Suggested identity:

- growth-pressure world with stronger service networks, transport concentration, and chunk complexity

## 7. Region Relationship Schema

### Schema ID

- `REGION_RELATIONSHIP_001`

### Required fields

- `sourceRegion`
- `targetRegion`
- `relationshipType`
- `transitionRules`
- `travelConnection`
- `tradeTourismInfluence`

### Relationship types

- `neighbour`
- `trade_partner`
- `tourism_link`
- `transport_link`
- `ecological_transition`

### Field intent

- `sourceRegion`: relationship origin region
- `targetRegion`: relationship destination region
- `relationshipType`: primary relationship category
- `transitionRules`: machine-readable transition behaviour between regions
- `travelConnection`: how this relationship affects route logic
- `tradeTourismInfluence`: how services, destination pressure, or visitor logic shape the connection

### Suggested shape

```json
{
  "schemaId": "REGION_RELATIONSHIP_001",
  "sourceRegion": "REGION_001",
  "targetRegion": "REGION_002",
  "relationshipType": "tourism_link",
  "transitionRules": ["COAST_TO_MOUNTAIN_SCENIC_TRANSITION"],
  "travelConnection": "SCENIC_CORRIDOR",
  "tradeTourismInfluence": "VISITOR_FLOW_SUPPORT"
}
```

## 8. Travel Tier Schema

### Schema ID

- `WORLD_TRAVEL_TIER_001`

### Required fields

- `tierId`
- `distanceRange`
- `difficulty`
- `rewardPotential`
- `expectedTravelTime`

### Travel tiers

#### LOCAL

- within town

#### REGIONAL

- between towns

#### LONG_DISTANCE

- between regions

#### EPIC

- world exploration routes

### Field intent

- `distanceRange`: expected spatial scope of the tier
- `difficulty`: challenge expectation
- `rewardPotential`: gameplay and exploration payoff
- `expectedTravelTime`: relative time commitment

### Suggested shape

```json
{
  "schemaId": "WORLD_TRAVEL_TIER_001",
  "tierId": "LONG_DISTANCE",
  "distanceRange": "MULTI_REGION",
  "difficulty": "MEDIUM_HIGH",
  "rewardPotential": "HIGH",
  "expectedTravelTime": "EXTENDED_SESSION"
}
```

## 9. Exploration Density Schema

### Schema ID

- `EXPLORATION_DENSITY_PROFILE_001`

### Required fields

- `densityId`
- `landmarkFrequency`
- `routeDensity`
- `discoverySpacing`
- `rewardFrequency`

### Density profiles

#### HIGH_EXPLORATION

- many landmarks
- short discovery loops
- higher route density
- frequent reward cadence

#### MEDIUM_EXPLORATION

- balanced landmark count
- mixed short and medium journeys
- balanced reward pacing

#### LOW_EXPLORATION

- fewer landmarks
- longer journeys
- wider spacing
- rarer but stronger rewards

#### REMOTE_EXPLORATION

- rare high-value destinations
- sparse route network
- strong isolation value
- meaningful world-scale travel payoff

### Suggested shape

```json
{
  "schemaId": "EXPLORATION_DENSITY_PROFILE_001",
  "densityId": "REMOTE_EXPLORATION",
  "landmarkFrequency": "LOW",
  "routeDensity": "SPARSE",
  "discoverySpacing": "WIDE",
  "rewardFrequency": "LOW_BUT_HIGH_VALUE"
}
```

## 10. Streaming Composition Rules

Composition must influence:

- chunk count
- region loading
- cache priority
- memory limits

### Requirements

- mobile friendly
- deterministic
- reference based

### Streaming rule intent

Small worlds:

- fewer chunks
- simpler region ownership
- lower cache pressure

Medium worlds:

- more chunks
- multiple active corridor zones
- stronger preloading logic for travel paths

Large worlds:

- many chunks
- layered loading priority
- travel-direction-aware caching
- stricter memory discipline

### Suggested streaming requirement shape

```json
{
  "minimumChunkCount": 12,
  "regionLoadingStrategy": "CORRIDOR_AWARE",
  "cachePriority": "TRAVEL_AND_DESTINATION_WEIGHTED",
  "memoryLimitProfile": "MOBILE_SAFE_MEDIUM_WORLD"
}
```

## 11. Composition Validation Schema

### Schema ID

- `WORLD_COMPOSITION_VALIDATION_001`

### Required fields

- `scaleRulesApplied`
- `regionCountValid`
- `identityProfileValid`
- `biomeMixValid`
- `transitionsValid`
- `routeDistancesValid`
- `connectionsReasonable`
- `explorationDensityBalanced`
- `chunkRequirementsValid`
- `deterministicRebuildValid`
- `validationPassed`

### Validation intent

Composition:

- scale rules applied
- region count valid
- identity profile valid

Geography:

- biome mix valid
- transitions valid

Travel:

- route distances valid
- connections reasonable

Exploration:

- density balanced

Streaming:

- chunk requirements valid

Determinism:

- same profile + seed = same composition

## 12. Preview Configuration

### Preview ID

- `WORLD_COMPOSITION_PROFILE_PREVIEW_001`

### Preview purpose

This preview configuration must demonstrate:

- one world seed
- multiple composition profiles
- identity-driven differences without changing the core engine

### Required demonstration input

Same world seed:

- `10482`

Different compositions:

- `AUSTRALIAN_COASTAL_WORLD`
- `AUSTRALIAN_OUTBACK_WORLD`
- `ALPINE_WORLD`
- `TOURISM_ARCHIPELAGO_WORLD`
- `METROPOLITAN_EXPANSION_WORLD`

### Preview expectation

The output should prove:

- different composition profiles create meaningfully different worlds
- scale, density, and travel logic remain deterministic
- composition affects world identity without fragmenting the shared architecture

## 13. Implementation Readiness

`WORLD_COMPOSITION_PROFILE_SYSTEM_001` is ready for implementation planning and generator integration next.

Recommended next session scope:

- implement expanded world composition profiles into the world generator
- formalize scale-driven world counts and travel behaviour
- generate multi-profile preview outputs from the same seed
- add composition validation output

Readiness status:

- `READY FOR EXPANDED WORLD COMPOSITION IMPLEMENTATION`
