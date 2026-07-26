# GROWGO SESSION 69 — TOWN VARIANT EXPANSION FOUNDATION

## Session Scope

This session defines the procedural foundation for:

- `TOWN_VARIANT_PROFILE_SYSTEM_001`

Purpose:

- allow `TOWN_LAYOUT_001` to generate multiple Australian settlement identities from one shared town-generation architecture

This session is planning and specification only.

This session does not:

- create Blender assets
- create exports
- create new buildings
- create new modules
- create production towns
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## Files Created

- `GROWGO_SESSION_69_TOWN_VARIANT_EXPANSION_FOUNDATION.md`

## Files Changed

- none

## 1. Foundation Goal

`TOWN_LAYOUT_001` has now proven a viable first town profile through:

- `SMALL_COASTAL_TOWN`

The next procedural requirement is not a new generator architecture. It is a profile system that lets one generator produce multiple recognisable Australian settlement types while preserving:

- deterministic output
- shared district contracts
- shared preview consumer patterns
- shared validation structure
- future scaling to districts, centres, transport, and landmark systems

This session introduces:

- `TOWN_VARIANT_PROFILE_SYSTEM_001`
- `TOWN_VARIANT_PROFILE_001`

These define how a town profile changes:

- district composition
- centre behaviour
- commercial intensity
- civic and recreation distribution
- transport expectations
- boundary and growth logic
- validation targets

## 2. System Purpose

`TOWN_VARIANT_PROFILE_SYSTEM_001` must allow the same town generator to produce distinct town identities such as:

- coastal settlements
- regional service towns
- visitor-driven tourism towns
- suburban city-edge towns

The system should influence output without replacing the core town contract.

Core rule:

- profile selection changes weighted behaviour
- profile selection does not change the top-level `TOWN_LAYOUT_001` contract shape

## 3. Variant Profile Set

This foundation defines four initial town variants:

- `SMALL_COASTAL_TOWN`
- `REGIONAL_TOWN`
- `TOURIST_TOWN`
- `SUBURBAN_CITY_EDGE`

These become approved profile identities for future deterministic generation.

## 4. Variant Profile Characteristics

### SMALL_COASTAL_TOWN

Primary identity:

- low-density Australian coastal settlement

Characteristics:

- strong waterfront relationship
- beaches and foreshore reserves
- tourism presence without overwhelming local life
- coastal recreation
- lighthouse / lookout / waterfront landmark potential
- low-density residential districts
- mixed permanent and holiday housing areas

World feel target:

- walkable centre
- visitor edge
- natural coastal boundary
- visible inland-to-coast growth logic

### REGIONAL_TOWN

Primary identity:

- inland service hub for rural and agricultural areas

Characteristics:

- larger civic/commercial centre
- stronger farming and highway relationships
- industrial or service edge presence
- larger school / community reserve expectations
- transport hub role
- broader town centre footprint
- less tourism weighting than coastal or tourist profiles

World feel target:

- practical service centre
- civic importance
- outward road connectivity
- rural catchment anchor

### TOURIST_TOWN

Primary identity:

- visitor-focused destination settlement

Characteristics:

- visitor districts
- attraction concentration
- accommodation reserve expectations
- entertainment or event edge potential
- seasonal activity logic
- high landmark density
- walkable visitor routes
- centre and waterfront / scenic relationship if relevant

World feel target:

- destination-driven layout
- highly readable attractions
- stronger pedestrian loops
- clear exploration opportunities

### SUBURBAN_CITY_EDGE

Primary identity:

- edge-of-city expansion zone

Characteristics:

- higher residential density
- larger residential coverage
- stronger commercial centres
- stronger transport corridors
- future apartment / medium-density reserve support
- more structured block expansion
- weaker landmark dependency than coastal or tourist profiles

World feel target:

- expanding urban fringe
- larger commuting catchment
- corridor-based growth
- multiple centre behaviour

## 5. Variant Schema

### Schema ID

- `TOWN_VARIANT_PROFILE_001`

### Required Fields

- `profileId`
- `settlementIdentity`
- `districtWeighting`
- `densityProfile`
- `centreIntensity`
- `commercialIntensity`
- `civicAllocation`
- `recreationAllocation`
- `transportIntensity`
- `landmarkWeighting`
- `boundaryStyle`
- `growthDirectionRules`
- `identityTargets`
- `validationTargets`

### Field Intent

- `profileId`: permanent variant identity
- `settlementIdentity`: human-readable town role
- `districtWeighting`: district mix priorities
- `densityProfile`: low / medium / urban-edge growth expectations
- `centreIntensity`: town-centre strength and count behaviour
- `commercialIntensity`: how much retail/service structure should appear
- `civicAllocation`: reserve distribution expectations
- `recreationAllocation`: open-space and leisure expectations
- `transportIntensity`: corridor and parking expectations
- `landmarkWeighting`: destination and visual anchor importance
- `boundaryStyle`: spatial growth and edge logic
- `growthDirectionRules`: expansion behaviour
- `identityTargets`: intended qualitative outcome
- `validationTargets`: measurable profile checks

