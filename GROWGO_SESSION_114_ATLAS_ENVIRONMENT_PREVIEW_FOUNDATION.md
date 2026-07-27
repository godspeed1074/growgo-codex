# GROWGO SESSION 114 — ATLAS ENVIRONMENT PREVIEW FOUNDATION

Branch:
`feature/growgo-asset-factory-world-expansion`

## Goal

Create a preview foundation that combines Atlas natural objects with deterministic nature asset assignments for inspection.

## Scope Outcome

Created:

- `ATLAS_ENVIRONMENT_PREVIEW_LAYER_001`
- `ATLAS_ENVIRONMENT_PREVIEW_OBJECTS_001`
- `ATLAS_ENVIRONMENT_PREVIEW_VALIDATION_001`
- [atlas-environment-preview.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/atlas-environment-preview.mjs)
- [asset-factory-atlas-environment-preview.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/asset-factory-atlas-environment-preview.test.mjs)

This session does not:

- activate the renderer
- create new models
- modify gameplay
- import OSM

## Preview Purpose

`ATLAS_ENVIRONMENT_PREVIEW_LAYER_001` now combines:

- real GrowGo world objects
- Atlas object relationships
- deterministic nature asset assignments

into inspection-ready preview entries.

Real-world geometry remains authoritative throughout the preview layer.

## Input Support

The preview layer now accepts:

- `GROWGO_OBJECT_CLASSIFICATION_LAYER_001`
- `GROWGO_WORLD_OBJECTS_001`
- `ATLAS_OBJECT_RELATIONSHIP_LAYER_001`
- direct `ATLAS_OBJECT_RELATIONSHIPS_001`
- `NATURE_ENVIRONMENT_RECIPE_RESOLVER_001`

It can also generate nature assignments on demand when only world objects and preview options are provided.

## Output Contract

`ATLAS_ENVIRONMENT_PREVIEW_OBJECTS_001` entries now include:

- object ID
- source geometry reference
- environment recipe
- assigned assets
- LOD rules
- preview metadata

Preview metadata currently records:

- environment type
- relationship hints
- real-world object type
- GrowGo classification

## Supported Preview Types

### `COASTAL_PARK_PREVIEW`

Includes:

- park boundary
- coastal recipe
- tree assignment
- ground treatment
- rock treatment

### `SUBURBAN_GREENSPACE_PREVIEW`

Includes:

- park or greenspace boundary
- garden or greenspace recipe
- vegetation assignment

### `BEACH_EDGE_PREVIEW`

Includes:

- coastline or beach-edge reference
- beach treatment assignment

## Preview Mapping

The preview layer now maps environment recipes into inspection types as follows:

- `COASTAL_PARK`
  - `COASTAL_PARK_PREVIEW`

- `SUBURBAN_GARDEN`
  - `SUBURBAN_GREENSPACE_PREVIEW`

- `FOREST`
  - `SUBURBAN_GREENSPACE_PREVIEW`

- `BEACH`
  - `BEACH_EDGE_PREVIEW`

This keeps the preview surface compact while still preserving the underlying environment recipe identity.

## Validation

`ATLAS_ENVIRONMENT_PREVIEW_VALIDATION_001` now checks:

- source geometry preserved
- assets exist
- recipes valid
- deterministic output

The preview layer also validates that every preview object resolves back to a real source world object before preview metadata is emitted.

## Tests Added

Verified:

- coastal park preview
- suburban greenspace preview
- beach preview
- asset assignment validation
- deterministic preview
- classified Atlas pipeline preview

## Files Created

- [atlas-environment-preview.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/atlas-environment-preview.mjs)
- [asset-factory-atlas-environment-preview.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/asset-factory-atlas-environment-preview.test.mjs)
- [GROWGO_SESSION_114_ATLAS_ENVIRONMENT_PREVIEW_FOUNDATION.md](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_114_ATLAS_ENVIRONMENT_PREVIEW_FOUNDATION.md)

## Validation Results

Verified:

- `tests/asset-factory-atlas-environment-preview.test.mjs`
  - `6 / 6` passing

- `tests/asset-factory-nature-environment-recipe-resolver.test.mjs`
  - `7 / 7` passing

- `tests/asset-factory-atlas-object-relationship.test.mjs`
  - `6 / 6` passing

- `tests/asset-factory-growgo-object-classification.test.mjs`
  - `7 / 7` passing

## Readiness

`ATLAS_ENVIRONMENT_PREVIEW_LAYER_001` is ready for future renderer hookup.

The Atlas pipeline can now produce inspection-ready environment previews that preserve real-world geometry, retain deterministic recipe resolution, and expose Asset Factory nature treatment decisions without altering geography.
