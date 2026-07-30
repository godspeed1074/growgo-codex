# GROWGO SESSION 202.9 — ATLAS FULL PIPELINE SIMULATION

## Goal

Create a data-only end-to-end simulation proving the complete Atlas decision pipeline.

## Result

Completed `ATLAS_FULL_PIPELINE_SIMULATION_001` as the first full Atlas planning-chain simulation.

This simulation runs the full non-runtime flow:

- Regional Package
- Validation
- Optimization Check
- Environment Classification
- Recipe Selection
- Location Recipe Generation
- Preview Package

Integrated references:

- `ATLAS_REGIONAL_PACKAGE_VALIDATION_001`
- `ATLAS_PACKAGE_OPTIMIZATION_001`
- `LOCATION_RECIPE_SELECTOR_001`
- `LOCATION_RECIPE_FACTORY_001`

## Files Created

### Code

- `asset-factory/atlas-full-pipeline-simulation.mjs`

### Tests

- `tests/asset-factory-atlas-full-pipeline-simulation.test.mjs`

### Generated Simulation Records

- `asset-factory-workspace/atlas-pipeline/ATLAS_FULL_PIPELINE_SIMULATION_001/simulation/atlas-full-pipeline-simulation-inputs.json`
- `asset-factory-workspace/atlas-pipeline/ATLAS_FULL_PIPELINE_SIMULATION_001/simulation/atlas-full-pipeline-simulation-stage-results.json`
- `asset-factory-workspace/atlas-pipeline/ATLAS_FULL_PIPELINE_SIMULATION_001/simulation/atlas-full-pipeline-simulation-pipeline-outputs.json`
- `asset-factory-workspace/atlas-pipeline/ATLAS_FULL_PIPELINE_SIMULATION_001/validation/atlas-full-pipeline-simulation-validation.json`
- `asset-factory-workspace/atlas-pipeline/ATLAS_FULL_PIPELINE_SIMULATION_001/lifecycle/atlas-full-pipeline-simulation-lifecycle-record.json`
- `asset-factory-workspace/atlas-pipeline/ATLAS_FULL_PIPELINE_SIMULATION_001/reports/atlas-full-pipeline-simulation-report.md`

## Scenario Coverage

The harness covers five representative package cases:

- coastal package
- forest package
- mixed transition package
- invalid package
- incompatible version package

## Pipeline Behaviour

### Coastal Package

- validation passed
- optimization passed
- classified as coastal
- selected `COASTAL_LOCATION_RECIPE_001`
- generated deterministic recipe output
- produced non-runtime preview package

### Forest Package

- validation passed
- optimization passed
- classified as forest
- selected `FOREST_LOCATION_RECIPE_001`
- generated deterministic recipe output
- produced non-runtime preview package

### Mixed Transition Package

- validation passed
- optimization passed
- classified as mixed transition
- selected `FOREST_LOCATION_RECIPE_001`
- fallback applied within approved selector rules
- generated deterministic recipe output
- produced non-runtime preview package

### Invalid Package

- blocked during validation
- reason: missing required layer
- no classification, selection, generation, or preview executed beyond the block

### Incompatible Version Package

- blocked during validation
- reason: invalid schema version
- no classification, selection, generation, or preview executed beyond the block

## Validation

Validation status: `pass`

Checks passed:

- deterministic pipeline identity
- approved recipes only used
- coastal pipeline reaches preview
- forest pipeline reaches preview
- mixed transition pipeline reaches preview with forest selection
- invalid package blocked safely
- incompatible version package blocked safely
- factory and runtime safety preserved
- no runtime / map / Blender / GLB / asset mutation

## Lifecycle

Lifecycle status:

- `READY`

Safety state:

- runtime activation authorized: `false`
- map downloads authorized: `false`
- Blender authorized: `false`
- GLB authorized: `false`
- asset modification authorized: `false`

## Testing

Focused tests cover:

- deterministic output
- successful end-to-end coastal flow
- successful end-to-end forest flow
- successful mixed transition fallback flow
- invalid package blocking
- incompatible version blocking
- approved-only recipe usage
- runtime safety
- record writing and lifecycle state

## Readiness

`ATLAS_FULL_PIPELINE_SIMULATION_001` is ready for future Atlas development planning.

What this proves:

- Atlas package planning layers can connect end to end
- safe blocking works before runtime
- approved recipe selection can hand off to deterministic generation
- generation can produce a data-only preview package

What remains intentionally blocked:

- runtime activation
- map downloads
- Blender
- GLB workflows
- asset mutation
