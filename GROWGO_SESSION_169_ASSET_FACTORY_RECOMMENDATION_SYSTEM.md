# GROWGO SESSION 169 — ASSET FACTORY RECOMMENDATION SYSTEM FOUNDATION

## Summary

Created `ASSET_RECOMMENDATION_LAYER_001`, a deterministic read-only recommendation layer that suggests suitable Asset Factory assets from existing registry, variant, dependency, and discovery data.

This layer:

- scores registered assets against environment, biome, Atlas, relationship, and variant context
- returns structured recommendation results with reasons and compatibility summaries
- keeps recommendations grounded in registered assets only
- preserves dependency and related-asset traceability through the existing discovery layer
- validates deterministic scoring and reference integrity

It does not create assets, modify lifecycle records, bypass approval, or change Atlas truth.

## Files Changed

- `asset-factory/asset-recommendation.mjs`
- `tests/asset-factory-asset-recommendation.test.mjs`
- `GROWGO_SESSION_169_ASSET_FACTORY_RECOMMENDATION_SYSTEM.md`

## Target System

Created:

- `ASSET_RECOMMENDATION_LAYER_001`

Output:

- `ASSET_RECOMMENDATION_RESULT_001`
- `ASSET_RECOMMENDATION_VALIDATION_001`

## Recommendation Input Context

Supported:

- environment type
- biome
- object classification
- Atlas usage
- existing asset relationships
- variant compatibility

The layer also accepts optional climate, region profile, and style profile values so variant-aware recommendations can stay aligned with `ASSET_VARIANT_SYSTEM_001`.

## Recommendation Result Structure

Each `ASSET_RECOMMENDATION_RESULT_001` includes:

- recommended asset
- recipe ID
- score
- reason
- compatibility summary
- related assets

## Scoring Rules

Recommendations combine deterministic scores for:

- Atlas compatibility
- biome match
- variant match
- reuse value
- dependency compatibility

Atlas and biome fit drive most of the score, while variant and relationship signals refine the ordering when several assets are otherwise plausible.

## Recommendation Model

The layer builds on existing systems:

- asset registry for candidate assets
- variant system for context-aware target resolution
- dependency graph for compatibility signals
- discovery layer for related-asset traceability

This keeps recommendation behavior aligned with the broader Asset Factory architecture rather than introducing a separate suggestion catalog.

## Validation

Created:

- `ASSET_RECOMMENDATION_VALIDATION_001`

Checks passed:

- recommended assets exist
- scores deterministic
- compatibility valid
- no invalid references
- no source mutation

The validation record stores a deterministic recommendation hash for a fixed reference context.

## Test Results

Added coverage for:

- recommend coastal assets
- recommend civic assets
- recommend residential assets
- variant-aware recommendation
- deterministic output

## Readiness

`ASSET_RECOMMENDATION_LAYER_001` is ready for intelligent Asset Factory assistance by providing deterministic, context-aware asset suggestions without mutating any registry, lifecycle, or Atlas-owned source data.
