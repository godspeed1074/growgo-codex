# GROWGO SESSION 70 — TOWN VARIANT MACHINE READABLE CONTRACT

## Session Scope

This session defines the machine-readable contract for:

- `TOWN_VARIANT_PROFILE_SYSTEM_001`

Purpose:

- connect settlement identity profiles to deterministic `TOWN_LAYOUT_001` generation behaviour

This session creates schemas and contracts only.

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

## Files Created

- `GROWGO_SESSION_70_TOWN_VARIANT_MACHINE_READABLE_CONTRACT.md`

## Files Changed

- none

## 1. Contract Goal

`TOWN_LAYOUT_001` already defines the machine-readable town structure.

`TOWN_VARIANT_PROFILE_SYSTEM_001` must define how the same generator produces different settlement identities without changing the top-level town schema.

Core rule:

- one generator
- one town contract
- multiple variant profiles
- deterministic output for the same seed and profile

This contract introduces three new schema identities:

- `TOWN_VARIANT_PROFILE_001`
- `VARIANT_WEIGHT_PROFILE_001`
- `VARIANT_VALIDATION_001`

## 2. System Role

`TOWN_VARIANT_PROFILE_SYSTEM_001` acts as the profile-control layer between:

- town seed input
- town theme selection
- district and zone weighting
- validation expectations

The system must allow the same seed to produce different town compositions when the selected profile changes.

Example:

- `townSeed: 10482`
- `profile: SMALL_COASTAL_TOWN`

and:

- `townSeed: 10482`
- `profile: REGIONAL_TOWN`

must both remain deterministic while producing materially different layouts.

## 3. Schema Set

This session defines these machine-readable schema identities:

- `TOWN_VARIANT_PROFILE_SYSTEM_001`
- `TOWN_VARIANT_PROFILE_001`
- `VARIANT_WEIGHT_PROFILE_001`
- `VARIANT_VALIDATION_001`
- `TOWN_VARIANT_PROFILE_PREVIEW_001`

## 4. Integration With TOWN_LAYOUT_001

`TOWN_LAYOUT_001` remains the top-level output contract.

`TOWN_VARIANT_PROFILE_SYSTEM_001` must plug into existing town generation through:

- `seedConfig.townThemeSeed`
- `townThemeProfile`
- `generationProfile`
- `validationContract`
- `validationResult`

Integration rule:

- the variant profile is selected before district and zone generation
- the profile supplies the weighting and behaviour rules that shape the town output
- the resulting town still serializes as `TOWN_LAYOUT_001`

## 5. TOWN_VARIANT_PROFILE_001

### Schema ID

- `TOWN_VARIANT_PROFILE_001`

### Required Fields

- `schemaId`
- `profileId`
- `settlementIdentity`
- `districtWeighting`
- `densityProfile`
- `centreBehaviour`
- `commercialIntensity`
- `civicAllocation`
- `transportIntensity`
- `recreationAllocation`
- `landmarkWeighting`
- `boundaryBehaviour`
- `growthDirection`
- `identityTargets`
- `validationTargets`

### Field Intent

- `schemaId`: versioned schema identity
- `profileId`: stable variant identifier
- `settlementIdentity`: human-readable settlement role
- `districtWeighting`: district mix rules
- `densityProfile`: density expectations
- `centreBehaviour`: centre count, size, and activity rules
- `commercialIntensity`: service and retail intensity rules
- `civicAllocation`: civic reserve expectations
- `transportIntensity`: transport network expectations
- `recreationAllocation`: open-space and leisure expectations
- `landmarkWeighting`: frequency and importance of landmarks
- `boundaryBehaviour`: shape and edge behaviour
- `growthDirection`: expansion rules
- `identityTargets`: intended world-feel signals
- `validationTargets`: measurable pass criteria

### Suggested Shape

