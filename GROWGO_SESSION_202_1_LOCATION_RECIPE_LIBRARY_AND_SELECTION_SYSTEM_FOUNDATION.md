# GROWGO SESSION 202.1 — LOCATION RECIPE LIBRARY & SELECTION SYSTEM FOUNDATION

## Goal

Create `LOCATION_RECIPE_SELECTOR_001`, a reusable read-only selector that chooses from approved location recipes using deterministic world-context inputs.

## Result

Completed `LOCATION_RECIPE_SELECTOR_001` as a reusable selector foundation using only approved recipes:

- `COASTAL_LOCATION_RECIPE_001`
- `FOREST_LOCATION_RECIPE_001`

The selector reads approved recipe records, builds normalized metadata records, enforces approved/development-only eligibility, scores candidates deterministically, blocks unsupported contexts, and records lifecycle/validation state for future Atlas Engine integration.

## Files Created

### Code

- `asset-factory/location-recipe-selector-foundation.mjs`

### Tests

- `tests/asset-factory-location-recipe-selector-foundation.test.mjs`

### Generated Selector Records

- `asset-factory-workspace/recipe-selector/LOCATION_RECIPE_SELECTOR_001/specification/location-recipe-selector-specification.json`
- `asset-factory-workspace/recipe-selector/LOCATION_RECIPE_SELECTOR_001/metadata/location-recipe-selector-library.json`
- `asset-factory-workspace/recipe-selector/LOCATION_RECIPE_SELECTOR_001/metadata/coastal-location-recipe-001-selector-metadata.json`
- `asset-factory-workspace/recipe-selector/LOCATION_RECIPE_SELECTOR_001/metadata/forest-location-recipe-001-selector-metadata.json`
- `asset-factory-workspace/recipe-selector/LOCATION_RECIPE_SELECTOR_001/validation/location-recipe-selector-validation.json`
- `asset-factory-workspace/recipe-selector/LOCATION_RECIPE_SELECTOR_001/lifecycle/location-recipe-selector-lifecycle-record.json`
- `asset-factory-workspace/recipe-selector/LOCATION_RECIPE_SELECTOR_001/reports/location-recipe-selector-foundation-report.md`

## Selector Foundation

The selector specification now defines:

- recipe metadata schema
- biome tags
- environment requirements
- deterministic selection rules
- confidence scoring
- fallback rules
- recipe version compatibility
- approved-recipe-only eligibility

## Deterministic Selection Behavior

Confirmed behavior:

- same coastal context always selects `COASTAL_LOCATION_RECIPE_001`
- same forest context always selects `FOREST_LOCATION_RECIPE_001`
- unsupported contexts are blocked
- non-approved candidates are excluded from selection

## Validation

Validation record confirms:

- approved recipes only
- development-only visibility
- deterministic selection for same inputs
- supported recipe selection succeeds
- unsupported contexts are blocked
- version compatibility is enforced
- runtime activation remains blocked

## Testing

Ran:

```text
node --test tests/asset-factory-location-recipe-selector-foundation.test.mjs
```

Result:

- 4 passed
- 0 failed

## Safety

No Blender usage.
No GLBs.
No asset modification.
No runtime activation.

## Readiness

`LOCATION_RECIPE_SELECTOR_001` is ready for future Atlas Engine integration as a read-only recipe selection layer.
