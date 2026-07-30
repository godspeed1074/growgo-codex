# GROWGO SESSION 202.3 — ATLAS ENGINE RECIPE INTEGRATION PLANNING

## Goal

Create the planning layer between real-world environment data and `LOCATION_RECIPE_SELECTOR_001` without activating runtime.

## Result

Completed `ATLAS_ENGINE_RECIPE_INTEGRATION_001` as a read-only planning contract that defines how Atlas-classified regional context becomes deterministic selector input for approved location recipes.

Approved selector dependencies used:

- `LOCATION_RECIPE_SELECTOR_001`
- `COASTAL_LOCATION_RECIPE_001`
- `FOREST_LOCATION_RECIPE_001`

## Files Created

### Code

- `asset-factory/atlas-engine-recipe-integration-planning.mjs`

### Tests

- `tests/asset-factory-atlas-engine-recipe-integration-planning.test.mjs`

### Generated Planning Records

- `asset-factory-workspace/atlas-integration/ATLAS_ENGINE_RECIPE_INTEGRATION_001/specification/atlas-engine-recipe-integration-specification.json`
- `asset-factory-workspace/atlas-integration/ATLAS_ENGINE_RECIPE_INTEGRATION_001/validation/atlas-engine-recipe-integration-validation.json`
- `asset-factory-workspace/atlas-integration/ATLAS_ENGINE_RECIPE_INTEGRATION_001/lifecycle/atlas-engine-recipe-integration-lifecycle-record.json`
- `asset-factory-workspace/atlas-integration/ATLAS_ENGINE_RECIPE_INTEGRATION_001/reports/atlas-engine-recipe-integration-architecture-report.md`

## Integration Definition

The integration specification now defines:

- environment classification schema
- biome tagging rules
- selector input contract
- confidence thresholds
- fallback strategy
- coordinate-based deterministic seed rules
- regional package compatibility
- future Atlas Engine integration boundaries

## Environment Classification Schema

Supported planning environment types:

- `COASTAL_EXPLORATION`
- `FOREST_EXPLORATION`
- `MIXED_EDGE_TRANSITION`

Unsupported environments are blocked with:

- `BLOCK_SELECTION`
- reason code: `UNSUPPORTED_ENVIRONMENT_CLASSIFICATION`

## Selector Input Contract

Mapped fields into `LOCATION_RECIPE_SELECTOR_001`:

- `worldContextId`
- `environment`
- `biomeProfile`
- `routeMode`
- `archetype`
- `desiredFeatures`
- `seed`

Preconditions enforced:

- environment must be `DEVELOPMENT_ONLY`
- selector validation must pass
- selector simulation validation must pass
- runtime activation must remain false

## Confidence and Fallback Rules

Thresholds:

- direct selection minimum: `60`
- approved fallback minimum: `35`
- ambiguity review band: `35–84`
- below `35`: block

Fallback strategy:

- same biome tag
- same biome family
- highest-confidence approved recipe

Blocked when:

- confidence below minimum fallback threshold
- environment is not development-only
- recipe is not `APPROVED_CURRENT`
- selector version is incompatible
- runtime activation is requested

## Coordinate Seed Rules

Deterministic seed inputs:

- `regionPackageId`
- `worldContextId`
- `coordinateReference.latBucket`
- `coordinateReference.lngBucket`
- `primaryBiomeTag`
- `archetypeHint`
- `selectorVersion`

Coordinate precision:

- latitude bucket: `0.01`
- longitude bucket: `0.01`

Purpose:

- stabilize recipe selection against insignificant coordinate jitter

## Regional Package Compatibility

Accepted sources:

- `GROWGO_REGION_IMPORT_PACKAGE_001`
- future runtime region packages
- prepared real-world region packages

Atlas planning boundaries:

- may classify environment
- may choose approved recipes
- must not modify geometry
- must not invent map features
- must not activate runtime rendering

## Representative Planning Scenarios

- `ATLAS_COASTAL_CONTEXT_001`
  - selected `COASTAL_LOCATION_RECIPE_001`
  - direct match

- `ATLAS_FOREST_CONTEXT_001`
  - selected `FOREST_LOCATION_RECIPE_001`
  - direct match

- `ATLAS_MIXED_EDGE_CONTEXT_001`
  - selected `FOREST_LOCATION_RECIPE_001`
  - approved fallback

## Validation

Validation status: `pass`

Checks passed:

- selector validation passed
- approved recipes only
- environment schema covers supported recipes
- coordinate seed rules deterministic
- confidence thresholds match selector behavior
- regional package compatibility remains read-only
- future Atlas boundary runtime blocked

## Lifecycle

Lifecycle status:

- `PLANNING_READY`

Safety state:

- runtime activation authorized: `false`
- map downloads authorized: `false`
- Blender authorized: `false`
- GLB authorized: `false`
- asset modification authorized: `false`

## Testing

Ran:

```text
node --test tests/asset-factory-atlas-engine-recipe-integration-planning.test.mjs
```

Result:

- 4 passed
- 0 failed

## Readiness

`ATLAS_ENGINE_RECIPE_INTEGRATION_001` is ready for future Atlas Engine development as a planning-only bridge into `LOCATION_RECIPE_SELECTOR_001`.