```json
{
  "schemaId": "TOWN_VARIANT_PROFILE_001",
  "profileId": "SMALL_COASTAL_TOWN",
  "settlementIdentity": "LOW_DENSITY_COASTAL_SETTLEMENT",
  "districtWeighting": {},
  "densityProfile": {},
  "centreBehaviour": {},
  "commercialIntensity": {},
  "civicAllocation": {},
  "transportIntensity": {},
  "recreationAllocation": {},
  "landmarkWeighting": {},
  "boundaryBehaviour": {},
  "growthDirection": {},
  "identityTargets": {},
  "validationTargets": {}
}
```

## 6. VARIANT_WEIGHT_PROFILE_001

### Schema ID

- `VARIANT_WEIGHT_PROFILE_001`

### Purpose

- provide machine-readable weighting values that modify deterministic town generation

### Required Fields

- `schemaId`
- `profileId`
- `districtSelectionWeights`
- `centreWeights`
- `commercialWeights`
- `civicWeights`
- `transportWeights`
- `recreationWeights`
- `landmarkWeights`
- `boundaryWeights`

### Field Intent

- `districtSelectionWeights`: relative probability and priority for district roles
- `centreWeights`: centre size, count, and intensity behaviour
- `commercialWeights`: service, main-street, and visitor-retail distribution
- `civicWeights`: reserve frequency and placement bias
- `transportWeights`: hierarchy, rail potential, bus support, and parking
- `recreationWeights`: park, corridor, sports, waterfront, and trail emphasis
- `landmarkWeights`: landmark density and distribution priority
- `boundaryWeights`: irregularity, scenic constraint, corridor growth, and edge buffer behaviour

### Suggested Shape

```json
{
  "schemaId": "VARIANT_WEIGHT_PROFILE_001",
  "profileId": "SMALL_COASTAL_TOWN",
  "districtSelectionWeights": {},
  "centreWeights": {},
  "commercialWeights": {},
  "civicWeights": {},
  "transportWeights": {},
  "recreationWeights": {},
  "landmarkWeights": {},
  "boundaryWeights": {}
}
```

## 7. VARIANT_VALIDATION_001

### Schema ID

- `VARIANT_VALIDATION_001`

### Purpose

- define machine-readable checks that confirm a generated town matches its selected profile

### Required Fields

- `schemaId`
- `profileId`
- `profileRuleApplicationValid`
- `deterministicResultValid`
- `weightingWithinTolerance`
- `requiredZonesGenerated`
- `profileIdentityScore`
- `profileDensityValid`
- `profileDistributionValid`
- `profileBoundaryBehaviourValid`
- `profileCentreBehaviourValid`
- `profileTransportIntensityValid`

### Suggested Shape

```json
{
  "schemaId": "VARIANT_VALIDATION_001",
  "profileId": "SMALL_COASTAL_TOWN",
  "profileRuleApplicationValid": true,
  "deterministicResultValid": true,
  "weightingWithinTolerance": true,
  "requiredZonesGenerated": true,
  "profileIdentityScore": 100,
  "profileDensityValid": true,
  "profileDistributionValid": true,
  "profileBoundaryBehaviourValid": true,
  "profileCentreBehaviourValid": true,
  "profileTransportIntensityValid": true
}
```

## 8. Variant Profile Definitions

### SMALL_COASTAL_TOWN

#### TOWN_VARIANT_PROFILE_001

- `profileId`: `SMALL_COASTAL_TOWN`
- `settlementIdentity`: `LOW_DENSITY_COASTAL_SETTLEMENT`

District weighting intent:

- coastal districts: high
- suburban residential: medium
- tourism influence: medium
- civic reserve support: medium
- industrial / service edge: low

Density profile:

- low density dominant
- seasonal and holiday variation allowed
- future medium density low priority

Centre behaviour:

- single village or main-street centre
- foreshore-linked
- high pedestrian priority

Commercial intensity:

- moderate town-centre retail
- secondary waterfront visitor retail allowed

Civic allocation:

- compact civic cluster near the centre

Transport intensity:

- local plus collector roads
- moderate parking
- pedestrian coastline emphasis
- rail potential weak

