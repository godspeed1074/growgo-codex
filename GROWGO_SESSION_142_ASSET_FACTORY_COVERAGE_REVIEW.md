# GROWGO SESSION 142 — ASSET FACTORY COVERAGE REVIEW

## Summary

Session 142 reviews current Asset Factory coverage against Atlas demand and identifies the remaining highest-value asset gaps.

This is a review and planning phase only.

No models were created.
No renderer work was performed.
No gameplay systems were changed.
No OSM work was introduced.

## Target

Created:

`ASSET_FACTORY_COVERAGE_REVIEW_LAYER_001`

Purpose:

Compare current Atlas recipe demand against the current Asset Factory registry and pack foundations.

## Files Created

- `asset-factory/asset-coverage-review.mjs`
- `tests/asset-factory-asset-coverage-review.test.mjs`
- `GROWGO_SESSION_142_ASSET_FACTORY_COVERAGE_REVIEW.md`

## Review Scope

Analysed:

- Nature
- Civic
- Transport
- Road and Street
- Commercial
- Residential

## Output

Created:

`ASSET_FACTORY_COVERAGE_REPORT_001`

Includes:

- pack coverage percentage
- recipe coverage
- missing asset families
- highest-value gaps
- recommended next actions

## Coverage Method

Coverage is calculated from three deterministic signals:

1. family coverage:
   expected families present in the pack
2. recipe coverage:
   Atlas-facing demand recipes currently bridged by the registry
3. variant coverage:
   families meeting a minimum reusable depth target of two assets

This gives a more useful planning signal than checking only whether a pack exists.

## Current Coverage

### Nature

- pack coverage: `42%`
- family coverage: `100%`
- recipe coverage: `0%`
- variant coverage: `25%`

Remaining Atlas recipe gaps:

- `BEACH_RECIPE_001`
- `RESERVE_RECIPE_001`
- `FOREST_RECIPE_001`
- `RECIPE_TREATMENT_PARK_STANDARD_001`

Interpretation:

The nature foundation has family presence, but it still lacks direct registry bridge coverage for the explicit Atlas nature recipes introduced in Session 135.

### Civic

- pack coverage: `67%`
- family coverage: `100%`
- recipe coverage: `100%`
- variant coverage: `0%`

Interpretation:

Civic now covers Atlas demand correctly, but each civic family is still shallow in reusable variant depth.

### Transport

- pack coverage: `67%`
- family coverage: `100%`
- recipe coverage: `100%`
- variant coverage: `0%`

Interpretation:

Transport has strong Atlas bridge coverage, but family depth is still at single-foundation-entry level.

### Road And Street

- pack coverage: `67%`
- family coverage: `100%`
- recipe coverage: `100%`
- variant coverage: `0%`

Interpretation:

Road and street now covers route-facing Atlas demand, but detail depth remains shallow across all families.

### Commercial

- pack coverage: `75%`
- family coverage: `100%`
- recipe coverage: `100%`
- variant coverage: `25%`

Interpretation:

Commercial now covers the current Atlas recipe bridge well, and it has slightly better family depth than civic, transport, or road and street because the food-business family already has more than one entry.

### Residential

- pack coverage: `89%`
- family coverage: `100%`
- recipe coverage: `100%`
- variant coverage: `67%`

Interpretation:

Residential is currently the strongest-covered pack because it combines:

- earlier house onboarding from Session 110
- broader house and multi-unit foundation coverage from Session 141
- garden/detail bridge support

## Missing Asset Families

Current review result:

- no reviewed pack is missing its planned family structure

This means the remaining gaps are mostly:

- missing direct Atlas recipe bridges
- shallow family depth
- low variant density

## Highest-Value Gaps

### 1. Nature Atlas Recipe Bridge Gap

Highest-value uncovered demand remains:

- beach
- reserve
- forest
- park treatment

These are explicit Atlas-facing recipe gaps rather than missing family definitions.

### 2. Civic Variant Depth

Civic families exist, but each currently relies on a single foundation entry.

Highest-value depth targets:

- school variants
- library variants
- community building variants
- sports facility variants

### 3. Road And Street Variant Depth

Road and street coverage exists, but family depth remains thin.

Highest-value depth targets:

- road-surface variants
- sidewalk and crossing variants
- street-furniture sets
- road-detail sets

### 4. Transport Variant Depth

Transport has coverage, but still needs more reusable depth across:

- rail infrastructure
- bus-stop variants
- ferry variants
- route-side infrastructure

## Recommended Next Actions

Recommended order from the review layer:

1. `NATURE`
2. `CIVIC`
3. `ROAD_AND_STREET`
4. `TRANSPORT`
5. `COMMERCIAL`
6. `RESIDENTIAL`

Reasoning:

- nature ranks first because it still has uncovered Atlas recipe demand
- civic, road and street, and transport all cover demand but remain shallow in family depth
- commercial and residential are currently the strongest-covered foundations among the reviewed packs

## Validation

Created:

`ASSET_FACTORY_COVERAGE_VALIDATION_001`

Checks:

- registry completeness
- recipe links
- deterministic analysis
- no duplicate categories

## Tests

Added tests for:

- coverage calculation
- missing recipe detection
- priority ordering
- deterministic report
- explicit validation

## Validation Results

Verified:

- `tests/asset-factory-asset-coverage-review.test.mjs`
  - `5 / 5` passing

Regression slice:

- `tests/asset-factory-asset-registry.test.mjs`
  - `48 / 48` passing
- `tests/asset-factory-asset-pack-priority.test.mjs`
  - `5 / 5` passing
- `tests/asset-factory-atlas-asset-recipe-resolver.test.mjs`
  - `10 / 10` passing

## Readiness

`ASSET_FACTORY_COVERAGE_REVIEW_LAYER_001` is ready to guide the next asset-planning phase.

The current review suggests:

- close explicit Atlas nature recipe gaps first
- then deepen civic, road and street, and transport family variants
- keep commercial and residential in expansion mode rather than emergency gap mode
