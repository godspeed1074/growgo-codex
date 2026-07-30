# GROWGO SESSION 203.2 — ATLAS BUDGET VALIDATOR PLANNING

## Goal

Define the validation layer that checks whether regional packages and location recipes fit GrowGo mobile and backend budgets.

## Result

Completed `ATLAS_BUDGET_VALIDATOR_001` as the budget-gating planning layer for future Atlas engineering.

Integrated references:

- `ATLAS_WORLD_GENERATION_COST_PERFORMANCE_001`
- `ATLAS_PACKAGE_OPTIMIZATION_001`
- `LOCATION_RECIPE_FACTORY_001`

This layer now defines the budget rules that future Atlas package and recipe work should be measured against before engineering handoff.

## Files Created

### Code

- `asset-factory/atlas-budget-validator-planning.mjs`

### Tests

- `tests/asset-factory-atlas-budget-validator-planning.test.mjs`

### Generated Records

- `asset-factory-workspace/atlas-budget-validator/ATLAS_BUDGET_VALIDATOR_001/specification/atlas-budget-validator-specification.json`
- `asset-factory-workspace/atlas-budget-validator/ATLAS_BUDGET_VALIDATOR_001/validation/atlas-budget-validator-validation.json`
- `asset-factory-workspace/atlas-budget-validator/ATLAS_BUDGET_VALIDATOR_001/lifecycle/atlas-budget-validator-lifecycle-record.json`
- `asset-factory-workspace/atlas-budget-validator/ATLAS_BUDGET_VALIDATOR_001/reports/atlas-budget-validator-architecture-report.md`

## Budget Areas Defined

The validator specification now defines:

- package size limits
- cache limits
- recipe complexity limits
- generation cost thresholds
- preview payload limits
- warning states
- blocking states
- approval recommendations

## Package Size Limits

Current hard package cap:

- `96 KB`

Supporting bands:

- warning threshold: slightly above current measured average
- soft limit: slightly above current measured peak
- hard block: aligned with `MOBILE_STANDARD_001`

This keeps package growth visible before it becomes a hard failure.

## Cache Limits

Warm-cache limits remain aligned with the existing optimization profile:

- standard profile: `24`
- constrained profile: `12`

The validator now formalizes warning and blocking behavior around those cache ceilings.

## Recipe and Preview Limits

The validator now tracks:

- recipe generation warning and hard-block bands
- preview payload warning and hard-block bands
- deterministic stage expectations
- required short-circuit behavior for blocked packages

This gives later Atlas engineering a concrete place to check complexity drift.

## Warning and Blocking States

Warning examples:

- `WARNING_PACKAGE_NEAR_LIMIT`
- `WARNING_CACHE_NEAR_LIMIT`
- `WARNING_RECIPE_COMPLEXITY_RISING`
- `WARNING_PREVIEW_PAYLOAD_RISING`
- `WARNING_BACKEND_REUSE_BELOW_TARGET`

Blocking examples:

- `BLOCK_PACKAGE_SIZE_LIMIT`
- `BLOCK_CACHE_LIMIT`
- `BLOCK_RECIPE_COMPLEXITY_LIMIT`
- `BLOCK_PREVIEW_PAYLOAD_LIMIT`
- `BLOCK_REUSE_POLICY_FAILURE`
- `BLOCK_RUNTIME_SAFETY_VIOLATION`

## Approval Recommendations

The validator can now recommend:

- `APPROVE_WITHIN_BUDGET`
- `APPROVE_WITH_WARNING`
- `HOLD_FOR_OPTIMIZATION`
- `BLOCK_FOR_REDESIGN`

This keeps budget review more useful than a simple pass/fail flag.

## Representative Budget Cases

The planning layer includes representative cases for:

- fully within limits
- warning-band only
- soft-limit hold
- hard-block redesign

Each case is evaluated deterministically and checked against its expected recommendation.

## Validation

Validation status: `pass`

Checks passed:

- package size limits defined
- cache limits defined
- recipe complexity and preview limits defined
- warning and blocking states defined
- approval recommendations defined
- representative cases match expected recommendations
- runtime / downloads / Blender / GLBs / asset mutation blocked

## Lifecycle

Lifecycle status:

- `PLANNING_READY`

Safety state:

- runtime activation authorized: `false`
- downloads authorized: `false`
- Blender authorized: `false`
- GLB authorized: `false`
- asset modification authorized: `false`

## Testing

Focused tests cover:

- deterministic output
- budget rule coverage
- representative recommendation outcomes
- generated record writing
- preserved safety blocks

## Readiness

`ATLAS_BUDGET_VALIDATOR_001` is ready for future Atlas engineering.

What is now ready:

- explicit mobile and backend budget gate definitions
- warning vs hold vs hard-block logic
- deterministic approval recommendations
- reusable planning contract for later engineering validation

What remains intentionally blocked:

- runtime activation
- downloads
- Blender
- GLB workflows
- asset modification
