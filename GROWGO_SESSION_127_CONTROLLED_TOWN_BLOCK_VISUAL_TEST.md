# GROWGO SESSION 127 — CONTROLLED TOWN BLOCK VISUAL TEST

## Summary

Session 127 extends the controlled visual proof from a street slice into a small synthetic town block using existing Atlas scene systems.

This remains a controlled synthetic test.

It uses explicit authorization, remains isolated, preserves Atlas authority, and stays reversible.

No production renderer was activated.
No real map was connected.
No gameplay systems were modified.
No new assets were created.

## Target

Created:

`CONTROLLED_TOWN_BLOCK_VISUAL_TEST_001`

Scene contents:

- multiple roads
- intersections
- residential buildings
- commercial buildings
- park/green space
- nature objects
- street details

## Files Created

- `asset-factory/atlas-controlled-town-block-test.mjs`
- `tests/asset-factory-atlas-controlled-town-block-test.test.mjs`
- `GROWGO_SESSION_127_CONTROLLED_TOWN_BLOCK_VISUAL_TEST.md`

## Test Design

Created:

`asset-factory/atlas-controlled-town-block-test.mjs`

Purpose:

Verify a larger Atlas composition can remain deterministic and organized while staying inside the controlled synthetic proof path.

The town-block proof consumes Atlas command flow through the passive renderer connection layer and validates a coordinated town-block subset.

The scene remains:

- isolated
- reversible
- synthetic-only
- non-production

## Requirements Verified

The controlled town-block proof verifies:

- block grouping
- road relationships
- building placement references
- park relationships
- layer ordering
- asset references
- cleanup

The verified synthetic town block includes:

- 4 road-layer transport and intersection objects
- 5 object-layer buildings
- 1 ground-layer park object
- 2 nature-layer objects
- 1 detail-layer object

## Output

Created:

`CONTROLLED_TOWN_BLOCK_VISUAL_TEST_RESULT_001`

Includes:

- object count
- scene categories
- layer summary
- asset summary
- deterministic fingerprint
- cleanup status

Result content also records:

- tested object identities
- object categories
- asset references
- render layers
- preserved layer ordering
- transform signatures
- source scene identity

## Validation

Created:

`CONTROLLED_TOWN_BLOCK_VISUAL_TEST_VALIDATION_001`

Checks:

- all objects accounted for
- no source mutation
- deterministic result
- relationships preserved
- commands valid

Validation also confirms:

- authorization passed
- block grouping valid
- road relationships valid
- building placement references valid
- park relationships valid
- layer ordering valid
- asset references valid
- cleanup completed

## Test Results

Added tests for:

- town block creation
- category validation
- relationship validation
- cleanup
- deterministic output

Session 127 test result:

- `5/5` passing

Compatibility regression run:

- `tests/asset-factory-atlas-controlled-town-block-test.test.mjs`
- `tests/asset-factory-atlas-controlled-street-scene-test.test.mjs`
- `tests/asset-factory-atlas-renderer-connection-test.test.mjs`

Regression result:

- `14/14` passing

## Validation Results

The controlled town-block proof confirms:

- a larger Atlas composition can remain organized and deterministic
- road, sidewalk, intersection, building, park, nature, and detail objects remain grouped correctly
- layer ordering remains stable
- placement references remain preserved
- cleanup completes successfully
- source state remains unchanged

## Readiness

The controlled renderer proof now supports a compact synthetic town block rather than only a street slice.

This is a strong preparation point for future real-world scene testing while still staying outside production renderer runtime and real map attachment.