Recreation allocation:

- foreshore recreation high
- trails and coastal green links high

Landmark weighting:

- scenic and coastal landmark weighting high

Boundary behaviour:

- irregular coastline-influenced boundary
- protected natural foreshore edge

Growth direction:

- inland-to-coast centreline growth

### REGIONAL_TOWN

#### TOWN_VARIANT_PROFILE_001

- `profileId`: `REGIONAL_TOWN`
- `settlementIdentity`: `RURAL_SERVICE_CENTRE`

District weighting intent:

- suburban residential: high
- mixed residential: medium
- civic reserve weighting: high
- industrial / service edge: medium-high
- tourism influence: low

Density profile:

- low to medium density
- wider service catchment

Centre behaviour:

- larger civic-commercial centre
- stronger road-access bias
- moderate pedestrian priority

Commercial intensity:

- medium-high
- practical service-centre emphasis

Civic allocation:

- high
- school, emergency, and community reserves strongly represented

Transport intensity:

- collector and regional connector bias high
- parking high
- railway or freight reserve potential medium-high

Recreation allocation:

- sports and civic parks moderate-high
- scenic recreation low-medium

Landmark weighting:

- medium
- civic identity more important than tourism landmarks

Boundary behaviour:

- radial inland expansion
- road-entry influenced edges

Growth direction:

- service-centre outward growth toward road and rural catchment corridors

### TOURIST_TOWN

#### TOWN_VARIANT_PROFILE_001

- `profileId`: `TOURIST_TOWN`
- `settlementIdentity`: `VISITOR_DESTINATION_SETTLEMENT`

District weighting intent:

- tourism districts: high
- visitor-support districts: high
- accommodation-support areas: medium-high
- suburban residential: medium
- industrial / service edge: low-medium

Density profile:

- low to medium density
- concentrated attraction nodes

Centre behaviour:

- visitor activity hub
- high pedestrian priority
- attraction-linked centre logic

Commercial intensity:

- high
- dining, retail, and entertainment emphasis

Civic allocation:

- medium
- enough public-service support without overwhelming visitor identity

Transport intensity:

- visitor parking high
- shuttle / bus support medium-high
- walking loop strength high

Recreation allocation:

- attractions, trails, event spaces, and destination recreation high

Landmark weighting:

- very high
- landmark clustering and exploration value high

Boundary behaviour:

- scenic constraints
- attraction-led asymmetry

Growth direction:

- expands around scenic edges and visitor corridors

### SUBURBAN_CITY_EDGE

#### TOWN_VARIANT_PROFILE_001

- `profileId`: `SUBURBAN_CITY_EDGE`
- `settlementIdentity`: `URBAN_FRINGE_EXPANSION_ZONE`

District weighting intent:

- suburban residential: very high
- future medium-density districts: medium-high
- mixed districts: medium
- commercial centres: medium-high
- industrial / service edge: medium

Density profile:

- low to medium density now
- future higher-density reserve logic enabled

Centre behaviour:

- multiple centres or sub-centres supported
- corridor-led commercial behaviour

Commercial intensity:

- medium-high
- centre plus strip / corridor retail support

Civic allocation:

- medium-high
- distributed school and community reserves

Transport intensity:

- collector and arterial importance high
- bus corridor support high
- rail reserve potential medium-high
- parking medium-high

Recreation allocation:

- moderate parks and green corridors
- scenic recreation not dominant

Landmark weighting:

- low to medium

Boundary behaviour:

- structured urban expansion edge

Growth direction:

- corridor-based outward growth from metropolitan connection points

## 9. Weighting Rules

`VARIANT_WEIGHT_PROFILE_001` must control deterministic composition through weighted rule groups.

### District Selection

District weight groups:

- `residential`
- `coastal`
- `tourism`
- `civic`
- `commercial`
- `industrialService`
- `futureMediumDensity`

Rule:

- the same seed plus different profile must change district composition through profile weights, not random schema changes

### Centre Behaviour

