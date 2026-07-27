# GROWGO SESSION 156 — ASSET VARIANT PREVIEW COMPARISON

## Summary

Created `ASSET_VARIANT_COMPARISON_LAYER_001`, an inspection-only comparison layer that reviews deterministic asset variants before approval.

This layer preserves:

- base asset identity
- variant identity
- quality summaries
- review history

It does not modify assets, change Atlas rules, or bypass approval.

## Files Changed

- `asset-factory/asset-variant-comparison.mjs`
- `tests/asset-factory-asset-variant-comparison.test.mjs`
- `GROWGO_SESSION_156_ASSET_VARIANT_COMPARISON.md`

## Target System

Created:

- `ASSET_VARIANT_COMPARISON_LAYER_001`

Output:

- `ASSET_VARIANT_COMPARISON_RECORD_001`
- `ASSET_VARIANT_COMPARISON_VALIDATION_001`

## Input

Consumes:

- `ASSET_PREVIEW_RECORD_001`
- `ASSET_VARIANT_ASSIGNMENT_001`

The layer combines a review-ready preview record with deterministic variant assignments and produces a comparison record that can be inspected before approval.

## Comparison Workflow

Default comparison target:

- `BUILDING_RESIDENTIAL_SUBURBAN_001`

Resolved variant set:

- `coastal` -> `BUILDING_RESIDENTIAL_HOUSE_COASTAL_001`
- `rural` -> `BUILDING_RESIDENTIAL_HOUSE_RURAL_001`
- `suburban` -> `BUILDING_RESIDENTIAL_SUBURBAN_001`

Review state:

- `COMPARISON_READY`

Comparison record contents:

- asset ID
- variant list
- comparison criteria
- quality summaries
- recommended variant
- review status

## Comparison Criteria

Supported criteria:

- `style_match`
- `biome_compatibility`
- `atlas_compatibility`
- `performance_budget`
- `reuse_value`

These criteria are scored per variant and combined into a deterministic recommendation score.

## Recommendation Rules

The comparison layer currently evaluates registered residential variants against deterministic environment assignments and ranks them by weighted comparison score.

Verified comparison result:

- `coastal` score: `81`
- `rural` score: `81`
- `suburban` score: `78`

Deterministic recommendation:

- recommended variant: `coastal`
- recommended asset: `BUILDING_RESIDENTIAL_HOUSE_COASTAL_001`

Tie-breaking remains deterministic by score first and variant ID second.

## Quality Summary Handling

The comparison record inherits preview quality readiness from the associated preview record and attaches per-variant compatibility evidence from each variant assignment.

This ensures the comparison layer remains inspection-only while still exposing:

- approval readiness
- warning count
- compatibility preservation
- inherited quality report identity

## Validation

Created:

- `ASSET_VARIANT_COMPARISON_VALIDATION_001`

Checks passed:

- variants belong to asset
- comparison data complete
- deterministic recommendation
- no approval bypass

Deterministic comparison hash:

- `88f9fe6d7bb4d50236d6967a6e3cf8013e309f2c4cc2f6fcbb1bcb4c3d784f74`

## Test Results

Added coverage for:

- compare variants
- select recommended variant
- invalid variant handling
- deterministic output
- explicit validation

Focused supporting test pass completed successfully.

Result:

- `22` tests passed
- `0` tests failed

## Readiness

`ASSET_VARIANT_COMPARISON_LAYER_001` is ready to support variant approval decisions by giving Asset Factory review flows a deterministic comparison checkpoint between preview review and final approval.
