# GROWGO SESSION 75 — DETERMINISTIC REGION GENERATOR

## Session Scope

This session implements:

- the first executable deterministic `REGION_LAYOUT_001` generator

Output target:

- `REGION_LAYOUT_001_PREVIEW_001`

This session creates procedural region data only.

This session does not:

- create Blender assets
- create GLB exports
- create region visual scenes
- create new buildings
- create new modules
- modify registered assets
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## Files Created

- `GROWGO_SESSION_75_DETERMINISTIC_REGION_GENERATOR.md`
- `asset-factory/region-generator.mjs`
- `tests/asset-factory-region-generator.test.mjs`
- `asset-factory-workspace/procedural-previews/REGION_LAYOUT_001_PREVIEW_001.json`
- `asset-factory-workspace/procedural-previews/REGION_LAYOUT_001_VALIDATION_001.json`

## Files Changed

- none

## Generator Implementation

Implemented a first working deterministic region generator in:

- `asset-factory/region-generator.mjs`

The generator now resolves:

1. region seed configuration
2. region profile selection
3. region boundary construction
4. natural zone generation
5. settlement hierarchy placement
6. transport corridor generation
7. landmark reserve generation
8. exploration route generation
9. validation output generation

The implementation follows the same pattern already used by:

- `asset-factory/suburban-district-generator.mjs`
- `asset-factory/town-generator.mjs`

## Region Output Summary

The generated `COASTAL_REGION` preview now includes:

- `6` natural zones
- `5` settlements
- `6` transport corridors
- `5` landmark reserves
- `6` exploration routes

Generated settlement hierarchy:

- `MAJOR_TOWN`
- `REGIONAL_TOWN`
- `SMALL_COASTAL_TOWN`
- `VILLAGE`
- `HAMLET`

Generated natural systems:

- coastline
- forest
- farmland
- river
- wetland
- protected area

Generated transport systems:

- highway
- major road
- local roads
- railway corridor
- coastal route

Generated landmark examples:

- lighthouse
- waterfall
- lookout
- historic site
- national park

Generated exploration examples:

- scenic coastal drive
- inland service route
- lookout trail
- landmark link
- nature loop
- river walk

## Region Profile Support

Active implementation for this session:

- `COASTAL_REGION`

Future-compatible profile definitions included:

- `RURAL_REGION`
- `MOUNTAIN_REGION`
- `TOURISM_REGION`
- `METROPOLITAN_EDGE_REGION`

This means the generator contract is already shaped for profile expansion without needing a new top-level schema.

## Validation Results

The generated preview validates:

- natural zones valid
- settlements valid
- transport connected
- settlement hierarchy valid
- terrain relationships valid
- corridors connected
- landmarks accessible
- exploration routes valid
- deterministic rebuild valid
- streaming-ready structure valid
- instance references only valid

Validation output file:

- `asset-factory-workspace/procedural-previews/REGION_LAYOUT_001_VALIDATION_001.json`

## Deterministic Behaviour

Confirmed:

- same seed produces identical region output
- different seed produces different valid output
- deterministic signature hashing is stable

Reference input:

```json
{
  "regionSeed": 10482,
  "biomeSeed": 1,
  "climateSeed": 1,
  "settlementPatternSeed": 1,
  "regionProfileSeed": "COASTAL_REGION"
}
```

## Preview Artifact Refresh

Generated and checked in:

- `asset-factory-workspace/procedural-previews/REGION_LAYOUT_001_PREVIEW_001.json`
- `asset-factory-workspace/procedural-previews/REGION_LAYOUT_001_VALIDATION_001.json`

This keeps the first region layer aligned with the Session 74 machine-readable contract.

## Test Results

Passed:

- `tests/asset-factory-region-generator.test.mjs`

Validated scenarios:

- region generation works
- same seed deterministic
- different seed variation
- settlements generated
- natural zones generated
- transport generated
- landmarks generated
- validation passes
- checked-in artifacts match generator output

## Readiness Status

Session 75 is ready for:

- first region visual preview consumer work
- region-scale preview integration
- future non-coastal region profile implementation

Not yet included:

- visual preview consumer
- Blender region preview scene
- multi-region orchestration
- region-to-town visual inspection tooling
