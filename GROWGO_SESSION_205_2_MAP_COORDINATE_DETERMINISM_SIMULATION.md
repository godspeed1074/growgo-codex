# GROWGO SESSION 205.2 — MAP COORDINATE DETERMINISM SIMULATION

## Goal

Validate deterministic coordinate-to-location resolution before future map attachment.

## Result

Completed `ATLAS_MAP_COORDINATE_DETERMINISM_SIMULATION_001` as a data-only simulation harness for coordinate lookup, package resolution, seed replay, recipe handoff, and safe failure behavior.

Used:

- `ATLAS_MAP_ATTACHMENT_001`
- `ATLAS_REGIONAL_PACKAGE_PLANNING_001`
- `LOCATION_RECIPE_SELECTOR_001`

## Files Created

### Code

- `asset-factory/atlas-map-coordinate-determinism-simulation.mjs`

### Tests

- `tests/asset-factory-atlas-map-coordinate-determinism-simulation.test.mjs`

### Generated Records

- `asset-factory-workspace/atlas-map-coordinate-determinism/ATLAS_MAP_COORDINATE_DETERMINISM_SIMULATION_001/specification/atlas-map-coordinate-determinism-simulation-harness.json`
- `asset-factory-workspace/atlas-map-coordinate-determinism/ATLAS_MAP_COORDINATE_DETERMINISM_SIMULATION_001/outputs/atlas-map-coordinate-determinism-simulation-results.json`
- `asset-factory-workspace/atlas-map-coordinate-determinism/ATLAS_MAP_COORDINATE_DETERMINISM_SIMULATION_001/validation/atlas-map-coordinate-determinism-simulation-validation.json`
- `asset-factory-workspace/atlas-map-coordinate-determinism/ATLAS_MAP_COORDINATE_DETERMINISM_SIMULATION_001/reports/atlas-map-coordinate-determinism-simulation-report.md`

## Simulations Covered

- identical coordinate repeated lookup
- nearby coordinate variation
- region boundary crossing
- invalid coordinate handling
- missing package handling

## Validation

The simulation validates:

- deterministic region identity
- deterministic package selection
- deterministic recipe selection
- deterministic seed generation
- safe failure behaviour

## Safety

The simulation remains planning-only and keeps all blocked:

- runtime activation
- map downloads
- renderer attachment
- Blender
- GLBs
- asset modification

## Testing

Focused tests cover:

- deterministic output
- required scenario coverage
- repeated and nearby lookup stability
- safe invalid and missing-package failure handling
- written record generation
- preserved safety boundaries

## Readiness

`ATLAS_MAP_COORDINATE_DETERMINISM_SIMULATION_001` is ready for future map attachment planning.

What is now ready:

- deterministic coordinate normalization replay
- deterministic region and package resolution using representative regional package metadata
- deterministic recipe selection handoff through `LOCATION_RECIPE_SELECTOR_001`
- safe blocked failure states for unsupported and missing contexts

What remains intentionally blocked:

- runtime activation
- map downloads
- renderer attachment
- Blender
- GLB workflows
- asset modification
