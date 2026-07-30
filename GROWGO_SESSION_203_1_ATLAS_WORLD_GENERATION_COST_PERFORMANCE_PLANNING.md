# GROWGO SESSION 203.1 — ATLAS WORLD GENERATION COST & PERFORMANCE PLANNING

## Goal

Define performance, storage, bandwidth, and scaling expectations for future Atlas-generated locations.

## Result

Completed `ATLAS_WORLD_GENERATION_COST_PERFORMANCE_001` as the first cost-and-scaling planning layer for Atlas world generation.

This layer uses measured planning artifacts from:

- `ATLAS_PACKAGE_OPTIMIZATION_001`
- `ATLAS_FULL_PIPELINE_SIMULATION_001`
- `LOCATION_RECIPE_FACTORY_001`

It turns the current Atlas planning outputs into explicit expectations for:

- regional package size
- recipe generation size
- preview payload size
- device cache footprint
- backend processing
- multi-player reuse
- refresh frequency
- Firebase/backend cost direction

## Files Created

### Code

- `asset-factory/atlas-world-generation-cost-performance-planning.mjs`

### Tests

- `tests/asset-factory-atlas-world-generation-cost-performance-planning.test.mjs`

### Generated Records

- `asset-factory-workspace/atlas-performance/ATLAS_WORLD_GENERATION_COST_PERFORMANCE_001/specification/atlas-world-generation-cost-performance-specification.json`
- `asset-factory-workspace/atlas-performance/ATLAS_WORLD_GENERATION_COST_PERFORMANCE_001/assumptions/atlas-world-generation-cost-model-assumptions.json`
- `asset-factory-workspace/atlas-performance/ATLAS_WORLD_GENERATION_COST_PERFORMANCE_001/validation/atlas-world-generation-cost-performance-validation.json`
- `asset-factory-workspace/atlas-performance/ATLAS_WORLD_GENERATION_COST_PERFORMANCE_001/reports/atlas-world-generation-cost-performance-scaling-report.md`

## Measured Planning Baselines

Measured from current planning artifacts:

- regional package examples: `72 KB`, `78 KB`, `84 KB`
- coastal recipe generation artifacts: about `39.14 KB`
- forest recipe generation + preview artifacts: about `55.15 KB`
- pipeline stage-results snapshot: about `149.79 KB`

Derived averages:

- average compressed regional package: about `78 KB`
- average deterministic recipe generation payload: low tens of KB
- average preview payload: low-to-mid tens of KB

## Performance Specification

The performance specification now defines:

- regional package envelope
- recipe generation profile
- preview payload profile
- device cache requirements
- backend processing expectations
- multi-player region reuse rules
- refresh frequency expectations

## Device Cache Expectations

From the existing optimization profile:

- `MOBILE_STANDARD_001`
  - warm packages: `24`
- `MOBILE_CONSTRAINED_001`
  - warm packages: `12`

This planning layer estimates the warm package footprint directly from the measured regional package average, instead of leaving cache cost abstract.

## Backend Processing Expectations

The planning model assumes:

- one validation pass per regional package
- one classification pass per valid package
- one selection pass per valid package
- one generation pass per successful location
- one preview assembly pass per successful location
- invalid packages short-circuit before downstream work

That keeps rejected packages cheap and makes successful paths predictable.

## Multi-Player Region Reuse

The scaling model assumes:

- regional packages are reused by `regionId`
- preview payloads are reused by deterministic recipe fingerprint
- players only force unique selection work when seed context actually differs

This means the main reuse target is shared regional metadata, not duplicated per-player package state.

## Refresh Frequency

Expected refresh windows:

- low-churn package refresh: `7d`
- normal refresh window: `24h`
- urgent selector/schema refresh: immediate revalidation

This keeps Atlas package updates responsive without assuming constant rebuild churn.

## Firebase / Backend Cost Considerations

This phase does **not** use live pricing lookup.

Instead it records engineering assumptions:

- store package payloads and preview payloads as immutable versioned blobs
- store lightweight region metadata and fingerprints separately
- avoid duplicate writes for the same region fingerprint
- avoid per-player preview duplication when recipe fingerprint is unchanged
- prefer batched metadata fetches over many small reads

Primary cost-pressure risks identified:

- duplicate package writes across refreshes
- per-player preview duplication
- excessive cache invalidation churn
- chatty metadata reads

## Validation

Validation status: `pass`

Checks passed:

- regional package sizes within standard budget
- preview payloads remain metadata-only and lightweight
- device cache requirements match optimization budgets
- backend processing short-circuits invalid packages
- multiplayer region reuse defined
- Firebase cost assumptions are reuse-first
- runtime / map / Blender / GLB / asset mutation blocked

## Testing

Focused tests cover:

- deterministic planning output
- package/generation/preview/cache/backend coverage
- reuse-first cost assumptions
- written records and validation

## Readiness

`ATLAS_WORLD_GENERATION_COST_PERFORMANCE_001` is ready for future Atlas engineering.

What is now ready:

- first measured cost/performance baseline
- cache and bandwidth expectation model
- backend processing expectation model
- multi-player reuse assumptions
- Firebase/backend planning assumptions

What remains intentionally blocked:

- runtime activation
- map downloads
- Blender
- GLB workflows
- asset modification
