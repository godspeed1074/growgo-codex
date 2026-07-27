# GROWGO SESSION 155 — ASSET PREVIEW AND REVIEW FOUNDATION

## Summary

Created `ASSET_PREVIEW_REVIEW_LAYER_001`, an inspection-only layer that creates deterministic preview records for Asset Factory assets before final approval.

This layer preserves:

- asset identity
- recipe identity
- variants
- quality data
- authoring history

It does not modify assets, bypass validation, or activate unapproved assets.

## Files Changed

- `asset-factory/asset-preview-review.mjs`
- `tests/asset-factory-asset-preview-review.test.mjs`
- `GROWGO_SESSION_155_ASSET_PREVIEW_REVIEW_FOUNDATION.md`

## Target System

Created:

- `ASSET_PREVIEW_REVIEW_LAYER_001`

Output:

- `ASSET_PREVIEW_RECORD_001`
- `ASSET_PREVIEW_REVIEW_VALIDATION_001`

## Input

Consumes:

- `ASSET_AUTHORING_BATCH_RECORD_001`
- `ASSET_QUALITY_REPORT_001`

The layer derives review-ready inspection records by combining the current batch execution state with a quality summary for the same asset.

## Preview Workflow

Supported review states:

- `PREVIEW_READY`
- `UNDER_REVIEW`
- `CHANGES_REQUESTED`
- `REVIEW_APPROVED`

Supported transitions:

- `PREVIEW_READY` -> `UNDER_REVIEW`
- `UNDER_REVIEW` -> `CHANGES_REQUESTED`
- `UNDER_REVIEW` -> `REVIEW_APPROVED`
- `CHANGES_REQUESTED` -> `UNDER_REVIEW`

## Initial Preview Record

Default inspection target:

- `BUILDING_CIVIC_SPORTS_PAVILION_001`

Initial preview data:

- preview status: `PREVIEW_DATA_AVAILABLE`
- review status: `PREVIEW_READY`
- selected variant: `base`
- available variants:
  - `sports_pavilion`
  - `changing_rooms`
  - `recreation_building`
- LOD rules:
  - `LOD_CLOSE`
  - `LOD_GAMEPLAY`
  - `LOD_MAP`

Preview context:

- creation stage: `FOUNDATION_ASSETS`
- asset state: `READY`
- dependency status: `CLEAR`

## Quality Summary

The initial preview record captures the current quality summary without changing approval state.

For `BUILDING_CIVIC_SPORTS_PAVILION_001`:

- quality report: `ASSET_QUALITY_REPORT_BUILDING_CIVIC_SPORTS_PAVILION_001`
- approval readiness: `NOT_READY`
- pass count: `1`
- fail count: `3`

Warnings currently visible in the preview layer:

- `metadata incomplete`
- `missing texture budget rule`
- `papercut compatibility not established`
- `style profile missing or invalid`

This is intentional for the inspection phase: the preview layer shows what review still needs to resolve instead of masking it.

## Review Path

Verified review progression:

- `PREVIEW_READY`
- `UNDER_REVIEW`
- `REVIEW_APPROVED`

Review history is preserved deterministically inside the preview record.

## Validation

Created:

- `ASSET_PREVIEW_REVIEW_VALIDATION_001`

Checks passed:

- asset exists
- preview references valid asset
- quality data exists
- review state valid
- deterministic output

Deterministic preview hash:

- `3be00d7b8d089a05f2a134bd45253681cabf9f90e9f671cf48aeca2ab8d00640`

## Test Results

Added coverage for:

- preview creation
- review progression
- invalid asset handling
- approval path
- deterministic output
- explicit validation

Focused supporting test pass completed successfully.

## Readiness

`ASSET_PREVIEW_REVIEW_LAYER_001` is ready to support asset approval decisions by giving the Asset Factory a controlled, deterministic preview and review checkpoint between batch authoring progress and final approval.
