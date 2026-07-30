# GROWGO SESSION 202.2 — LOCATION RECIPE SELECTION SIMULATION

## Goal

Validate `LOCATION_RECIPE_SELECTOR_001` against representative world contexts using approved recipes only.

## Approved Recipes Used

- `COASTAL_LOCATION_RECIPE_001`
- `FOREST_LOCATION_RECIPE_001`

## Files Created

### Code

- `asset-factory/location-recipe-selection-simulation.mjs`

### Tests

- `tests/asset-factory-location-recipe-selection-simulation.test.mjs`

### Generated Simulation Records

- `asset-factory-workspace/recipe-selector/LOCATION_RECIPE_SELECTOR_001/simulation/location-recipe-selector-simulation-inputs.json`
- `asset-factory-workspace/recipe-selector/LOCATION_RECIPE_SELECTOR_001/simulation/location-recipe-selector-simulation-results.json`
- `asset-factory-workspace/recipe-selector/LOCATION_RECIPE_SELECTOR_001/simulation/location-recipe-selector-confidence-results.json`
- `asset-factory-workspace/recipe-selector/LOCATION_RECIPE_SELECTOR_001/validation/location-recipe-selector-simulation-validation.json`
- `asset-factory-workspace/recipe-selector/LOCATION_RECIPE_SELECTOR_001/reports/location-recipe-selector-simulation-report.md`

## Simulated Contexts

1. `COASTAL_ENVIRONMENT_001`
2. `FOREST_ENVIRONMENT_001`
3. `MIXED_BIOME_ENVIRONMENT_001`
4. `UNSUPPORTED_ENVIRONMENT_001`
5. `AMBIGUOUS_ENVIRONMENT_001`

## Selection Results

- Coastal environment:
  - selected `COASTAL_LOCATION_RECIPE_001`
  - confidence `100`
  - fallback `false`

- Forest environment:
  - selected `FOREST_LOCATION_RECIPE_001`
  - confidence `100`
  - fallback `false`

- Mixed biome environment:
  - selected `COASTAL_LOCATION_RECIPE_001`
  - confidence `97`
  - fallback `false`

- Unsupported environment:
  - selected `BLOCKED`
  - confidence `0`
  - fallback `false`

- Ambiguous environment:
  - selected `FOREST_LOCATION_RECIPE_001`
  - confidence `80`
  - fallback `true`

## Confidence Ranking Notes

- Clear biome matches reached full confidence (`100`) for both coastal and forest contexts.
- The mixed biome case still ranked coastal highest because shoreline and wet-crossing requirements outweighed the weaker forest-style enclosure hints.
- The ambiguous case triggered a valid approved fallback, selecting forest with a lower biome-match component but strong archetype and feature support.
- The unsupported case remained blocked even though low-level candidate scores existed, because no approved recipe crossed the minimum confidence threshold safely.

## Validation

Validation record status: `pass`

Checks passed:

- approved recipes only
- deterministic selection
- correct expected recipe per scenario
- fallback behavior valid
- confidence ranking valid
- unsupported environment blocked
- same inputs same fingerprint
- runtime activation blocked

## Testing

Ran:

```text
node --test tests/asset-factory-location-recipe-selection-simulation.test.mjs
```

Result:

- 4 passed
- 0 failed

## Safety

- no Blender
- no GLBs
- no asset modification
- no runtime activation

## Readiness

`LOCATION_RECIPE_SELECTOR_001` simulation is ready for Atlas Engine integration planning.