### Suggested Shape

```json
{
  "profileId": "SMALL_COASTAL_TOWN",
  "settlementIdentity": "LOW_DENSITY_COASTAL_SETTLEMENT",
  "districtWeighting": {},
  "densityProfile": {},
  "centreIntensity": {},
  "commercialIntensity": {},
  "civicAllocation": {},
  "recreationAllocation": {},
  "transportIntensity": {},
  "landmarkWeighting": {},
  "boundaryStyle": {},
  "growthDirectionRules": {},
  "identityTargets": {},
  "validationTargets": {}
}
```

## 6. Variant Profile Definitions

### SMALL_COASTAL_TOWN

- `profileId`: `SMALL_COASTAL_TOWN`
- `settlementIdentity`: `LOW_DENSITY_COASTAL_SETTLEMENT`

District weighting:

- suburban residential: medium
- coastal residential: high
- tourism district: medium
- industrial / service edge: low

Density profile:

- low density dominant
- holiday / cottage variation supported
- medium density future support only

Centre intensity:

- single village or main-street centre
- foreshore-linked pedestrian focus

Commercial intensity:

- moderate
- centre-linked
- secondary waterfront visitor retail allowed

Civic allocation:

- moderate
- compact civic cluster near centre

Recreation allocation:

- high foreshore and walking allocation
- visible coastal parks

Transport intensity:

- local roads plus collector access
- moderate parking
- future rail optional but weak
- pedestrian coastline emphasis

Landmark weighting:

- high scenic / coastal landmark value

Boundary style:

- water-constrained irregular edge

Growth direction:

- inland to coast-centreline relationship

### REGIONAL_TOWN

- `profileId`: `REGIONAL_TOWN`
- `settlementIdentity`: `RURAL_SERVICE_CENTRE`

District weighting:

- suburban residential: high
- mixed residential: medium
- coastal residential: none or very low
- industrial / service edge: medium-high
- civic / transport adjacency: high

Density profile:

- low to medium density
- broader lot sizes on outskirts
- service-centre expansion support

Centre intensity:

- larger civic-commercial centre
- practical access takes priority over foreshore logic

Commercial intensity:

- medium-high
- broader main street and service strip support

Civic allocation:

- high
- school, library, emergency, and community reserves take stronger roles

Recreation allocation:

- moderate
- sports fields and civic parks more important than foreshore leisure

Transport intensity:

- higher road hierarchy importance
- regional connector emphasis
- stronger rail/bus reserve logic
- greater parking provision

Landmark weighting:

- medium
- practical civic identity more important than destination tourism

Boundary style:

- radial or corridor-based inland expansion

Growth direction:

- town centre radiates toward road-entry corridors and rural catchment edges

### TOURIST_TOWN

- `profileId`: `TOURIST_TOWN`
- `settlementIdentity`: `VISITOR_DESTINATION_SETTLEMENT`

District weighting:

- tourism district: high
- accommodation-support district: medium-high
- suburban residential: medium
- service / industrial edge: low-medium

Density profile:

- low to medium density
- concentrated visitor nodes
- seasonal activity bands supported

Centre intensity:

- visitor activity hub
- centre may blend with commercial entertainment and landmark frontage

Commercial intensity:

- high
- food, retail, visitor service, and attraction-adjacent retail encouraged

Civic allocation:

- medium
- enough public-service support without dominating visitor identity

Recreation allocation:

- high
- attractions, trails, event spaces, and scenic recreation encouraged

Transport intensity:

- stronger pedestrian loops
- event/visitor parking logic
- bus and shuttle potential

Landmark weighting:

- very high
- landmarks act as navigation, identity, and exploration anchors

Boundary style:

- scenic constraints and destination clustering

Growth direction:

- expands around attractions, scenic edges, and visitor corridors

### SUBURBAN_CITY_EDGE

- `profileId`: `SUBURBAN_CITY_EDGE`
- `settlementIdentity`: `URBAN_FRINGE_EXPANSION_ZONE`

District weighting:

- suburban residential: very high
- future medium density: medium-high
- mixed residential: medium
- commercial centres: medium-high
- industrial / service edge: medium

Density profile:

- low to medium density now
- medium density future support is expected
- apartment reserve logic allowed

Centre intensity:

- multiple centres or sub-centres supported
- less village-like than coastal profile

Commercial intensity:

- medium-high
- centre plus corridor retail support

Civic allocation:

- medium-high
- schools and community reserves distributed across growth areas

Recreation allocation:

- moderate
- parks and corridors required, but scenic identity not dominant

Transport intensity:

- strong collector and arterial expectation
- bus corridors important
- rail reserve potential stronger than coastal profile
- parking higher than tourist profile

Landmark weighting:

- low to medium
- identity comes more from scale and structure than from unique scenic anchors

Boundary style:

- urban expansion edge

Growth direction:

- corridor-led outward growth from existing metropolitan connection points

## 7. District Weighting System

`TOWN_VARIANT_PROFILE_SYSTEM_001` must influence district composition through weighted allocation rather than hand-authored district layouts.