Centre weight groups:

- `centreCountBias`
- `centreSizeBias`
- `centreIntensityBias`
- `pedestrianPriorityBias`

Rule:

- profile weights modify centre behaviour while preserving `TOWN_CENTRE_ZONE_INSTANCE_001`

### Transport

Transport weight groups:

- `roadHierarchyBias`
- `busSupportBias`
- `railwayPotentialBias`
- `parkingBias`
- `pedestrianNetworkBias`

### Landmarks

Landmark weight groups:

- `landmarkFrequencyBias`
- `landmarkImportanceBias`
- `landmarkClusteringBias`

## 10. Generation Order

`TOWN_LAYOUT_001` must consume `TOWN_VARIANT_PROFILE_001` in this order:

1. town seed input
2. variant profile selection
3. variant weight profile resolution
4. district generation
5. centre generation
6. zone generation
7. transport generation
8. landmark and recreation generation
9. variant validation
10. town validation

Flow:

Town seed

↓

Variant profile selection

↓

Profile weights

↓

District generation

↓

Zone generation

↓

Validation

Integration rule:

- variant validation happens before final town validation summary is accepted

## 11. Validation Rules

The variant contract must add profile-aware checks without replacing `TOWN_VALIDATION_001`.

Required checks:

- profile applied correctly
- output matches profile identity
- deterministic result preserved
- weighting remains within tolerance
- required zones generated

Profile-aware validation targets:

### SMALL_COASTAL_TOWN

- waterfront weighting applied
- coastal districts present
- foreshore recreation present
- landmark frequency meets coastal target

### REGIONAL_TOWN

- civic weighting applied
- service / commercial centre large enough
- industrial or service edge support present
- transport hub weighting present

### TOURIST_TOWN

- visitor zones present
- attraction weighting applied
- landmark density elevated
- seasonal activity support zones present or reserved

### SUBURBAN_CITY_EDGE

- residential density uplift applied
- corridor transport weighting present
- multiple-centre or future-centre support present
- higher-density reserve support present

## 12. Preview Configuration

### Schema ID

- `TOWN_VARIANT_PROFILE_PREVIEW_001`

### Purpose

- demonstrate that one generator can produce multiple distinct town outputs from the same seed by changing only the selected profile

### Required Preview Input

```json
{
  "townSeed": 10482,
  "regionSeed": 1,
  "profiles": [
    "SMALL_COASTAL_TOWN",
    "REGIONAL_TOWN",
    "TOURIST_TOWN",
    "SUBURBAN_CITY_EDGE"
  ]
}
```

### Expected Preview Behaviour

For the same seed:

- `SMALL_COASTAL_TOWN` should emphasize waterfront and foreshore logic
- `REGIONAL_TOWN` should emphasize civic, service, and transport hub logic
- `TOURIST_TOWN` should emphasize visitor zones and landmarks
- `SUBURBAN_CITY_EDGE` should emphasize residential spread, corridor growth, and future density support

Expected result:

- different town compositions from the same engine
- same schema family
- same deterministic rebuild behaviour

## 13. Implementation Readiness

Before implementation:

- `townThemeSeed` remains the approved profile selector
- `TOWN_LAYOUT_001` remains the top-level output schema
- profile logic must be implemented as weighted behavioural layers
- no profile may require new building assets before schema integration
- preview systems must remain compatible with reference-based placement

Recommended next step:

1. encode `TOWN_VARIANT_PROFILE_001` and `VARIANT_WEIGHT_PROFILE_001` into the town generator contract layer
2. keep `SMALL_COASTAL_TOWN` as the first implemented reference profile
3. add `REGIONAL_TOWN`, `TOURIST_TOWN`, and `SUBURBAN_CITY_EDGE` as deterministic profile-backed expansions

## 14. Readiness Status

Session 70 status:

- `READY FOR IMPLEMENTATION`

The town system now has a machine-readable variant contract that can support multiple Australian settlement identities while preserving the existing deterministic town architecture.
