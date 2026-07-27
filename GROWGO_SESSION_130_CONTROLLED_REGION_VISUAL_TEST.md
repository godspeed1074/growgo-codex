# GROWGO SESSION 130 — CONTROLLED REGION VISUAL TEST

## Summary

Session 130 extends the controlled Atlas composition proof from town scale into a synthetic regional scene using existing systems.

This remains a controlled synthetic test.

It uses explicit authorization, remains isolated, preserves Atlas authority, and stays reversible.

No production renderer was activated.
No real map was connected.
No gameplay systems were modified.
No new assets were created.

## Target

Created:

`CONTROLLED_REGION_VISUAL_TEST_001`

Scene contents:

- multiple towns
- connecting roads
- rural/natural areas
- landmarks
- transport links
- environmental areas

## Files Created

- `asset-factory/atlas-controlled-region-test.mjs`
- `tests/asset-factory-atlas-controlled-region-test.test.mjs`
- `GROWGO_SESSION_130_CONTROLLED_REGION_VISUAL_TEST.md`

## Test Design

Created:

`asset-factory/atlas-controlled-region-test.mjs`

Purpose:

Verify Atlas can compose multiple towns into a connected regional environment while remaining deterministic and organized inside the controlled synthetic proof path.

The regional proof consumes Atlas command flow through the passive renderer connection layer and validates a multi-town regional subset.

The scene remains:

- isolated
- reversible
- synthetic-only
- non-production

## Requirements Verified

The controlled regional proof verifies:

- town relationships
- regional road hierarchy
- landmark placement
- natural environment relationships
- transport connections
- asset references
- layer ordering
- cleanup

The verified synthetic region includes:

- 3 distinct towns
- shared regional connector infrastructure
- 10 road-layer highway, connector, town-road, intersection, path, and transport objects
- 12 object-layer residential, commercial, civic, and landmark objects
- 2 ground-layer environmental objects
- 3 nature-layer objects
- 1 detail-layer object

## Output

Created:

`CONTROLLED_REGION_VISUAL_TEST_RESULT_001`

Includes:

- town count
- object count
- scene categories
- layer summary
- deterministic fingerprint
- cleanup status

Result content also records:

- tested object identities
- object categories
- town keys
- asset references
- render layers
- preserved layer ordering
- transform signatures
- source scene identity

## Validation

Created:

`CONTROLLED_REGION_VISUAL_TEST_VALIDATION_001`

Checks:

- all objects accounted for
- relationships preserved
- no source mutation
- deterministic output
- commands valid

Validation also confirms:

- authorization passed
- town grouping valid
- regional road hierarchy valid
- landmark placement valid
- natural environment relationships valid
- transport connections valid
- asset references valid
- layer ordering valid
- cleanup completed

## Test Results

Added tests for:

- region creation
- town grouping
- transport validation
- landmark validation
- cleanup
- deterministic output

Session 130 test result:

- `6/6` passing

Compatibility regression run:

- `tests/asset-factory-atlas-controlled-region-test.test.mjs`
- `tests/asset-factory-atlas-controlled-town-test.test.mjs`
- `tests/asset-factory-atlas-renderer-connection-test.test.mjs`

Regression result:

- `16/16` passing

## Validation Results

The controlled regional proof confirms:

- multiple connected towns can remain organized inside one synthetic Atlas regional scene
- regional roads, town roads, transport links, landmarks, civic anchors, and environmental areas remain stable
- asset references remain valid
- cleanup completes successfully
- source state remains unchanged

## Readiness

The controlled renderer proof now supports a small synthetic region rather than only a town-scale composition.

This is a strong preparation point for future larger Atlas testing while still staying outside production renderer runtime and real map attachment.
