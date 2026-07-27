# GROWGO SESSION 132 — REAL WORLD REGION PACKAGE TEST

## Summary

Session 132 tests Atlas consumption of a prepared `GROWGO_REGION_IMPORT_PACKAGE_001` using real-world style package data instead of synthetic scene definitions.

This session keeps the region package authoritative.

Atlas only:

- interprets
- classifies
- assigns presentation
- composes scenes

Atlas does not:

- invent geography
- modify source geometry
- move objects

No live OSM was connected.
No production renderer was activated.
No gameplay systems were modified.
No new assets were created.

## Target

Created:

`ATLAS_REGION_PACKAGE_CONSUMPTION_TEST_001`

Purpose:

Verify Atlas can consume a prepared real-world region package and carry it through the existing runtime and Atlas composition pipeline.

## Files Created

- `asset-factory/atlas-region-package-test.mjs`
- `tests/asset-factory-atlas-region-package-test.test.mjs`
- `GROWGO_SESSION_132_REAL_WORLD_REGION_PACKAGE_TEST.md`

## Package Flow

The new package-consumption harness verifies:

`GROWGO_REGION_IMPORT_PACKAGE_001`

↓

`REGION_PACKAGE_RUNTIME_READER_001`

↓

`ATLAS_PRESENTATION_RUNTIME_LAYER_001`

↓

`GROWGO_OBJECT_CLASSIFICATION_LAYER_001`

↓

`ATLAS_OBJECT_RELATIONSHIP_LAYER_001`

↓

`ATLAS_ASSET_RECIPE_RESOLVER_001`

↓

`ATLAS_STREET_SCENE_COMPOSITION_LAYER_001`

## Output

Created:

`ATLAS_REGION_PACKAGE_TEST_RESULT_001`

Includes:

- package identity
- object count
- classifications
- asset assignments
- scene summary
- validation state
- deterministic fingerprint

The result records a package-driven Atlas outcome rather than a synthetic scene seed.

## Validation

Created:

`ATLAS_REGION_PACKAGE_TEST_VALIDATION_001`

Checks:

- provenance preserved
- geometry preserved
- object classifications valid
- asset assignments valid
- scene composition valid
- deterministic output

## Test Coverage

Added tests for:

- package loading
- object extraction
- classification flow
- asset assignment
- scene composition
- deterministic result
- explicit validation

Session 132 test result:

- `7/7` passing

Compatibility regression run:

- `tests/asset-factory-atlas-region-package-test.test.mjs`
- `tests/asset-factory-region-package-runtime-reader.test.mjs`
- `tests/asset-factory-atlas-asset-recipe-resolver.test.mjs`
- `tests/asset-factory-atlas-street-scene-composition.test.mjs`

Regression result:

- `28/28` passing

## Validation Results

The package-consumption harness confirms:

- Atlas can consume a prepared real-world style region package
- provenance survives from package to runtime to Atlas scene composition
- geometry remains preserved throughout the pipeline
- classification and recipe assignment remain valid on package-derived objects
- scene composition remains deterministic
- the current coastal package resolves into `2` valid package-driven scene types:
  `COASTAL_STREET_SCENE` and `TOWN_MAIN_STREET_SCENE`

## Readiness

Atlas is now ready for larger real-world testing using prepared region packages rather than only synthetic controlled scenes.

This creates a clean bridge between package-based regional data and future broader real-world package consumption tests.