District groups:

- residential districts
- coastal districts
- tourism districts
- mixed residential districts
- civic-support zones
- recreation-heavy districts
- industrial / service edge zones
- future medium-density districts

Rules:

- weights must be profile-specific
- district weights must remain deterministic for the same seed
- weights must influence both district count and district position priority
- weighting must remain compatible with current `TOWN_LAYOUT_001` district placement records

Examples:

Small coastal:

- coastal residential boosted
- tourism district allowed
- industrial edge suppressed

Regional:

- suburban and service-support districts boosted
- civic-adjacent and transport-linked districts boosted

Tourist:

- tourism and attraction-adjacent districts boosted
- accommodation-support logic reserved for future use

Suburban city edge:

- suburban residential and future medium-density districts boosted
- commercial corridor logic strengthened

## 8. Centre Behaviour

Town centre behaviour must vary by profile while remaining compatible with `TOWN_CENTRE_ZONE_INSTANCE_001`.

### Small Coastal

- village main street
- centre tied to foreshore or visitor edge
- pedestrian priority high
- secondary waterfront retail may extend centre influence

### Regional

- larger civic-commercial centre
- stronger service frontage
- broader road access
- public-service reserves closely linked

### Tourist

- visitor activity hub
- centre may integrate attractions, dining, event space, and landmark frontage
- higher walking-loop emphasis

### Suburban City Edge

- one main centre plus future sub-centres
- stronger corridor relationships
- less destination-based than tourist profile

Centre rules:

- profile may change centre count, centre type, and centre intensity
- profile must not break accessibility or transport validation

## 9. Transport Variation

Transport behaviour must vary by profile.

Transport factors:

- road hierarchy
- bus intensity
- future railway corridor importance
- parking allocation
- pedestrian network strength

### Small Coastal

- local and collector roads dominate
- pedestrian coastal links strong
- parking moderate
- rail weak or future-only

### Regional

- stronger highway / collector logic
- larger parking needs
- rail and freight-adjacent logic more plausible
- bus moderate

### Tourist

- visitor parking high
- pedestrian loops high
- shuttle / event movement potential
- roads support attractions without overwhelming scenic edges

### Suburban City Edge

- collector and arterial intensity high
- bus corridors important
- rail reserve potential strong
- commuter parking logic stronger

## 10. Boundary Variation

Each profile must define different settlement growth and edge logic.

### Coastal

- water constrained
- foreshore and scenic protected edges
- irregular coastline-influenced boundary

### Regional

- radial expansion
- road-entry influenced growth
- rural catchment relationships

### Tourist

- scenic constraints
- clustered destination edges
- attraction-led asymmetry

### City Edge

- urban expansion front
- corridor-based outward growth
- structured, less scenic boundary logic

Boundary rules:

- boundary style must affect town bounds and transition zones
- growth-direction rules must be explicit
- protected / natural / reserve edges must remain machine-readable

## 11. Validation Rules

Variant support must add profile-aware validation rather than replacing the existing town validation framework.

Required checks:

- profile rules applied correctly
- deterministic output maintained
- appropriate density for selected profile
- correct district and zone distribution
- identity score for selected profile
- boundary style consistency
- centre behaviour consistency
- transport intensity consistency

Suggested profile-specific validation fields:

- `profileRuleApplicationValid`
- `profileDensityValid`
- `profileZoneDistributionValid`
- `profileIdentityScore`
- `profileBoundaryStyleValid`
- `profileCentreBehaviourValid`
- `profileTransportIntensityValid`

Examples:

Small coastal:

- coastal identity score
- waterfront relationship
- foreshore recreation presence

Regional:

- civic-service weighting
- transport-hub plausibility
- rural-service connectivity

Tourist:

- attraction density
- visitor movement logic
- commercial and recreation clustering

Suburban city edge:

- corridor growth logic
- centre multiplicity support
- density uplift readiness

## 12. Implementation Readiness Rules

Before implementation:

- `TOWN_LAYOUT_001` must remain the top-level generator contract
- profile selection must be driven by `townThemeSeed` or a compatible future profile selector
- no variant may require new building assets to exist before profile support is added
- preview consumers must remain able to visualise variants using the same reference-based scene pattern
- future generator updates should add profile behaviour in weighted rule layers, not by hard-forking separate town generators

## 13. Recommended Implementation Order

Recommended order:

1. formalize `TOWN_VARIANT_PROFILE_001` inside the town generator contract layer
2. convert `SMALL_COASTAL_TOWN` into the first explicit profile-backed implementation
3. add `REGIONAL_TOWN` using the same district and validation architecture
4. add `TOURIST_TOWN` with stronger landmark and recreation weighting
5. add `SUBURBAN_CITY_EDGE` with multi-centre and corridor growth rules

## 14. Readiness Status

Session 69 status:

- `READY FOR IMPLEMENTATION`

The town system is now prepared to evolve from a single approved coastal identity into a profile-driven procedural framework that can support multiple Australian settlement types while preserving one shared generator architecture.
