# GrowGo Session 37 - Deterministic Suburban Preview Generator

## Session Scope

This session implements the first executable deterministic suburban preview generator for:

- `NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001`

This session is procedural data generation only.

This session does not:

- create Blender assets
- create GLB exports
- create neighbourhood 3D scenes
- modify existing buildings
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## 1. Source of Truth

This implementation is based on:

- `GROWGO_SESSION_36_MACHINE_READABLE_SUBURBAN_NEIGHBOURHOOD_GENERATOR_CONTRACT.md`
- `GROWGO_SESSION_35_SUBURBAN_NEIGHBOURHOOD_ASSEMBLY_CONTRACT_FOUNDATION.md`
- existing Asset Factory recipe and registration patterns

## 2. Implementation Summary

The deterministic preview generator is implemented in:

- `asset-factory/suburban-neighbourhood-preview-generator.mjs`

The first generated preview artifact is:

- `asset-factory-workspace/procedural-previews/NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001.json`

The generator accepts:

- `neighbourhoodSeed`
- `regionSeed`
- `themeSeed`
- `lotCount`
- `blockConfiguration`

The first controlled implementation supports:

- exactly six lots
- deterministic lot sizing and positioning
- deterministic driveway side resolution
- deterministic building selection from the validated residential building pool
- deterministic landscaping seeds and placements
- machine-readable validation output

## 3. Generated Preview Output

The generated preview includes:

- six residential lots
- deterministic building selections
- building placement records
- landscape placement records
- road frontage connection records
- validation contract
- validation result

Supported building pool:

- `BUILDING_HOUSE_SUBURBAN_BRICK_001`
- `BUILDING_HOUSE_COASTAL_COTTAGE_001`
- `BUILDING_HOUSE_BEACH_BUNGALOW_001`

## 4. Validation Result

The generated preview validates:

- lot count correct
- valid building IDs
- valid rotations
- driveway assignments
- fence assignments
- valid road connections
- valid driveway connections
- valid building orientation
- no overlap
- deterministic signature consistency

## 5. Test Coverage

Focused tests verify:

- same seed produces identical output
- different seed produces variation
- six lots are generated
- all building IDs are valid
- invalid adjacent duplicate placement is rejected
- checked-in preview JSON matches the generator output

## 6. Readiness

The deterministic suburban preview generator is ready for:

- future machine-readable lot-generator extension
- future neighbourhood validation tooling
- future Blender or Atlas Engine integration
- future larger suburban block profiles

The next recommended step is:

- implementing the first higher-level procedural block consumer using this preview data as input
