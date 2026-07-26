# GROWGO SESSION 71 — VARIANT DRIVEN TOWN GENERATOR IMPLEMENTATION

## Session Scope

This session implements:

- `TOWN_VARIANT_PROFILE_SYSTEM_001`

into:

- the deterministic `TOWN_LAYOUT_001` generator

This session allows one town engine to produce multiple settlement identities from the same core architecture.

This session does not:

- create Blender assets
- create GLB exports
- create new buildings
- create new modules
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## Files Created

- `GROWGO_SESSION_71_VARIANT_DRIVEN_TOWN_GENERATOR_IMPLEMENTATION.md`

## Files Changed

- `asset-factory/town-generator.mjs`
- `tests/asset-factory-town-generator.test.mjs`
- `asset-factory-workspace/procedural-previews/TOWN_LAYOUT_001_PREVIEW_001.json`
- `asset-factory-workspace/procedural-previews/TOWN_LAYOUT_001_VALIDATION_001.json`
- `asset-factory-workspace/procedural-previews/TOWN_LAYOUT_001_PREVIEW_SCENE_001/preview-scene-metadata.json`

## Implementation Summary

Implemented a first working variant-driven town profile system directly inside the deterministic town generator.

The generator now resolves:

1. town seed
2. variant profile selection
3. variant weight profile
4. district generation
5. centre generation
6. zone generation
7. transport generation
8. variant validation
9. final town validation

This keeps:

- one generator
- one `TOWN_LAYOUT_001` output contract
- multiple deterministic settlement identities

## Variant Implementation

Added machine-readable variant data directly into the generator for:

- `SMALL_COASTAL_TOWN`
- `REGIONAL_TOWN`
- `TOURIST_TOWN`
- `SUBURBAN_CITY_EDGE`

Added machine-readable structures for:

- `TOWN_VARIANT_PROFILE_SYSTEM_001`
- `TOWN_VARIANT_PROFILE_001`
- `VARIANT_WEIGHT_PROFILE_001`
- `VARIANT_VALIDATION_001`

Each generated town preview now includes:

- selected variant profile metadata
- variant weight profile data
- profile-aware town metadata
- profile-aware validation output

## Profile Differences

### SMALL_COASTAL_TOWN

Result:

- `3` districts
- `1` centre
- `2` commercial zones
- `4` civic reserves
- `5` recreation zones
- `3` landmarks
- `1` service edge
- `6` transport corridors

Identity emphasis:

- coastal districts
- tourism district support
- waterfront recreation
- foreshore-linked commercial edge
- coastal landmark focus

### REGIONAL_TOWN

Result:

- `4` districts
- `1` centre
- `2` commercial zones
- `5` civic reserves
- `4` recreation zones
- `2` landmarks
- `2` service edges
- `7` transport corridors

Identity emphasis:

- stronger civic weighting
- service-centre structure
- larger support footprint
- regional rail / transport support
- rural-service edge logic

### TOURIST_TOWN

Result:

- `4` districts
- `1` centre
- `3` commercial zones
- `4` civic reserves
- `5` recreation zones
- `4` landmarks
- `1` service edge
- `7` transport corridors

Identity emphasis:

- tourism district presence
- stronger visitor commercial activity
- higher landmark density
- attraction-led recreation
- stronger walking / destination logic

### SUBURBAN_CITY_EDGE

Result:

- `5` districts
- `2` centres
- `2` commercial zones
- `5` civic reserves
- `4` recreation zones
- `2` landmarks
- `2` service edges
- `9` transport corridors

Identity emphasis:

- higher residential expansion
- future medium-density district support
- multiple-centre behaviour
- stronger commuter / corridor transport
- larger urban-edge growth structure

## Validation Changes

Added variant-aware validation checks:

- `profileAppliedCorrectly`
- `requiredZonesGenerated`
- `weightingToleranceValid`
- `variantIdentityScore`
- `variantIdentityScoreValid`
- `variantValidation`

The generator now validates:

- that the selected profile matches the output
- that required district / commercial / recreation signatures are present
- that profile-specific counts remain inside expected tolerance
- that identity targets are met

## Deterministic Behaviour

Confirmed:

- same seed + same profile = identical output
- same seed + different profiles = different valid town compositions

Reference seed used:

- `10482`

## Preview Artifact Refresh

Refreshed checked-in preview artifacts for the default profile:

- `SMALL_COASTAL_TOWN`

Refreshed:

- town preview JSON
- town validation JSON
- preview-scene metadata

This keeps the inspection layer aligned with the updated generator.

## Test Results

Passed:

- `tests/asset-factory-town-generator.test.mjs`
- `tests/asset-factory-town-preview-consumer.test.mjs`

Validated scenarios:

- same-seed deterministic output
- different-seed variation
- deterministic coastal preview validity
- validation output correctness
- same-seed multi-profile variation
- persisted artifact parity
- preview-consumer metadata parity

## Readiness Status

Session 71 status:

- `READY FOR VARIANT PREVIEW INSPECTION`

The town generator now supports multiple deterministic Australian settlement identities from one shared engine and is ready for profile-by-profile preview inspection.
